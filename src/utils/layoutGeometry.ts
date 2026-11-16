import type { Edge, Node } from '@xyflow/react';
import type { BpmnNodeData, SequenceFlowData } from '../types/process';
import type { ProcessProjectFile } from '../types/project';

/**
 * Geometría del lienzo: tamaños de nodos, superposición y búsqueda de espacio libre.
 * Módulo puro (sin React ni stores) para poder testearlo.
 */

export interface Size {
  width: number;
  height: number;
}

export interface Box extends Size {
  x: number;
  y: number;
}

interface NodeLike {
  type?: string;
  position?: { x: number; y: number };
  width?: number;
  height?: number;
  measured?: { width?: number; height?: number };
  style?: { width?: number | string; height?: number | string };
  data?: { displayMode?: string; orientation?: string; nodeType?: string };
}

/** Margen mínimo entre dos nodos para que no se toquen. */
export const NODE_MARGIN = 24;

/**
 * Tamaño de un nodo: el medido por React Flow si existe; si no, una estimación por tipo
 * (coincide con los mínimos de cada componente de nodo, con su etiqueta).
 */
export function estimateNodeSize(node: NodeLike): Size {
  const mw = node.measured?.width ?? node.width;
  const mh = node.measured?.height ?? node.height;
  if (typeof mw === 'number' && typeof mh === 'number' && mw > 0 && mh > 0) return { width: mw, height: mh };

  const type = node.type || node.data?.nodeType || '';
  const titleOnly = node.data?.displayMode === 'title_only';
  const vertical = node.data?.orientation === 'vertical';

  switch (type) {
    case 'StartEvent':
    case 'EndEvent':
    case 'TimerBoundaryEvent':
      return { width: 100, height: 110 };
    case 'ExclusiveGateway':
    case 'ParallelGateway':
      return { width: 150, height: 150 };
    case 'QualityCheckpointEvent':
      return titleOnly ? { width: 170, height: 70 } : { width: 210, height: 125 };
    case 'SubProcess':
      return titleOnly ? { width: 180, height: 75 } : { width: 240, height: 145 };
    case 'StickyNote':
      return { width: 170, height: 120 };
    default:
      if (vertical) return { width: 160, height: 200 };
      return titleOnly ? { width: 180, height: 75 } : { width: 220, height: 135 };
  }
}

export function boxOf(node: NodeLike): Box {
  const size = estimateNodeSize(node);
  return { x: node.position?.x ?? 0, y: node.position?.y ?? 0, ...size };
}

export function boxesOverlap(a: Box, b: Box, margin = 0): boolean {
  return (
    a.x < b.x + b.width + margin &&
    b.x < a.x + a.width + margin &&
    a.y < b.y + b.height + margin &&
    b.y < a.y + a.height + margin
  );
}

/** Pares de nodos que se superponen (para tests y verificaciones). */
export function findOverlaps<T extends NodeLike & { id: string }>(nodes: T[], margin = 0): Array<[string, string]> {
  const boxes = nodes.map((n) => ({ id: n.id, box: boxOf(n) }));
  const pairs: Array<[string, string]> = [];
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      if (boxesOverlap(boxes[i].box, boxes[j].box, margin)) pairs.push([boxes[i].id, boxes[j].id]);
    }
  }
  return pairs;
}

const STEP = 20;
const MAX_RADIUS = 1600;
let cachedOffsets: Array<[number, number]> | null = null;

/** Desplazamientos candidatos ordenados por distancia (se calculan una sola vez). */
function searchOffsets(): Array<[number, number]> {
  if (cachedOffsets) return cachedOffsets;
  const offsets: Array<[number, number]> = [];
  const steps = MAX_RADIUS / STEP;
  for (let dx = -steps; dx <= steps; dx++) {
    for (let dy = -steps; dy <= steps; dy++) {
      const ox = dx * STEP;
      const oy = dy * STEP;
      if (ox * ox + oy * oy <= MAX_RADIUS * MAX_RADIUS) offsets.push([ox, oy]);
    }
  }
  // A igual distancia, se prefiere moverse a la derecha y luego hacia abajo (sentido de lectura del flujo).
  offsets.sort((a, b) => a[0] * a[0] + a[1] * a[1] - (b[0] * b[0] + b[1] * b[1]) || b[0] - a[0] || b[1] - a[1]);
  cachedOffsets = offsets;
  return offsets;
}

