import type { Ctx } from './context.js';
import { forbidden, notFound, unauthorized } from './http.js';
import { SESSION_COOKIE, verifyToken } from './session.js';
import { CanvasPermission, DbUser, findUserById } from './users.js';

const RANK: Record<CanvasPermission, number> = { READ_ONLY: 1, COMMENTS: 2, EDITOR: 3 };

/**
 * Valida la cookie de sesión y relee al usuario: si fue desactivado o eliminado, la sesión deja de valer.
 */
export async function requireUser(ctx: Ctx, allowed: Array<'session' | 'pwchange'> = ['session']): Promise<DbUser> {
  const claims = await verifyToken(ctx.config.sessionSecret, ctx.cookies[SESSION_COOKIE]);
  if (!claims || claims.typ === '2fa' || !allowed.includes(claims.typ)) throw unauthorized();
  const user = await findUserById(ctx.db, claims.sub);
  if (!user || user.status !== 'ACTIVE') throw unauthorized();
  // La contraseña cambió (o el Administrador emitió un código de reseteo) después de emitir esta cookie.
  if ((claims.sv ?? 0) !== (Number(user.session_version) || 0)) throw unauthorized();
  return user;
}

export async function requireAdmin(ctx: Ctx): Promise<DbUser> {
  const user = await requireUser(ctx);
  if (user.role !== 'ADMIN') throw forbidden('Acción reservada a administradores.');
  return user;
}

export interface ProjectAccess {
  exists: boolean;
  /** Proyecto al que pertenece la versión (los permisos valen para todas sus versiones). */
  projectId: string | null;
  ownerUserId: string | null;
  isOwner: boolean;
  permission: CanvasPermission | null;
}

/** Permiso del usuario sobre el proyecto al que pertenece la versión (archivo) indicada. */
export async function getProjectAccess(ctx: Ctx, user: DbUser, fileName: string): Promise<ProjectAccess> {
  const rows = await ctx.db.query<{ project_id: string; owner_user_id: string | null; permission_level: CanvasPermission | null }>(
    `SELECT pp.project_id::text AS project_id, pr.owner_user_id::text AS owner_user_id, m.permission_level
       FROM process_projects pp
       JOIN projects pr ON pr.project_id = pp.project_id
       LEFT JOIN project_members m ON m.project_id = pp.project_id AND m.user_id::text = $2
      WHERE pp.file_name = $1
      LIMIT 1`,
    [fileName, user.id]
  );
  if (rows.length === 0) return { exists: false, projectId: null, ownerUserId: null, isOwner: false, permission: null };
  const ownerUserId = rows[0].owner_user_id;
  const isOwner = !!ownerUserId && ownerUserId === user.id;
  let permission: CanvasPermission | null = rows[0].permission_level || null;
  if (user.role === 'ADMIN' || isOwner) permission = 'EDITOR';
  return { exists: true, projectId: rows[0].project_id, ownerUserId, isOwner, permission };
}

/**
 * Exige un nivel mínimo sobre el proyecto. Si el usuario no tiene ningún acceso se responde 404
 * para no revelar la existencia de lienzos no asignados.
 */
export async function requireProjectPermission(
  ctx: Ctx,
  user: DbUser,
  fileName: string,
  min: CanvasPermission
): Promise<ProjectAccess> {
  const access = await getProjectAccess(ctx, user, fileName);
  if (!access.exists || !access.permission) throw notFound('Proyecto no encontrado.');
  if (RANK[access.permission] < RANK[min]) throw forbidden('Tu nivel de permiso sobre este proyecto no habilita esta acción.');
  return access;
}

export function canManageProject(user: DbUser, access: ProjectAccess): boolean {
  return user.role === 'ADMIN' || access.isOwner;
}
