import { Node, Edge } from '@xyflow/react';
import { BpmnNodeData, SequenceFlowData, PoolDefinition } from './process';
import { PrintFrame } from './printFrame';

/**
 * ISO/IEC 11179 & ISO 9001:2015 Document Control and Project Schema
 */

export interface DocumentRevision {
  revisionDate: string; // ISO 8601 UTC timestamp: "YYYY-MM-DDTHH:mm:ssZ"
  version: string; // e.g. "v1.0", "v1.1"
  author: string;
  changeDescription: string;
}

export interface ProjectDocumentControl {
  documentTitle: string;
  documentCode: string; // e.g. "PRC-TF-2026-001"
  version: string;
  authorName: string;
  organizationUnit: string; // e.g. "Tribunal Administrativo de Faltas - Secretaría General"
  processObjective: string;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'EFFECTIVE';
  legalNormativeBasis: string[]; // Leyes, ordenanzas y decretos base
  revisionHistory: DocumentRevision[];
}

export interface ProcessProjectFile {
  schemaVersion: '1.0.0';
  documentControl: ProjectDocumentControl;
  pools: PoolDefinition[];
  nodes: Node<BpmnNodeData>[];
  edges: Edge<SequenceFlowData>[];
  printFrames?: PrintFrame[];
  fileName?: string; // e.g. "2026-09-01_proc-tribunal-faltas-v1.json"
}

export interface ProjectSummary {
  fileName: string;
  documentTitle: string;
  documentCode: string;
  version: string;
  authorName: string;
  organizationUnit: string;
  updatedAt: string;
  nodeCount: number;
  totalLeadTimeHours: number;
  totalLeadTimeBusinessDays: number;
  riskCount: number;
  checkpointCount: number;
}
