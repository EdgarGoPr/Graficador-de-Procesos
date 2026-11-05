import type { ServerResponse } from 'node:http';
import { ConfigError, loadConfig } from '../server/config.js';
import { getNeonDb } from '../server/db.js';
import { NodeLikeRequest, handleNodeRequest, sendJson } from '../server/node-adapter.js';

/**
 * Única función serverless de Vercel. vercel.json reescribe /api/* hacia aquí
 * (el plan Hobby limita la cantidad de funciones).
 */
export default async function handler(req: NodeLikeRequest, res: ServerResponse) {
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    console.error(err instanceof ConfigError ? err.message : err);
    return sendJson(res, 500, { ok: false, error: 'El servidor no está configurado correctamente.' });
  }
  return handleNodeRequest(req, res, { db: getNeonDb(config.databaseUrl), config });
}
