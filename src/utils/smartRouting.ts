import { Node, Position } from '@xyflow/react';

export interface Point {
  x: number;
  y: number;
}

export interface Box {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  id?: string;
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
  cornerRadius?: number;
  padding?: number;
  stubLength?: number;
}

/**
 * Calculates a clean, obstacle-avoiding orthogonal SVG path between source and target handles.
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
    cornerRadius = 10,
    padding = 22,
    stubLength = 24
  } = options;

  // 1. Build obstacle bounding boxes (exclude source, target, and container swimlanes)
  const obstacles: Box[] = [];
  for (const node of nodes) {
    if (node.id === sourceNodeId || node.id === targetNodeId) continue;
    if (node.type === 'PoolLane') continue; // Swimlanes are background containers
    if (node.hidden) continue;

    const posX = node.position?.x ?? 0;
    const posY = node.position?.y ?? 0;
    
    // Determine dimensions with fallbacks
    let w = (node.measured?.width ?? node.width) as number;
    let h = (node.measured?.height ?? node.height) as number;

    if (!w || w <= 0) {
      if (node.type === 'StartEvent' || node.type === 'EndEvent') w = 96;
      else if (node.type === 'ExclusiveGateway' || node.type === 'ParallelGateway') w = 120;
      else if (node.type === 'StickyNote') w = 200;
      else w = 240;
    }

    if (!h || h <= 0) {
      if (node.type === 'StartEvent' || node.type === 'EndEvent') h = 96;
      else if (node.type === 'ExclusiveGateway' || node.type === 'ParallelGateway') h = 120;
      else if (node.type === 'StickyNote') h = 160;
      else h = 150;
    }

    obstacles.push({
      id: node.id,
      minX: posX - padding,
      maxX: posX + w + padding,
      minY: posY - padding,
      maxY: posY + h + padding
    });
  }

  const sourcePoint: Point = { x: sourceX, y: sourceY };
  const targetPoint: Point = { x: targetX, y: targetY };

  const sourceStub = getStubPoint(sourcePoint, sourcePosition, stubLength);
  const targetStub = getStubPoint(targetPoint, targetPosition, stubLength);

  // 2. Try fast direct Manhattan routes if no obstacles collide
  const candidateFastPaths = getCandidateFastPaths(sourcePoint, sourceStub, targetStub, targetPoint, sourcePosition, targetPosition);
  for (const path of candidateFastPaths) {
    if (isPolylineCollisionFree(path, obstacles)) {
      const simplified = simplifyPolyline(path);
      return generateSvgPath(simplified, cornerRadius);
    }
  }

  // 3. If direct routes collide, execute A* Obstacle-Avoidance Channel Routing
  if (obstacles.length > 0) {
    const aStarPath = findObstacleAvoidancePath(sourcePoint, sourceStub, targetStub, targetPoint, obstacles);
    if (aStarPath && aStarPath.length >= 2) {
      const simplified = simplifyPolyline(aStarPath);
      return generateSvgPath(simplified, cornerRadius);
    }
  }

  // 4. Fallback to basic smoothstep/Z-path
  const fallbackPath = simplifyPolyline([
    sourcePoint,
    sourceStub,
    { x: (sourceStub.x + targetStub.x) / 2, y: sourceStub.y },
    { x: (sourceStub.x + targetStub.x) / 2, y: targetStub.y },
    targetStub,
    targetPoint
  ]);
  return generateSvgPath(fallbackPath, cornerRadius);
}

function getStubPoint(point: Point, position: Position, length: number): Point {
  switch (position) {
    case Position.Right:
      return { x: point.x + length, y: point.y };
    case Position.Left:
      return { x: point.x - length, y: point.y };
    case Position.Top:
      return { x: point.x, y: point.y - length };
    case Position.Bottom:
      return { x: point.x, y: point.y + length };
    default:
      return { x: point.x + length, y: point.y };
  }
}

function getCandidateFastPaths(
  src: Point,
  srcStub: Point,
  tgtStub: Point,
  tgt: Point,
  srcPos: Position,
  tgtPos: Position
): Point[][] {
  const paths: Point[][] = [];
  const midX = (srcStub.x + tgtStub.x) / 2;
  const midY = (srcStub.y + tgtStub.y) / 2;

  // Horizontal first Z-step
  paths.push([
    src,
    srcStub,
    { x: midX, y: srcStub.y },
    { x: midX, y: tgtStub.y },
    tgtStub,
    tgt
  ]);

  // Vertical first Z-step
  paths.push([
    src,
    srcStub,
    { x: srcStub.x, y: midY },
    { x: tgtStub.x, y: midY },
    tgtStub,
    tgt
  ]);

  // Direct L-shapes
  if (srcPos === Position.Right || srcPos === Position.Left) {
    paths.push([
      src,
      srcStub,
      { x: tgtStub.x, y: srcStub.y },
      tgtStub,
      tgt
    ]);
  } else {
    paths.push([
      src,
      srcStub,
      { x: srcStub.x, y: tgtStub.y },
      tgtStub,
      tgt
    ]);
  }

  return paths;
}

function isSegmentCollidingWithBox(p1: Point, p2: Point, box: Box): boolean {
  const isHorizontal = Math.abs(p1.y - p2.y) < 0.001;
  const isVertical = Math.abs(p1.x - p2.x) < 0.001;

  if (isHorizontal) {
    const y = p1.y;
    if (y <= box.minY || y >= box.maxY) return false;
    const minX = Math.min(p1.x, p2.x);
    const maxX = Math.max(p1.x, p2.x);
    return Math.max(minX, box.minX) < Math.min(maxX, box.maxX);
  }

  if (isVertical) {
    const x = p1.x;
    if (x <= box.minX || x >= box.maxX) return false;
    const minY = Math.min(p1.y, p2.y);
    const maxY = Math.max(p1.y, p2.y);
    return Math.max(minY, box.minY) < Math.min(maxY, box.maxY);
  }

  // Diagonal segment test
  const minSegX = Math.min(p1.x, p2.x);
  const maxSegX = Math.max(p1.x, p2.x);
  const minSegY = Math.min(p1.y, p2.y);
  const maxSegY = Math.max(p1.y, p2.y);

  if (maxSegX <= box.minX || minSegX >= box.maxX || maxSegY <= box.minY || minSegY >= box.maxY) {
    return false;
  }

  return true;
}

function isPolylineCollisionFree(points: Point[], obstacles: Box[]): boolean {
  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    for (const box of obstacles) {
      if (isSegmentCollidingWithBox(p1, p2, box)) {
        return false;
      }
    }
  }
  return true;
}

function isPointInsideBox(p: Point, box: Box): boolean {
  return p.x > box.minX && p.x < box.maxX && p.y > box.minY && p.y < box.maxY;
}

function findObstacleAvoidancePath(
  src: Point,
  srcStub: Point,
  tgtStub: Point,
  tgt: Point,
  obstacles: Box[]
): Point[] | null {
  // Collect unique coordinate channels
  const xSet = new Set<number>([
    src.x,
    srcStub.x,
    tgtStub.x,
    tgt.x
  ]);
  const ySet = new Set<number>([
    src.y,
    srcStub.y,
    tgtStub.y,
    tgt.y
  ]);

  let globalMinX = Math.min(src.x, tgt.x);
  let globalMaxX = Math.max(src.x, tgt.x);
  let globalMinY = Math.min(src.y, tgt.y);
  let globalMaxY = Math.max(src.y, tgt.y);

  for (const box of obstacles) {
    globalMinX = Math.min(globalMinX, box.minX);
    globalMaxX = Math.max(globalMaxX, box.maxX);
    globalMinY = Math.min(globalMinY, box.minY);
    globalMaxY = Math.max(globalMaxY, box.maxY);

    xSet.add(box.minX);
    xSet.add(box.maxX);
    xSet.add(box.minX - 30);
    xSet.add(box.maxX + 30);

    ySet.add(box.minY);
    ySet.add(box.maxY);
    ySet.add(box.minY - 30);
    ySet.add(box.maxY + 30);
  }

  // Add outer boundary channels
  xSet.add(globalMinX - 50);
  xSet.add(globalMaxX + 50);
  ySet.add(globalMinY - 50);
  ySet.add(globalMaxY + 50);

  const xCoords = Array.from(xSet).sort((a, b) => a - b);
  const yCoords = Array.from(ySet).sort((a, b) => a - b);

  // Add midpoints between adjacent obstacle channels for optimal corridor routing
  for (let i = 0; i < xCoords.length - 1; i++) {
    const mid = (xCoords[i] + xCoords[i + 1]) / 2;
    if (xCoords[i + 1] - xCoords[i] > 60) {
      xSet.add(mid);
    }
  }
  for (let i = 0; i < yCoords.length - 1; i++) {
    const mid = (yCoords[i] + yCoords[i + 1]) / 2;
    if (yCoords[i + 1] - yCoords[i] > 60) {
      ySet.add(mid);
    }
  }

  const finalX = Array.from(xSet).sort((a, b) => a - b);
  const finalY = Array.from(ySet).sort((a, b) => a - b);

  // A* search on the Cartesian channel grid
  type NodeKey = string;
  const getKey = (x: number, y: number) => `${Math.round(x)},${Math.round(y)}`;

  interface AStarNode {
    point: Point;
    key: NodeKey;
    gScore: number;
    fScore: number;
    dir: 'H' | 'V' | null;
    parent?: AStarNode;
  }

  const startKey = getKey(srcStub.x, srcStub.y);
  const targetKey = getKey(tgtStub.x, tgtStub.y);

  const openList = new Map<NodeKey, AStarNode>();
  const closedSet = new Set<NodeKey>();

  const startNode: AStarNode = {
    point: srcStub,
    key: startKey,
    gScore: 0,
    fScore: Math.abs(srcStub.x - tgtStub.x) + Math.abs(srcStub.y - tgtStub.y),
    dir: null
  };

  openList.set(startKey, startNode);

  const BEND_PENALTY = 90; // Penalize 90-degree turns to favor clean straight BPMN flows
  let iterations = 0;
  const MAX_ITERATIONS = 1200;

  while (openList.size > 0 && iterations++ < MAX_ITERATIONS) {
    // Find node with lowest fScore
    let current: AStarNode | null = null;
    for (const node of openList.values()) {
      if (!current || node.fScore < current.fScore) {
        current = node;
      }
    }

    if (!current) break;

    if (current.key === targetKey || (Math.abs(current.point.x - tgtStub.x) < 2 && Math.abs(current.point.y - tgtStub.y) < 2)) {
      // Reconstruct path
      const pathPoints: Point[] = [tgt, tgtStub];
      let currNode: AStarNode | undefined = current;
      while (currNode) {
        pathPoints.unshift(currNode.point);
        currNode = currNode.parent;
      }
      pathPoints.unshift(src);
      return pathPoints;
    }

    openList.delete(current.key);
    closedSet.add(current.key);

    const currX = current.point.x;
    const currY = current.point.y;
    const xIdx = finalX.findIndex(x => Math.abs(x - currX) < 1);
    const yIdx = finalY.findIndex(y => Math.abs(y - currY) < 1);

    const neighbors: { point: Point; dir: 'H' | 'V' }[] = [];

    // Horizontal neighbors
    if (xIdx > 0) neighbors.push({ point: { x: finalX[xIdx - 1], y: currY }, dir: 'H' });
    if (xIdx >= 0 && xIdx < finalX.length - 1) neighbors.push({ point: { x: finalX[xIdx + 1], y: currY }, dir: 'H' });

    // Vertical neighbors
    if (yIdx > 0) neighbors.push({ point: { x: currX, y: finalY[yIdx - 1] }, dir: 'V' });
    if (yIdx >= 0 && yIdx < finalY.length - 1) neighbors.push({ point: { x: currX, y: finalY[yIdx + 1] }, dir: 'V' });

    for (const { point: neighborPoint, dir: moveDir } of neighbors) {
      const neighborKey = getKey(neighborPoint.x, neighborPoint.y);
      if (closedSet.has(neighborKey)) continue;

      // Check if point is inside any obstacle
      let isInsideObstacle = false;
      for (const box of obstacles) {
        if (isPointInsideBox(neighborPoint, box)) {
          isInsideObstacle = true;
          break;
        }
      }
      if (isInsideObstacle) continue;

      // Check if segment collides with any obstacle
      let isColliding = false;
      for (const box of obstacles) {
        if (isSegmentCollidingWithBox(current.point, neighborPoint, box)) {
          isColliding = true;
          break;
        }
      }
      if (isColliding) continue;

      const dist = Math.abs(neighborPoint.x - currX) + Math.abs(neighborPoint.y - currY);
      const isTurn = current.dir !== null && current.dir !== moveDir;
      const tentativeG = current.gScore + dist + (isTurn ? BEND_PENALTY : 0);

      const existing = openList.get(neighborKey);
      if (!existing || tentativeG < existing.gScore) {
        const h = Math.abs(neighborPoint.x - tgtStub.x) + Math.abs(neighborPoint.y - tgtStub.y);
        const neighborNode: AStarNode = {
          point: neighborPoint,
          key: neighborKey,
          gScore: tentativeG,
          fScore: tentativeG + h,
          dir: moveDir,
          parent: current
        };
        openList.set(neighborKey, neighborNode);
      }
    }
  }

  return null;
}

function simplifyPolyline(points: Point[]): Point[] {
  if (points.length <= 2) return points;

  const result: Point[] = [points[0]];

  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];
    const next = points[i + 1];

    // Check if prev, curr, and next are collinear
    const isHorizontal = Math.abs(prev.y - curr.y) < 0.5 && Math.abs(curr.y - next.y) < 0.5;
    const isVertical = Math.abs(prev.x - curr.x) < 0.5 && Math.abs(curr.x - next.x) < 0.5;

    if (isHorizontal || isVertical) {
      // Skip redundant intermediate collinear point
      continue;
    }

    // Skip zero-length segments
    if (Math.abs(prev.x - curr.x) < 0.5 && Math.abs(prev.y - curr.y) < 0.5) {
      continue;
    }

    result.push(curr);
  }

  result.push(points[points.length - 1]);
  return result;
}

function generateSvgPath(points: Point[], cornerRadius: number): [string, number, number] {
  if (points.length === 0) return ['', 0, 0];
  if (points.length === 1) return [`M ${points[0].x} ${points[0].y}`, points[0].x, points[0].y];

  let pathStr = `M ${points[0].x} ${points[0].y}`;
  let longestSegmentLen = 0;
  let labelX = (points[0].x + points[1].x) / 2;
  let labelY = (points[0].y + points[1].y) / 2;

  for (let i = 0; i < points.length - 1; i++) {
    const p1 = points[i];
    const p2 = points[i + 1];
    const segLen = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    if (segLen > longestSegmentLen) {
      longestSegmentLen = segLen;
      labelX = (p1.x + p2.x) / 2;
      labelY = (p1.y + p2.y) / 2;
    }
  }

  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = points[i + 1];

    const dIn = Math.hypot(curr.x - prev.x, curr.y - prev.y);
    const dOut = Math.hypot(next.x - curr.x, next.y - curr.y);

    const r = Math.min(cornerRadius, dIn / 2, dOut / 2);

    if (r <= 1) {
      pathStr += ` L ${curr.x} ${curr.y}`;
      continue;
    }

    const vInX = (curr.x - prev.x) / dIn;
    const vInY = (curr.y - prev.y) / dIn;
    const vOutX = (next.x - curr.x) / dOut;
    const vOutY = (next.y - curr.y) / dOut;

    const startX = curr.x - vInX * r;
    const startY = curr.y - vInY * r;
    const endX = curr.x + vOutX * r;
    const endY = curr.y + vOutY * r;

    pathStr += ` L ${startX} ${startY} Q ${curr.x} ${curr.y} ${endX} ${endY}`;
  }

  const lastPoint = points[points.length - 1];
  pathStr += ` L ${lastPoint.x} ${lastPoint.y}`;

  return [pathStr, labelX, labelY];
}
