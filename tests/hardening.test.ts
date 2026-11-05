import { describe, expect, it } from 'vitest';
import { totpAt } from '../server/crypto.js';
import { IDS, PASSWORDS, PROJECT_A, cookieHeaderFrom, createTestApp } from './helpers.js';

const ENC_KEY = new Uint8Array(32).fill(7);
const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

describe('Revocación de sesiones', () => {
  it('cambiar la contraseña con el código invalida las sesiones anteriores', async () => {
    const app = await createTestApp();
    const oldCookie = await app.cookieFor(IDS.dave);
    expect((await app.call('GET', '/auth/me', { cookie: oldCookie })).status).toBe(200);

    const login = await app.call('POST', '/auth/login', { body: { email: 'dave@test.gob', password: '123456' } });
    const change = await app.call('POST', '/auth/change-password', {
      cookie: cookieHeaderFrom(login),
      body: { code: '123456', newPassword: 'OtraClave123' }
    });
    expect(change.status).toBe(200);
    expect((await app.call('GET', '/auth/me', { cookie: oldCookie })).status).toBe(401);
    expect((await app.call('GET', '/auth/me', { cookie: cookieHeaderFrom(change) })).status).toBe(200);
  });

  it('si el Administrador cambia la contraseña o emite un código, el usuario debe volver a ingresar', async () => {
    const app = await createTestApp();
    const admin = await app.cookieFor(IDS.admin);
    const alice = await app.cookieFor(IDS.alice);
    const bob = await app.cookieFor(IDS.bob);

    await app.call('PATCH', `/users/${IDS.alice}`, {
      cookie: admin,
      body: { fullName: 'Alice', organizationUnit: 'Calidad', role: 'USER', status: 'ACTIVE', newPassword: 'NuevaAlice123' }
    });
    expect((await app.call('GET', '/projects', { cookie: alice })).status).toBe(401);

    await app.call('POST', `/users/${IDS.bob}/reset-code`, { cookie: admin, body: {} });
    expect((await app.call('GET', '/projects', { cookie: bob })).status).toBe(401);

    // Editar datos sin tocar la contraseña no cierra sesiones.
    const carol = await app.cookieFor(IDS.carol);
    await app.call('PATCH', `/users/${IDS.carol}`, {
      cookie: admin,
      body: { fullName: 'Carol', organizationUnit: 'Calidad', role: 'USER', status: 'ACTIVE' }
    });
    expect((await app.call('GET', '/projects', { cookie: carol })).status).toBe(200);
  });

  it('el administrador que cambia su propia contraseña conserva la sesión actual', async () => {
    const app = await createTestApp();
    const res = await app.call('PATCH', `/users/${IDS.admin}`, {
      cookie: await app.cookieFor(IDS.admin),
      body: { fullName: 'Admin', organizationUnit: 'X', role: 'ADMIN', status: 'ACTIVE', newPassword: 'NuevaAdmin123' }
    });
    expect(res.status).toBe(200);
    expect((await app.call('GET', '/audit', { cookie: cookieHeaderFrom(res) })).status).toBe(200);
  });
});

describe('Límite de intentos por IP', () => {
  it('tras 30 fallos desde una IP se bloquea esa IP, no las demás', async () => {
    const app = await createTestApp();
    const ip = '10.0.0.9';
    for (let i = 0; i < 30; i++) {
      const r = await app.call('POST', '/auth/login', { ip, body: { email: `nadie${i}@test.gob`, password: 'x' } });
      expect(r.status).toBe(401);
    }
    const blocked = await app.call('POST', '/auth/login', { ip, body: { email: 'alice@test.gob', password: PASSWORDS.alice } });
    expect(blocked.status).toBe(429);
    const other = await app.call('POST', '/auth/login', { ip: '10.0.0.10', body: { email: 'alice@test.gob', password: PASSWORDS.alice } });
    expect(other.status).toBe(200);
  });

  it('los formularios públicos admiten 10 envíos por IP por hora', async () => {
    const app = await createTestApp();
    for (let i = 0; i < 10; i++) {
      const r = await app.call('POST', '/auth/reset-request', { ip: '10.0.0.20', body: { email: `x${i}@test.gob` } });
      expect(r.status).toBe(200);
    }
    const r = await app.call('POST', '/access-requests', {
      ip: '10.0.0.20',
      body: { email: 'nuevo@test.gob', fullName: 'Nuevo', organizationUnit: 'Calidad', justification: 'Trabajo' }
    });
    expect(r.status).toBe(429);
  });
});

