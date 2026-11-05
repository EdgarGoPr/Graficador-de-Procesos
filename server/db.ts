import { neon } from '@neondatabase/serverless';

/**
 * Acceso mínimo a la base: una consulta parametrizada que devuelve filas.
 * Las rutas reciben esta interfaz, así los tests pueden usar un Postgres en memoria.
 */
export interface Db {
  query<T = any>(text: string, params?: unknown[]): Promise<T[]>;
}

let cached: { url: string; db: Db } | null = null;

export function getNeonDb(databaseUrl: string): Db {
  if (cached && cached.url === databaseUrl) return cached.db;
  const sql = neon(databaseUrl);
  const db: Db = {
    query: async <T>(text: string, params: unknown[] = []) => (await sql.query(text, params)) as T[]
  };
  cached = { url: databaseUrl, db };
  return db;
}
