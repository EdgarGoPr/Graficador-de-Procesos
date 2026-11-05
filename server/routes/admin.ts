import { actorOf, writeAudit } from '../audit.js';
import { requireAdmin, requireUser } from '../authz.js';
import type { Ctx } from '../context.js';
import { hashPassword } from '../crypto.js';
import {
  badRequest,
  conflict,
  forbidden,
  notFound,
  oneOf,
  optionalString,
  requireEmail,
  requireString,
  requireUuid,
  toIso
} from '../http.js';
import { Router } from '../router.js';
import {
  ALL_SYSTEM_MODULES,
  DbUser,
  ROLES,
  STATUSES,
  findUserByEmail,
  findUserById,
  listAllUsers,
  toDirectoryUser,
  toPublicUser
} from '../users.js';
import { newResetCode } from './auth.js';

const DAY_MS = 24 * 60 * 60 * 1000;

function parseModulesInput(value: unknown): string[] {
  if (value === undefined || value === null) return [...ALL_SYSTEM_MODULES];
  if (!Array.isArray(value)) throw badRequest('Lista de módulos inválida.');
  const allowed = new Set<string>(ALL_SYSTEM_MODULES);
  const clean = value.filter((m): m is string => typeof m === 'string' && allowed.has(m));
  return clean.length > 0 ? Array.from(new Set(clean)) : [...ALL_SYSTEM_MODULES];
}

function isProtectedAdmin(ctx: Ctx, user: DbUser): boolean {
  return !!ctx.config.bootstrapAdminEmail && user.email.toLowerCase() === ctx.config.bootstrapAdminEmail;
}

