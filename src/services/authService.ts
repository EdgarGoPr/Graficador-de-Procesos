import {
  ALL_SYSTEM_MODULES,
  AppUser,
  CanvasPermission,
  CreateUserPayload,
  SystemModuleKey,
  UpdateUserPayload,
  UserAccessRequest,
  UserRole,
  UserStatus
} from '../types/auth';
import { api, ApiError, apiErrorMessage } from './apiClient';
import { PermissionService } from './permissionService';
import { setAiProxyAvailable } from './aiRecommendationService';

/**
 * Claves que versiones anteriores guardaban en el navegador con datos sensibles
 * (hashes de contraseña, códigos de reseteo, secretos TOTP, sesión falsa). Se eliminan al iniciar.
 */
const LEGACY_SENSITIVE_KEYS = [
  'procesos_users_fallback',
  'procesos_access_requests_fallback',
  'procesos_auth_user',
  'procesos_auth_token',
  'procesos_permissions_fallback',
  'procesos_audit_logs_fallback',
  'procesos_active_locks_fallback',
  'procesos_local_presence_cache'
];

export function purgeLegacySensitiveStorage(): void {
  for (const key of LEGACY_SENSITIVE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // almacenamiento no disponible
    }
  }
}

interface SessionPayload {
  ok: boolean;
  user?: any;
  permissions?: Array<{ projectFileName: string; permissionLevel: CanvasPermission }>;
  features?: { aiProxy?: boolean };
  requiresTotp?: boolean;
  mustChangePassword?: boolean;
  notRegistered?: boolean;
  profile?: { email: string; fullName: string };
  error?: string;
}

/** Normaliza un usuario recibido del servidor (completo o del directorio reducido). */
export function normalizeUser(raw: any): AppUser {
  return {
    id: raw.id,
    email: raw.email,
    fullName: raw.fullName,
    organizationUnit: raw.organizationUnit || '',
    role: raw.role as UserRole,
    status: raw.status as UserStatus,
    allowedModules: Array.isArray(raw.allowedModules) ? raw.allowedModules : [...ALL_SYSTEM_MODULES],
    avatarUrl: raw.avatarUrl ?? null,
    hasGoogleLink: !!raw.hasGoogleLink,
    hasPassword: !!raw.hasPassword,
    resetRequestStatus: raw.resetRequestStatus || 'NONE',
    resetRequestedAt: raw.resetRequestedAt ?? null,
    resetCodeExpiresAt: raw.resetCodeExpiresAt ?? null,
    mustChangePassword: !!raw.mustChangePassword,
    isTotpEnabled: !!raw.isTotpEnabled,
    createdAt: raw.createdAt || '',
    updatedAt: raw.updatedAt || ''
  };
}

function applySession(payload: SessionPayload): AppUser | undefined {
  if (!payload.user) return undefined;
  const user = normalizeUser(payload.user);
  PermissionService.setOwnPermissions(user.id, payload.permissions || []);
  setAiProxyAvailable(!!payload.features?.aiProxy);
  return user;
}

type LoginResult = {
  ok: boolean;
  user?: AppUser;
  requiresTotp?: boolean;
  mustChangePassword?: boolean;
  notRegistered?: boolean;
  profile?: { email: string; fullName: string };
  error?: string;
};

async function loginCall(path: string, body: unknown): Promise<LoginResult> {
  try {
    const res = await api<SessionPayload>('POST', path, { body, skipSessionHandler: true });
    return {
      ok: true,
      user: applySession(res),
      requiresTotp: res.requiresTotp,
      mustChangePassword: res.mustChangePassword
    };
  } catch (err) {
    const data = err instanceof ApiError ? err.data : null;
    return {
      ok: false,
      notRegistered: !!data?.notRegistered,
      profile: data?.profile,
      error: apiErrorMessage(err, 'Error al iniciar sesión.')
    };
  }
}

async function call<T extends object = {}>(method: string, path: string, body?: unknown): Promise<{ ok: boolean; error?: string } & Partial<T>> {
  try {
    const res = await api<T>(method, path, { body });
    return { ok: true, ...res };
  } catch (err) {
    return { ok: false, error: apiErrorMessage(err, 'Error al comunicarse con el servidor.') } as any;
  }
}

export class AuthService {
  /** Limpia restos de versiones anteriores que guardaban secretos en el navegador. */
  public static async initialize(): Promise<void> {
    purgeLegacySensitiveStorage();
  }

  /** Recupera la sesión vigente desde la cookie httpOnly (o null si no hay sesión). */
  public static async fetchSession(): Promise<AppUser | null> {
    try {
      const res = await api<SessionPayload>('GET', '/auth/me', { skipSessionHandler: true });
      return applySession(res) || null;
    } catch {
      return null;
    }
  }

  public static loginWithEmail(email: string, passOrCode: string): Promise<LoginResult> {
    return loginCall('/auth/login', { email: email.trim().toLowerCase(), password: passOrCode.trim() });
  }

  /** Segundo factor: el servidor identifica al usuario por la cookie del primer factor. */
  public static verifyAdminTotp(totpCode: string): Promise<LoginResult> {
    return loginCall('/auth/totp/verify', { code: totpCode.trim() });
  }

  public static loginWithGoogle(accessToken: string): Promise<LoginResult> {
    return loginCall('/auth/google', { accessToken });
  }

