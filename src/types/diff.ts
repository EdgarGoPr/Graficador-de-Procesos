import { Node, Edge } from '@xyflow/react';
import { BpmnNodeData, SequenceFlowData } from './process';

export type DiffChangeType = 'ADDED' | 'REMOVED' | 'MODIFIED' | 'UNCHANGED';

export interface NodeDiffItem {
  nodeId: string;
  standardId: string;
  title: string;
  changeType: DiffChangeType;
  changes: { field: string; oldValue: string; newValue: string }[];
  node: Node<BpmnNodeData>;
}

export interface EdgeDiffItem {
  edgeId: string;
  sourceTitle: string;
  targetTitle: string;
  changeType: DiffChangeType;
}

export interface ProjectDiffResult {
  baseTitle: string;
  baseVersion: string;
  targetTitle: string;
  targetVersion: string;
  nodeDiffs: NodeDiffItem[];
  edgeDiffs: EdgeDiffItem[];
  summary: {
    addedNodesCount: number;
    removedNodesCount: number;
    modifiedNodesCount: number;
    addedEdgesCount: number;
    removedEdgesCount: number;
    hasChanges: boolean;
  };
}
