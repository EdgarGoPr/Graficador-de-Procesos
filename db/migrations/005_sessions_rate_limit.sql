-- ============================================================================
-- ProcesStudio · Migración 005 · Revocación de sesiones, límite por IP y TOTP cifrado
-- Requiere 001-004. Idempotente.
-- ============================================================================
BEGIN;

-- 1. Versión de sesión: al cambiar la contraseña se incrementa y las cookies anteriores dejan de valer.
ALTER TABLE app_users ADD COLUMN IF NOT EXISTS session_version INTEGER NOT NULL DEFAULT 0;

-- 2. El secreto TOTP cifrado (AES-256-GCM) no entra en 64 caracteres.
ALTER TABLE app_users ALTER COLUMN totp_secret TYPE VARCHAR(255);

-- 3. Contadores de intentos por IP (ventana fija).
CREATE TABLE IF NOT EXISTS auth_rate_limits (
  bucket_key VARCHAR(200) PRIMARY KEY,
  attempts INTEGER NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON auth_rate_limits(window_started_at);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'processtudio_app') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON auth_rate_limits TO processtudio_app;
  END IF;
END $$;

COMMIT;
