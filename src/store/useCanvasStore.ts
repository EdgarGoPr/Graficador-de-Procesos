import { create } from 'zustand';
import {
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  Connection
} from '@xyflow/react';
import { BpmnNodeData, BpmnNodeType, SequenceFlowData, BPMN_NODE_TYPES } from '../types/process';
import { useProjectStore } from './useProjectStore';

interface CanvasStoreState {
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  clipboardNode: Node<BpmnNodeData> | null;

  // React Flow Handlers
  onNodesChange: OnNodesChange<Node<BpmnNodeData>>;
  onEdgesChange: OnEdgesChange<Edge<SequenceFlowData>>;
  onConnect: OnConnect;
  
  // Custom Selection
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;

  // Node Manipulation
  addNode: (nodeType: BpmnNodeType, position: { x: number; y: number }, laneId?: string) => void;
  updateNodeData: (nodeId: string, updates: Partial<BpmnNodeData>) => void;
  updateEdgeData: (edgeId: string, updates: Partial<SequenceFlowData>) => void;
  bulkUpdateNodeColors: (filter: { nodeType?: BpmnNodeType; laneId?: string } | 'ALL', colors: { customBgColor?: string; customBorderColor?: string; customTextColor?: string }) => void;
  bulkUpdateEdgeColors: (colors: { strokeColor?: string; strokeWidth?: number; isAnimated?: boolean }) => void;
  deleteSelected: () => void;
  
  // Lane & Pool management
  addLane: (poolId: string, name: string, role: string, system: string) => void;
  updateLane: (laneId: string, updates: { name?: string; role?: string; system?: string; colorHex?: string }) => void;
  deleteLane: (laneId: string) => void;
}

