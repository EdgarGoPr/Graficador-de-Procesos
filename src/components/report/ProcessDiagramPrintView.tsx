import React, { useRef } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { PRESET_THEMES } from '../../types/theme';

import { StartEventNode } from '../canvas/custom-nodes/StartEventNode';
import { EndEventNode } from '../canvas/custom-nodes/EndEventNode';
import { TaskNode } from '../canvas/custom-nodes/TaskNode';
import { GatewayNode } from '../canvas/custom-nodes/GatewayNode';
import { QualityCheckpointNode } from '../canvas/custom-nodes/QualityCheckpointNode';
import { TimerBoundaryNode } from '../canvas/custom-nodes/TimerBoundaryNode';
import { SubProcessNode } from '../canvas/custom-nodes/SubProcessNode';
import { SwimlaneNode } from '../canvas/custom-nodes/SwimlaneNode';
import { SequenceFlowEdge } from '../canvas/custom-edges/SequenceFlowEdge';
import { Printer, Maximize2, ZoomIn, ZoomOut, Shield } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const NODE_TYPES: any = {
  StartEvent: StartEventNode,
  EndEvent: EndEventNode,
  UserTask: TaskNode,
  ServiceTask: TaskNode,
  ManualTask: TaskNode,
  ExclusiveGateway: GatewayNode,
  ParallelGateway: GatewayNode,
  QualityCheckpointEvent: QualityCheckpointNode,
  TimerBoundaryEvent: TimerBoundaryNode,
  SubProcess: SubProcessNode,
  PoolLane: SwimlaneNode,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EDGE_TYPES: any = {
  sequenceFlow: SequenceFlowEdge,
};

const ProcessDiagramRenderer: React.FC = () => {
  const { currentProject } = useProjectStore();
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { currentThemeId, customThemeColors } = useUiStore();

  const activeColors = currentThemeId === 'custom'
    ? customThemeColors
    : (PRESET_THEMES[currentThemeId]?.colors || PRESET_THEMES['antigravity-dark'].colors);

  const handlePrint = () => {
    // Force fitView before printing
    fitView({ padding: 0.1 });
    setTimeout(() => {
      window.print();
    }, 200);
  };

  const hierarchicalNodes = React.useMemo(() => {
    if (!currentProject?.nodes) return [];
    const getHierarchyLevel = (type?: string) => {
      if (type === 'PoolLane') return 0;
      if (type === 'SubProcess') return 1;
      if (type?.includes('Task')) return 2;
      if (type?.includes('Gateway')) return 3;
      if (type?.includes('Event')) return 4;
      return 2;
    };
    return [...currentProject.nodes]
      .map((node) => ({
        ...node,
        draggable: false,
        selectable: false
      }))
      .sort((a, b) => getHierarchyLevel(a.type) - getHierarchyLevel(b.type));
  }, [currentProject?.nodes]);

  if (!currentProject) return null;

  return (
    <div className="flex-1 flex flex-col h-full bg-theme-bg overflow-hidden relative">
      {/* Dynamic Landscape print style */}
      <style>{`
        @media print {
          @page {
            size: landscape;
            margin: 0.8cm;
          }
        }
      `}</style>

      {/* Control Bar (hidden in print) */}
      <div className="h-12 bg-theme-surface border-b border-theme-border px-6 flex items-center justify-between shrink-0 print:hidden z-10">
        <div className="flex items-center space-x-3 text-xs font-mono text-theme-text-muted">
          <span className="flex items-center text-theme-accent font-semibold">
            <Shield className="w-4 h-4 mr-1.5" />
            Diagrama BPMN 2.0 &bull; Vista de Impresión Gráfica
          </span>
          <span>&bull;</span>
          <span>{currentProject.nodes.length} Elementos</span>
          <span>&bull;</span>
          <span>{currentProject.edges.length} Conexiones</span>
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
            title="Ajustar diagrama al centro"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Ajustar Vista</span>
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center space-x-2 px-4 py-1.5 bg-gradient-to-r from-[#0284C7] to-[#3B82F6] hover:brightness-110 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Diagrama (PDF Apaisado)</span>
          </button>
        </div>
      </div>

      {/* Diagram Printable Frame */}
      <div className="flex-1 w-full h-full relative print:h-screen print:w-screen">
        <ReactFlow
          nodes={hierarchicalNodes}
          edges={currentProject.edges}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={true}
          zoomOnScroll={true}
          style={{ backgroundColor: activeColors.canvasBg }}
        >
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

export const ProcessDiagramPrintView: React.FC = () => {
  return (
    <ReactFlowProvider>
      <ProcessDiagramRenderer />
    </ReactFlowProvider>
  );
};
