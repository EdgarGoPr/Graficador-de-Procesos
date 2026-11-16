import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { PGlite } from '@electric-sql/pglite';
import { pgcrypto } from '@electric-sql/pglite/contrib/pgcrypto';
import { uuid_ossp } from '@electric-sql/pglite/contrib/uuid_ossp';
import type { ServerConfig } from '../server/config.js';
import { hashPassword } from '../server/crypto.js';
import type { Db } from '../server/db.js';

/**
 * Backend local para desarrollo: Postgres en memoria con el esquema actual + migraciones
 * y usuarios de prueba. NUNCA se conecta a Neon ni a producción.
 */

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const MIGRATIONS = [
  '001_schema_consolidation.sql',
  '002_preserve_name_based_access.sql',
  '003_app_role.sql',
  '004_audit_append_only.sql',
  '005_sessions_rate_limit.sql',
  '006_project_identity.sql'
];

export const DEV_USERS = [
  { email: 'admin@local.test', password: 'Admin-Local-123', name: 'Administrador Local', role: 'ADMIN' },
  { email: 'editor@local.test', password: 'Editor-Local-123', name: 'Editora Local', role: 'USER' },
  { email: 'lector@local.test', password: 'Lector-Local-123', name: 'Lector Local', role: 'USER' }
];

export async function createLocalBackend(): Promise<{ db: Db; config: ServerConfig }> {
  const pg = await PGlite.create({ extensions: { pgcrypto, uuid_ossp } });
  await pg.exec(readFileSync(`${ROOT}tests/fixtures/baseline_schema.sql`, 'utf8'));
  for (const m of MIGRATIONS) await pg.exec(readFileSync(`${ROOT}db/migrations/${m}`, 'utf8'));

  for (const u of DEV_USERS) {
    await pg.query(
      `INSERT INTO app_users (email, password_hash, full_name, organization_unit, role, status)
       VALUES ($1, $2, $3, 'Calidad', $4, 'ACTIVE')`,
      [u.email, await hashPassword(u.password), u.name, u.role]
    );
  }

  const db: Db = { query: async (text, params = []) => (await pg.query(text, params as any[])).rows as any[] };
  const config: ServerConfig = {
    databaseUrl: 'pglite://memory',
    sessionSecret: new TextEncoder().encode('solo-desarrollo-local-no-usar-en-produccion-0123456789'),
    googleClientId: process.env.VITE_GOOGLE_CLIENT_ID || 'local',
    bootstrapAdminEmail: 'admin@local.test',
    allowedOrigins: [],
    geminiApiKey: null,
    totpEncryptionKey: null
  };
  return { db, config };
}
