import { neon, neonConfig } from '@neondatabase/serverless';

// Suppress console security warning in browser since this is an intended client-side dashboard
if (neonConfig) {
  neonConfig.disableWarningInBrowsers = true;
}

export class NeonClient {
  private static cachedSql: ReturnType<typeof neon> | null = null;
  private static cachedUrl: string | null = null;

  /**
   * Retrieves the configured Neon connection string from VITE_NEON_DATABASE_URL
   */
  public static getConnectionString(): string | null {
    const envUrl = (import.meta as any).env?.VITE_NEON_DATABASE_URL;
    if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
      return envUrl.trim();
    }
    return null;
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
}
