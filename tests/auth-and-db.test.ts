import { beforeEach, describe, expect, it } from 'vitest';
import { totpAt } from '../server/crypto.js';
import { IDS, PASSWORDS, PROJECT_B, TRASHED, TestApp, cookieHeaderFrom, createTestApp } from './helpers.js';

let app: TestApp;

beforeEach(async () => {
  app = await createTestApp();
});

describe('Login con contraseña', () => {
  it('emite cookie httpOnly/Secure/SameSite y no devuelve secretos', async () => {
    const res = await app.call('POST', '/auth/login', { body: { email: 'alice@test.gob', password: PASSWORDS.alice } });
    expect(res.status).toBe(200);
    const cookie = res.cookies.find((c) => c.startsWith('ps_session='))!;
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Strict');
    expect(JSON.stringify(res.json)).not.toMatch(/"(password_?hash|totp_?secret|reset_?code|reset_code_hash)"/i);
    const me = await app.call('GET', '/auth/me', { cookie: cookieHeaderFrom(res) });
    expect(me.json.user.email).toBe('alice@test.gob');
  });

  it('bloquea la cuenta tras 5 intentos fallidos', async () => {
    for (let i = 0; i < 5; i++) {
      const r = await app.call('POST', '/auth/login', { body: { email: 'alice@test.gob', password: 'mala-clave' } });
      expect(r.status).toBe(401);
    }
    const locked = await app.call('POST', '/auth/login', { body: { email: 'alice@test.gob', password: PASSWORDS.alice } });
    expect(locked.status).toBe(429);
  });

  it('no acepta contraseñas guardadas en texto plano', async () => {
    await app.db.query(`UPDATE app_users SET password_hash = 'textoplano' WHERE id = $1`, [IDS.bob]);
    const r = await app.call('POST', '/auth/login', { body: { email: 'bob@test.gob', password: 'textoplano' } });
    expect(r.status).toBe(401);
  });
});

describe('Código de 6 dígitos', () => {
  it('el código migrado habilita solo el cambio de contraseña', async () => {
    const login = await app.call('POST', '/auth/login', { body: { email: 'dave@test.gob', password: '123456' } });
    expect(login.status).toBe(200);
    expect(login.json.mustChangePassword).toBe(true);
    const restricted = cookieHeaderFrom(login);
    expect((await app.call('GET', '/projects', { cookie: restricted })).status).toBe(401);
    expect((await app.call('GET', '/auth/me', { cookie: restricted })).status).toBe(401);

    const change = await app.call('POST', '/auth/change-password', {
      cookie: restricted,
      body: { code: '123456', newPassword: 'NuevaClave123' }
    });
    expect(change.status).toBe(200);
    expect((await app.call('GET', '/projects', { cookie: cookieHeaderFrom(change) })).status).toBe(200);

    // El código queda invalidado.
    const again = await app.call('POST', '/auth/login', { body: { email: 'dave@test.gob', password: '123456' } });
    expect(again.status).toBe(401);
    const withNew = await app.call('POST', '/auth/login', { body: { email: 'dave@test.gob', password: 'NuevaClave123' } });
    expect(withNew.status).toBe(200);
  });

  it('el código generado por el admin se guarda hasheado', async () => {
    const res = await app.call('POST', `/users/${IDS.bob}/reset-code`, { cookie: await app.cookieFor(IDS.admin), body: {} });
    expect(res.json.code).toMatch(/^\d{6}$/);
    const row = await app.db.query(`SELECT reset_code, reset_code_hash FROM app_users WHERE id = $1`, [IDS.bob]);
    expect(row[0].reset_code).toBeNull();
    expect(row[0].reset_code_hash).not.toContain(res.json.code);
  });
});

describe('Doble factor (TOTP)', () => {
  const SECRET = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';

  beforeEach(async () => {
    await app.db.query(`UPDATE app_users SET totp_secret = $2, is_totp_enabled = TRUE WHERE id = $1`, [IDS.admin, SECRET]);
  });

  it('la contraseña sola no abre sesión de administrador', async () => {
    const login = await app.call('POST', '/auth/login', { body: { email: 'admin@test.gob', password: PASSWORDS.admin } });
    expect(login.json.requiresTotp).toBe(true);
    expect(login.cookies.some((c) => c.startsWith('ps_session='))).toBe(false);

    const twoFa = cookieHeaderFrom(login, 'ps_2fa');
    // La cookie de 2FA no sirve como sesión.
    expect((await app.call('GET', '/auth/me', { cookie: twoFa.replace('ps_2fa', 'ps_session') })).status).toBe(401);

    const bad = await app.call('POST', '/auth/totp/verify', { cookie: twoFa, body: { code: '000000' } });
    expect(bad.status).toBe(401);
    const code = totpAt(SECRET, Math.floor(app.now.value / 1000 / 30));
    const ok = await app.call('POST', '/auth/totp/verify', { cookie: twoFa, body: { code } });
    expect(ok.status).toBe(200);
    expect((await app.call('GET', '/audit', { cookie: cookieHeaderFrom(ok) })).status).toBe(200);
  });

  it('el ingreso con código de 6 dígitos también exige TOTP', async () => {
    const issued = await app.call('POST', `/users/${IDS.admin}/reset-code`, { cookie: await app.cookieFor(IDS.admin), body: {} });
    const login = await app.call('POST', '/auth/login', { body: { email: 'admin@test.gob', password: issued.json.code } });
    expect(login.json.requiresTotp).toBe(true);
    expect(login.json.mustChangePassword).toBeUndefined();
  });

  it('sin el desafío previo no se puede verificar un TOTP', async () => {
    const res = await app.call('POST', '/auth/totp/verify', { body: { code: '123456', userId: IDS.admin } });
    expect(res.status).toBe(401);
  });
});

