import React, { useMemo, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { PRESET_THEMES } from '../../types/theme';
import { computeFlowchartLayout } from '../../services/flowchartLayout';
import { FlowchartNode } from './FlowchartNode';
import { FlowchartPrintDocument } from './FlowchartPrintDocument';
import {
  Printer,
  Maximize2,
  ZoomIn,
  ZoomOut,
  GitGraph,
  ArrowDown,
  FileText,
  Eye
} from 'lucide-react';

const NODE_TYPES = {
  flowchartNode: FlowchartNode,
};

const FlowchartInternal: React.FC = () => {
  const { currentProject } = useProjectStore();
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { currentThemeId, customThemeColors } = useUiStore();
  const [viewMode, setViewMode] = useState<'INTERACTIVE' | 'PAGINATED_PREVIEW'>('INTERACTIVE');

  const activeColors = currentThemeId === 'custom'
    ? customThemeColors
    : (PRESET_THEMES[currentThemeId]?.colors || PRESET_THEMES['antigravity-dark'].colors);

  // Compute deterministic hierarchical top-to-bottom layout for interactive screen view
  const layout = useMemo(() => {
    if (!currentProject) {
      return { nodes: [], edges: [], totalWidth: 0, totalHeight: 0, layerCount: 0 };
    }
    return computeFlowchartLayout(currentProject.nodes, currentProject.edges);
  }, [currentProject]);

  const handlePrint = () => {
    window.print();
  };

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-theme-bg text-theme-text-muted">
        No hay proyecto seleccionado para generar el diagrama de flujo.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-theme-bg overflow-hidden relative select-text">
      {/* Print CSS for vertical multi-page flowchart */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 1.2cm;
          }
          body {
            background-color: white !important;
            color: black !important;
          }
        }
      `}</style>

      {/* Top Header & Action Bar (Hidden when printing) */}
      <div className="h-14 bg-theme-surface border-b border-theme-border px-6 flex items-center justify-between shrink-0 print:hidden z-10">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-xs font-mono text-theme-text">
            <span className="flex items-center text-theme-accent font-bold">
              <GitGraph className="w-4 h-4 mr-1.5" />
              Diagrama de Flujo Descendente
            </span>
            <span className="text-theme-text-muted">&bull;</span>
            <span className="px-2 py-0.5 rounded bg-theme-surface-subtle border border-theme-border text-[11px] text-[#10B981] font-semibold flex items-center gap-1">
              <ArrowDown className="w-3 h-3" />
              Auto-Layout Top-to-Bottom
            </span>
          </div>

          <div className="hidden lg:flex items-center space-x-2 text-xs font-mono text-theme-text-muted">
            <span>&bull;</span>
            <span>{layout.nodes.length} Nodos</span>
            <span>&bull;</span>
            <span>{layout.layerCount} Niveles Jerárquicos</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Toggle Screen View Mode */}
          <div className="flex items-center bg-theme-surface-subtle p-0.5 rounded-lg border border-theme-border mr-2">
            <button
              onClick={() => setViewMode('INTERACTIVE')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'INTERACTIVE'
                  ? 'bg-theme-surface text-theme-accent font-bold shadow-xs'
                  : 'text-theme-text-muted hover:text-theme-text'
              }`}
              title="Vista interactiva con zoom y navegación"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Lienzo Interactivo</span>
            </button>
            <button
              onClick={() => setViewMode('PAGINATED_PREVIEW')}
              className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                viewMode === 'PAGINATED_PREVIEW'
                  ? 'bg-theme-surface text-theme-accent font-bold shadow-xs'
                  : 'text-theme-text-muted hover:text-theme-text'
              }`}
              title="Vista previa del documento paginado para PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Vista Paginada</span>
            </button>
          </div>

          {viewMode === 'INTERACTIVE' && (
            <>
              <button
                onClick={() => zoomIn()}
                className="p-1.5 rounded-lg bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border border-theme-border text-xs transition-colors"
                title="Acercar (+)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => zoomOut()}
                className="p-1.5 rounded-lg bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border border-theme-border text-xs transition-colors"
                title="Alejar (-)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => fitView({ padding: 0.15 })}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border border-theme-border text-xs font-medium transition-colors"
                title="Centrar y ajustar flujograma"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Ajustar</span>
              </button>
            </>
          )}

          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-1.5 bg-gradient-to-r from-[#0284C7] to-[#3B82F6] hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir en PDF (Multipágina)</span>
          </button>
        </div>
      </div>

      {/* 1. Interactive Screen Mode (Hidden during print) */}
      <div className={`flex-1 w-full h-full relative print:hidden ${viewMode === 'PAGINATED_PREVIEW' ? 'hidden' : 'block'}`}>
        <ReactFlow
          nodes={layout.nodes}
          edges={layout.edges}
          nodeTypes={NODE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={true}
          panOnDrag={true}
          panOnScroll={true}
          zoomOnScroll={true}
          minZoom={0.2}
          maxZoom={2.0}
          style={{ backgroundColor: activeColors.canvasBg }}
        >
          <Controls className="!bg-theme-surface !border-theme-border !text-theme-text fill-current shadow-lg" />
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5}
            color={activeColors.dotGridColor}
            bgColor={activeColors.canvasBg}
          />
        </ReactFlow>
      </div>

      {/* 2. Paginated Screen Preview Mode */}
      {viewMode === 'PAGINATED_PREVIEW' && (
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-900/40 print:hidden">
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-8 border border-slate-700">
            <FlowchartPrintDocument project={currentProject} />
          </div>
        </div>
      )}

      {/* 3. Dedicated Print Document (Visible ONLY during window.print()) */}
      <div className="flowchart-print-container hidden print:block w-full">
        <FlowchartPrintDocument project={currentProject} />
      </div>
    </div>
  );
};

export const FlowchartView: React.FC = () => {
  return (
    <ReactFlowProvider>
      <FlowchartInternal />
    </ReactFlowProvider>
  );
};
