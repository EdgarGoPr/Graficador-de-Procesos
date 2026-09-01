import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  SelectionMode,
  PanOnScrollMode
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
import { SequenceFlowEdge } from './custom-edges/SequenceFlowEdge';
import { SwimlaneBackground } from './SwimlaneBackground';
import { SelectionToolbar } from './SelectionToolbar';
import { BpmnNodeType } from '../../types/process';

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

      // Detect which swimlane this position falls into (each lane is ~140px high)
      let laneId: string | undefined = undefined;
      if (currentProject?.pools[0]?.lanes) {
        const laneIndex = Math.max(0, Math.floor((position.y - 20) / 140));
        const lane = currentProject.pools[0].lanes[laneIndex] || currentProject.pools[0].lanes[0];
        laneId = lane?.id;
      }

      addNode(nodeType, position, laneId);
      setPropertiesPanelOpen(true);
    },
    [screenToFlowPosition, addNode, currentProject, setPropertiesPanelOpen]
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
        <SwimlaneBackground pools={currentProject.pools} laneHeight={140} totalWidth={2600} />
        <Controls className="!bg-theme-surface !border-theme-border !text-theme-text fill-current shadow-lg" />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'StartEvent') return '#10B981';
            if (node.type === 'EndEvent') return '#EF4444';
            if (node.type === 'QualityCheckpointEvent') return '#10B981';
            if (node.type?.includes('Gateway') || node.type === 'TimerBoundaryEvent') return '#F59E0B';
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
