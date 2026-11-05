import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import { pg_trgm } from '@electric-sql/pglite/contrib/pg_trgm';
import { handleApiRequest } from '../server/app.js';
import type { ServerConfig } from '../server/config.js';
import { hashPassword } from '../server/crypto.js';
import type { Db } from '../server/db.js';
import type { ApiResponse } from '../server/http.js';
import { signToken } from '../server/session.js';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
export const MIGRATIONS = [
  '001_schema_consolidation.sql',
  '002_preserve_name_based_access.sql',
  '003_app_role.sql',
  '004_audit_append_only.sql',
  '005_sessions_rate_limit.sql'
];

export const IDS = {
  admin: '00000000-0000-4000-8000-000000000001',
  alice: '00000000-0000-4000-8000-000000000002',
  bob: '00000000-0000-4000-8000-000000000003',
  carol: '00000000-0000-4000-8000-000000000004',
  dave: '00000000-0000-4000-8000-000000000005',
  eve: '00000000-0000-4000-8000-000000000006',
  frank: '00000000-0000-4000-8000-000000000007'
};

export const PROJECT_A = '2026-01-01_proc-alice-v1.0.json';
export const PROJECT_B = '2026-01-02_proc-eve-v1.0.json';
export const TRASHED = '2026-01-03_proc-borrado-v1.0.json';

export function sampleProject(title: string, extra: Record<string, unknown> = {}, nodes: any[] = defaultNodes()) {
  return {
    schemaVersion: '1.0.0',
    documentControl: {
      documentTitle: title,
      documentCode: 'PRC-1000',
      version: '1.0',
      authorName: 'Autor',
      organizationUnit: 'Calidad',
      processObjective: 'Objetivo',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      status: 'DRAFT',
      ...extra
    },
    pools: [],
    nodes,
    edges: [{ id: 'e1', source: 'start', target: 'task1' }]
  };
}

export function defaultNodes() {
  return [
    { id: 'start', type: 'StartEvent', position: { x: 0, y: 0 }, data: { label: 'Inicio' } },
    { id: 'task1', type: 'Task', position: { x: 100, y: 0 }, data: { label: 'Revisar', slaDuration: { value: 2, unit: 'HOURS' } } }
  ];
}

export const TEST_CONFIG: ServerConfig = {
  databaseUrl: 'pglite://memory',
  sessionSecret: new TextEncoder().encode('test-secret-test-secret-test-secret-123456'),
  googleClientId: 'test-client.apps.googleusercontent.com',
  bootstrapAdminEmail: 'admin@test.gob',
  allowedOrigins: [],
  geminiApiKey: null,
  totpEncryptionKey: null
};

export const PASSWORDS = { admin: 'AdminPass123', alice: 'AlicePass123' };

export interface TestApp {
  pg: PGlite;
  db: Db;
  call: (method: string, path: string, opts?: CallOptions) => Promise<ApiResponse & { json: any }>;
  cookieFor: (userId: string, typ?: 'session' | 'pwchange') => Promise<string>;
  now: { value: number };
}

interface CallOptions {
  body?: unknown;
  cookie?: string;
  headers?: Record<string, string>;
  fetchFn?: typeof fetch;
  ip?: string;
}

export interface TestAppOptions {
  /**
   * reconstructed: esquema reconstruido mínimo (por defecto).
   * scripts: los scripts reales del repo (neon_schema.sql + auth_schema.sql), con CHECKs, FKs,
   *          RLS, trigger y búsqueda full-text, más las tablas que creaba el navegador.
   */
  baseline?: 'reconstructed' | 'scripts';
  config?: Partial<ServerConfig>;
}

async function loadBaseline(pg: PGlite, baseline: 'reconstructed' | 'scripts') {
  if (baseline === 'reconstructed') {
    await pg.exec(readFileSync(join(ROOT, 'tests/fixtures/baseline_schema.sql'), 'utf8'));
    return;
  }
  await pg.exec(readFileSync(join(ROOT, 'scripts/neon_schema.sql'), 'utf8'));
  // La semilla del final de auth_schema.sql usa un id que no es UUID: se omite.
  const auth = readFileSync(join(ROOT, 'scripts/auth_schema.sql'), 'utf8').split('-- 6. Semilla')[0];
  await pg.exec(auth);
  // Tablas que el navegador creaba en tiempo de ejecución (mismo DDL que usaba el cliente).
  await pg.exec(`
    ALTER TABLE app_users ADD COLUMN IF NOT EXISTS allowed_modules JSONB NULL;
    CREATE TABLE IF NOT EXISTS app_master_catalogs (
      catalog_key VARCHAR(60) PRIMARY KEY, payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
    CREATE TABLE IF NOT EXISTS user_presence (
      user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
      last_action_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      active_project_file_name VARCHAR(255) NULL, active_project_title VARCHAR(255) NULL,
      is_logged_in BOOLEAN NOT NULL DEFAULT true);
  `);
}

export function cookieHeaderFrom(res: ApiResponse, name = 'ps_session'): string {
  const raw = res.cookies.find((c) => c.startsWith(`${name}=`));
  if (!raw) return '';
  return raw.split(';')[0];
}

