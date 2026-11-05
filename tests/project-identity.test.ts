import type { PGlite } from '@electric-sql/pglite';
import { describe, expect, it } from 'vitest';
import { IDS, PROJECT_A, PROJECT_B, TRASHED, createTestApp, sampleProject } from './helpers.js';

const V2_A = '2026-02-01_1200_proc-alice-v1.1.json';

async function projectIdOf(app: Awaited<ReturnType<typeof createTestApp>>, fileName: string): Promise<string> {
  const rows = await app.db.query(`SELECT project_id::text AS id FROM process_projects WHERE file_name = $1`, [fileName]);
  return rows[0]?.id;
}

/** Versiones extra cargadas ANTES de la migración 006 (estado heredado). */
async function legacyVersions(pg: PGlite) {
  const insert = (file: string, code: string, title: string, updatedAt: string) =>
    pg.query(
      `INSERT INTO process_projects (file_name, document_code, document_title, author_name, organization_unit, graph_data, updated_at)
       VALUES ($1, $2, $3, 'Alice', 'Calidad', $4::jsonb, $5)`,
      [file, code, title, JSON.stringify(sampleProject(title, { documentCode: code, updatedAt, createdByUserId: IDS.alice })), updatedAt]
    );
  // Segunda versión del proyecto de Alice (mismo código y propietario).
  await insert(V2_A, 'PRC-1000', 'Proyecto de Alice', '2026-02-01T12:00:00.000Z');
  // Copia hecha con el "Duplicar" anterior: código -CPY → debe quedar como proyecto aparte.
  await insert('2026-02-02_proc-alice-copia-v1.0.json', 'PRC-1000-CPY', 'Proyecto de Alice (Copia)', '2026-02-02T09:00:00.000Z');
  // Permiso de Bob sobre la v2 con más nivel que sobre la v1 → queda el más alto.
  await pg.query(`INSERT INTO project_user_permissions (user_id, project_file_name, permission_level) VALUES ($1, $2, 'EDITOR')`, [
    IDS.bob,
    V2_A
  ]);
}

describe('Migración 006: identidad de proyecto', () => {
  it('no borra nada y agrupa versiones por proyecto', async () => {
    const app = await createTestApp({ extraSeed: legacyVersions });
    const versions = await app.db.query(`SELECT count(*)::int AS n FROM process_projects`);
    expect(versions[0].n).toBe(4); // A, B, A v1.1 y la copia
    const oldPerms = await app.db.query(`SELECT count(*)::int AS n FROM project_user_permissions`);
    expect(oldPerms[0].n).toBe(3); // la tabla anterior queda intacta

    expect(await projectIdOf(app, PROJECT_A)).toBe(await projectIdOf(app, V2_A));
    expect(await projectIdOf(app, PROJECT_A)).not.toBe(await projectIdOf(app, PROJECT_B));
    expect(await projectIdOf(app, '2026-02-02_proc-alice-copia-v1.0.json')).not.toBe(await projectIdOf(app, PROJECT_A));
  });

  it('pasa los permisos al proyecto conservando el nivel más alto', async () => {
    const app = await createTestApp({ extraSeed: legacyVersions });
    const pid = await projectIdOf(app, PROJECT_A);
    const rows = await app.db.query(
      `SELECT user_id::text AS u, permission_level AS l FROM project_members WHERE project_id::text = $1 ORDER BY l`,
      [pid]
    );
    expect(rows).toEqual([
      { u: IDS.carol, l: 'COMMENTS' },
      { u: IDS.bob, l: 'EDITOR' }
    ]);
  });

  it('restaura la fecha real de última modificación y retira el trigger que la pisaba', async () => {
    const app = await createTestApp({ baseline: 'scripts', extraSeed: legacyVersions });
    const rows = await app.db.query(`SELECT updated_at FROM process_projects WHERE file_name = $1`, [V2_A]);
    expect(new Date(rows[0].updated_at).toISOString()).toBe('2026-02-01T12:00:00.000Z');
    const trig = await app.db.query(`SELECT count(*)::int AS n FROM pg_trigger WHERE tgname = 'trg_process_projects_updated_at'`);
    expect(trig[0].n).toBe(0);
  });

  it('si hubiera códigos repetidos entre proyectos distintos, se cancela sin aplicar cambios', async () => {
    const conflicting = async (pg: PGlite) => {
      await pg.query(
        `INSERT INTO process_projects (file_name, document_code, document_title, author_name, organization_unit, graph_data)
         VALUES ('2026-03-01_proc-otro-v1.0.json', 'PRC-1000', 'Otro proyecto', 'Bob Lector', 'Calidad', $1::jsonb)`,
        [JSON.stringify(sampleProject('Otro proyecto', { createdByUserId: IDS.bob }))]
      );
    };
    await expect(createTestApp({ extraSeed: conflicting })).rejects.toThrow();
  });
});

