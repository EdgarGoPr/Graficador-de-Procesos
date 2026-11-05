/**
 * Configuración del backend. Solo lee variables de entorno del servidor (sin prefijo VITE_),
 * de modo que ningún secreto llegue al bundle del navegador.
 */

// Client ID público de OAuth (ya era público en el cliente). Se usa solo si no hay variable.
const DEFAULT_GOOGLE_CLIENT_ID = '724069436598-8pqlisa1k2cv3u8ik2t252pdmtm79n1u.apps.googleusercontent.com';

export interface ServerConfig {
  databaseUrl: string;
  sessionSecret: Uint8Array;
  googleClientId: string;
  bootstrapAdminEmail: string | null;
  allowedOrigins: string[];
  geminiApiKey: string | null;
}

export class ConfigError extends Error {}

export function loadConfig(env: Record<string, string | undefined> = process.env): ServerConfig {
  const databaseUrl = (env.DATABASE_URL || '').trim();
  if (!databaseUrl) {
    throw new ConfigError('Falta la variable de entorno DATABASE_URL.');
  }

  const secret = (env.SESSION_SECRET || '').trim();
  if (secret.length < 32) {
    throw new ConfigError('SESSION_SECRET debe tener al menos 32 caracteres.');
  }

  const allowedOrigins = (env.ALLOWED_ORIGIN || '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean);

  return {
    databaseUrl,
    sessionSecret: new TextEncoder().encode(secret),
    googleClientId: (env.GOOGLE_CLIENT_ID || env.VITE_GOOGLE_CLIENT_ID || DEFAULT_GOOGLE_CLIENT_ID).trim(),
    bootstrapAdminEmail: (env.BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase() || null,
    allowedOrigins,
    geminiApiKey: (env.GEMINI_API_KEY || '').trim() || null
  };
}
