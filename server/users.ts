import type { Db } from './db.js';
import { toIso } from './http.js';

export type UserRole = 'ADMIN' | 'USER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
export type CanvasPermission = 'READ_ONLY' | 'COMMENTS' | 'EDITOR';

export const ROLES = ['ADMIN', 'USER'] as const;
export const STATUSES = ['ACTIVE', 'INACTIVE', 'BLOCKED'] as const;
export const PERMISSION_LEVELS = ['READ_ONLY', 'COMMENTS', 'EDITOR'] as const;

export const ALL_SYSTEM_MODULES = [
  'DASHBOARD',
  'CANVAS',
  'VIEW_REPORT',
  'VIEW_SIPOC',
  'VIEW_RACI',
  'VIEW_FLOWCHART',
  'TOOLS_MENU',
  'EXPORT_CENTER',
  'CREATE_PROJECTS'
] as const;

export interface DbUser {
  id: string;
  email: string;
  password_hash: string | null;
  full_name: string;
  organization_unit: string;
  role: UserRole;
  status: UserStatus;
  google_id: string | null;
  avatar_url: string | null;
  reset_request_status: string | null;
  reset_requested_at: unknown;
  reset_code_hash: string | null;
  reset_code_expires_at: unknown;
  must_change_password: boolean;
  totp_secret: string | null;
  is_totp_enabled: boolean;
  allowed_modules: unknown;
  failed_login_attempts: number | null;
  locked_until: unknown;
  created_at: unknown;
  updated_at: unknown;
}

/** Representación que puede salir del servidor: nunca incluye hashes, códigos ni secretos TOTP. */
export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  organizationUnit: string;
  role: UserRole;
  status: UserStatus;
  allowedModules: string[];
  avatarUrl: string | null;
  hasGoogleLink: boolean;
  hasPassword: boolean;
  resetRequestStatus: string;
  resetRequestedAt: string | null;
  resetCodeExpiresAt: string | null;
  mustChangePassword: boolean;
  isTotpEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export function parseModules(value: unknown): string[] {
  let v = value;
  if (typeof v === 'string') {
    try {
      v = JSON.parse(v);
    } catch {
      v = null;
    }
  }
  return Array.isArray(v) ? v.filter((m): m is string => typeof m === 'string') : [...ALL_SYSTEM_MODULES];
}

export function toPublicUser(row: DbUser): PublicUser {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    organizationUnit: row.organization_unit,
    role: row.role,
    status: row.status,
    allowedModules: parseModules(row.allowed_modules),
    avatarUrl: row.avatar_url,
    hasGoogleLink: !!row.google_id,
    hasPassword: !!row.password_hash,
    resetRequestStatus: row.reset_request_status || 'NONE',
    resetRequestedAt: toIso(row.reset_requested_at),
    resetCodeExpiresAt: toIso(row.reset_code_expires_at),
    mustChangePassword: !!row.must_change_password,
    isTotpEnabled: !!row.is_totp_enabled,
    createdAt: toIso(row.created_at) || new Date(0).toISOString(),
    updatedAt: toIso(row.updated_at) || new Date(0).toISOString()
  };
}

/** Datos mínimos del directorio para usuarios no administradores (asignar participantes). */
export function toDirectoryUser(row: DbUser) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    organizationUnit: row.organization_unit,
    role: row.role,
    status: row.status
  };
}

const USER_COLUMNS = `id, email, password_hash, full_name, organization_unit, role, status, google_id, avatar_url,
  reset_request_status, reset_requested_at, reset_code_hash, reset_code_expires_at, must_change_password,
  totp_secret, is_totp_enabled, allowed_modules, failed_login_attempts, locked_until, created_at, updated_at`;

export async function findUserByEmail(db: Db, email: string): Promise<DbUser | null> {
  const rows = await db.query<DbUser>(`SELECT ${USER_COLUMNS} FROM app_users WHERE lower(email) = lower($1) LIMIT 1`, [email]);
  return rows[0] || null;
}

export async function findUserById(db: Db, id: string): Promise<DbUser | null> {
  const rows = await db.query<DbUser>(`SELECT ${USER_COLUMNS} FROM app_users WHERE id::text = $1 LIMIT 1`, [id]);
  return rows[0] || null;
}

export async function listAllUsers(db: Db): Promise<DbUser[]> {
  return db.query<DbUser>(`SELECT ${USER_COLUMNS} FROM app_users ORDER BY created_at DESC`);
}
