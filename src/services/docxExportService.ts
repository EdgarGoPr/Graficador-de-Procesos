import { ProcessProjectFile } from '../types/project';

/**
 * Exports formal Technical Procedure Manual as an editable Microsoft Word document (.doc / .docx compatible HTML package)
 */
export function downloadDocxManual(project: ProcessProjectFile) {
  const docControl = project.documentControl;
  const nodes = project.nodes.filter((n) => n.type !== 'PoolLane' && n.type !== 'StickyNote');

  const content = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset="utf-8">
  <title>${docControl.documentTitle}</title>
  <style>
    body { font-family: 'Calibri', 'Arial', sans-serif; font-size: 11pt; color: #1e293b; line-height: 1.5; margin: 2cm; }
    h1 { font-size: 20pt; color: #0f172a; border-bottom: 2pt solid #0284c7; padding-bottom: 6pt; margin-bottom: 12pt; }
    h2 { font-size: 14pt; color: #0284c7; margin-top: 18pt; border-bottom: 1pt solid #cbd5e1; padding-bottom: 4pt; }
    h3 { font-size: 12pt; color: #334155; margin-top: 12pt; }
    table { width: 100%; border-collapse: collapse; margin-top: 10pt; margin-bottom: 14pt; }
    th { background-color: #f1f5f9; color: #0f172a; font-weight: bold; border: 1pt solid #cbd5e1; padding: 6pt 8pt; text-align: left; font-size: 10pt; }
    td { border: 1pt solid #cbd5e1; padding: 6pt 8pt; font-size: 10pt; vertical-align: top; }
    .meta-box { background-color: #f8fafc; border: 1pt solid #cbd5e1; padding: 10pt; margin-bottom: 15pt; border-radius: 4pt; }
    .badge { display: inline-block; padding: 2pt 6pt; font-size: 8pt; font-weight: bold; background-color: #e2e8f0; border-radius: 3pt; }
    .footer-sign { margin-top: 40pt; border-top: 1pt solid #94a3b8; padding-top: 10pt; }
  </style>
</head>
<body>
  <div class="meta-box">
    <table style="border: none; margin: 0;">
      <tr style="border: none;">
        <td style="border: none; padding: 0;">
          <div style="font-size: 9pt; color: #64748b; font-weight: bold; text-transform: uppercase;">MANUAL DE PROCEDIMIENTOS OPERATIVOS &bull; ISO 9001:2015</div>
          <div style="font-size: 16pt; font-weight: bold; color: #0f172a; margin-top: 4pt;">${docControl.documentTitle}</div>
          <div style="font-size: 10pt; color: #475569; margin-top: 2pt;">Unidad Organizativa: ${docControl.organizationUnit}</div>
        </td>
        <td style="border: none; padding: 0; text-align: right; width: 200pt;">
          <div style="font-weight: bold; color: #0284c7;">CÓDIGO: ${docControl.documentCode}</div>
          <div style="font-weight: bold; color: #d97706;">VERSIÓN: ${docControl.version}</div>
          <div style="font-size: 9pt; color: #64748b;">Fecha: ${docControl.updatedAt.substring(0, 10)}</div>
        </td>
      </tr>
    </table>
  </div>

  <h2>1. Objetivo y Alcance</h2>
  <p>${docControl.processObjective || 'Establecer los lineamientos y responsabilidades operativas para la ejecución del proceso.'}</p>

  <h2>2. Marco Normativo Aplicable</h2>
  <ul>
    ${(docControl.legalNormativeBasis || ['Normativa legal vigente']).map((n) => `<li>${n}</li>`).join('')}
  </ul>

  <h2>3. Estructura y Secuencia de Actividades</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 60pt;">ID</th>
        <th>Actividad / Descripción</th>
        <th style="width: 120pt;">Responsable</th>
        <th style="width: 90pt;">Sistema TI</th>
      </tr>
    </thead>
    <tbody>
      ${nodes.map((node) => `
        <tr>
          <td><span class="badge">${node.data?.standardId || 'ID'}</span></td>
          <td>
            <strong>${node.data?.title || 'Actividad'}</strong><br/>
            <span style="font-size: 9pt; color: #475569;">${node.data?.description || ''}</span>
          </td>
          <td>${node.data?.roleName || 'Responsable de Área'}</td>
          <td>${node.data?.itSystem || 'Sistema General'}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <h2>4. Control de Riesgos Operativos (ISO 9001 Cláusula 6.1)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 60pt;">ID</th>
        <th>Riesgo Identificado</th>
        <th style="width: 80pt;">Severidad</th>
        <th>Control Mitigante Obligatorio</th>
      </tr>
    </thead>
    <tbody>
      ${nodes.flatMap((n) => (n.data?.operationalRisks || []).map((r) => `
        <tr>
          <td><span class="badge">${r.riskId || 'RSK'}</span></td>
          <td>${r.description}</td>
          <td>${r.impact || 'MEDIUM'} / ${r.probability || 'MEDIUM'}</td>
          <td>${r.mitigatingControl || 'Control de supervisión'}</td>
        </tr>
      `)).join('') || '<tr><td colspan="4" style="text-align: center; color: #94a3b8;">No se registraron riesgos críticos.</td></tr>'}
    </tbody>
  </table>

  <div class="footer-sign">
    <table style="border: none; text-align: center;">
      <tr style="border: none;">
        <td style="border: none; width: 50%;">
          _______________________________________<br/>
          <strong>${docControl.authorName}</strong><br/>
          <span style="font-size: 9pt; color: #64748b;">Modelador & Analista de Procesos</span>
        </td>
        <td style="border: none; width: 50%;">
          _______________________________________<br/>
          <strong>${docControl.organizationUnit}</strong><br/>
          <span style="font-size: 9pt; color: #64748b;">Aprobación y Validación Institucional</span>
        </td>
      </tr>
    </table>
  </div>
</body>
</html>
`;

  const blob = new Blob(['\ufeff' + content], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Manual_${docControl.documentCode}_${docControl.documentTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