export function registerAdminRoutes(router: Router): void {
  // Directorio de usuarios: completo para ADMIN, mínimo (activos) para el resto.
  router.add('GET', '/users', async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await listAllUsers(ctx.db);
    if (user.role === 'ADMIN') return { ok: true, users: rows.map(toPublicUser) };
    return { ok: true, users: rows.filter((r) => r.status === 'ACTIVE').map(toDirectoryUser) };
  });

  router.add('POST', '/users', async (ctx) => {
    const admin = await requireAdmin(ctx);
    const b = ctx.req.body || {};
    const email = requireEmail(b.email);
    const fullName = requireString(b.fullName, 'nombre y apellido', 150);
    const organizationUnit = requireString(b.organizationUnit, 'unidad organizativa', 160);
    const role = oneOf(b.role, ROLES, 'rol');
    const status = oneOf(b.status, STATUSES, 'estado');
    const modules = parseModulesInput(b.allowedModules);
    const passwordMode = oneOf(b.passwordMode, ['GENERATE_CODE', 'MANUAL_PASSWORD'] as const, 'modo de contraseña');

    if (await findUserByEmail(ctx.db, email)) throw conflict(`Ya existe un usuario registrado con el correo: ${email}`);

    let passwordHash: string | null = null;
    let codeHash: string | null = null;
    let code: string | undefined;
    let expiresAt: string | null = null;
    if (passwordMode === 'GENERATE_CODE') {
      const generated = newResetCode();
      code = generated.code;
      codeHash = generated.hash;
      expiresAt = new Date(ctx.now() + 7 * DAY_MS).toISOString();
    } else {
      const pwd = requireString(b.manualPassword, 'contraseña inicial', 200);
      if (pwd.length < 8) throw badRequest('La contraseña inicial debe contener al menos 8 caracteres.');
      passwordHash = await hashPassword(pwd);
    }

    const rows = await ctx.db.query<{ id: string }>(
      `INSERT INTO app_users (
         id, email, password_hash, full_name, organization_unit, role, status, reset_request_status,
         reset_code_hash, reset_code_expires_at, must_change_password, allowed_modules, created_at, updated_at
       ) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, NOW(), NOW())
       RETURNING id::text AS id`,
      [
        email,
        passwordHash,
        fullName,
        organizationUnit,
        role,
        status,
        code ? 'CODE_ISSUED' : 'NONE',
        codeHash,
        expiresAt,
        !!code,
        JSON.stringify(modules)
      ]
    );
    const created = (await findUserById(ctx.db, rows[0].id))!;
    await writeAudit(ctx, actorOf(admin), 'USER_CREATED_BY_ADMIN', email, {
      createdUserId: created.id,
      role,
      status,
      unit: organizationUnit,
      initialCodeGenerated: !!code
    });
    return { ok: true, user: toPublicUser(created), generatedInitialCode: code };
  });

  router.add('PATCH', '/users/:id', async (ctx, p) => {
    const admin = await requireAdmin(ctx);
    const id = requireUuid(p.id);
    const target = await findUserById(ctx.db, id);
    if (!target) throw notFound('Usuario no encontrado.');
    const b = ctx.req.body || {};
    const fullName = requireString(b.fullName, 'nombre y apellido', 150);
    const organizationUnit = requireString(b.organizationUnit, 'unidad organizativa', 160);
    const role = oneOf(b.role, ROLES, 'rol');
    const status = oneOf(b.status, STATUSES, 'estado');
    const modules = b.allowedModules === undefined ? null : parseModulesInput(b.allowedModules);
    const mustChange = typeof b.mustChangePassword === 'boolean' ? b.mustChangePassword : !!target.must_change_password;

    if (target.id === admin.id) {
      if (role !== 'ADMIN') throw badRequest('Por seguridad, no podés quitarte a vos mismo el rol Administrador.');
      if (status !== 'ACTIVE') throw badRequest('Por seguridad, no podés desactivar ni bloquear tu propia cuenta.');
    }
    if (isProtectedAdmin(ctx, target) && (role !== 'ADMIN' || status !== 'ACTIVE')) {
      throw badRequest('La cuenta de Administrador principal no puede degradarse ni desactivarse.');
    }

    let newHash: string | null = null;
    const newPassword = optionalString(b.newPassword, 'nueva contraseña', 200);
    if (newPassword) {
      if (newPassword.length < 8) throw badRequest('La nueva contraseña debe contener al menos 8 caracteres.');
      newHash = await hashPassword(newPassword);
    }

    await ctx.db.query(
      `UPDATE app_users SET full_name = $2, organization_unit = $3, role = $4, status = $5,
         password_hash = COALESCE($6, password_hash), must_change_password = $7,
         allowed_modules = COALESCE($8::jsonb, allowed_modules), updated_at = NOW()
       WHERE id::text = $1`,
      [id, fullName, organizationUnit, role, status, newHash, mustChange, modules ? JSON.stringify(modules) : null]
    );
    const updated = (await findUserById(ctx.db, id))!;
    await writeAudit(ctx, actorOf(admin), 'USER_UPDATED_BY_ADMIN', target.email, {
      targetUserId: id,
      role,
      status,
      unit: organizationUnit,
      passwordChanged: !!newHash,
      mustChangePassword: mustChange
    });
    return { ok: true, user: toPublicUser(updated) };
  });

  router.add('PATCH', '/users/:id/status', async (ctx, p) => {
    const admin = await requireAdmin(ctx);
    const id = requireUuid(p.id);
    const status = oneOf(ctx.req.body?.status, STATUSES, 'estado');
    const target = await findUserById(ctx.db, id);
    if (!target) throw notFound('Usuario no encontrado.');
    if (target.id === admin.id && status !== 'ACTIVE') throw badRequest('No podés desactivar tu propia cuenta.');
    if (isProtectedAdmin(ctx, target) && status !== 'ACTIVE') {
      throw badRequest('La cuenta de Administrador principal no puede desactivarse.');
    }
    await ctx.db.query(`UPDATE app_users SET status = $2, updated_at = NOW() WHERE id::text = $1`, [id, status]);
    if (status !== 'ACTIVE') {
      await ctx.db.query(`DELETE FROM canvas_active_locks WHERE user_id::text = $1`, [id]);
    }
    await writeAudit(ctx, actorOf(admin), 'USER_STATUS_CHANGED', target.email, { targetUserId: id, newStatus: status });
    return { ok: true };
  });

  router.add('PUT', '/users/:id/modules', async (ctx, p) => {
    const admin = await requireAdmin(ctx);
    const id = requireUuid(p.id);
    const target = await findUserById(ctx.db, id);
    if (!target) throw notFound('Usuario no encontrado.');
    const modules = parseModulesInput(ctx.req.body?.allowedModules);
    await ctx.db.query(`UPDATE app_users SET allowed_modules = $2::jsonb, updated_at = NOW() WHERE id::text = $1`, [
      id,
      JSON.stringify(modules)
    ]);
    const updated = (await findUserById(ctx.db, id))!;
    await writeAudit(ctx, actorOf(admin), 'USER_UPDATED_BY_ADMIN', target.email, { targetUserId: id, updatedAllowedModules: modules });
    return { ok: true, user: toPublicUser(updated) };
  });

  router.add('POST', '/users/:id/reset-code', async (ctx, p) => {
    const admin = await requireAdmin(ctx);
    const id = requireUuid(p.id);
    const target = await findUserById(ctx.db, id);
    if (!target) throw notFound('Usuario no encontrado.');
    const { code, hash } = newResetCode();
    const expiresAt = new Date(ctx.now() + DAY_MS).toISOString();
    await ctx.db.query(
      `UPDATE app_users SET reset_code_hash = $2, reset_code_expires_at = $3, reset_request_status = 'CODE_ISSUED',
         must_change_password = TRUE, failed_login_attempts = 0, locked_until = NULL, updated_at = NOW()
       WHERE id::text = $1`,
      [id, hash, expiresAt]
    );
    await writeAudit(ctx, actorOf(admin), 'AUTH_RESET_CODE_ISSUED', target.email, { targetUserId: id, expiresAt });
    return { ok: true, code };
  });

  router.add('DELETE', '/users/:id', async (ctx, p) => {
    const admin = await requireAdmin(ctx);
    const id = requireUuid(p.id);
    if (id === admin.id) throw badRequest('No podés eliminar tu propia cuenta de Administrador en sesión activa.');
    const target = await findUserById(ctx.db, id);
    if (!target) throw notFound('Usuario no encontrado.');
    if (isProtectedAdmin(ctx, target)) throw forbidden('La cuenta de Administrador principal está protegida contra eliminación.');

    await ctx.db.query(`DELETE FROM project_user_permissions WHERE user_id::text = $1`, [id]);
    await ctx.db.query(`DELETE FROM canvas_active_locks WHERE user_id::text = $1`, [id]);
    await ctx.db.query(`DELETE FROM user_presence WHERE user_id::text = $1`, [id]);
    await ctx.db.query(`UPDATE user_access_requests SET reviewed_by = NULL WHERE reviewed_by::text = $1`, [id]);
    await ctx.db.query(`UPDATE project_user_permissions SET assigned_by = NULL WHERE assigned_by::text = $1`, [id]);
    await ctx.db.query(`DELETE FROM app_users WHERE id::text = $1`, [id]);

    await writeAudit(ctx, actorOf(admin), 'USER_DELETED_BY_ADMIN', target.email, {
      deletedUserId: id,
      fullName: target.full_name,
      organizationUnit: target.organization_unit
    });
    return { ok: true };
  });

  // --- Solicitudes de habilitación ---
  router.add('GET', '/access-requests', async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query(
      `SELECT id::text AS id, email, full_name, organization_unit, justification, status, reviewed_by::text AS reviewed_by,
              reviewed_at, admin_notes, created_at
         FROM user_access_requests ORDER BY created_at DESC`
    );
    return {
      ok: true,
      requests: rows.map((r) => ({
        id: r.id,
        email: r.email,
        fullName: r.full_name,
        organizationUnit: r.organization_unit,
        justification: r.justification,
        status: r.status,
        reviewedBy: r.reviewed_by,
        reviewedAt: toIso(r.reviewed_at),
        adminNotes: r.admin_notes,
        createdAt: toIso(r.created_at)
      }))
    };
  });

  router.add('POST', '/access-requests/:id/review', async (ctx, p) => {
    const admin = await requireAdmin(ctx);
    const id = requireUuid(p.id);
    const approved = ctx.req.body?.approved === true;
    const role = ctx.req.body?.role ? oneOf(ctx.req.body.role, ROLES, 'rol') : 'USER';
    const adminNotes = optionalString(ctx.req.body?.adminNotes, 'observaciones', 2000);

    const rows = await ctx.db.query(`SELECT id::text AS id, email, full_name, organization_unit FROM user_access_requests WHERE id::text = $1`, [id]);
    const request = rows[0];
    if (!request) throw notFound('Solicitud no encontrada.');

    await ctx.db.query(
      `UPDATE user_access_requests SET status = $2, reviewed_by = $3::uuid, reviewed_at = NOW(), admin_notes = $4 WHERE id::text = $1`,
      [id, approved ? 'APPROVED' : 'REJECTED', admin.id, adminNotes]
    );

    let code: string | undefined;
    if (approved) {
      const generated = newResetCode();
      code = generated.code;
      const expiresAt = new Date(ctx.now() + 7 * DAY_MS).toISOString();
      await ctx.db.query(
        `INSERT INTO app_users (
           id, email, full_name, organization_unit, role, status, reset_request_status, reset_code_hash,
           reset_code_expires_at, must_change_password, allowed_modules, created_at, updated_at
         ) VALUES (gen_random_uuid(), $1, $2, $3, $4, 'ACTIVE', 'CODE_ISSUED', $5, $6, TRUE, $7::jsonb, NOW(), NOW())
         ON CONFLICT (email) DO UPDATE SET status = 'ACTIVE', role = EXCLUDED.role, reset_request_status = 'CODE_ISSUED',
           reset_code_hash = EXCLUDED.reset_code_hash, reset_code_expires_at = EXCLUDED.reset_code_expires_at,
           must_change_password = TRUE, updated_at = NOW()`,
        [request.email.toLowerCase(), request.full_name, request.organization_unit, role, generated.hash, expiresAt, JSON.stringify(ALL_SYSTEM_MODULES)]
      );
    }

    await writeAudit(ctx, actorOf(admin), approved ? 'ACCESS_REQUEST_APPROVED' : 'ACCESS_REQUEST_REJECTED', request.email, {
      assignedRole: role,
      adminNotes,
      initialCodeGenerated: !!code
    });
    return { ok: true, generatedInitialCode: code };
  });
}