describe('Secreto TOTP cifrado en reposo', () => {
  async function loginAndVerify(app: Awaited<ReturnType<typeof createTestApp>>) {
    const login = await app.call('POST', '/auth/login', { body: { email: 'admin@test.gob', password: PASSWORDS.admin } });
    expect(login.json.requiresTotp).toBe(true);
    return app.call('POST', '/auth/totp/verify', {
      cookie: cookieHeaderFrom(login, 'ps_2fa'),
      body: { code: totpAt(SECRET, Math.floor(app.now.value / 1000 / 30)) }
    });
  }

  it('al activar el 2FA el secreto se guarda cifrado y sigue funcionando', async () => {
    const app = await createTestApp({ config: { totpEncryptionKey: ENC_KEY } });
    const enable = await app.call('POST', '/auth/totp/enable', {
      cookie: await app.cookieFor(IDS.admin),
      body: { secret: SECRET, code: totpAt(SECRET, Math.floor(app.now.value / 1000 / 30)) }
    });
    expect(enable.status).toBe(200);
    const row = await app.db.query(`SELECT totp_secret FROM app_users WHERE id = $1`, [IDS.admin]);
    expect(row[0].totp_secret.startsWith('enc:v1:')).toBe(true);
    expect(row[0].totp_secret).not.toContain(SECRET);
    expect((await loginAndVerify(app)).status).toBe(200);
  });

  it('un secreto heredado en texto plano se cifra en el siguiente ingreso', async () => {
    const app = await createTestApp({ config: { totpEncryptionKey: ENC_KEY } });
    await app.db.query(`UPDATE app_users SET totp_secret = $2, is_totp_enabled = TRUE WHERE id = $1`, [IDS.admin, SECRET]);
    expect((await loginAndVerify(app)).status).toBe(200);
    const row = await app.db.query(`SELECT totp_secret FROM app_users WHERE id = $1`, [IDS.admin]);
    expect(row[0].totp_secret.startsWith('enc:v1:')).toBe(true);
  });

  it('sin la clave no se puede validar un secreto cifrado (falla cerrado)', async () => {
    const withKey = await createTestApp({ config: { totpEncryptionKey: ENC_KEY } });
    await withKey.call('POST', '/auth/totp/enable', {
      cookie: await withKey.cookieFor(IDS.admin),
      body: { secret: SECRET, code: totpAt(SECRET, Math.floor(withKey.now.value / 1000 / 30)) }
    });
    const stored = (await withKey.db.query(`SELECT totp_secret FROM app_users WHERE id = $1`, [IDS.admin]))[0].totp_secret;

    const noKey = await createTestApp();
    await noKey.db.query(`UPDATE app_users SET totp_secret = $2, is_totp_enabled = TRUE WHERE id = $1`, [IDS.admin, stored]);
    const res = await loginAndVerify(noKey);
    expect(res.status).toBe(500);
    expect(res.cookies.some((c) => c.startsWith('ps_session=') && !c.includes('Max-Age=0'))).toBe(false);
  });
});

describe('Migraciones sobre los scripts de esquema reales (neon_schema.sql + auth_schema.sql)', () => {
  it('aplican sin errores y la API respeta permisos', async () => {
    const app = await createTestApp({ baseline: 'scripts' });
    const alice = await app.call('GET', `/projects/${PROJECT_A}`, { cookie: await app.cookieFor(IDS.alice) });
    expect(alice.status).toBe(200);
    expect((await app.call('GET', `/projects/${PROJECT_A}`, { cookie: await app.cookieFor(IDS.dave) })).status).toBe(404);
    // La búsqueda full-text (columna generada) sigue funcionando tras guardar.
    const save = await app.call('PUT', `/projects/${PROJECT_A}`, {
      cookie: await app.cookieFor(IDS.alice),
      body: { project: { ...alice.json.project } }
    });
    expect(save.status).toBe(200);
  });

  it('el rol de aplicación lee proyectos con RLS activo y no puede alterar la auditoría', async () => {
    const app = await createTestApp({ baseline: 'scripts' });
    await app.pg.exec('SET ROLE processtudio_app');
    try {
      const rows = await app.pg.query(`SELECT count(*)::int AS n FROM process_projects`);
      expect((rows.rows[0] as any).n).toBe(2);
      await app.pg.query(`INSERT INTO auth_rate_limits (bucket_key) VALUES ('x')`);
      await expect(app.pg.query(`DELETE FROM audit_logs`)).rejects.toThrow(/permission denied/);
    } finally {
      await app.pg.exec('RESET ROLE');
    }
  });

  it('se puede eliminar un usuario que tiene historial de auditoría y solicitudes revisadas', async () => {
    const app = await createTestApp({ baseline: 'scripts' });
    await app.db.query(
      `INSERT INTO user_access_requests (email, full_name, organization_unit, justification, status, reviewed_by)
       VALUES ('otro@test.gob', 'Otro', 'Calidad', 'x', 'APPROVED', $1)`,
      [IDS.alice]
    );
    const res = await app.call('DELETE', `/users/${IDS.alice}`, { cookie: await app.cookieFor(IDS.admin) });
    expect(res.status).toBe(200);
    const logs = await app.db.query(`SELECT count(*)::int AS n FROM audit_logs WHERE user_email = 'alice@test.gob'`);
    expect(logs[0].n).toBeGreaterThan(0);
  });
});
