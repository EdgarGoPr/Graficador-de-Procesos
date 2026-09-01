/**
 * ISO 9001:2015 Quality Management, SIPOC Matrix & Operational Risk Types
 */

export interface SipocEntry {
  id: string;
  nodeId: string;
  standardId: string;
  laneName: string;
  supplier: string;       // S: Proveedor
  input: string;          // I: Insumo / Entrada requerida
  processStage: string;   // P: Proceso / Actividad (Título de la tarea)
  output: string;         // O: Salida / Entregable formal
  customer: string;       // C: Cliente / Destinatario final
  qualityCheckpointCode?: string;
  itSystem: string;
  legalBasis: string;
}

export interface RiskControlRow {
  nodeStandardId: string;
  nodeTitle: string;
  laneName: string;
  riskId: string;
  riskDescription: string;
  probability: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  mitigatingControl: string;
  controlType: 'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE';
  itSystem: string;
}

export interface TechnicalReportSummary {
  projectTitle: string;
  documentCode: string;
  version: string;
  author: string;
  organizationUnit: string;
  timestampUtc: string;
  objective: string;
  normativeFramework: string[];
  totalDirectCycleTimeHours: number;
  totalDirectCycleTimeDays: number;
  maxLegalPrescriptionDays: number;
  sipocEntries: SipocEntry[];
  chronologicalSteps: ChronologicalStep[];
  riskMatrix: RiskControlRow[];
  decisionGateways: DecisionGatewayReport[];
  systemsAndRoles: SystemRoleMapping[];
}

export interface ChronologicalStep {
  stepNumber: number;
  standardId: string;
  nodeType: string;
  title: string;
  role: string;
  lane: string;
  itSystem: string;
  sla: string;
  isPeremptory: boolean;
  precedingConditions: string;
  deliverables: string;
  legalArticle: string;
  qualityCheck?: string;
}

export interface DecisionGatewayReport {
  standardId: string;
  gatewayTitle: string;
  gatewayType: string;
  evaluatingRole: string;
  resolutionOptions: Array<{
    targetStep: string;
    condition: string;
    outcomeType: string;
  }>;
}

export interface SystemRoleMapping {
  laneName: string;
  role: string;
  itSystems: string[];
  assignedTaskCount: number;
}
