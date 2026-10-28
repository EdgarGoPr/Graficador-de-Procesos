-- ============================================================================
-- PROCESSTUDIO - MÓDULO DE AUTENTICACIÓN, GOBERNANZA, 2FA Y AUDITORÍA (NEON TECH)
-- ============================================================================

-- Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabla de Usuarios del Sistema
CREATE TABLE IF NOT EXISTS app_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NULL,             -- Nulo si el usuario solo usa Google OAuth
    full_name VARCHAR(150) NOT NULL,
    organization_unit VARCHAR(160) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER' CHECK (role IN ('ADMIN', 'USER')),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED')),
    google_id VARCHAR(100) NULL UNIQUE,
    avatar_url VARCHAR(500) NULL,
    
    -- Gobernanza de Reseteo de Contraseñas (Exclusivo Administrador)
    reset_request_status VARCHAR(20) NOT NULL DEFAULT 'NONE' CHECK (reset_request_status IN ('NONE', 'REQUESTED', 'CODE_ISSUED')),
    reset_requested_at TIMESTAMPTZ NULL,
    reset_code VARCHAR(6) NULL,                   -- Código temporal de 6 dígitos generado por el Admin
    reset_code_expires_at TIMESTAMPTZ NULL,       -- Expiración del código
    must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Segundo Factor de Autenticación (2FA / TOTP)
    totp_secret VARCHAR(64) NULL,                 -- Clave secreta Base32 para TOTP (Google/Microsoft Auth)
    is_totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Solicitudes de Habilitación de Nuevas Cuentas (Sin auto-registro directo)
CREATE TABLE IF NOT EXISTS user_access_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(150) NOT NULL,
    organization_unit VARCHAR(160) NOT NULL,
    justification TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by UUID REFERENCES app_users(id),
    reviewed_at TIMESTAMPTZ NULL,
    admin_notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Asignación Granular de Permisos por Lienzo (Proyecto)
CREATE TABLE IF NOT EXISTS project_user_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    project_file_name VARCHAR(120) NOT NULL,
    permission_level VARCHAR(20) NOT NULL CHECK (permission_level IN ('READ_ONLY', 'COMMENTS', 'EDITOR')),
    assigned_by UUID REFERENCES app_users(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, project_file_name)
);

-- 4. Candados Temporales de Concurrencia Suave para Lienzos (Soft-Locking)
CREATE TABLE IF NOT EXISTS canvas_active_locks (
    project_file_name VARCHAR(120) PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    user_name VARCHAR(150) NOT NULL,
    locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL
);

-- 5. Registro Centralizado e Inmutable de Logs de Auditoría
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NULL REFERENCES app_users(id),
    user_email VARCHAR(255) NOT NULL,
    user_role VARCHAR(20) NOT NULL,
    action_type VARCHAR(60) NOT NULL,
    target_resource VARCHAR(200) NULL,
    details JSONB NOT NULL DEFAULT '{}',
    ip_client VARCHAR(45) NULL
);

-- Índices de Rendimiento para Consultas de Auditoría y Filtros del Dashboard
CREATE INDEX IF NOT EXISTS idx_users_email ON app_users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON app_users(role);
CREATE INDEX IF NOT EXISTS idx_user_perms_user_id ON project_user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_perms_project ON project_user_permissions(project_file_name);
CREATE INDEX IF NOT EXISTS idx_locks_expires_at ON canvas_active_locks(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action_type);

-- 6. Semilla Inicial: Administrador Principal (Edgar González de Prada)
INSERT INTO app_users (
    id, email, full_name, organization_unit, role, status, is_totp_enabled
) VALUES (
    'admin-egdeprada-uuid',
    'egdeprada@gmail.com',
    'Edgar González de Prada',
    'Dirección General de Calidad y Procesos',
    'ADMIN',
    'ACTIVE',
    FALSE
) ON CONFLICT (email) DO UPDATE SET
    role = 'ADMIN',
    status = 'ACTIVE';

