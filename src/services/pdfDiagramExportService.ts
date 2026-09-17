import jsPDF from 'jspdf';
import { ProcessProjectFile } from '../types/project';
import { PrintFrame, PageFormat, PageOrientation, DEFAULT_PAGE_DIMENSIONS } from '../types/printFrame';

/**
 * Calculates auto-layout print frames to encompass all elements in the process diagram
 */
export function calculateAutoFrames(
  project: ProcessProjectFile,
  format: PageFormat = 'A4',
  orientation: PageOrientation = 'landscape'
): PrintFrame[] {
  const nodes = project.nodes || [];
  if (nodes.length === 0) {
    const dim = DEFAULT_PAGE_DIMENSIONS[format][orientation];
    return [
      {
        id: 'frame_1',
        pageNumber: 1,
        format,
        orientation,
        x: 0,
        y: 0,
        width: dim.width,
        height: dim.height,
      },
    ];
  }

  // Calculate diagram bounding box
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((n) => {
    const isLane = n.type === 'PoolLane';
    const w = (n.style?.width as number) || (n.measured?.width || n.width || (isLane ? 2200 : 210)) as number;
    const h = (n.style?.height as number) || (n.measured?.height || n.height || (isLane ? 160 : 120)) as number;
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + w);
    maxY = Math.max(maxY, n.position.y + h);
  });

  const padding = 80;
  minX -= padding;
  minY -= padding;
  maxX += padding;
  maxY += padding;

  const totalWidth = Math.max(maxX - minX, 400);
  const totalHeight = Math.max(maxY - minY, 300);

  const dim = DEFAULT_PAGE_DIMENSIONS[format][orientation];
  const frameAspect = dim.width / dim.height;

  // Check how many frames are needed horizontally
  const baseFrameHeight = Math.max(totalHeight, dim.height);
  const baseFrameWidth = baseFrameHeight * frameAspect;

  const framesCountX = Math.max(1, Math.ceil(totalWidth / baseFrameWidth));
  const frames: PrintFrame[] = [];

  const actualFrameWidth = totalWidth / framesCountX > baseFrameWidth * 0.85
    ? Math.max(baseFrameWidth, totalWidth / framesCountX)
    : baseFrameWidth;
  const actualFrameHeight = actualFrameWidth / frameAspect;

  for (let i = 0; i < framesCountX; i++) {
    frames.push({
      id: `frame_${i + 1}`,
      pageNumber: i + 1,
      format,
      orientation,
      x: Math.round(minX + i * (actualFrameWidth - 40)), // slight overlap for continuity
      y: Math.round(minY + (totalHeight - actualFrameHeight) / 2),
      width: Math.round(actualFrameWidth),
      height: Math.round(actualFrameHeight),
    });
  }

  return frames;
}

/**
 * Generates an SVG string representation of a specific cropped frame area of the process
 */