  public static changePasswordWithCode(_email: string, code: string, newPass: string): Promise<LoginResult> {
    if (newPass.length < 8) {
      return Promise.resolve({ ok: false, error: 'La nueva contraseña debe tener al menos 8 caracteres.' });
    }
    return loginCall('/auth/change-password', { code: code.trim(), newPassword: newPass });
  }

  /** Desbloqueo por inactividad: la contraseña se verifica en el servidor. */
  public static async reauthenticate(password: string): Promise<boolean> {
    try {
      await api('POST', '/auth/reauth', { body: { password }, skipSessionHandler: true });
      return true;
    } catch {
      return false;
    }
  }

  public static async logout(): Promise<void> {
    try {
      await api('POST', '/auth/logout', { body: {}, skipSessionHandler: true });
    } catch {
      // la cookie expira sola
    }
    PermissionService.clearCache();
  }

  public static async requestPasswordReset(email: string): Promise<{ ok: boolean; message: string }> {
    const res = await call<{ message: string }>('POST', '/auth/reset-request', { email: email.trim().toLowerCase() });
    return {
      ok: res.ok,
      message:
        res.message ||
        res.error ||
        'Si el correo está registrado, la solicitud fue enviada al Administrador para su revisión.'
    };
  }

  public static async submitAccessRequest(data: {
    email: string;
    fullName: string;
    organizationUnit: string;
    justification: string;
  }): Promise<{ ok: boolean; error?: string }> {
    return call('POST', '/access-requests', data);
  }

  // --------------------------------------------------------------------------
  // Administración (el servidor valida el rol en cada llamada)
  // --------------------------------------------------------------------------

  public static async generateResetCodeByAdmin(
    _adminUser: AppUser,
    targetUserId: string
  ): Promise<{ ok: boolean; code?: string; error?: string }> {
    return call<{ code: string }>('POST', `/users/${encodeURIComponent(targetUserId)}/reset-code`, {});
  }

  public static async reviewAccessRequest(
    _adminUser: AppUser,
    requestId: string,
    approved: boolean,
    assignedRole: UserRole = 'USER',
    adminNotes?: string
  ): Promise<{ ok: boolean; generatedInitialCode?: string; error?: string }> {
    return call<{ generatedInitialCode?: string }>('POST', `/access-requests/${encodeURIComponent(requestId)}/review`, {
      approved,
      role: assignedRole,
      adminNotes: adminNotes || null
    });
  }

  public static async updateUserStatus(
    _adminUser: AppUser,
    targetUserId: string,
    newStatus: UserStatus
  ): Promise<{ ok: boolean; error?: string }> {
    return call('PATCH', `/users/${encodeURIComponent(targetUserId)}/status`, { status: newStatus });
  }

  public static async createUserByAdmin(
    _adminUser: AppUser,
    payload: CreateUserPayload
  ): Promise<{ ok: boolean; user?: AppUser; generatedInitialCode?: string; error?: string }> {
    const res = await call<{ user: any; generatedInitialCode?: string }>('POST', '/users', payload);
    return res.ok ? { ok: true, user: normalizeUser(res.user), generatedInitialCode: res.generatedInitialCode } : res;
  }

  public static async updateUserByAdmin(
    _adminUser: AppUser,
    targetUserId: string,
    payload: UpdateUserPayload
  ): Promise<{ ok: boolean; user?: AppUser; error?: string }> {
    const res = await call<{ user: any }>('PATCH', `/users/${encodeURIComponent(targetUserId)}`, payload);
    return res.ok ? { ok: true, user: normalizeUser(res.user) } : res;
  }

  public static async updateUserModulesByAdmin(
    _adminUser: AppUser,
    targetUserId: string,
    allowedModules: SystemModuleKey[]
  ): Promise<{ ok: boolean; user?: AppUser; error?: string }> {
    const res = await call<{ user: any }>('PUT', `/users/${encodeURIComponent(targetUserId)}/modules`, { allowedModules });
    return res.ok ? { ok: true, user: normalizeUser(res.user) } : res;
  }

  public static async deleteUserByAdmin(_adminUser: AppUser, targetUserId: string): Promise<{ ok: boolean; error?: string }> {
    return call('DELETE', `/users/${encodeURIComponent(targetUserId)}`);
  }

  public static async setupTotp(_adminUserId: string): Promise<{ secret: string; uri: string }> {
    const res = await api<{ secret: string; uri: string }>('POST', '/auth/totp/setup', { body: {} });
    return { secret: res.secret, uri: res.uri };
  }

  public static async confirmAndEnableTotp(
    _adminUserId: string,
    secret: string,
    verificationCode: string
  ): Promise<{ ok: boolean; error?: string }> {
    return call('POST', '/auth/totp/enable', { secret, code: verificationCode.trim() });
  }

  /** ADMIN recibe el listado completo; el resto, el directorio de usuarios activos. */
  public static async listUsers(): Promise<AppUser[]> {
    try {
      const res = await api<{ users: any[] }>('GET', '/users');
      return (res.users || []).map(normalizeUser);
    } catch (err) {
      console.error('Error al listar usuarios:', err);
      return [];
    }
  }

  public static async listAccessRequests(): Promise<UserAccessRequest[]> {
    try {
      const res = await api<{ requests: UserAccessRequest[] }>('GET', '/access-requests');
      return res.requests || [];
    } catch (err) {
      console.error('Error al listar solicitudes:', err);
      return [];
    }
  }
}
