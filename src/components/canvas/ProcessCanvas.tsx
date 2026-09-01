import React, { useCallback, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider
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
    deleteSelected
  } = useCanvasStore();
  const { setPropertiesPanelOpen } = useUiStore();

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
    (_: React.MouseEvent, node: any) => {
      selectNode(node.id);
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

  // Keydown delete handler
  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const target = e.target as HTMLElement;
        if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') {
          deleteSelected();
        }
      }
    },
    [deleteSelected]
  );

  if (!currentProject) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-950 text-slate-400">
        No hay proyecto cargado.
      </div>
    );
  }

  return (
    <div
      ref={reactFlowWrapper}
      className="flex-1 h-full relative bg-slate-950"
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
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
        fitView
        minZoom={0.2}
        maxZoom={2}
        className="bg-slate-950"
        defaultEdgeOptions={{
          type: 'sequenceFlow',
          animated: false,
        }}
      >
        <SwimlaneBackground pools={currentProject.pools} laneHeight={140} totalWidth={2600} />
        <Controls className="!bg-slate-900 !border-slate-700 !text-slate-200 fill-slate-200" />
        <MiniMap
          nodeColor={(node) => {
            if (node.type === 'StartEvent') return '#10b981';
            if (node.type === 'EndEvent') return '#ef4444';
            if (node.type === 'QualityCheckpointEvent') return '#ec4899';
            if (node.type?.includes('Gateway')) return '#f59e0b';
            return '#3b82f6';
          }}
          className="!bg-slate-900/90 !border-slate-800 !rounded-lg"
          maskColor="rgba(15, 23, 42, 0.7)"
        />
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#334155" />
      </ReactFlow>
    </div>
  );
};

export const ProcessCanvas: React.FC = () => {
  return (
    <ReactFlowProvider>
      <ProcessCanvasInternal />
    </ReactFlowProvider>
  );
};
