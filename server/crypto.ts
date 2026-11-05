import { createHash, createHmac, pbkdf2 as pbkdf2Cb, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const pbkdf2 = promisify(pbkdf2Cb);

// Mismos parámetros que usaba el cliente: los hashes ya guardados ("salt:hash") siguen siendo válidos.
const ITERATIONS = 100000;
const KEY_BYTES = 32;
const SALT_BYTES = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_BYTES).toString('hex');
  const derived = await pbkdf2(password, Buffer.from(salt, 'hex'), ITERATIONS, KEY_BYTES, 'sha256');
  return `${salt}:${derived.toString('hex')}`;
}

/** Verifica una contraseña. Ya no se aceptan valores en texto plano. */
export async function verifyPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  if (!stored || !stored.includes(':')) return false;
  const [salt, expectedHex] = stored.split(':');
  if (!/^[0-9a-f]+$/i.test(salt) || !/^[0-9a-f]+$/i.test(expectedHex)) return false;
  const derived = await pbkdf2(password, Buffer.from(salt, 'hex'), ITERATIONS, KEY_BYTES, 'sha256');
  const expected = Buffer.from(expectedHex, 'hex');
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

export function sha256Hex(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

export function safeEqualHex(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b || a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}

export function generate6DigitCode(): string {
  return String(randomInt(100000, 1000000));
}

// ---------------------------------------------------------------------------
// TOTP (RFC 6238) – SHA1, 6 dígitos, 30 s
// ---------------------------------------------------------------------------

const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function generateTotpSecret(): string {
  const bytes = randomBytes(20);
  let bits = '';
  for (const b of bytes) bits += b.toString(2).padStart(8, '0');
  let out = '';
  for (let i = 0; i < bits.length; i += 5) out += BASE32[parseInt(bits.slice(i, i + 5).padEnd(5, '0'), 2)];
  return out;
}

function base32Decode(input: string): Buffer {
  const clean = input.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = '';
  for (const ch of clean) {
    const v = BASE32.indexOf(ch);
    if (v === -1) continue;
    bits += v.toString(2).padStart(5, '0');
  }
  const bytes = Buffer.alloc(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(bits.slice(i * 8, i * 8 + 8), 2);
  return bytes;
}

export function totpAt(secret: string, counter: number): string {
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(counter));
  const hmac = createHmac('sha1', base32Decode(secret)).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const bin =
    ((hmac[offset] & 0x7f) << 24) | (hmac[offset + 1] << 16) | (hmac[offset + 2] << 8) | hmac[offset + 3];
  return String(bin % 1000000).padStart(6, '0');
}

/** Acepta el paso actual y el anterior (±30 s), igual que antes. */
export function verifyTotp(secret: string, token: string, now = Date.now()): boolean {
  const clean = (token || '').trim();
  if (!/^\d{6}$/.test(clean)) return false;
  const counter = Math.floor(now / 1000 / 30);
  return [counter, counter - 1].some((c) => safeEqualHex(totpAt(secret, c), clean));
}

export function otpAuthUri(issuer: string, account: string, secret: string): string {
  const i = encodeURIComponent(issuer);
  return `otpauth://totp/${i}:${encodeURIComponent(account)}?secret=${secret}&issuer=${i}&algorithm=SHA1&digits=6&period=30`;
}