describe('Login con Google', () => {
  const fakeGoogle = (aud: string, email: string): typeof fetch =>
    (async (url: string) => {
      if (String(url).includes('tokeninfo')) {
        return new Response(JSON.stringify({ aud, email, email_verified: 'true', sub: 'g-123' }), { status: 200 });
      }
      return new Response(JSON.stringify({ name: 'Nombre Google' }), { status: 200 });
    }) as any;

  it('rechaza tokens emitidos para otra aplicación', async () => {
    const res = await app.call('POST', '/auth/google', {
      body: { accessToken: 'tok' },
      fetchFn: fakeGoogle('otra-app.apps.googleusercontent.com', 'alice@test.gob')
    });
    expect(res.status).toBe(401);
  });

  it('acepta un token válido de un usuario habilitado', async () => {
    const res = await app.call('POST', '/auth/google', {
      body: { accessToken: 'tok' },
      fetchFn: fakeGoogle('test-client.apps.googleusercontent.com', 'alice@test.gob')
    });
    expect(res.status).toBe(200);
    expect(res.json.user.email).toBe('alice@test.gob');
  });

  it('informa "no registrado" para correos no habilitados', async () => {
    const res = await app.call('POST', '/auth/google', {
      body: { accessToken: 'tok' },
      fetchFn: fakeGoogle('test-client.apps.googleusercontent.com', 'nadie@test.gob')
    });
    expect(res.status).toBe(403);
    expect(res.json.notRegistered).toBe(true);
  });
});

describe('Migraciones', () => {
  it('asignan propietario y conservan accesos por nombre', async () => {
    const rows = await app.db.query(`SELECT owner_user_id::text AS o FROM process_projects WHERE file_name = $1`, [PROJECT_B]);
    expect(rows[0].o).toBe(IDS.eve);
  });

  it('mueven la papelera fuera del catálogo y eliminan códigos en texto plano', async () => {
    const trash = await app.db.query(`SELECT owner_user_id::text AS o FROM process_project_trash WHERE file_name = $1`, [TRASHED]);
    expect(trash[0].o).toBe(IDS.alice);
    const cat = await app.db.query(`SELECT payload FROM app_master_catalogs`);
    expect(cat[0].payload.deletedProjects).toBeUndefined();
    const codes = await app.db.query(`SELECT count(*)::int AS n FROM app_users WHERE reset_code IS NOT NULL`);
    expect(codes[0].n).toBe(0);
  });

  it('son idempotentes', async () => {
    const { readFileSync } = await import('node:fs');
    const { fileURLToPath } = await import('node:url');
    for (const m of ['001_schema_consolidation.sql', '002_preserve_name_based_access.sql', '003_app_role.sql', '004_audit_append_only.sql']) {
      const path = fileURLToPath(new URL(`../db/migrations/${m}`, import.meta.url));
      await app.pg.exec(readFileSync(path, 'utf8'));
    }
  });
});

describe('audit_logs append-only y rol de aplicación', () => {
  it('UPDATE, DELETE y TRUNCATE fallan incluso para el dueño', async () => {
    await expect(app.pg.query(`UPDATE audit_logs SET user_email = 'x'`)).rejects.toThrow(/solo inserción/);
    await expect(app.pg.query(`DELETE FROM audit_logs`)).rejects.toThrow(/solo inserción/);
    await expect(app.pg.query(`TRUNCATE audit_logs`)).rejects.toThrow(/solo inserción/);
    await app.pg.query(`INSERT INTO audit_logs (user_email, user_role, action_type) VALUES ('a', 'USER', 'X')`);
  });

  it('el rol de aplicación no tiene DDL ni UPDATE/DELETE sobre la auditoría', async () => {
    await app.pg.exec(`SET ROLE processtudio_app`);
    try {
      await app.pg.query(`INSERT INTO audit_logs (user_email, user_role, action_type) VALUES ('a', 'USER', 'X')`);
      await app.pg.query(`SELECT count(*) FROM process_projects`);
      await expect(app.pg.query(`UPDATE audit_logs SET user_email = 'x'`)).rejects.toThrow(/permission denied/);
      await expect(app.pg.query(`DELETE FROM audit_logs`)).rejects.toThrow(/permission denied/);
      await expect(app.pg.query(`CREATE TABLE intruso (id int)`)).rejects.toThrow(/permission denied/);
      await expect(app.pg.query(`DROP TABLE process_projects`)).rejects.toThrow(/must be owner|permission denied/);
    } finally {
      await app.pg.exec(`RESET ROLE`);
    }
  });
});
