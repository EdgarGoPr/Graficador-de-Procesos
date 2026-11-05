import { AppUser, CanvasPermission, ProjectUserPermission } from '../types/auth';
import { api, apiErrorMessage } from './apiClient';

type ProjectInfo = { authorName?: string; createdByEmail?: string; createdByUserId?: string; ownerUserId?: string | null } | null;

const enc = encodeURIComponent;

/**
 * Permisos por proyecto. La decisión real la toma siempre el servidor;
 * aquí solo se mantiene una copia para mostrar u ocultar botones.
 */
export class PermissionService {
  private static ownPermissions: Map<string, CanvasPermission> = new Map();
  private static ownUserId: string | null = null;

  /** Carga los permisos del usuario en sesión (los entrega /auth/me y el login). */
  public static setOwnPermissions(
    userId: string,
    list: Array<{ projectFileName: string; permissionLevel: CanvasPermission }>
  ): void {
    this.ownUserId = userId;
    this.ownPermissions = new Map(list.map((p) => [p.projectFileName, p.permissionLevel]));
  }

  /** Actualiza la copia local con el permiso efectivo informado en el listado de proyectos. */
  public static rememberProjectPermission(fileName: string, level: CanvasPermission | null | undefined): void {
    if (level) this.ownPermissions.set(fileName, level);
  }

  public static clearCache(): void {
    this.ownPermissions.clear();
    this.ownUserId = null;
  }

  private static isOwner(user: AppUser, projectInfo?: ProjectInfo): boolean {
    if (!projectInfo) return false;
    const owner = projectInfo.ownerUserId ?? projectInfo.createdByUserId;
    return !!owner && owner === user.id;
  }

  /** Permiso efectivo consultado al servidor (se usa al abrir un lienzo). */
  public static async getEffectivePermission(
    user: AppUser | null,
    projectFileName: string,
    _projectInfo?: ProjectInfo
  ): Promise<CanvasPermission | null> {
    if (!user) return null;
    try {
      const res = await api<{ permission: CanvasPermission }>('GET', `/projects/${enc(projectFileName)}/access`);
      this.rememberProjectPermission(projectFileName, res.permission);
      return res.permission;
    } catch {
      return null;
    }
  }

  public static async listUserPermissions(userId: string): Promise<ProjectUserPermission[]> {
    if (userId !== this.ownUserId) return [];
    return Array.from(this.ownPermissions.entries()).map(([projectFileName, permissionLevel]) => ({
      id: projectFileName,
      userId,
      projectFileName,
      permissionLevel,
      assignedAt: ''
    }));
  }

  /** Solo ADMIN: todas las asignaciones. */
  public static async listAllPermissions(): Promise<ProjectUserPermission[]> {
    try {
      const res = await api<{ permissions: ProjectUserPermission[] }>('GET', '/permissions');
      return res.permissions || [];
    } catch (err) {
      console.warn('Error al consultar permisos:', err);
      return [];
    }
  }

  /** Administradores y propietario del proyecto (el servidor vuelve a validarlo). */
  public static canUserManageProjectParticipants(user: AppUser | null, project?: ProjectInfo): boolean {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return this.isOwner(user, project);
  }

  public static async assignPermission(
    _operatorUser: AppUser,
    targetUserId: string,
    projectFileName: string,
    permissionLevel: CanvasPermission,
    _projectInfo?: ProjectInfo
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      await api('PUT', `/projects/${enc(projectFileName)}/participants/${enc(targetUserId)}`, { body: { permissionLevel } });
      if (targetUserId === this.ownUserId) this.ownPermissions.set(projectFileName, permissionLevel);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: apiErrorMessage(err, 'Error al guardar el permiso.') };
    }
  }

  public static async removePermission(
    _operatorUser: AppUser,
    targetUserId: string,
    projectFileName: string,
    _projectInfo?: ProjectInfo
  ): Promise<{ ok: boolean; error?: string }> {
    try {
      await api('DELETE', `/projects/${enc(projectFileName)}/participants/${enc(targetUserId)}`, { body: {} });
      if (targetUserId === this.ownUserId) this.ownPermissions.delete(projectFileName);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: apiErrorMessage(err, 'Error al revocar el permiso.') };
    }
  }

  public static async assignPermissionByOrganizationUnit(
    _operatorUser: AppUser,
    organizationUnitName: string,
    projectFileName: string,
    permissionLevel: CanvasPermission,
    _allUsers: AppUser[],
    _projectInfo?: ProjectInfo
  ): Promise<{ ok: boolean; count: number; error?: string }> {
    try {
      const res = await api<{ count: number }>('POST', `/projects/${enc(projectFileName)}/participants/by-unit`, {
        body: { organizationUnit: organizationUnitName, permissionLevel }
      });
      return { ok: true, count: res.count };
    } catch (err) {
      return { ok: false, count: 0, error: apiErrorMessage(err, 'Error al asignar permisos por área.') };
    }
  }

  public static async listProjectParticipants(projectFileName: string): Promise<
    Array<{
      id: string;
      userId: string;
      fullName: string;
      email: string;
      organizationUnit: string;
      permissionLevel: CanvasPermission;
      assignedAt: string;
    }>
  > {
    const res = await api<{ participants: any[] }>('GET', `/projects/${enc(projectFileName)}/participants`);
    return res.participants || [];
  }

  public static async getAssignedProjectFileNames(user: AppUser | null): Promise<string[] | 'ALL'> {
    return this.getAssignedProjectFileNamesSync(user);
  }

  /**
   * Permiso conocido para mostrar la interfaz. Proviene del servidor (/auth/me o listado de proyectos).
   */
  public static getUserPermissionForProject(
    user: AppUser | null,
    projectFileName: string,
    projectInfo?: ProjectInfo
  ): CanvasPermission | null {
    if (!user) return null;
    if (user.role === 'ADMIN') return 'EDITOR';
    if (this.isOwner(user, projectInfo)) return 'EDITOR';
    return this.ownPermissions.get(projectFileName) || null;
  }

  public static getAssignedProjectFileNamesSync(user: AppUser | null): string[] | 'ALL' {
    if (!user) return [];
    if (user.role === 'ADMIN') return 'ALL';
    return Array.from(this.ownPermissions.keys());
  }
}
