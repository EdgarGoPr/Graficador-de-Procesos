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
  controlPoints?: Point[];
  controlPointsCount?: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getNodeBox(node: Node<any>, padding: number = 0): Box {
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

  return {
    id: node.id,
    minX: posX - padding,
    maxX: posX + w + padding,
    minY: posY - padding,
    maxY: posY + h + padding,
  };
}

/**
 * Checks if a connection is backward / retrograde
 * (e.g. target is before source in the workflow direction).
 */
export function isBackwardConnection(
  sourceX: number,
  sourceY: number,
  sourcePosition: Position,
  targetX: number,
  targetY: number,
  targetPosition: Position,
  isSelfLoop?: boolean
): boolean {
  if (isSelfLoop) return true;
  const isSourceHorizontal = sourcePosition === Position.Left || sourcePosition === Position.Right;
  const isTargetHorizontal = targetPosition === Position.Left || targetPosition === Position.Right;

  if (isSourceHorizontal && isTargetHorizontal) {
    if (sourcePosition === Position.Right && targetPosition === Position.Left) {
      return targetX <= sourceX + 40;
    }
    return targetX < sourceX;
  } else if (!isSourceHorizontal && !isTargetHorizontal) {
    if (sourcePosition === Position.Bottom && targetPosition === Position.Top) {
      return targetY <= sourceY + 40;
    }
    return targetY < sourceY;
  }
  return false;
}

/**
 * Calculates a smooth C1-continuous curve governed by a single manual control point.
 */
