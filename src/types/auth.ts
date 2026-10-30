/**
 * ProcesStudio - Módulo de Autenticación, Gobernanza y Control de Acceso (RBAC)
 * Alineado a ISO 9001:2015 (Control de Cambios y Trazabilidad) e ISO/IEC 27001 (Control de Accesos).
 */

export type UserRole = 'ADMIN' | 'USER';
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'BLOCKED';
export type ResetRequestStatus = 'NONE' | 'REQUESTED' | 'CODE_ISSUED';
export type CanvasPermission = 'READ_ONLY' | 'COMMENTS' | 'EDITOR';

export type SystemModuleKey =
  | 'DASHBOARD'
  | 'CANVAS'
  | 'VIEW_REPORT'
  | 'VIEW_SIPOC'
  | 'VIEW_RACI'
  | 'VIEW_FLOWCHART'
  | 'TOOLS_MENU'
  | 'EXPORT_CENTER'
  | 'CREATE_PROJECTS';

export const ALL_SYSTEM_MODULES: SystemModuleKey[] = [
  'DASHBOARD',
  'CANVAS',
  'VIEW_REPORT',
  'VIEW_SIPOC',
  'VIEW_RACI',
  'VIEW_FLOWCHART',
  'TOOLS_MENU',
  'EXPORT_CENTER',
  'CREATE_PROJECTS'
];

export const SYSTEM_MODULE_LABELS: {
  key: SystemModuleKey;
  label: string;
  group: 'MAIN' | 'VIEWS' | 'EXTRAS';
  description: string;
}[] = [
  {
    key: 'DASHBOARD',
    label: 'Proyectos',
    group: 'MAIN',
    description: 'Acceso al panel general de proyectos y listado documental'
  },
  {
    key: 'CANVAS',
    label: 'Lienzo',
    group: 'MAIN',
    description: 'Acceso al espacio de graficación visual e inspección de nodos'
  },
  {
    key: 'VIEW_REPORT',
    label: 'Manual PDF',
    group: 'VIEWS',
    description: 'Vista y descarga del Manual de Procedimientos estandarizado en PDF'
  },
  {
    key: 'VIEW_SIPOC',
    label: 'Matriz SIPOC',
    group: 'VIEWS',
    description: 'Proveedores, Entradas, Proceso, Salidas y Clientes'
  },
  {
    key: 'VIEW_RACI',
    label: 'Matriz RACI',
    group: 'VIEWS',
    description: 'Matriz de roles y asignación de responsabilidades'
  },
  {
    key: 'VIEW_FLOWCHART',
    label: 'Flujograma Secuencial',
    group: 'VIEWS',
    description: 'Vista ejecutiva horizontal paso a paso'
  },
  {
    key: 'TOOLS_MENU',
    label: 'Menú de Herramientas',
    group: 'EXTRAS',
    description: 'Texto a BPMN/Plantillas, Simulador, Auditor, Prezi y Tutorial'
  },
  {
    key: 'EXPORT_CENTER',
    label: 'Centro de Exportación',
    group: 'EXTRAS',
    description: 'Botón de descargas múltiples (PDF, PNG, SVG, XML, Word)'
  },
  {
    key: 'CREATE_PROJECTS',
    label: 'Crear Nuevos Procesos',
    group: 'EXTRAS',
    description: 'Habilita el botón "+ Nuevo Proceso" para iniciar proyectos propios'
  }
];

export const MODULE_PRESET_PROFILES: {
  id: string;
  name: string;
  description: string;
  modules: SystemModuleKey[];
}[] = [
  {
    id: 'FULL_ANALYST',
    name: 'Acceso Completo (Analista / Editor)',
    description: 'Todos los módulos, lienzo, vistas y herramientas habilitados',
    modules: [...ALL_SYSTEM_MODULES]
  },
  {
    id: 'AUDITOR_READER',
    name: 'Lector Documental / Auditor',
    description: 'Proyectos y todas las Vistas & Manual PDF (sin Lienzo ni creación)',
    modules: ['DASHBOARD', 'VIEW_REPORT', 'VIEW_SIPOC', 'VIEW_RACI', 'VIEW_FLOWCHART', 'EXPORT_CENTER']
  },
  {
    id: 'VISUAL_OPERATOR',
    name: 'Operador de Lienzo',
    description: 'Proyectos, Lienzo, Flujograma Secuencial y Herramientas',
    modules: ['DASHBOARD', 'CANVAS', 'VIEW_FLOWCHART', 'TOOLS_MENU']
  },
  {
    id: 'MANUAL_ONLY',
    name: 'Solo Manual PDF y Proyectos',
    description: 'Exclusivamente consulta de Proyectos y descarga de Manual PDF',
    modules: ['DASHBOARD', 'VIEW_REPORT']
  }
];

export interface AppUser {
  id: string;
  email: string;
  passwordHash?: string | null;
  fullName: string;
  organizationUnit: string;
  role: UserRole;
  status: UserStatus;
  allowedModules?: SystemModuleKey[];
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

/**
 * Evalúa si un usuario tiene permiso para visualizar/acceder a un módulo del sistema (PST-090).
 * Los Administradores tienen acceso total siempre. Si un usuario existente no tiene allowedModules definido,
 * por retrocompatibilidad posee todos los módulos hasta que el Admin los restrinja.
 */
export function hasUserModuleAccess(user: AppUser | null | undefined, moduleKey: SystemModuleKey): boolean {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  if (!user.allowedModules || !Array.isArray(user.allowedModules)) {
    return true;
  }
  return user.allowedModules.includes(moduleKey);
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
  | 'USER_DELETED_BY_ADMIN'
  | 'USER_STATUS_CHANGED'
  | 'PROJECT_METADATA_UPDATED'
  | 'PROJECT_STATUS_CHANGED'
  | 'CATALOG_ITEM_CREATED'
  | 'CATALOG_ITEM_UPDATED'
  | 'CATALOG_ITEM_DELETED'
  | 'PROJECT_RESTORED_FROM_TRASH';

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
  allowedModules?: SystemModuleKey[];
  passwordMode: 'GENERATE_CODE' | 'MANUAL_PASSWORD';
  manualPassword?: string;
}

export interface UpdateUserPayload {
  fullName: string;
  organizationUnit: string;
  role: UserRole;
  status: UserStatus;
  allowedModules?: SystemModuleKey[];
  mustChangePassword?: boolean;
  newPassword?: string;
}
