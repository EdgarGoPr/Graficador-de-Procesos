-- ============================================================================
-- ProcesStudio · Migración 001 · Consolidación de esquema (Fase 1 – Seguridad)
-- Ejecutar con el rol dueño (neondb_owner). Idempotente: se puede correr más de una vez.
-- ============================================================================
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Tablas que hasta ahora creaba el navegador en tiempo de ejecución
CREATE TABLE IF NOT EXISTS user_presence (
  user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
  last_action_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  active_project_file_name VARCHAR(255) NULL,
  active_project_title VARCHAR(255) NULL,
  is_logged_in BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS app_master_catalogs (
  catalog_key VARCHAR(60) PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Usuarios: bloqueo por intentos fallidos y códigos de reseteo hasheados
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS allowed_modules JSONB NULL;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ NULL;
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS reset_code_hash VARCHAR(128) NULL;

-- Los códigos vigentes se conservan, pero hasheados (SHA-256). El texto plano se elimina.
UPDATE app_users
   SET reset_code_hash = encode(digest(reset_code, 'sha256'), 'hex')
 WHERE reset_code IS NOT NULL AND reset_code_hash IS NULL;
UPDATE app_users SET reset_code = NULL WHERE reset_code IS NOT NULL;

-- 3. Propietario explícito de cada proyecto (antes se deducía del JSON o del nombre del autor)
ALTER TABLE process_projects ADD COLUMN IF NOT EXISTS owner_user_id UUID NULL;

UPDATE process_projects p
   SET owner_user_id = u.id
  FROM app_users u
 WHERE p.owner_user_id IS NULL
   AND u.id::text = p.graph_data -> 'documentControl' ->> 'createdByUserId';

UPDATE process_projects p
   SET owner_user_id = u.id
  FROM app_users u
 WHERE p.owner_user_id IS NULL
   AND lower(u.email) = lower(p.graph_data -> 'documentControl' ->> 'createdByEmail');

CREATE INDEX IF NOT EXISTS idx_projects_owner ON process_projects(owner_user_id);

-- 4. Papelera en tabla propia (antes vivía dentro del catálogo, legible por cualquier usuario)
CREATE TABLE IF NOT EXISTS process_project_trash (
  file_name VARCHAR(120) PRIMARY KEY,
  owner_user_id UUID NULL,
  document_code VARCHAR(50) NOT NULL DEFAULT '',
  document_title VARCHAR(200) NOT NULL DEFAULT '',
  version VARCHAR(25) NOT NULL DEFAULT '1.0',
  organization_unit VARCHAR(160) NOT NULL DEFAULT '',
  author_name VARCHAR(150) NOT NULL DEFAULT '',
  deleted_by_email VARCHAR(255) NOT NULL DEFAULT '',
  deleted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  project_data JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_trash_owner ON process_project_trash(owner_user_id);

INSERT INTO process_project_trash (
  file_name, owner_user_id, document_code, document_title, version, organization_unit, author_name,
  deleted_by_email, deleted_at, project_data
)
SELECT e ->> 'fileName',
       (SELECT u.id FROM app_users u
         WHERE u.id::text = e -> 'projectData' -> 'documentControl' ->> 'createdByUserId'
            OR lower(u.email) = lower(e -> 'projectData' -> 'documentControl' ->> 'createdByEmail')
         LIMIT 1),
       left(COALESCE(e ->> 'documentCode', ''), 50),
       left(COALESCE(e ->> 'documentTitle', ''), 200),
       left(COALESCE(e ->> 'version', '1.0'), 25),
       left(COALESCE(e ->> 'organizationUnit', ''), 160),
       left(COALESCE(e ->> 'authorName', ''), 150),
       left(COALESCE(e ->> 'deletedByEmail', ''), 255),
       COALESCE((e ->> 'deletedAt')::timestamptz, NOW()),
       e -> 'projectData'
  FROM app_master_catalogs c,
       jsonb_array_elements(COALESCE(c.payload -> 'deletedProjects', '[]'::jsonb)) e
 WHERE c.catalog_key = 'GLOBAL_CATALOGS_V2'
   AND e ->> 'fileName' IS NOT NULL
   AND e -> 'projectData' IS NOT NULL
ON CONFLICT (file_name) DO NOTHING;

UPDATE app_master_catalogs
   SET payload = payload - 'deletedProjects'
 WHERE catalog_key = 'GLOBAL_CATALOGS_V2' AND payload ? 'deletedProjects';

-- 5. audit_logs pasa a ser append-only (migración 004). Una FK hacia app_users impediría
--    borrar usuarios con historial, así que se elimina: el log conserva el correo del usuario.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
      FROM pg_constraint con
      JOIN pg_class rel ON rel.oid = con.conrelid
     WHERE rel.relname = 'audit_logs' AND con.contype = 'f'
  LOOP
    EXECUTE format('ALTER TABLE audit_logs DROP CONSTRAINT %I', r.conname);
  END LOOP;
END $$;

COMMIT;
