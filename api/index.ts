import type { IncomingMessage, ServerResponse } from 'node:http';
import { handleApiRequest } from '../server/app.js';
import { ConfigError, loadConfig } from '../server/config.js';
import { getNeonDb } from '../server/db.js';
import type { ApiRequest } from '../server/http.js';

/**
 * Única función serverless de Vercel. vercel.json reescribe /api/* hacia aquí
 * (el plan Hobby limita la cantidad de funciones).
 */

const MAX_BODY_BYTES = 4.5 * 1024 * 1024;

type VercelLikeRequest = IncomingMessage & { body?: unknown; query?: Record<string, string | string[]> };

async function readBody(req: VercelLikeRequest): Promise<unknown> {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  try {
    if (req.body !== undefined) {
      if (typeof req.body === 'string') return req.body ? JSON.parse(req.body) : undefined;
      if (Buffer.isBuffer(req.body)) return req.body.length ? JSON.parse(req.body.toString('utf8')) : undefined;
      return req.body;
    }
  } catch {
    return Symbol.for('invalid-json');
  }
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) return Symbol.for('too-large');
    chunks.push(chunk as Buffer);
  }
  if (chunks.length === 0) return undefined;
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    return Symbol.for('invalid-json');
  }
}

function send(res: ServerResponse, status: number, body: unknown, cookies: string[] = []) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  if (cookies.length > 0) res.setHeader('Set-Cookie', cookies);
  res.end(JSON.stringify(body));
}

export default async function handler(req: VercelLikeRequest, res: ServerResponse) {
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    console.error(err instanceof ConfigError ? err.message : err);
    return send(res, 500, { ok: false, error: 'El servidor no está configurado correctamente.' });
  }

  const url = new URL(req.url || '/', 'http://localhost');
  const query: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    if (k !== '__path') query[k] = v;
  });
  const rewritten = url.searchParams.get('__path');
  const rawPath = rewritten !== null ? `/${rewritten}` : url.pathname.replace(/^\/api/, '');
  const path = rawPath.replace(/\/+$/, '') || '/';

  const body = await readBody(req);
  if (body === Symbol.for('invalid-json')) return send(res, 400, { ok: false, error: 'JSON inválido.' });
  if (body === Symbol.for('too-large')) return send(res, 413, { ok: false, error: 'La petición supera el tamaño permitido.' });

  const headers: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(req.headers)) headers[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : v;

  const forwarded = headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || null;

  const apiReq: ApiRequest = { method: (req.method || 'GET').toUpperCase(), path, query, headers, body, ip };
  const result = await handleApiRequest(apiReq, { db: getNeonDb(config.databaseUrl), config });
  return send(res, result.status, result.body, result.cookies);
}
