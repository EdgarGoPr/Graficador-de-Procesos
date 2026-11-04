import { AppUser, CanvasActiveLock } from '../types/auth';
import { NeonClient } from './neonClient';
import { AuditLoggerService } from './auditLoggerService';
import { PresenceService } from './presenceService';

const LOCAL_STORAGE_LOCKS_FALLBACK = 'procesos_active_locks_fallback';
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutos de vigencia por latido

export class ConcurrencyLockService {
  private static heartbeatInterval: any = null;

  /**
   * Intenta adquirir el candado de edición sobre un lienzo
   */
  public static async acquireLock(
    projectFileName: string,
    user: AppUser
  ): Promise<{ ok: boolean; lock?: CanvasActiveLock; activeConflict?: CanvasActiveLock }> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + LOCK_DURATION_MS).toISOString();

    const sql = NeonClient.getSql();
    if (sql) {
      try {
        // 1. Limpiar candados vencidos por expiración de tiempo
        await sql`DELETE FROM canvas_active_locks WHERE expires_at <= NOW();`;

        // 2. Verificar si hay un candado activo cruzando con presencia del usuario (PST-101)
        const existing = (await sql`
          SELECT c.project_file_name, c.user_id, c.user_name, c.locked_at, c.expires_at,
                 p.is_logged_in, p.last_action_at, p.last_heartbeat_at
          FROM canvas_active_locks c
          LEFT JOIN user_presence p ON c.user_id = p.user_id
          WHERE c.project_file_name = ${projectFileName}
          LIMIT 1;
        `) as any[];

        if (existing && existing.length > 0) {
          const lock = existing[0];
          if (lock.user_id !== user.id) {
            const isLoggedOut = lock.is_logged_in === false;
            const lastActionTime = lock.last_action_at ? new Date(lock.last_action_at).getTime() : 0;
            const isIdle = (Date.now() - lastActionTime) >= (5 * 60 * 1000);
            const lastHeartbeat = lock.last_heartbeat_at ? new Date(lock.last_heartbeat_at).getTime() : 0;
            const isDisconnected = (Date.now() - lastHeartbeat) >= (8 * 60 * 1000);

            if (isLoggedOut || isIdle || isDisconnected) {
              // El usuario poseedor se deslogueó o lleva más de 5 min inactivo: liberar candado obsoleto
              await sql`DELETE FROM canvas_active_locks WHERE project_file_name = ${projectFileName};`;
            } else {
              return {
                ok: false,
                activeConflict: {
                  projectFileName: lock.project_file_name,
                  userId: lock.user_id,
                  userName: lock.user_name,
                  lockedAt: new Date(lock.locked_at).toISOString(),
                  expiresAt: new Date(lock.expires_at).toISOString()
                }
              };
            }
          }
        }

        // 3. Adquirir o renovar mi candado
        await sql`
          INSERT INTO canvas_active_locks (
            project_file_name, user_id, user_name, locked_at, expires_at
          ) VALUES (
            ${projectFileName}, ${user.id}, ${user.fullName}, NOW(), ${expiresAt}
          )
          ON CONFLICT (project_file_name) DO UPDATE SET
            user_id = EXCLUDED.user_id,
            user_name = EXCLUDED.user_name,
            locked_at = NOW(),
            expires_at = EXCLUDED.expires_at;
        `;
      } catch (err) {
        console.warn('Error al gestionar candado en Neon, usando fallback local:', err);
      }
    } else {
      // Fallback local
      const locks = this.getLocalLocks().filter(l => new Date(l.expiresAt).getTime() > Date.now());
      const conflict = locks.find(l => l.projectFileName === projectFileName && l.userId !== user.id);
      if (conflict) {
        return { ok: false, activeConflict: conflict };
      }
      const myLock: CanvasActiveLock = {
        projectFileName,
        userId: user.id,
        userName: user.fullName,
        lockedAt: now.toISOString(),
        expiresAt
      };
      const updated = locks.filter(l => l.projectFileName !== projectFileName);
      updated.push(myLock);
      localStorage.setItem(LOCAL_STORAGE_LOCKS_FALLBACK, JSON.stringify(updated));
    }

    this.startHeartbeat(projectFileName, user);

    await AuditLoggerService.log('CANVAS_LOCK_ACQUIRED', user, projectFileName);

    return {
      ok: true,
      lock: {
        projectFileName,
        userId: user.id,
        userName: user.fullName,
        lockedAt: now.toISOString(),
        expiresAt
      }
    };
  }

  /**
   * Libera voluntariamente el candado de edición de un proyecto específico
   */
  public static async releaseLock(projectFileName: string, user: AppUser): Promise<void> {
    this.stopHeartbeat();

    const sql = NeonClient.getSql();
    if (sql) {
      try {
        await sql`
          DELETE FROM canvas_active_locks
          WHERE project_file_name = ${projectFileName} AND user_id = ${user.id};
        `;
      } catch (err) {
        console.warn('Error al liberar candado en Neon:', err);
      }
    } else {
      const locks = this.getLocalLocks().filter(
        l => !(l.projectFileName === projectFileName && l.userId === user.id)
      );
      localStorage.setItem(LOCAL_STORAGE_LOCKS_FALLBACK, JSON.stringify(locks));
    }

    await AuditLoggerService.log('CANVAS_LOCK_RELEASED', user, projectFileName);
  }

  /**
   * Libera de forma total e incondicional todos los candados de un usuario (al cerrar sesión o salir)
   */
  public static async releaseAllUserLocks(user: AppUser): Promise<void> {
    this.stopHeartbeat();

    const sql = NeonClient.getSql();
    if (sql) {
      try {
        await sql`
          DELETE FROM canvas_active_locks
          WHERE user_id = ${user.id};
        `;
      } catch (err) {
        console.warn('Error al liberar todos los candados en Neon:', err);
      }
    }

    const locks = this.getLocalLocks().filter(l => l.userId !== user.id);
    localStorage.setItem(LOCAL_STORAGE_LOCKS_FALLBACK, JSON.stringify(locks));
  }

  /**
   * Inicia el latido (heartbeat) periódico cada 60 segundos con verificación de actividad real
   */
  private static startHeartbeat(projectFileName: string, user: AppUser): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(async () => {
      // Si el usuario ya no está activo (< 5 min), no extender candado
      if (!PresenceService.isUserCurrentlyActive()) {
        this.stopHeartbeat();
        return;
      }

      const expiresAt = new Date(Date.now() + LOCK_DURATION_MS).toISOString();
      const sql = NeonClient.getSql();
      if (sql) {
        try {
          await sql`
            UPDATE canvas_active_locks SET
              expires_at = ${expiresAt}
            WHERE project_file_name = ${projectFileName} AND user_id = ${user.id};
          `;
        } catch {
          // ignore
        }
      }
    }, 60000);
  }

  public static stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private static getLocalLocks(): CanvasActiveLock[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_LOCKS_FALLBACK);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}
