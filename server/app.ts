import type { ServerConfig } from './config.js';
import type { Ctx } from './context.js';
import type { Db } from './db.js';
import { ApiRequest, ApiResponse, parseCookies } from './http.js';
import { Router } from './router.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerMiscRoutes } from './routes/misc.js';
import { registerProjectRoutes } from './routes/projects.js';

const router = new Router();
registerAuthRoutes(router);
registerProjectRoutes(router);
registerAdminRoutes(router);
registerMiscRoutes(router);

export interface AppDeps {
  db: Db;
  config: ServerConfig;
  fetchFn?: typeof fetch;
  now?: () => number;
}

/**
 * Protección CSRF: además de SameSite=Strict, las peticiones que modifican datos deben venir
 * del mismo origen y declarar JSON.
 */
function csrfError(req: ApiRequest, config: ServerConfig): string | null {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return null;
  const fetchSite = req.headers['sec-fetch-site'];
  if (fetchSite && fetchSite !== 'same-origin' && fetchSite !== 'none') return 'Origen de la petición no permitido.';
  const origin = req.headers['origin'];
  if (origin) {
    let originHost = '';
    try {
      originHost = new URL(origin).host;
    } catch {
      return 'Origen de la petición no permitido.';
    }
    const host = req.headers['x-forwarded-host'] || req.headers['host'];
    const allowed = config.allowedOrigins.map((o) => {
      try {
        return new URL(o).host;
      } catch {
        return o;
      }
    });
    if (originHost !== host && !allowed.includes(originHost)) return 'Origen de la petición no permitido.';
  }
  const contentType = (req.headers['content-type'] || '').toLowerCase();
  if (!contentType.startsWith('application/json')) return 'Las peticiones deben enviarse como JSON.';
  return null;
}

export async function handleApiRequest(req: ApiRequest, deps: AppDeps): Promise<ApiResponse> {
  const csrf = csrfError(req, deps.config);
  if (csrf) return { status: 403, body: { ok: false, error: csrf }, cookies: [] };

  const ctx: Ctx = {
    db: deps.db,
    config: deps.config,
    req,
    cookies: parseCookies(req.headers['cookie']),
    outCookies: [],
    fetchFn: deps.fetchFn || fetch,
    now: deps.now || Date.now
  };
  return router.dispatch(ctx);
}
