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
  return user;
}

export async function requireAdmin(ctx: Ctx): Promise<DbUser> {
  const user = await requireUser(ctx);
  if (user.role !== 'ADMIN') throw forbidden('Acción reservada a administradores.');
  return user;
}

export interface ProjectAccess {
  exists: boolean;
  ownerUserId: string | null;
  isOwner: boolean;
  permission: CanvasPermission | null;
}

export async function getProjectAccess(ctx: Ctx, user: DbUser, fileName: string): Promise<ProjectAccess> {
  const rows = await ctx.db.query<{ owner_user_id: string | null; permission_level: CanvasPermission | null }>(
    `SELECT p.owner_user_id::text AS owner_user_id, perm.permission_level
       FROM process_projects p
       LEFT JOIN project_user_permissions perm
         ON perm.project_file_name = p.file_name AND perm.user_id::text = $2
      WHERE p.file_name = $1
      LIMIT 1`,
    [fileName, user.id]
  );
  if (rows.length === 0) return { exists: false, ownerUserId: null, isOwner: false, permission: null };
  const ownerUserId = rows[0].owner_user_id;
  const isOwner = !!ownerUserId && ownerUserId === user.id;
  let permission: CanvasPermission | null = rows[0].permission_level || null;
  if (user.role === 'ADMIN' || isOwner) permission = 'EDITOR';
  return { exists: true, ownerUserId, isOwner, permission };
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
