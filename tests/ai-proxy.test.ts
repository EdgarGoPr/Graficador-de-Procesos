import { describe, expect, it } from 'vitest';
import { IDS, createTestApp } from './helpers.js';

const BODY = { contents: [{ parts: [{ text: 'hola' }] }] };

function geminiSequence(statuses: number[]): { fetchFn: typeof fetch; calls: () => number } {
  let n = 0;
  const fetchFn = (async () => {
    const status = statuses[Math.min(n, statuses.length - 1)];
    n++;
    const body = status === 200 ? { candidates: [{ content: { parts: [{ text: 'ok' }] } }] } : { error: { message: 'high demand' } };
    return new Response(JSON.stringify(body), { status });
  }) as any;
  return { fetchFn, calls: () => n };
}

describe('Proxy de IA', () => {
  it('sin clave en el servidor responde 503 y no llama a Google', async () => {
    const app = await createTestApp();
    const g = geminiSequence([200]);
    const res = await app.call('POST', '/ai/generate', { cookie: await app.cookieFor(IDS.dave), body: BODY, fetchFn: g.fetchFn });
    expect(res.status).toBe(503);
    expect(g.calls()).toBe(0);
  });

  it('exige sesión', async () => {
    const app = await createTestApp({ config: { geminiApiKey: 'clave-servidor' } });
    expect((await app.call('POST', '/ai/generate', { body: BODY })).status).toBe(401);
  });

  it('si Gemini está saturado reintenta una vez y devuelve la respuesta', async () => {
    const app = await createTestApp({ config: { geminiApiKey: 'clave-servidor' } });
    const g = geminiSequence([503, 200]);
    const res = await app.call('POST', '/ai/generate', { cookie: await app.cookieFor(IDS.dave), body: BODY, fetchFn: g.fetchFn });
    expect(res.status).toBe(200);
    expect(g.calls()).toBe(2);
  });

  it('si sigue saturado informa un mensaje claro', async () => {
    const app = await createTestApp({ config: { geminiApiKey: 'clave-servidor' } });
    const g = geminiSequence([503, 503]);
    const res = await app.call('POST', '/ai/generate', { cookie: await app.cookieFor(IDS.dave), body: BODY, fetchFn: g.fetchFn });
    expect(res.status).toBe(503);
    expect(res.json.error).toMatch(/saturado/);
    expect(g.calls()).toBe(2);
  });

  it('otros errores de Google no se reintentan', async () => {
    const app = await createTestApp({ config: { geminiApiKey: 'clave-servidor' } });
    const g = geminiSequence([400]);
    const res = await app.call('POST', '/ai/generate', { cookie: await app.cookieFor(IDS.dave), body: BODY, fetchFn: g.fetchFn });
    expect(res.status).toBe(502);
    expect(g.calls()).toBe(1);
  });
});
