/**
 * Modo de desarrollo local: sirve la app con Vite y la API real (/api) sobre un
 * Postgres en memoria con usuarios de prueba. No usa ninguna base remota.
 *   npm run dev:local
 */
import { createServer } from 'vite';

let backendPromise = null;

const apiPlugin = {
  name: 'processtudio-local-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (!req.url || !req.url.startsWith('/api/')) return next();
      try {
        if (!backendPromise) {
          backendPromise = server.ssrLoadModule('/scripts/dev-local-backend.ts').then((m) => m.createLocalBackend());
        }
        const deps = await backendPromise;
        const { handleNodeRequest } = await server.ssrLoadModule('/server/node-adapter.ts');
        await handleNodeRequest(req, res, deps);
      } catch (err) {
        console.error('[api local]', err);
        res.statusCode = 500;
        res.end(JSON.stringify({ ok: false, error: 'Error en la API local.' }));
      }
    });
  }
};

const port = Number(process.env.PORT || 5173);
const server = await createServer({ plugins: [apiPlugin], server: { port } });
await server.listen();
server.printUrls();
const { DEV_USERS } = await server.ssrLoadModule('/scripts/dev-local-backend.ts');
console.log('\n  Usuarios de prueba (base en memoria, se borra al cerrar):');
for (const u of DEV_USERS) console.log(`    ${u.role.padEnd(5)}  ${u.email}  /  ${u.password}`);
