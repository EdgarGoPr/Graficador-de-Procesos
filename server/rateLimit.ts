import type { Ctx } from './context.js';
import { HttpError } from './http.js';

/**
 * Límite de intentos por IP con ventana fija, guardado en auth_rate_limits.
 * Complementa el bloqueo por cuenta: frena a quien prueba muchas cuentas desde la misma IP.
 */

export const LIMITS = {
  /** Fallos de login, 2FA o cambio de contraseña por IP. */
  authFailures: { bucket: 'auth-fail', max: 30, windowMinutes: 15 },
  /** Formularios públicos (solicitud de acceso o de reseteo) por IP. */
  publicForms: { bucket: 'public-form', max: 10, windowMinutes: 60 }
} as const;

type Limit = (typeof LIMITS)[keyof typeof LIMITS];

const keyFor = (ctx: Ctx, limit: Limit) => (ctx.req.ip ? `${limit.bucket}:${ctx.req.ip}`.slice(0, 200) : null);

const tooMany = () =>
  new HttpError(429, 'Demasiados intentos desde esta conexión. Esperá unos minutos y volvé a intentarlo.');

/** Rechaza si la IP ya superó el límite (no suma un intento). */
export async function assertIpAllowed(ctx: Ctx, limit: Limit): Promise<void> {
  const key = keyFor(ctx, limit);
  if (!key) return;
  const rows = await ctx.db.query<{ attempts: number }>(
    `SELECT attempts FROM auth_rate_limits
      WHERE bucket_key = $1 AND window_started_at >= NOW() - make_interval(mins => $2::int)`,
    [key, limit.windowMinutes]
  );
  if (rows[0] && Number(rows[0].attempts) >= limit.max) throw tooMany();
}

/** Suma un intento para la IP y devuelve el total dentro de la ventana. */
export async function recordIpAttempt(ctx: Ctx, limit: Limit): Promise<number> {
  const key = keyFor(ctx, limit);
  if (!key) return 0;
  const rows = await ctx.db.query<{ attempts: number }>(
    `INSERT INTO auth_rate_limits (bucket_key, attempts, window_started_at) VALUES ($1, 1, NOW())
     ON CONFLICT (bucket_key) DO UPDATE SET
       attempts = CASE WHEN auth_rate_limits.window_started_at < NOW() - make_interval(mins => $2::int)
                       THEN 1 ELSE auth_rate_limits.attempts + 1 END,
       window_started_at = CASE WHEN auth_rate_limits.window_started_at < NOW() - make_interval(mins => $2::int)
                       THEN NOW() ELSE auth_rate_limits.window_started_at END
     RETURNING attempts`,
    [key, limit.windowMinutes]
  );
  if (Math.random() < 0.02) {
    await ctx.db.query(`DELETE FROM auth_rate_limits WHERE window_started_at < NOW() - interval '1 day'`).catch(() => undefined);
  }
  return Number(rows[0]?.attempts || 0);
}

/** Para formularios públicos: cuenta el envío y rechaza si se pasó del límite. */
export async function consumePublicForm(ctx: Ctx): Promise<void> {
  const attempts = await recordIpAttempt(ctx, LIMITS.publicForms);
  if (attempts > LIMITS.publicForms.max) throw tooMany();
}
