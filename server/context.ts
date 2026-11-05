import type { ServerConfig } from './config.js';
import type { Db } from './db.js';
import type { ApiRequest } from './http.js';

export interface Ctx {
  db: Db;
  config: ServerConfig;
  req: ApiRequest;
  cookies: Record<string, string>;
  /** Cookies a enviar en la respuesta (Set-Cookie). */
  outCookies: string[];
  /** fetch inyectable (Google / Gemini) para poder testear sin red. */
  fetchFn: typeof fetch;
  now: () => number;
}