/**
 * Posición libre más cercana a la deseada, sin superponerse con ninguno de los obstáculos.
 * Si se indican límites verticales (por ejemplo, el carril), el nodo se mantiene dentro de ellos.
 */
export function findFreePosition(
  desired: { x: number; y: number },
  size: Size,
  obstacles: Box[],
  bounds?: { minY?: number; maxY?: number }
): { x: number; y: number } {
  const minY = bounds?.minY;
  const maxY = bounds?.maxY;
  const fits = (x: number, y: number) => {
    if (minY !== undefined && y < minY) return false;
    if (maxY !== undefined && y + size.height > maxY) return false;
    const candidate: Box = { x, y, ...size };
    return !obstacles.some((o) => boxesOverlap(candidate, o, NODE_MARGIN));
  };
  for (const [ox, oy] of searchOffsets()) {
    const x = desired.x + ox;
    const y = desired.y + oy;
    if (fits(x, y)) return { x, y };
  }
  // Sin lugar cerca (lienzo muy lleno): se ubica a la derecha de todo, a la altura pedida.
  const rightmost = obstacles.reduce((max, o) => Math.max(max, o.x + o.width), desired.x);
  return { x: rightmost + NODE_MARGIN * 2, y: desired.y };
}

/** Devuelve el `laneId` del carril (`PoolLane`) que contiene verticalmente la coordenada `y`. */
export function detectLaneIdAtY(nodes: Node<BpmnNodeData>[], y: number): string | undefined {
  for (const n of nodes) {
    if (n.type !== 'PoolLane') continue;
    const top = n.position?.y ?? 0;
    const height = Number(n.style?.height ?? n.measured?.height ?? n.height ?? 250);
    if (y >= top && y <= top + height) {
      return n.data?.laneId || n.id;
    }
  }
  return undefined;
}

/**
 * Ubica un nodo nuevo en la posición libre más cercana a `desired`,
 * respetando los límites verticales del carril indicado si existe.
 */
export function placeNodeWithoutOverlap(
  desired: { x: number; y: number },
  nodeType: string,
  existingNodes: Node<BpmnNodeData>[],
  laneId?: string
): { x: number; y: number } {
  if (nodeType === 'PoolLane') return desired;

  const size = estimateNodeSize({ type: nodeType });
  const obstacles = existingNodes.filter((n) => n.type !== 'PoolLane').map((n) => boxOf(n));
  const laneNode = laneId
    ? existingNodes.find((n) => n.type === 'PoolLane' && (n.data?.laneId === laneId || n.id === laneId))
    : undefined;

  let bounds: { minY?: number; maxY?: number } | undefined;
  let start = desired;

  if (laneNode) {
    const laneY = laneNode.position?.y ?? 0;
    const laneH = Number(laneNode.style?.height ?? laneNode.measured?.height ?? laneNode.height ?? 250);
    if (laneH >= size.height + 24) {
      bounds = { minY: laneY + 12, maxY: laneY + laneH - 12 };
      const clampedY = Math.min(Math.max(desired.y, bounds.minY!), bounds.maxY! - size.height);
      start = { x: desired.x, y: clampedY };
    } else {
      bounds = { minY: laneY };
      start = { x: desired.x, y: Math.max(desired.y, laneY) };
    }
  }

  return findFreePosition(start, size, obstacles, bounds);
}

