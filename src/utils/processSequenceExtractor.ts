import { Node, Edge } from '@xyflow/react';
import { BpmnNodeData, PoolDefinition, LaneDefinition, SequenceFlowData } from '../types/process';

export interface ProcessPresentationStep {
  index: number;
  stepNumber: number;
  node: Node<BpmnNodeData>;
  lane?: LaneDefinition;
  roleName: string;
  laneColor?: string;
  presentationOrder?: number;
  durationSeconds?: number;
  previousSteps: {
    id: string;
    standardId?: string;
    title: string;
    conditionText?: string;
  }[];
  nextSteps: {
    id: string;
    standardId?: string;
    title: string;
    conditionText?: string;
  }[];
  slaText?: string;
  slaHours?: number;
}

/**
 * Extracts a structured, topological sequence of steps from BPMN nodes, edges, and swimlanes.
 */
export function extractProcessSequence(
  nodes: Node<BpmnNodeData>[],
  edges: Edge<SequenceFlowData>[],
  pools: PoolDefinition[] = []
): ProcessPresentationStep[] {
  // 1. Filter out background containers and annotation nodes
  const processNodes = nodes.filter(
    (n) => n.type !== 'PoolLane' && n.type !== 'StickyNote' && !n.hidden
  );

  if (processNodes.length === 0) return [];

  const nodeMap = new Map<string, Node<BpmnNodeData>>();
  processNodes.forEach((n) => nodeMap.set(n.id, n));

  const laneMap = new Map<string, LaneDefinition>();
  pools.forEach((p) => {
    p.lanes?.forEach((l) => {
      laneMap.set(l.id, l);
    });
  });

  // Build adjacency graph
  const outgoingMap = new Map<string, { targetId: string; edge: Edge<SequenceFlowData> }[]>();
  const incomingMap = new Map<string, { sourceId: string; edge: Edge<SequenceFlowData> }[]>();

  processNodes.forEach((n) => {
    outgoingMap.set(n.id, []);
    incomingMap.set(n.id, []);
  });

  edges.forEach((e) => {
    if (outgoingMap.has(e.source) && nodeMap.has(e.target)) {
      outgoingMap.get(e.source)!.push({ targetId: e.target, edge: e });
    }
    if (incomingMap.has(e.target) && nodeMap.has(e.source)) {
      incomingMap.get(e.target)!.push({ sourceId: e.source, edge: e });
    }
  });

  // 2. Find starting points (Start Events or nodes without incoming edges)
  const startNodes = processNodes.filter(
    (n) => n.type === 'StartEvent' || (incomingMap.get(n.id)?.length === 0)
  );

  // If no clear start node, pick the leftmost node
  if (startNodes.length === 0) {
    const leftmost = [...processNodes].sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0))[0];
    startNodes.push(leftmost);
  } else {
    // Sort start nodes geometrically (top to bottom, left to right)
    startNodes.sort((a, b) => {
      const diffX = (a.position?.x ?? 0) - (b.position?.x ?? 0);
      if (Math.abs(diffX) > 50) return diffX;
      return (a.position?.y ?? 0) - (b.position?.y ?? 0);
    });
  }

  // 3. Breadth-First / Topological Traversal
  const orderedNodes: Node<BpmnNodeData>[] = [];
  const visited = new Set<string>();
  const queue: string[] = [];

  startNodes.forEach((sn) => {
    if (!visited.has(sn.id)) {
      visited.add(sn.id);
      queue.push(sn.id);
    }
  });

  while (queue.length > 0) {
    const currId = queue.shift()!;
    const currNode = nodeMap.get(currId);
    if (!currNode) continue;

    orderedNodes.push(currNode);

    // Fetch outgoing connections
    const outEdges = outgoingMap.get(currId) || [];

    // Sort outgoing branches (e.g. by target position X coordinate)
    outEdges.sort((a, b) => {
      const nodeA = nodeMap.get(a.targetId);
      const nodeB = nodeMap.get(b.targetId);
      return (nodeA?.position?.x ?? 0) - (nodeB?.position?.x ?? 0);
    });

    for (const out of outEdges) {
      if (!visited.has(out.targetId)) {
        visited.add(out.targetId);
        queue.push(out.targetId);
      }
    }
  }

  // 4. Append any remaining unvisited nodes (orphans or isolated branches) sorted by X
  const unvisitedNodes = processNodes
    .filter((n) => !visited.has(n.id))
    .sort((a, b) => (a.position?.x ?? 0) - (b.position?.x ?? 0));

  unvisitedNodes.forEach((un) => orderedNodes.push(un));

  // 5. If manual presentation orders exist, prioritize them while preserving stable fallback
  const hasManualOrder = processNodes.some((n) => typeof n.data?.presentationOrder === 'number');
  if (hasManualOrder) {
    orderedNodes.sort((a, b) => {
      const orderA = typeof a.data?.presentationOrder === 'number' ? a.data.presentationOrder : 9999;
      const orderB = typeof b.data?.presentationOrder === 'number' ? b.data.presentationOrder : 9999;
      if (orderA !== orderB) return orderA - orderB;
      return (a.position?.x ?? 0) - (b.position?.x ?? 0);
    });
  }

  // 6. Map into rich presentation step metadata
  return orderedNodes.map((node, idx) => {
    const data = node.data;
    const lane = data.laneId ? laneMap.get(data.laneId) : undefined;
    const roleName = lane?.name || lane?.role || data.laneId || 'Sin Asignar';
    const laneColor = lane?.colorHex || '#3B82F6';

    const inc = incomingMap.get(node.id) || [];
    const previousSteps = inc.map(({ sourceId, edge }) => {
      const srcNode = nodeMap.get(sourceId);
      return {
        id: sourceId,
        standardId: srcNode?.data.standardId,
        title: srcNode?.data.title || 'Paso Anterior',
        conditionText: edge.data?.conditionText
      };
    });

    const out = outgoingMap.get(node.id) || [];
    const nextSteps = out.map(({ targetId, edge }) => {
      const tgtNode = nodeMap.get(targetId);
      return {
        id: targetId,
        standardId: tgtNode?.data.standardId,
        title: tgtNode?.data.title || 'Paso Siguiente',
        conditionText: edge.data?.conditionText
      };
    });

    let slaText: string | undefined;
    let slaHours: number | undefined;

    if (data.slaDuration?.value) {
      const val = data.slaDuration.value;
      const unit = data.slaDuration.unit === 'BUSINESS_DAYS' ? 'días hábiles' : data.slaDuration.unit === 'CALENDAR_DAYS' ? 'días corridos' : 'horas';
      slaText = `${val} ${unit}`;

      if (data.slaDuration.unit === 'BUSINESS_DAYS') slaHours = val * 8;
      else if (data.slaDuration.unit === 'CALENDAR_DAYS') slaHours = val * 24;
      else slaHours = val;
    }

    const durationSeconds = typeof data.presentationDurationSeconds === 'number' && data.presentationDurationSeconds > 0
      ? data.presentationDurationSeconds
      : undefined;

    return {
      index: idx,
      stepNumber: idx + 1,
      node,
      lane,
      roleName,
      laneColor,
      presentationOrder: data.presentationOrder,
      durationSeconds,
      previousSteps,
      nextSteps,
      slaText,
      slaHours
    };
  });
}
