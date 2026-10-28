/**
 * ProcesStudio - Módulo de Autenticación, Gobernanza y Control de Acceso (RBAC)
 * Alineado a ISO 9001:2015 (Control de Cambios y Trazabilidad) e ISO/IEC 27001 (Control de Accesos).
 */

export type UserRole = 'ADMIN' | 'USER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
export type ResetRequestStatus = 'NONE' | 'REQUESTED' | 'CODE_ISSUED';
export type CanvasPermission = 'READ_ONLY' | 'COMMENTS' | 'EDITOR';

export interface AppUser {
  id: string;
  email: string;
  passwordHash?: string | null;
  fullName: string;
  organizationUnit: string;
  role: UserRole;
  status: UserStatus;
  googleId?: string | null;
  avatarUrl?: string | null;
  resetRequestStatus: ResetRequestStatus;
  resetRequestedAt?: string | null;
  resetCode?: string | null;
  resetCodeExpiresAt?: string | null;
  mustChangePassword: boolean;
  totpSecret?: string | null;
  isTotpEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserAccessRequest {
  id: string;
  email: string;
  fullName: string;
  organizationUnit: string;
  justification: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  adminNotes?: string | null;
  createdAt: string;
}

export interface ProjectUserPermission {
  id: string;
  userId: string;
  projectFileName: string;
  permissionLevel: CanvasPermission;
  assignedBy?: string | null;
  assignedAt: string;
}

export interface CanvasActiveLock {
  projectFileName: string;
  userId: string;
  userName: string;
  lockedAt: string;
  expiresAt: string;
}

export type AuditActionType =
  | 'AUTH_LOGIN_SUCCESS'
  | 'AUTH_LOGIN_GOOGLE'
  | 'AUTH_LOGIN_FAILED'
  | 'AUTH_LOGOUT'
  | 'AUTH_RESET_REQUESTED'
  | 'AUTH_RESET_CODE_ISSUED'
  | 'AUTH_PASSWORD_CHANGED'
  | 'AUTH_2FA_VERIFIED'
  | 'ACCESS_REQUEST_SUBMITTED'
  | 'ACCESS_REQUEST_APPROVED'
  | 'ACCESS_REQUEST_REJECTED'
  | 'CANVAS_PERMISSION_ASSIGNED'
  | 'CANVAS_PERMISSION_REMOVED'
  | 'CANVAS_LOCK_ACQUIRED'
  | 'CANVAS_LOCK_RELEASED'
  | 'CANVAS_OPENED'
  | 'CANVAS_COMMENT_ADDED'
  | 'CANVAS_COMMENT_UPDATED'
  | 'CANVAS_PROJECT_SAVED'
  | 'CANVAS_EXPORT_GENERATED'
  | 'USER_CREATED'
  | 'USER_CREATED_BY_ADMIN'
  | 'USER_UPDATED_BY_ADMIN'
  | 'USER_STATUS_CHANGED';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId?: string | null;
  userEmail: string;
  userRole: UserRole;
  actionType: AuditActionType;
  targetResource?: string | null;
  details: Record<string, any>;
  ipClient?: string | null;
}

export interface CreateUserPayload {
  email: string;
  fullName: string;
  organizationUnit: string;
  role: UserRole;
  status: UserStatus;
  passwordMode: 'GENERATE_CODE' | 'MANUAL_PASSWORD';
  manualPassword?: string;
}

export interface UpdateUserPayload {
  fullName: string;
  organizationUnit: string;
  role: UserRole;
  status: UserStatus;
  mustChangePassword?: boolean;
  newPassword?: string;
}
