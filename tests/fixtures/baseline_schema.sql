-- Esquema de producción previo a la Fase 1 (reconstruido desde scripts/neon_schema.sql,
-- scripts/auth_schema.sql y las tablas que creaba el cliente). Solo para tests.
-- Se omite search_vector (columna generada de búsqueda) porque no afecta la autorización.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE process_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name VARCHAR(120) NOT NULL UNIQUE,
  document_code VARCHAR(50) NOT NULL,
  document_title VARCHAR(200) NOT NULL,
  version VARCHAR(25) NOT NULL DEFAULT '1.0',
  status VARCHAR(25) NOT NULL DEFAULT 'DRAFT',
  author_name VARCHAR(150) NOT NULL,
  organization_unit VARCHAR(160) NOT NULL,
  process_objective TEXT,
  node_count SMALLINT NOT NULL DEFAULT 0,
  total_lead_time_minutes INTEGER NOT NULL DEFAULT 0,
  risk_count SMALLINT NOT NULL DEFAULT 0,
  checkpoint_count SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  graph_data JSONB NOT NULL
);

CREATE TABLE app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NULL,
  full_name VARCHAR(150) NOT NULL,
  organization_unit VARCHAR(160) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'USER',
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  google_id VARCHAR(100) NULL UNIQUE,
  avatar_url VARCHAR(500) NULL,
  reset_request_status VARCHAR(20) NOT NULL DEFAULT 'NONE',
  reset_requested_at TIMESTAMPTZ NULL,
  reset_code VARCHAR(6) NULL,
  reset_code_expires_at TIMESTAMPTZ NULL,
  must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
  totp_secret VARCHAR(64) NULL,
  is_totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  allowed_modules JSONB NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  organization_unit VARCHAR(160) NOT NULL,
  justification TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  reviewed_by UUID NULL REFERENCES app_users(id),
  reviewed_at TIMESTAMPTZ NULL,
  admin_notes TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE project_user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  project_file_name VARCHAR(120) NOT NULL,
  permission_level VARCHAR(20) NOT NULL,
  assigned_by UUID NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, project_file_name)
);

CREATE TABLE canvas_active_locks (
  project_file_name VARCHAR(120) PRIMARY KEY,
  user_id UUID NOT NULL,
  user_name VARCHAR(150) NOT NULL,
  locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID NULL REFERENCES app_users(id),
  user_email VARCHAR(255) NOT NULL,
  user_role VARCHAR(20) NOT NULL,
  action_type VARCHAR(60) NOT NULL,
  target_resource VARCHAR(200) NULL,
  details JSONB NOT NULL DEFAULT '{}',
  ip_client VARCHAR(45) NULL
);

CREATE TABLE app_master_catalogs (
  catalog_key VARCHAR(60) PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
