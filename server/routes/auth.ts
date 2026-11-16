import { actorOf, writeAudit } from '../audit.js';
import { requireAdmin, requireUser } from '../authz.js';
import type { Ctx } from '../context.js';
import { LIMITS, assertIpAllowed, consumePublicForm, recordIpAttempt } from '../rateLimit.js';
import {
  decryptSecret,
  encryptSecret,
  generate6DigitCode,
  generateTotpSecret,
  hashPassword,
  isEncryptedSecret,
  otpAuthUri,
  safeEqualHex,
  sha256Hex,
  verifyPassword,
  verifyTotp
} from '../crypto.js';
import { HttpError, badRequest, requireEmail, requireString, unauthorized } from '../http.js';
import { Router } from '../router.js';
import {
  SESSION_COOKIE,
  TWO_FA_COOKIE,
  clearSessionCookie,
  clearTwoFaCookie,
  sessionCookie,
  twoFaCookie,
  verifyToken
} from '../session.js';
import { DbUser, findUserByEmail, findUserById, toPublicUser } from '../users.js';

const MAX_FAILED_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

// ---------------------------------------------------------------------------
// Bloqueo por intentos fallidos
// ---------------------------------------------------------------------------

function assertNotLocked(ctx: Ctx, user: DbUser): void {
  if (!user.locked_until) return;
  const until = new Date(user.locked_until as any).getTime();
  if (until > ctx.now()) {
    const minutes = Math.max(1, Math.ceil((until - ctx.now()) / 60000));
    throw new HttpError(429, `Cuenta bloqueada temporalmente por intentos fallidos. Reintentá en ${minutes} minuto(s).`);
  }
}

async function registerFailure(ctx: Ctx, user: DbUser | null): Promise<void> {
  await recordIpAttempt(ctx, LIMITS.authFailures);
  if (!user) return;
  await ctx.db.query(
    `UPDATE app_users SET
       failed_login_attempts = CASE WHEN COALESCE(failed_login_attempts, 0) + 1 >= $2 THEN 0 ELSE COALESCE(failed_login_attempts, 0) + 1 END,
       locked_until = CASE WHEN COALESCE(failed_login_attempts, 0) + 1 >= $2 THEN NOW() + make_interval(mins => $3::int) ELSE locked_until END
     WHERE id::text = $1`,
    [user.id, MAX_FAILED_ATTEMPTS, LOCK_MINUTES]
  );
}

async function clearFailures(ctx: Ctx, user: DbUser): Promise<void> {
  if ((user.failed_login_attempts || 0) === 0 && !user.locked_until) return;
  await ctx.db.query(`UPDATE app_users SET failed_login_attempts = 0, locked_until = NULL WHERE id::text = $1`, [user.id]);
}

/** Secreto TOTP en claro: descifra si está cifrado; si hay clave y estaba en texto plano, lo cifra. */
async function readTotpSecret(ctx: Ctx, user: DbUser): Promise<string | null> {
  const stored = user.totp_secret;
  if (!stored) return null;
  if (isEncryptedSecret(stored)) {
    if (!ctx.config.totpEncryptionKey) {
      console.error('Hay secretos TOTP cifrados pero falta TOTP_ENCRYPTION_KEY.');
      throw new HttpError(500, 'El servidor no puede validar el doble factor. Contactá al Administrador.');
    }
    return decryptSecret(ctx.config.totpEncryptionKey, stored);
  }
  return stored;
}

function storableTotpSecret(ctx: Ctx, plain: string): string {
  return ctx.config.totpEncryptionKey ? encryptSecret(ctx.config.totpEncryptionKey, plain) : plain;
}

function hasValidResetCode(ctx: Ctx, user: DbUser, code: string): boolean {
  if (!user.reset_code_hash || !user.reset_code_expires_at) return false;
  if (new Date(user.reset_code_expires_at as any).getTime() <= ctx.now()) return false;
  if (!/^\d{6}$/.test(code)) return false;
  return safeEqualHex(sha256Hex(code), user.reset_code_hash);
}

// ---------------------------------------------------------------------------
// Datos de sesión que recibe el cliente
// ---------------------------------------------------------------------------

