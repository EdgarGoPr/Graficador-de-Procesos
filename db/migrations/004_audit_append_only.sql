-- ============================================================================
-- ProcesStudio · Migración 004 · audit_logs solo admite inserciones
-- Los triggers rechazan UPDATE, DELETE y TRUNCATE para cualquier rol, incluido el dueño.
-- Idempotente.
-- ============================================================================
BEGIN;

CREATE OR REPLACE FUNCTION audit_logs_block_mutation() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs es de solo inserción: la operación % no está permitida', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_no_update_delete ON audit_logs;
CREATE TRIGGER trg_audit_logs_no_update_delete
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION audit_logs_block_mutation();

DROP TRIGGER IF EXISTS trg_audit_logs_no_truncate ON audit_logs;
CREATE TRIGGER trg_audit_logs_no_truncate
  BEFORE TRUNCATE ON audit_logs
  FOR EACH STATEMENT EXECUTE FUNCTION audit_logs_block_mutation();

REVOKE UPDATE, DELETE, TRUNCATE ON audit_logs FROM PUBLIC;

COMMIT;
