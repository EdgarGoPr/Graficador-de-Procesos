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
}

/**
 * Calculates a smooth Bezier path that preserves the original aesthetic and dynamically avoids obstacles.
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
    padding = 24
  } = options;

  // 1. Build obstacle bounding boxes (accounting for labels, rotated gateways, and padding)
  const obstacles: Box[] = [];
  let targetBox: Box | null = null;
  let sourceBox: Box | null = null;

  for (const node of nodes) {
    if (node.type === 'PoolLane') continue; // Swimlanes are background containers
    if (node.hidden) continue;

    const posX = node.position?.x ?? 0;
    const posY = node.position?.y ?? 0;

    let w = (node.measured?.width ?? node.width) as number;
    let h = (node.measured?.height ?? node.height) as number;

    // Provide robust defaults for specific node types
    if (node.type === 'ExclusiveGateway' || node.type === 'ParallelGateway') {
      // Gateway: rotated 64x64 diamond (diagonal width ~90px) + bottom label box (width ~140px, height ~45px)
      w = Math.max(w || 0, 140);
      h = Math.max(h || 0, 135);
    } else if (
      node.type === 'StartEvent' ||
      node.type === 'EndEvent' ||
      node.type === 'TimerBoundaryEvent' ||
      node.type === 'QualityCheckpointEvent'
    ) {
      // Events: circle + bottom badge / label
      w = Math.max(w || 0, 110);
      h = Math.max(h || 0, 130);
    } else if (node.type === 'StickyNote') {
      w = Math.max(w || 0, 200);
      h = Math.max(h || 0, 160);
    } else {
      // Tasks and Subprocesses
      w = Math.max(w || 0, 240);
      h = Math.max(h || 0, 150);
    }

    const box: Box = {
      id: node.id,
      minX: posX - padding,
      maxX: posX + w + padding,
      minY: posY - padding,
      maxY: posY + h + padding
    };

    if (node.id === targetNodeId) {
      targetBox = box;
    } else if (node.id === sourceNodeId) {
      sourceBox = box;
    } else {
      obstacles.push(box);
    }
  }

  // 2. Compute natural Bezier curve control points
  const p0: Point = { x: sourceX, y: sourceY };
  const p3: Point = { x: targetX, y: targetY };
  const [c1, c2] = calculateBezierControlPoints(p0, sourcePosition, p3, targetPosition);

  // 3. Test if natural Bezier curve has collisions with any obstacle or crosses target/source body
  const isDirectBezierClear = isBezierCurveCollisionFree(p0, c1, c2, p3, obstacles, sourceBox, targetBox, sourcePosition, targetPosition);

  if (isDirectBezierClear) {
    // Return original smooth Bezier path directly (100% original aesthetic)
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

  // 4. Collision detected -> Calculate smooth obstacle avoidance curve (Bezier Spline)
  const avoidancePath = calculateSmoothAvoidanceSpline(
    p0,
    sourcePosition,
    p3,
    targetPosition,
    obstacles,
    sourceBox,
    targetBox
  );

  return avoidancePath;
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
  const curvature = 0.5;
  const offset = Math.max(30, Math.min(distance * curvature, 180));

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

function sampleBezierPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
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

function isPointInBox(p: Point, box: Box): boolean {
  return p.x >= box.minX && p.x <= box.maxX && p.y >= box.minY && p.y <= box.maxY;
}

function isSegmentIntersectingBox(p1: Point, p2: Point, box: Box): boolean {
  const minX = Math.min(p1.x, p2.x);
  const maxX = Math.max(p1.x, p2.x);
  const minY = Math.min(p1.y, p2.y);
  const maxY = Math.max(p1.y, p2.y);

  if (maxX < box.minX || minX > box.maxX || maxY < box.minY || minY > box.maxY) {
    return false;
  }

  // If either endpoint is inside the box
  if (isPointInBox(p1, box) || isPointInBox(p2, box)) {
    return true;
  }

  return true;
}

function isBezierCurveCollisionFree(
  p0: Point,
  c1: Point,
  c2: Point,
  p3: Point,
  obstacles: Box[],
  _sourceBox: Box | null,
  targetBox: Box | null,
  _srcPos: Position,
  tgtPos: Position
): boolean {
  const SAMPLES = 24;
  const points: Point[] = [p0];

  for (let i = 1; i < SAMPLES; i++) {
    const t = i / SAMPLES;
    const pt = sampleBezierPoint(p0, c1, c2, p3, t);
    points.push(pt);
  }
  points.push(p3);

  // Check collision against intermediate obstacles
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];

    for (const box of obstacles) {
      if (isSegmentIntersectingBox(a, b, box)) {
        return false;
      }
    }
  }

  // Check if curve cuts through the target node when coming from an unnatural angle
  if (targetBox) {
    // Check if intermediate curve points (between 10% and 80%) penetrate the target box
    for (let i = 2; i < points.length - 3; i++) {
      if (isPointInBox(points[i], targetBox)) {
        return false;
      }
    }

    // If target handle is on Left, but approaching from the right through target body
    if (tgtPos === Position.Left && p0.x > targetBox.maxX && p3.x < targetBox.minX + 30) {
      return false;
    }
    // If target handle is on Top, but approaching from below through target body
    if (tgtPos === Position.Top && p0.y > targetBox.maxY && p3.y < targetBox.minY + 30) {
      return false;
    }
  }

  return true;
}

/**
 * Calculates a smooth multi-segment Bezier curve that detours around obstacles with organic curvature.
 */