/** Permiso del usuario por archivo de versión (el permiso es del proyecto y vale para todas sus versiones). */
export async function userPermissions(ctx: Ctx, user: DbUser) {
  const rows = await ctx.db.query<{ file_name: string; permission_level: string }>(
    `SELECT pp.file_name,
            CASE WHEN pr.owner_user_id::text = $1 THEN 'EDITOR' ELSE m.permission_level END AS permission_level
       FROM process_projects pp
       JOIN projects pr ON pr.project_id = pp.project_id
       LEFT JOIN project_members m ON m.project_id = pp.project_id AND m.user_id::text = $1
      WHERE pr.owner_user_id::text = $1 OR m.user_id IS NOT NULL`,
    [user.id]
  );
  return rows.map((r) => ({ projectFileName: r.file_name, permissionLevel: r.permission_level }));
}

async function sessionPayload(ctx: Ctx, user: DbUser) {
  return {
    ok: true,
    user: toPublicUser(user),
    permissions: await userPermissions(ctx, user),
    features: { aiProxy: !!ctx.config.geminiApiKey }
  };
}

/** Completa el primer factor: exige TOTP a administradores con 2FA, o abre la sesión. */
async function finishFirstFactor(ctx: Ctx, user: DbUser, next: 'session' | 'pwchange', method: string) {
  if (user.role === 'ADMIN' && user.is_totp_enabled && user.totp_secret) {
    ctx.outCookies.push(await twoFaCookie(ctx.config.sessionSecret, user, next));
    return { ok: true, requiresTotp: true };
  }
  if (next === 'pwchange') {
    ctx.outCookies.push(await sessionCookie(ctx.config.sessionSecret, user, 'pwchange'));
    return { ok: true, mustChangePassword: true };
  }
  ctx.outCookies.push(await sessionCookie(ctx.config.sessionSecret, user, 'session'));
  await writeAudit(ctx, actorOf(user), method === 'GOOGLE' ? 'AUTH_LOGIN_GOOGLE' : 'AUTH_LOGIN_SUCCESS', null, { method });
  return sessionPayload(ctx, user);
}

// ---------------------------------------------------------------------------
// Rutas
// ---------------------------------------------------------------------------

