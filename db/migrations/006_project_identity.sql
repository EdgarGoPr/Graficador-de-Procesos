-- ============================================================================
-- ProcesStudio · Migración 006 · Identificador estable de proyecto (Fase 2 – Integridad)
-- Requiere 001-005. Idempotente.
--
-- GARANTÍA: no borra proyectos, versiones, papelera ni permisos. Al final compara los
-- conteos con los del inicio y, si algo cambió, cancela toda la migración (ROLLBACK).
-- ============================================================================
BEGIN;

-- 0. Conteos de control ------------------------------------------------------
DROP TABLE IF EXISTS _m006_before;
CREATE TEMP TABLE _m006_before AS
SELECT (SELECT count(*) FROM process_projects)         AS versions,
       (SELECT count(*) FROM process_project_trash)    AS trash,
       (SELECT count(*) FROM project_user_permissions) AS perms;

-- 1. El trigger que pisaba updated_at en cualquier UPDATE se retira: el backend fija la fecha
--    al guardar. Así las actualizaciones de mantenimiento no alteran la "última modificación".
DROP TRIGGER IF EXISTS trg_process_projects_updated_at ON process_projects;

-- 1b. Restaura la fecha real de última modificación desde los datos del proyecto
--     (las migraciones anteriores la habían reemplazado por la fecha de migración).
UPDATE process_projects
   SET updated_at = (graph_data -> 'documentControl' ->> 'updatedAt')::timestamptz
 WHERE (graph_data -> 'documentControl' ->> 'updatedAt') ~ '^\d{4}-\d{2}-\d{2}T'
   AND updated_at IS DISTINCT FROM (graph_data -> 'documentControl' ->> 'updatedAt')::timestamptz;

