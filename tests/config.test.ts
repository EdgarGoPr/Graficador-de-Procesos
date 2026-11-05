import { describe, expect, it } from 'vitest';
import { ConfigError, loadConfig } from '../server/config.js';

const SECRET = 'x'.repeat(40);
const APP_URL = 'postgresql://processtudio_app:clave@ep-x.us-east-1.aws.neon.tech/neondb?sslmode=require';
const OWNER_URL = 'postgresql://neondb_owner:clave@ep-x.us-east-1.aws.neon.tech/neondb?sslmode=require';

describe('Configuración del backend', () => {
  it('usa APP_DATABASE_URL antes que DATABASE_URL (la que carga la integración de Neon)', () => {
    const cfg = loadConfig({ APP_DATABASE_URL: APP_URL, DATABASE_URL: OWNER_URL, SESSION_SECRET: SECRET });
    expect(cfg.databaseUrl).toBe(APP_URL);
  });

  it('se niega a arrancar con el rol neondb_owner', () => {
    expect(() => loadConfig({ DATABASE_URL: OWNER_URL, SESSION_SECRET: SECRET })).toThrow(ConfigError);
    expect(() => loadConfig({ APP_DATABASE_URL: OWNER_URL, SESSION_SECRET: SECRET })).toThrow(/neondb_owner/);
  });

  it('exige una cadena de conexión y un SESSION_SECRET suficiente', () => {
    expect(() => loadConfig({ SESSION_SECRET: SECRET })).toThrow(/APP_DATABASE_URL/);
    expect(() => loadConfig({ APP_DATABASE_URL: APP_URL, SESSION_SECRET: 'corto' })).toThrow(/SESSION_SECRET/);
  });
});
