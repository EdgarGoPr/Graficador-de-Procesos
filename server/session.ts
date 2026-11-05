import { SignJWT, jwtVerify } from 'jose';
import { clearCookie, serializeCookie } from './http.js';

/**
 * Sesión firmada (HS256) en cookie httpOnly. Tipos de token:
 * - session:  sesión completa.
 * - pwchange: sesión restringida, solo habilita el cambio obligatorio de contraseña.
 * - 2fa:      primer factor superado, falta el código TOTP (cookie separada).
 */
export type TokenType = 'session' | 'pwchange' | '2fa';

export const SESSION_COOKIE = 'ps_session';
export const TWO_FA_COOKIE = 'ps_2fa';

export const TTL_SECONDS: Record<TokenType, number> = {
  session: 8 * 60 * 60,
  pwchange: 15 * 60,
  '2fa': 5 * 60
};

export interface TokenClaims {
  sub: string;
  typ: TokenType;
  next?: 'session' | 'pwchange';
}

const ISSUER = 'processtudio';

export async function signToken(secret: Uint8Array, claims: TokenClaims): Promise<string> {
  const payload: Record<string, unknown> = { typ: claims.typ };
  if (claims.next) payload.next = claims.next;
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(claims.sub)
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS[claims.typ]}s`)
    .sign(secret);
}

export async function verifyToken(secret: Uint8Array, token: string | undefined): Promise<TokenClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { issuer: ISSUER, algorithms: ['HS256'] });
    const typ = payload.typ;
    if (typeof payload.sub !== 'string' || (typ !== 'session' && typ !== 'pwchange' && typ !== '2fa')) return null;
    const next = payload.next === 'pwchange' ? 'pwchange' : payload.next === 'session' ? 'session' : undefined;
    return { sub: payload.sub, typ, next };
  } catch {
    return null;
  }
}

export async function sessionCookie(secret: Uint8Array, userId: string, typ: 'session' | 'pwchange'): Promise<string> {
  return serializeCookie(SESSION_COOKIE, await signToken(secret, { sub: userId, typ }), TTL_SECONDS[typ]);
}

export async function twoFaCookie(secret: Uint8Array, userId: string, next: 'session' | 'pwchange'): Promise<string> {
  return serializeCookie(TWO_FA_COOKIE, await signToken(secret, { sub: userId, typ: '2fa', next }), TTL_SECONDS['2fa']);
}

export const clearSessionCookie = () => clearCookie(SESSION_COOKIE);
export const clearTwoFaCookie = () => clearCookie(TWO_FA_COOKIE);
