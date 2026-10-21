import { neon, neonConfig } from '@neondatabase/serverless';

// Suppress console security warning in browser since this is an intended client-side dashboard
if (neonConfig) {
  neonConfig.disableWarningInBrowsers = true;
}

const STORAGE_KEY_NEON_URL = 'procesos_neon_connection_string';

export interface NeonConnectionStatus {
  isConnected: boolean;
  isConfigured: boolean;
  latencyMs: number | null;
  error: string | null;
  lastChecked: Date | null;
}

export class NeonClient {
  private static cachedSql: ReturnType<typeof neon> | null = null;
  private static cachedUrl: string | null = null;

  /**
   * Retrieves the currently configured Neon connection string:
   * 1. User runtime setting in localStorage
   * 2. Build-time environment variable VITE_NEON_DATABASE_URL
   */
  public static getConnectionString(): string | null {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_NEON_URL);
      if (stored && stored.trim().length > 0) {
        return stored.trim();
      }
    }
    const envUrl = (import.meta as any).env?.VITE_NEON_DATABASE_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
      return envUrl.trim();
    }
    return null;
  }

  /**
   * Updates or clears the runtime Neon connection string
   */
  public static setConnectionString(url: string | null): void {
    if (typeof window !== 'undefined') {
      if (url && url.trim().length > 0) {
        localStorage.setItem(STORAGE_KEY_NEON_URL, url.trim());
      } else {
        localStorage.removeItem(STORAGE_KEY_NEON_URL);
      }
    }
    // Invalidate cache
    this.cachedSql = null;
    this.cachedUrl = null;
  }

  /**
   * Checks if a connection string is currently configured
   */
  public static isConfigured(): boolean {
    return !!this.getConnectionString();
  }

  /**
   * Gets the Neon SQL query function
   */
  public static getSql(): ReturnType<typeof neon> | null {
    const url = this.getConnectionString();
    if (!url) return null;

    if (this.cachedSql && this.cachedUrl === url) {
      return this.cachedSql;
    }

    try {
      this.cachedSql = neon(url);
      this.cachedUrl = url;
      return this.cachedSql;
    } catch (err) {
      console.error('Failed to initialize Neon client:', err);
      return null;
    }
  }

  /**
   * Tests connection to Neon and returns latency in milliseconds
   */
  public static async testConnection(customUrl?: string): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
    const targetUrl = customUrl ? customUrl.trim() : this.getConnectionString();
    if (!targetUrl) {
      return { ok: false, error: 'No hay cadena de conexión de Neon configurada.' };
    }

    const startTime = performance.now();
    try {
      const sqlRunner = neon(targetUrl);
      const rows = await sqlRunner`SELECT 1 as ping, NOW() as server_time;`;
      const elapsed = Math.round(performance.now() - startTime);

      if (rows && rows.length > 0) {
        return { ok: true, latencyMs: elapsed };
      }
      return { ok: false, error: 'La consulta no devolvió resultados.' };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      return { ok: false, error: message };
    }
  }
}
