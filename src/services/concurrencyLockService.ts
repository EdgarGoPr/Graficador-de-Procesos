import { AppUser, CanvasActiveLock } from '../types/auth';
import { api } from './apiClient';
import { PresenceService } from './presenceService';

const enc = encodeURIComponent;

/**
 * Candados de edición. El servidor exige permiso EDITOR y solo permite operar sobre los candados propios.
 */
export class ConcurrencyLockService {
  private static heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  public static async acquireLock(
    projectFileName: string,
    _user: AppUser
  ): Promise<{ ok: boolean; lock?: CanvasActiveLock; activeConflict?: CanvasActiveLock }> {
    try {
      const res = await api<{ ok: boolean; lock?: CanvasActiveLock; activeConflict?: CanvasActiveLock | null }>(
        'POST',
        `/locks/${enc(projectFileName)}`,
        { body: {} }
      );
      if (res.ok && res.lock) {
        this.startHeartbeat(projectFileName);
        return { ok: true, lock: res.lock };
      }
      return { ok: false, activeConflict: res.activeConflict || undefined };
    } catch (err) {
      console.warn('No se pudo adquirir el candado de edición:', err);
      return { ok: false };
    }
  }

  public static async releaseLock(projectFileName: string, _user: AppUser): Promise<void> {
    this.stopHeartbeat();
    try {
      await api('DELETE', `/locks/${enc(projectFileName)}`, { body: {}, keepalive: true });
    } catch (err) {
      console.warn('Error al liberar candado:', err);
    }
  }

  public static async releaseAllUserLocks(_user: AppUser): Promise<void> {
    this.stopHeartbeat();
    try {
      await api('DELETE', '/locks', { body: {}, keepalive: true });
    } catch (err) {
      console.warn('Error al liberar candados:', err);
    }
  }

  /** Extiende el candado cada 60 s mientras el usuario siga activo. */
  private static startHeartbeat(projectFileName: string): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(async () => {
      if (!PresenceService.isUserCurrentlyActive()) {
        this.stopHeartbeat();
        return;
      }
      try {
        await api('PUT', `/locks/${enc(projectFileName)}/heartbeat`, { body: {} });
      } catch {
        // se reintenta en el próximo latido
      }
    }, 60000);
  }

  public static stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}