export function generateFrameSvg(
  project: ProcessProjectFile,
  frame: PrintFrame,
  themeMode: 'light' | 'dark' = 'light'
): string {
  const nodes = project.nodes || [];
  const edges = project.edges || [];

  const isDark = themeMode === 'dark';
  const bgColor = isDark ? '#0F172A' : '#FFFFFF';
  const gridColor = isDark ? '#334155' : '#E2E8F0';
  const textColor = isDark ? '#F8FAFC' : '#0F172A';
  const textMutedColor = isDark ? '#94A3B8' : '#64748B';
  const laneBg = isDark ? '#1E293B' : '#F8FAFC';
  const nodeBg = isDark ? '#1E293B' : '#FFFFFF';

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${frame.x} ${frame.y} ${frame.width} ${frame.height}" width="${frame.width}" height="${frame.height}" style="background-color: ${bgColor}; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <pattern id="grid_${frame.id}" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="2" cy="2" r="1.5" fill="${gridColor}" fill-opacity="0.6" />
    </pattern>
    <marker id="arrow_frame_${frame.id}" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 9 5 L 0 9 z" fill="#0284C7" />
    </marker>
    <filter id="shadow_${frame.id}" x="-5%" y="-5%" width="115%" height="115%">
      <feDropShadow dx="0" dy="3" stdDeviation="3" flood-opacity="0.08" />
    </filter>
  </defs>

  <!-- Background Grid -->
  <rect x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" fill="${bgColor}" />
  <rect x="${frame.x}" y="${frame.y}" width="${frame.width}" height="${frame.height}" fill="url(#grid_${frame.id})" />
`;

  // 1. Draw Swimlanes
  nodes
    .filter((n) => n.type === 'PoolLane')
    .forEach((lane) => {
      const w = (lane.style?.width as number) || (lane.measured?.width || 2200);
      const h = (lane.style?.height as number) || (lane.measured?.height || 160);
      const laneData = lane.data as Record<string, any> | undefined;
      const borderColor = laneData?.customBorderColor || '#0284C7';
      const laneTitle = String(laneData?.title || laneData?.name || 'Carril').toUpperCase();

      svg += `  <g id="lane_${lane.id}">
    <rect x="${lane.position.x}" y="${lane.position.y}" width="${w}" height="${h}" rx="10" fill="${laneBg}" stroke="${borderColor}" stroke-width="1.8" stroke-dasharray="6,4" />
    <rect x="${lane.position.x}" y="${lane.position.y}" width="44" height="${h}" rx="10" fill="${borderColor}" fill-opacity="0.12" />
    <text x="${lane.position.x + 22}" y="${lane.position.y + h / 2}" transform="rotate(-90 ${lane.position.x + 22} ${lane.position.y + h / 2})" text-anchor="middle" fill="${borderColor}" font-weight="700" font-size="11" letter-spacing="1.5">${laneTitle}</text>
  </g>\n`;
    });

  // 2. Draw Connections (Edges)
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  edges.forEach((edge) => {
    const sNode = nodeMap.get(edge.source);
    const tNode = nodeMap.get(edge.target);
    if (!sNode || !tNode) return;

    const sWidth = (sNode.measured?.width || sNode.width || 210) as number;
    const sHeight = (sNode.measured?.height || sNode.height || 120) as number;
    const tWidth = (tNode.measured?.width || tNode.width || 210) as number;
    const tHeight = (tNode.measured?.height || tNode.height || 120) as number;

    const x1 = sNode.position.x + sWidth;
    const y1 = sNode.position.y + sHeight / 2;
    const x2 = tNode.position.x;
    const y2 = tNode.position.y + tHeight / 2;

    const dx = Math.max(Math.abs(x2 - x1) / 2, 40);
    const edgeData = edge.data as Record<string, any> | undefined;
    const strokeColor = edgeData?.strokeColor || '#0284C7';
    const strokeWidth = edgeData?.strokeWidth || 2.2;

    svg += `  <path d="M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" marker-end="url(#arrow_frame_${frame.id})" />\n`;

    if (edgeData?.conditionText) {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2 - 10;
      const condText = String(edgeData.conditionText).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const labelWidth = Math.max(condText.length * 6.5 + 16, 60);

      svg += `  <g>
    <rect x="${midX - labelWidth / 2}" y="${midY - 9}" width="${labelWidth}" height="18" rx="5" fill="${isDark ? '#0F172A' : '#FFFFFF'}" stroke="${strokeColor}" stroke-width="1.2" />
    <text x="${midX}" y="${midY + 4}" text-anchor="middle" fill="${textColor}" font-size="9.5" font-weight="700">${condText}</text>
  </g>\n`;
    }
  });

  // 3. Draw Functional Nodes
  nodes
    .filter((n) => n.type !== 'PoolLane')
    .forEach((node) => {
      const nodeData = node.data as Record<string, any> | undefined;
      const isSticky = node.type === 'StickyNote';
      const w = isSticky ? 220 : ((node.measured?.width || node.width || 210) as number);
      const h = isSticky ? 140 : ((node.measured?.height || node.height || 120) as number);
      const x = node.position.x;
      const y = node.position.y;

      const rawTitle = String(nodeData?.title || 'Actividad');
      const title = rawTitle.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const idCode = String(nodeData?.standardId || 'ID');
      const rawRole = String(nodeData?.roleName || nodeData?.laneName || '');
      const role = rawRole.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const rawSystem = String(nodeData?.itSystem || '');
      const itSystem = rawSystem.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      if (isSticky) {
        const rawDesc = String(nodeData?.description || '');
        const desc = rawDesc.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        svg += `  <g id="${node.id}" filter="url(#shadow_${frame.id})">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#FEF08A" stroke="#EAB308" stroke-width="1.5" />
    <text x="${x + 12}" y="${y + 22}" fill="#854D0E" font-weight="700" font-size="11.5">${title.substring(0, 26)}</text>
    <text x="${x + 12}" y="${y + 42}" fill="#713F12" font-size="9.5">${desc.substring(0, 36)}</text>
    ${desc.length > 36 ? `<text x="${x + 12}" y="${y + 56}" fill="#713F12" font-size="9.5">${desc.substring(36, 72)}</text>` : ''}
    ${desc.length > 72 ? `<text x="${x + 12}" y="${y + 70}" fill="#713F12" font-size="9.5">${desc.substring(72, 108)}...</text>` : ''}
  </g>\n`;
      } else {
        const isStart = node.type === 'StartEvent';
        const isEnd = node.type === 'EndEvent';
        const isGateway = node.type?.includes('Gateway');
        const isQuality = node.type === 'QualityCheckpointEvent';
        const isSubprocess = node.type === 'SubProcess';

        let strokeColor = '#0284C7';
        let headerBg = '#0284C7';
        let headerTextColor = '#FFFFFF';

        if (isStart) {
          strokeColor = '#10B981';
          headerBg = '#059669';
        } else if (isEnd) {
          strokeColor = '#EF4444';
          headerBg = '#DC2626';
        } else if (isGateway) {
          strokeColor = '#F59E0B';
          headerBg = '#D97706';
        } else if (isQuality) {
          strokeColor = '#8B5CF6';
          headerBg = '#7C3AED';
        } else if (isSubprocess) {
          strokeColor = '#6366F1';
          headerBg = '#4F46E5';
        }

        if (nodeData?.customBorderColor) strokeColor = nodeData.customBorderColor;
        if (nodeData?.customHeaderBgColor) headerBg = nodeData.customHeaderBgColor;

        svg += `  <g id="${node.id}" filter="url(#shadow_${frame.id})">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="${nodeBg}" stroke="${strokeColor}" stroke-width="1.8" />
    <path d="M ${x} ${y + 10} Q ${x} ${y} ${x + 10} ${y} L ${x + w - 10} ${y} Q ${x + w} ${y} ${x + w} ${y + 10} L ${x + w} ${y + 26} L ${x} ${y + 26} Z" fill="${headerBg}" />
    <text x="${x + 8}" y="${y + 17}" fill="${headerTextColor}" font-weight="700" font-size="9.5" font-family="monospace">${idCode}</text>
    <text x="${x + w - 8}" y="${y + 17}" text-anchor="end" fill="${headerTextColor}" font-size="8.5" font-weight="500">${role.substring(0, 18)}</text>
    
    <!-- Title -->
    <text x="${x + 10}" y="${y + 44}" fill="${textColor}" font-weight="700" font-size="10.5">${title.substring(0, 24)}</text>
    ${title.length > 24 ? `<text x="${x + 10}" y="${y + 58}" fill="${textColor}" font-weight="700" font-size="10.5">${title.substring(24, 48)}</text>` : ''}
    ${title.length > 48 ? `<text x="${x + 10}" y="${y + 72}" fill="${textColor}" font-weight="700" font-size="10.5">${title.substring(48, 72)}...</text>` : ''}
    
    <!-- Footer Tag: System -->
    ${itSystem ? `
    <rect x="${x + 8}" y="${y + h - 20}" width="${Math.min(itSystem.length * 6 + 12, w - 16)}" height="14" rx="4" fill="${isDark ? '#334155' : '#F1F5F9'}" />
    <text x="${x + 12}" y="${y + h - 10}" fill="${textMutedColor}" font-size="8" font-weight="600">${itSystem.substring(0, 20)}</text>
    ` : ''}
  </g>\n`;
      }
    });

  svg += `</svg>`;
  return svg;
}

/**
 * Converts an SVG string to a high-resolution PNG data URL
 */
async function svgToDataUrl(svgString: string, width: number, height: number, scale: number = 2.5): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('No se pudo inicializar contexto Canvas 2D'));
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      URL.revokeObjectURL(url);
      resolve(dataUrl);
    };

    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };

    img.src = url;
  });
}

export interface ExportPdfOptions {
  themeMode?: 'light' | 'dark';
  includeHeaderFooter?: boolean;
}

/**
 * Exports the complete multi-page PDF with all configured print frames
 */
export async function exportMultiPageDiagramPdf(
  project: ProcessProjectFile,
  frames?: PrintFrame[],
  options: ExportPdfOptions = {}
): Promise<string> {
  const effectiveFrames = frames && frames.length > 0
    ? frames
    : calculateAutoFrames(project, 'A4', 'landscape');

  const { themeMode = 'light', includeHeaderFooter = true } = options;

  const firstFrame = effectiveFrames[0];
  const firstDim = DEFAULT_PAGE_DIMENSIONS[firstFrame.format][firstFrame.orientation];

  // Initialize jsPDF with first page dimensions
  const pdf = new jsPDF({
    orientation: firstFrame.orientation,
    unit: 'mm',
    format: [firstDim.mmWidth, firstDim.mmHeight],
    compress: true,
  });

  const totalPages = effectiveFrames.length;

  for (let index = 0; index < effectiveFrames.length; index++) {
    const frame = effectiveFrames[index];
    const dim = DEFAULT_PAGE_DIMENSIONS[frame.format][frame.orientation];

    if (index > 0) {
      pdf.addPage([dim.mmWidth, dim.mmHeight], frame.orientation);
    }

    const pageWidthMm = dim.mmWidth;
    const pageHeightMm = dim.mmHeight;

    const marginMm = 8;
    const headerHeightMm = includeHeaderFooter ? 14 : 0;
    const footerHeightMm = includeHeaderFooter ? 8 : 0;

    const diagramX = marginMm;
    const diagramY = marginMm + headerHeightMm;
    const diagramWidth = pageWidthMm - marginMm * 2;
    const diagramHeight = pageHeightMm - marginMm * 2 - headerHeightMm - footerHeightMm;

    // 1. Draw Institutional Header
    if (includeHeaderFooter) {
      // Header background container
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(203, 213, 225);
      pdf.roundedRect(marginMm, marginMm, diagramWidth, headerHeightMm - 2, 2, 2, 'FD');

      // Title & Code
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(15, 23, 42);
      pdf.text(
        String(project.documentControl.documentTitle || 'Mapa Gráfico del Proceso').substring(0, 75),
        marginMm + 4,
        marginMm + 5.5
      );

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(100, 116, 139);
      const subheader = `CÓDIGO: ${project.documentControl.documentCode || 'S/C'} | VER: ${project.documentControl.version || '1.0'} | ÁREA: ${project.documentControl.organizationUnit || 'General'}`;
      pdf.text(subheader, marginMm + 4, marginMm + 9.5);

      // Page Badge on Top Right
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(2, 132, 199);
      const pageBadge = `HOJA ${index + 1} DE ${totalPages}`;
      pdf.text(pageBadge, pageWidthMm - marginMm - 4, marginMm + 6.5, { align: 'right' });
    }

    // 2. Render and draw the cropped Frame SVG
    const svgString = generateFrameSvg(project, frame, themeMode);
    const imgDataUrl = await svgToDataUrl(svgString, frame.width, frame.height, 2.5);

    pdf.addImage(
      imgDataUrl,
      'JPEG',
      diagramX,
      diagramY,
      diagramWidth,
      diagramHeight,
      undefined,
      'FAST'
    );

    // Frame border box
    pdf.setDrawColor(226, 232, 240);
    pdf.rect(diagramX, diagramY, diagramWidth, diagramHeight, 'S');

    // 3. Draw Institutional Footer
    if (includeHeaderFooter) {
      const footerY = pageHeightMm - marginMm - 2;

      pdf.setFont('helvetica', 'italic');
      pdf.setFontSize(7);
      pdf.setTextColor(148, 163, 184);
      pdf.text(
        'ProcesStudio • Sistema de Gestión de Procesos (ISO 9001:2015 & BPMN 2.0 / ISO 19510)',
        marginMm,
        footerY
      );

      const dateStr = new Date().toLocaleDateString('es-AR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      pdf.text(
        `Formato: ${frame.format} (${frame.orientation === 'landscape' ? 'Horizontal' : 'Vertical'}) • Generado: ${dateStr}`,
        pageWidthMm - marginMm,
        footerY,
        { align: 'right' }
      );
    }
  }

  // 4. File name generation
  const today = new Date().toISOString().split('T')[0];
  const docCode = (project.documentControl.documentCode || 'PRC')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '_');
  const titleSlug = (project.documentControl.documentTitle || 'diagrama')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const fileName = `${today}_proc-${docCode}_${titleSlug}_diagrama.pdf`;

  pdf.save(fileName);
  return fileName;
}
