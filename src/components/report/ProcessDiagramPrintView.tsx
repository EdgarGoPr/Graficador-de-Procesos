import React, { useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  useReactFlow
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useProjectStore } from '../../store/useProjectStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useUiStore } from '../../store/useUiStore';
import { PRESET_THEMES } from '../../types/theme';
import { exportMultiPageDiagramPdf } from '../../services/pdfDiagramExportService';

import { StartEventNode } from '../canvas/custom-nodes/StartEventNode';
import { EndEventNode } from '../canvas/custom-nodes/EndEventNode';
import { TaskNode } from '../canvas/custom-nodes/TaskNode';
import { GatewayNode } from '../canvas/custom-nodes/GatewayNode';
import { QualityCheckpointNode } from '../canvas/custom-nodes/QualityCheckpointNode';
import { TimerBoundaryNode } from '../canvas/custom-nodes/TimerBoundaryNode';
import { SubProcessNode } from '../canvas/custom-nodes/SubProcessNode';
import { SwimlaneNode } from '../canvas/custom-nodes/SwimlaneNode';
import { StickyNoteNode } from '../canvas/custom-nodes/StickyNoteNode';
import { SequenceFlowEdge } from '../canvas/custom-edges/SequenceFlowEdge';
import { PrintFrameOverlay } from '../canvas/PrintFrameOverlay';

import {
  Printer,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Shield,
  Download,
  Plus,
  Layers,
  Sparkles
} from 'lucide-react';

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
  StickyNote: StickyNoteNode,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EDGE_TYPES: any = {
  sequenceFlow: SequenceFlowEdge,
};

const ProcessDiagramRenderer: React.FC = () => {
  const { currentProject } = useProjectStore();
  const {
    isPrintOverlayVisible,
    togglePrintOverlay,
    addPrintFrame,
    autoLayoutPrintFrames
  } = useCanvasStore();
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { currentThemeId, customThemeColors, showNotification } = useUiStore();

  const [isExporting, setIsExporting] = useState(false);

  const activeColors = currentThemeId === 'custom'
    ? customThemeColors
    : (PRESET_THEMES[currentThemeId]?.colors || PRESET_THEMES['antigravity-dark'].colors);

  const frames = currentProject?.printFrames || [];

  const handleExportPdf = async () => {
    if (!currentProject) return;
    try {
      setIsExporting(true);
      const fileName = await exportMultiPageDiagramPdf(currentProject, frames, {
        themeMode: 'light',
        includeHeaderFooter: true,
      });
      showNotification(`Documento PDF generado exitosamente: ${fileName}`, 'success');
    } catch (error) {
      console.error('Error generando PDF:', error);
      showNotification('Error al generar el archivo PDF.', 'error');
    } finally {
      setIsExporting(false);
    }
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
      {/* Control Bar */}
      <div className="h-14 bg-theme-surface border-b border-theme-border px-6 flex items-center justify-between shrink-0 z-10 select-none">
        <div className="flex items-center space-x-3 text-xs font-mono text-theme-text-muted">
          <span className="flex items-center text-theme-accent font-semibold">
            <Shield className="w-4 h-4 mr-1.5" />
            Diagrama BPMN 2.0 &bull; Visor y Exportador Multi-Página
          </span>
          <span>&bull;</span>
          <span className="text-theme-text font-medium">
            {frames.length > 0 ? `${frames.length} ${frames.length === 1 ? 'Hoja' : 'Hojas'} Configurada(s)` : 'Encuadre Automático'}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {/* Zoom controls */}
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

          <div className="h-5 w-px bg-theme-border mx-1" />

          {/* Framing mode toggle */}
          <button
            onClick={() => {
              togglePrintOverlay();
              showNotification(
                !isPrintOverlayVisible
                  ? 'Modo de Hojas de Impresión activado. Puedes arrastrar y redimensionar los recuadros.'
                  : 'Recuadros de hojas ocultados.',
                'info'
              );
            }}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              isPrintOverlayVisible
                ? 'bg-sky-500/20 border-sky-400 text-sky-400 font-bold ring-1 ring-sky-400'
                : 'bg-theme-surface-subtle hover:bg-theme-surface border-theme-border text-theme-text'
            }`}
            title="Ver y ajustar los recuadros punteados de cada hoja sobre el mapa"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>{isPrintOverlayVisible ? 'Ocultar Recuadros' : 'Ajustar Hojas'}</span>
          </button>

          {/* Primary Export Button */}
          <button
            onClick={handleExportPdf}
            disabled={isExporting}
            className="flex items-center space-x-2 px-4 py-1.5 bg-gradient-to-r from-[#0284C7] to-[#3B82F6] hover:brightness-110 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all active:scale-95 cursor-pointer"
            title="Genera el documento PDF de alta calidad con todas las hojas configuradas"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generando PDF...' : 'Guardar en PDF (Multi-Hoja)'}</span>
          </button>
        </div>
      </div>

      {/* Diagram Printable Frame with Dotted Overlay */}
      <div className="flex-1 w-full h-full relative">
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
          <PrintFrameOverlay />
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
