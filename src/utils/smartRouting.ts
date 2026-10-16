import { Node, Position, getBezierPath } from '@xyflow/react';

export interface Point {
  x: number;
  y: number;
}

export interface Box {
  id: string;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface SmartRoutingOptions {
  sourceX: number;
  sourceY: number;
  sourcePosition: Position;
  targetX: number;
  targetY: number;
  targetPosition: Position;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodes?: Node<any>[];
  sourceNodeId?: string;
  targetNodeId?: string;
  padding?: number;
  controlPoint?: Point;
}

/**
 * Calculates a smooth C1-continuous curve governed by a manual control point,
 * allowing users to adjust the inflection bend (contracurva) or arch over/under obstacles.
 */
export function getControlledEdgePath(
  sourceX: number,
  sourceY: number,
  sourcePosition: Position = Position.Right,
  targetX: number,
  targetY: number,
  targetPosition: Position = Position.Left,
  cp: Point
): [pathString: string, labelX: number, labelY: number] {
  const sx = sourceX;
  const sy = sourceY;
  const tx = targetX;
  const ty = targetY;
  const cx = cp.x;
  const cy = cp.y;

  const isSourceHorizontal = sourcePosition === Position.Left || sourcePosition === Position.Right;
  const isTargetHorizontal = targetPosition === Position.Left || targetPosition === Position.Right;

  if (isSourceHorizontal && isTargetHorizontal) {
    const dx1 = Math.max(10, Math.abs(cx - sx));
    const dx2 = Math.max(10, Math.abs(tx - cx));

    const secant1 = (cy - sy) / dx1;
    const secant2 = (ty - cy) / dx2;

    let slopeY = 0;
    if (secant1 * secant2 > 0) {
      slopeY = (2 * secant1 * secant2) / (secant1 + secant2);
    } else {
      slopeY = 0;
    }

    const k1 = Math.max(20, Math.min(dx1 * 0.45, 160));
    const k2 = Math.max(20, Math.min(dx2 * 0.45, 160));

    const srcDir = sourcePosition === Position.Right ? 1 : -1;
    const tgtDir = targetPosition === Position.Left ? -1 : 1;

    const cp1x = sx + srcDir * k1;
    const cp1y = sy;
    const cp2x = cx - k1;
    const cp2y = cy - k1 * slopeY;

    const cp3x = cx + k2;
    const cp3y = cy + k2 * slopeY;
    const cp4x = tx + tgtDir * k2;
    const cp4y = ty;

    const path = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${cx} ${cy} C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${tx} ${ty}`;
    return [path, cx, cy];
  } else {
    const dy1 = Math.max(10, Math.abs(cy - sy));
    const dy2 = Math.max(10, Math.abs(ty - cy));

    const secant1 = (cx - sx) / dy1;
    const secant2 = (tx - cx) / dy2;

    let slopeX = 0;
    if (secant1 * secant2 > 0) {
      slopeX = (2 * secant1 * secant2) / (secant1 + secant2);
    } else {
      slopeX = 0;
    }

    const k1 = Math.max(20, Math.min(dy1 * 0.45, 160));
    const k2 = Math.max(20, Math.min(dy2 * 0.45, 160));

    const srcDir = sourcePosition === Position.Bottom ? 1 : -1;
    const tgtDir = targetPosition === Position.Top ? -1 : 1;

    const cp1x = sx;
    const cp1y = sy + srcDir * k1;
    const cp2x = cx - k1 * slopeX;
    const cp2y = cy - k1;

    const cp3x = cx + k2 * slopeX;
    const cp3y = cy + k2;
    const cp4x = tx;
    const cp4y = ty + tgtDir * k2;

    const path = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${cx} ${cy} C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${tx} ${ty}`;
    return [path, cx, cy];
  }
}

/**
 * Calculates a clean, natural Bezier connection that preserves the original aesthetic
 * and only deflects when a third-party obstacle truly blocks the path.
 */
export function getSmartEdgePath(options: SmartRoutingOptions): [pathString: string, labelX: number, labelY: number] {
  const {
    sourceX,
    sourceY,
    sourcePosition = Position.Right,
    targetX,
    targetY,
    targetPosition = Position.Left,
    nodes = [],
    sourceNodeId,
    targetNodeId,
    padding = 16,
    controlPoint
  } = options;

  // 0. If a manual control point is specified, use controlled trajectory immediately
  if (controlPoint) {
    return getControlledEdgePath(
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      controlPoint
    );
  }

  // 1. Collect third-party obstacles (strictly excluding source, target, and swimlanes)
  const obstacles: Box[] = [];

  for (const node of nodes) {
    if (!node || node.id === sourceNodeId || node.id === targetNodeId) continue;
    if (node.type === 'PoolLane' || node.hidden) continue;

    const posX = node.position?.x ?? 0;
    const posY = node.position?.y ?? 0;

    let w = (node.measured?.width ?? node.width) as number;
    let h = (node.measured?.height ?? node.height) as number;

    if (node.type === 'ExclusiveGateway' || node.type === 'ParallelGateway') {
      w = Math.max(w || 0, 130);
      h = Math.max(h || 0, 125);
    } else if (
      node.type === 'StartEvent' ||
      node.type === 'EndEvent' ||
      node.type === 'TimerBoundaryEvent' ||
      node.type === 'QualityCheckpointEvent'
    ) {
      w = Math.max(w || 0, 100);
      h = Math.max(h || 0, 120);
    } else if (node.type === 'StickyNote') {
      w = Math.max(w || 0, 200);
      h = Math.max(h || 0, 150);
    } else {
      w = Math.max(w || 0, 220);
      h = Math.max(h || 0, 140);
    }

    obstacles.push({
      id: node.id,
      minX: posX - padding,
      maxX: posX + w + padding,
      minY: posY - padding,
      maxY: posY + h + padding
    });
  }

  // 2. If there are no intermediate obstacles on the canvas, return native Bezier curve immediately
  if (obstacles.length === 0) {
    const [path, lx, ly] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
    return [path, lx, ly];
  }

  // 3. Compute Bezier control points and test for collisions with third-party obstacles
  const p0: Point = { x: sourceX, y: sourceY };
  const p3: Point = { x: targetX, y: targetY };
  const [c1, c2] = calculateBezierControlPoints(p0, sourcePosition, p3, targetPosition);

  const collidingObstacles = getCollidingObstacles(p0, c1, c2, p3, obstacles);

  // If no third-party obstacles are in the way, return the natural Bezier path
  if (collidingObstacles.length === 0) {
    const [path, lx, ly] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
    return [path, lx, ly];
  }

  // 4. A third-party obstacle is genuinely blocking the trajectory -> compute clean smooth bypass
  return calculateCleanBypass(
    p0,
    sourcePosition,
    p3,
    targetPosition,
    collidingObstacles
  );
}

function calculateBezierControlPoints(
  src: Point,
  srcPos: Position,
  tgt: Point,
  tgtPos: Position
): [Point, Point] {
  const dx = Math.abs(tgt.x - src.x);
  const dy = Math.abs(tgt.y - src.y);
  const distance = Math.hypot(dx, dy);
  const offset = Math.max(25, Math.min(distance * 0.5, 150));

  let c1: Point = { ...src };
  switch (srcPos) {
    case Position.Right:
      c1 = { x: src.x + offset, y: src.y };
      break;
    case Position.Left:
      c1 = { x: src.x - offset, y: src.y };
      break;
    case Position.Top:
      c1 = { x: src.x, y: src.y - offset };
      break;
    case Position.Bottom:
      c1 = { x: src.x, y: src.y + offset };
      break;
  }

  let c2: Point = { ...tgt };
  switch (tgtPos) {
    case Position.Right:
      c2 = { x: tgt.x + offset, y: tgt.y };
      break;
    case Position.Left:
      c2 = { x: tgt.x - offset, y: tgt.y };
      break;
    case Position.Top:
      c2 = { x: tgt.x, y: tgt.y - offset };
      break;
    case Position.Bottom:
      c2 = { x: tgt.x, y: tgt.y + offset };
      break;
  }

  return [c1, c2];
}

function sampleBezier(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y
  };
}

