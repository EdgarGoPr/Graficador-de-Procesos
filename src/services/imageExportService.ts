import { ProcessProjectFile } from '../types/project';

/**
 * Generates an SVG string representation of the process diagram
 */
export function generateProcessSvg(project: ProcessProjectFile): string {
  const nodes = project.nodes || [];
  const edges = project.edges || [];

  if (nodes.length === 0) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><text x="50%" y="50%" text-anchor="middle" fill="#999">No hay elementos en el proceso</text></svg>`;
  }

  // Calculate bounding box
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

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX - padding} ${minY - padding} ${viewBoxWidth} ${viewBoxHeight}" width="${viewBoxWidth}" height="${viewBoxHeight}" style="background-color: #0F172A; font-family: Inter, system-ui, sans-serif;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#38BDF8" />
    </marker>
  </defs>
`;

  // Draw Swimlanes first (Background layer)
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
    <text x="${lane.position.x + 20}" y="${lane.position.y + h / 2}" transform="rotate(-90 ${lane.position.x + 20} ${lane.position.y + h / 2})" text-anchor="middle" fill="${borderColor}" font-weight="bold" font-size="12" letter-spacing="1">${laneTitle}</text>
  </g>\n`;
    });

  // Draw Connections (Edges)
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

    const dx = Math.abs(x2 - x1) / 2;
    const edgeData = edge.data as Record<string, any> | undefined;
    const color = edgeData?.strokeColor || '#38BDF8';

    svg += `  <path d="M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}" fill="none" stroke="${color}" stroke-width="2.5" marker-end="url(#arrow)" />\n`;

    if (edgeData?.conditionText) {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2 - 8;
      svg += `  <rect x="${midX - 35}" y="${midY - 10}" width="70" height="18" rx="4" fill="#1E293B" stroke="${color}" stroke-width="1" />
  <text x="${midX}" y="${midY + 3}" text-anchor="middle" fill="#E2E8F0" font-size="10" font-weight="bold">${edgeData.conditionText}</text>\n`;
    }
  });

  // Draw Functional Nodes & Sticky Notes
  nodes
    .filter((n) => n.type !== 'PoolLane')
    .forEach((node) => {
      const nodeData = node.data as Record<string, any> | undefined;
      const isSticky = node.type === 'StickyNote';
      const w = isSticky ? 220 : ((node.measured?.width || node.width || 210) as number);
      const h = isSticky ? 140 : ((node.measured?.height || node.height || 120) as number);
      const x = node.position.x;
      const y = node.position.y;
      const title = String(nodeData?.title || 'Actividad').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      const idCode = String(nodeData?.standardId || 'ID');
      const role = String(nodeData?.roleName || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

      if (isSticky) {
        svg += `  <g id="${node.id}">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#FEF9C3" stroke="#FDE047" stroke-width="2" />
    <text x="${x + 12}" y="${y + 22}" fill="#713F12" font-weight="bold" font-size="12">${title}</text>
    <text x="${x + 12}" y="${y + 44}" fill="#854D0E" font-size="10">${String(nodeData?.description || '').substring(0, 70)}...</text>
  </g>\n`;
      } else {
        const isStart = node.type === 'StartEvent';
        const isEnd = node.type === 'EndEvent';
        const isGateway = node.type?.includes('Gateway');

        let strokeColor = '#38BDF8';
        let headerBg = '#0284C7';
        if (isStart) { strokeColor = '#10B981'; headerBg = '#059669'; }
        else if (isEnd) { strokeColor = '#EF4444'; headerBg = '#DC2626'; }
        else if (isGateway) { strokeColor = '#F59E0B'; headerBg = '#D97706'; }

        svg += `  <g id="${node.id}">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#1E293B" stroke="${strokeColor}" stroke-width="2" />
    <rect x="${x}" y="${y}" width="${w}" height="28" rx="8" fill="${headerBg}" fill-opacity="0.2" />
    <text x="${x + 10}" y="${y + 18}" fill="${strokeColor}" font-weight="bold" font-size="10" font-family="monospace">${idCode}</text>
    <text x="${x + w - 10}" y="${y + 18}" text-anchor="end" fill="#94A3B8" font-size="9">${role.substring(0, 18)}</text>
    <text x="${x + 10}" y="${y + 48}" fill="#F8FAFC" font-weight="bold" font-size="11">${title.substring(0, 24)}</text>
    ${title.length > 24 ? `<text x="${x + 10}" y="${y + 64}" fill="#F8FAFC" font-weight="bold" font-size="11">${title.substring(24, 48)}</text>` : ''}
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

export async function downloadPngFile(project: ProcessProjectFile, scale: number = 2): Promise<void> {
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
