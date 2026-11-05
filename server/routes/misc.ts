import { actorOf, writeAudit } from '../audit.js';
import { getProjectAccess, requireAdmin, requireProjectPermission, requireUser } from '../authz.js';
import { HttpError, badRequest, oneOf, requireFileName, toIso } from '../http.js';
import { Router } from '../router.js';
import { listTrashFor } from './projects.js';

const LOCK_DURATION_MS = 5 * 60 * 1000;
const IDLE_THRESHOLD_MS = 5 * 60 * 1000;
const DISCONNECT_MS = 8 * 60 * 1000;
const CATALOG_KEY = 'GLOBAL_CATALOGS_V2';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent';

/** Eventos que el navegador puede reportar. El resto los registra solo el servidor. */
const CLIENT_AUDIT_EVENTS = [
  'CANVAS_OPENED',
  'CANVAS_COMMENT_ADDED',
  'CANVAS_COMMENT_UPDATED',
  'CANVAS_PROJECT_SAVED',
  'CANVAS_EXPORT_GENERATED',
  'PROJECT_METADATA_UPDATED',
  'PROJECT_STATUS_CHANGED',
  'CATALOG_ITEM_CREATED',
  'CATALOG_ITEM_UPDATED',
  'CATALOG_ITEM_DELETED'
] as const;
const ADMIN_ONLY_EVENTS = new Set(['CATALOG_ITEM_CREATED', 'CATALOG_ITEM_UPDATED', 'CATALOG_ITEM_DELETED']);

function parseJson(value: unknown): any {
  return typeof value === 'string' ? JSON.parse(value) : value;
}

