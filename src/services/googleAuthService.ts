/**
 * Servicio Oficial de Integración con Google OAuth 2.0
 * Gestiona la redirección directa a accounts.google.com y la captura del access_token en el retorno
 */

export interface GoogleUserProfile {
  email: string;
  fullName: string;
  googleId: string;
  avatarUrl?: string;
}

const DEFAULT_CLIENT_ID = '724069436598-8pqlisa1k2cv3u8ik2t252pdmtm79n1u.apps.googleusercontent.com';

export class GoogleAuthService {
  /**
   * Obtiene el Client ID configurado en variables de entorno o fallback oficial
   */
  public static getClientId(): string {
    return (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || DEFAULT_CLIENT_ID;
  }

  /**
   * Redirige al usuario a la pantalla oficial de autenticación de Google (accounts.google.com)
   */
  public static redirectToGoogle(): void {
    const clientId = this.getClientId();
    const redirectUri = window.location.origin.replace(/\/$/, '');
    const scope = encodeURIComponent('email profile openid');
    const state = 'google_oauth_' + Math.random().toString(36).substring(2);
    sessionStorage.setItem('oauth_state', state);

    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=token&` +
      `scope=${scope}&` +
      `state=${state}&` +
      `prompt=select_account`;

    // Redirección oficial de navegador hacia Google
    window.location.href = googleAuthUrl;
  }

  /**
   * Inspecciona el fragmento hash de la URL tras volver de Google para capturar el access_token
   */
  public static async handleOAuthRedirectCallback(): Promise<GoogleUserProfile | null> {
    if (typeof window === 'undefined') return null;

    const hash = window.location.hash.startsWith('#')
      ? window.location.hash.substring(1)
      : window.location.hash;

    if (!hash || !hash.includes('access_token=')) {
      return null;
    }

    try {
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');

      if (!accessToken) return null;

      // Limpiar el hash de la barra de direcciones por seguridad y estética
      window.history.replaceState(null, '', window.location.pathname + window.location.search);

      // Consultar endpoint oficial de Google UserInfo
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        console.error('Fallo al consultar UserInfo en Google:', await response.text());
        return null;
      }

      const userInfo = await response.json();
      if (!userInfo.email) {
        return null;
      }

      return {
        email: userInfo.email,
        fullName: userInfo.name || userInfo.email.split('@')[0],
        googleId: userInfo.sub,
        avatarUrl: userInfo.picture
      };
    } catch (err) {
      console.error('Error al procesar callback de Google OAuth:', err);
      return null;
    }
  }
}