function isSegmentCrossingBox(p1: Point, p2: Point, box: Box): boolean {
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);

  if (maxX < box.minX || minX > box.maxX || maxY < box.minY || minY > box.maxY) {
    return false;
  }

  // Inside box check
  if ((p1.x >= box.minX && p1.x <= box.maxX && p1.y >= box.minY && p1.y <= box.maxY) ||
      (p2.x >= box.minX && p2.x <= box.maxX && p2.y >= box.minY && p2.y <= box.maxY)) {
    return true;
  }

  return true;
}

function getCollidingObstacles(
  p0: Point,
  c1: Point,
  c2: Point,
  p3: Point,
  obstacles: Box[]
): Box[] {
  const SAMPLES = 20;
  const samplePoints: Point[] = [p0];

  for (let i = 1; i < SAMPLES; i++) {
    samplePoints.push(sampleBezier(p0, c1, c2, p3, i / SAMPLES));
  }
  samplePoints.push(p3);

  const collided: Box[] = [];

  for (const box of obstacles) {
    let hasCollision = false;
    for (let i = 0; i < samplePoints.length - 1; i++) {
      if (isSegmentCrossingBox(samplePoints[i], samplePoints[i + 1], box)) {
        hasCollision = true;
        break;
      }
    }
    if (hasCollision) {
      collided.push(box);
    }
  }

  return collided;
}

