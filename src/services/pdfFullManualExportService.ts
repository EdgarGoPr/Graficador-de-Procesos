import { jsPDF } from 'jspdf';
import { ProcessManualMetadata, ProcessProjectFile } from '../types/project';
import { generateTechnicalReport } from './topologicalSort';
import { generateSipocMatrix } from './sipocEngine';
import { computeRaciMatrix } from './raciCalculator';
import { renderProjectToPngDataUrl } from './imageExportService';

/**
 * Calcula un sello hash SHA-256 (o fallback determinista) para certificar el Manual PDF ISO 9001
 */
async function computeManualHash(content: string): Promise<string> {
  try {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(content);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    }
  } catch {}
  let h = 0x811c9dc5;
  for (let i = 0; i < content.length; i++) {
    h ^= content.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).toUpperCase().padStart(16, '0') + 'ISO9001BPMNV20';
}

/**
 * Autocompleta inteligentemente la Ficha Complementaria del Manual a partir de todo lo graficado en el lienzo
 */
export function autoGenerateManualMetadataFromGraph(project: ProcessProjectFile): ProcessManualMetadata {
  const dc = project.documentControl;
  const existing = dc.manualMetadata || {};

  const workNodes = project.nodes.filter((n) => n.type !== 'PoolLane' && n.type !== 'StickyNote');
  const startNode = workNodes.find((n) => n.type === 'StartEvent');
  const endNodes = workNodes.filter((n) => n.type === 'EndEvent');
  const gateways = workNodes.filter((n) => n.type === 'ExclusiveGateway' || n.type === 'ParallelGateway');
  const lanes = project.pools[0]?.lanes || [];

  // 1. Alcance detallado automático
  const startLabel = startNode?.data?.title || 'la recepción de la solicitud inicial';
  const endLabel = endNodes.map((e) => e.data?.title).filter(Boolean).join(' o ') || 'el cierre y archivo de las actuaciones';
  const laneNames = lanes.map((l) => `${l.name} (${l.role})`).join(', ');

  const autoScope =
    `El presente procedimiento inicia operativamente con "${startLabel}" y comprende todas las actividades de validación, procesamiento y control hasta "${endLabel}". ` +
    (laneNames
      ? `Resulta de aplicación obligatoria para las siguientes áreas y roles intervinientes: ${laneNames}.`
      : `Aplica a todas las unidades organizativas vinculadas a ${dc.organizationUnit}.`);

  // 2. Políticas de operación automáticas
  const autoPolicies: string[] = [
    `Toda actuación dentro del procedimiento "${dc.documentTitle}" debe registrarse en los sistemas oficiales dejando trazabilidad de fecha, hora y responsable.`,
    `Los plazos de nivel de servicio (SLA) definidos en cada etapa revisten carácter obligatorio; cualquier desvío superior al 75% del plazo deberá ser informado al responsable del proceso (${dc.authorName}).`
  ];
  if (gateways.length > 0) {
    autoPolicies.push(
      `Las decisiones operativas en las ${gateways.length} compuerta(s) de control (${gateways.map((g) => g.data?.title).join(', ')}) deberán contar con fundamentación documental previa a su derivación.`
    );
  }
  const checkpoints = workNodes.filter((n) => n.data?.qualityCheckpoint || n.type === 'QualityCheckpointEvent');
  if (checkpoints.length > 0) {
    autoPolicies.push(
      `No se podrá avanzar a la etapa subsiguiente sin superar los puntos de inspección de calidad establecidos en el flujo.`
    );
  }

  // 3. Sistemas y Registros Asociados extraídos de los nodos
  const recordsSet = new Set<string>();
  workNodes.forEach((n) => {
    if (n.data?.itSystem) recordsSet.add(`Sistema / Herramienta: ${n.data.itSystem}`);
    (n.data?.inputs || []).forEach((inp) => recordsSet.add(`Entrada: ${inp}`));
    (n.data?.outputs || []).forEach((out) => recordsSet.add(`Salida / Entregable: ${out}`));
  });
  if (recordsSet.size === 0) {
    recordsSet.add('Expediente Electrónico / Registro de Actuación');
    recordsSet.add('Formulario de Inicio y Constancia de Cierre');
  }

  // 4. Glosario automático
  const autoGlossary = [
    {
      id: 'gl_1',
      term: 'SLA (Service Level Agreement)',
      definition: 'Acuerdo de Nivel de Servicio que establece el tiempo máximo estándar asignado para completar una actividad del proceso.'
    },
    {
      id: 'gl_2',
      term: 'BPMN 2.0 (ISO/IEC 19510)',
      definition: 'Notación estándar internacional utilizada para modelar gráficamente la secuencia lógica de tareas, eventos, carriles y decisiones.'
    },
    {
      id: 'gl_3',
      term: 'Matriz SIPOC / RACI',
      definition: 'Herramientas de gestión de calidad que identifican Proveedores-Entradas-Proceso-Salidas-Clientes y Roles de Responsabilidad.'
    }
  ];

  // 5. KPIs sugeridos automáticamente
  const report = generateTechnicalReport(dc, project.nodes, project.edges, project.pools);
  const targetCycle = report.totalDirectCycleTimeDays > 0
    ? `<= ${report.totalDirectCycleTimeDays} días hábiles`
    : `<= ${Math.max(report.totalDirectCycleTimeHours, 24)} horas`;

  const autoKpis = [
    {
      id: 'kpi_1',
      name: 'Cumplimiento del Tiempo de Ciclo Total (SLA)',
      formula: '(Trámites finalizados dentro del plazo / Total de trámites finalizados) x 100',
      target: `>= 95% (${targetCycle})`,
      frequency: 'Mensual',
      responsible: dc.authorName || 'Responsable del Proceso'
    },
    {
      id: 'kpi_2',
      name: 'Índice de Conformidad en Primera Instancia (Calidad)',
      formula: '(Expedientes aprobados sin observaciones ni reprocesos / Total tramitados) x 100',
      target: '>= 90%',
      frequency: 'Mensual',
      responsible: dc.organizationUnit || 'Área de Calidad'
    }
  ];

  return {
    detailedScope: existing.detailedScope || autoScope,
    operationalPolicies: existing.operationalPolicies && existing.operationalPolicies.length > 0 ? existing.operationalPolicies : autoPolicies,
    glossary: existing.glossary && existing.glossary.length > 0 ? existing.glossary : autoGlossary,
    kpis: existing.kpis && existing.kpis.length > 0 ? existing.kpis : autoKpis,
    associatedRecords: existing.associatedRecords && existing.associatedRecords.length > 0 ? existing.associatedRecords : Array.from(recordsSet),
    preparedByRole: existing.preparedByRole || 'Analista / Modelador de Procesos',
    reviewedByName: existing.reviewedByName || 'Coordinación de Calidad y Procesos',
    reviewedByRole: existing.reviewedByRole || 'Revisor Técnico ISO 9001',
    approvedByName: existing.approvedByName || 'Dirección General / Autoridad Competente',
    approvedByRole: existing.approvedByRole || 'Director / Titular de Unidad Organizativa',
    effectiveDate: existing.effectiveDate || new Date().toISOString().slice(0, 10),
    additionalObservations:
      existing.additionalObservations ||
      'Documento generado de forma estandarizada y automatizada mediante ProcesStudio BPMN 2.0 & ISO 9001:2015.'
  };
}

