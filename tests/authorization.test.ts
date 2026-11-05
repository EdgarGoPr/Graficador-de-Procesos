import { beforeEach, describe, expect, it } from 'vitest';
import { IDS, PROJECT_A, PROJECT_B, TRASHED, TestApp, createTestApp, sampleProject } from './helpers.js';

let app: TestApp;

beforeEach(async () => {
  app = await createTestApp();
});

const SENSITIVE_KEYS = ['passwordHash', 'password_hash', 'totpSecret', 'totp_secret', 'resetCode', 'reset_code', 'reset_code_hash'];

function expectNoSecrets(value: unknown) {
  const text = JSON.stringify(value);
  for (const key of SENSITIVE_KEYS) expect(text).not.toContain(`"${key}"`);
}

describe('Sesión', () => {
  it('sin cookie todas las rutas protegidas responden 401', async () => {
    for (const [method, path] of [
      ['GET', '/projects'],
      ['GET', `/projects/${PROJECT_A}`],
      ['PUT', `/projects/${PROJECT_A}`],
      ['DELETE', `/projects/${PROJECT_A}`],
      ['GET', '/users'],
      ['GET', '/audit'],
      ['GET', '/catalogs'],
      ['GET', '/auth/me']
    ]) {
      const res = await app.call(method, path, { body: { project: sampleProject('x') } });
      expect(res.status, `${method} ${path}`).toBe(401);
    }
  });

  it('una cookie alterada o firmada con otra clave es rechazada', async () => {
    const good = await app.cookieFor(IDS.alice);
    const tampered = good.slice(0, -4) + (good.endsWith('AAAA') ? 'BBBB' : 'AAAA');
    expect((await app.call('GET', '/projects', { cookie: tampered })).status).toBe(401);
    expect((await app.call('GET', '/projects', { cookie: 'ps_session=eyJhbGciOiJub25lIn0.eyJzdWIiOiJ4In0.' })).status).toBe(401);
  });

  it('un usuario desactivado pierde la sesión al instante', async () => {
    const aliceCookie = await app.cookieFor(IDS.alice);
    expect((await app.call('GET', '/projects', { cookie: aliceCookie })).status).toBe(200);
    const admin = await app.cookieFor(IDS.admin);
    expect((await app.call('PATCH', `/users/${IDS.alice}/status`, { cookie: admin, body: { status: 'INACTIVE' } })).status).toBe(200);
    expect((await app.call('GET', '/projects', { cookie: aliceCookie })).status).toBe(401);
  });

  it('un usuario inactivo no puede usar una cookie válida', async () => {
    expect((await app.call('GET', '/auth/me', { cookie: await app.cookieFor(IDS.frank) })).status).toBe(401);
  });

  it('las respuestas de sesión y de usuarios no exponen secretos', async () => {
    const me = await app.call('GET', '/auth/me', { cookie: await app.cookieFor(IDS.admin) });
    expect(me.status).toBe(200);
    expectNoSecrets(me.json);
    const users = await app.call('GET', '/users', { cookie: await app.cookieFor(IDS.admin) });
    expectNoSecrets(users.json);
    const dir = await app.call('GET', '/users', { cookie: await app.cookieFor(IDS.dave) });
    expectNoSecrets(dir.json);
    expect(Object.keys(dir.json.users[0]).sort()).toEqual(['email', 'fullName', 'id', 'organizationUnit', 'role', 'status']);
  });
});

