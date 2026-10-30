import { Node, Edge } from '@xyflow/react';
import { BpmnNodeData, SequenceFlowData, PoolDefinition } from './process';
import { PrintFrame } from './printFrame';
import { ProcessDocumentationVault } from './ai';

/**
 * ISO/IEC 11179 & ISO 9001:2015 Document Control and Project Schema
 */

export interface DocumentRevision {
  revisionDate: string; // ISO 8601 UTC timestamp: "YYYY-MM-DDTHH:mm:ssZ"
  version: string; // e.g. "v1.0", "v1.1"
  author: string;
  changeDescription: string;
}

export interface ProcessKpiDefinition {
  id: string;
  name: string;
  formula: string;
  target: string;
  frequency: string;
  responsible: string;
}

export interface ProcessGlossaryTerm {
  id: string;
  term: string;
  definition: string;
}

export interface ProcessManualMetadata {
  detailedScope?: string; // Alcance detallado: inicio y fin operativo
  operationalPolicies?: string[]; // Políticas y reglas de negocio del procedimiento
  glossary?: ProcessGlossaryTerm[]; // Glosario de términos y siglas
  kpis?: ProcessKpiDefinition[]; // Indicadores clave de desempeño (KPIs)
  associatedRecords?: string[]; // Formularios, registros y anexos vinculados
  preparedByRole?: string; // Cargo de quien elaboró
  reviewedByName?: string; // Nombre de quien revisó
  reviewedByRole?: string; // Cargo de quien revisó
  approvedByName?: string; // Nombre de quien aprobó
  approvedByRole?: string; // Cargo de quien aprobó
  effectiveDate?: string; // Fecha de entrada en vigencia
  additionalObservations?: string; // Notas o consideraciones adicionales para el PDF
}

export interface ProjectDocumentControl {
  documentTitle: string;
  documentCode: string; // e.g. "PRC-TF-2026-001"
  version: string;
  authorName: string;
  createdByEmail?: string;
  createdByUserId?: string;
  organizationUnit: string; // e.g. "Tribunal Administrativo de Faltas - Secretaría General"
  processObjective: string;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string; // ISO 8601 UTC
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'EFFECTIVE';
  legalNormativeBasis: string[]; // Leyes, ordenanzas y decretos base
  revisionHistory: DocumentRevision[];
  manualMetadata?: ProcessManualMetadata;
}

export interface ProcessProjectFile {
  schemaVersion: '1.0.0';
  documentControl: ProjectDocumentControl;
  pools: PoolDefinition[];
  nodes: Node<BpmnNodeData>[];
  edges: Edge<SequenceFlowData>[];
  printFrames?: PrintFrame[];
  documentationVault?: ProcessDocumentationVault;
  fileName?: string; // e.g. "2026-09-01_proc-tribunal-faltas-v1.json"
}

export interface ProjectSummary {
  fileName: string;
  documentTitle: string;
  documentCode: string;
  version: string;
  authorName: string;
  createdByEmail?: string;
  createdByUserId?: string;
  organizationUnit: string;
  updatedAt: string;
  nodeCount: number;
  totalLeadTimeHours: number;
  totalLeadTimeBusinessDays: number;
  riskCount: number;
  checkpointCount: number;
}

export interface ProcessGroupSummary {
  groupKey: string;
  documentTitle: string;
  documentCode: string;
  organizationUnit: string;
  authorName: string;
  createdByEmail?: string;
  createdByUserId?: string;
  latestVersion: ProjectSummary;
  versions: ProjectSummary[];
  versionCount: number;
}
