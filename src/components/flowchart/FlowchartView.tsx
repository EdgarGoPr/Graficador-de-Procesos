import React, { useMemo } from 'react';
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
import {
  Printer,
  Maximize2,
  ZoomIn,
  ZoomOut,
  GitGraph,
  Layers,
  Shield,
  ArrowDown
} from 'lucide-react';

const NODE_TYPES = {
  flowchartNode: FlowchartNode,
};

const FlowchartInternal: React.FC = () => {
  const { currentProject } = useProjectStore();
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { currentThemeId, customThemeColors } = useUiStore();

  const activeColors = currentThemeId === 'custom'
    ? customThemeColors
    : (PRESET_THEMES[currentThemeId]?.colors || PRESET_THEMES['antigravity-dark'].colors);

  // Compute deterministic hierarchical top-to-bottom layout
  const layout = useMemo(() => {
    if (!currentProject) {
      return { nodes: [], edges: [], totalWidth: 0, totalHeight: 0, layerCount: 0 };
    }
    return computeFlowchartLayout(currentProject.nodes, currentProject.edges);
  }, [currentProject]);

  const handlePrint = () => {
    fitView({ padding: 0.15 });
    setTimeout(() => {
      window.print();
    }, 200);
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
          .react-flow__pane {
            cursor: default !important;
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

          <div className="hidden md:flex items-center space-x-2 text-xs font-mono text-theme-text-muted">
            <span>&bull;</span>
            <span>{layout.nodes.length} Nodos</span>
            <span>&bull;</span>
            <span>{layout.layerCount} Niveles Jerárquicos</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
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
            <span>Ajustar Vista</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-1.5 bg-gradient-to-r from-[#0284C7] to-[#3B82F6] hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir en PDF (Multipágina)</span>
          </button>
        </div>
      </div>

      {/* Main Flowchart Interactive / Printable Canvas */}
      <div className="flex-1 w-full h-full relative print:h-auto print:w-full">
        {/* Document Title header visible only during print */}
        <div className="hidden print:block p-6 border-b-2 border-slate-900 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-xs font-mono font-bold uppercase text-slate-700">
                Flujograma Operativo &bull; ISO 9001:2015
              </span>
              <h1 className="text-2xl font-bold text-black mt-0.5">
                {currentProject.documentControl.documentTitle}
              </h1>
              <p className="text-xs text-slate-600 mt-0.5">
                {currentProject.documentControl.organizationUnit} &bull; Código: {currentProject.documentControl.documentCode} (v{currentProject.documentControl.version})
              </p>
            </div>
            <div className="text-right text-xs font-mono text-slate-600">
              {new Date().toISOString().substring(0, 10)}
            </div>
          </div>
        </div>

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
          <Controls className="!bg-theme-surface !border-theme-border !text-theme-text fill-current shadow-lg print:hidden" />
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5}
            color={activeColors.dotGridColor}
            bgColor={activeColors.canvasBg}
          />
        </ReactFlow>
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
