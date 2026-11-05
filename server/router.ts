import type { Ctx } from './context.js';
import { ApiResponse, HttpError, notFound } from './http.js';

export type RouteResult = unknown | { __status: number; body: unknown };
export type Handler = (ctx: Ctx, params: Record<string, string>) => Promise<RouteResult>;

interface Route {
  method: string;
  regex: RegExp;
  keys: string[];
  handler: Handler;
}

export class Router {
  private routes: Route[] = [];

  add(method: string, pattern: string, handler: Handler): this {
    const keys: string[] = [];
    const regex = new RegExp(
      '^' +
        pattern.replace(/\/:([A-Za-z_]+)/g, (_m, key) => {
          keys.push(key);
          return '/([^/]+)';
        }) +
        '/?$'
    );
    this.routes.push({ method, regex, keys, handler });
    return this;
  }

  async dispatch(ctx: Ctx): Promise<ApiResponse> {
    const { method, path } = ctx.req;
    try {
      let pathMatched = false;
      for (const r of this.routes) {
        const m = r.regex.exec(path);
        if (!m) continue;
        pathMatched = true;
        if (r.method !== method) continue;
        const params: Record<string, string> = {};
        r.keys.forEach((k, i) => {
          params[k] = decodeURIComponent(m[i + 1]);
        });
        const result = await r.handler(ctx, params);
        if (result && typeof result === 'object' && '__status' in (result as any)) {
          const r2 = result as { __status: number; body: unknown };
          return { status: r2.__status, body: r2.body, cookies: ctx.outCookies };
        }
        return { status: 200, body: result ?? { ok: true }, cookies: ctx.outCookies };
      }
      if (pathMatched) throw new HttpError(405, 'Método no permitido.');
      throw notFound('Ruta inexistente.');
    } catch (err) {
      if (err instanceof HttpError) {
        return { status: err.status, body: { ok: false, error: err.message, ...err.extra }, cookies: ctx.outCookies };
      }
      console.error('Error no controlado en la API:', err);
      return { status: 500, body: { ok: false, error: 'Error interno del servidor.' }, cookies: ctx.outCookies };
    }
  }
}

export const withStatus = (status: number, body: unknown) => ({ __status: status, body });