/**
 * Computes a clean, elegant smooth bypass around colliding obstacles without overshoots.
 */
function calculateCleanBypass(
  src: Point,
  srcPos: Position,
  tgt: Point,
  tgtPos: Position,
  collidingObs: Box[]
): [string, number, number] {
  let minObsY = Infinity;
  let maxObsY = -Infinity;
  let minObsX = Infinity;
  let maxObsX = -Infinity;

  for (const b of collidingObs) {
    if (b.minY < minObsY) minObsY = b.minY;
    if (b.maxY > maxObsY) maxObsY = b.maxY;
    if (b.minX < minObsX) minObsX = b.minX;
    if (b.maxX > maxObsX) maxObsX = b.maxX;
  }

  const midY = (src.y + tgt.y) / 2;
  const distToTop = Math.abs(midY - (minObsY - 30));
  const distToBottom = Math.abs(midY - (maxObsY + 30));

  // Determine whether to route over the top or under the bottom
  const routeAbove = (srcPos === Position.Top || tgtPos === Position.Top || distToTop <= distToBottom) && (srcPos !== Position.Bottom && tgtPos !== Position.Bottom);
  const detourY = routeAbove ? minObsY - 30 : maxObsY + 30;

  // Backward loop scenario (Right to Left)
  if (srcPos === Position.Right && tgtPos === Position.Left && src.x > tgt.x) {
    const rightStubX = Math.max(src.x + 40, maxObsX + 35);
    const leftStubX = Math.min(tgt.x - 40, minObsX - 35);

    const path = `M ${src.x} ${src.y} C ${rightStubX} ${src.y}, ${rightStubX} ${detourY}, ${(rightStubX + leftStubX) / 2} ${detourY} C ${leftStubX} ${detourY}, ${leftStubX} ${tgt.y}, ${tgt.x} ${tgt.y}`;
    const lx = (rightStubX + leftStubX) / 2;
    const ly = detourY;
    return [path, lx, ly];
  }

  // Forward bypass scenario (Left to Right or Vertical)
  const midX = (src.x + tgt.x) / 2;
  const c1x = srcPos === Position.Right ? src.x + 35 : (srcPos === Position.Left ? src.x - 35 : src.x);
  const c1y = srcPos === Position.Bottom ? src.y + 35 : (srcPos === Position.Top ? src.y - 35 : src.y);

  const c2x = tgtPos === Position.Left ? tgt.x - 35 : (tgtPos === Position.Right ? tgt.x + 35 : tgt.x);
  const c2y = tgtPos === Position.Top ? tgt.y - 35 : (tgtPos === Position.Bottom ? tgt.y + 35 : tgt.y);

  // Two-segment smooth cubic curve through detour point
  const path = `M ${src.x} ${src.y} C ${c1x} ${c1y}, ${midX} ${detourY}, ${midX} ${detourY} C ${midX} ${detourY}, ${c2x} ${c2y}, ${tgt.x} ${tgt.y}`;
  const lx = midX;
  const ly = detourY;

  return [path, lx, ly];
}
