import React, { useState, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  SelectionMode,
  PanOnScrollMode,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useProjectStore } from '../../store/useProjectStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useUiStore } from '../../store/useUiStore';

import { StartEventNode } from './custom-nodes/StartEventNode';
import { EndEventNode } from './custom-nodes/EndEventNode';
import { TaskNode } from './custom-nodes/TaskNode';
import { GatewayNode } from './custom-nodes/GatewayNode';
import { QualityCheckpointNode } from './custom-nodes/QualityCheckpointNode';
import { TimerBoundaryNode } from './custom-nodes/TimerBoundaryNode';
import { SubProcessNode } from './custom-nodes/SubProcessNode';
import { SwimlaneNode } from './custom-nodes/SwimlaneNode';
import { SequenceFlowEdge } from './custom-edges/SequenceFlowEdge';
import { SelectionToolbar } from './SelectionToolbar';
import { AlignmentGuidesOverlay, AlignmentGuide } from './AlignmentGuidesOverlay';
import { BpmnNodeType, BpmnNodeData } from '../../types/process';

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

const ProcessCanvasInternal: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const { currentProject } = useProjectStore();
  const {
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectNode,
    selectEdge,
    addNode,
    deleteSelected,
    copySelection,
    pasteSelection,
    selectedNodeIds
  } = useCanvasStore();

  const { setPropertiesPanelOpen, theme, showNotification } = useUiStore();
  const [alignmentGuides, setAlignmentGuides] = useState<AlignmentGuide[]>([]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData('application/reactflow-nodetype') as BpmnNodeType;
      if (!nodeType) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      addNode(nodeType, position);
      setPropertiesPanelOpen(true);
    },
    [screenToFlowPosition, addNode, setPropertiesPanelOpen]
  );

  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: any) => {
      if (event.shiftKey || event.ctrlKey || event.metaKey) {
        // Multi-selection is handled automatically by ReactFlow onNodesChange
      } else {
        selectNode(node.id);
      }
      setPropertiesPanelOpen(true);
    },
    [selectNode, setPropertiesPanelOpen]
  );

  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: any) => {
      selectEdge(edge.id);
      setPropertiesPanelOpen(true);
    },
    [selectEdge, setPropertiesPanelOpen]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
    selectEdge(null);
  }, [selectNode, selectEdge]);

  // Keydown global shortcuts (Delete, Ctrl+C, Ctrl+V)
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        deleteSelected();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        const ok = copySelection();
        if (ok) {
          showNotification(`Copiado al portapapeles (${selectedNodeIds.length || 1} elemento${(selectedNodeIds.length || 1) > 1 ? 's' : ''})`, 'info');
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        const ok = pasteSelection();
        if (ok) {
          showNotification('Elementos pegados en el lienzo', 'success');
        }
      }
    },
    [deleteSelected, copySelection, pasteSelection, selectedNodeIds, showNotification]
  );

  // Smart Alignment Guides & Magnetic Snapping during node drag
  const onNodeDrag = useCallback(
    (_event: any, node: Node<BpmnNodeData>) => {
      if (!currentProject) return;

      const SNAP_THRESHOLD = 10;
      const GAP_HORIZONTAL = 40;
      const GAP_VERTICAL = 30;

      const activeWidth = (node.measured?.width || node.width || 210) as number;
      const activeHeight = (node.measured?.height || node.height || 120) as number;
      const activeLeft = node.position.x;
      const activeTop = node.position.y;
      const activeCenterX = activeLeft + activeWidth / 2;
      const activeCenterY = activeTop + activeHeight / 2;
      const activeRight = activeLeft + activeWidth;
      const activeBottom = activeTop + activeHeight;

      const guides: AlignmentGuide[] = [];

      // Compare with all other nodes (except self and full-width lanes)
      const otherNodes = currentProject.nodes.filter(
        (n) => n.id !== node.id && n.type !== 'PoolLane'
      );

      for (const other of otherNodes) {
        const oWidth = (other.measured?.width || other.width || 210) as number;
        const oHeight = (other.measured?.height || other.height || 120) as number;
        const oLeft = other.position.x;
        const oTop = other.position.y;
        const oCenterX = oLeft + oWidth / 2;
        const oCenterY = oTop + oHeight / 2;
        const oRight = oLeft + oWidth;
        const oBottom = oTop + oHeight;

        // --- VERTICAL GUIDES (X alignment) ---
        // 1. Center alignment (vertical line across both)
        if (Math.abs(activeCenterX - oCenterX) <= SNAP_THRESHOLD) {
          guides.push({
            id: `v-center-${other.id}`,
            type: 'vertical',
            coordinate: oCenterX,
            start: Math.min(activeTop, oTop),
            end: Math.max(activeBottom, oBottom)
          });
        }
        // 2. Left-to-Left
        else if (Math.abs(activeLeft - oLeft) <= SNAP_THRESHOLD) {
          guides.push({
            id: `v-left-${other.id}`,
            type: 'vertical',
            coordinate: oLeft,
            start: Math.min(activeTop, oTop),
            end: Math.max(activeBottom, oBottom)
          });
        }
        // 3. Right-to-Right
        else if (Math.abs(activeRight - oRight) <= SNAP_THRESHOLD) {
          guides.push({
            id: `v-right-${other.id}`,
            type: 'vertical',
            coordinate: oRight,
            start: Math.min(activeTop, oTop),
            end: Math.max(activeBottom, oBottom)
          });
        }
        // 4. Side-by-side snap (Right of other)
        else if (Math.abs(activeLeft - (oRight + GAP_HORIZONTAL)) <= SNAP_THRESHOLD) {
          guides.push({
            id: `v-gap-r-${other.id}`,
            type: 'vertical',
            coordinate: oRight + GAP_HORIZONTAL,
            start: Math.min(activeTop, oTop),
            end: Math.max(activeBottom, oBottom)
          });
        }
        // 5. Side-by-side snap (Left of other)
        else if (Math.abs(activeRight - (oLeft - GAP_HORIZONTAL)) <= SNAP_THRESHOLD) {
          guides.push({
            id: `v-gap-l-${other.id}`,
            type: 'vertical',
            coordinate: oLeft - GAP_HORIZONTAL,
            start: Math.min(activeTop, oTop),
            end: Math.max(activeBottom, oBottom)
          });
        }

        // --- HORIZONTAL GUIDES (Y alignment) ---
        // 1. Center alignment (horizontal line across both)
        if (Math.abs(activeCenterY - oCenterY) <= SNAP_THRESHOLD) {
          guides.push({
            id: `h-center-${other.id}`,
            type: 'horizontal',
            coordinate: oCenterY,
            start: Math.min(activeLeft, oLeft),
            end: Math.max(activeRight, oRight)
          });
        }
        // 2. Top-to-Top
        else if (Math.abs(activeTop - oTop) <= SNAP_THRESHOLD) {
          guides.push({
            id: `h-top-${other.id}`,
            type: 'horizontal',
            coordinate: oTop,
            start: Math.min(activeLeft, oLeft),
            end: Math.max(activeRight, oRight)
          });
        }
        // 3. Bottom-to-Bottom
        else if (Math.abs(activeBottom - oBottom) <= SNAP_THRESHOLD) {
          guides.push({
            id: `h-bottom-${other.id}`,
            type: 'horizontal',
            coordinate: oBottom,
            start: Math.min(activeLeft, oLeft),
            end: Math.max(activeRight, oRight)
          });
        }
        // 4. Stacked snap (Below other)
        else if (Math.abs(activeTop - (oBottom + GAP_VERTICAL)) <= SNAP_THRESHOLD) {
          guides.push({
            id: `h-gap-b-${other.id}`,
            type: 'horizontal',
            coordinate: oBottom + GAP_VERTICAL,
            start: Math.min(activeLeft, oLeft),
            end: Math.max(activeRight, oRight)
          });
        }
        // 5. Stacked snap (Above other)
        else if (Math.abs(activeBottom - (oTop - GAP_VERTICAL)) <= SNAP_THRESHOLD) {
          guides.push({
            id: `h-gap-t-${other.id}`,
            type: 'horizontal',
            coordinate: oTop - GAP_VERTICAL,
            start: Math.min(activeLeft, oLeft),
            end: Math.max(activeRight, oRight)
          });
        }
      }

      setAlignmentGuides(guides);
    },
    [currentProject]
  );

  const onNodeDragStop = useCallback(() => {
    setAlignmentGuides([]);
  }, []);

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-theme-bg text-theme-text-muted">
        No hay proyecto cargado.
      </div>
    );
  }

  return (
    <div
      ref={reactFlowWrapper}
      className="flex-1 h-full relative bg-theme-canvas transition-colors outline-none"
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <SelectionToolbar />

      <ReactFlow
        nodes={currentProject.nodes}
        edges={currentProject.edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode={['Shift']}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        panOnDrag={true}
        panOnScroll={true}
        panOnScrollMode={PanOnScrollMode.Free}
        zoomOnScroll={false}
        zoomActivationKeyCode="Control"
        zoomOnPinch={true}
        preventScrolling={true}
        fitView
        minZoom={0.2}
        maxZoom={2.5}
        className="bg-theme-canvas"
        defaultEdgeOptions={{
          type: 'sequenceFlow',
          animated: false,
        }}
      >
        <AlignmentGuidesOverlay guides={alignmentGuides} />
        <Controls className="!bg-theme-surface !border-theme-border !text-theme-text fill-current shadow-lg" />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'StartEvent') return '#10B981';
            if (node.type === 'EndEvent') return '#EF4444';
            if (node.type === 'QualityCheckpointEvent') return '#10B981';
            if (node.type?.includes('Gateway') || node.type === 'TimerBoundaryEvent') return '#F59E0B';
            if (node.type === 'PoolLane') return '#0284C7';
            return '#3B82F6';
          }}
          className="!bg-theme-surface/90 !border-theme-border !rounded-lg shadow-xl"
          maskColor={theme === 'dark' ? 'rgba(24, 24, 27, 0.75)' : 'rgba(241, 243, 245, 0.75)'}
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color={theme === 'dark' ? '#3F3F46' : '#CBD5E1'}
        />
      </ReactFlow>
    </div>
  );
};

export const ProcessCanvas: React.FC = () => {
  return <ProcessCanvasInternal />;
};
