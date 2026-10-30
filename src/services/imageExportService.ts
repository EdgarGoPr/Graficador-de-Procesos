import { ProcessProjectFile } from '../types/project';
import { Position } from '@xyflow/react';
import { getSmartEdgePath, getPointOnSvgPath } from '../utils/smartRouting';

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
 * Generates an authentic, high-fidelity SVG string representation of the BPMN process diagram.
 * Excludes internal Sticky Notes (Point 13) and renders authentic BPMN shapes:
 * - Gateways as diamonds with center icon and label pill
 * - Events as circles with icons
 * - Tasks and SubProcesses as rich cards with metadata, systems, and roles
 */
export function generateProcessSvg(project: ProcessProjectFile): string {
  // Exclude Sticky Notes from export (internal working notes)
  const rawNodes = project.nodes || [];
  const nodes = rawNodes.filter((n) => n.type !== 'StickyNote');

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const edges = (project.edges || []).filter((e) => nodeMap.has(e.source) && nodeMap.has(e.target));

  if (nodes.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><text x="50%" y="50%" text-anchor="middle" fill="#999">No hay elementos en el proceso</text></svg>`;
  }

  // Calculate bounding box based on functional nodes and swimlanes
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

  const padding = 60;
  const viewBoxWidth = maxX - minX + padding * 2;
  const viewBoxHeight = maxY - minY + padding * 2;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX - padding} ${minY - padding} ${viewBoxWidth} ${viewBoxHeight}" width="${viewBoxWidth}" height="${viewBoxHeight}" style="background-color: #0F172A; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 9 5 L 0 9 z" fill="#38BDF8" />
    </marker>
  </defs>
`;

  // 1. Draw Swimlanes (Background layer)
  nodes
    .filter((n) => n.type === 'PoolLane')
    .forEach((lane) => {
      const w = (lane.style?.width as number) || (lane.measured?.width || 2200);
      const h = (lane.style?.height as number) || (lane.measured?.height || 160);
      const laneData = lane.data as Record<string, any> | undefined;
      const borderColor = laneData?.customBorderColor || '#38BDF8';
      const laneTitle = String(laneData?.title || laneData?.name || 'Carril').toUpperCase();
      svg += `  <g id="${lane.id}">
    <rect x="${lane.position.x}" y="${lane.position.y}" width="${w}" height="${h}" rx="12" fill="#1E293B" fill-opacity="0.6" stroke="${borderColor}" stroke-width="2" stroke-dasharray="6,4" />
    <rect x="${lane.position.x}" y="${lane.position.y}" width="40" height="${h}" rx="12" fill="${borderColor}" fill-opacity="0.15" />
    <text x="${lane.position.x + 20}" y="${lane.position.y + h / 2}" transform="rotate(-90 ${lane.position.x + 20} ${lane.position.y + h / 2})" text-anchor="middle" fill="${borderColor}" font-weight="bold" font-size="12" letter-spacing="1">${escapeXml(laneTitle)}</text>
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

    const edgeData = edge.data as Record<string, any> | undefined;
    const color = edgeData?.strokeColor || '#38BDF8';
    const controlPoint = edgeData?.controlPoint as { x: number; y: number } | undefined;
    const controlPoints = edgeData?.controlPoints as Array<{ x: number; y: number }> | undefined;

    const [pathD, labelMidX, labelMidY] = getSmartEdgePath({
      sourceX: x1,
      sourceY: y1,
      sourcePosition: Position.Right,
      targetX: x2,
      targetY: y2,
      targetPosition: Position.Left,
      nodes,
      sourceNodeId: edge.source,
      targetNodeId: edge.target,
      controlPoint,
      controlPoints,
    });

    const isAssoc = !!edgeData?.isAssociation;
    const markerEndAttr = isAssoc ? '' : 'marker-end="url(#arrow)"';
    const dashAttr = isAssoc ? 'stroke-dasharray="4,4"' : '';
    svg += `  <path d="${pathD}" fill="none" stroke="${color}" stroke-width="${isAssoc ? 1.8 : 2.5}" ${dashAttr} ${markerEndAttr} />\n`;

    if (edgeData?.conditionText) {
      let finalMidX = labelMidX;
      let finalMidY = labelMidY;
      if (typeof edgeData.labelPosition === 'number') {
        const pt = getPointOnSvgPath(pathD, edgeData.labelPosition);
        if (pt) {
          finalMidX = pt.x;
          finalMidY = pt.y;
        }
      }
      const tagY = finalMidY;
      const condText = escapeXml(String(edgeData.conditionText));
      const labelW = Math.max(condText.length * 7 + 16, 60);
      svg += `  <rect x="${finalMidX - labelW / 2}" y="${tagY - 9}" width="${labelW}" height="18" rx="4" fill="#1E293B" stroke="${color}" stroke-width="1" />
  <text x="${finalMidX}" y="${tagY + 4}" text-anchor="middle" fill="#E2E8F0" font-size="10" font-weight="bold">${condText}</text>\n`;
    }
  });

  // 3. Draw BPMN Functional Nodes
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

        svg += `  <g id="${node.id}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#1E293B" stroke="${strokeColor}" stroke-width="2.5" />
    <circle cx="${cx}" cy="${cy - 12}" r="11" fill="#10B981" fill-opacity="0.2" />
    <polygon points="${cx - 3},${cy - 16} ${cx + 5},${cy - 12} ${cx - 3},${cy - 8}" fill="#10B981" />
    <text x="${cx}" y="${cy + 6}" text-anchor="middle" fill="#10B981" font-size="9" font-weight="bold" font-family="monospace">${escapeXml(idCode || 'INI')}</text>
    ${titleLines[0] ? `<text x="${cx}" y="${cy + 17}" text-anchor="middle" fill="#F8FAFC" font-size="8.5" font-weight="500">${escapeXml(titleLines[0])}</text>` : ''}
    ${titleLines[1] ? `<text x="${cx}" y="${cy + 27}" text-anchor="middle" fill="#F8FAFC" font-size="8.5" font-weight="500">${escapeXml(titleLines[1])}</text>` : ''}
  </g>\n`;
      } else if (isEnd) {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const r = Math.min(w, h) / 2 - 2;
        const strokeColor = nodeData.customBorderColor || '#EF4444';
        const titleLines = wrapText(rawTitle, 16, 2);

        svg += `  <g id="${node.id}">
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="#1E293B" stroke="${strokeColor}" stroke-width="3.5" />
    <circle cx="${cx}" cy="${cy - 12}" r="11" fill="#EF4444" fill-opacity="0.2" />
    <rect x="${cx - 4.5}" y="${cy - 16.5}" width="9" height="9" rx="1.5" fill="#EF4444" />
    <text x="${cx}" y="${cy + 6}" text-anchor="middle" fill="#EF4444" font-size="9" font-weight="bold" font-family="monospace">${escapeXml(idCode || 'FIN')}</text>
    ${titleLines[0] ? `<text x="${cx}" y="${cy + 17}" text-anchor="middle" fill="#F8FAFC" font-size="8.5" font-weight="500">${escapeXml(titleLines[0])}</text>` : ''}
    ${titleLines[1] ? `<text x="${cx}" y="${cy + 27}" text-anchor="middle" fill="#F8FAFC" font-size="8.5" font-weight="500">${escapeXml(titleLines[1])}</text>` : ''}
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

        svg += `  <g id="${node.id}">
    <!-- Diamond -->
    <polygon points="${cx},${diamondTop} ${cx + 32},${diamondCenter} ${cx},${diamondTop + diamondSize} ${cx - 32},${diamondCenter}" fill="#1E293B" stroke="${strokeColor}" stroke-width="2.5" />
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
    <rect x="${pillX}" y="${pillY}" width="${pillW}" height="${pillH}" rx="6" fill="#1E293B" stroke="#334155" stroke-width="1" />
    <text x="${cx}" y="${pillY + 13}" text-anchor="middle" fill="#F59E0B" font-size="9" font-weight="bold" font-family="monospace">${escapeXml(idCode || (isParallel ? 'PAR' : 'GTW'))}</text>
    ${titleLines[0] ? `<text x="${cx}" y="${pillY + 24}" text-anchor="middle" fill="#F8FAFC" font-size="9.5" font-weight="500">${escapeXml(titleLines[0])}</text>` : ''}
    ${titleLines[1] ? `<text x="${cx}" y="${pillY + 34}" text-anchor="middle" fill="#F8FAFC" font-size="9.5" font-weight="500">${escapeXml(titleLines[1])}</text>` : ''}
  </g>\n`;
      } else {
        // Task or SubProcess Card
        let strokeColor = '#0284C7';
        let headerBg = '#0284C7';
        let headerTextColor = '#38BDF8';
        let badgeLabel = 'User Task';

        if (isSubprocess) {
          strokeColor = '#6366F1';
          headerBg = '#6366F1';
          headerTextColor = '#A5B4FC';
          badgeLabel = 'Subproceso';
        } else if (nodeData.nodeType === 'SERVICE_TASK') {
          strokeColor = '#06B6D4';
          headerBg = '#06B6D4';
          headerTextColor = '#67E8F9';
          badgeLabel = 'Service Task';
        } else if (nodeData.nodeType === 'MANUAL_TASK') {
          strokeColor = '#F59E0B';
          headerBg = '#F59E0B';
          headerTextColor = '#FCD34D';
          badgeLabel = 'Manual Task';
        }

        if (nodeData.customBorderColor) strokeColor = nodeData.customBorderColor;
        if (nodeData.customHeaderBgColor) headerBg = nodeData.customHeaderBgColor;

        const badgeW = badgeLabel.length * 6 + 14;
        const titleLines = wrapText(rawTitle || 'Sin título', 26, 2);
        const descLines = wrapText(description, 32, 2);

        svg += `  <g id="${node.id}">
    <!-- Card Frame -->
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#1E293B" stroke="${strokeColor}" stroke-width="1.8" />
    
    <!-- Header -->
    <path d="M ${x} ${y + 12} A 12 12 0 0 1 ${x + 12} ${y} L ${x + w - 12} ${y} A 12 12 0 0 1 ${x + w} ${y + 12} L ${x + w} ${y + 26} L ${x} ${y + 26} Z" fill="${headerBg}" fill-opacity="0.18" />
    <line x1="${x}" y1="${y + 26}" x2="${x + w}" y2="${y + 26}" stroke="#334155" stroke-width="0.8" />

    <!-- Standard ID -->
    <text x="${x + 10}" y="${y + 17}" fill="${headerTextColor}" font-size="9.5" font-weight="bold" font-family="monospace">${escapeXml(idCode)}</text>

    <!-- Badge -->
    <rect x="${x + w - badgeW - 8}" y="${y + 6}" width="${badgeW}" height="15" rx="7.5" fill="${headerBg}" fill-opacity="0.25" stroke="${strokeColor}" stroke-width="0.8" stroke-opacity="0.5" />
    <text x="${x + w - badgeW / 2 - 8}" y="${y + 17}" text-anchor="middle" fill="${headerTextColor}" font-size="8.5" font-weight="600">${escapeXml(badgeLabel)}</text>

    <!-- Title -->
    ${titleLines[0] ? `<text x="${x + 10}" y="${y + 42}" fill="#F8FAFC" font-size="11" font-weight="bold">${escapeXml(titleLines[0])}</text>` : ''}
    ${titleLines[1] ? `<text x="${x + 10}" y="${y + 55}" fill="#F8FAFC" font-size="11" font-weight="bold">${escapeXml(titleLines[1])}</text>` : ''}

    <!-- Description -->
    ${descLines[0] ? `<text x="${x + 10}" y="${y + 70}" fill="#94A3B8" font-size="9">${escapeXml(descLines[0])}</text>` : ''}
    ${descLines[1] ? `<text x="${x + 10}" y="${y + 82}" fill="#94A3B8" font-size="9">${escapeXml(descLines[1])}</text>` : ''}

    <!-- Footer Divider & Meta -->
    <line x1="${x + 10}" y1="${y + h - 22}" x2="${x + w - 10}" y2="${y + h - 22}" stroke="#334155" stroke-width="0.8" />
    ${itSystem ? `<text x="${x + 10}" y="${y + h - 9}" fill="#38BDF8" font-size="8.5">⚙️ ${escapeXml(itSystem)}</text>` : ''}
    ${role ? `<text x="${x + w - 10}" y="${y + h - 9}" text-anchor="end" fill="#818CF8" font-size="8.5">👤 ${escapeXml(role)}</text>` : ''}

    ${
      isSubprocess
        ? `<!-- SubProcess [+] Marker -->
    <rect x="${x + w / 2 - 8}" y="${y + h - 7}" width="16" height="14" rx="2" fill="#0F172A" stroke="${strokeColor}" stroke-width="1.5" />
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

export function downloadSvgFile(project: ProcessProjectFile) {
  const svg = generateProcessSvg(project);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.documentControl.documentCode}_${project.documentControl.documentTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.svg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function downloadPngFile(project: ProcessProjectFile, scale: number = 3): Promise<void> {
  const svgString = generateProcessSvg(project);
  const img = new Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('No se pudo inicializar canvas 2D'));
        return;
      }
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const pngUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = `${project.documentControl.documentCode}_${project.documentControl.documentTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}_HD.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(pngUrl);
        }
        URL.revokeObjectURL(url);
        resolve();
      }, 'image/png');
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

export async function renderProjectToPngDataUrl(project: ProcessProjectFile, scale: number = 2, _mode: 'light' | 'dark' = 'light'): Promise<string> {
  const svgString = generateProcessSvg(project);
  const img = new Image();
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(img.width * scale, 400);
      canvas.height = Math.max(img.height * scale, 200);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('No se pudo inicializar canvas 2D'));
        return;
      }
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
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
