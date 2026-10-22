import { BpmnNodeType } from './process';

/**
 * Tipos y estructuras de datos para el Motor de Recomendaciones IA y Bóveda Documental
 */

export type DocumentationSourceType = 'TEXT' | 'AUDIO_TRANSCRIPTION';

export interface ProcessDocumentationItem {
  id: string;
  type: DocumentationSourceType;
  title: string;
  content: string; // Texto o transcripción
  audioFileName?: string;
  audioBlobUrl?: string; // Para reproducción local en sesión
  audioDurationSeconds?: number;
  sourceReference?: string; // Ej: "Decreto 450/24 Art. 12" o "Manual de Procedimientos pág. 4"
  createdAt: string; // ISO 8601
  updatedAt?: string;
}

export interface ProcessDocumentationVault {
  items: ProcessDocumentationItem[];
  globalNotes?: string;
}

export type AiFallbackReason = 'API_ERROR' | 'LOW_CONFIDENCE' | 'CONTEXT_DRIFT' | 'NO_API_KEY';

export interface AiNodeRecommendation {
  hasSuggestion: boolean;
  fallbackReason?: AiFallbackReason;
  fallbackMessage?: string; // Mensaje limpio "No hay sugerencias..."
  nodeType?: BpmnNodeType;
  title?: string;
  description?: string;
  suggestedLaneName?: string;
  rationale?: string; // Justificación del próximo paso
  sourceLevel?: 'DOCUMENTATION' | 'GRAPH_CONTEXT' | 'GENERAL_BEST_PRACTICE';
  sourceCitation?: string; // Fragmento del documento o audio donde se fundamenta
  potentialRisksOrControls?: string[];
  alternativeOption?: {
    nodeType: BpmnNodeType;
    title: string;
    description: string;
  };
}

export interface AiRecommendationRequest {
  selectedNodeId: string;
  selectedNodeTitle: string;
  selectedNodeType: BpmnNodeType;
  selectedNodeLane?: string;
  previousNodesSummary: string[];
  existingLanes: string[];
  processTitle: string;
  processObjective?: string;
  documentationVault?: ProcessDocumentationVault;
}
