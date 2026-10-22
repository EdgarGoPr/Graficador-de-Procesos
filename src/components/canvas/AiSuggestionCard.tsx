import React from 'react';
import {
  Sparkles,
  Check,
  X,
  BookOpen,
  AlertCircle,
  ShieldCheck,
  GitBranch,
  User,
  Cpu,
  PlusSquare,
  Box,
  CircleDot,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { AiNodeRecommendation } from '../../types/ai';
import { BpmnNodeType, BPMN_NODE_TYPES } from '../../types/process';

interface AiSuggestionCardProps {
  isLoading: boolean;
  recommendation: AiNodeRecommendation | null;
  onApply: (rec: AiNodeRecommendation) => void;
  onClose: () => void;
  onOpenDocumentation: () => void;
}

const NODE_TYPE_META: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ComponentType<{ className?: string }> }
> = {
  [BPMN_NODE_TYPES.USER_TASK]: {
    label: 'Tarea de Usuario',
    color: '#38BDF8',
    bg: 'rgba(56, 189, 248, 0.15)',
    icon: User
  },
  [BPMN_NODE_TYPES.SERVICE_TASK]: {
    label: 'Tarea de Servicio',
    color: '#06B6D4',
    bg: 'rgba(6, 182, 212, 0.15)',
    icon: Cpu
  },
  [BPMN_NODE_TYPES.EXCLUSIVE_GATEWAY]: {
    label: 'Decisión (XOR)',
    color: '#F59E0B',
    bg: 'rgba(245, 158, 11, 0.15)',
    icon: GitBranch
  },
  [BPMN_NODE_TYPES.PARALLEL_GATEWAY]: {
    label: 'Bifurcación (AND)',
    color: '#D97706',
    bg: 'rgba(217, 119, 6, 0.15)',
    icon: PlusSquare
  },
  [BPMN_NODE_TYPES.QUALITY_CHECKPOINT_EVENT]: {
    label: 'Punto de Calidad ISO',
    color: '#10B981',
    bg: 'rgba(16, 185, 129, 0.15)',
    icon: ShieldCheck
  },
  [BPMN_NODE_TYPES.SUB_PROCESS]: {
    label: 'Subproceso',
    color: '#A855F7',
    bg: 'rgba(168, 85, 247, 0.15)',
    icon: Box
  },
  [BPMN_NODE_TYPES.END_EVENT]: {
    label: 'Evento de Fin',
    color: '#EF4444',
    bg: 'rgba(239, 68, 68, 0.15)',
    icon: CircleDot
  }
};

