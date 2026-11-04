import { AppUser, UserPresenceInfo, UserPresenceState } from '../types/auth';
import { NeonClient } from './neonClient';
import { ConcurrencyLockService } from './concurrencyLockService';

const IDLE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutos de inactividad
const LOCAL_PRESENCE_KEY = 'procesos_local_presence_cache';

export class PresenceService {
  private static heartbeatInterval: any = null;
  private static lastActionTimestamp: number = Date.now();
  private static listenersInitialized = false;
  private static isCurrentlyLockedByMe = false;
  private static currentUserRef: AppUser | null = null;
  private static activeProjectFileNameRef: string | null = null;

  /**
   * Determina si el usuario local se encuentra en actividad activa (< 5 minutos desde última acción).
   */
  public static isUserCurrentlyActive(): boolean {
    return (Date.now() - this.lastActionTimestamp) < IDLE_THRESHOLD_MS;
  }

  /**
   * Registra una acción de usuario (movimiento, clic, tecla) manteniendo el estado activo.
   */
  public static recordActivity(): void {
    this.lastActionTimestamp = Date.now();
  }

  /**
   * Inicializa escuchadores globales en el navegador para detectar movimientos del usuario.
   */
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

    // Cierre o descarga de ventana
    const handleUnload = () => {
      const user = this.currentUserRef;
      if (user) {
        this.stopPresenceHeartbeat(user, this.activeProjectFileNameRef);
      }
    };
    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);
  }

  /**
   * Inicia el latido periódico de presencia (cada 25 segundos)
   */
  public static startPresenceHeartbeat(
    user: AppUser,
    activeProjectFileName?: string | null,
    activeProjectTitle?: string | null
  ): void {
    this.initActivityListeners();
    this.stopPresenceHeartbeat();

    this.currentUserRef = user;
    this.activeProjectFileNameRef = activeProjectFileName || null;

    // Latido inicial inmediato
    this.sendPresencePing(user, activeProjectFileName, activeProjectTitle);

    this.heartbeatInterval = setInterval(() => {
      this.sendPresencePing(user, activeProjectFileName, activeProjectTitle);
    }, 25000);
  }

  /**
   * Detiene el latido de presencia y marca desconexión si aplica
   */
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
      const sql = NeonClient.getSql();
      if (sql) {
        try {
          await sql`
            UPDATE user_presence SET
              is_logged_in = false,
              active_project_file_name = NULL,
              active_project_title = NULL
            WHERE user_id = ${targetUser.id};
          `;
        } catch {
          // ignore
        }
      }
    }
  }

  /**
   * Marca formalmente el cierre de sesión (logout), liberando presencia y caché
   */
  public static async markUserLoggedOut(user: AppUser): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.isCurrentlyLockedByMe = false;
    this.currentUserRef = null;
    this.activeProjectFileNameRef = null;

    try {
      localStorage.removeItem(LOCAL_PRESENCE_KEY);
    } catch {
      // ignore
    }

    const sql = NeonClient.getSql();
    if (sql) {
      try {
        await sql`
          UPDATE user_presence SET
            is_logged_in = false,
            active_project_file_name = NULL,
            active_project_title = NULL
          WHERE user_id = ${user.id};
        `;
      } catch (err) {
        console.warn('Error al marcar logout en user_presence de Neon:', err);
      }
    }
  }

  /**
   * Envía un latido a Neon PostgreSQL y gestiona la liberación o adquisición del candado
   */
  private static async sendPresencePing(
    user: AppUser,
    activeProjectFileName?: string | null,
    activeProjectTitle?: string | null
  ): Promise<void> {
    const now = Date.now();
    const idleTime = now - this.lastActionTimestamp;
    const isUserActive = idleTime < IDLE_THRESHOLD_MS; // < 5 minutos activa

    // 1. Control Dinámico de Candado de Concurrencia (Requerimiento 12)
    if (activeProjectFileName) {
      if (isUserActive) {
        // Usuario en actividad: asegurar que posee el candado sobre el lienzo
        if (!this.isCurrentlyLockedByMe) {
          const res = await ConcurrencyLockService.acquireLock(activeProjectFileName, user);
          if (res.ok) {
            this.isCurrentlyLockedByMe = true;
          }
        }
      } else {
        // Usuario inactivo (>= 5 min sin movimientos): desbloquear el lienzo para otros usuarios
        if (this.isCurrentlyLockedByMe) {
          await ConcurrencyLockService.releaseLock(activeProjectFileName, user);
          this.isCurrentlyLockedByMe = false;
        }
      }
    } else {
      this.isCurrentlyLockedByMe = false;
    }

    // 2. Persistir presencia en Neon PostgreSQL
    const sql = NeonClient.getSql();
    if (sql) {
      try {
        // Crear tabla si no existe
        await sql`
          CREATE TABLE IF NOT EXISTS user_presence (
            user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
            last_action_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            active_project_file_name VARCHAR(255) NULL,
            active_project_title VARCHAR(255) NULL,
            is_logged_in BOOLEAN NOT NULL DEFAULT true
          );
        `;

        const lastActionIso = new Date(this.lastActionTimestamp).toISOString();

        await sql`
          INSERT INTO user_presence (
            user_id, last_action_at, last_heartbeat_at, active_project_file_name, active_project_title, is_logged_in
          ) VALUES (
            ${user.id},
            ${lastActionIso},
            NOW(),
            ${isUserActive ? (activeProjectFileName || null) : null},
            ${isUserActive ? (activeProjectTitle || null) : null},
            true
          )
          ON CONFLICT (user_id) DO UPDATE SET
            last_action_at = EXCLUDED.last_action_at,
            last_heartbeat_at = NOW(),
            active_project_file_name = EXCLUDED.active_project_file_name,
            active_project_title = EXCLUDED.active_project_title,
            is_logged_in = true;
        `;
      } catch (err) {
        console.warn('Error al actualizar presencia en Neon:', err);
      }
    }

    // Cache local de respaldo
    try {
      const info: UserPresenceInfo = {
        userId: user.id,
        state: isUserActive ? 'ACTIVE' : 'INACTIVE',
        lastActionAt: new Date(this.lastActionTimestamp).toISOString(),
        lastHeartbeatAt: new Date().toISOString(),
        activeProjectFileName: isUserActive ? (activeProjectFileName || null) : null,
        activeProjectTitle: isUserActive ? (activeProjectTitle || null) : null
      };
      localStorage.setItem(LOCAL_PRESENCE_KEY, JSON.stringify(info));
    } catch {
      // ignore
    }
  }

  /**
   * Consulta el estado de presencia de todos los usuarios (para Consola de Administración)
   */
  public static async getAllUsersPresence(): Promise<Map<string, UserPresenceInfo>> {
    const result = new Map<string, UserPresenceInfo>();
    const sql = NeonClient.getSql();

    if (sql) {
      try {
        await sql`
          CREATE TABLE IF NOT EXISTS user_presence (
            user_id UUID PRIMARY KEY REFERENCES app_users(id) ON DELETE CASCADE,
            last_action_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            active_project_file_name VARCHAR(255) NULL,
            active_project_title VARCHAR(255) NULL,
            is_logged_in BOOLEAN NOT NULL DEFAULT true
          );
        `;

        const rows = (await sql`
          SELECT user_id, last_action_at, last_heartbeat_at, active_project_file_name, active_project_title, is_logged_in
          FROM user_presence;
        `) as any[];

        const now = Date.now();

        for (const r of rows) {
          const lastHeartbeat = new Date(r.last_heartbeat_at).getTime();
          const lastAction = new Date(r.last_action_at).getTime();

          let state: UserPresenceState = 'DISCONNECTED';

          // Si pasaron más de 8 minutos desde el último latido o se marcó logged_out, está desconectado
          if (!r.is_logged_in || now - lastHeartbeat > 8 * 60 * 1000) {
            state = 'DISCONNECTED';
          } else if (now - lastAction < IDLE_THRESHOLD_MS) {
            // Acción en los últimos 5 minutos: En Actividad
            state = 'ACTIVE';
          } else {
            // Logueado pero sin movimientos en 5 minutos: Inactivo
            state = 'INACTIVE';
          }

          result.set(r.user_id, {
            userId: r.user_id,
            state,
            lastActionAt: new Date(r.last_action_at).toISOString(),
            lastHeartbeatAt: new Date(r.last_heartbeat_at).toISOString(),
            activeProjectFileName: state === 'ACTIVE' ? r.active_project_file_name : null,
            activeProjectTitle: state === 'ACTIVE' ? r.active_project_title : null
          });
        }
        return result;
      } catch (err) {
        console.warn('Error al consultar presencia de usuarios en Neon:', err);
      }
    }

    return result;
  }
}