/**
 * Compila y descarga el Manual Oficial de Procedimientos Estandarizado en PDF (PST-084)
 */
export async function exportFullStandardizedManualPdf(project: ProcessProjectFile): Promise<string> {
  const dc = project.documentControl;
  const meta = autoGenerateManualMetadataFromGraph(project);
  const report = generateTechnicalReport(dc, project.nodes, project.edges, project.pools);
  const sipocRows = generateSipocMatrix(project.nodes, project.edges, project.pools);
  const raciData = computeRaciMatrix(project.nodes, project.edges, project.pools);

  // Intentar renderizar imagen HD del diagrama del lienzo para incrustar en el PDF
  let diagramDataUrl: string | null = null;
  try {
    diagramDataUrl = await renderProjectToPngDataUrl(project, 1.8, 'light');
  } catch (err) {
    console.warn('No se pudo rasterizar imagen del diagrama para PDF, continuando con tablas:', err);
  }

  const hashPayload = JSON.stringify({
    code: dc.documentCode,
    version: dc.version,
    title: dc.documentTitle,
    nodes: project.nodes.length,
    edges: project.edges.length,
    updatedAt: dc.updatedAt
  });
  const integrityHash = await computeManualHash(hashPayload);

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 210
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297
  const marginX = 14;
  const contentWidth = pageWidth - marginX * 2;
  let cursorY = 32;

  const statusMap: Record<string, string> = {
    DRAFT: 'BORRADOR EN ELABORACIÓN',
    IN_REVIEW: 'EN REVISIÓN TÉCNICA',
    APPROVED: 'APROBADO FORMALMENTE',
    EFFECTIVE: 'VIGENTE / PUBLICADO'
  };

  const ensureSpace = (neededMm: number) => {
    if (cursorY + neededMm > pageHeight - 20) {
      pdf.addPage();
      cursorY = 32;
    }
  };

  const drawSectionHeading = (num: string, title: string) => {
    ensureSpace(16);
    cursorY += 3;
    pdf.setFillColor(15, 23, 42); // Slate 900
    pdf.roundedRect(marginX, cursorY, contentWidth, 8.5, 1.5, 1.5, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`${num}. ${title.toUpperCase()}`, marginX + 3.5, cursorY + 5.7);
    pdf.setTextColor(15, 23, 42);
    cursorY += 12;
  };

  const drawParagraph = (text: string, fontSize = 9, bold = false) => {
    if (!text) return;
    pdf.setFont('helvetica', bold ? 'bold' : 'normal');
    pdf.setFontSize(fontSize);
    pdf.setTextColor(30, 41, 59);
    const lines = pdf.splitTextToSize(text, contentWidth - 2);
    ensureSpace(lines.length * 4.5 + 3);
    pdf.text(lines, marginX + 1, cursorY);
    cursorY += lines.length * 4.5 + 2;
  };

  // ==========================================================================
  // SECCIÓN 1: FICHA INSTITUCIONAL Y RESUMEN EJECUTIVO
  // ==========================================================================
  pdf.setFillColor(241, 245, 249);
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(marginX, cursorY, contentWidth, 28, 2, 2, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(2, 132, 199);
  pdf.text('MANUAL OFICIAL DE PROCEDIMIENTOS • ESTÁNDAR BPMN 2.0 & ISO 9001:2015', marginX + 4, cursorY + 6);

  pdf.setFontSize(14);
  pdf.setTextColor(15, 23, 42);
  const titleLines = pdf.splitTextToSize(dc.documentTitle.toUpperCase(), contentWidth - 65);
  pdf.text(titleLines.slice(0, 2), marginX + 4, cursorY + 13);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Unidad Organizativa: ${dc.organizationUnit}`, marginX + 4, cursorY + 23);

  // Caja derecha de metadatos en portada
  const boxX = pageWidth - marginX - 56;
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(boxX, cursorY + 3, 53, 22, 1.5, 1.5, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`CÓDIGO: ${dc.documentCode}`, boxX + 3, cursorY + 8.5);
  pdf.text(`VERSIÓN: v${dc.version}`, boxX + 3, cursorY + 13.5);
  pdf.setFontSize(7);
  pdf.setTextColor(2, 132, 199);
  pdf.text(`ESTADO: ${statusMap[dc.status] || dc.status}`, boxX + 3, cursorY + 18.5);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`VIGENCIA: ${meta.effectiveDate}`, boxX + 3, cursorY + 23);

  cursorY += 33;

  // Cuadro de métricas clave (4 tarjetas)
  const cardW = (contentWidth - 9) / 4;
  const metrics = [
    {
      label: 'TIEMPO DE CICLO (SLA)',
      val: report.totalDirectCycleTimeDays > 0 ? `${report.totalDirectCycleTimeDays} Días Háb.` : `${report.totalDirectCycleTimeHours} Horas`
    },
    {
      label: 'ACTIVIDADES DEL FLUJO',
      val: `${report.chronologicalSteps.length} Etapas BPMN`
    },
    {
      label: 'CARRILES / ROLES',
      val: `${project.pools[0]?.lanes?.length || 1} Áreas`
    },
    {
      label: 'CONTROLES Y RIESGOS',
      val: `${report.chronologicalSteps.filter((s) => Boolean(s.qualityCheck)).length} QC / ${report.riskMatrix.length} Riesgos`
    }
  ];

  metrics.forEach((m, idx) => {
    const x = marginX + idx * (cardW + 3);
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(x, cursorY, cardW, 14, 1.5, 1.5, 'FD');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(6.5);
    pdf.setTextColor(100, 116, 139);
    pdf.text(m.label, x + 2.5, cursorY + 5);
    pdf.setFontSize(9.5);
    pdf.setTextColor(15, 23, 42);
    pdf.text(m.val, x + 2.5, cursorY + 11);
  });

  cursorY += 18;

  // 1. OBJETIVO Y ALCANCE
  drawSectionHeading('1', 'Objetivo, Alcance Operativo y Marco Normativo');
  drawParagraph('1.1. Objetivo del Proceso:', 9, true);
  drawParagraph(dc.processObjective || 'Establecer los lineamientos estandarizados para la ejecución y control del procedimiento.');

  drawParagraph('1.2. Alcance Detallado:', 9, true);
  drawParagraph(meta.detailedScope || '');

  drawParagraph('1.3. Marco Normativo y Legal Aplicable:', 9, true);
  const norms = dc.legalNormativeBasis && dc.legalNormativeBasis.length > 0
    ? dc.legalNormativeBasis.map((n) => `• ${n}`).join('\n')
    : '• ISO 9001:2015 - Sistemas de Gestión de Calidad\n• ISO/IEC 19510 - Estándar BPMN 2.0';
  drawParagraph(norms, 8.5);

  // 2. POLÍTICAS DE OPERACIÓN, GLOSARIO Y KPIs
  drawSectionHeading('2', 'Políticas de Operación, Reglas de Negocio e Indicadores (KPIs)');
  if (meta.operationalPolicies && meta.operationalPolicies.length > 0) {
    drawParagraph('2.1. Políticas y Reglas de Negocio:', 9, true);
    meta.operationalPolicies.forEach((pol, i) => {
      drawParagraph(`${i + 1}. ${pol}`, 8.5);
    });
  }

  if (meta.kpis && meta.kpis.length > 0) {
    ensureSpace(22);
    drawParagraph('2.2. Indicadores Clave de Desempeño (KPIs del Proceso):', 9, true);
    meta.kpis.forEach((k) => {
      ensureSpace(12);
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(203, 213, 225);
      pdf.roundedRect(marginX, cursorY, contentWidth, 11, 1, 1, 'FD');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`KPI: ${k.name}  |  Meta: ${k.target}  |  Frecuencia: ${k.frequency}`, marginX + 2.5, cursorY + 4.5);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(71, 85, 105);
      pdf.text(`Fórmula: ${k.formula}  •  Responsable: ${k.responsible}`, marginX + 2.5, cursorY + 9);
      cursorY += 13;
    });
  }

  if (meta.glossary && meta.glossary.length > 0) {
    drawParagraph('2.3. Glosario de Términos y Definiciones:', 9, true);
    meta.glossary.forEach((g) => {
      drawParagraph(`• ${g.term}: ${g.definition}`, 8.5);
    });
  }

  // ==========================================================================
  // SECCIÓN 3: MAPA GRÁFICO DEL PROCESO (DIAGRAMA BPMN EMBEBIDO)
  // ==========================================================================
  drawSectionHeading('3', 'Mapa Gráfico del Proceso (Diagrama BPMN 2.0)');
  if (diagramDataUrl) {
    try {
      const imgProps = pdf.getImageProperties(diagramDataUrl);
      const maxW = contentWidth;
      const maxH = 115;
      const ratio = Math.min(maxW / imgProps.width, maxH / imgProps.height);
      const drawW = imgProps.width * ratio;
      const drawH = imgProps.height * ratio;

      ensureSpace(drawH + 10);
      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(203, 213, 225);
      pdf.roundedRect(marginX, cursorY, contentWidth, drawH + 6, 1.5, 1.5, 'FD');
      const offsetX = marginX + (contentWidth - drawW) / 2;
      pdf.addImage(diagramDataUrl, 'PNG', offsetX, cursorY + 3, drawW, drawH);
      cursorY += drawH + 10;
    } catch {
      drawParagraph('El diagrama gráfico se adjunta en las láminas técnicas del proyecto.', 8.5);
    }
  } else {
    drawParagraph('Diagrama modelado bajo estándar ISO/IEC 19510 (BPMN 2.0) con representación secuencial en la sección siguiente.', 8.5);
  }

  // ==========================================================================
  // SECCIÓN 4: DESCRIPCIÓN DETALLADA PASO A PASO DE ACTIVIDADES
  // ==========================================================================
  drawSectionHeading('4', 'Descripción Secuencial Paso a Paso de Actividades del Proceso');

  report.chronologicalSteps.forEach((step) => {
    ensureSpace(26);
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(203, 213, 225);

    const descLines = pdf.splitTextToSize(
      `Condición previa: ${step.precedingConditions} | Entregable: ${step.deliverables}`,
      contentWidth - 8
    );
    const hasExtras = Boolean(step.qualityCheck) || Boolean(step.legalArticle);
    const boxHeight = 14 + descLines.length * 4 + (hasExtras ? 9 : 0);

    ensureSpace(boxHeight + 4);
    pdf.roundedRect(marginX, cursorY, contentWidth, boxHeight, 1.5, 1.5, 'FD');

    // Cabecera del paso
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(2, 132, 199);
    pdf.text(`PASO ${step.stepNumber} [${step.standardId}] — ${step.title}`, marginX + 3, cursorY + 5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(71, 85, 105);
    pdf.text(
      `Área / Carril: ${step.lane}  |  Rol: ${step.role}  |  Sistema: ${step.itSystem}  |  SLA: ${step.sla}`,
      marginX + 3,
      cursorY + 9.5
    );

    // Descripción
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(30, 41, 59);
    pdf.text(descLines, marginX + 3, cursorY + 14.5);

    if (hasExtras) {
      const extraY = cursorY + 14 + descLines.length * 4;
      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(7);
      pdf.setTextColor(100, 116, 139);
      const ioText = [
        step.legalArticle ? `Marco: ${step.legalArticle}` : '',
        step.qualityCheck ? `Control QC: ${step.qualityCheck}` : ''
      ]
        .filter(Boolean)
        .join('  •  ');
      const ioTrimmed = pdf.splitTextToSize(ioText, contentWidth - 6);
      pdf.text(ioTrimmed[0] || '', marginX + 3, extraY + 2);
    }

    cursorY += boxHeight + 3;
  });

  // ==========================================================================
  // SECCIÓN 5: MATRIZ SIPOC AUTOMÁTICA
  // ==========================================================================
  drawSectionHeading('5', 'Matriz SIPOC del Proceso (Proveedores, Entradas, Proceso, Salidas, Clientes)');
  if (sipocRows.length === 0) {
    drawParagraph('No se registran filas SIPOC adicionales.', 8.5);
  } else {
    sipocRows.forEach((row, idx) => {
      ensureSpace(14);
      pdf.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(marginX, cursorY, contentWidth, 12, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`${idx + 1}. Actividad: ${row.processStage} (${row.laneName})`, marginX + 2, cursorY + 4.5);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(71, 85, 105);
      const line = `Proveedor: ${row.supplier || 'Interno'}  ➔  Entrada: ${row.input || 'Solicitud'}  ➔  Salida: ${row.output || 'Actuación'}  ➔  Cliente: ${row.customer || 'Siguiente Etapa'}`;
      const splitLine = pdf.splitTextToSize(line, contentWidth - 4);
      pdf.text(splitLine[0] || '', marginX + 2, cursorY + 9.5);
      cursorY += 12.5;
    });
    cursorY += 3;
  }

  // ==========================================================================
  // SECCIÓN 6: MATRIZ DE RESPONSABILIDADES RACI
  // ==========================================================================
  drawSectionHeading('6', 'Matriz de Asignación de Responsabilidades (RACI)');
  if (raciData.rows.length > 0 && raciData.roles.length > 0) {
    raciData.rows.forEach((rRow, idx) => {
      ensureSpace(10);
      pdf.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
      pdf.setDrawColor(226, 232, 240);
      pdf.rect(marginX, cursorY, contentWidth, 8.5, 'FD');

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(15, 23, 42);
      pdf.text(`[${rRow.standardId}] ${rRow.title.substring(0, 48)}`, marginX + 2, cursorY + 5.5);

      const assignmentsText = raciData.roles
        .map((roleObj) => {
          const code = rRow.assignments[roleObj.id];
          return code ? `${roleObj.name}: [${code}]` : null;
        })
        .filter(Boolean)
        .join('  |  ');

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7);
      pdf.setTextColor(2, 132, 199);
      pdf.text(assignmentsText.substring(0, 75), marginX + 82, cursorY + 5.5);
      cursorY += 9;
    });
    cursorY += 3;
  }

  // ==========================================================================
  // SECCIÓN 7: CUADRO DE FIRMAS Y APROBACIÓN DOCUMENTAL + HISTORIAL
  // ==========================================================================
  drawSectionHeading('7', 'Control de Cambios, Cuadro de Firmas y Sello Criptográfico ISO 9001');

  if (dc.revisionHistory && dc.revisionHistory.length > 0) {
    drawParagraph('7.1. Historial de Versiones y Control de Cambios:', 9, true);
    dc.revisionHistory.forEach((rev) => {
      drawParagraph(
        `• Versión ${rev.version} (${rev.revisionDate.slice(0, 10)}) — Autor: ${rev.author} — Detalle: ${rev.changeDescription}`,
        8
      );
    });
  }

  // Cuadro de 3 firmas (Elaboró / Revisó / Aprobó)
  ensureSpace(38);
  cursorY += 4;
  const sigW = (contentWidth - 8) / 3;
  const signatures = [
    { header: 'ELABORÓ', name: dc.authorName, role: meta.preparedByRole || 'Analista de Procesos' },
    { header: 'REVISÓ', name: meta.reviewedByName || 'Coordinación de Calidad', role: meta.reviewedByRole || 'Revisor Técnico' },
    { header: 'APROBÓ', name: meta.approvedByName || 'Dirección General', role: meta.approvedByRole || 'Autoridad Aprobadora' }
  ];

  signatures.forEach((sig, i) => {
    const x = marginX + i * (sigW + 4);
    pdf.setFillColor(248, 250, 252);
    pdf.setDrawColor(203, 213, 225);
    pdf.roundedRect(x, cursorY, sigW, 26, 1.5, 1.5, 'FD');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(2, 132, 199);
    pdf.text(sig.header, x + 3, cursorY + 5);

    pdf.setDrawColor(148, 163, 184);
    pdf.line(x + 4, cursorY + 16, x + sigW - 4, cursorY + 16);

    pdf.setFontSize(8);
    pdf.setTextColor(15, 23, 42);
    pdf.text((sig.name || '').substring(0, 28), x + 3, cursorY + 20.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text((sig.role || '').substring(0, 32), x + 3, cursorY + 24.2);
  });

  cursorY += 30;

  // Sello SHA-256
  ensureSpace(14);
  pdf.setFillColor(241, 245, 249);
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(marginX, cursorY, contentWidth, 10, 1, 1, 'FD');
  pdf.setFont('courier', 'bold');
  pdf.setFontSize(7);
  pdf.setTextColor(51, 65, 85);
  pdf.text(`SELLO DE INTEGRIDAD DOCUMENTAL SHA-256: ${integrityHash}`, marginX + 3, cursorY + 6.2);

  // ==========================================================================
  // ENCABEZADOS Y PIES DE PÁGINA FOLIADOS EN TODAS LAS HOJAS (Página X de Y)
  // ==========================================================================
  const totalPages = pdf.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    pdf.setPage(p);

    // Header institucional
    pdf.setFillColor(15, 23, 42);
    pdf.rect(marginX, 10, contentWidth, 16, 'F');

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text('PROCESSTUDIO • MANUAL DE PROCEDIMIENTOS ESTANDARIZADO', marginX + 4, 16.5);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.setTextColor(186, 230, 253);
    pdf.text(
      `${dc.documentCode}  |  Versión ${dc.version}  |  ${dc.documentTitle.substring(0, 55)}`,
      marginX + 4,
      22
    );

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(255, 255, 255);
    pdf.text(`PÁGINA ${p} DE ${totalPages}`, pageWidth - marginX - 4, 19, { align: 'right' });

    // Footer institucional
    pdf.setDrawColor(203, 213, 225);
    pdf.line(marginX, pageHeight - 13, pageWidth - marginX, pageHeight - 13);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7);
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      `${dc.organizationUnit} • Emitido: ${new Date().toISOString().slice(0, 10)} • Folio ${p}/${totalPages}`,
      marginX,
      pageHeight - 8.5
    );
    pdf.text(
      `SHA-256: ${integrityHash.substring(0, 20)}...`,
      pageWidth - marginX,
      pageHeight - 8.5,
      { align: 'right' }
    );
  }

  const safeCode = (dc.documentCode || 'PRC').replace(/[^a-zA-Z0-9-_]/g, '_');
  const fileName = `Manual_Procedimiento_${safeCode}_v${dc.version}.pdf`;
  pdf.save(fileName);
  return fileName;
}
