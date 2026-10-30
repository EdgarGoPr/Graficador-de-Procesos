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
  // Exclude internal working notes (Sticky Notes)
  const rawNodes = project.nodes || [];
  const nodes = rawNodes.filter((n) => n.type !== 'StickyNote');
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

function escapeXml(str: any): string {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function wrapText(text: string, maxCharsPerLine: number, maxLines: number = 3): string[] {
  if (!text) return [];
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (currentLine && lines.length < maxLines) {
    lines.push(currentLine);
  } else if (currentLine) {
    lines[lines.length - 1] = lines[lines.length - 1] + '...';
  }
  return lines;
}

/**
 * Generates an SVG string representation of a specific cropped frame area of the process
 */
export function generateFrameSvg(
  project: ProcessProjectFile,
  frame: PrintFrame,
  themeMode: 'light' | 'dark' = 'light'
): string {
  // Exclude internal working notes (Sticky Notes)
  const rawNodes = project.nodes || [];
  const nodes = rawNodes.filter((n) => n.type !== 'StickyNote');

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const edges = (project.edges || []).filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target));

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
  edges.forEach((edge) => {
    const sNode = nodeMap.get(edge.source);
    const tNode = nodeMap.get(edge.target);
    if (!sNode || !tNode) return;

    const sWidth = (sNode.measured?.width || sNode.width || 210) as number;
    const sHeight = (sNode.measured?.height || sNode.height || 120) as number;
    const tHeight = (tNode.measured?.height || tNode.height || 120) as number;

    const x1 = sNode.position.x + sWidth;
    const y1 = sNode.position.y + sHeight / 2;
    const x2 = tNode.position.x;
    const y2 = tNode.position.y + tHeight / 2;

    const dx = Math.max(Math.abs(x2 - x1) / 2, 40);
    const edgeData = edge.data as Record<string, any> | undefined;
    const strokeColor = edgeData?.strokeColor || '#0284C7';
    const strokeWidth = edgeData?.strokeWidth || 2.2;

    const isAssoc = !!edgeData?.isAssociation;
    const markerEndAttr = isAssoc ? '' : `marker-end="url(#arrow_frame_${frame.id})"`;
    const dashAttr = isAssoc ? 'stroke-dasharray="4,4"' : '';
    svg += `  <path d="M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}" fill="none" stroke="${strokeColor}" stroke-width="${isAssoc ? 1.8 : strokeWidth}" ${dashAttr} ${markerEndAttr} />\n`;

    if (edgeData?.conditionText) {
      let midX = (x1 + x2) / 2;
      let midY = (y1 + y2) / 2 - 10;

      if (typeof edgeData.labelPosition === 'number') {
        const t = Math.max(0.05, Math.min(0.95, edgeData.labelPosition));
        const u = 1 - t;
        const tt = t * t;
        const uu = u * u;
        const uuu = uu * u;
        const ttt = tt * t;
        const c1x = x1 + dx;
        const c1y = y1;
        const c2x = x2 - dx;
        const c2y = y2;
        midX = Math.round(uuu * x1 + 3 * uu * t * c1x + 3 * u * tt * c2x + ttt * x2);
        midY = Math.round(uuu * y1 + 3 * uu * t * c1y + 3 * u * tt * c2y + ttt * y2) - 10;
      }

      const condText = String(edgeData.conditionText).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const labelWidth = Math.max(condText.length * 6.5 + 16, 60);

      svg += `  <g>
    <rect x="${midX - labelWidth / 2}" y="${midY - 9}" width="${labelWidth}" height="18" rx="5" fill="${isDark ? '#0F172A' : '#FFFFFF'}" stroke="${strokeColor}" stroke-width="1.2" />
    <text x="${midX}" y="${midY + 4}" text-anchor="middle" fill="${textColor}" font-size="9.5" font-weight="700">${condText}</text>
  </g>\n`;
    }
  });

  // 3. Draw Authentic BPMN Functional Nodes
  nodes
    .filter((n) => n.type !== 'PoolLane')
    .forEach((node) => {
      const nodeData = (node.data || {}) as Record<string, any>;
      const w = (node.style?.width as number) || (node.measured?.width || node.width || 210) as number;
      const h = (node.style?.height as number) || (node.measured?.height || node.height || 120) as number;
      const x = node.position.x;
      const y = node.position.y;

      const rawTitle = String(nodeData.title || '');
      const idCode = String(nodeData.standardId || '');
      const role = String(nodeData.responsible || nodeData.roleName || nodeData.laneName || '');
      const itSystem = String(nodeData.itSystem || '');
      const description = String(nodeData.description || '');

      const isStart = node.type === 'StartEvent';
      const isEnd = node.type === 'EndEvent';
      const isGateway = node.type?.includes('Gateway');
      const isSubprocess = node.type === 'SubProcess';

      if (isStart) {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const r = Math.min(w, h) / 2 - 2;
        const strokeColor = nodeData.customBorderColor || '#10B981';
        const titleLines = wrapText(rawTitle, 16, 2);

        svg += `  <g id="node_${node.id}" filter="url(#shadow_${frame.id})">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${nodeBg}" stroke="${strokeColor}" stroke-width="2.5" />
    <circle cx="${cx}" cy="${cy - 12}" r="11" fill="#10B981" fill-opacity="0.18" />
    <polygon points="${cx - 3},${cy - 16} ${cx + 5},${cy - 12} ${cx - 3},${cy - 8}" fill="#10B981" />
    <text x="${cx}" y="${cy + 6}" text-anchor="middle" fill="#10B981" font-size="9" font-weight="bold" font-family="monospace">${escapeXml(idCode || 'INI')}</text>
    ${titleLines[0] ? `<text x="${cx}" y="${cy + 17}" text-anchor="middle" fill="${textColor}" font-size="8.5" font-weight="500">${escapeXml(titleLines[0])}</text>` : ''}
    ${titleLines[1] ? `<text x="${cx}" y="${cy + 27}" text-anchor="middle" fill="${textColor}" font-size="8.5" font-weight="500">${escapeXml(titleLines[1])}</text>` : ''}
  </g>\n`;
      } else if (isEnd) {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const r = Math.min(w, h) / 2 - 2;
        const strokeColor = nodeData.customBorderColor || '#EF4444';
        const titleLines = wrapText(rawTitle, 16, 2);

        svg += `  <g id="node_${node.id}" filter="url(#shadow_${frame.id})">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${nodeBg}" stroke="${strokeColor}" stroke-width="3.5" />
    <circle cx="${cx}" cy="${cy - 12}" r="11" fill="#EF4444" fill-opacity="0.18" />
    <rect x="${cx - 4.5}" y="${cy - 16.5}" width="9" height="9" rx="1.5" fill="#EF4444" />
    <text x="${cx}" y="${cy + 6}" text-anchor="middle" fill="#EF4444" font-size="9" font-weight="bold" font-family="monospace">${escapeXml(idCode || 'FIN')}</text>
    ${titleLines[0] ? `<text x="${cx}" y="${cy + 17}" text-anchor="middle" fill="${textColor}" font-size="8.5" font-weight="500">${escapeXml(titleLines[0])}</text>` : ''}
    ${titleLines[1] ? `<text x="${cx}" y="${cy + 27}" text-anchor="middle" fill="${textColor}" font-size="8.5" font-weight="500">${escapeXml(titleLines[1])}</text>` : ''}
  </g>\n`;
      } else if (isGateway) {
        const cx = x + w / 2;
        const diamondSize = 64;
        const diamondTop = y + 4;
        const diamondCenter = diamondTop + diamondSize / 2;
        const strokeColor = nodeData.customBorderColor || '#F59E0B';
        const isParallel = node.type?.includes('Parallel');

        const pillW = Math.max(110, Math.min(w, 140));
        const pillH = Math.max(38, h - diamondSize - 10);
        const pillX = cx - pillW / 2;
        const pillY = diamondTop + diamondSize + 6;
        const titleLines = wrapText(rawTitle, 18, 2);

        svg += `  <g id="node_${node.id}" filter="url(#shadow_${frame.id})">
    <!-- Diamond -->
    <polygon points="${cx},${diamondTop} ${cx + 32},${diamondCenter} ${cx},${diamondTop + diamondSize} ${cx - 32},${diamondCenter}" fill="${nodeBg}" stroke="${strokeColor}" stroke-width="2.5" />
    ${
      isParallel
        ? `<!-- Plus icon -->
    <line x1="${cx}" y1="${diamondCenter - 10}" x2="${cx}" y2="${diamondCenter + 10}" stroke="#F59E0B" stroke-width="3" stroke-linecap="round" />
    <line x1="${cx - 10}" y1="${diamondCenter}" x2="${cx + 10}" y2="${diamondCenter}" stroke="#F59E0B" stroke-width="3" stroke-linecap="round" />`
        : `<!-- X icon -->
    <line x1="${cx - 8}" y1="${diamondCenter - 8}" x2="${cx + 8}" y2="${diamondCenter + 8}" stroke="#F59E0B" stroke-width="3" stroke-linecap="round" />
    <line x1="${cx + 8}" y1="${diamondCenter - 8}" x2="${cx - 8}" y2="${diamondCenter + 8}" stroke="#F59E0B" stroke-width="3" stroke-linecap="round" />`
    }
    <!-- Label Pill under Diamond -->
    <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="6" fill="${nodeBg}" stroke="${gridColor}" stroke-width="1" />
    <text x="${cx}" y="${pillY + 13}" text-anchor="middle" fill="#F59E0B" font-size="9" font-weight="bold" font-family="monospace">${escapeXml(idCode || (isParallel ? 'PAR' : 'GTW'))}</text>
    ${titleLines[0] ? `<text x="${cx}" y="${pillY + 24}" text-anchor="middle" fill="${textColor}" font-size="9.5" font-weight="500">${escapeXml(titleLines[0])}</text>` : ''}
    ${titleLines[1] ? `<text x="${cx}" y="${pillY + 34}" text-anchor="middle" fill="${textColor}" font-size="9.5" font-weight="500">${escapeXml(titleLines[1])}</text>` : ''}
  </g>\n`;
      } else {
        // Task or SubProcess Card
        let strokeColor = '#0284C7';
        let headerBg = '#0284C7';
        let headerTextColor = isDark ? '#38BDF8' : '#0284C7';
        let badgeLabel = 'User Task';

        if (isSubprocess) {
          strokeColor = '#6366F1';
          headerBg = '#6366F1';
          headerTextColor = isDark ? '#A5B4FC' : '#4F46E5';
          badgeLabel = 'Subproceso';
        } else if (nodeData.nodeType === 'SERVICE_TASK') {
          strokeColor = '#06B6D4';
          headerBg = '#06B6D4';
          headerTextColor = isDark ? '#67E8F9' : '#0891B2';
          badgeLabel = 'Service Task';
        } else if (nodeData.nodeType === 'MANUAL_TASK') {
          strokeColor = '#F59E0B';
          headerBg = '#F59E0B';
          headerTextColor = isDark ? '#FCD34D' : '#D97706';
          badgeLabel = 'Manual Task';
        }

        if (nodeData.customBorderColor) strokeColor = nodeData.customBorderColor;
        if (nodeData.customHeaderBgColor) headerBg = nodeData.customHeaderBgColor;

        const badgeW = badgeLabel.length * 6 + 14;
        const titleLines = wrapText(rawTitle || 'Sin título', 26, 2);
        const descLines = wrapText(description, 32, 2);

        svg += `  <g id="node_${node.id}" filter="url(#shadow_${frame.id})">
    <!-- Card Frame -->
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${nodeBg}" stroke="${strokeColor}" stroke-width="1.8" />
    
    <!-- Header -->
    <path d="M ${x} ${y + 12} A 12 12 0 0 1 ${x + 12} ${y} L ${x + w - 12} ${y} A 12 12 0 0 1 ${x + w} ${y + 12} L ${x + w} ${y + 26} L ${x} ${y + 26} Z" fill="${headerBg}" fill-opacity="${isDark ? 0.18 : 0.12}" />
    <line x1="${x}" y1="${y + 26}" x2="${x + w}" y2="${y + 26}" stroke="${gridColor}" stroke-width="0.8" />

    <!-- Standard ID -->
    <text x="${x + 10}" y="${y + 17}" fill="${headerTextColor}" font-size="9.5" font-weight="bold" font-family="monospace">${escapeXml(idCode)}</text>

    <!-- Badge -->
    <rect x="${x + w - badgeW - 8}" y="${y + 6}" width="${badgeW}" height="15" rx="7.5" fill="${headerBg}" fill-opacity="${isDark ? 0.25 : 0.15}" stroke="${strokeColor}" stroke-width="0.8" stroke-opacity="0.5" />
    <text x="${x + w - badgeW / 2 - 8}" y="${y + 17}" text-anchor="middle" fill="${headerTextColor}" font-size="8.5" font-weight="600">${escapeXml(badgeLabel)}</text>

    <!-- Title -->
    ${titleLines[0] ? `<text x="${x + 10}" y="${y + 42}" fill="${textColor}" font-size="11" font-weight="bold">${escapeXml(titleLines[0])}</text>` : ''}
    ${titleLines[1] ? `<text x="${x + 10}" y="${y + 55}" fill="${textColor}" font-size="11" font-weight="bold">${escapeXml(titleLines[1])}</text>` : ''}

    <!-- Description -->
    ${descLines[0] ? `<text x="${x + 10}" y="${y + 70}" fill="${textMutedColor}" font-size="9">${escapeXml(descLines[0])}</text>` : ''}
    ${descLines[1] ? `<text x="${x + 10}" y="${y + 82}" fill="${textMutedColor}" font-size="9">${escapeXml(descLines[1])}</text>` : ''}

    <!-- Footer Divider & Meta -->
    <line x1="${x + 10}" y1="${y + h - 22}" x2="${x + w - 10}" y2="${y + h - 22}" stroke="${gridColor}" stroke-width="0.8" />
    ${itSystem ? `<text x="${x + 10}" y="${y + h - 9}" fill="#0284C7" font-size="8.5">⚙️ ${escapeXml(itSystem)}</text>` : ''}
    ${role ? `<text x="${x + w - 10}" y="${y + h - 9}" text-anchor="end" fill="#6366F1" font-size="8.5">👤 ${escapeXml(role)}</text>` : ''}

    ${
      isSubprocess
        ? `<!-- SubProcess [+] Marker -->
    <rect x="${x + w / 2 - 8}" y="${y + h - 7}" width="16" height="14" rx="2" fill="${nodeBg}" stroke="${strokeColor}" stroke-width="1.5" />
    <line x1="${x + w / 2 - 4}" y1="${y + h}" x2="${x + w / 2 + 4}" y2="${y + h}" stroke="${strokeColor}" stroke-width="1.5" />
    <line x1="${x + w / 2}" y1="${y + h - 4}" x2="${x + w / 2}" y2="${y + h + 4}" stroke="${strokeColor}" stroke-width="1.5" />`
        : ''
    }
  </g>\n`;
      }
    });

  svg += `</svg>`;
  return svg;
}

/**
 * Converts an SVG string to a high-resolution PNG data URL
 */
async function svgToDataUrl(svgString: string, width: number, height: number, scale: number = 3): Promise<string> {
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
    const imgDataUrl = await svgToDataUrl(svgString, frame.width, frame.height, 3);

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