describe('Código documental único', () => {
  it('no se puede poner a un proyecto el código de otro (y el otro no se oculta)', async () => {
    const app = await createTestApp();
    const alice = await app.cookieFor(IDS.alice);
    const res = await app.call('PUT', `/projects/${PROJECT_A}`, {
      cookie: alice,
      body: { project: sampleProject('Proyecto de Alice', { documentCode: 'PRC-2000' }) }
    });
    expect(res.status).toBe(409);
    expect(res.json.error).toContain('PRC-2000');
    expect(res.json.error).toContain('Proyecto de Eve');
    const a = await app.db.query(`SELECT document_code FROM process_projects WHERE file_name = $1`, [PROJECT_A]);
    expect(a[0].document_code).toBe('PRC-1000');
    const list = await app.call('GET', '/projects', { cookie: await app.cookieFor(IDS.admin) });
    const ids = new Set(list.json.projects.map((p: any) => p.projectId));
    expect(ids.size).toBe(2);
  });

  it('cambiar el código lo actualiza en todas las versiones sin alterar sus fechas', async () => {
    const app = await createTestApp({ extraSeed: legacyVersions });
    const alice = await app.cookieFor(IDS.alice);
    const before = await app.db.query(`SELECT updated_at FROM process_projects WHERE file_name = $1`, [V2_A]);
    const res = await app.call('PUT', `/projects/${PROJECT_A}`, {
      cookie: alice,
      body: { project: sampleProject('Proyecto de Alice', { documentCode: 'PRC-7777' }) }
    });
    expect(res.status).toBe(200);
    const rows = await app.db.query(
      `SELECT file_name, document_code, graph_data -> 'documentControl' ->> 'documentCode' AS graph_code, updated_at
         FROM process_projects WHERE project_id::text = $1`,
      [await projectIdOf(app, PROJECT_A)]
    );
    expect(rows.every((r) => r.document_code === 'PRC-7777' && r.graph_code === 'PRC-7777')).toBe(true);
    const v2 = rows.find((r) => r.file_name === V2_A)!;
    expect(new Date(v2.updated_at).getTime()).toBe(new Date(before[0].updated_at).getTime());
  });

  it('un proyecto nuevo recibe un código correlativo propio del servidor', async () => {
    const app = await createTestApp();
    const res = await app.call('PUT', '/projects/2026-04-01_proc-nuevo-v1.0.json', {
      cookie: await app.cookieFor(IDS.dave),
      body: { project: sampleProject('Nuevo', { documentCode: '' }) }
    });
    expect(res.status).toBe(200);
    expect(res.json.documentCode).toBe('PRC-2001');
    expect(res.json.projectId).not.toBe(await projectIdOf(app, PROJECT_A));
  });

  it('importar o duplicar con un código ya usado asigna uno libre e informa el cambio', async () => {
    const app = await createTestApp();
    const res = await app.call('PUT', '/projects/2026-04-02_proc-alice-copia-v1.0.json', {
      cookie: await app.cookieFor(IDS.alice),
      body: { project: sampleProject('Proyecto de Alice (Copia)', { documentCode: 'PRC-1000' }) }
    });
    expect(res.status).toBe(200);
    expect(res.json.codeReassignedFrom).toBe('PRC-1000');
    expect(res.json.documentCode).not.toBe('PRC-1000');
    expect(res.json.projectId).not.toBe(await projectIdOf(app, PROJECT_A));
  });

  it('una nueva versión pertenece al mismo proyecto y conserva su código', async () => {
    const app = await createTestApp();
    const res = await app.call('PUT', `/projects/${V2_A}`, {
      cookie: await app.cookieFor(IDS.alice),
      body: { project: sampleProject('Proyecto de Alice', { version: '1.1', documentCode: 'OTRO' }), sourceFileName: PROJECT_A }
    });
    expect(res.status).toBe(200);
    expect(res.json.projectId).toBe(await projectIdOf(app, PROJECT_A));
    expect(res.json.documentCode).toBe('PRC-1000');
  });
});