function calculateSmoothAvoidanceSpline(
  src: Point,
  srcPos: Position,
  tgt: Point,
  tgtPos: Position,
  obstacles: Box[],
  sourceBox: Box | null,
  targetBox: Box | null
): [string, number, number] {
  const allBoxes = [...obstacles];
  if (targetBox) allBoxes.push(targetBox);
  if (sourceBox) allBoxes.push(sourceBox);

  // Find bounding envelope of colliding obstacles
  const collidingObs: Box[] = [];
  const midX = (src.x + tgt.x) / 2;
  const midY = (src.y + tgt.y) / 2;
  const spanMinX = Math.min(src.x, tgt.x) - 40;
  const spanMaxX = Math.max(src.x, tgt.x) + 40;
  const spanMinY = Math.min(src.y, tgt.y) - 40;
  const spanMaxY = Math.max(src.y, tgt.y) + 40;

  for (const box of obstacles) {
    if (box.maxX > spanMinX && box.minX < spanMaxX && box.maxY > spanMinY && box.minY < spanMaxY) {
      collidingObs.push(box);
    }
  }

  // Determine detour channel (Above, Below, Left, Right)
  let detourY = midY;
  let detourX = midX;

  if (collidingObs.length > 0) {
    let topClearance = Infinity;
    let bottomClearance = -Infinity;

    for (const b of collidingObs) {
      if (b.minY < topClearance) topClearance = b.minY;
      if (b.maxY > bottomClearance) bottomClearance = b.maxY;
    }

    const distToTop = Math.abs(midY - (topClearance - 35));
    const distToBottom = Math.abs(midY - (bottomClearance + 35));

    // Prefer shorter detour or handle-friendly direction
    if (srcPos === Position.Top || tgtPos === Position.Top || distToTop < distToBottom) {
      detourY = topClearance - 40;
    } else {
      detourY = bottomClearance + 40;
    }
  } else {
    // Default detour around target node if target was the obstacle
    if (targetBox) {
      if (srcPos === Position.Bottom || tgtPos === Position.Bottom) {
        detourY = targetBox.maxY + 40;
      } else {
        detourY = targetBox.minY - 40;
      }
    }
  }

  // Create waypoints for smooth Bezier spline
  const stubOffset = 30;
  const srcStub = getHandleStub(src, srcPos, stubOffset);
  const tgtStub = getHandleStub(tgt, tgtPos, stubOffset);

  // Generate intermediate clearance waypoints
  const waypoints: Point[] = [src, srcStub];

  // If backward loop or lateral detour needed
  if (srcPos === Position.Bottom && tgtPos === Position.Left) {
    // Coming from bottom into a left handle (e.g. Timer -> Gateway):
    // Descend below gateway, sweep around to the left, and enter handle
    const clearX = Math.min(src.x, tgt.x - 45);
    waypoints.push({ x: srcStub.x, y: detourY });
    waypoints.push({ x: clearX, y: detourY });
    waypoints.push({ x: clearX, y: tgtStub.y });
  } else if (srcPos === Position.Right && tgtPos === Position.Left && src.x > tgt.x) {
    // Backward loop (Right to Left):
    const leftClearX = Math.min(src.x, tgt.x) - 50;
    const rightClearX = Math.max(src.x, tgt.x) + 50;
    waypoints.push({ x: rightClearX, y: srcStub.y });
    waypoints.push({ x: rightClearX, y: detourY });
    waypoints.push({ x: leftClearX, y: detourY });
    waypoints.push({ x: leftClearX, y: tgtStub.y });
  } else {
    // Standard bypass
    waypoints.push({ x: (srcStub.x + tgtStub.x) / 2, y: detourY });
  }

  waypoints.push(tgtStub, tgt);

  // Build smooth cubic Bezier path string from waypoints
  return buildSmoothSplinePath(waypoints);
}