-- 2. Tablas nuevas ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS projects (
  project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_code VARCHAR(50) NOT NULL,
  owner_user_id UUID NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE process_projects      ADD COLUMN IF NOT EXISTS project_id UUID NULL;
ALTER TABLE process_project_trash ADD COLUMN IF NOT EXISTS project_id UUID NULL;

-- Permisos por proyecto (valen para todas sus versiones). La tabla anterior se conserva intacta.
CREATE TABLE IF NOT EXISTS project_members (
  project_id UUID NOT NULL REFERENCES projects(project_id),
  user_id UUID NOT NULL,
  permission_level VARCHAR(20) NOT NULL CHECK (permission_level IN ('READ_ONLY', 'COMMENTS', 'EDITOR')),
  assigned_by UUID NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (project_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_project_members_user ON project_members(user_id);

-- 3. Agrupar las versiones existentes en proyectos ---------------------------
--    Clave: código documental exacto (sin quitar "-CPY") + propietario. Si el código es
--    vacío o genérico, se usa el título normalizado.
DROP TABLE IF EXISTS _m006_groups;
CREATE TEMP TABLE _m006_groups AS
WITH keyed AS (
  SELECT p.file_name, p.document_code, p.owner_user_id, p.updated_at, p.created_at,
         CASE
           WHEN upper(trim(coalesce(p.document_code, ''))) IN ('', 'PRC-000', 'PRC-0000', 'PRC-PROCESO')
             THEN 'T:' || lower(regexp_replace(coalesce(p.document_title, ''), '[^A-Za-z0-9]+', '-', 'g'))
           ELSE 'C:' || upper(trim(p.document_code))
         END || '|' || coalesce(p.owner_user_id::text, '-') AS group_key
    FROM process_projects p
   WHERE p.project_id IS NULL
)
SELECT group_key,
       gen_random_uuid() AS project_id,
       (array_agg(document_code ORDER BY updated_at DESC))[1] AS document_code,
       (array_agg(owner_user_id ORDER BY updated_at DESC))[1] AS owner_user_id,
       min(created_at) AS created_at
  FROM keyed
 GROUP BY group_key;

INSERT INTO projects (project_id, document_code, owner_user_id, created_at)
SELECT project_id, document_code, owner_user_id, created_at FROM _m006_groups;

UPDATE process_projects p
   SET project_id = g.project_id
  FROM _m006_groups g
 WHERE p.project_id IS NULL
   AND g.group_key =
       CASE
         WHEN upper(trim(coalesce(p.document_code, ''))) IN ('', 'PRC-000', 'PRC-0000', 'PRC-PROCESO')
           THEN 'T:' || lower(regexp_replace(coalesce(p.document_title, ''), '[^A-Za-z0-9]+', '-', 'g'))
         ELSE 'C:' || upper(trim(p.document_code))
       END || '|' || coalesce(p.owner_user_id::text, '-');

-- Versiones en la papelera: se asocian al proyecto con el mismo código, si existe.
UPDATE process_project_trash t
   SET project_id = pr.project_id
  FROM projects pr
 WHERE t.project_id IS NULL
   AND upper(trim(t.document_code)) = upper(trim(pr.document_code));

-- 4. Permisos por versión → permisos por proyecto (se conserva el nivel más alto) ----
INSERT INTO project_members (project_id, user_id, permission_level, assigned_by, assigned_at)
SELECT project_id, user_id,
       CASE max(CASE permission_level WHEN 'EDITOR' THEN 3 WHEN 'COMMENTS' THEN 2 ELSE 1 END)
         WHEN 3 THEN 'EDITOR' WHEN 2 THEN 'COMMENTS' ELSE 'READ_ONLY' END,
       (array_agg(assigned_by ORDER BY assigned_at DESC))[1],
       max(assigned_at)
  FROM (
    SELECT coalesce(p.project_id, t.project_id) AS project_id, perm.user_id, perm.permission_level,
           perm.assigned_by, perm.assigned_at
      FROM project_user_permissions perm
      LEFT JOIN process_projects p ON p.file_name = perm.project_file_name
      LEFT JOIN process_project_trash t ON t.file_name = perm.project_file_name
  ) s
 WHERE project_id IS NOT NULL
 GROUP BY project_id, user_id
ON CONFLICT (project_id, user_id) DO NOTHING;

-- 5. Restricciones ----------------------------------------------------------------
ALTER TABLE process_projects ALTER COLUMN project_id SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_process_projects_project') THEN
    ALTER TABLE process_projects
      ADD CONSTRAINT fk_process_projects_project FOREIGN KEY (project_id) REFERENCES projects(project_id);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_process_projects_project ON process_projects(project_id);

-- Código documental único entre proyectos distintos (sin distinguir mayúsculas).
CREATE UNIQUE INDEX IF NOT EXISTS ux_projects_document_code ON projects (upper(trim(document_code)));

-- 6. Permisos del rol de aplicación ----------------------------------------------
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'processtudio_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON projects, project_members TO processtudio_app;
  END IF;
END $$;

-- 7. Verificación final: si algo no cuadra, se cancela todo ----------------------
DO $$
DECLARE b RECORD;
BEGIN
  SELECT * INTO b FROM _m006_before;
  IF (SELECT count(*) FROM process_projects) <> b.versions THEN
    RAISE EXCEPTION 'Migración 006 cancelada: cambió la cantidad de versiones de proyectos.';
  END IF;
  IF (SELECT count(*) FROM process_project_trash) <> b.trash THEN
    RAISE EXCEPTION 'Migración 006 cancelada: cambió la cantidad de proyectos en la papelera.';
  END IF;
  IF (SELECT count(*) FROM project_user_permissions) <> b.perms THEN
    RAISE EXCEPTION 'Migración 006 cancelada: cambió la cantidad de permisos.';
  END IF;
  IF EXISTS (SELECT 1 FROM process_projects WHERE project_id IS NULL) THEN
    RAISE EXCEPTION 'Migración 006 cancelada: hay versiones sin proyecto asignado.';
  END IF;
END $$;

DROP TABLE IF EXISTS _m006_groups;
DROP TABLE IF EXISTS _m006_before;

COMMIT;
