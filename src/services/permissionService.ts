import { AppUser, CanvasPermission, ProjectUserPermission } from '../types/auth';
import { NeonClient } from './neonClient';
import { AuditLoggerService } from './auditLoggerService';

const LOCAL_STORAGE_PERMISSIONS_FALLBACK = 'procesos_permissions_fallback';

export class PermissionService {
  /**
   * Obtiene el nivel de permiso efectivo de un usuario sobre un lienzo específico
   * - ADMINISTRADOR: Siempre tiene permiso 'EDITOR'
   * - USUARIO REGULAR: Solo lo que tenga asignado en la matriz. Si no tiene asignación, devuelve null (sin acceso)
   */
  public static async getEffectivePermission(
    user: AppUser | null,
    projectFileName: string
  ): Promise<CanvasPermission | null> {
    if (!user) return null;
    if (user.role === 'ADMIN') return 'EDITOR';

    const permissions = await this.listUserPermissions(user.id);
    const assigned = permissions.find(p => p.projectFileName === projectFileName);

    return assigned ? assigned.permissionLevel : null;
  }

  /**
   * Obtiene la lista de nombres de archivo de lienzos asignados al usuario
   */
  public static async getAssignedProjectFileNames(user: AppUser | null): Promise<string[] | 'ALL'> {
    if (!user) return [];
    if (user.role === 'ADMIN') return 'ALL'; // Administrador ve todos

    const perms = await this.listUserPermissions(user.id);
    return perms.map(p => p.projectFileName);
  }

  /**
   * Lista todas las asignaciones de un usuario
   */
  public static async listUserPermissions(userId: string): Promise<ProjectUserPermission[]> {
    const sql = NeonClient.getSql();
    if (sql) {
      try {
        const rows = (await sql`
          SELECT id, user_id, project_file_name, permission_level, assigned_by, assigned_at
          FROM project_user_permissions
          WHERE user_id = ${userId};
        `) as any[];

        return rows.map(r => ({
          id: r.id,
          userId: r.user_id,
          projectFileName: r.project_file_name,
          permissionLevel: r.permission_level as CanvasPermission,
          assignedBy: r.assigned_by,
          assignedAt: typeof r.assigned_at === 'string' ? r.assigned_at : new Date(r.assigned_at).toISOString()
        }));
      } catch (err) {
        console.warn('Error al consultar permisos en Neon, usando fallback local:', err);
      }
    }
    const local = this.getLocalPermissions();
    return local.filter(p => p.userId === userId);
  }

  /**
   * Lista todas las asignaciones existentes de todos los usuarios
   */
  public static async listAllPermissions(): Promise<ProjectUserPermission[]> {
    const sql = NeonClient.getSql();
    if (sql) {
      try {
        const rows = (await sql`
          SELECT id, user_id, project_file_name, permission_level, assigned_by, assigned_at
          FROM project_user_permissions;
        `) as any[];

        return rows.map(r => ({
          id: r.id,
          userId: r.user_id,
          projectFileName: r.project_file_name,
          permissionLevel: r.permission_level as CanvasPermission,
          assignedBy: r.assigned_by,
          assignedAt: typeof r.assigned_at === 'string' ? r.assigned_at : new Date(r.assigned_at).toISOString()
        }));
      } catch (err) {
        console.warn('Error al consultar todos los permisos en Neon:', err);
      }
    }
    return this.getLocalPermissions();
  }