export async function createTestApp(options: TestAppOptions = {}): Promise<TestApp> {
  const pg = await PGlite.create({ extensions: { pgcrypto, uuid_ossp, pg_trgm } });
  const db: Db = { query: async (text, params = []) => (await pg.query(text, params as any[])).rows as any[] };
  const config: ServerConfig = { ...TEST_CONFIG, ...options.config };

  await loadBaseline(pg, options.baseline || 'reconstructed');
  await seed(pg);
  for (const m of MIGRATIONS) {
    await pg.exec(readFileSync(join(ROOT, 'db/migrations', m), 'utf8'));
  }

  const now = { value: Date.now() };

  const call = async (method: string, path: string, opts: CallOptions = {}) => {
    const headers: Record<string, string | undefined> = {
      host: 'app.test',
      'content-type': 'application/json',
      ...(opts.cookie ? { cookie: opts.cookie } : {}),
      ...(method !== 'GET' ? { origin: 'https://app.test' } : {}),
      ...opts.headers
    };
    const [p, qs] = path.split('?');
    const query: Record<string, string> = {};
    new URLSearchParams(qs || '').forEach((v, k) => (query[k] = v));
    const res = await handleApiRequest(
      { method, path: p, query, headers, body: opts.body, ip: opts.ip || '127.0.0.1' },
      { db, config, fetchFn: opts.fetchFn, now: () => now.value }
    );
    return { ...res, json: res.body as any };
  };

  const cookieFor = async (userId: string, typ: 'session' | 'pwchange' = 'session') =>
    `ps_session=${await signToken(config.sessionSecret, { sub: userId, typ })}`;

  return { pg, db, call, cookieFor, now };
}

async function seed(pg: PGlite) {
  const adminHash = await hashPassword(PASSWORDS.admin);
  const aliceHash = await hashPassword(PASSWORDS.alice);
  const users: Array<[string, string, string | null, string, string, string]> = [
    [IDS.admin, 'admin@test.gob', adminHash, 'Admin Principal', 'ADMIN', 'ACTIVE'],
    [IDS.alice, 'alice@test.gob', aliceHash, 'Alice Propietaria', 'USER', 'ACTIVE'],
    [IDS.bob, 'bob@test.gob', null, 'Bob Lector', 'USER', 'ACTIVE'],
    [IDS.carol, 'carol@test.gob', null, 'Carol Comentarista', 'USER', 'ACTIVE'],
    [IDS.dave, 'dave@test.gob', null, 'Dave Sin Permisos', 'USER', 'ACTIVE'],
    [IDS.eve, 'eve@test.gob', null, 'Eve Autora', 'USER', 'ACTIVE'],
    [IDS.frank, 'frank@test.gob', null, 'Frank Inactivo', 'USER', 'INACTIVE']
  ];
  for (const u of users) {
    await pg.query(
      `INSERT INTO app_users (id, email, password_hash, full_name, organization_unit, role, status) VALUES ($1,$2,$3,$4,'Calidad',$5,$6)`,
      u
    );
  }
  // Código de reseteo heredado en texto plano (debe migrarse a hash).
  await pg.query(
    `UPDATE app_users SET reset_code = '123456', reset_code_expires_at = NOW() + interval '1 day', must_change_password = TRUE WHERE id = $1`,
    [IDS.dave]
  );

  const projA = sampleProject('Proyecto de Alice', { createdByUserId: IDS.alice, createdByEmail: 'alice@test.gob' });
  const projB = sampleProject('Proyecto de Eve', { authorName: 'Eve Autora' });
  await pg.query(
    `INSERT INTO process_projects (file_name, document_code, document_title, author_name, organization_unit, graph_data)
     VALUES ($1, 'PRC-1000', 'Proyecto de Alice', 'Alice Propietaria', 'Calidad', $2::jsonb),
            ($3, 'PRC-2000', 'Proyecto de Eve', 'Eve Autora', 'Calidad', $4::jsonb)`,
    [PROJECT_A, JSON.stringify(projA), PROJECT_B, JSON.stringify(projB)]
  );
  await pg.query(
    `INSERT INTO project_user_permissions (user_id, project_file_name, permission_level) VALUES
       ($1, $3, 'READ_ONLY'), ($2, $3, 'COMMENTS')`,
    [IDS.bob, IDS.carol, PROJECT_A]
  );

  const trashed = sampleProject('Borrado', { createdByUserId: IDS.alice });
  await pg.query(`INSERT INTO app_master_catalogs (catalog_key, payload) VALUES ('GLOBAL_CATALOGS_V2', $1::jsonb)`, [
    JSON.stringify({
      orgUnits: [{ id: 'uo1', name: 'Calidad' }],
      roles: [],
      normatives: [],
      systemsDocs: [],
      risksControls: [],
      deletedProjects: [
        {
          fileName: TRASHED,
          documentTitle: 'Borrado',
          documentCode: 'PRC-3000',
          version: '1.0',
          organizationUnit: 'Calidad',
          authorName: 'Alice Propietaria',
          deletedAt: '2026-01-05T00:00:00.000Z',
          deletedByEmail: 'alice@test.gob',
          projectData: trashed
        }
      ]
    })
  ]);
  await pg.query(
    `INSERT INTO audit_logs (user_id, user_email, user_role, action_type) VALUES ($1, 'alice@test.gob', 'USER', 'AUTH_LOGIN_SUCCESS')`,
    [IDS.alice]
  );
}
