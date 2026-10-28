import { AppUser, CanvasPermission, ProjectUserPermission } from '../types/auth';
import { NeonClient } from './neonClient';
import { AuditLoggerService } from './auditLoggerService';

const LOCAL_STORAGE_PERMISSIONS_FALLBACK = 'procesos_permissions_fallback';

export class PermissionService {
  /**
   * Obtiene el nivel de permiso efectivo de un usuario sobre un lienzo específico
   * - ADMINISTRADOR: Siempre tiene permiso 'EDITOR'
   * - CREADOR DEL PROYECTO: Siempre tiene permiso 'EDITOR'
   * - USUARIO REGULAR: Solo lo que tenga asignado en la matriz. Si no tiene asignación, devuelve null (sin acceso)
   */
  public static async getEffectivePermission(
    user: AppUser | null,
    projectFileName: string,
    projectInfo?: { authorName?: string; createdByEmail?: string; createdByUserId?: string } | null
  ): Promise<CanvasPermission | null> {
    if (!user) return null;
    if (user.role === 'ADMIN') return 'EDITOR';

    if (projectInfo) {
      if (projectInfo.createdByUserId && projectInfo.createdByUserId === user.id) return 'EDITOR';
      if (projectInfo.createdByEmail && user.email && projectInfo.createdByEmail.toLowerCase() === user.email.toLowerCase()) return 'EDITOR';
      if (projectInfo.authorName && user.fullName && projectInfo.authorName.trim().toLowerCase() === user.fullName.trim().toLowerCase()) return 'EDITOR';
    }

    const permissions = await this.listUserPermissions(user.id);
    const assigned = permissions.find(p => p.projectFileName === projectFileName);

    if (assigned) return assigned.permissionLevel;

    const local = this.getLocalPermissions();
    const localAssigned = local.find(p => p.userId === user.id && p.projectFileName === projectFileName);
    return localAssigned ? localAssigned.permissionLevel : null;
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
   * Determina si un usuario tiene autorización para gestionar participantes en un proyecto
   * - Administradores (rol ADMIN) siempre tienen autorización.
   * - Creadores del proyecto (por ID, email o nombre de autor) tienen autorización sobre su proyecto.
   */
  public static canUserManageProjectParticipants(
    user: AppUser | null,
    project?: { authorName?: string; createdByEmail?: string; createdByUserId?: string } | null
  ): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    if (!project) return false;

    if (project.createdByUserId && project.createdByUserId === user.id) return true;
    if (project.createdByEmail && user.email && project.createdByEmail.toLowerCase() === user.email.toLowerCase()) return true;
    if (project.authorName && user.fullName && project.authorName.trim().toLowerCase() === user.fullName.trim().toLowerCase()) return true;

    return false;
  }

  /**
   * Asigna o modifica el permiso de un usuario sobre un lienzo (Administrador o Creador del Proyecto)
   */
  public static async assignPermission(
    operatorUser: AppUser,
    targetUserId: string,
    projectFileName: string,
    permissionLevel: CanvasPermission,
    projectInfo?: { authorName?: string; createdByEmail?: string; createdByUserId?: string } | null
  ): Promise<{ ok: boolean; error?: string }> {
    if (!this.canUserManageProjectParticipants(operatorUser, projectInfo)) {
      return { ok: false, error: 'Solo los administradores o el creador del proyecto pueden asignar participantes.' };
    }

    const sql = NeonClient.getSql();
    if (sql) {
      try {
        const isOperatorUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(operatorUser.id);
        if (isOperatorUuid) {
          await sql`
            INSERT INTO project_user_permissions (
              id, user_id, project_file_name, permission_level, assigned_by, assigned_at
            ) VALUES (
              gen_random_uuid(),
              ${targetUserId}::uuid,
              ${projectFileName},
              ${permissionLevel},
              ${operatorUser.id}::uuid,
              NOW()
            )
            ON CONFLICT (user_id, project_file_name) DO UPDATE SET
              permission_level = EXCLUDED.permission_level,
              assigned_by = EXCLUDED.assigned_by,
              assigned_at = NOW();
          `;
        } else {
          await sql`
            INSERT INTO project_user_permissions (
              id, user_id, project_file_name, permission_level, assigned_by, assigned_at
            ) VALUES (
              gen_random_uuid(),
              ${targetUserId}::uuid,
              ${projectFileName},
              ${permissionLevel},
              NULL,
              NOW()
            )
            ON CONFLICT (user_id, project_file_name) DO UPDATE SET
              permission_level = EXCLUDED.permission_level,
              assigned_at = NOW();
          `;
        }
      } catch (err: any) {
        console.error('Error al persistir permiso en Neon:', err);
        return { ok: false, error: err?.message ? `Error en base de datos: ${err.message}` : 'Error al guardar permiso en base de datos.' };
      }
    }

    // Mantener siempre actualizado el fallback local síncrono
    const local = this.getLocalPermissions();
    const existingIdx = local.findIndex(
      p => p.userId === targetUserId && p.projectFileName === projectFileName
    );
    if (existingIdx !== -1) {
      local[existingIdx].permissionLevel = permissionLevel;
      local[existingIdx].assignedBy = operatorUser.id;
      local[existingIdx].assignedAt = new Date().toISOString();
    } else {
      local.push({
        id: crypto.randomUUID(),
        userId: targetUserId,
        projectFileName,
        permissionLevel,
        assignedBy: operatorUser.id,
        assignedAt: new Date().toISOString()
      });
    }
    localStorage.setItem(LOCAL_STORAGE_PERMISSIONS_FALLBACK, JSON.stringify(local));

    await AuditLoggerService.log(
      'CANVAS_PERMISSION_ASSIGNED',
      operatorUser,
      projectFileName,
      { targetUserId, permissionLevel, operatorRole: operatorUser.role }
    );

    return { ok: true };
  }