describe('Proyectos: un USER sin permiso no puede leer ni modificar', () => {
  it('no ve el proyecto en el listado y recibe 404 al leer, guardar o borrar', async () => {
    const dave = await app.cookieFor(IDS.dave);
    const list = await app.call('GET', '/projects', { cookie: dave });
    expect(list.json.projects.map((p: any) => p.fileName)).not.toContain(PROJECT_A);
    expect((await app.call('GET', `/projects/${PROJECT_A}`, { cookie: dave })).status).toBe(404);
    expect((await app.call('PUT', `/projects/${PROJECT_A}`, { cookie: dave, body: { project: sampleProject('hack') } })).status).toBe(404);
    expect((await app.call('DELETE', `/projects/${PROJECT_A}`, { cookie: dave })).status).toBe(404);
    expect((await app.call('GET', `/projects/${PROJECT_A}/participants`, { cookie: dave })).status).toBe(404);
    expect((await app.call('POST', `/locks/${PROJECT_A}`, { cookie: dave, body: {} })).status).toBe(404);
    const stored = await app.db.query(`SELECT document_title FROM process_projects WHERE file_name = $1`, [PROJECT_A]);
    expect(stored[0].document_title).toBe('Proyecto de Alice');
  });

  it('no puede autoasignarse permisos sobre un proyecto ajeno', async () => {
    const dave = await app.cookieFor(IDS.dave);
    const res = await app.call('PUT', `/projects/${PROJECT_A}/participants/${IDS.dave}`, {
      cookie: dave,
      body: { permissionLevel: 'EDITOR' }
    });
    expect(res.status).toBe(404);
    const perms = await app.db.query(`SELECT 1 FROM project_members WHERE user_id = $1`, [IDS.dave]);
    expect(perms).toHaveLength(0);
  });

  it('no puede crear una "nueva versión" de un proyecto ajeno', async () => {
    const res = await app.call('PUT', '/projects/2026-02-01_proc-copia-v2.0.json', {
      cookie: await app.cookieFor(IDS.dave),
      body: { project: sampleProject('copia'), sourceFileName: PROJECT_A }
    });
    expect(res.status).toBe(404);
  });
});