export function registerAuthRoutes(router: Router): void {
  router.add('POST', '/auth/login', async (ctx) => {
    const email = requireString(ctx.req.body?.email, 'email', 255).toLowerCase();
    const secret = requireString(ctx.req.body?.password, 'contraseña', 200);
    await assertIpAllowed(ctx, LIMITS.authFailures);

    const user = await findUserByEmail(ctx.db, email);
    if (!user) {
      await registerFailure(ctx, null);
      await writeAudit(ctx, { email, role: 'USER' }, 'AUTH_LOGIN_FAILED', null, { reason: 'Usuario no encontrado' });
      throw unauthorized('Credenciales inválidas o correo no registrado.');
    }
    assertNotLocked(ctx, user);
    if (user.status !== 'ACTIVE') {
      await writeAudit(ctx, actorOf(user), 'AUTH_LOGIN_FAILED', null, { reason: `Cuenta con estado ${user.status}` });
      throw new HttpError(403, 'Tu cuenta se encuentra inactiva o bloqueada. Contactá al Administrador.');
    }

    // 1. Código temporal de 6 dígitos generado por el Administrador
    if (hasValidResetCode(ctx, user, secret)) {
      await clearFailures(ctx, user);
      return finishFirstFactor(ctx, user, 'pwchange', 'RESET_CODE');
    }

    // 2. Contraseña
    if (!user.password_hash) {
      await registerFailure(ctx, user);
      throw unauthorized('Esta cuenta no tiene contraseña: ingresá con Google o con el código vigente que te informó el Administrador.');
    }
    if (!(await verifyPassword(secret, user.password_hash))) {
      await registerFailure(ctx, user);
      await writeAudit(ctx, actorOf(user), 'AUTH_LOGIN_FAILED', null, { reason: 'Contraseña incorrecta' });
      throw unauthorized('Credenciales inválidas o contraseña incorrecta.');
    }
    await clearFailures(ctx, user);
    return finishFirstFactor(ctx, user, 'session', 'EMAIL_PASSWORD');
  });

  router.add('POST', '/auth/google', async (ctx) => {
    const accessToken = requireString(ctx.req.body?.accessToken, 'accessToken', 4096);
    await assertIpAllowed(ctx, LIMITS.authFailures);

    const infoRes = await ctx.fetchFn(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
    );
    if (!infoRes.ok) {
      await registerFailure(ctx, null);
      throw unauthorized('No se pudo validar la sesión de Google.');
    }
    const info = (await infoRes.json()) as Record<string, any>;
    const clientId = ctx.config.googleClientId;
    if (info.aud !== clientId && info.azp !== clientId) {
      await registerFailure(ctx, null);
      throw unauthorized('El token de Google no corresponde a esta aplicación.');
    }
    if (!(info.email_verified === true || info.email_verified === 'true') || typeof info.email !== 'string') {
      throw unauthorized('Google no confirmó el correo de la cuenta.');
    }
    const email = String(info.email).toLowerCase();
    const googleId = String(info.sub || '');

    let fullName = email.split('@')[0];
    let avatarUrl: string | null = null;
    try {
      const profRes = await ctx.fetchFn('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (profRes.ok) {
        const prof = (await profRes.json()) as Record<string, any>;
        if (typeof prof.name === 'string' && prof.name.trim()) fullName = prof.name.trim().slice(0, 150);
        if (typeof prof.picture === 'string') avatarUrl = prof.picture.slice(0, 500);
      }
    } catch {
      // perfil opcional
    }

    let user = await findUserByEmail(ctx.db, email);
    const isBootstrapAdmin = !!ctx.config.bootstrapAdminEmail && email === ctx.config.bootstrapAdminEmail;

    if (isBootstrapAdmin) {
      if (!user) {
        await ctx.db.query(
          `INSERT INTO app_users (id, email, full_name, organization_unit, role, status, google_id, avatar_url, created_at, updated_at)
           VALUES (gen_random_uuid(), $1, $2, 'Administración', 'ADMIN', 'ACTIVE', $3, $4, NOW(), NOW())`,
          [email, fullName, googleId || null, avatarUrl]
        );
      } else if (user.role !== 'ADMIN' || user.status !== 'ACTIVE') {
        await ctx.db.query(`UPDATE app_users SET role = 'ADMIN', status = 'ACTIVE', updated_at = NOW() WHERE id::text = $1`, [user.id]);
      }
      user = await findUserByEmail(ctx.db, email);
    }

    if (!user) {
      return {
        __status: 403,
        body: {
          ok: false,
          notRegistered: true,
          profile: { email, fullName },
          error: 'Tu correo de Google no se encuentra habilitado en ProcesStudio. Podés solicitar acceso a continuación.'
        }
      };
    }
    if (user.status !== 'ACTIVE') {
      throw new HttpError(403, 'Tu cuenta se encuentra inactiva o bloqueada. Contactá al Administrador.');
    }

    if (googleId && (user.google_id !== googleId || (avatarUrl && avatarUrl !== user.avatar_url))) {
      try {
        await ctx.db.query(
          `UPDATE app_users SET google_id = $2, avatar_url = COALESCE($3, avatar_url), updated_at = NOW() WHERE id::text = $1`,
          [user.id, googleId, avatarUrl]
        );
      } catch (err) {
        console.warn('No se pudo actualizar el vínculo con Google:', err);
      }
    }

    return finishFirstFactor(ctx, user, 'session', 'GOOGLE');
  });

  router.add('POST', '/auth/totp/verify', async (ctx) => {
    const claims = await verifyToken(ctx.config.sessionSecret, ctx.cookies[TWO_FA_COOKIE]);
    if (!claims || claims.typ !== '2fa') throw unauthorized('El desafío de doble factor expiró. Volvé a iniciar sesión.');
    await assertIpAllowed(ctx, LIMITS.authFailures);
    const user = await findUserById(ctx.db, claims.sub);
    if (!user || user.status !== 'ACTIVE' || !user.totp_secret) throw unauthorized();
    if ((claims.sv ?? 0) !== (Number(user.session_version) || 0)) throw unauthorized('El desafío de doble factor expiró. Volvé a iniciar sesión.');
    assertNotLocked(ctx, user);

    const code = requireString(ctx.req.body?.code, 'código', 10);
    const totpSecret = await readTotpSecret(ctx, user);
    if (!totpSecret || !verifyTotp(totpSecret, code, ctx.now())) {
      await registerFailure(ctx, user);
      await writeAudit(ctx, actorOf(user), 'AUTH_LOGIN_FAILED', null, { reason: 'Código TOTP 2FA incorrecto' });
      throw unauthorized('Código 2FA incorrecto o expirado. Reintentá con el nuevo código de tu app.');
    }
    await clearFailures(ctx, user);
    if (ctx.config.totpEncryptionKey && !isEncryptedSecret(user.totp_secret)) {
      // Migración progresiva: el secreto heredado en texto plano queda cifrado.
      await ctx.db.query(`UPDATE app_users SET totp_secret = $2 WHERE id::text = $1`, [user.id, storableTotpSecret(ctx, totpSecret)]);
    }
    ctx.outCookies.push(clearTwoFaCookie());
    await writeAudit(ctx, actorOf(user), 'AUTH_2FA_VERIFIED', null, { method: 'TOTP_2FA' });

    if (claims.next === 'pwchange') {
      ctx.outCookies.push(await sessionCookie(ctx.config.sessionSecret, user, 'pwchange'));
      return { ok: true, mustChangePassword: true };
    }
    ctx.outCookies.push(await sessionCookie(ctx.config.sessionSecret, user, 'session'));
    await writeAudit(ctx, actorOf(user), 'AUTH_LOGIN_SUCCESS', null, { method: 'EMAIL_2FA_ADMIN' });
    return sessionPayload(ctx, user);
  });

  router.add('POST', '/auth/change-password', async (ctx) => {
    const user = await requireUser(ctx, ['pwchange', 'session']);
    await assertIpAllowed(ctx, LIMITS.authFailures);
    assertNotLocked(ctx, user);
    const code = requireString(ctx.req.body?.code, 'código', 10);
    const newPassword = requireString(ctx.req.body?.newPassword, 'nueva contraseña', 200);
    if (newPassword.length < 8) throw badRequest('La nueva contraseña debe tener al menos 8 caracteres.');

    if (!user.reset_code_hash) throw badRequest('No hay un código de restablecimiento vigente. Solicitá uno nuevo al Administrador.');
    if (user.reset_code_expires_at && new Date(user.reset_code_expires_at as any).getTime() < ctx.now()) {
      throw badRequest('El código ha expirado. Solicitá un nuevo código al Administrador.');
    }
    if (!hasValidResetCode(ctx, user, code)) {
      await registerFailure(ctx, user);
      throw badRequest('El código de 6 dígitos no coincide con el generado por el Administrador.');
    }

    const hash = await hashPassword(newPassword);
    await ctx.db.query(
      `UPDATE app_users SET password_hash = $2, reset_code_hash = NULL, reset_code_expires_at = NULL,
         reset_request_status = 'NONE', must_change_password = FALSE, failed_login_attempts = 0, locked_until = NULL,
         session_version = session_version + 1, updated_at = NOW()
       WHERE id::text = $1`,
      [user.id, hash]
    );
    // Las sesiones abiertas antes del cambio dejan de valer; solo vale la que se emite ahora.
    const updated = (await findUserById(ctx.db, user.id))!;
    ctx.outCookies.push(await sessionCookie(ctx.config.sessionSecret, updated, 'session'));
    await writeAudit(ctx, actorOf(updated), 'AUTH_PASSWORD_CHANGED', null, { method: '6_DIGIT_RESET' });
    return sessionPayload(ctx, updated);
  });

  router.add('POST', '/auth/reauth', async (ctx) => {
    const user = await requireUser(ctx);
    if (user.password_hash) {
      await assertIpAllowed(ctx, LIMITS.authFailures);
      assertNotLocked(ctx, user);
      const password = requireString(ctx.req.body?.password, 'contraseña', 200);
      if (!(await verifyPassword(password, user.password_hash))) {
        await registerFailure(ctx, user);
        throw unauthorized('Contraseña incorrecta.');
      }
      await clearFailures(ctx, user);
    }
    // Renueva la sesión al desbloquear la pantalla.
    ctx.outCookies.push(await sessionCookie(ctx.config.sessionSecret, user, 'session'));
    return { ok: true };
  });

  router.add('GET', '/auth/me', async (ctx) => {
    const user = await requireUser(ctx);
    return sessionPayload(ctx, user);
  });

  router.add('POST', '/auth/logout', async (ctx) => {
    const claims = await verifyToken(ctx.config.sessionSecret, ctx.cookies[SESSION_COOKIE]);
    ctx.outCookies.push(clearSessionCookie(), clearTwoFaCookie());
    if (claims && claims.typ !== '2fa') {
      const user = await findUserById(ctx.db, claims.sub);
      if (user) {
        await ctx.db.query(`DELETE FROM canvas_active_locks WHERE user_id::text = $1`, [user.id]);
        await ctx.db.query(
          `UPDATE user_presence SET is_logged_in = false, active_project_file_name = NULL, active_project_title = NULL
           WHERE user_id::text = $1`,
          [user.id]
        );
        await writeAudit(ctx, actorOf(user), 'AUTH_LOGOUT');
      }
    }
    return { ok: true };
  });

  router.add('POST', '/auth/reset-request', async (ctx) => {
    const email = requireString(ctx.req.body?.email, 'email', 255).toLowerCase();
    await consumePublicForm(ctx);
    const user = await findUserByEmail(ctx.db, email);
    if (user) {
      await ctx.db.query(
        `UPDATE app_users SET reset_request_status = 'REQUESTED', reset_requested_at = NOW(), updated_at = NOW()
         WHERE id::text = $1`,
        [user.id]
      );
      await writeAudit(ctx, actorOf(user), 'AUTH_RESET_REQUESTED', null, { email });
    }
    // Respuesta neutra: no revela si el correo existe.
    return {
      ok: true,
      message: 'Si el correo está registrado, la solicitud fue enviada al Administrador. Te informará el código de 6 dígitos para que puedas ingresar.'
    };
  });

  router.add('POST', '/access-requests', async (ctx) => {
    const email = requireEmail(ctx.req.body?.email);
    const fullName = requireString(ctx.req.body?.fullName, 'nombre', 150);
    const organizationUnit = requireString(ctx.req.body?.organizationUnit, 'unidad organizativa', 160);
    const justification = requireString(ctx.req.body?.justification, 'justificación', 2000);
    await consumePublicForm(ctx);

    const existing = await findUserByEmail(ctx.db, email);
    if (!existing) {
      const pending = await ctx.db.query(
        `SELECT 1 FROM user_access_requests WHERE lower(email) = $1 AND status = 'PENDING' LIMIT 1`,
        [email]
      );
      if (pending.length > 0) throw badRequest('Ya tenés una solicitud pendiente registrada con este correo.');
      await ctx.db.query(
        `INSERT INTO user_access_requests (id, email, full_name, organization_unit, justification, status, created_at)
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'PENDING', NOW())
         ON CONFLICT (email) DO UPDATE SET full_name = EXCLUDED.full_name, organization_unit = EXCLUDED.organization_unit,
           justification = EXCLUDED.justification, status = 'PENDING', reviewed_by = NULL, reviewed_at = NULL,
           admin_notes = NULL, created_at = NOW()`,
        [email, fullName, organizationUnit, justification]
      );
      await writeAudit(ctx, { email, role: 'USER' }, 'ACCESS_REQUEST_SUBMITTED', null, { fullName, unit: organizationUnit });
    }
    return { ok: true };
  });

  // --- 2FA (enrolamiento del propio administrador) ---
  router.add('POST', '/auth/totp/setup', async (ctx) => {
    const admin = await requireAdmin(ctx);
    const secret = generateTotpSecret();
    return { ok: true, secret, uri: otpAuthUri('ProcesStudio', admin.email, secret) };
  });

  router.add('POST', '/auth/totp/enable', async (ctx) => {
    const admin = await requireAdmin(ctx);
    const secret = requireString(ctx.req.body?.secret, 'secreto', 64);
    if (!/^[A-Z2-7]{16,64}$/.test(secret)) throw badRequest('Secreto 2FA inválido.');
    const code = requireString(ctx.req.body?.code, 'código', 10);
    if (!verifyTotp(secret, code, ctx.now())) {
      throw badRequest('El código ingresado no coincide con tu aplicación Authenticator.');
    }
    await ctx.db.query(
      `UPDATE app_users SET totp_secret = $2, is_totp_enabled = TRUE, updated_at = NOW() WHERE id::text = $1`,
      [admin.id, storableTotpSecret(ctx, secret)]
    );
    await writeAudit(ctx, actorOf(admin), 'AUTH_2FA_ENABLED');
    return { ok: true };
  });
}

/** Usado por la administración de usuarios: genera un código y devuelve el hash a guardar. */
export function newResetCode(): { code: string; hash: string } {
  const code = generate6DigitCode();
  return { code, hash: sha256Hex(code) };
}