/** Columna (nivel) de cada nodo: camino más largo desde el inicio, ignorando los retornos (ciclos). */
function computeColumns(workNodes: Node<BpmnNodeData>[], edges: Edge<SequenceFlowData>[]): Map<string, number> {
  const ids = new Set(workNodes.map((n) => n.id));
  const adj = new Map<string, string[]>();
  workNodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    if (ids.has(e.source) && ids.has(e.target) && e.source !== e.target) adj.get(e.source)!.push(e.target);
  });

  // Orden topológico por DFS; las aristas hacia un nodo en curso (retornos) se descartan.
  const state = new Map<string, 0 | 1 | 2>();
  const order: string[] = [];
  const forward = new Map<string, string[]>();
  const visit = (id: string) => {
    state.set(id, 1);
    const kept: string[] = [];
    for (const next of adj.get(id) || []) {
      const s = state.get(next) || 0;
      if (s === 1) continue; // retorno
      kept.push(next);
      if (s === 0) visit(next);
    }
    forward.set(id, kept);
    state.set(id, 2);
    order.push(id);
  };
  const roots = workNodes.filter((n) => n.type === 'StartEvent').map((n) => n.id);
  [...roots, ...workNodes.map((n) => n.id)].forEach((id) => {
    if (!state.get(id)) visit(id);
  });
  order.reverse();

  const level = new Map<string, number>();
  order.forEach((id) => {
    if (!level.has(id)) level.set(id, 0);
    for (const next of forward.get(id) || []) {
      level.set(next, Math.max(level.get(next) || 0, (level.get(id) || 0) + 1));
    }
  });
  return level;
}

const LAYOUT = {
  laneHeaderWidth: 150, // espacio reservado para el rótulo del carril
  columnGap: 90,
  stackGap: 50,
  lanePadding: 45,
  minLaneHeight: 250,
  rightPadding: 160
};

/**
 * AUTO-ORDENAR: ubica los nodos por columnas (orden del flujo) y carriles sin superposiciones.
 * Cada columna toma el ancho de su nodo más ancho, los nodos que comparten carril y columna se
 * apilan con su alto real y cada carril crece lo necesario (PST-083, PST-114).
 */
