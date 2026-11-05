# CHANGELOG – ProcesStudio

## 3.0.0 – Fase 1: Seguridad (2026-11-05) · `PST-104`, `PST-105`, `PST-106`

Remediación de los hallazgos críticos de la auditoría de V 02.05.00. Rama: `fase-1-seguridad`.

### Qué cambió

**Backend nuevo (`api/` + `server/`)**
- El navegador ya no se conecta a la base: todas las consultas pasan por una única función serverless de Vercel (`api/index.ts`). `vercel.json` reescribe `/api/*` hacia ella (el plan Hobby limita la cantidad de funciones).
- Cada endpoint valida la sesión del lado del servidor y relee al usuario: si se lo desactiva o elimina, pierde el acceso en la petición siguiente.
- Permisos por proyecto en el servidor: Solo lectura, Comentarios y Editor. Con Comentarios, el servidor solo acepta cambios en las notas adhesivas. Un ADMIN puede hacer todo.
- Eliminar un proyecto queda reservado al propietario o a un ADMIN. Antes podía hacerlo cualquier editor.
- Al guardar una nueva versión, el servidor exige permiso de editor sobre la versión de origen y traslada los participantes.
- Proxy de IA (`/api/ai/generate`): la clave de Gemini de la organización (`GEMINI_API_KEY`) queda solo en el servidor. La clave personal que cada usuario carga en la Bóveda sigue funcionando igual que antes.

**Sesión y autenticación**
- La sesión es una cookie firmada (HS256), `HttpOnly; Secure; SameSite=Strict`, con 8 h de vida. Ya no hay token en `localStorage`.
- Login con Google: el servidor valida el token contra Google (audiencia = `GOOGLE_CLIENT_ID`, correo verificado). El navegador verifica el parámetro `state`.
- Código de 6 dígitos: se mantiene. Ahora se guarda hasheado y abre una sesión restringida que solo permite cambiar la contraseña.
- 2FA: el desafío ya no recibe el id del usuario desde el navegador. También se exige al ingresar con código de 6 dígitos.
- 5 intentos fallidos (contraseña, código o TOTP) bloquean la cuenta durante 15 minutos.
- Protección CSRF: `SameSite=Strict`, verificación de `Origin` y `Sec-Fetch-Site`, y JSON obligatorio en las peticiones que modifican datos.
- Se eliminó la contraseña fija `Admin123*` y la promoción a ADMIN según el correo, que hacía el navegador. El administrador inicial se define con `BOOTSTRAP_ADMIN_EMAIL`.
- Ya no se aceptan contraseñas guardadas en texto plano.

**Navegador**
- Al iniciar, la app borra `procesos_users_fallback` (que tenía el hash de la contraseña del admin) y las demás claves con datos sensibles: `procesos_auth_user`, `procesos_auth_token`, `procesos_access_requests_fallback`, `procesos_permissions_fallback`, `procesos_audit_logs_fallback`, `procesos_active_locks_fallback` y `procesos_local_presence_cache`.
- Se eliminaron los "fallbacks" locales de usuarios, permisos, auditoría y candados.
- El usuario que recibe el navegador ya no incluye hash, código de reseteo ni secreto TOTP.
- La papelera pasó al servidor. Antes guardaba proyectos completos dentro de los catálogos, legibles por cualquier usuario. Ahora cada usuario ve solo sus proyectos borrados; el ADMIN ve todos.
- Los catálogos maestros se editan solo con rol ADMIN. Los demás usuarios los leen.

**Base de datos (`db/migrations/`)**
- `001_schema_consolidation.sql`:
  - Crea `user_presence` y `app_master_catalogs`, que antes creaba el navegador.
  - Agrega a `app_users` las columnas `failed_login_attempts`, `locked_until` y `reset_code_hash`, y hashea los códigos vigentes.
  - Agrega `process_projects.owner_user_id`.
  - Crea `process_project_trash` y mueve la papelera fuera del catálogo.
  - Quita la FK de `audit_logs.user_id`.
- `002_preserve_name_based_access.sql`: quien hoy era editor por coincidencia de nombre con el autor pasa a ser propietario (si es una única coincidencia) o recibe un permiso EDITOR explícito.
- `003_app_role.sql`: crea el rol `processtudio_app`, sin DDL. Tiene SELECT/INSERT/UPDATE/DELETE en las tablas operativas y solo SELECT/INSERT en `audit_logs`.
- `004_audit_append_only.sql`: triggers que rechazan UPDATE, DELETE y TRUNCATE sobre `audit_logs` para cualquier rol, incluido el dueño.