describe('Participantes: propietario y último editor', () => {
  it('el propietario aparece fijo y no puede quitarse ni bajar su nivel (ni siquiera un ADMIN)', async () => {
    const app = await createTestApp();
    const alice = await app.cookieFor(IDS.alice);
    const list = await app.call('GET', `/projects/${PROJECT_A}/participants`, { cookie: alice });
    expect(list.json.participants.find((p: any) => p.isOwner)?.userId).toBe(IDS.alice);

    expect((await app.call('DELETE', `/projects/${PROJECT_A}/participants/${IDS.alice}`, { cookie: alice, body: {} })).status).toBe(400);
    expect(
      (await app.call('PUT', `/projects/${PROJECT_A}/participants/${IDS.alice}`, { cookie: alice, body: { permissionLevel: 'READ_ONLY' } })).status
    ).toBe(400);
    const admin = await app.cookieFor(IDS.admin);
    expect((await app.call('DELETE', `/projects/${PROJECT_A}/participants/${IDS.alice}`, { cookie: admin, body: {} })).status).toBe(400);
  });

  it('un proyecto sin propietario no puede quedar sin editor', async () => {
    const app = await createTestApp();
    const pid = await projectIdOf(app, PROJECT_A);
    await app.db.query(`UPDATE projects SET owner_user_id = NULL WHERE project_id::text = $1`, [pid]);
    const admin = await app.cookieFor(IDS.admin);
    await app.call('PUT', `/projects/${PROJECT_A}/participants/${IDS.dave}`, { cookie: admin, body: { permissionLevel: 'EDITOR' } });

    expect((await app.call('DELETE', `/projects/${PROJECT_A}/participants/${IDS.dave}`, { cookie: admin, body: {} })).status).toBe(400);
    expect(
      (await app.call('PUT', `/projects/${PROJECT_A}/participants/${IDS.dave}`, { cookie: admin, body: { permissionLevel: 'COMMENTS' } })).status
    ).toBe(400);

    await app.call('PUT', `/projects/${PROJECT_A}/participants/${IDS.bob}`, { cookie: admin, body: { permissionLevel: 'EDITOR' } });
    expect((await app.call('DELETE', `/projects/${PROJECT_A}/participants/${IDS.dave}`, { cookie: admin, body: {} })).status).toBe(200);
  });

  it('el permiso es del proyecto: vale para todas sus versiones', async () => {
    const app = await createTestApp({ extraSeed: legacyVersions });
    const carol = await app.cookieFor(IDS.carol); // COMMENTS sobre la v1 → ahora sobre el proyecto
    const read = await app.call('GET', `/projects/${V2_A}`, { cookie: carol });
    expect(read.status).toBe(200);
    expect(read.json.access.permission).toBe('COMMENTS');
  });
});

describe('Papelera con identidad de proyecto', () => {
  it('eliminar una versión no borra el proyecto y restaurarla la devuelve a él', async () => {
    const app = await createTestApp({ extraSeed: legacyVersions });
    const alice = await app.cookieFor(IDS.alice);
    const pid = await projectIdOf(app, PROJECT_A);
    expect((await app.call('DELETE', `/projects/${V2_A}`, { cookie: alice, body: {} })).status).toBe(200);
    const proj = await app.db.query(`SELECT count(*)::int AS n FROM projects WHERE project_id::text = $1`, [pid]);
    expect(proj[0].n).toBe(1);
    expect((await app.call('POST', `/trash/${V2_A}/restore`, { cookie: alice, body: {} })).status).toBe(200);
    expect(await projectIdOf(app, V2_A)).toBe(pid);
  });

  it('restaurar un proyecto heredado de la papelera le crea su identidad', async () => {
    const app = await createTestApp();
    const res = await app.call('POST', `/trash/${TRASHED}/restore`, { cookie: await app.cookieFor(IDS.alice), body: {} });
    expect(res.status).toBe(200);
    expect(await projectIdOf(app, TRASHED)).toBeTruthy();
  });
});