export function autoLayoutProcessCanvas(project: ProcessProjectFile): ProcessProjectFile {
  const pool = project.pools[0];
  const lanes = pool?.lanes || [];

  const workNodes = project.nodes.filter((n) => n.type !== 'PoolLane' && n.type !== 'StickyNote');
  const stickyNodes = project.nodes.filter((n) => n.type === 'StickyNote');
  const edges = project.edges || [];

  if (workNodes.length === 0) return project;

  const columnOf = computeColumns(workNodes, edges);
  const laneIndexOf = (n: Node<BpmnNodeData>) => Math.max(0, lanes.findIndex((l) => l.id === n.data?.laneId));
  const sizeOf = new Map(workNodes.map((n) => [n.id, estimateNodeSize(n)]));
  const maxColumn = Math.max(...workNodes.map((n) => columnOf.get(n.id) || 0));
  const laneCount = Math.max(1, lanes.length);

  // Celdas (carril, columna) con sus nodos, en el orden en que aparecen.
  const cells = new Map<string, Node<BpmnNodeData>[]>();
  workNodes.forEach((n) => {
    const key = `${laneIndexOf(n)}_${columnOf.get(n.id) || 0}`;
    if (!cells.has(key)) cells.set(key, []);
    cells.get(key)!.push(n);
  });
  const cellHeight = (nodes: Node<BpmnNodeData>[]) =>
    nodes.reduce((acc, n) => acc + sizeOf.get(n.id)!.height, 0) + LAYOUT.stackGap * Math.max(0, nodes.length - 1);

  // Ancho de cada columna y su X.
  const columnWidth: number[] = [];
  for (let c = 0; c <= maxColumn; c++) {
    columnWidth[c] = Math.max(
      0,
      ...workNodes.filter((n) => (columnOf.get(n.id) || 0) === c).map((n) => sizeOf.get(n.id)!.width)
    );
  }
  const columnX: number[] = [];
  let cursorX = LAYOUT.laneHeaderWidth;
  for (let c = 0; c <= maxColumn; c++) {
    columnX[c] = cursorX;
    cursorX += columnWidth[c] + (columnWidth[c] > 0 ? LAYOUT.columnGap : 0);
  }

  // Alto de cada carril según su celda más alta, y su Y.
  const laneHeight: number[] = [];
  const laneY: number[] = [];
  let cursorY = 0;
  for (let l = 0; l < laneCount; l++) {
    let tallest = 0;
    for (let c = 0; c <= maxColumn; c++) {
      const cell = cells.get(`${l}_${c}`);
      if (cell) tallest = Math.max(tallest, cellHeight(cell));
    }
    laneHeight[l] = Math.max(LAYOUT.minLaneHeight, tallest + LAYOUT.lanePadding * 2);
    laneY[l] = cursorY;
    cursorY += laneHeight[l];
  }

  const position = new Map<string, { x: number; y: number }>();
  cells.forEach((cellNodes, key) => {
    const [l, c] = key.split('_').map(Number);
    let y = laneY[l] + (laneHeight[l] - cellHeight(cellNodes)) / 2;
    cellNodes.forEach((n) => {
      const size = sizeOf.get(n.id)!;
      position.set(n.id, { x: Math.round(columnX[c] + (columnWidth[c] - size.width) / 2), y: Math.round(y) });
      y += size.height + LAYOUT.stackGap;
    });
  });

  const updatedWorkNodes: Node<BpmnNodeData>[] = workNodes.map((n) => {
    const laneIdx = laneIndexOf(n);
    return {
      ...n,
      position: position.get(n.id)!,
      data: {
        ...n.data,
        laneId: lanes[laneIdx]?.id || n.data.laneId,
        laneName: lanes[laneIdx]?.name || n.data.laneName,
        roleName: n.data.roleName || lanes[laneIdx]?.role || 'Responsable'
      }
    };
  });

  const requiredLaneWidth = Math.max(1600, cursorX + LAYOUT.rightPadding);

  // Notas adhesivas: se conservan donde estaban, salvo que queden encima de un nodo.
  const workBoxes = updatedWorkNodes.map((n) => ({ ...n.position, ...sizeOf.get(n.id)! }));
  const placedSticky: Node<BpmnNodeData>[] = [];
  stickyNodes.forEach((s) => {
    const size = estimateNodeSize(s);
    const obstacles = [...workBoxes, ...placedSticky.map((p) => ({ ...p.position, ...estimateNodeSize(p) }))];
    const free = findFreePosition(s.position || { x: 0, y: 0 }, size, obstacles);
    placedSticky.push({ ...s, position: free });
  });

  // Reconstruir nodos de carril (PoolLane) alineados con el nuevo alto de cada carril
  const updatedLaneNodes: Node<BpmnNodeData>[] = lanes.map((lane, idx) => {
    const existingLaneNode = project.nodes.find((n) => n.type === 'PoolLane' && n.data?.laneId === lane.id);
    return {
      id: existingLaneNode?.id || `node_${lane.id}`,
      type: 'PoolLane',
      position: { x: 0, y: laneY[idx] },
      style: { width: requiredLaneWidth, height: laneHeight[idx], zIndex: -10 },
      draggable: false,
      selectable: true,
      data: {
        ...(existingLaneNode?.data || {}),
        standardId: existingLaneNode?.data?.standardId || `CAR-0${idx + 1}`,
        title: `${lane.name} — ${lane.role}`,
        description: existingLaneNode?.data?.description || '',
        nodeType: 'PoolLane',
        laneId: lane.id,
        laneName: lane.name,
        roleName: lane.role,
        itSystem: lane.system || 'GDE',
        legalFramework: '',
        inputs: [],
        outputs: [],
        operationalRisks: [],
        customBgColor: lane.colorHex,
        tags: ['Carril']
      }
    };
  });

  return {
    ...project,
    nodes: [...updatedLaneNodes, ...updatedWorkNodes, ...placedSticky]
  };
}
