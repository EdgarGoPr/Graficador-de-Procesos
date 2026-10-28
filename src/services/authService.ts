import { AppUser, CreateUserPayload, UpdateUserPayload, UserAccessRequest, UserRole, UserStatus } from '../types/auth';
import { NeonClient } from './neonClient';
import {
  generate6DigitCode,
  generateOtpAuthUri,
  generateTotpSecret,
  hashPassword,
  verifyPassword,
  verifyTotpCode
} from '../utils/cryptoUtils';
import { AuditLoggerService } from './auditLoggerService';

const STORAGE_KEY_SESSION_USER = 'procesos_auth_user';
const STORAGE_KEY_SESSION_TOKEN = 'procesos_auth_token';
const LOCAL_STORAGE_USERS_FALLBACK = 'procesos_users_fallback';
const LOCAL_STORAGE_REQUESTS_FALLBACK = 'procesos_access_requests_fallback';

export class AuthService {
  private static isInitialized = false;

  /**
   * Inicializa la estructura en base de datos e inserta usuario administrador inicial si no existe
   */
  public static async initialize(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    const sql = NeonClient.getSql();
    if (sql) {
      try {
        // Crear extensiones si es necesario
        try { await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`; } catch {}
        try { await sql`CREATE EXTENSION IF NOT EXISTS "pgcrypto";`; } catch {}

        // 1. Tabla de usuarios
        await sql`
          CREATE TABLE IF NOT EXISTS app_users (
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
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `;

        // 2. Solicitudes de acceso
        await sql`
          CREATE TABLE IF NOT EXISTS user_access_requests (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) NOT NULL UNIQUE,
            full_name VARCHAR(150) NOT NULL,
            organization_unit VARCHAR(160) NOT NULL,
            justification TEXT NOT NULL,
            status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
            reviewed_by UUID NULL,
            reviewed_at TIMESTAMPTZ NULL,
            admin_notes TEXT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
          );
        `;

        // 3. Permisos de proyectos
        await sql`
          CREATE TABLE IF NOT EXISTS project_user_permissions (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL,
            project_file_name VARCHAR(120) NOT NULL,
            permission_level VARCHAR(20) NOT NULL,
            assigned_by UUID NULL,
            assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE(user_id, project_file_name)
          );
        `;

        // 4. Candados de concurrencia
        await sql`
          CREATE TABLE IF NOT EXISTS canvas_active_locks (
            project_file_name VARCHAR(120) PRIMARY KEY,
            user_id UUID NOT NULL,
            user_name VARCHAR(150) NOT NULL,
            locked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            expires_at TIMESTAMPTZ NOT NULL
          );
        `;

        // 5. Logs de auditoría
        await sql`
          CREATE TABLE IF NOT EXISTS audit_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            user_id UUID NULL,
            user_email VARCHAR(255) NOT NULL,
            user_role VARCHAR(20) NOT NULL,
            action_type VARCHAR(60) NOT NULL,
            target_resource VARCHAR(200) NULL,
            details JSONB NOT NULL DEFAULT '{}',
            ip_client VARCHAR(45) NULL
          );
        `;

        // Crear o asegurar administrador principal (egdeprada@gmail.com)
        const adminCheck = (await sql`SELECT id, email FROM app_users WHERE email = 'egdeprada@gmail.com';`) as any[];
        if (!adminCheck || adminCheck.length === 0) {
          // Migrar admin previo si existía
          const legacyAdmin = (await sql`SELECT id FROM app_users WHERE email = 'admin@processtudio.com';`) as any[];
          if (legacyAdmin && legacyAdmin.length > 0) {
            await sql`
              UPDATE app_users
              SET email = 'egdeprada@gmail.com', full_name = 'Edgar González de Prada', role = 'ADMIN', status = 'ACTIVE'
              WHERE id = ${legacyAdmin[0].id};
            `;
            console.log('✓ Usuario Administrador migrado a: egdeprada@gmail.com');
          } else {
            const { hash } = await hashPassword('Admin123*');
            await sql`
              INSERT INTO app_users (
                id, email, password_hash, full_name, organization_unit, role, status
              ) VALUES (
                uuid_generate_v4(),
                'egdeprada@gmail.com',
                ${hash},
                'Edgar González de Prada',
                'Dirección General de Calidad y Procesos',
                'ADMIN',
                'ACTIVE'
              );
            `;
            console.log('✓ Usuario Administrador inicial creado: egdeprada@gmail.com / Admin123*');
          }
        }
      } catch (err) {
        console.warn('Advertencia al inicializar tablas de autenticación en Neon:', err);
      }
    }

    // Asegurar también en fallback local
    this.ensureLocalAdmin();
  }

  private static ensureLocalAdmin(): void {
    const local = localStorage.getItem(LOCAL_STORAGE_USERS_FALLBACK);
    let usersList: AppUser[] = [];
    if (local) {
      try {
        usersList = JSON.parse(local);
      } catch {
        usersList = [];
      }
    }

    // Verificar si egdeprada@gmail.com ya existe
    const existing = usersList.find(u => u.email === 'egdeprada@gmail.com');
    if (!existing) {
      const oldIdx = usersList.findIndex(u => u.email === 'admin@processtudio.com');
      hashPassword('Admin123*').then(({ hash }) => {
        const adminUser: AppUser = {
          id: oldIdx >= 0 ? usersList[oldIdx].id : 'admin-egdeprada-uuid',
          email: 'egdeprada@gmail.com',
          passwordHash: hash,
          fullName: 'Edgar González de Prada',
          organizationUnit: 'Dirección General de Calidad y Procesos',
          role: 'ADMIN',
          status: 'ACTIVE',
          resetRequestStatus: 'NONE',
          mustChangePassword: false,
          isTotpEnabled: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        if (oldIdx >= 0) {
          usersList[oldIdx] = adminUser;
        } else {
          usersList.push(adminUser);
        }
        localStorage.setItem(LOCAL_STORAGE_USERS_FALLBACK, JSON.stringify(usersList));
      });
    }
  }

  /**
   * Obtiene la sesión activa desde almacenamiento del navegador
   */
  public static getCurrentUser(): AppUser | null {
    try {
      const data = localStorage.getItem(STORAGE_KEY_SESSION_USER);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  /**
   * Guarda o borra la sesión activa
   */
  public static setCurrentUser(user: AppUser | null): void {
    if (user) {
      localStorage.setItem(STORAGE_KEY_SESSION_USER, JSON.stringify(user));
      localStorage.setItem(STORAGE_KEY_SESSION_TOKEN, 'session_' + user.id + '_' + Date.now());
    } else {
      localStorage.removeItem(STORAGE_KEY_SESSION_USER);
      localStorage.removeItem(STORAGE_KEY_SESSION_TOKEN);
    }
  }

  /**
   * Inicia sesión con correo electrónico y contraseña (o código temporal de 6 dígitos)
   */
  public static async loginWithEmail(
    email: string,
    passOrCode: string
  ): Promise<{
    ok: boolean;
    user?: AppUser;
    requiresTotp?: boolean;
    tempUserId?: string;
    mustChangePassword?: boolean;
    error?: string;
  }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = passOrCode.trim();

    const user = await this.findUserByEmail(cleanEmail);
    if (!user) {
      await AuditLoggerService.log('AUTH_LOGIN_FAILED', { email: cleanEmail, role: 'USER' }, null, {
        reason: 'Usuario no encontrado'
      });
      return { ok: false, error: 'Credenciales inválidas o correo no registrado.' };
    }

    if (user.status !== 'ACTIVE') {
      await AuditLoggerService.log('AUTH_LOGIN_FAILED', { email: cleanEmail, role: user.role }, null, {
        reason: `Cuenta con estado ${user.status}`
      });
      return { ok: false, error: 'Tu cuenta se encuentra inactiva o bloqueada. Contacta al Administrador.' };
    }

    // 1. Verificar si el usuario está ingresando con el código temporal de 6 dígitos
    const isUsingResetCode =
      user.resetCode &&
      cleanPass === user.resetCode &&
      user.resetCodeExpiresAt &&
      new Date(user.resetCodeExpiresAt).getTime() > Date.now();

    if (isUsingResetCode) {
      // Ingreso con código provisorio generado por el Admin: forzar cambio inmediato
      return {
        ok: true,
        user,
        mustChangePassword: true
      };
    }

    // 2. Verificar contraseña normal
    if (!user.passwordHash) {
      return { ok: false, error: 'Esta cuenta está configurada exclusivamente para acceso con Google.' };
    }

    const isValid = await verifyPassword(cleanPass, user.passwordHash);
    if (!isValid) {
      await AuditLoggerService.log('AUTH_LOGIN_FAILED', { email: cleanEmail, role: user.role }, null, {
        reason: 'Contraseña incorrecta'
      });
      return { ok: false, error: 'Credenciales inválidas o contraseña incorrecta.' };
    }

    // 3. Si es Administrador y tiene 2FA activado, exigir desafío TOTP
    if (user.role === 'ADMIN' && user.isTotpEnabled && user.totpSecret) {
      return {
        ok: true,
        requiresTotp: true,
        tempUserId: user.id
      };
    }

    // Login exitoso
    this.setCurrentUser(user);
    await AuditLoggerService.log('AUTH_LOGIN_SUCCESS', user, null, { method: 'EMAIL_PASSWORD' });

    return { ok: true, user };
  }

  /**
   * Valida el segundo factor (TOTP) para administradores y completa el login
   */
  public static async verifyAdminTotp(
    userId: string,
    totpCode: string
  ): Promise<{ ok: boolean; user?: AppUser; error?: string }> {
    const user = await this.findUserById(userId);
    if (!user || !user.totpSecret) {
      return { ok: false, error: 'Usuario no encontrado o 2FA no configurado.' };
    }

    const valid = await verifyTotpCode(user.totpSecret, totpCode);
    if (!valid) {
      await AuditLoggerService.log('AUTH_LOGIN_FAILED', user, null, { reason: 'Código TOTP 2FA incorrecto' });
      return { ok: false, error: 'Código 2FA incorrecto o expirado. Reintenta con el nuevo código de tu app.' };
    }

    this.setCurrentUser(user);
    await AuditLoggerService.log('AUTH_2FA_VERIFIED', user, null, { method: 'TOTP_2FA' });
    await AuditLoggerService.log('AUTH_LOGIN_SUCCESS', user, null, { method: 'EMAIL_2FA_ADMIN' });

    return { ok: true, user };
  }

  /**
   * Inicia sesión con cuenta de Google
   */
  public static async loginWithGoogle(profile: {
    email: string;
    fullName: string;
    googleId: string;
    avatarUrl?: string;
  }): Promise<{
    ok: boolean;
    user?: AppUser;
    requiresTotp?: boolean;
    tempUserId?: string;
    notRegistered?: boolean;
    error?: string;
  }> {
    const cleanEmail = profile.email.trim().toLowerCase();
    let user = await this.findUserByEmail(cleanEmail);

    // Auto-habilitar y configurar como ADMIN garantizado a egdeprada@gmail.com
    if (cleanEmail === 'egdeprada@gmail.com') {
      if (!user) {
        user = {
          id: 'admin-egdeprada-uuid',
          email: 'egdeprada@gmail.com',
          fullName: profile.fullName || 'Edgar González de Prada',
          organizationUnit: 'Dirección General de Calidad y Procesos',
          role: 'ADMIN',
          status: 'ACTIVE',
          resetRequestStatus: 'NONE',
          mustChangePassword: false,
          isTotpEnabled: false,
          googleId: profile.googleId,
          avatarUrl: profile.avatarUrl,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const users = this.getLocalUsers();
        users.push(user);
        localStorage.setItem(LOCAL_STORAGE_USERS_FALLBACK, JSON.stringify(users));

        const sql = NeonClient.getSql();
        if (sql) {
          try {
            await sql`
              INSERT INTO app_users (id, email, full_name, organization_unit, role, status, google_id, avatar_url)
              VALUES (${user.id}, ${user.email}, ${user.fullName}, ${user.organizationUnit}, 'ADMIN', 'ACTIVE', ${profile.googleId}, ${profile.avatarUrl || null})
              ON CONFLICT (email) DO UPDATE SET role = 'ADMIN', status = 'ACTIVE', google_id = EXCLUDED.google_id;
            `;
          } catch (e) {
            console.error('Error insertando egdeprada en Neon:', e);
          }
        }
      } else {
        if (user.role !== 'ADMIN' || user.status !== 'ACTIVE') {
          user.role = 'ADMIN';
          user.status = 'ACTIVE';
          const users = this.getLocalUsers();
          const idx = users.findIndex(u => u.email === 'egdeprada@gmail.com');
          if (idx !== -1) {
            users[idx].role = 'ADMIN';
            users[idx].status = 'ACTIVE';
            localStorage.setItem(LOCAL_STORAGE_USERS_FALLBACK, JSON.stringify(users));
          }
        }
      }
    }

    if (!user) {
      return {
        ok: false,
        notRegistered: true,
        error: 'Tu correo de Google no se encuentra habilitado en ProcesStudio. Puedes solicitar acceso a continuación.'
      };
    }

    if (user.status !== 'ACTIVE') {
      return { ok: false, error: 'Tu cuenta se encuentra inactiva o bloqueada. Contacta al Administrador.' };
    }

    // Actualizar avatar o googleId si no los tenía
    if (!user.googleId || (profile.avatarUrl && profile.avatarUrl !== user.avatarUrl)) {
      await this.updateGoogleProfile(user.id, profile.googleId, profile.avatarUrl);
      user.googleId = profile.googleId;
      user.avatarUrl = profile.avatarUrl || user.avatarUrl;
    }

    // Si es Administrador y tiene 2FA activado
    if (user.role === 'ADMIN' && user.isTotpEnabled && user.totpSecret) {
      return {
        ok: true,
        requiresTotp: true,
        tempUserId: user.id
      };
    }

    this.setCurrentUser(user);
    await AuditLoggerService.log('AUTH_LOGIN_GOOGLE', user, null, { googleId: profile.googleId });

    return { ok: true, user };
  }

  /**
   * Cierra la sesión activa
   */
  public static async logout(): Promise<void> {
    const user = this.getCurrentUser();
    if (user) {
      await AuditLoggerService.log('AUTH_LOGOUT', user);
    }
    this.setCurrentUser(null);
  }

  /**
   * El usuario solicita al Administrador el restablecimiento de su clave
   */
  public static async requestPasswordReset(email: string): Promise<{ ok: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const user = await this.findUserByEmail(cleanEmail);

    if (!user) {
      return {
        ok: true,
        message: 'Si el correo está registrado, la solicitud ha sido enviada al Administrador para su revisión.'
      };
    }

    const sql = NeonClient.getSql();
    if (sql) {
      try {
        await sql`
          UPDATE app_users SET
            reset_request_status = 'REQUESTED',
            reset_requested_at = NOW(),
            updated_at = NOW()
          WHERE id = ${user.id};
        `;
      } catch (err) {
        console.error('Error al registrar solicitud de reseteo en Neon:', err);
      }
    } else {
      // Fallback local
      const users = this.getLocalUsers();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        users[idx].resetRequestStatus = 'REQUESTED';
        users[idx].resetRequestedAt = new Date().toISOString();
        localStorage.setItem(LOCAL_STORAGE_USERS_FALLBACK, JSON.stringify(users));
      }
    }

    await AuditLoggerService.log('AUTH_RESET_REQUESTED', user, null, { email: cleanEmail });

    return {
      ok: true,
      message: 'Solicitud enviada al Administrador. El Administrador te informará el código de 6 dígitos para que puedas ingresar.'
    };
  }

  /**
   * El Administrador genera y autoriza el código de 6 dígitos para un usuario
   */
  public static async generateResetCodeByAdmin(
    adminUser: AppUser,
    targetUserId: string
  ): Promise<{ ok: boolean; code?: string; error?: string }> {
    if (adminUser.role !== 'ADMIN') {
      return { ok: false, error: 'Solo un Administrador puede generar códigos de restablecimiento.' };
    }

    const targetUser = await this.findUserById(targetUserId);
    if (!targetUser) {
      return { ok: false, error: 'Usuario no encontrado.' };
    }

    const code = generate6DigitCode();
    // Válido por 24 horas o hasta su uso
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const sql = NeonClient.getSql();
    if (sql) {
      try {
        await sql`
          UPDATE app_users SET
            reset_code = ${code},
            reset_code_expires_at = ${expiresAt},
            reset_request_status = 'CODE_ISSUED',
            must_change_password = TRUE,
            updated_at = NOW()
          WHERE id = ${targetUserId};
        `;
      } catch (err) {
        console.error('Error al guardar código de reseteo en Neon:', err);
        return { ok: false, error: 'Error al persistir código en la base de datos.' };
      }
    } else {
      const users = this.getLocalUsers();
      const idx = users.findIndex(u => u.id === targetUserId);
      if (idx !== -1) {
        users[idx].resetCode = code;
        users[idx].resetCodeExpiresAt = expiresAt;
        users[idx].resetRequestStatus = 'CODE_ISSUED';
        users[idx].mustChangePassword = true;
        localStorage.setItem(LOCAL_STORAGE_USERS_FALLBACK, JSON.stringify(users));
      }
    }

    await AuditLoggerService.log(
      'AUTH_RESET_CODE_ISSUED',
      adminUser,
      targetUser.email,
      { targetUserId, expiresAt }
    );

    return { ok: true, code };
  }

  /**
   * El usuario actualiza su contraseña obligatoriamente utilizando el código de 6 dígitos informado
   */
  public static async changePasswordWithCode(
    email: string,
    code: string,
    newPass: string
  ): Promise<{ ok: boolean; user?: AppUser; error?: string }> {
    const cleanEmail = email.trim().toLowerCase();
    const cleanCode = code.trim();

    if (newPass.length < 8) {
      return { ok: false, error: 'La nueva contraseña debe tener al menos 8 caracteres.' };
    }

    const user = await this.findUserByEmail(cleanEmail);
    if (!user) {
      return { ok: false, error: 'Usuario no encontrado.' };
    }

    if (user.resetCode !== cleanCode) {
      return { ok: false, error: 'El código de 6 dígitos no coincide con el generado por el Administrador.' };
    }

    if (user.resetCodeExpiresAt && new Date(user.resetCodeExpiresAt).getTime() < Date.now()) {
      return { ok: false, error: 'El código ha expirado. Solicita un nuevo código al Administrador.' };
    }

    const { hash } = await hashPassword(newPass);

    const sql = NeonClient.getSql();
    if (sql) {
      try {
        await sql`
          UPDATE app_users SET
            password_hash = ${hash},
            reset_code = NULL,
            reset_code_expires_at = NULL,
            reset_request_status = 'NONE',
            must_change_password = FALSE,
            updated_at = NOW()
          WHERE id = ${user.id};
        `;
      } catch (err) {
        console.error('Error al actualizar contraseña en Neon:', err);
        return { ok: false, error: 'Error de base de datos al guardar la nueva contraseña.' };
      }
    } else {
      const users = this.getLocalUsers();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx !== -1) {
        users[idx].passwordHash = hash;
        users[idx].resetCode = null;
        users[idx].resetCodeExpiresAt = null;
        users[idx].resetRequestStatus = 'NONE';
        users[idx].mustChangePassword = false;
        localStorage.setItem(LOCAL_STORAGE_USERS_FALLBACK, JSON.stringify(users));
      }
    }

    const updatedUser = {
      ...user,
      passwordHash: hash,
      resetCode: null,
      resetCodeExpiresAt: null,
      resetRequestStatus: 'NONE' as const,
      mustChangePassword: false
    };

    this.setCurrentUser(updatedUser);
    await AuditLoggerService.log('AUTH_PASSWORD_CHANGED', updatedUser, null, { method: '6_DIGIT_RESET' });

    return { ok: true, user: updatedUser };
  }

  /**
   * Envía una solicitud de habilitación de cuenta (No auto-registro)
   */
  public static async submitAccessRequest(data: {
    email: string;
    fullName: string;
    organizationUnit: string;
    justification: string;
  }): Promise<{ ok: boolean; error?: string }> {
    const cleanEmail = data.email.trim().toLowerCase();

    // Chequear si ya existe un usuario con este correo
    const existing = await this.findUserByEmail(cleanEmail);
    if (existing) {
      return { ok: false, error: 'Ya existe una cuenta con este correo electrónico.' };
    }

    const newRequest: UserAccessRequest = {
      id: crypto.randomUUID(),
      email: cleanEmail,
      fullName: data.fullName.trim(),
      organizationUnit: data.organizationUnit.trim(),
      justification: data.justification.trim(),
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    const sql = NeonClient.getSql();
    if (sql) {
      try {
        await sql`
          INSERT INTO user_access_requests (
            id, email, full_name, organization_unit, justification, status, created_at
          ) VALUES (
            ${newRequest.id},
            ${newRequest.email},
            ${newRequest.fullName},
            ${newRequest.organizationUnit},
            ${newRequest.justification},
            ${newRequest.status},
            NOW()
          );
        `;
      } catch (err: any) {
        console.error('Error al guardar solicitud de acceso en Neon:', err);
        return { ok: false, error: 'Ya tienes una solicitud pendiente registrada con este correo.' };
      }
    } else {
      const requests = this.getLocalRequests();
      if (requests.some(r => r.email === cleanEmail && r.status === 'PENDING')) {
        return { ok: false, error: 'Ya tienes una solicitud pendiente registrada con este correo.' };
      }
      requests.push(newRequest);
      localStorage.setItem(LOCAL_STORAGE_REQUESTS_FALLBACK, JSON.stringify(requests));
    }

    await AuditLoggerService.log(
      'ACCESS_REQUEST_SUBMITTED',
      { email: cleanEmail, role: 'USER' },
      null,
      { fullName: data.fullName, unit: data.organizationUnit }
    );

    return { ok: true };
  }

  /**
   * Administrador aprueba o rechaza solicitud de habilitación
   */
  public static async reviewAccessRequest(
    adminUser: AppUser,
    requestId: string,
    approved: boolean,
    assignedRole: UserRole = 'USER',
    adminNotes?: string
  ): Promise<{ ok: boolean; generatedInitialCode?: string; error?: string }> {
    if (adminUser.role !== 'ADMIN') {
      return { ok: false, error: 'Solo administradores pueden evaluar solicitudes.' };
    }

    const request = await this.findRequestById(requestId);
    if (!request) {
      return { ok: false, error: 'Solicitud no encontrada.' };
    }

    const initialCode = approved ? generate6DigitCode() : undefined;
    const initialHash = initialCode ? (await hashPassword(initialCode)).hash : null;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const sql = NeonClient.getSql();
    if (sql) {
      try {
        await sql`
          UPDATE user_access_requests SET
            status = ${approved ? 'APPROVED' : 'REJECTED'},
            reviewed_by = ${adminUser.id},
            reviewed_at = NOW(),
            admin_notes = ${adminNotes || null}
          WHERE id = ${requestId};
        `;

        if (approved) {
          await sql`
            INSERT INTO app_users (
              id, email, password_hash, full_name, organization_unit, role, status,
              reset_code, reset_code_expires_at, must_change_password
            ) VALUES (
              uuid_generate_v4(),
              ${request.email},
              ${initialHash},
              ${request.fullName},
              ${request.organizationUnit},
              ${assignedRole},
              'ACTIVE',
              ${initialCode},
              ${expiresAt},
              TRUE
            )
            ON CONFLICT (email) DO UPDATE SET
              status = 'ACTIVE',
              role = ${assignedRole},
              reset_code = ${initialCode},
              reset_code_expires_at = ${expiresAt},
              must_change_password = TRUE,
              updated_at = NOW();
          `;
        }
      } catch (err) {
        console.error('Error al actualizar solicitud en Neon:', err);
        return { ok: false, error: 'Error al procesar la solicitud en la base de datos.' };
      }
    } else {
      const requests = this.getLocalRequests();
      const idx = requests.findIndex(r => r.id === requestId);
      if (idx !== -1) {
        requests[idx].status = approved ? 'APPROVED' : 'REJECTED';
        requests[idx].reviewedBy = adminUser.id;
        requests[idx].reviewedAt = new Date().toISOString();
        requests[idx].adminNotes = adminNotes || null;
        localStorage.setItem(LOCAL_STORAGE_REQUESTS_FALLBACK, JSON.stringify(requests));
      }

      if (approved) {
        const users = this.getLocalUsers();
        users.push({
          id: crypto.randomUUID(),
          email: request.email,
          passwordHash: initialHash,
          fullName: request.fullName,
          organizationUnit: request.organizationUnit,
          role: assignedRole,
          status: 'ACTIVE',
          resetRequestStatus: 'CODE_ISSUED',
          resetCode: initialCode,
          resetCodeExpiresAt: expiresAt,
          mustChangePassword: true,
          isTotpEnabled: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        localStorage.setItem(LOCAL_STORAGE_USERS_FALLBACK, JSON.stringify(users));
      }
    }

    await AuditLoggerService.log(
      approved ? 'ACCESS_REQUEST_APPROVED' : 'ACCESS_REQUEST_REJECTED',
      adminUser,
      request.email,
      { assignedRole, adminNotes, initialCodeGenerated: !!initialCode }
    );

    return { ok: true, generatedInitialCode: initialCode };
  }

  /**
   * Administrador activa o desactiva un usuario
   */
  public static async updateUserStatus(
    adminUser: AppUser,
    targetUserId: string,
    newStatus: UserStatus
  ): Promise<{ ok: boolean; error?: string }> {
    if (adminUser.role !== 'ADMIN') return { ok: false, error: 'Permisos insuficientes.' };

    const sql = NeonClient.getSql();
    if (sql) {
      try {
        await sql`UPDATE app_users SET status = ${newStatus}, updated_at = NOW() WHERE id = ${targetUserId};`;
      } catch (err) {
        return { ok: false, error: 'Error de base de datos.' };
      }
    } else {
      const users = this.getLocalUsers();
      const idx = users.findIndex(u => u.id === targetUserId);
      if (idx !== -1) {
        users[idx].status = newStatus;
        localStorage.setItem(LOCAL_STORAGE_USERS_FALLBACK, JSON.stringify(users));
      }
    }

    await AuditLoggerService.log('USER_STATUS_CHANGED', adminUser, targetUserId, { newStatus });
    return { ok: true };
  }

  /**
   * Administrador da de alta directamente a un nuevo usuario corporativo
   */
  public static async createUserByAdmin(
    adminUser: AppUser,
    payload: CreateUserPayload
  ): Promise<{ ok: boolean; user?: AppUser; generatedInitialCode?: string; error?: string }> {
    if (adminUser.role !== 'ADMIN') {
      return { ok: false, error: 'Solo administradores pueden dar de alta usuarios.' };
    }

    const cleanEmail = payload.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { ok: false, error: 'Ingresa un correo electrónico corporativo válido.' };
    }

    if (!payload.fullName.trim()) {
      return { ok: false, error: 'El nombre y apellido son obligatorios.' };
    }

    if (!payload.organizationUnit.trim()) {
      return { ok: false, error: 'La unidad organizativa / área es obligatoria.' };
    }

    // Verificar unicidad de correo
    const existing = await this.findUserByEmail(cleanEmail);
    if (existing) {
      return { ok: false, error: `Ya existe un usuario registrado con el correo: ${cleanEmail}` };
    }

    let initialCode: string | undefined;
    let initialHash: string | null = null;
    let mustChangePassword = false;
    let resetCodeExpiresAt: string | null = null;
    let resetRequestStatus: 'NONE' | 'CODE_ISSUED' = 'NONE';

    if (payload.passwordMode === 'GENERATE_CODE') {
      initialCode = generate6DigitCode();
      const hashed = await hashPassword(initialCode);
      initialHash = hashed.hash;
      mustChangePassword = true;
      resetRequestStatus = 'CODE_ISSUED';
      resetCodeExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      const password = payload.manualPassword?.trim() || '';
      if (password.length < 8) {
        return { ok: false, error: 'La contraseña inicial debe contener al menos 8 caracteres.' };
      }
      const hashed = await hashPassword(password);
      initialHash = hashed.hash;
      mustChangePassword = false;
    }

    const newUser: AppUser = {
      id: crypto.randomUUID(),
      email: cleanEmail,
      fullName: payload.fullName.trim(),
      organizationUnit: payload.organizationUnit.trim(),
      role: payload.role,
      status: payload.status,
      passwordHash: initialHash,
      resetRequestStatus,
      resetCode: initialCode || null,
      resetCodeExpiresAt,
      mustChangePassword,
      isTotpEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const sql = NeonClient.getSql();
    if (sql) {
      try {
        await sql`
          INSERT INTO app_users (
            id, email, password_hash, full_name, organization_unit, role, status,
            reset_request_status, reset_code, reset_code_expires_at, must_change_password,
            created_at, updated_at
          ) VALUES (
            ${newUser.id}::uuid,
            ${newUser.email},
            ${newUser.passwordHash},
            ${newUser.fullName},
            ${newUser.organizationUnit},
            ${newUser.role},
            ${newUser.status},
            ${newUser.resetRequestStatus},
            ${newUser.resetCode},
            ${newUser.resetCodeExpiresAt ? newUser.resetCodeExpiresAt : null},
            ${newUser.mustChangePassword},
            NOW(),
            NOW()
          );
        `;
      } catch (err: any) {
        console.error('Error insertando usuario en Neon:', err);
        return {
          ok: false,
          error: err?.message
            ? `Error en base de datos: ${err.message}`
            : 'Error al persistir usuario en la base de datos relacional.'
        };
      }
    }

    // Guardar en fallback local
    const localUsers = this.getLocalUsers();
    localUsers.push(newUser);
    localStorage.setItem(LOCAL_STORAGE_USERS_FALLBACK, JSON.stringify(localUsers));

    await AuditLoggerService.log(
      'USER_CREATED_BY_ADMIN',
      adminUser,
      newUser.email,
      {
        createdUserId: newUser.id,
        role: newUser.role,
        status: newUser.status,
        unit: newUser.organizationUnit,
        initialCodeGenerated: !!initialCode
      }
    );

    return { ok: true, user: newUser, generatedInitialCode: initialCode };
  }

  /**
   * Administrador edita los datos de un usuario existente
   */
  public static async updateUserByAdmin(
    adminUser: AppUser,
    targetUserId: string,
    payload: UpdateUserPayload
  ): Promise<{ ok: boolean; user?: AppUser; error?: string }> {
    if (adminUser.role !== 'ADMIN') {
      return { ok: false, error: 'Solo administradores pueden editar usuarios.' };
    }

    const targetUser = await this.findUserById(targetUserId);
    if (!targetUser) {
      return { ok: false, error: 'Usuario no encontrado.' };
    }

    // Salvaguarda: El administrador en sesión no puede auto-degradarse ni auto-bloquearse
    if (targetUser.id === adminUser.id) {
      if (payload.role !== 'ADMIN') {
        return { ok: false, error: 'Por seguridad, no puedes despojarte a ti mismo del rol Administrador.' };
      }
      if (payload.status !== 'ACTIVE') {
        return { ok: false, error: 'Por seguridad, no puedes desactivar ni bloquear tu propia cuenta activa.' };
      }
    }

    if (!payload.fullName.trim()) {
      return { ok: false, error: 'El nombre y apellido no pueden estar vacíos.' };
    }

    if (!payload.organizationUnit.trim()) {
      return { ok: false, error: 'La unidad organizativa no puede estar vacía.' };
    }

    let newHash: string | undefined = undefined;
    if (payload.newPassword && payload.newPassword.trim().length > 0) {
      if (payload.newPassword.trim().length < 8) {
        return { ok: false, error: 'La nueva contraseña debe contener al menos 8 caracteres.' };
      }
      const hashed = await hashPassword(payload.newPassword.trim());
      newHash = hashed.hash;
    }

    const updatedUser: AppUser = {
      ...targetUser,
      fullName: payload.fullName.trim(),
      organizationUnit: payload.organizationUnit.trim(),
      role: payload.role,
      status: payload.status,
      mustChangePassword: payload.mustChangePassword ?? targetUser.mustChangePassword,
      updatedAt: new Date().toISOString()
    };

    if (newHash) {
      updatedUser.passwordHash = newHash;
    }

    const sql = NeonClient.getSql();
    if (sql) {
      try {
        if (newHash) {
          await sql`
            UPDATE app_users SET
              full_name = ${updatedUser.fullName},
              organization_unit = ${updatedUser.organizationUnit},
              role = ${updatedUser.role},
              status = ${updatedUser.status},
              password_hash = ${newHash},
              must_change_password = ${updatedUser.mustChangePassword},
              updated_at = NOW()
            WHERE id = ${targetUserId}::uuid;
          `;
        } else {
          await sql`
            UPDATE app_users SET
              full_name = ${updatedUser.fullName},
              organization_unit = ${updatedUser.organizationUnit},
              role = ${updatedUser.role},
              status = ${updatedUser.status},
              must_change_password = ${updatedUser.mustChangePassword},
              updated_at = NOW()
            WHERE id = ${targetUserId}::uuid;
          `;
        }
      } catch (err: any) {
        console.error('Error actualizando usuario en Neon:', err);
        return {
          ok: false,
          error: err?.message
            ? `Error en base de datos: ${err.message}`
            : 'Error al actualizar usuario en la base de datos.'
        };
      }
    }

    // Actualizar fallback local
    const localUsers = this.getLocalUsers();
    const idx = localUsers.findIndex(u => u.id === targetUserId);
    if (idx !== -1) {
      localUsers[idx] = updatedUser;
      localStorage.setItem(LOCAL_STORAGE_USERS_FALLBACK, JSON.stringify(localUsers));
    }

    // Si el usuario editado es el actual, refrescar sesión
    const current = this.getCurrentUser();
    if (current && current.id === targetUserId) {
      this.setCurrentUser(updatedUser);
    }

    await AuditLoggerService.log(
      'USER_UPDATED_BY_ADMIN',
      adminUser,
      targetUser.email,
      {
        targetUserId,
        role: updatedUser.role,
        status: updatedUser.status,
        unit: updatedUser.organizationUnit,
        passwordChanged: !!newHash,
        mustChangePassword: updatedUser.mustChangePassword
      }
    );

    return { ok: true, user: updatedUser };
  }

  /**
   * Configuración de 2FA para Administrador (Generar Secreto y URI para QR)
   */
  public static async setupTotp(adminUserId: string): Promise<{ secret: string; uri: string }> {
    const admin = await this.findUserById(adminUserId);
    const secret = generateTotpSecret();
    const uri = generateOtpAuthUri('ProcesStudio', admin ? admin.email : 'admin', secret);
    return { secret, uri };
  }

  /**
   * Confirma y activa el 2FA con el primer código dinámico
   */
  public static async confirmAndEnableTotp(
    adminUserId: string,
    secret: string,
    verificationCode: string
  ): Promise<{ ok: boolean; error?: string }> {
    const valid = await verifyTotpCode(secret, verificationCode);
    if (!valid) {
      return { ok: false, error: 'El código ingresado no coincide con tu aplicación Authenticator.' };
    }

    const sql = NeonClient.getSql();
    if (sql) {
      try {
        await sql`
          UPDATE app_users SET
            totp_secret = ${secret},
            is_totp_enabled = TRUE,
            updated_at = NOW()
          WHERE id = ${adminUserId};
        `;
      } catch (err) {
        return { ok: false, error: 'Error al persistir 2FA en base de datos.' };
      }
    } else {
      const users = this.getLocalUsers();
      const idx = users.findIndex(u => u.id === adminUserId);
      if (idx !== -1) {
        users[idx].totpSecret = secret;
        users[idx].isTotpEnabled = true;
        localStorage.setItem(LOCAL_STORAGE_USERS_FALLBACK, JSON.stringify(users));
      }
    }

    const current = this.getCurrentUser();
    if (current && current.id === adminUserId) {
      current.isTotpEnabled = true;
      current.totpSecret = secret;
      this.setCurrentUser(current);
    }

    return { ok: true };
  }

  // ==========================================================================
  // CONSULTAS AUXILIARES
  // ==========================================================================

  public static async listUsers(): Promise<AppUser[]> {
    const sql = NeonClient.getSql();
    if (sql) {
      try {
        const rows = (await sql`
          SELECT 
            id, email, password_hash, full_name, organization_unit, role, status,
            google_id, avatar_url, reset_request_status, reset_requested_at,
            reset_code, reset_code_expires_at, must_change_password,
            totp_secret, is_totp_enabled, created_at, updated_at
          FROM app_users
          ORDER BY created_at DESC;
        `) as any[];

        return rows.map(this.mapDbUser);
      } catch (err) {
        console.error('Error al listar usuarios en Neon:', err);
      }
    }
    return this.getLocalUsers();
  }

  public static async listAccessRequests(): Promise<UserAccessRequest[]> {
    const sql = NeonClient.getSql();
    if (sql) {
      try {
        const rows = (await sql`
          SELECT id, email, full_name, organization_unit, justification, status,
                 reviewed_by, reviewed_at, admin_notes, created_at
          FROM user_access_requests
          ORDER BY created_at DESC;
        `) as any[];

        return rows.map((r: any) => ({
          id: r.id,
          email: r.email,
          fullName: r.full_name,
          organizationUnit: r.organization_unit,
          justification: r.justification,
          status: r.status,
          reviewedBy: r.reviewed_by,
          reviewedAt: r.reviewed_at ? new Date(r.reviewed_at).toISOString() : null,
          adminNotes: r.admin_notes,
          createdAt: new Date(r.created_at).toISOString()
        }));
      } catch (err) {
        console.error('Error al listar solicitudes en Neon:', err);
      }
    }
    return this.getLocalRequests();
  }

  private static async findUserByEmail(email: string): Promise<AppUser | null> {
    const sql = NeonClient.getSql();
    if (sql) {
      try {
        const rows = (await sql`SELECT * FROM app_users WHERE email = ${email} LIMIT 1;`) as any[];
        if (rows && rows.length > 0) return this.mapDbUser(rows[0]);
      } catch (err) {
        console.warn('Consulta en Neon falló, buscando en local:', err);
      }
    }
    const local = this.getLocalUsers();
    return local.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  private static async findUserById(id: string): Promise<AppUser | null> {
    const sql = NeonClient.getSql();
    if (sql) {
      try {
        const rows = (await sql`SELECT * FROM app_users WHERE id = ${id} LIMIT 1;`) as any[];
        if (rows && rows.length > 0) return this.mapDbUser(rows[0]);
      } catch (err) {
        console.warn('Consulta en Neon falló, buscando en local:', err);
      }
    }
    const local = this.getLocalUsers();
    return local.find(u => u.id === id) || null;
  }

  private static async findRequestById(id: string): Promise<UserAccessRequest | null> {
    const requests = await this.listAccessRequests();
    return requests.find(r => r.id === id) || null;
  }

  private static async updateGoogleProfile(userId: string, googleId: string, avatarUrl?: string): Promise<void> {
    const sql = NeonClient.getSql();
    if (sql) {
      try {
        await sql`
          UPDATE app_users SET google_id = ${googleId}, avatar_url = ${avatarUrl || null}, updated_at = NOW()
          WHERE id = ${userId};
        `;
      } catch (e) {
        console.error(e);
      }
    }
  }

  private static getLocalUsers(): AppUser[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_USERS_FALLBACK);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static getLocalRequests(): UserAccessRequest[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_REQUESTS_FALLBACK);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private static mapDbUser(r: any): AppUser {
    return {
      id: r.id,
      email: r.email,
      passwordHash: r.password_hash,
      fullName: r.full_name,
      organizationUnit: r.organization_unit,
      role: r.role as UserRole,
      status: r.status as UserStatus,
      googleId: r.google_id,
      avatarUrl: r.avatar_url,
      resetRequestStatus: (r.reset_request_status || 'NONE') as any,
      resetRequestedAt: r.reset_requested_at ? new Date(r.reset_requested_at).toISOString() : null,
      resetCode: r.reset_code,
      resetCodeExpiresAt: r.reset_code_expires_at ? new Date(r.reset_code_expires_at).toISOString() : null,
      mustChangePassword: Boolean(r.must_change_password),
      totpSecret: r.totp_secret,
      isTotpEnabled: Boolean(r.is_totp_enabled),
      createdAt: typeof r.created_at === 'string' ? r.created_at : new Date(r.created_at).toISOString(),
      updatedAt: typeof r.updated_at === 'string' ? r.updated_at : new Date(r.updated_at).toISOString()
    };
  }
}
