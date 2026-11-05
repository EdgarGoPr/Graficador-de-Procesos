/**
 * Cliente HTTP único hacia el backend (/api). El navegador nunca habla con la base de datos:
 * la sesión viaja en una cookie httpOnly que JavaScript no puede leer.
 */

export class ApiError extends Error {
  constructor(public status: number, message: string, public data: any = null) {
    super(message);
  }
}

let onSessionExpired: (() => void) | null = null;

/** Registra qué hacer cuando el servidor informa que la sesión ya no es válida. */
export function setSessionExpiredHandler(handler: () => void): void {
  onSessionExpired = handler;
}

interface ApiOptions {
  body?: unknown;
  /** No disparar el cierre de sesión ante un 401 (rutas de login). */
  skipSessionHandler?: boolean;
  keepalive?: boolean;
  signal?: AbortSignal;
}

export async function api<T = any>(method: string, path: string, opts: ApiOptions = {}): Promise<T> {
  const init: RequestInit = {
    method,
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    keepalive: opts.keepalive,
    signal: opts.signal
  };
  if (opts.body !== undefined && method !== 'GET') init.body = JSON.stringify(opts.body);

  let res: Response;
  try {
    res = await fetch(`/api${path}`, init);
  } catch {
    throw new ApiError(0, 'No se pudo conectar con el servidor. Verificá tu conexión.');
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    if (res.status === 401 && !opts.skipSessionHandler && onSessionExpired) onSessionExpired();
    throw new ApiError(res.status, data?.error || `Error ${res.status} del servidor.`, data);
  }
  return data as T;
}

export const apiErrorMessage = (err: unknown, fallback: string): string =>
  err instanceof Error && err.message ? err.message : fallback;

export const encodeSegment = (value: string) => encodeURIComponent(value);
