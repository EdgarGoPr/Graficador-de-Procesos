-- ============================================================================
-- ProcesStudio · Migración 003 · Rol de aplicación con permisos mínimos
-- El backend se conecta con processtudio_app, nunca con neondb_owner.
-- La contraseña NO va en este archivo. Después de correrlo, ejecutar a mano:
--   ALTER ROLE processtudio_app WITH LOGIN PASSWORD '<contraseña larga y aleatoria>';
-- Requiere la migración 001. Idempotente.
-- ============================================================================
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'processtudio_app') THEN
    CREATE ROLE processtudio_app NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
  END IF;
END $$;

-- Sin DDL: el rol no puede crear objetos en el esquema.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM processtudio_app;
GRANT USAGE ON SCHEMA public TO processtudio_app;

-- Tablas operativas: lectura y escritura de filas.
GRANT SELECT, INSERT, UPDATE, DELETE ON
  process_projects,
  process_project_trash,
  app_users,
  user_access_requests,
  project_user_permissions,
  user_presence,
  canvas_active_locks,
  app_master_catalogs
TO processtudio_app;

-- Auditoría: solo insertar y leer. Nunca UPDATE, DELETE ni TRUNCATE.
GRANT SELECT, INSERT ON audit_logs TO processtudio_app;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_database WHERE datname = current_database()) THEN
    EXECUTE format('GRANT CONNECT ON DATABASE %I TO processtudio_app', current_database());
  END IF;
END $$;

COMMIT;