**Build y tests**
- `npm run build:ci` (el que usa Vercel): typecheck del cliente y del servidor, `vite build` y `scripts/check-bundle.cjs`. Este último falla si `dist/` contiene `postgres`, `neon.tech`, `neondb_owner`, contraseñas `npg_…`, claves `AIza…`, SQL o el valor de alguna variable secreta.
- `npm test`: 41 tests (vitest + Postgres en memoria con el esquema actual y las 4 migraciones). Cubren:
  - accesos sin sesión o con cookie alterada;
  - USER sin permiso que intenta leer, guardar, borrar o autoasignarse permisos;
  - Solo lectura, Comentarios y Editor;
  - endpoints de administración;
  - 2FA y bloqueo por intentos;
  - CSRF;
  - migraciones y su idempotencia;
  - `audit_logs` append-only y permisos del rol de aplicación.
- `npm run dev:local`: levanta la app con la API real sobre una base en memoria con usuarios de prueba. No toca Neon.

### Despliegue (en este orden)

1. **Correr las migraciones** con el rol dueño (consola SQL de Neon o `psql`), en orden: `001` → `002` → `003` → `004`. Son idempotentes.
2. **Dar contraseña al rol de aplicación** (no está en ningún archivo):
   ```sql
   ALTER ROLE processtudio_app WITH LOGIN PASSWORD '<contraseña larga y aleatoria>';
   ```
3. **Variables de entorno en Vercel** (Production y Preview, *sin* prefijo `VITE_`):

   | Variable | Valor |
   | :--- | :--- |
   | `DATABASE_URL` | Cadena de conexión con `processtudio_app` (no con `neondb_owner`) |
   | `SESSION_SECRET` | 32+ caracteres aleatorios: `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
   | `GOOGLE_CLIENT_ID` | El Client ID de OAuth (el mismo que `VITE_GOOGLE_CLIENT_ID`) |
   | `BOOTSTRAP_ADMIN_EMAIL` | Correo del administrador principal |
   | `GEMINI_API_KEY` | Opcional: clave de Gemini de la organización |
   | `ALLOWED_ORIGIN` | Opcional: dominios adicionales, separados por coma |

   **Borrar** `VITE_NEON_DATABASE_URL` y `VITE_GEMINI_API_KEY` de Vercel. Se puede mantener `VITE_GOOGLE_CLIENT_ID`, porque es público.
4. **Desplegar primero en Preview** y probar con un ADMIN y un USER. Ver "Cómo probar".
5. **Promover a producción.**
6. **Rotar la contraseña de `neondb_owner`** en Neon. La actual quedó publicada en el bundle de V 02.05.00 y hay que considerarla comprometida. Si la clave de Gemini estuvo en `VITE_GEMINI_API_KEY`, regenerarla también.

### Cómo probar
- En DevTools → Application → Local Storage no debe quedar ninguna clave `procesos_users_fallback`, `procesos_auth_*` ni `*_fallback`.
- En DevTools → Application → Cookies, `ps_session` debe aparecer marcada como HttpOnly y Secure.
- En DevTools → Network no debe haber peticiones a `neon.tech`: todo va a `/api/...`.
- Con un USER sin permisos, `fetch('/api/projects/<archivo de otro>')` desde la consola debe responder 404, y `fetch('/api/audit')` debe responder 403.
- Recorrer como siempre: proyectos, lienzo, generador desde texto, Manual PDF, SIPOC, RACI, flujograma, auditor, simulador, comparador, bóveda, exportaciones, consola de administración y logs.

### Pendiente / conocido
- **Fase 2:** los permisos y las versiones siguen identificados por nombre de archivo y agrupados por código documental.
- Cambiar la contraseña no cierra las otras sesiones abiertas del mismo usuario. Se cierran al vencer (8 h) o si se desactiva al usuario.
- El límite de intentos es por cuenta, no por IP.
- El secreto TOTP se guarda sin cifrar en la base. Es accesible solo desde el servidor.
- El proxy de IA acepta peticiones de hasta ~4,5 MB (límite de Vercel). Para PDFs escaneados muy grandes conviene usar la clave personal de la Bóveda.
- No se agregó todavía una Content-Security-Policy.
- `scripts/setup-neon-db.cjs` ahora lee `NEON_OWNER_DATABASE_URL`. Para cambios de esquema conviene usar `db/migrations/`.
