import jsPDF from 'jspdf';
import { AuditLogEntry } from '../types/auth';
import { calculateSha256 } from '../utils/cryptoUtils';

export class AuditPdfExportService {
  /**
   * Genera y descarga un Informe Oficial Foliado de Auditoría (ISO 9001:2015)
   */
  public static async generateCertifiedReport(
    logs: AuditLogEntry[],
    requesterName: string,
    filtersApplied?: { startDate?: string; endDate?: string; userEmail?: string }
  ): Promise<void> {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const emissionDate = new Date();
    const emissionIso = emissionDate.toISOString();
    const docControlCode = `AUD-ISO9001-${emissionIso.slice(0, 10).replace(/-/g, '')}-${logs.length}`;

    // 1. Calcular hash criptográfico de integridad
    const serializedPayload = logs.map(l => `${l.id}|${l.timestamp}|${l.userEmail}|${l.actionType}`).join('\n');
    const integrityHash = await calculateSha256(serializedPayload || 'EMPTY_LOG_SET');

    // Configuración de paginación
    const rowsPerPage = 12;
    const totalPages = Math.max(1, Math.ceil(logs.length / rowsPerPage));

    for (let page = 1; page <= totalPages; page++) {
      if (page > 1) {
        doc.addPage('a4', 'landscape');
      }

      // Encabezado Institucional
      doc.setFillColor(15, 23, 42); // slate-900
      doc.rect(margin, margin, contentWidth, 20, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(255, 255, 255);
      doc.text('PROCESSTUDIO — REGISTRO OFICIAL DE AUDITORÍA Y TRAZABILIDAD', margin + 6, margin + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(
        `Control Documental: ${docControlCode} | Norma Aplicable: ISO 9001:2015 (Cláusula 7.5.3 - Control de Información Documentada)`,
        margin + 6,
        margin + 15
      );

      // Metadatos de la página
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      const startIdx = (page - 1) * rowsPerPage;
      const endIdx = Math.min(logs.length, page * rowsPerPage);
      const pageLogs = logs.slice(startIdx, endIdx);

      let currentY = margin + 26;

      // Caja de Metadatos de Emisión en Página 1
      if (page === 1) {
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.roundedRect(margin, currentY, contentWidth, 18, 2, 2, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.text('Emisor / Auditor:', margin + 4, currentY + 6);
        doc.setFont('helvetica', 'normal');
        doc.text(requesterName, margin + 34, currentY + 6);

        doc.setFont('helvetica', 'bold');
        doc.text('Fecha de Emisión:', margin + 110, currentY + 6);
        doc.setFont('helvetica', 'normal');
        doc.text(emissionIso.replace('T', ' ').slice(0, 19) + ' UTC', margin + 140, currentY + 6);

        doc.setFont('helvetica', 'bold');
        doc.text('Eventos Auditados:', margin + 210, currentY + 6);
        doc.setFont('helvetica', 'normal');
        doc.text(`${logs.length} registros`, margin + 242, currentY + 6);

        doc.setFont('helvetica', 'bold');
        doc.text('Filtros / Alcance:', margin + 4, currentY + 13);
        doc.setFont('helvetica', 'normal');
        const filterStr = `Usuario: ${filtersApplied?.userEmail || 'Todos'} | Rango: ${filtersApplied?.startDate || 'Inicio'} a ${filtersApplied?.endDate || 'Actual'}`;
        doc.text(filterStr, margin + 34, currentY + 13);

        currentY += 23;
      }

      // Tabla de Eventos
      doc.setFillColor(30, 41, 59); // Slate-800
      doc.rect(margin, currentY, contentWidth, 8, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(255, 255, 255);

      doc.text('Fecha / Hora (UTC)', margin + 3, currentY + 5.5);
      doc.text('Usuario (Email)', margin + 42, currentY + 5.5);
      doc.text('Rol', margin + 105, currentY + 5.5);
      doc.text('Acción Auditada', margin + 125, currentY + 5.5);
      doc.text('Recurso / Lienzo', margin + 185, currentY + 5.5);
      doc.text('Detalles Relevantes', margin + 230, currentY + 5.5);

      currentY += 8;

      // Filas
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);

      if (pageLogs.length === 0) {
        doc.setTextColor(100, 116, 139);
        doc.text('No hay eventos registrados bajo los criterios seleccionados.', margin + 3, currentY + 8);
        currentY += 15;
      } else {
        pageLogs.forEach((item, idx) => {
          const rowBg = idx % 2 === 0 ? 255 : 248;
          doc.setFillColor(rowBg, rowBg, rowBg);
          doc.rect(margin, currentY, contentWidth, 9, 'F');

          doc.setTextColor(15, 23, 42);

          const timeFormatted = item.timestamp.replace('T', ' ').slice(0, 19);
          doc.text(timeFormatted, margin + 3, currentY + 6);

          const emailTruncated = item.userEmail.length > 32 ? item.userEmail.slice(0, 30) + '..' : item.userEmail;
          doc.text(emailTruncated, margin + 42, currentY + 6);

          doc.text(item.userRole, margin + 105, currentY + 6);

          doc.setFont('helvetica', 'bold');
          doc.text(item.actionType, margin + 125, currentY + 6);
          doc.setFont('helvetica', 'normal');

          const resource = item.targetResource ? (item.targetResource.length > 24 ? item.targetResource.slice(0, 22) + '..' : item.targetResource) : '-';
          doc.text(resource, margin + 185, currentY + 6);

          const detailsStr = JSON.stringify(item.details || {});
          const detailsTruncated = detailsStr.length > 30 ? detailsStr.slice(0, 28) + '..' : detailsStr;
          doc.text(detailsTruncated, margin + 230, currentY + 6);

          currentY += 9;
        });
      }

      // Bloque de Firmas y Sello Criptográfico en la última página
      if (page === totalPages) {
        const signY = pageHeight - 34;

        doc.setDrawColor(203, 213, 225);
        doc.line(margin, signY - 2, pageWidth - margin, signY - 2);

        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Sello Digital SHA-256 de Integridad: ${integrityHash}`, margin, signY + 3);

        // Líneas de firma
        doc.line(margin + 40, signY + 18, margin + 100, signY + 18);
        doc.text('Firma del Responsable de Calidad', margin + 45, signY + 22);

        doc.line(pageWidth - margin - 100, signY + 18, pageWidth - margin - 40, signY + 18);
        doc.text('Firma del Auditor del Sistema', pageWidth - margin - 95, signY + 22);
      }

      // Pie de Página Foliado
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text(
        `ProcesStudio v1.1.0 • Certificación ISO 9001:2015 • Página ${page} de ${totalPages}`,
        pageWidth / 2,
        pageHeight - 6,
        { align: 'center' }
      );
    }

    const fileName = `Informe_Auditoria_ISO9001_${emissionIso.slice(0, 10)}.pdf`;
    doc.save(fileName);
  }
}