export const useCanvasStore = create<CanvasStoreState>((set, get) => ({
  selectedNodeId: null,
  selectedEdgeId: null,
  clipboardNode: null,

  onNodesChange: (changes) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    const nextNodes = applyNodeChanges(changes, currentProject.nodes);
    projectStore.setProjectData({
      ...currentProject,
      nodes: nextNodes
    });
  },

  onEdgesChange: (changes) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    const nextEdges = applyEdgeChanges(changes, currentProject.edges);
    projectStore.setProjectData({
      ...currentProject,
      edges: nextEdges
    });
  },

  onConnect: (connection: Connection) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject || !connection.source || !connection.target) return;

    const newEdge: Edge<SequenceFlowData> = {
      id: `e_${connection.source}_${connection.target}_${Date.now()}`,
      source: connection.source,
      target: connection.target,
      type: 'sequenceFlow',
      data: {
        id: `e_${connection.source}_${connection.target}`,
        source: connection.source,
        target: connection.target,
        conditionText: ''
      }
    };

    const nextEdges = addEdge(newEdge, currentProject.edges);
    projectStore.setProjectData({
      ...currentProject,
      edges: nextEdges
    });
  },

  selectNode: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId, selectedEdgeId: null });
  },

  selectEdge: (edgeId: string | null) => {
    set({ selectedEdgeId: edgeId, selectedNodeId: null });
  },

  addNode: (nodeType: BpmnNodeType, position: { x: number; y: number }, laneId?: string) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    const firstLane = currentProject.pools[0]?.lanes[0];
    const targetLaneId = laneId || firstLane?.id || 'lane-default';
    const targetLane = currentProject.pools[0]?.lanes.find(l => l.id === targetLaneId);

    // Standard ID prefix
    let prefix = 'TSK';
    if (nodeType === BPMN_NODE_TYPES.START_EVENT || nodeType === BPMN_NODE_TYPES.END_EVENT) prefix = 'EVT';
    else if (nodeType.includes('Gateway')) prefix = 'GTW';
    else if (nodeType === BPMN_NODE_TYPES.QUALITY_CHECKPOINT_EVENT) prefix = 'QC';
    else if (nodeType === BPMN_NODE_TYPES.TIMER_BOUNDARY_EVENT) prefix = 'TMR';
    else if (nodeType === BPMN_NODE_TYPES.SUB_PROCESS) prefix = 'SUB';

    const count = currentProject.nodes.filter(n => n.data.nodeType === nodeType).length + 1;
    const standardId = `${prefix}-${count < 10 ? '0' + count : count}`;

    const defaultTitle = {
      [BPMN_NODE_TYPES.START_EVENT]: 'Nuevo Evento de Inicio',
      [BPMN_NODE_TYPES.END_EVENT]: 'Nuevo Evento de Fin',
      [BPMN_NODE_TYPES.USER_TASK]: 'Nueva Tarea de Usuario',
      [BPMN_NODE_TYPES.SERVICE_TASK]: 'Nueva Tarea de Servicio / TI',
      [BPMN_NODE_TYPES.MANUAL_TASK]: 'Nueva Tarea Manual',
      [BPMN_NODE_TYPES.EXCLUSIVE_GATEWAY]: 'Decisión Exclusiva (XOR)',
      [BPMN_NODE_TYPES.PARALLEL_GATEWAY]: 'Bifurcación Paralela (AND)',
      [BPMN_NODE_TYPES.QUALITY_CHECKPOINT_EVENT]: 'Punto de Control de Calidad',
      [BPMN_NODE_TYPES.TIMER_BOUNDARY_EVENT]: 'Control de Plazo Legal',
      [BPMN_NODE_TYPES.SUB_PROCESS]: 'Subproceso Procedimental',
      [BPMN_NODE_TYPES.POOL_LANE]: 'Carril'
    }[nodeType] || 'Nuevo Elemento';

    const newNodeId = `node_${Date.now()}`;
    const newNode: Node<BpmnNodeData> = {
      id: newNodeId,
      type: nodeType,
      position,
      data: {
        standardId,
        title: defaultTitle,
        description: 'Descripción operativa del nodo...',
        nodeType,
        laneId: targetLaneId,
        laneName: targetLane?.name,
        roleName: targetLane?.role,
        itSystem: targetLane?.system || 'Sistema de Gestión',
        legalFramework: 'Art. aplicable',
        inputs: [],
        outputs: [],
        operationalRisks: [],
        tags: []
      }
    };

    projectStore.setProjectData({
      ...currentProject,
      nodes: [...currentProject.nodes, newNode]
    });

    set({ selectedNodeId: newNodeId });
  },

  updateNodeData: (nodeId: string, updates: Partial<BpmnNodeData>) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    const nextNodes = currentProject.nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            ...updates
          }
        };
      }
      return node;
    });

    projectStore.setProjectData({
      ...currentProject,
      nodes: nextNodes
    });
  },

  updateEdgeData: (edgeId: string, updates: Partial<SequenceFlowData>) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    const nextEdges: Edge<SequenceFlowData>[] = currentProject.edges.map(edge => {
      if (edge.id === edgeId) {
        return {
          ...edge,
          data: {
            id: edge.data?.id || edge.id,
            source: edge.data?.source || edge.source,
            target: edge.data?.target || edge.target,
            ...edge.data,
            ...updates
          }
        };
      }
      return edge;
    });

    projectStore.setProjectData({
      ...currentProject,
      edges: nextEdges
    });
  },

  bulkUpdateNodeColors: (filter, colors) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    const nextNodes = currentProject.nodes.map((node) => {
      let match = false;
      if (filter === 'ALL') {
        match = true;
      } else if (typeof filter === 'object') {
        if (filter.nodeType && node.data.nodeType === filter.nodeType) match = true;
        if (filter.laneId && node.data.laneId === filter.laneId) match = true;
      }

      if (match) {
        return {
          ...node,
          data: {
            ...node.data,
            ...colors
          }
        };
      }
      return node;
    });

    projectStore.setProjectData({
      ...currentProject,
      nodes: nextNodes
    });
  },

  bulkUpdateEdgeColors: (colors) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    const nextEdges = currentProject.edges.map((edge) => ({
      ...edge,
      data: {
        id: edge.data?.id || edge.id,
        source: edge.data?.source || edge.source,
        target: edge.data?.target || edge.target,
        ...edge.data,
        ...colors
      }
    }));

    projectStore.setProjectData({
      ...currentProject,
      edges: nextEdges
    });
  },

  deleteSelected: () => {
    const { selectedNodeId, selectedEdgeId } = get();
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    if (selectedNodeId) {
      const nextNodes = currentProject.nodes.filter(n => n.id !== selectedNodeId);
      const nextEdges = currentProject.edges.filter(
        e => e.source !== selectedNodeId && e.target !== selectedNodeId
      );
      projectStore.setProjectData({
        ...currentProject,
        nodes: nextNodes,
        edges: nextEdges
      });
      set({ selectedNodeId: null });
    } else if (selectedEdgeId) {
      const nextEdges = currentProject.edges.filter(e => e.id !== selectedEdgeId);
      projectStore.setProjectData({
        ...currentProject,
        edges: nextEdges
      });
      set({ selectedEdgeId: null });
    }
  },

  addLane: (poolId: string, name: string, role: string, system: string) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    const pool = currentProject.pools.find(p => p.id === poolId) || currentProject.pools[0];
    if (!pool) return;

    const newLaneId = `lane-${Date.now()}`;
    const newLane = {
      id: newLaneId,
      name: name || `Carril ${pool.lanes.length + 1}`,
      role: role || 'Rol Asignado',
      system: system || 'Sistema Informático',
      colorHex: '#3b82f6',
      order: pool.lanes.length
    };

    const nextPools = currentProject.pools.map(p => {
      if (p.id === pool.id) {
        return {
          ...p,
          lanes: [...p.lanes, newLane]
        };
      }
      return p;
    });

    projectStore.setProjectData({
      ...currentProject,
      pools: nextPools
    });
  },

  updateLane: (laneId: string, updates: { name?: string; role?: string; system?: string; colorHex?: string }) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    const nextPools = currentProject.pools.map(p => ({
      ...p,
      lanes: p.lanes.map(l => (l.id === laneId ? { ...l, ...updates } : l))
    }));

    projectStore.setProjectData({
      ...currentProject,
      pools: nextPools
    });
  },

  deleteLane: (laneId: string) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    const nextPools = currentProject.pools.map(p => ({
      ...p,
      lanes: p.lanes.filter(l => l.id !== laneId)
    }));

    projectStore.setProjectData({
      ...currentProject,
      pools: nextPools
    });
  }
}));
