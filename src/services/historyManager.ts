import { Node, Edge } from '@xyflow/react';
import { BpmnNodeData, SequenceFlowData, PoolDefinition } from '../types/process';

export interface CanvasSnapshot {
  nodes: Node<BpmnNodeData>[];
  edges: Edge<SequenceFlowData>[];
  pools: PoolDefinition[];
  description?: string;
  timestamp: number;
}

const MAX_HISTORY_LENGTH = 50;

/**
 * Deep clones nodes, edges, and pools to create an immutable snapshot
 */
export function createSnapshot(
  nodes: Node<BpmnNodeData>[],
  edges: Edge<SequenceFlowData>[],
  pools: PoolDefinition[],
  description?: string
): CanvasSnapshot {
  return {
    nodes: JSON.parse(JSON.stringify(nodes)),
    edges: JSON.parse(JSON.stringify(edges)),
    pools: JSON.parse(JSON.stringify(pools)),
    description: description || 'Modificación del proceso',
    timestamp: Date.now()
  };
}

/**
 * Pushes a new snapshot onto the past history stack, enforcing max limit
 */
export function pushToHistory(
  history: CanvasSnapshot[],
  snapshot: CanvasSnapshot
): CanvasSnapshot[] {
  const next = [...history, snapshot];
  if (next.length > MAX_HISTORY_LENGTH) {
    return next.slice(next.length - MAX_HISTORY_LENGTH);
  }
  return next;
}
