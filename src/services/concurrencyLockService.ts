import { AppUser, CanvasActiveLock } from '../types/auth';
import { NeonClient } from './neonClient';
import { AuditLoggerService } from './auditLoggerService';

const LOCAL_STORAGE_LOCKS_FALLBACK = 'procesos_active_locks_fallback';
const LOCK_DURATION_MS = 5 * 60 * 1000; // 5 minutos de vigencia por latido

export class ConcurrencyLockService {
  private static heartbeatInterval: any = null;
  private static currentLockedProject: string | null = null;

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
        // 1. Limpiar candados vencidos
        await sql`DELETE FROM canvas_active_locks WHERE expires_at <= NOW();`;

        // 2. Verificar si hay un candado activo de otro usuario
        const existing = (await sql`
          SELECT project_file_name, user_id, user_name, locked_at, expires_at
          FROM canvas_active_locks
          WHERE project_file_name = ${projectFileName}
          LIMIT 1;
        `) as any[];

        if (existing && existing.length > 0) {
          const lock = existing[0];
          if (lock.user_id !== user.id) {
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

    this.currentLockedProject = projectFileName;
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
   * Consulta el estado de bloqueo de un lienzo
   */
  public static async checkLock(
    projectFileName: string,
    currentUserId: string
  ): Promise<{ isLocked: boolean; lockedBy?: string; isLockedByMe: boolean }> {
    const sql = NeonClient.getSql();
    if (sql) {
      try {
        const rows = (await sql`
          SELECT project_file_name, user_id, user_name, expires_at
          FROM canvas_active_locks
          WHERE project_file_name = ${projectFileName} AND expires_at > NOW()
          LIMIT 1;
        `) as any[];

        if (rows && rows.length > 0) {
          const lock = rows[0];
          return {
            isLocked: true,
            lockedBy: lock.user_name,
            isLockedByMe: lock.user_id === currentUserId
          };
        }
      } catch (err) {
        console.warn('Error al verificar candado en Neon:', err);
      }
    }

    const locks = this.getLocalLocks().filter(l => new Date(l.expiresAt).getTime() > Date.now());
    const lock = locks.find(l => l.projectFileName === projectFileName);
    if (lock) {
      return {
        isLocked: true,
        lockedBy: lock.userName,
        isLockedByMe: lock.userId === currentUserId
      };
    }

    return { isLocked: false, isLockedByMe: false };
  }

  /**
   * Libera voluntariamente el candado de edición
   */
  public static async releaseLock(projectFileName: string, user: AppUser): Promise<void> {
    this.stopHeartbeat();
    this.currentLockedProject = null;

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
   * Inicia el latido (heartbeat) periódico cada 60 segundos
   */
  private static startHeartbeat(projectFileName: string, user: AppUser): void {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(async () => {
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

  private static stopHeartbeat(): void {
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