export function getControlledEdgePath(
  sourceX: number,
  sourceY: number,
  sourcePosition: Position = Position.Right,
  targetX: number,
  targetY: number,
  targetPosition: Position = Position.Left,
  cp: Point,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodes?: Node<any>[]
): [pathString: string, labelX: number, labelY: number] {
  const sx = sourceX;
  const sy = sourceY;
  const tx = targetX;
  const ty = targetY;
  const cx = cp.x;
  const cy = cp.y;

  const isSourceHorizontal = sourcePosition === Position.Left || sourcePosition === Position.Right;
  const isTargetHorizontal = targetPosition === Position.Left || targetPosition === Position.Right;
  const backward = isBackwardConnection(sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition);

  if (backward) {
    if (isSourceHorizontal && isTargetHorizontal) {
      // In a horizontal backward connection (e.g. from right of card to left of card):
      // The curve exits source to the right (+x), loops around through cp (traveling -x, westwards),
      // and enters target from the left (+x).
      let allMaxX = sx;
      let allMinX = tx;
      if (nodes && nodes.length > 0) {
        for (const n of nodes) {
          if (!n || n.hidden || n.type === 'PoolLane') continue;
          const b = getNodeBox(n, 10);
          if (b.maxX >= Math.min(tx, sx) - 20 && b.minX <= Math.max(tx, sx) + 20) {
            allMaxX = Math.max(allMaxX, b.maxX);
            allMinX = Math.min(allMinX, b.minX);
          }
        }
      }

      const rightStubX = Math.max(allMaxX + 35, sx + 45, cx + 35);
      const leftStubX = Math.min(allMinX - 35, tx - 45, cx - 35);

      const cp1x = rightStubX;
      const cp1y = sy;
      const cp2x = rightStubX;
      const cp2y = cy;

      const cp3x = leftStubX;
      const cp3y = cy;
      const cp4x = leftStubX;
      const cp4y = ty;

      const path = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${cx} ${cy} C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${tx} ${ty}`;
      return [path, cx, cy];
    } else {
      // In a vertical backward connection (e.g. from bottom to top):
      let allMaxY = sy;
      let allMinY = ty;
      if (nodes && nodes.length > 0) {
        for (const n of nodes) {
          if (!n || n.hidden || n.type === 'PoolLane') continue;
          const b = getNodeBox(n, 10);
          if (b.maxY >= Math.min(ty, sy) - 20 && b.minY <= Math.max(ty, sy) + 20) {
            allMaxY = Math.max(allMaxY, b.maxY);
            allMinY = Math.min(allMinY, b.minY);
          }
        }
      }

      const bottomStubY = Math.max(allMaxY + 35, sy + 45, cy + 35);
      const topStubY = Math.min(allMinY - 35, ty - 45, cy - 35);

      const cp1x = sx;
      const cp1y = bottomStubY;
      const cp2x = cx;
      const cp2y = bottomStubY;

      const cp3x = cx;
      const cp3y = topStubY;
      const cp4x = tx;
      const cp4y = topStubY;

      const path = `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${cx} ${cy} C ${cp3x} ${cp3y}, ${cp4x} ${cp4y}, ${tx} ${ty}`;
      return [path, cx, cy];
    }
  }

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
 * Calculates a smooth C1-continuous multi-point cubic Bezier spline
 * that passes exactly through 1 to 4 manual control points.
 */
export function getMultiControlledEdgePath(
  sourceX: number,
  sourceY: number,
  sourcePosition: Position = Position.Right,
  targetX: number,
  targetY: number,
  targetPosition: Position = Position.Left,
  points: Point[]
): [pathString: string, labelX: number, labelY: number] {
  if (!points || points.length === 0) {
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

  if (points.length === 1) {
    return getControlledEdgePath(
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      points[0]
    );
  }

  const allPoints: Point[] = [
    { x: sourceX, y: sourceY },
    ...points,
    { x: targetX, y: targetY },
  ];

  const n = allPoints.length;
  let path = `M ${Math.round(allPoints[0].x)} ${Math.round(allPoints[0].y)}`;

  const getDirectionVector = (pos: Position): { dx: number; dy: number } => {
    switch (pos) {
      case Position.Right: return { dx: 1, dy: 0 };
      case Position.Left: return { dx: -1, dy: 0 };
      case Position.Bottom: return { dx: 0, dy: 1 };
      case Position.Top: return { dx: 0, dy: -1 };
      default: return { dx: 1, dy: 0 };
    }
  };

  const srcDir = getDirectionVector(sourcePosition);
  const tgtDir = getDirectionVector(targetPosition);

  // Compute tangent vectors at each knot
  const tangents: Array<{ dx: number; dy: number }> = [];

  // P0 tangent exits along sourcePosition
  tangents.push(srcDir);

  // Intermediate points P1..P_{n-2}
  for (let i = 1; i < n - 1; i++) {
    const prev = allPoints[i - 1];
    const next = allPoints[i + 1];
    const vx = next.x - prev.x;
    const vy = next.y - prev.y;
    const len = Math.hypot(vx, vy);
    if (len > 0.0001) {
      tangents.push({ dx: vx / len, dy: vy / len });
    } else {
      tangents.push({ dx: 1, dy: 0 });
    }
  }

  // P_{n-1} enters along targetPosition inward
  tangents.push({ dx: -tgtDir.dx, dy: -tgtDir.dy });

  // Build cubic Bezier segments
  for (let i = 0; i < n - 1; i++) {
    const pStart = allPoints[i];
    const pEnd = allPoints[i + 1];
    const dist = Math.hypot(pEnd.x - pStart.x, pEnd.y - pStart.y);

    const kStart = Math.min(Math.max(dist * 0.35, 15), 140);
    const kEnd = Math.min(Math.max(dist * 0.35, 15), 140);

    const cp1x = pStart.x + tangents[i].dx * kStart;
    const cp1y = pStart.y + tangents[i].dy * kStart;

    const cp2x = pEnd.x - tangents[i + 1].dx * kEnd;
    const cp2y = pEnd.y - tangents[i + 1].dy * kEnd;

    path += ` C ${Math.round(cp1x)} ${Math.round(cp1y)}, ${Math.round(cp2x)} ${Math.round(cp2y)}, ${pEnd.x} ${pEnd.y}`;
  }

  // Center label on middle control point
  const midIndex = Math.floor(points.length / 2);
  const labelX = points[midIndex].x;
  const labelY = points[midIndex].y;

  return [path, labelX, labelY];
}



/**
 * Calculates a clean bypass route that completely surrounds (rodea)
 * the source card, target card, and any cards in between when connecting backward.
 */
export function calculateBackwardLoopBypass(
  src: Point,
  srcPos: Position,
  tgt: Point,
  tgtPos: Position,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  nodes: Node<any>[] = [],
  sourceNodeId?: string,
  targetNodeId?: string
): [string, number, number] {
  const sourceNode = nodes.find((n) => n.id === sourceNodeId);
  const targetNode = nodes.find((n) => n.id === targetNodeId);

  const relevantBoxes: Box[] = [];

  if (sourceNode) {
    relevantBoxes.push(getNodeBox(sourceNode, 10));
  } else {
    relevantBoxes.push({
      id: 'src-default',
      minX: Math.min(src.x - 220, src.x),
      maxX: Math.max(src.x + 20, src.x),
      minY: src.y - 70,
      maxY: src.y + 70,
    });
  }

  if (targetNode) {
    relevantBoxes.push(getNodeBox(targetNode, 10));
  } else {
    relevantBoxes.push({
      id: 'tgt-default',
      minX: Math.min(tgt.x - 20, tgt.x),
      maxX: Math.max(tgt.x + 220, tgt.x),
      minY: tgt.y - 70,
      maxY: tgt.y + 70,
    });
  }

  const minCardX = Math.min(...relevantBoxes.map((b) => b.minX));
  const maxCardX = Math.max(...relevantBoxes.map((b) => b.maxX));

  // Find intermediate nodes that sit in the horizontal span
  for (const node of nodes) {
    if (!node || node.hidden || node.type === 'PoolLane') continue;
    if (node.id === sourceNodeId || node.id === targetNodeId) continue;

    const b = getNodeBox(node, 10);
    if (b.maxX >= minCardX - 20 && b.minX <= maxCardX + 20) {
      relevantBoxes.push(b);
    }
  }

  const allMinX = Math.min(...relevantBoxes.map((b) => b.minX));
  const allMaxX = Math.max(...relevantBoxes.map((b) => b.maxX));
  const allMinY = Math.min(...relevantBoxes.map((b) => b.minY));
  const allMaxY = Math.max(...relevantBoxes.map((b) => b.maxY));

  const isVertical =
    (srcPos === Position.Top || srcPos === Position.Bottom) &&
    (tgtPos === Position.Top || tgtPos === Position.Bottom);

  if (isVertical) {
    const detourX = allMaxX + 50;
    const bottomStubY = Math.max(src.y + 40, allMaxY + 35);
    const topStubY = Math.min(tgt.y - 40, allMinY - 35);

    const path = `M ${src.x} ${src.y} C ${src.x} ${bottomStubY}, ${detourX} ${bottomStubY}, ${detourX} ${(bottomStubY + topStubY) / 2} C ${detourX} ${topStubY}, ${tgt.x} ${topStubY}, ${tgt.x} ${tgt.y}`;
    const lx = detourX;
    const ly = (bottomStubY + topStubY) / 2;
    return [path, lx, ly];
  }

  // Horizontal backward loop (e.g. from Right of B to Left of A, where A is before B)
  let routeAbove = true;
  if (srcPos === Position.Bottom || tgtPos === Position.Bottom) {
    routeAbove = false;
  } else if (srcPos === Position.Top || tgtPos === Position.Top) {
    routeAbove = true;
  } else {
    // If there is enough room above, route above. Otherwise route below.
    routeAbove = allMinY - 45 >= 30;
  }

  const detourY = routeAbove ? allMinY - 45 : allMaxY + 45;

  const rightStubX = Math.max(src.x + 45, allMaxX + 35);
  const leftStubX = Math.min(tgt.x - 45, allMinX - 35);
  const midX = (rightStubX + leftStubX) / 2;

  const path = `M ${src.x} ${src.y} C ${rightStubX} ${src.y}, ${rightStubX} ${detourY}, ${midX} ${detourY} C ${leftStubX} ${detourY}, ${leftStubX} ${tgt.y}, ${tgt.x} ${tgt.y}`;
  const lx = midX;
  const ly = detourY;

  return [path, lx, ly];
}

/**
 * Calculates a clean, natural Bezier connection that preserves the original aesthetic,
 * automatically bypasses cards on backward/loop connections,
 * and respects up to 4 manual control points when defined.
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
    controlPoint,
    controlPoints
  } = options;

  // 0. If manual control points are specified (1 to 4 points), use multi-controlled spline immediately
  const manualPoints = controlPoints && controlPoints.length > 0
    ? controlPoints
    : controlPoint
    ? [controlPoint]
    : [];

  if (manualPoints.length > 0) {
    if (manualPoints.length === 1) {
      return getControlledEdgePath(
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        manualPoints[0],
        nodes
      );
    }
    return getMultiControlledEdgePath(
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      manualPoints
    );
  }

  // 1. If this is a backward connection (connecting to a card before it), automatically route around cards
  if (isBackwardConnection(sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition)) {
    return calculateBackwardLoopBypass(
      { x: sourceX, y: sourceY },
      sourcePosition,
      { x: targetX, y: targetY },
      targetPosition,
      nodes,
      sourceNodeId,
      targetNodeId
    );
  }

  // 2. Collect third-party obstacles (strictly excluding source, target, and swimlanes)
  const obstacles: Box[] = [];

  for (const node of nodes) {
    if (!node || node.id === sourceNodeId || node.id === targetNodeId) continue;
    if (node.type === 'PoolLane' || node.hidden) continue;

    obstacles.push(getNodeBox(node, padding));
  }

  // 3. If there are no intermediate obstacles on the canvas, return native Bezier curve immediately
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

  // 4. Compute Bezier control points and test for collisions with third-party obstacles
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

  // 5. A third-party obstacle is genuinely blocking the trajectory -> compute clean smooth bypass
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
 * Computes a clean, elegant smooth bypass around forward colliding obstacles.
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

  for (const b of collidingObs) {
    if (b.minY < minObsY) minObsY = b.minY;
    if (b.maxY > maxObsY) maxObsY = b.maxY;
  }

  const midY = (src.y + tgt.y) / 2;
  const distToTop = Math.abs(midY - (minObsY - 30));
  const distToBottom = Math.abs(midY - (maxObsY + 30));

  const routeAbove = (srcPos === Position.Top || tgtPos === Position.Top || distToTop <= distToBottom) && (srcPos !== Position.Bottom && tgtPos !== Position.Bottom);
  const detourY = routeAbove ? minObsY - 30 : maxObsY + 30;

  const midX = (src.x + tgt.x) / 2;
  const c1x = srcPos === Position.Right ? src.x + 35 : (srcPos === Position.Left ? src.x - 35 : src.x);
  const c1y = srcPos === Position.Bottom ? src.y + 35 : (srcPos === Position.Top ? src.y - 35 : src.y);

  const c2x = tgtPos === Position.Left ? tgt.x - 35 : (tgtPos === Position.Right ? tgt.x + 35 : tgt.x);
  const c2y = tgtPos === Position.Top ? tgt.y - 35 : (tgtPos === Position.Bottom ? tgt.y + 35 : tgt.y);

  const path = `M ${src.x} ${src.y} C ${c1x} ${c1y}, ${midX} ${detourY}, ${midX} ${detourY} C ${midX} ${detourY}, ${c2x} ${c2y}, ${tgt.x} ${tgt.y}`;
  const lx = midX;
  const ly = detourY;

  return [path, lx, ly];
}