  /**
   * Desasigna el permiso de un usuario sobre un lienzo (Administrador o Creador del Proyecto)
   */
  public static async removePermission(
    operatorUser: AppUser,
    targetUserId: string,
    projectFileName: string,
    projectInfo?: { authorName?: string; createdByEmail?: string; createdByUserId?: string } | null
  ): Promise<{ ok: boolean; error?: string }> {
    if (!this.canUserManageProjectParticipants(operatorUser, projectInfo)) {
      return { ok: false, error: 'Solo los administradores o el creador del proyecto pueden revocar permisos.' };
    }

    const sql = NeonClient.getSql();
    if (sql) {
      try {
        await sql`
          DELETE FROM project_user_permissions
          WHERE user_id = ${targetUserId}::uuid AND project_file_name = ${projectFileName};
        `;
      } catch (err: any) {
        console.error('Error al eliminar permiso en Neon:', err);
        return { ok: false, error: err?.message ? `Error en base de datos: ${err.message}` : 'Error al revocar permiso en la base de datos.' };
      }
    }

    // Mantener actualizado el fallback local
    const local = this.getLocalPermissions();
    const filtered = local.filter(
      p => !(p.userId === targetUserId && p.projectFileName === projectFileName)
    );
    localStorage.setItem(LOCAL_STORAGE_PERMISSIONS_FALLBACK, JSON.stringify(filtered));

    await AuditLoggerService.log(
      'CANVAS_PERMISSION_REMOVED',
      operatorUser,
      projectFileName,
      { targetUserId, operatorRole: operatorUser.role }
    );

    return { ok: true };
  }

  /**
   * Lista todos los participantes de un proyecto específico con su información de perfil
   */
  public static async listProjectParticipants(projectFileName: string): Promise<Array<{
    id: string;
    userId: string;
    fullName: string;
    email: string;
    organizationUnit: string;
    permissionLevel: CanvasPermission;
    assignedAt: string;
  }>> {
    const sql = NeonClient.getSql();
    if (sql) {
      try {
        const rows = (await sql`
          SELECT 
            p.id, p.user_id, p.permission_level, p.assigned_at,
            u.full_name, u.email, u.organization_unit
          FROM project_user_permissions p
          JOIN app_users u ON p.user_id = u.id
          WHERE p.project_file_name = ${projectFileName};
        `) as any[];

        return rows.map(r => ({
          id: r.id,
          userId: r.user_id,
          fullName: r.full_name || 'Usuario',
          email: r.email,
          organizationUnit: r.organization_unit || '',
          permissionLevel: r.permission_level as CanvasPermission,
          assignedAt: typeof r.assigned_at === 'string' ? r.assigned_at : new Date(r.assigned_at).toISOString()
        }));
      } catch (err) {
        console.warn('Error al consultar participantes en Neon, usando fallback local:', err);
      }
    }

    // Fallback local: cruzar con usuarios locales
    const localPerms = this.getLocalPermissions().filter(p => p.projectFileName === projectFileName);
    const localUsersRaw = localStorage.getItem('procesos_users_fallback');
    const localUsers: AppUser[] = localUsersRaw ? JSON.parse(localUsersRaw) : [];

    return localPerms.map(p => {
      const u = localUsers.find(user => user.id === p.userId);
      return {
        id: p.id,
        userId: p.userId,
        fullName: u ? u.fullName : 'Usuario',
        email: u ? u.email : 'sin-email',
        organizationUnit: u ? u.organizationUnit : '',
        permissionLevel: p.permissionLevel,
        assignedAt: p.assignedAt
      };
    });
  }

  /**
   * Obtiene sincrónicamente el nivel de permiso de un usuario sobre un lienzo específico
   * (Útil para componentes de renderizado síncrono como ProjectCard y ProcessCanvas)
   */
  public static getUserPermissionForProject(
    user: AppUser | null,
    projectFileName: string,
    projectInfo?: { authorName?: string; createdByEmail?: string; createdByUserId?: string } | null
  ): CanvasPermission | null {
    if (!user) return null;
    if (user.role === 'ADMIN') return 'EDITOR';

    if (projectInfo) {
      if (projectInfo.createdByUserId && projectInfo.createdByUserId === user.id) return 'EDITOR';
      if (projectInfo.createdByEmail && user.email && projectInfo.createdByEmail.toLowerCase() === user.email.toLowerCase()) return 'EDITOR';
      if (user.fullName && projectInfo.authorName && projectInfo.authorName.trim().toLowerCase() === user.fullName.trim().toLowerCase()) return 'EDITOR';
    }

    const local = this.getLocalPermissions();
    const found = local.find(p => p.userId === user.id && p.projectFileName === projectFileName);
    return found ? found.permissionLevel : null;
  }

  /**
   * Obtiene sincrónicamente la lista de nombres de archivo de lienzos asignados al usuario
   */
  public static getAssignedProjectFileNamesSync(user: AppUser | null): string[] | 'ALL' {
    if (!user) return [];
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
