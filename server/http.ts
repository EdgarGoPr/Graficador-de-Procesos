/**
 * Tipos y utilidades HTTP independientes de Vercel (permiten testear las rutas sin red).
 */

export interface ApiRequest {
  method: string;
  path: string; // sin el prefijo /api, ej: "/projects/abc.json"
  query: Record<string, string>;
  headers: Record<string, string | undefined>; // claves en minúscula
  body: any;
  ip: string | null;
}

export interface ApiResponse {
  status: number;
  body: unknown;
  cookies: string[];
}

export class HttpError extends Error {
  constructor(public status: number, message: string, public extra: Record<string, unknown> = {}) {
    super(message);
  }
}

export const badRequest = (msg: string) => new HttpError(400, msg);
export const unauthorized = (msg = 'Sesión no válida o expirada. Volvé a iniciar sesión.') => new HttpError(401, msg);
export const forbidden = (msg = 'No tenés permisos para realizar esta acción.') => new HttpError(403, msg);
export const notFound = (msg = 'Recurso no encontrado.') => new HttpError(404, msg);
export const conflict = (msg: string) => new HttpError(409, msg);

export function parseCookies(header: string | undefined): Record<string, string> {
  const out: Record<string, string> = {};
  if (!header) return out;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx <= 0) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    try {
      out[key] = decodeURIComponent(value);
    } catch {
      out[key] = value;
    }
  }
  return out;
}

export function serializeCookie(name: string, value: string, maxAgeSeconds: number): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`
  ];
  return parts.join('; ');
}

export function clearCookie(name: string): string {
  return serializeCookie(name, '', 0);
}

// ---------------------------------------------------------------------------
// Validaciones de entrada
// ---------------------------------------------------------------------------

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const FILE_NAME_REGEX = /^[A-Za-z0-9][A-Za-z0-9._-]{0,119}$/;

export function requireString(value: unknown, field: string, max = 500, min = 1): string {
  if (typeof value !== 'string') throw badRequest(`El campo "${field}" es obligatorio.`);
  const trimmed = value.trim();
  if (trimmed.length < min) throw badRequest(`El campo "${field}" es obligatorio.`);
  if (trimmed.length > max) throw badRequest(`El campo "${field}" supera el largo permitido (${max}).`);
  return trimmed;
}

export function optionalString(value: unknown, field: string, max = 500): string | null {
  if (value === undefined || value === null || value === '') return null;
  return requireString(value, field, max);
}

export function requireEmail(value: unknown): string {
  const email = requireString(value, 'email', 255).toLowerCase();
  if (!EMAIL_REGEX.test(email)) throw badRequest('Ingresá un correo electrónico válido (ej: nombre@organizacion.gob.ar).');
  return email;
}

export function requireUuid(value: unknown, field = 'id'): string {
  if (typeof value !== 'string' || !UUID_REGEX.test(value)) throw badRequest(`Identificador "${field}" inválido.`);
  return value.toLowerCase();
}

export function requireFileName(value: unknown): string {
  if (typeof value !== 'string' || !FILE_NAME_REGEX.test(value)) throw badRequest('Nombre de archivo de proyecto inválido.');
  return value;
}

export function oneOf<T extends string>(value: unknown, allowed: readonly T[], field: string): T {
  if (typeof value !== 'string' || !(allowed as readonly string[]).includes(value)) {
    throw badRequest(`Valor inválido para "${field}".`);
  }
  return value as T;
}

export function toIso(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return isNaN(d.getTime()) ? null : d.toISOString();
}