export function registerMiscRoutes(router: Router): void {
  // -------------------------------------------------------------------------
  // Auditoría
  // -------------------------------------------------------------------------
  router.add('POST', '/audit/events', async (ctx) => {
    const user = await requireUser(ctx);
    const action = oneOf(ctx.req.body?.actionType, CLIENT_AUDIT_EVENTS, 'actionType');
    if (ADMIN_ONLY_EVENTS.has(action) && user.role !== 'ADMIN') throw new HttpError(403, 'Evento no permitido.');
    const target = typeof ctx.req.body?.targetResource === 'string' ? ctx.req.body.targetResource.slice(0, 200) : null;
    const details = ctx.req.body?.details && typeof ctx.req.body.details === 'object' ? ctx.req.body.details : {};
    if (JSON.stringify(details).length > 4096) throw badRequest('Detalle de auditoría demasiado extenso.');
    await writeAudit(ctx, actorOf(user), action, target, { ...details, reportedBy: 'client' });
    return { ok: true };
  });

  router.add('GET', '/audit', async (ctx) => {
    await requireAdmin(ctx);
    const q = ctx.req.query;
    const limit = Math.min(Math.max(parseInt(q.limit || '300', 10) || 300, 1), 1000);
    const conditions: string[] = [];
    const params: unknown[] = [];
    const add = (sql: string, value: unknown) => {
      params.push(value);
      conditions.push(sql.replace('?', `$${params.length}`));
    };
    if (q.userEmail) add('user_email ILIKE ?', `%${q.userEmail}%`);
    if (q.actionType && q.actionType !== 'ALL') add('action_type = ?', q.actionType);
    if (q.targetResource) add('target_resource ILIKE ?', `%${q.targetResource}%`);
    if (q.startDate && /^\d{4}-\d{2}-\d{2}/.test(q.startDate)) add('timestamp >= ?::timestamptz', q.startDate);
    if (q.endDate && /^\d{4}-\d{2}-\d{2}$/.test(q.endDate)) add('timestamp <= ?::timestamptz', `${q.endDate}T23:59:59.999Z`);
    params.push(limit);
    const rows = await ctx.db.query(
      `SELECT id::text AS id, timestamp, user_id::text AS user_id, user_email, user_role, action_type, target_resource, details, ip_client
         FROM audit_logs
        ${conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''}
        ORDER BY timestamp DESC
        LIMIT $${params.length}`,
      params
    );
    return {
      ok: true,
      logs: rows.map((r) => ({
        id: r.id,
        timestamp: toIso(r.timestamp),
        userId: r.user_id,
        userEmail: r.user_email,
        userRole: r.user_role,
        actionType: r.action_type,
        targetResource: r.target_resource,
        details: parseJson(r.details) || {},
        ipClient: r.ip_client
      }))
    };
  });

  // -------------------------------------------------------------------------
  // Catálogos maestros
  // -------------------------------------------------------------------------
  router.add('GET', '/catalogs', async (ctx) => {
    const user = await requireUser(ctx);
    const rows = await ctx.db.query(`SELECT payload FROM app_master_catalogs WHERE catalog_key = $1`, [CATALOG_KEY]);
    const payload = rows[0] ? parseJson(rows[0].payload) : null;
    if (payload && typeof payload === 'object') delete payload.deletedProjects;
    return { ok: true, payload, deletedProjects: await listTrashFor(ctx, user) };
  });

  router.add('PUT', '/catalogs', async (ctx) => {
    await requireAdmin(ctx);
    const payload = ctx.req.body?.payload;
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw badRequest('Catálogo inválido.');
    const clean = { ...payload };
    delete clean.deletedProjects;
    const serialized = JSON.stringify(clean);
    if (serialized.length > 2 * 1024 * 1024) throw badRequest('El catálogo supera el tamaño permitido.');
    await ctx.db.query(
      `INSERT INTO app_master_catalogs (catalog_key, payload, updated_at) VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (catalog_key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
      [CATALOG_KEY, serialized]
    );
    return { ok: true };
  });

  // -------------------------------------------------------------------------
  // Candados de edición (solo sobre los propios)
  // -------------------------------------------------------------------------
  router.add('POST', '/locks/:fileName', async (ctx, p) => {
    const user = await requireUser(ctx);
    const fileName = requireFileName(p.fileName);
    await requireProjectPermission(ctx, user, fileName, 'EDITOR');
    const now = ctx.now();

    await ctx.db.query(`DELETE FROM canvas_active_locks WHERE expires_at <= NOW()`);
    const existing = await ctx.db.query(
      `SELECT c.project_file_name, c.user_id::text AS user_id, c.user_name, c.locked_at, c.expires_at,
              pr.is_logged_in, pr.last_action_at, pr.last_heartbeat_at
         FROM canvas_active_locks c
         LEFT JOIN user_presence pr ON pr.user_id = c.user_id
        WHERE c.project_file_name = $1`,
      [fileName]
    );
    const lock = existing[0];
    if (lock && lock.user_id !== user.id) {
      const isLoggedOut = lock.is_logged_in === false;
      const lastAction = lock.last_action_at ? new Date(lock.last_action_at).getTime() : 0;
      const lastBeat = lock.last_heartbeat_at ? new Date(lock.last_heartbeat_at).getTime() : 0;
      if (isLoggedOut || now - lastAction >= IDLE_THRESHOLD_MS || now - lastBeat >= DISCONNECT_MS) {
        await ctx.db.query(`DELETE FROM canvas_active_locks WHERE project_file_name = $1 AND user_id::text = $2`, [fileName, lock.user_id]);
      } else {
        return {
          ok: false,
          activeConflict: {
            projectFileName: lock.project_file_name,
            userId: lock.user_id,
            userName: lock.user_name,
            lockedAt: toIso(lock.locked_at),
            expiresAt: toIso(lock.expires_at)
          }
        };
      }
    }

    const expiresAt = new Date(now + LOCK_DURATION_MS).toISOString();
    const taken = await ctx.db.query(
      `INSERT INTO canvas_active_locks (project_file_name, user_id, user_name, locked_at, expires_at)
       VALUES ($1, $2::uuid, $3, NOW(), $4)
       ON CONFLICT (project_file_name) DO UPDATE SET user_id = EXCLUDED.user_id, user_name = EXCLUDED.user_name,
         locked_at = NOW(), expires_at = EXCLUDED.expires_at
       WHERE canvas_active_locks.user_id = EXCLUDED.user_id OR canvas_active_locks.expires_at <= NOW()
       RETURNING project_file_name`,
      [fileName, user.id, user.full_name, expiresAt]
    );
    if (taken.length === 0) {
      const current = (await ctx.db.query(
        `SELECT user_id::text AS user_id, user_name, locked_at, expires_at FROM canvas_active_locks WHERE project_file_name = $1`,
        [fileName]
      ))[0];
      return {
        ok: false,
        activeConflict: current
          ? { projectFileName: fileName, userId: current.user_id, userName: current.user_name, lockedAt: toIso(current.locked_at), expiresAt: toIso(current.expires_at) }
          : null
      };
    }
    await writeAudit(ctx, actorOf(user), 'CANVAS_LOCK_ACQUIRED', fileName);
    return {
      ok: true,
      lock: { projectFileName: fileName, userId: user.id, userName: user.full_name, lockedAt: new Date(now).toISOString(), expiresAt }
    };
  });

  router.add('PUT', '/locks/:fileName/heartbeat', async (ctx, p) => {
    const user = await requireUser(ctx);
    const fileName = requireFileName(p.fileName);
    const expiresAt = new Date(ctx.now() + LOCK_DURATION_MS).toISOString();
    await ctx.db.query(
      `UPDATE canvas_active_locks SET expires_at = $3 WHERE project_file_name = $1 AND user_id::text = $2`,
      [fileName, user.id, expiresAt]
    );
    return { ok: true };
  });

  router.add('DELETE', '/locks/:fileName', async (ctx, p) => {
    const user = await requireUser(ctx);
    const fileName = requireFileName(p.fileName);
    const deleted = await ctx.db.query(
      `DELETE FROM canvas_active_locks WHERE project_file_name = $1 AND user_id::text = $2 RETURNING project_file_name`,
      [fileName, user.id]
    );
    if (deleted.length > 0) await writeAudit(ctx, actorOf(user), 'CANVAS_LOCK_RELEASED', fileName);
    return { ok: true };
  });

  router.add('DELETE', '/locks', async (ctx) => {
    const user = await requireUser(ctx);
    await ctx.db.query(`DELETE FROM canvas_active_locks WHERE user_id::text = $1`, [user.id]);
    return { ok: true };
  });

  // -------------------------------------------------------------------------
  // Presencia
  // -------------------------------------------------------------------------
  router.add('POST', '/presence', async (ctx) => {
    const user = await requireUser(ctx);
    const b = ctx.req.body || {};
    const isActive = b.isActive !== false;
    let fileName: string | null = null;
    let title: string | null = null;
    if (isActive && typeof b.activeProjectFileName === 'string' && b.activeProjectFileName) {
      const candidate = requireFileName(b.activeProjectFileName);
      const access = await getProjectAccess(ctx, user, candidate);
      if (access.exists && access.permission) {
        fileName = candidate;
        title = typeof b.activeProjectTitle === 'string' ? b.activeProjectTitle.slice(0, 255) : null;
      }
    }
    const now = ctx.now();
    let lastAction = Date.parse(b.lastActionAt);
    if (isNaN(lastAction) || lastAction > now) lastAction = now;
    await ctx.db.query(
      `INSERT INTO user_presence (user_id, last_action_at, last_heartbeat_at, active_project_file_name, active_project_title, is_logged_in)
       VALUES ($1::uuid, $2, NOW(), $3, $4, true)
       ON CONFLICT (user_id) DO UPDATE SET last_action_at = EXCLUDED.last_action_at, last_heartbeat_at = NOW(),
         active_project_file_name = EXCLUDED.active_project_file_name, active_project_title = EXCLUDED.active_project_title,
         is_logged_in = true`,
      [user.id, new Date(lastAction).toISOString(), fileName, title]
    );
    return { ok: true };
  });

  router.add('POST', '/presence/offline', async (ctx) => {
    const user = await requireUser(ctx);
    await ctx.db.query(
      `UPDATE user_presence SET is_logged_in = false, active_project_file_name = NULL, active_project_title = NULL
        WHERE user_id::text = $1`,
      [user.id]
    );
    return { ok: true };
  });

  router.add('GET', '/presence', async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query(
      `SELECT user_id::text AS user_id, last_action_at, last_heartbeat_at, active_project_file_name, active_project_title, is_logged_in
         FROM user_presence`
    );
    const now = ctx.now();
    return {
      ok: true,
      presence: rows.map((r) => {
        const lastBeat = new Date(r.last_heartbeat_at).getTime();
        const lastAction = new Date(r.last_action_at).getTime();
        let state: 'ACTIVE' | 'INACTIVE' | 'DISCONNECTED' = 'DISCONNECTED';
        if (r.is_logged_in && now - lastBeat <= DISCONNECT_MS) {
          state = now - lastAction < IDLE_THRESHOLD_MS ? 'ACTIVE' : 'INACTIVE';
        }
        return {
          userId: r.user_id,
          state,
          lastActionAt: toIso(r.last_action_at),
          lastHeartbeatAt: toIso(r.last_heartbeat_at),
          activeProjectFileName: state === 'ACTIVE' ? r.active_project_file_name : null,
          activeProjectTitle: state === 'ACTIVE' ? r.active_project_title : null
        };
      })
    };
  });

  // -------------------------------------------------------------------------
  // Proxy de IA (Gemini): la clave del servidor nunca llega al navegador
  // -------------------------------------------------------------------------
  router.add('POST', '/ai/generate', async (ctx) => {
    await requireUser(ctx);
    if (!ctx.config.geminiApiKey) {
      throw new HttpError(503, 'El servicio de IA no está configurado en el servidor. Cargá tu propia clave en la Bóveda Documental.');
    }
    const contents = ctx.req.body?.contents;
    if (!Array.isArray(contents) || contents.length === 0) throw badRequest('Solicitud de IA inválida.');
    const body: Record<string, unknown> = { contents };
    if (ctx.req.body?.generationConfig && typeof ctx.req.body.generationConfig === 'object') {
      body.generationConfig = ctx.req.body.generationConfig;
    }
    const res = await ctx.fetchFn(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': ctx.config.geminiApiKey },
      body: JSON.stringify(body)
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = (data as any)?.error?.message || `Error HTTP ${res.status}`;
      throw new HttpError(502, `Servicio de IA: ${msg}`);
    }
    return data;
  });
}