export const AiSuggestionCard: React.FC<AiSuggestionCardProps> = ({
  isLoading,
  recommendation,
  onApply,
  onClose,
  onOpenDocumentation
}) => {
  if (!isLoading && !recommendation) return null;

  // Estado 1: Cargando con Spinner
  if (isLoading) {
    return (
      <div className="absolute left-10 top-0 z-50 w-80 p-4 rounded-2xl bg-theme-surface/95 backdrop-blur-xl border border-violet-500/40 shadow-2xl shadow-violet-500/20 text-theme-text space-y-3 animate-fadeIn">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-violet-500/20 text-violet-400">
            <RefreshCw className="w-5 h-5 animate-spin" />
          </div>
          <div>
            <div className="text-xs font-bold text-violet-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Consultando Inteligencia Artificial...
            </div>
            <div className="text-[11px] text-theme-text-muted">
              Evaluando Nivel 1 (documentos/audios) y Nivel 2 (grafo)
            </div>
          </div>
        </div>
        <div className="w-full bg-violet-500/10 rounded-full h-1 overflow-hidden">
          <div className="bg-gradient-to-r from-violet-500 to-indigo-500 h-1 w-1/2 rounded-full animate-[pulse_1s_infinite]" />
        </div>
      </div>
    );
  }

  // Estado 2: Fallback / "No hay sugerencias"
  if (recommendation && !recommendation.hasSuggestion) {
    return (
      <div className="absolute left-10 top-0 z-50 w-80 p-4 rounded-2xl bg-theme-surface/95 backdrop-blur-xl border border-amber-500/30 shadow-2xl text-theme-text space-y-3 animate-fadeIn">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-theme-text">No hay sugerencias</h4>
              <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">
                {recommendation.fallbackReason === 'NO_API_KEY'
                  ? 'Clave de API requerida'
                  : recommendation.fallbackReason === 'API_ERROR'
                  ? 'Falla de conexión'
                  : 'Filtro Anti-Desvío'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-subtle"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-theme-text-muted leading-relaxed">
          {recommendation.fallbackMessage ||
            'No se encontró respaldo certero en la documentación cargada ni en el flujo para predecir el próximo paso sin desvíos.'}
        </p>

        <div className="flex items-center justify-end gap-2 pt-1 border-t border-theme-border">
          <button
            type="button"
            onClick={onOpenDocumentation}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-violet-500/15 text-violet-400 hover:bg-violet-500/25 border border-violet-500/30 flex items-center gap-1.5 transition-colors font-medium"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Cargar Documentación
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-lg bg-theme-surface border border-theme-border hover:bg-theme-surface-hover text-theme-text transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  }

  // Estado 3: Recomendación Exitosa
  if (!recommendation) return null;

  const nodeType = recommendation.nodeType || BPMN_NODE_TYPES.USER_TASK;
  const meta = NODE_TYPE_META[nodeType] || NODE_TYPE_META[BPMN_NODE_TYPES.USER_TASK];
  const IconComponent = meta.icon;

  const isLevel1 = recommendation.sourceLevel === 'DOCUMENTATION';
  const isLevel2 = recommendation.sourceLevel === 'GRAPH_CONTEXT';

  return (
    <div className="absolute left-10 -top-8 z-50 w-96 p-4 rounded-2xl bg-theme-surface/98 backdrop-blur-2xl border border-violet-500/40 shadow-2xl shadow-violet-500/20 text-theme-text space-y-3.5 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2.5">
          <div
            className="p-2 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ backgroundColor: meta.color }}
          >
            <IconComponent className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-theme-text">{meta.label}</span>
              {/* Badge de Nivel Jerárquico */}
              {isLevel1 ? (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Nivel 1: Documentación
                </span>
              ) : isLevel2 ? (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  Nivel 2: Grafo
                </span>
              ) : (
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30">
                  Nivel 3: Práctica Estándar
                </span>
              )}
            </div>
            <div className="text-[11px] text-theme-text-muted">
              Paso sugerido por la IA para continuar el flujo
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-subtle"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Título y Rol Sugerido */}
      <div className="space-y-1 p-2.5 rounded-xl bg-theme-surface-subtle border border-theme-border">
        <div className="text-xs font-bold text-theme-text">
          {recommendation.title || 'Próxima Actividad'}
        </div>
        {recommendation.description && (
          <p className="text-[11px] text-theme-text-muted leading-relaxed">
            {recommendation.description}
          </p>
        )}
        {recommendation.suggestedLaneName && (
          <div className="pt-1 flex items-center gap-1.5 text-[10px] text-theme-accent font-semibold">
            <span>Área / Carril propuesto:</span>
            <span className="px-1.5 py-0.5 rounded bg-theme-accent/10 border border-theme-accent/20">
              {recommendation.suggestedLaneName}
            </span>
          </div>
        )}
      </div>

      {/* Justificación y Cita de Documento */}
      {recommendation.sourceCitation && (
        <div className="text-[10px] p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 space-y-0.5">
          <span className="font-bold uppercase tracking-wider block text-[9px] text-emerald-400">
            Fundamento Documental:
          </span>
          <p className="italic font-mono">&quot;{recommendation.sourceCitation}&quot;</p>
        </div>
      )}

      {recommendation.rationale && !recommendation.sourceCitation && (
        <div className="text-[10px] p-2 rounded-lg bg-theme-surface border border-theme-border text-theme-text-muted space-y-0.5">
          <span className="font-bold uppercase tracking-wider block text-[9px] text-violet-400">
            Justificación:
          </span>
          <p>{recommendation.rationale}</p>
        </div>
      )}

      {/* Botones de Acción */}
      <div className="flex items-center justify-between pt-1">
        <button
          type="button"
          onClick={onClose}
          className="text-xs px-3 py-1.5 rounded-lg hover:bg-theme-surface-hover text-theme-text-muted hover:text-theme-text transition-colors"
        >
          Cancelar
        </button>

        <button
          type="button"
          onClick={() => onApply(recommendation)}
          className="text-xs font-bold px-4 py-2 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white shadow-lg shadow-violet-500/25 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          Conectar Nodo Sugerido
        </button>
      </div>
    </div>
  );
};
