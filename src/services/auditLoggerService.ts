import { AuditActionType, AuditLogEntry, UserRole } from '../types/auth';
import { api } from './apiClient';
import * as XLSX from 'xlsx';

/**
 * Eventos que el navegador puede reportar. Los de autenticación, usuarios, permisos,
 * candados y papelera los registra exclusivamente el servidor, que además completa
 * usuario, rol, IP y hora (el cliente no puede falsificarlos).
 */
const CLIENT_REPORTABLE: ReadonlySet<AuditActionType> = new Set<AuditActionType>([
  'CANVAS_OPENED',
  'CANVAS_COMMENT_ADDED',
  'CANVAS_COMMENT_UPDATED',
  'CANVAS_PROJECT_SAVED',
  'CANVAS_EXPORT_GENERATED',
  'PROJECT_METADATA_UPDATED',
  'PROJECT_STATUS_CHANGED',
  'CATALOG_ITEM_CREATED',
  'CATALOG_ITEM_UPDATED',
  'CATALOG_ITEM_DELETED'
]);

export class AuditLoggerService {
  /**
   * Reporta un evento al servidor. El parámetro user se conserva por compatibilidad,
   * pero la identidad la toma el servidor de la sesión.
   */
  public static async log(
    actionType: AuditActionType,
    _user: { id?: string | null; email: string; role: UserRole },
    targetResource?: string | null,
    details: Record<string, any> = {}
  ): Promise<void> {
    if (!CLIENT_REPORTABLE.has(actionType)) return;
    try {
      await api('POST', '/audit/events', { body: { actionType, targetResource: targetResource || null, details } });
    } catch (err) {
      console.warn('No se pudo registrar el evento de auditoría:', err);
    }
  }

  /** Solo ADMIN. */
  public static async queryLogs(filters?: {
    userEmail?: string;
    actionType?: string;
    targetResource?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<AuditLogEntry[]> {
    const params = new URLSearchParams();
    if (filters?.userEmail) params.set('userEmail', filters.userEmail);
    if (filters?.actionType && filters.actionType !== 'ALL') params.set('actionType', filters.actionType);
    if (filters?.targetResource) params.set('targetResource', filters.targetResource);
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    params.set('limit', String(filters?.limit || 300));
    try {
      const res = await api<{ logs: AuditLogEntry[] }>('GET', `/audit?${params.toString()}`);
      return res.logs || [];
    } catch (err) {
      console.error('Error al consultar logs de auditoría:', err);
      return [];
    }
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
