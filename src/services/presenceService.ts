import { AppUser, UserPresenceInfo } from '../types/auth';
import { api } from './apiClient';
import { ConcurrencyLockService } from './concurrencyLockService';

const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutos de inactividad
const HEARTBEAT_MS = 25000;

export class PresenceService {
  private static heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private static lastActionTimestamp: number = Date.now();
  private static listenersInitialized = false;
  private static isCurrentlyLockedByMe = false;
  private static currentUserRef: AppUser | null = null;
  private static activeProjectFileNameRef: string | null = null;
  /** Solo quien tiene permiso de editor sobre el lienzo abierto intenta tomar el candado. */
  private static lockEligible = false;

  public static setLockEligibility(eligible: boolean): void {
    this.lockEligible = eligible;
  }

  public static isUserCurrentlyActive(): boolean {
    return Date.now() - this.lastActionTimestamp < IDLE_THRESHOLD_MS;
  }

  public static recordActivity(): void {
    this.lastActionTimestamp = Date.now();
  }

  public static initActivityListeners(): void {
    if (this.listenersInitialized || typeof window === 'undefined') return;
    this.listenersInitialized = true;

    const onUserInteraction = () => {
      this.lastActionTimestamp = Date.now();
    };

    window.addEventListener('mousemove', onUserInteraction, { passive: true });
    window.addEventListener('mousedown', onUserInteraction, { passive: true });
    window.addEventListener('keydown', onUserInteraction, { passive: true });
    window.addEventListener('touchstart', onUserInteraction, { passive: true });
    window.addEventListener('scroll', onUserInteraction, { passive: true });

    const handleUnload = () => {
      const user = this.currentUserRef;
      if (user) {
        this.stopPresenceHeartbeat(user, this.activeProjectFileNameRef);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
  }

  public static startPresenceHeartbeat(
    user: AppUser,
    activeProjectFileName?: string | null,
    activeProjectTitle?: string | null
  ): void {
    this.initActivityListeners();
    this.stopPresenceHeartbeat();

    this.currentUserRef = user;
    this.activeProjectFileNameRef = activeProjectFileName || null;

    this.sendPresencePing(user, activeProjectFileName, activeProjectTitle);
    this.heartbeatInterval = setInterval(() => {
      this.sendPresencePing(user, activeProjectFileName, activeProjectTitle);
    }, HEARTBEAT_MS);
  }

  public static async stopPresenceHeartbeat(user?: AppUser | null, activeProjectFileName?: string | null): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    const targetUser = user || this.currentUserRef;
    const targetProject = activeProjectFileName || this.activeProjectFileNameRef;

    if (targetUser && targetProject && this.isCurrentlyLockedByMe) {
      try {
        await ConcurrencyLockService.releaseLock(targetProject, targetUser);
        this.isCurrentlyLockedByMe = false;
      } catch {
        // ignore
      }
    }

    if (targetUser) {
      try {
        await api('POST', '/presence/offline', { body: {}, keepalive: true, skipSessionHandler: true });
      } catch {
        // ignore
      }
    }
  }

  public static async markUserLoggedOut(_user: AppUser): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    this.isCurrentlyLockedByMe = false;
    this.currentUserRef = null;
    this.activeProjectFileNameRef = null;
    try {
      await api('POST', '/presence/offline', { body: {}, skipSessionHandler: true });
    } catch {
      // ignore
    }
  }

  private static async sendPresencePing(
    user: AppUser,
    activeProjectFileName?: string | null,
    activeProjectTitle?: string | null
  ): Promise<void> {
    const isUserActive = Date.now() - this.lastActionTimestamp < IDLE_THRESHOLD_MS;

    // Control dinámico del candado: activo => lo toma; inactivo => lo libera para otros.
    if (activeProjectFileName && this.lockEligible) {
      if (isUserActive) {
        if (!this.isCurrentlyLockedByMe) {
          const res = await ConcurrencyLockService.acquireLock(activeProjectFileName, user);
          if (res.ok) this.isCurrentlyLockedByMe = true;
        }
      } else if (this.isCurrentlyLockedByMe) {
        await ConcurrencyLockService.releaseLock(activeProjectFileName, user);
        this.isCurrentlyLockedByMe = false;
      }
    } else {
      this.isCurrentlyLockedByMe = false;
    }

    try {
      await api('POST', '/presence', {
        body: {
          isActive: isUserActive,
          lastActionAt: new Date(this.lastActionTimestamp).toISOString(),
          activeProjectFileName: activeProjectFileName || null,
          activeProjectTitle: activeProjectTitle || null
        }
      });
    } catch (err) {
      console.warn('Error al actualizar presencia:', err);
    }
  }

  /** Solo ADMIN (Consola de Administración). */
  public static async getAllUsersPresence(): Promise<Map<string, UserPresenceInfo>> {
    const result = new Map<string, UserPresenceInfo>();
    try {
      const res = await api<{ presence: UserPresenceInfo[] }>('GET', '/presence');
      for (const p of res.presence || []) result.set(p.userId, p);
    } catch (err) {
      console.warn('Error al consultar presencia de usuarios:', err);
    }
    return result;
  }
}
