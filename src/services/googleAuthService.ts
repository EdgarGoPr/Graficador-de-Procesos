/**
 * Integración con Google OAuth 2.0.
 * El navegador obtiene un access_token de Google; el servidor lo valida contra Google
 * (audiencia, correo verificado) antes de abrir la sesión.
 */

const DEFAULT_CLIENT_ID = '724069436598-8pqlisa1k2cv3u8ik2t252pdmtm79n1u.apps.googleusercontent.com';
const STATE_KEY = 'oauth_state';

export class GoogleAuthService {
  /** El Client ID de OAuth es público por diseño. */
  public static getClientId(): string {
    return (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;
  }

  public static redirectToGoogle(): void {
    const clientId = this.getClientId();
    const redirectUri = window.location.origin.replace(/\/$/, '');
    const scope = encodeURIComponent('email profile openid');
    const random = new Uint8Array(16);
    window.crypto.getRandomValues(random);
    const state = 'g_' + Array.from(random, (b) => b.toString(16).padStart(2, '0')).join('');
    sessionStorage.setItem(STATE_KEY, state);

    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${scope}&` +
      `state=${encodeURIComponent(state)}&` +
      `prompt=select_account`;

    window.location.href = googleAuthUrl;
  }

  /**
   * Al volver de Google, toma el access_token del fragmento de la URL y verifica el parámetro
   * state (protege contra inicios de sesión forzados desde otro sitio). Devuelve el token o null.
   */
  public static consumeOAuthRedirect(): { accessToken: string } | { error: string } | null {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash.startsWith('#') ? window.location.hash.substring(1) : window.location.hash;
    if (!hash || (!hash.includes('access_token=') && !hash.includes('error='))) return null;

    const params = new URLSearchParams(hash);
    // Limpiar el fragmento de la barra de direcciones.
    window.history.replaceState(null, '', window.location.pathname + window.location.search);

    const expectedState = sessionStorage.getItem(STATE_KEY);
    sessionStorage.removeItem(STATE_KEY);

    if (params.get('error')) return { error: 'Google canceló o rechazó el inicio de sesión.' };
    const accessToken = params.get('access_token');
    if (!accessToken) return null;
    if (!expectedState || params.get('state') !== expectedState) {
      return { error: 'La respuesta de Google no corresponde a un inicio de sesión iniciado desde esta pestaña. Volvé a intentarlo.' };
    }
    return { accessToken };
  }
}