describe('Proyectos: niveles de permiso', () => {
  it('Solo lectura: puede leer pero no guardar, borrar, gestionar ni bloquear', async () => {
    const bob = await app.cookieFor(IDS.bob);
    const read = await app.call('GET', `/projects/${PROJECT_A}`, { cookie: bob });
    expect(read.status).toBe(200);
    expect(read.json.access.permission).toBe('READ_ONLY');
    expect((await app.call('PUT', `/projects/${PROJECT_A}`, { cookie: bob, body: { project: sampleProject('x') } })).status).toBe(403);
    expect((await app.call('DELETE', `/projects/${PROJECT_A}`, { cookie: bob })).status).toBe(403);
    expect((await app.call('PUT', `/projects/${PROJECT_A}/participants/${IDS.dave}`, { cookie: bob, body: { permissionLevel: 'READ_ONLY' } })).status).toBe(403);
    expect((await app.call('POST', `/locks/${PROJECT_A}`, { cookie: bob, body: {} })).status).toBe(403);
  });

  it('Comentarios: solo se guardan las notas adhesivas', async () => {
    const carol = await app.cookieFor(IDS.carol);
    const tampered = sampleProject('Título cambiado', {}, [
      { id: 'start', type: 'StartEvent', position: { x: 0, y: 0 }, data: { label: 'Inicio' } },
      { id: 'task1', type: 'Task', position: { x: 999, y: 999 }, data: { label: 'HACKEADO' } },
      { id: 'note1', type: 'StickyNote', position: { x: 5, y: 5 }, data: { label: 'Mi comentario' } }
    ]);
    tampered.edges = [{ id: 'e-note', source: 'note1', target: 'task1' }];
    const res = await app.call('PUT', `/projects/${PROJECT_A}`, { cookie: carol, body: { project: tampered } });
    expect(res.status).toBe(200);

    const rows = await app.db.query(`SELECT graph_data, document_title FROM process_projects WHERE file_name = $1`, [PROJECT_A]);
    const graph = rows[0].graph_data;
    expect(rows[0].document_title).toBe('Proyecto de Alice');
    const task = graph.nodes.find((n: any) => n.id === 'task1');
    expect(task.data.label).toBe('Revisar');
    expect(task.position.x).toBe(100);
    expect(graph.nodes.some((n: any) => n.id === 'note1')).toBe(true);
    expect(graph.edges.map((e: any) => e.id).sort()).toEqual(['e-note', 'e1']);
  });

  it('Propietario: guarda, gestiona participantes y elimina (a la papelera)', async () => {
    const alice = await app.cookieFor(IDS.alice);
    const save = await app.call('PUT', `/projects/${PROJECT_A}`, {
      cookie: alice,
      body: { project: sampleProject('Proyecto de Alice v2', { createdByUserId: IDS.dave }) }
    });
    expect(save.status).toBe(200);
    const stored = await app.db.query(`SELECT graph_data FROM process_projects WHERE file_name = $1`, [PROJECT_A]);
    expect(stored[0].graph_data.documentControl.createdByUserId).toBe(IDS.alice);

    expect((await app.call('PUT', `/projects/${PROJECT_A}/participants/${IDS.dave}`, { cookie: alice, body: { permissionLevel: 'READ_ONLY' } })).status).toBe(200);
    expect((await app.call('GET', `/projects/${PROJECT_A}`, { cookie: await app.cookieFor(IDS.dave) })).status).toBe(200);

    expect((await app.call('DELETE', `/projects/${PROJECT_A}`, { cookie: alice })).status).toBe(200);
    const trash = await app.db.query(`SELECT 1 FROM process_project_trash WHERE file_name = $1`, [PROJECT_A]);
    expect(trash).toHaveLength(1);
  });

  it('Editor no propietario: guarda pero no elimina', async () => {
    const admin = await app.cookieFor(IDS.admin);
    await app.call('PUT', `/projects/${PROJECT_A}/participants/${IDS.dave}`, { cookie: admin, body: { permissionLevel: 'EDITOR' } });
    const dave = await app.cookieFor(IDS.dave);
    expect((await app.call('PUT', `/projects/${PROJECT_A}`, { cookie: dave, body: { project: sampleProject('Editado') } })).status).toBe(200);
    expect((await app.call('DELETE', `/projects/${PROJECT_A}`, { cookie: dave })).status).toBe(403);
  });

  it('Nueva versión: los participantes conservan su acceso', async () => {
    const alice = await app.cookieFor(IDS.alice);
    const v2 = '2026-02-01_1200_proc-alice-v1.1.json';
    const res = await app.call('PUT', `/projects/${v2}`, {
      cookie: alice,
      body: { project: sampleProject('Proyecto de Alice', { version: '1.1' }), sourceFileName: PROJECT_A }
    });
    expect(res.status).toBe(200);
    const bobRead = await app.call('GET', `/projects/${v2}`, { cookie: await app.cookieFor(IDS.bob) });
    expect(bobRead.status).toBe(200);
    expect(bobRead.json.access.permission).toBe('READ_ONLY');
  });

  it('ADMIN accede a todo', async () => {
    const admin = await app.cookieFor(IDS.admin);
    const list = await app.call('GET', '/projects', { cookie: admin });
    expect(list.json.projects).toHaveLength(2);
    expect((await app.call('GET', `/projects/${PROJECT_B}`, { cookie: admin })).status).toBe(200);
  });
});

