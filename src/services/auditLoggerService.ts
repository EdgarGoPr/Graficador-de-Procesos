import { AuditActionType, AuditLogEntry, UserRole } from '../types/auth';
import { NeonClient } from './neonClient';
import * as XLSX from 'xlsx';

const LOCAL_STORAGE_AUDIT_FALLBACK = 'procesos_audit_logs_fallback';

export class AuditLoggerService {
  /**
   * Registra un evento en la tabla de auditoría (Neon y fallback local)
   */
  public static async log(
    actionType: AuditActionType,
    user: { id?: string | null; email: string; role: UserRole },
    targetResource?: string | null,
    details: Record<string, any> = {}
  ): Promise<void> {
    const entry: AuditLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      userId: user.id || null,
      userEmail: user.email,
      userRole: user.role,
      actionType,
      targetResource: targetResource || null,
      details,
      ipClient: 'web-client'
    };

    // 1. Intentar persistir en Neon PostgreSQL
    const sql = NeonClient.getSql();
    if (sql) {
      try {
        await sql`
          INSERT INTO audit_logs (
            id,
            timestamp,
            user_id,
            user_email,
            user_role,
            action_type,
            target_resource,
            details,
            ip_client
          ) VALUES (
            ${entry.id},
            ${entry.timestamp},
            ${entry.userId},
            ${entry.userEmail},
            ${entry.userRole},
            ${entry.actionType},
            ${entry.targetResource},
            ${JSON.stringify(entry.details)},
            ${entry.ipClient}
          );
        `;
      } catch (err) {
        console.warn('No se pudo guardar log en Neon, guardando en buffer local:', err);
        this.saveToFallback(entry);
      }
    } else {
      this.saveToFallback(entry);
    }
  }

  /**
   * Guarda un log en el buffer local de navegador si no hay base de datos conectada
   */
  private static saveToFallback(entry: AuditLogEntry): void {
    try {
      const current = this.getFallbackLogs();
      current.unshift(entry);
      // Limitar a los últimos 500 logs en memoria
      const capped = current.slice(0, 500);
      localStorage.setItem(LOCAL_STORAGE_AUDIT_FALLBACK, JSON.stringify(capped));
    } catch (e) {
      console.error('Error al guardar log en buffer local:', e);
    }
  }

  /**
   * Recupera logs del buffer local
   */
  public static getFallbackLogs(): AuditLogEntry[] {
    try {
      const data = localStorage.getItem(LOCAL_STORAGE_AUDIT_FALLBACK);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  /**
   * Obtiene logs filtrados de Neon o del buffer local (exclusivo para Administrador)
   */
  public static async queryLogs(filters?: {
    userEmail?: string;
    actionType?: string;
    targetResource?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    const sql = NeonClient.getSql();
    const limit = filters?.limit || 300;

    if (sql) {
      try {
        const rows = (await sql`
          SELECT 
            id,
            timestamp,
            user_id,
            user_email,
            user_role,
            action_type,
            target_resource,
            details,
            ip_client
          FROM audit_logs
          WHERE (${filters?.userEmail ? sql`user_email ILIKE ${'%' + filters.userEmail + '%'}` : sql`true`})
            AND (${filters?.actionType && filters.actionType !== 'ALL' ? sql`action_type = ${filters.actionType}` : sql`true`})
            AND (${filters?.targetResource ? sql`target_resource ILIKE ${'%' + filters.targetResource + '%'}` : sql`true`})
            AND (${filters?.startDate ? sql`timestamp >= ${filters.startDate}` : sql`true`})
            AND (${filters?.endDate ? sql`timestamp <= ${filters.endDate + 'T23:59:59.999Z'}` : sql`true`})
          ORDER BY timestamp DESC
          LIMIT ${limit};
        `) as any[];

        return rows.map((r: any) => ({
          id: r.id,
          timestamp: typeof r.timestamp === 'string' ? r.timestamp : new Date(r.timestamp).toISOString(),
          userId: r.user_id,
          userEmail: r.user_email,
          userRole: r.user_role,
          actionType: r.action_type,
          targetResource: r.target_resource,
          details: typeof r.details === 'string' ? JSON.parse(r.details) : r.details || {},
          ipClient: r.ip_client
        }));
      } catch (err) {
        console.error('Error al consultar logs en Neon, cargando fallback local:', err);
      }
    }

    // Fallback local en memoria/localStorage
    let logs = this.getFallbackLogs();
    if (filters?.userEmail) {
      logs = logs.filter(l => l.userEmail.toLowerCase().includes(filters.userEmail!.toLowerCase()));
    }
    if (filters?.actionType && filters.actionType !== 'ALL') {
      logs = logs.filter(l => l.actionType === filters.actionType);
    }
    if (filters?.targetResource) {
      logs = logs.filter(l => l.targetResource && l.targetResource.toLowerCase().includes(filters.targetResource!.toLowerCase()));
    }
    if (filters?.startDate) {
      logs = logs.filter(l => l.timestamp >= filters.startDate!);
    }
    if (filters?.endDate) {
      logs = logs.filter(l => l.timestamp <= filters.endDate! + 'T23:59:59.999Z');
    }
    return logs.slice(0, limit);
  }

  /**
   * Exporta la lista de logs a un archivo Excel (.xlsx) estructurado
   */
  public static exportToExcel(logs: AuditLogEntry[]): void {
    const headers = [
      'ID Evento',
      'Marca Temporal (ISO)',
      'Usuario (Email)',
      'Rol del Usuario',
      'Acción Registrada',
      'Recurso / Lienzo',
      'Detalles Técnicos (JSON)',
      'Cliente / IP'
    ];

    const rows = logs.map(l => [
      l.id,
      l.timestamp,
      l.userEmail,
      l.userRole,
      l.actionType,
      l.targetResource || 'N/A',
      JSON.stringify(l.details),
      l.ipClient || 'Web'
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    worksheet['!cols'] = [
      { wch: 36 }, // ID
      { wch: 25 }, // Timestamp
      { wch: 30 }, // Email
      { wch: 15 }, // Rol
      { wch: 28 }, // Acción
      { wch: 30 }, // Recurso
      { wch: 45 }, // Detalles
      { wch: 15 }  // IP
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Logs de Auditoría');

    const fileName = `Auditoria_ProcesStudio_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
}
