import type { IncomingMessage, ServerResponse } from 'node:http';
import { AppDeps, handleApiRequest } from './app.js';
import type { ApiRequest } from './http.js';

/**
 * Traduce una petición HTTP de Node (Vercel o servidor local) al formato de la API.
 */

const MAX_BODY_BYTES = 4.5 * 1024 * 1024;
const INVALID_JSON = Symbol('invalid-json');
const TOO_LARGE = Symbol('too-large');

export type NodeLikeRequest = IncomingMessage & { body?: unknown };

async function readBody(req: NodeLikeRequest): Promise<unknown> {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  try {
    if (req.body !== undefined) {
      if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : undefined;
      if (Buffer.isBuffer(req.body)) return req.body.length ? JSON.parse(req.body.toString('utf8')) : undefined;
      return req.body;
    }
  } catch {
    return INVALID_JSON;
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as string);
    size += buf.length;
    if (size > MAX_BODY_BYTES) return TOO_LARGE;
    chunks.push(buf);
  }
  if (chunks.length === 0) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return INVALID_JSON;
  }
}

export function sendJson(res: ServerResponse, status: number, body: unknown, cookies: string[] = []): void {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (cookies.length > 0) res.setHeader('Set-Cookie', cookies);
  res.end(JSON.stringify(body));
}

export async function handleNodeRequest(req: NodeLikeRequest, res: ServerResponse, deps: AppDeps): Promise<void> {
  const url = new URL(req.url || '/', 'http://localhost');
  const query: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    if (k !== '__path') query[k] = v;
  });
  // En Vercel, /api/* se reescribe a /api/index?__path=*
  const rewritten = url.searchParams.get('__path');
  const rawPath = rewritten !== null ? `/${rewritten}` : url.pathname.replace(/^\/api/, '');
  const path = rawPath.replace(/\/+$/, '') || '/';

  const body = await readBody(req);
  if (body === INVALID_JSON) return sendJson(res, 400, { ok: false, error: 'JSON inválido.' });
  if (body === TOO_LARGE) return sendJson(res, 413, { ok: false, error: 'La petición supera el tamaño permitido.' });

  const headers: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(req.headers)) headers[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : v;
  const forwarded = headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || null;

  const apiReq: ApiRequest = { method: (req.method || 'GET').toUpperCase(), path, query, headers, body, ip };
  const result = await handleApiRequest(apiReq, deps);
  sendJson(res, result.status, result.body, result.cookies);
}
