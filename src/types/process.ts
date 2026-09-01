/**
 * ISO/IEC 19510 (BPMN 2.0) & ISO/IEC 11179 Strict Process Taxonomy & Model
 */

export const BPMN_NODE_TYPES = {
  START_EVENT: 'StartEvent',
  END_EVENT: 'EndEvent',
  USER_TASK: 'UserTask',
  SERVICE_TASK: 'ServiceTask',
  MANUAL_TASK: 'ManualTask',
  EXCLUSIVE_GATEWAY: 'ExclusiveGateway',
  PARALLEL_GATEWAY: 'ParallelGateway',
  QUALITY_CHECKPOINT_EVENT: 'QualityCheckpointEvent',
  TIMER_BOUNDARY_EVENT: 'TimerBoundaryEvent',
  SUB_PROCESS: 'SubProcess',
  POOL_LANE: 'PoolLane',
} as const;

export type BpmnNodeType = typeof BPMN_NODE_TYPES[keyof typeof BPMN_NODE_TYPES];

export const TIME_UNIT_TYPES = {
  HOURS: 'HOURS',
  BUSINESS_DAYS: 'BUSINESS_DAYS',
  CALENDAR_DAYS: 'CALENDAR_DAYS',
} as const;

export type TimeUnitType = typeof TIME_UNIT_TYPES[keyof typeof TIME_UNIT_TYPES];

export const GATEWAY_RESOLUTION_TYPES = {
  VOLUNTARY_PAYMENT: 'VOLUNTARY_PAYMENT',
  SENTENCE_FINE: 'SENTENCE_FINE',
  PROBATION: 'PROBATION',
  DISMISSAL_ARCHIVE: 'DISMISSAL_ARCHIVE',
  CUSTOM: 'CUSTOM',
} as const;

export type GatewayResolutionType = typeof GATEWAY_RESOLUTION_TYPES[keyof typeof GATEWAY_RESOLUTION_TYPES];

export interface IsoDuration {
  value: number;
  unit: TimeUnitType;
  iso8601String: string; // e.g. "P5D", "PT48H"
  isPeremptory: boolean; // Plazo perentorio / fatal legal
}

export interface LaneDefinition {
  id: string;
  name: string;
  role: string;
  system: string;
  colorHex: string;
  order: number;
}

export interface PoolDefinition {
  id: string;
  name: string;
  organization: string;
  lanes: LaneDefinition[];
}

export interface QualityCheckpointConfig {
  checkpointCode: string; // e.g. "QC-01"
  inspectionCriteria: string; // Criterio formal de inspección
  severity: 'CRITICAL' | 'MAJOR' | 'MINOR';
  sampleRatePercentage: number; // e.g. 100% o por muestreo
  responsibleRole: string;
  evidenceRequired: string; // Registro o acta de conformidad
}

export interface OperationalRiskConfig {
  riskId: string; // e.g. "RSK-01"
  description: string; // e.g. "Caducidad de plazo por omisión de cédula"
  probability: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  mitigatingControl: string; // e.g. "Alerta temprana automatizada en bandeja VUPRA"
  controlType: 'PREVENTIVE' | 'DETECTIVE' | 'CORRECTIVE';
}

export interface SubProcessStep {
  id: string;
  stepNumber: number;
  title: string;
  description?: string;
  role: string;
  system: string;
  duration: string;
  inputs?: string[];
  outputs?: string[];
  qualityCheck?: string;
  risk?: string;
}

export interface CompressedNodeSnapshot {
  id: string;
  type?: string;
  relativeX: number;
  relativeY: number;
  width?: number;
  height?: number;
  data: BpmnNodeData;
}

export interface CompressedSubProcessSnapshot {
  nodes: CompressedNodeSnapshot[];
  internalEdges: Array<{
    id: string;
    source: string;
    target: string;
    data: SequenceFlowData;
  }>;
}

export interface BpmnNodeData {
  standardId: string; // e.g. "TSK-01", "GTW-01", "QC-01", "TMR-01", "SUB-01"
  title: string;
  description: string;
  nodeType: BpmnNodeType;
  laneId: string;
  laneName?: string;
  roleName?: string;
  itSystem: string; // e.g. "SAM", "VUPRA", "Expediente Electrónico", "Manual/Papel"
  legalFramework: string; // e.g. "Ord. Municipal 12.345 Art. 45"
  slaDuration?: IsoDuration;
  gatewayResolutionType?: GatewayResolutionType;
  conditionLabel?: string;
  inputs: string[]; // Insumos / Requisitos previos
  outputs: string[]; // Entregables / Salidas formales
  qualityCheckpoint?: QualityCheckpointConfig;
  operationalRisks: OperationalRiskConfig[];
  subProcessSteps?: SubProcessStep[]; // Pasos internos detallados del subproceso
  customBgColor?: string; // Color personalizado de fondo de la tarjeta (HEX/RGB)
  customBgOpacity?: number; // Nivel de opacidad / transparencia (0 a 100)
  customBorderColor?: string; // Color personalizado de borde de la tarjeta
  customHeaderBgColor?: string; // Color personalizado del recuadro del título / cabecera
  customHeaderTextColor?: string; // Color personalizado del texto del título / cabecera
  customTextColor?: string; // Color personalizado del texto de la tarjeta
  customFontSize?: number; // Tamaño de letra personalizado en px (ej: 10, 12, 14, 16, 18)
  displayMode?: 'full' | 'title_only'; // Modo de visualización: 'full' (completo) o 'title_only' (solo título)
  tags: string[];
  [key: string]: unknown;
}

export interface SequenceFlowData {
  id: string;
  source: string;
  target: string;
  conditionText?: string;
  strokeColor?: string; // Color personalizado de la conexión
  strokeWidth?: number; // Grosor de línea
  isAnimated?: boolean; // Animación de flujo
  isDefault?: boolean;
  isProbationOrAppeal?: boolean;
  [key: string]: unknown;
}
