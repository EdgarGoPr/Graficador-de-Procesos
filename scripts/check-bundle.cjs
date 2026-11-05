/**
 * Verificación de seguridad del build: falla si el bundle publicado (dist/) contiene
 * cadenas de conexión, credenciales, SQL o valores de variables de entorno del servidor.
 * Uso: node scripts/check-bundle.cjs [carpeta]   (por defecto: dist)
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(process.argv[2] || 'dist');
if (!fs.existsSync(root)) {
  console.error(`✗ No existe la carpeta ${root}. Ejecutá primero el build.`);
  process.exit(1);
}

const FORBIDDEN = [
  { label: 'cadena "postgres"', re: /postgres/i },
  { label: 'dominio neon.tech', re: /neon\.tech/i },
  { label: 'rol neondb_owner', re: /neondb_owner/i },
  { label: 'prefijo de contraseña de Neon (npg_)', re: /\bnpg_[A-Za-z0-9]{6,}/ },
  { label: 'driver @neondatabase', re: /@neondatabase/i },
  { label: 'SQL INSERT INTO', re: /\bINSERT\s+INTO\b/ },
  { label: 'SQL SELECT ... FROM', re: /\bSELECT\b[\s\S]{1,200}?\bFROM\s+(process_projects|app_users|audit_logs|project_user_permissions|user_access_requests|user_presence|canvas_active_locks|app_master_catalogs)\b/i },
  { label: 'SQL UPDATE ... SET', re: /\bUPDATE\s+(process_projects|app_users|audit_logs|project_user_permissions|user_presence|canvas_active_locks|app_master_catalogs)\s+SET\b/i },
  { label: 'clave de Google API (AIza...)', re: /AIza[0-9A-Za-z_-]{30,}/ },
  { label: 'hash de contraseña (salt:hash PBKDF2)', re: /\b[0-9a-f]{32}:[0-9a-f]{64}\b/ }
];

// Valores de variables secretas presentes en el entorno del build (Vercel las inyecta)
// o en los archivos .env locales.
const SECRET_ENV = [
  'APP_DATABASE_URL', 'DATABASE_URL', 'DATABASE_URL_UNPOOLED', 'POSTGRES_URL', 'POSTGRES_URL_NON_POOLING',
  'POSTGRES_PRISMA_URL', 'POSTGRES_PASSWORD', 'PGPASSWORD', 'SESSION_SECRET', 'TOTP_ENCRYPTION_KEY',
  'GEMINI_API_KEY', 'VITE_NEON_DATABASE_URL', 'VITE_GEMINI_API_KEY'
];
const fileEnv = {};
for (const envFile of ['.env', '.env.local', '.env.production', '.env.production.local']) {
  const p = path.resolve(envFile);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m) fileEnv[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
for (const name of SECRET_ENV) {
  for (const value of [(process.env[name] || '').trim(), (fileEnv[name] || '').trim()]) {
    if (value.length >= 8) {
      const escaped = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      FORBIDDEN.push({ label: `valor de la variable ${name}`, re: new RegExp(escaped) });
    }
  }
}

const TEXT_EXT = new Set(['.js', '.mjs', '.cjs', '.css', '.html', '.json', '.map', '.txt', '.svg', '.webmanifest']);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

const findings = [];
for (const file of walk(root)) {
  if (!TEXT_EXT.has(path.extname(file).toLowerCase())) continue;
  const content = fs.readFileSync(file, 'utf8');
  for (const rule of FORBIDDEN) {
    const m = rule.re.exec(content);
    if (m) {
      const start = Math.max(0, m.index - 40);
      findings.push({
        file: path.relative(process.cwd(), file),
        rule: rule.label,
        context: content.slice(start, m.index + Math.min(m[0].length, 60) + 40).replace(/\s+/g, ' ')
      });
    }
  }
}

if (findings.length > 0) {
  console.error('✗ El bundle contiene información que no debe publicarse:');
  for (const f of findings) console.error(`  - [${f.rule}] ${f.file}\n      …${f.context}…`);
  process.exit(1);
}
console.log(`✓ Bundle verificado (${root}): sin credenciales, cadenas de conexión ni SQL.`);
