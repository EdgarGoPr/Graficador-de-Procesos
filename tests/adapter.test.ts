import { Readable } from 'node:stream';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import handler from '../api/index.js';

/** Simula la petición/respuesta de Node que entrega Vercel, sin tocar la base. */
function fakeReq(method: string, url: string, headers: Record<string, string> = {}, body?: string) {
  const req: any = Readable.from(body ? [Buffer.from(body)] : []);
  req.method = method;
  req.url = url;
  req.headers = { host: 'app.test', ...headers };
  req.socket = { remoteAddress: '10.0.0.1' };
  return req;
}

function fakeRes() {
  const res: any = { statusCode: 200, headers: {} as Record<string, unknown>, body: '' };
  res.setHeader = (k: string, v: unknown) => (res.headers[k.toLowerCase()] = v);
  res.end = (chunk: string) => (res.body = chunk);
  return res;
}

const saved = { ...process.env };
beforeAll(() => {
  process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/db';
  process.env.SESSION_SECRET = 'x'.repeat(40);
});
afterAll(() => {
  process.env = saved;
});

describe('Adaptador de Vercel (api/index.ts)', () => {
  it('resuelve la ruta reescrita y exige sesión', async () => {
    const res = fakeRes();
    await handler(fakeReq('GET', '/api/index?__path=auth/me'), res);
    expect(res.statusCode).toBe(401);
    expect(res.headers['cache-control']).toBe('no-store');
    expect(JSON.parse(res.body).ok).toBe(false);
  });

  it('también funciona sin reescritura y responde 404 a rutas inexistentes', async () => {
    const res = fakeRes();
    await handler(fakeReq('GET', '/api/no-existe'), res);
    expect(res.statusCode).toBe(404);
  });

  it('rechaza JSON inválido', async () => {
    const res = fakeRes();
    await handler(
      fakeReq('POST', '/api/index?__path=auth/login', { 'content-type': 'application/json', origin: 'https://app.test' }, '{mal'),
      res
    );
    expect(res.statusCode).toBe(400);
  });

  it('sin SESSION_SECRET no arranca (falla cerrado)', async () => {
    const prev = process.env.SESSION_SECRET;
    process.env.SESSION_SECRET = 'corto';
    const res = fakeRes();
    await handler(fakeReq('GET', '/api/index?__path=auth/me'), res);
    process.env.SESSION_SECRET = prev;
    expect(res.statusCode).toBe(500);
  });
});