function getHandleStub(point: Point, pos: Position, offset: number): Point {
  switch (pos) {
    case Position.Right:
      return { x: point.x + offset, y: point.y };
    case Position.Left:
      return { x: point.x - offset, y: point.y };
    case Position.Top:
      return { x: point.x, y: point.y - offset };
    case Position.Bottom:
      return { x: point.x, y: point.y + offset };
  }
}

/**
 * Generates an ultra-smooth, continuous cubic Bezier spline through an array of waypoints.
 */
function buildSmoothSplinePath(points: Point[]): [string, number, number] {
  if (points.length < 2) return ['', 0, 0];

  // Simplify nearby points
  const cleanPoints: Point[] = [points[0]];
  for (let i = 1; i < points.length; i++) {
    const prev = cleanPoints[cleanPoints.length - 1];
    const curr = points[i];
    if (Math.hypot(curr.x - prev.x, curr.y - prev.y) > 4) {
      cleanPoints.push(curr);
    }
  }

  if (cleanPoints.length === 2) {
    const [p0, p1] = cleanPoints;
    const path = `M ${p0.x} ${p0.y} L ${p1.x} ${p1.y}`;
    return [path, (p0.x + p1.x) / 2, (p0.y + p1.y) / 2];
  }

  let pathStr = `M ${cleanPoints[0].x} ${cleanPoints[0].y}`;

  // Interpolate smooth cubic beziers using Catmull-Rom to Cubic Bezier conversion
  for (let i = 0; i < cleanPoints.length - 1; i++) {
    const p0 = cleanPoints[Math.max(0, i - 1)];
    const p1 = cleanPoints[i];
    const p2 = cleanPoints[i + 1];
    const p3 = cleanPoints[Math.min(cleanPoints.length - 1, i + 2)];

    // Catmull-Rom tangent tension (0.4 for soft, organic curves)
    const tension = 0.35;

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;

    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    pathStr += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  // Label at midpoint
  const midIdx = Math.floor(cleanPoints.length / 2);
  const labelX = (cleanPoints[midIdx - 1].x + cleanPoints[midIdx].x) / 2;
  const labelY = (cleanPoints[midIdx - 1].y + cleanPoints[midIdx].y) / 2;

  return [pathStr, labelX, labelY];
}