  /**
   * Asigna o modifica el permiso de un usuario sobre un lienzo (Solo Administrador)
   */
  public static async assignPermission(
    adminUser: AppUser,
    targetUserId: string,
    projectFileName: string,
    permissionLevel: CanvasPermission
  ): Promise<{ ok: boolean; error?: string }> {
    if (adminUser.role !== 'ADMIN') {
      return { ok: false, error: 'Solo administradores pueden asignar permisos sobre lienzos.' };
    }

    const sql = NeonClient.getSql();
    if (sql) {
      try {
        await sql`
          INSERT INTO project_user_permissions (
            id, user_id, project_file_name, permission_level, assigned_by, assigned_at
          ) VALUES (
            uuid_generate_v4(),
            ${targetUserId},
            ${projectFileName},
            ${permissionLevel},
            ${adminUser.id},
            NOW()
          )
          ON CONFLICT (user_id, project_file_name) DO UPDATE SET
            permission_level = EXCLUDED.permission_level,
            assigned_by = EXCLUDED.assigned_by,
            assigned_at = NOW();
        `;
      } catch (err) {
        console.error('Error al persistir permiso en Neon:', err);
        return { ok: false, error: 'Error al guardar permiso en base de datos.' };
      }
    } else {
      const local = this.getLocalPermissions();
      const existingIdx = local.findIndex(
        p => p.userId === targetUserId && p.projectFileName === projectFileName
      );
      if (existingIdx !== -1) {
        local[existingIdx].permissionLevel = permissionLevel;
        local[existingIdx].assignedBy = adminUser.id;
        local[existingIdx].assignedAt = new Date().toISOString();
      } else {
        local.push({
          id: crypto.randomUUID(),
          userId: targetUserId,
          projectFileName,
          permissionLevel,
          assignedBy: adminUser.id,
          assignedAt: new Date().toISOString()
        });
      }
      localStorage.setItem(LOCAL_STORAGE_PERMISSIONS_FALLBACK, JSON.stringify(local));
    }

    await AuditLoggerService.log(
      'CANVAS_PERMISSION_ASSIGNED',
      adminUser,
      projectFileName,
      { targetUserId, permissionLevel }
    );

    return { ok: true };
  }

  /**
   * Desasigna el permiso de un usuario sobre un lienzo (Solo Administrador)
   */
  public static async removePermission(
    adminUser: AppUser,
    targetUserId: string,
    projectFileName: string
  ): Promise<{ ok: boolean; error?: string }> {
    if (adminUser.role !== 'ADMIN') {
      return { ok: false, error: 'Solo administradores pueden revocar permisos.' };
    }

    const sql = NeonClient.getSql();
    if (sql) {
      try {
        await sql`
          DELETE FROM project_user_permissions
          WHERE user_id = ${targetUserId} AND project_file_name = ${projectFileName};
        `;
      } catch (err) {
        console.error('Error al eliminar permiso en Neon:', err);
        return { ok: false, error: 'Error al revocar permiso en la base de datos.' };
      }
    } else {
      const local = this.getLocalPermissions();
      const filtered = local.filter(
        p => !(p.userId === targetUserId && p.projectFileName === projectFileName)
      );
      localStorage.setItem(LOCAL_STORAGE_PERMISSIONS_FALLBACK, JSON.stringify(filtered));
    }

    await AuditLoggerService.log(
      'CANVAS_PERMISSION_REMOVED',
      adminUser,
      projectFileName,
      { targetUserId }
    );

    return { ok: true };
  }

  /**
   * Obtiene sincrónicamente el nivel de permiso de un usuario sobre un lienzo específico
   * (Útil para componentes de renderizado síncrono como ProjectCard y ProcessCanvas)
   */
  public static getUserPermissionForProject(
    user: AppUser | null,
    projectFileName: string
  ): CanvasPermission | null {
    if (!user) return 'EDITOR';
    if (user.role === 'ADMIN') return 'EDITOR';
    const local = this.getLocalPermissions();
    const found = local.find(p => p.userId === user.id && p.projectFileName === projectFileName);
    return found ? found.permissionLevel : null;
  }

  /**
   * Obtiene sincrónicamente la lista de nombres de archivo de lienzos asignados al usuario
   */
  public static getAssignedProjectFileNamesSync(user: AppUser | null): string[] | 'ALL' {
    if (!user) return 'ALL';
    if (user.role === 'ADMIN') return 'ALL';
    const local = this.getLocalPermissions();
    return local.filter(p => p.userId === user.id).map(p => p.projectFileName);
  }

  private static getLocalPermissions(): ProjectUserPermission[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_PERMISSIONS_FALLBACK);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }
}
