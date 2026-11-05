/**
 * Utilidades criptográficas del navegador.
 * El hashing de contraseñas, los códigos de reseteo y el TOTP viven solo en el servidor (server/crypto.ts).
 */

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