describe('Endpoints de administración', () => {
  it('un USER recibe 403', async () => {
    const dave = await app.cookieFor(IDS.dave);
    const checks: Array<[string, string, unknown?]> = [
      ['GET', '/audit'],
      ['GET', '/permissions'],
      ['GET', '/presence'],
      ['GET', '/access-requests'],
      ['POST', '/users', { email: 'x@y.com', fullName: 'X', organizationUnit: 'Y', role: 'ADMIN', status: 'ACTIVE', passwordMode: 'GENERATE_CODE' }],
      ['PATCH', `/users/${IDS.dave}`, { fullName: 'Dave', organizationUnit: 'Calidad', role: 'ADMIN', status: 'ACTIVE' }],
      ['PATCH', `/users/${IDS.alice}/status`, { status: 'BLOCKED' }],
      ['POST', `/users/${IDS.alice}/reset-code`, {}],
      ['DELETE', `/users/${IDS.alice}`],
      ['PUT', '/catalogs', { payload: { orgUnits: [] } }],
      ['POST', '/auth/totp/setup', {}]
    ];
    for (const [method, path, body] of checks) {
      const res = await app.call(method, path, { cookie: dave, body });
      expect(res.status, `${method} ${path}`).toBe(403);
    }
    const daveRow = await app.db.query(`SELECT role FROM app_users WHERE id = $1`, [IDS.dave]);
    expect(daveRow[0].role).toBe('USER');
  });

  it('el cliente no puede falsificar eventos de auditoría del servidor', async () => {
    const dave = await app.cookieFor(IDS.dave);
    expect((await app.call('POST', '/audit/events', { cookie: dave, body: { actionType: 'AUTH_LOGIN_SUCCESS' } })).status).toBe(400);
    expect((await app.call('POST', '/audit/events', { cookie: dave, body: { actionType: 'CATALOG_ITEM_DELETED' } })).status).toBe(403);
    expect((await app.call('POST', '/audit/events', { cookie: dave, body: { actionType: 'CANVAS_EXPORT_GENERATED', targetResource: PROJECT_A } })).status).toBe(200);
    const rows = await app.db.query(`SELECT user_email, user_role FROM audit_logs WHERE action_type = 'CANVAS_EXPORT_GENERATED'`);
    expect(rows[0]).toEqual({ user_email: 'dave@test.gob', user_role: 'USER' });
  });

  it('el administrador no puede degradarse ni desactivarse a sí mismo', async () => {
    const admin = await app.cookieFor(IDS.admin);
    const res = await app.call('PATCH', `/users/${IDS.admin}`, {
      cookie: admin,
      body: { fullName: 'Admin', organizationUnit: 'X', role: 'USER', status: 'ACTIVE' }
    });
    expect(res.status).toBe(400);
  });

  it('valida el formato del correo al dar de alta', async () => {
    const res = await app.call('POST', '/users', {
      cookie: await app.cookieFor(IDS.admin),
      body: { email: 'prueba@prueba', fullName: 'X', organizationUnit: 'Y', role: 'USER', status: 'ACTIVE', passwordMode: 'GENERATE_CODE' }
    });
    expect(res.status).toBe(400);
  });
});

describe('Papelera', () => {
  it('cada usuario solo ve y restaura lo propio', async () => {
    const dave = await app.cookieFor(IDS.dave);
    const daveTrash = await app.call('GET', '/trash', { cookie: dave });
    expect(daveTrash.json.entries).toHaveLength(0);
    expect((await app.call('POST', `/trash/${TRASHED}/restore`, { cookie: dave, body: {} })).status).toBe(404);
    expect((await app.call('DELETE', `/trash/${TRASHED}`, { cookie: dave })).status).toBe(404);

    const alice = await app.cookieFor(IDS.alice);
    const aliceTrash = await app.call('GET', '/trash', { cookie: alice });
    expect(aliceTrash.json.entries.map((e: any) => e.fileName)).toEqual([TRASHED]);
    expectNoSecrets(aliceTrash.json);
    expect(JSON.stringify(aliceTrash.json)).not.toContain('projectData');
    expect((await app.call('POST', `/trash/${TRASHED}/restore`, { cookie: alice, body: {} })).status).toBe(200);
    expect((await app.call('GET', `/projects/${TRASHED}`, { cookie: alice })).status).toBe(200);
  });

  it('el catálogo ya no contiene proyectos borrados', async () => {
    const cat = await app.call('GET', '/catalogs', { cookie: await app.cookieFor(IDS.dave) });
    expect(cat.json.payload.deletedProjects).toBeUndefined();
    expect(cat.json.deletedProjects).toEqual([]);
  });
});

describe('Protección CSRF', () => {
  it('rechaza peticiones de otro origen o sin JSON', async () => {
    const alice = await app.cookieFor(IDS.alice);
    const evil = await app.call('DELETE', `/projects/${PROJECT_A}`, { cookie: alice, headers: { origin: 'https://evil.example' } });
    expect(evil.status).toBe(403);
    const form = await app.call('DELETE', `/projects/${PROJECT_A}`, { cookie: alice, headers: { 'content-type': 'text/plain' } });
    expect(form.status).toBe(403);
    const cross = await app.call('DELETE', `/projects/${PROJECT_A}`, { cookie: alice, headers: { 'sec-fetch-site': 'cross-site' } });
    expect(cross.status).toBe(403);
  });
});
