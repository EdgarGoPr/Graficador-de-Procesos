import { Node, Edge, MarkerType } from '@xyflow/react';
import { BpmnNodeData, SequenceFlowData } from '../types/process';

export interface FlowchartLayoutResult {
  nodes: Node<BpmnNodeData>[];
  edges: Edge<SequenceFlowData>[];
  totalWidth: number;
  totalHeight: number;
  layerCount: number;
}

const NODE_WIDTH = 260;
const NODE_HEIGHT = 70;
const HORIZONTAL_GAP = 80;
const VERTICAL_GAP = 140;

/**
 * Computes a deterministic Top-to-Bottom Layered DAG Auto-Layout for Flowcharts
 */
export function computeFlowchartLayout(
  rawNodes: Node<BpmnNodeData>[],
  rawEdges: Edge<SequenceFlowData>[]
): FlowchartLayoutResult {
  // 1. Filter out swimlanes, focus on functional activities and events
  const processNodes = rawNodes.filter((n) => n.type !== 'PoolLane');
  const validNodeIds = new Set(processNodes.map((n) => n.id));
  const processEdges = rawEdges.filter(
    (e) => validNodeIds.has(e.source) && validNodeIds.has(e.target)
  );

  if (processNodes.length === 0) {
    return { nodes: [], edges: [], totalWidth: 0, totalHeight: 0, layerCount: 0 };
  }

  // 2. Build Adjacency and In-Degree maps
  const adj = new Map<string, string[]>();
  const inDegree = new Map<string, number>();
  const reverseAdj = new Map<string, string[]>();

  processNodes.forEach((n) => {
    adj.set(n.id, []);
    inDegree.set(n.id, 0);
    reverseAdj.set(n.id, []);
  });

  processEdges.forEach((e) => {
    adj.get(e.source)?.push(e.target);
    reverseAdj.get(e.target)?.push(e.source);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  });

  // 3. Layer / Rank Assignment (Longest Path with cycle breaker)
  const nodeRank = new Map<string, number>();
  const queue: { id: string; rank: number }[] = [];

  // Start with root nodes (inDegree === 0 or StartEvent)
  processNodes.forEach((n) => {
    if ((inDegree.get(n.id) || 0) === 0 || n.type === 'StartEvent') {
      nodeRank.set(n.id, 0);
      queue.push({ id: n.id, rank: 0 });
    }
  });

  // Fallback if graph is entirely cyclic
  if (queue.length === 0 && processNodes.length > 0) {
    const firstNode = processNodes[0];
    nodeRank.set(firstNode.id, 0);
    queue.push({ id: firstNode.id, rank: 0 });
  }

  const visitedCount = new Map<string, number>();
  const MAX_VISITS = processNodes.length + 5;

  while (queue.length > 0) {
    const { id, rank } = queue.shift()!;
    const visits = (visitedCount.get(id) || 0) + 1;
    visitedCount.set(id, visits);
    if (visits > MAX_VISITS) continue; // Cycle guard

    const currentRank = nodeRank.get(id) ?? rank;
    const neighbors = adj.get(id) || [];

    for (const neighbor of neighbors) {
      const existingRank = nodeRank.get(neighbor) ?? -1;
      const newRank = currentRank + 1;
      if (newRank > existingRank) {
        nodeRank.set(neighbor, newRank);
        queue.push({ id: neighbor, rank: newRank });
      }
    }
  }

  // Ensure all nodes have a rank
  processNodes.forEach((n) => {
    if (!nodeRank.has(n.id)) {
      nodeRank.set(n.id, 0);
    }
  });

  // 4. Group nodes into horizontal layers
  const layersMap = new Map<number, string[]>();
  nodeRank.forEach((rank, id) => {
    if (!layersMap.has(rank)) {
      layersMap.set(rank, []);
    }
    layersMap.get(rank)!.push(id);
  });

  const sortedRanks = Array.from(layersMap.keys()).sort((a, b) => a - b);
  const layerCount = sortedRanks.length;

  // Find max layer width to center entire diagram
  let maxNodesInLayer = 1;
  sortedRanks.forEach((r) => {
    const count = layersMap.get(r)!.length;
    if (count > maxNodesInLayer) maxNodesInLayer = count;
  });

  const totalWidth = Math.max(800, maxNodesInLayer * (NODE_WIDTH + HORIZONTAL_GAP) + 100);
  const totalHeight = layerCount * (NODE_HEIGHT + VERTICAL_GAP) + 150;
  const centerX = totalWidth / 2;

  // 5. Position nodes deterministically
  const positionedNodes: Node<BpmnNodeData>[] = [];

  sortedRanks.forEach((rank, layerIndex) => {
    const nodeIds = layersMap.get(rank)!;
    const count = nodeIds.length;
    const layerSpan = count * NODE_WIDTH + (count - 1) * HORIZONTAL_GAP;
    const startX = centerX - layerSpan / 2;
    const currentY = 60 + layerIndex * (NODE_HEIGHT + VERTICAL_GAP);

    nodeIds.forEach((id, idx) => {
      const origNode = processNodes.find((n) => n.id === id)!;
      const currentX = startX + idx * (NODE_WIDTH + HORIZONTAL_GAP);

      positionedNodes.push({
        ...origNode,
        type: 'flowchartNode',
        position: { x: currentX, y: currentY },
        style: {
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
        },
        draggable: false,
        selectable: true,
        data: {
          ...origNode.data,
          originalType: origNode.type,
        }
      });
    });
  });

  // 6. Format smoothstep edges from bottom handle to top handle
  const formattedEdges: Edge<SequenceFlowData>[] = processEdges.map((e) => {
    const srcNode = positionedNodes.find((n) => n.id === e.source);
    const tgtNode = positionedNodes.find((n) => n.id === e.target);
    const hasCondition = !!e.data?.conditionText;

    // Detect if this is a backward loop (target is above source)
    const isBackEdge = (tgtNode?.position.y || 0) <= (srcNode?.position.y || 0);

    return {
      ...e,
      id: `fc_edge_${e.id}`,
      type: 'smoothstep',
      sourceHandle: 'bottom',
      targetHandle: 'top',
      animated: hasCondition || isBackEdge,
      style: {
        stroke: isBackEdge ? '#F59E0B' : '#38BDF8',
        strokeWidth: 2,
        strokeDasharray: isBackEdge ? '5,5' : undefined,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isBackEdge ? '#F59E0B' : '#38BDF8',
        width: 16,
        height: 16,
      },
      label: e.data?.conditionText || undefined,
      labelStyle: {
        fill: isBackEdge ? '#F59E0B' : '#38BDF8',
        fontWeight: 700,
        fontSize: 11,
      },
      labelBgStyle: {
        fill: '#0F172A',
        fillOpacity: 0.92,
        rx: 6,
        ry: 6,
      },
      labelBgPadding: [6, 4] as [number, number],
    };
  });

  return {
    nodes: positionedNodes,
    edges: formattedEdges,
    totalWidth,
    totalHeight,
    layerCount,
  };
}
