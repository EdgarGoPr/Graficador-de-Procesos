import type { Ctx } from './context.js';

export interface AuditActor {
  id?: string | null;
  email: string;
  role: string;
}

/**
 * Inserta un evento de auditoría. Es la única vía de escritura sobre audit_logs
 * (la base rechaza UPDATE/DELETE). Nunca interrumpe la operación principal.
 */
export async function writeAudit(
  ctx: Ctx,
  actor: AuditActor,
  actionType: string,
  targetResource: string | null = null,
  details: Record<string, unknown> = {}
): Promise<void> {
  try {
    await ctx.db.query(
      `INSERT INTO audit_logs (id, timestamp, user_id, user_email, user_role, action_type, target_resource, details, ip_client)
       VALUES (gen_random_uuid(), NOW(), $1, $2, $3, $4, $5, $6::jsonb, $7)`,
      [
        actor.id || null,
        (actor.email || 'desconocido').slice(0, 255),
        (actor.role || 'USER').slice(0, 20),
        actionType.slice(0, 60),
        targetResource ? targetResource.slice(0, 200) : null,
        JSON.stringify(details || {}),
        ctx.req.ip ? ctx.req.ip.slice(0, 45) : null
      ]
    );
  } catch (err) {
    console.error('No se pudo registrar el evento de auditoría:', actionType, err);
  }
}

export function actorOf(user: { id: string; email: string; role: string }): AuditActor {
  return { id: user.id, email: user.email, role: user.role };
}
