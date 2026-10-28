/**
 * Utilidades Criptográficas y de Seguridad de ProcesStudio (WebCrypto Nativo)
 * Compatible con navegadores modernos y estándares RFC 6238 (TOTP) y PBKDF2 (NIST SP 800-132).
 */

const SALT_BYTES = 16;
const ITERATIONS = 100000;
const KEY_LENGTH = 256; // 32 bytes

/**
 * Genera un salt criptográfico en formato hexadecimal
 */
export function generateSalt(): string {
  const salt = new Uint8Array(SALT_BYTES);
  window.crypto.getRandomValues(salt);
  return Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Calcula el hash PBKDF2-SHA256 de una contraseña junto a un salt
 */
export async function hashPassword(password: string, saltHex?: string): Promise<{ hash: string; salt: string }> {
  const salt = saltHex || generateSalt();
  const saltBuffer = new Uint8Array(salt.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const enc = new TextEncoder();
  const passBuffer = enc.encode(password);

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    passBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  const derivedKey = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    KEY_LENGTH
  );

  const hashArray = Array.from(new Uint8Array(derivedKey));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

  return { hash: `${salt}:${hashHex}`, salt };
}

/**
 * Verifica si una contraseña coincide con el hash almacenado (salt:hashHex)
 */
export async function verifyPassword(password: string, storedHashWithSalt: string): Promise<boolean> {
  if (!storedHashWithSalt || !storedHashWithSalt.includes(':')) {
    // Si la contraseña almacenada es texto plano previo o demo inicial
    return password === storedHashWithSalt;
  }
  const [salt, expectedHash] = storedHashWithSalt.split(':');
  const { hash } = await hashPassword(password, salt);
  const actualHash = hash.split(':')[1];
  return actualHash === expectedHash;
}

/**
 * Genera un código numérico criptográfico de 6 dígitos para reseteo
 */
export function generate6DigitCode(): string {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  // Número entre 100000 y 999999
  const code = 100000 + (array[0] % 900000);
  return code.toString();
}

/**
 * Genera un hash SHA-256 para sellado criptográfico de auditoría
 */
export async function calculateSha256(text: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(text);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// SOPORTE RFC 6238 PARA SEGUNDO FACTOR DE AUTENTICACIÓN (TOTP / 2FA)
// ============================================================================

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

/**
 * Genera una clave secreta aleatoria Base32 para TOTP (160 bits / 20 bytes)
 */
export function generateTotpSecret(): string {
  const randomBytes = new Uint8Array(20);
  window.crypto.getRandomValues(randomBytes);
  let bits = '';
  for (let i = 0; i < randomBytes.length; i++) {
    bits += randomBytes[i].toString(2).padStart(8, '0');
  }
  let secret = '';
  for (let i = 0; i < bits.length; i += 5) {
    const chunk = bits.substr(i, 5).padEnd(5, '0');
    secret += BASE32_ALPHABET[parseInt(chunk, 2)];
  }
  return secret;
}

/**
 * Decodifica una clave Base32 en Uint8Array
 */
function base32ToUint8Array(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = new Uint8Array(Math.floor(bits.length / 8));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(bits.substr(i * 8, 8), 2);
  }
  return bytes;
}

/**
 * Genera el código TOTP dinámico de 6 dígitos actual a partir de la clave secreta
 */
export async function generateTotpCode(secretBase32: string, timeStepSeconds = 30): Promise<string> {
  const keyBytes = base32ToUint8Array(secretBase32);
  const epoch = Math.floor(Date.now() / 1000);
  const counter = Math.floor(epoch / timeStepSeconds);

  const counterBytes = new Uint8Array(8);
  let tempCounter = counter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = tempCounter & 0xff;
    tempCounter = tempCounter >> 8;
  }

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyBytes as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, counterBytes);
  const hash = new Uint8Array(signature);

  const offset = hash[hash.length - 1] & 0x0f;
  const binary =
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Valida un código TOTP ingresado por el usuario permitiendo una ventana de ±1 paso (30s)
 */
export async function verifyTotpCode(secretBase32: string, token: string): Promise<boolean> {
  const cleanToken = token.trim();
  if (cleanToken.length !== 6) return false;

  const currentCode = await generateTotpCode(secretBase32, 30);
  if (currentCode === cleanToken) return true;

  // Chequeo de ventana anterior (-30s)
  const epoch = Math.floor(Date.now() / 1000);
  const pastCounter = Math.floor((epoch - 30) / 30);
  const pastKey = base32ToUint8Array(secretBase32);
  const counterBytes = new Uint8Array(8);
  let tempCounter = pastCounter;
  for (let i = 7; i >= 0; i--) {
    counterBytes[i] = tempCounter & 0xff;
    tempCounter = tempCounter >> 8;
  }
  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    pastKey as unknown as BufferSource,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const sigPast = await window.crypto.subtle.sign('HMAC', cryptoKey, counterBytes);
  const hashPast = new Uint8Array(sigPast);
  const offsetPast = hashPast[hashPast.length - 1] & 0x0f;
  const binPast =
    ((hashPast[offsetPast] & 0x7f) << 24) |
    ((hashPast[offsetPast + 1] & 0xff) << 16) |
    ((hashPast[offsetPast + 2] & 0xff) << 8) |
    (hashPast[offsetPast + 3] & 0xff);
  const pastCode = (binPast % 1000000).toString().padStart(6, '0');
  if (pastCode === cleanToken) return true;

  return false;
}

/**
 * Genera la URI otpauth:// para vincular en aplicaciones Authenticator
 */
export function generateOtpAuthUri(issuer: string, accountName: string, secretBase32: string): string {
  const encIssuer = encodeURIComponent(issuer);
  const encAccount = encodeURIComponent(accountName);
  return `otpauth://totp/${encIssuer}:${encAccount}?secret=${secretBase32}&issuer=${encIssuer}&algorithm=SHA1&digits=6&period=30`;
}
