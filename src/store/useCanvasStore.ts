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
import {
  validateSubProcessCompression,
  compressNodesToSubProcess,
  decompressSubProcessToCanvas,
  createClipboardPayload,
  pasteClipboardPayload,
  ValidationResult
} from '../services/subprocessService';

interface CanvasStoreState {
  selectedNodeId: string | null;
  selectedNodeIds: string[];
  selectedEdgeId: string | null;
  clipboardPayload: { nodes: Node<BpmnNodeData>[]; edges: Edge<SequenceFlowData>[] } | null;
  isCompressModalOpen: boolean;

  // React Flow Handlers
  onNodesChange: OnNodesChange<Node<BpmnNodeData>>;
  onEdgesChange: OnEdgesChange<Edge<SequenceFlowData>>;
  onConnect: OnConnect;
  
  // Custom Selection
  selectNode: (nodeId: string | null) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  selectEdge: (edgeId: string | null) => void;
  setCompressModalOpen: (open: boolean) => void;

  // Clipboard (Copy / Paste)
  copySelection: () => boolean;
  pasteSelection: () => boolean;

  // SubProcess Compression & Decompression
  validateSelectionForCompression: () => ValidationResult;
  compressSelection: (title: string, standardId: string, description: string) => { success: boolean; error?: string };
  decompressSubProcess: (subProcessNodeId: string) => { success: boolean; error?: string };

  // Node Manipulation
  addNode: (nodeType: BpmnNodeType, position: { x: number; y: number }, laneId?: string) => void;
  updateNodeData: (nodeId: string, updates: Partial<BpmnNodeData>) => void;
  applyCardStyleToScope: (targetNodeId: string, scope: 'single' | 'same_type' | 'all', styleChanges: Partial<BpmnNodeData>) => void;
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
  selectedNodeIds: [],
  selectedEdgeId: null,
  clipboardPayload: null,
  isCompressModalOpen: false,

  onNodesChange: (changes) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    const nextNodes = applyNodeChanges(changes, currentProject.nodes);
    
    // Update selectedNodeIds based on node selection status
    const selected = nextNodes.filter((n) => n.selected).map((n) => n.id);
    const singleSelected = selected.length === 1 ? selected[0] : (selected.length > 1 ? selected[0] : null);

    set({
      selectedNodeIds: selected,
      selectedNodeId: singleSelected
    });

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
    set({
      selectedNodeId: nodeId,
      selectedNodeIds: nodeId ? [nodeId] : [],
      selectedEdgeId: null
    });
  },

  setSelectedNodeIds: (ids: string[]) => {
    set({
      selectedNodeIds: ids,
      selectedNodeId: ids.length > 0 ? ids[0] : null,
      selectedEdgeId: null
    });
  },

  selectEdge: (edgeId: string | null) => {
    set({
      selectedEdgeId: edgeId,
      selectedNodeId: null,
      selectedNodeIds: []
    });
  },

  setCompressModalOpen: (open: boolean) => set({ isCompressModalOpen: open }),

  // CLIPBOARD OPERATIONS
  copySelection: () => {
    const { selectedNodeIds, selectedNodeId } = get();
    const project = useProjectStore.getState().currentProject;
    if (!project) return false;

    const targetIds = selectedNodeIds.length > 0 ? selectedNodeIds : (selectedNodeId ? [selectedNodeId] : []);
    if (targetIds.length === 0) return false;

    const payload = createClipboardPayload(targetIds, project.nodes, project.edges);
    set({ clipboardPayload: payload });
    return true;
  },

  pasteSelection: () => {
    const { clipboardPayload } = get();
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!clipboardPayload || !currentProject || clipboardPayload.nodes.length === 0) return false;

    const { newNodes, newEdges } = pasteClipboardPayload(clipboardPayload, { x: 40, y: 40 });

    // Deselect current and select newly pasted items
    const updatedExistingNodes = currentProject.nodes.map((n) => ({ ...n, selected: false }));
    const finalNodes = [...updatedExistingNodes, ...newNodes];
    const finalEdges = [...currentProject.edges, ...newEdges];

    projectStore.setProjectData({
      ...currentProject,
      nodes: finalNodes,
      edges: finalEdges
    });

    const newIds = newNodes.map((n) => n.id);
    set({
      selectedNodeIds: newIds,
      selectedNodeId: newIds[0] || null
    });

    return true;
  },

  // SUBPROCESS COMPRESSION & DECOMPRESSION
  validateSelectionForCompression: () => {
    const { selectedNodeIds } = get();
    const project = useProjectStore.getState().currentProject;
    if (!project) {
      return {
        isValid: false,
        incomingEdges: [],
        outgoingEdges: [],
        internalEdges: [],
        error: 'No hay ningún proyecto activo.'
      };
    }

    return validateSubProcessCompression(selectedNodeIds, project.nodes, project.edges);
  },

  compressSelection: (title: string, standardId: string, description: string) => {
    const { selectedNodeIds } = get();
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) {
      return { success: false, error: 'No hay un proyecto activo.' };
    }

    const result = compressNodesToSubProcess(
      selectedNodeIds,
      title,
      standardId,
      description,
      currentProject
    );

    if ('error' in result) {
      return { success: false, error: result.error };
    }

    projectStore.setProjectData(result.project);
    set({
      selectedNodeId: result.newSubProcessId,
      selectedNodeIds: [result.newSubProcessId],
      isCompressModalOpen: false
    });

    return { success: true };
  },

  decompressSubProcess: (subProcessNodeId: string) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) {
      return { success: false, error: 'No hay un proyecto activo.' };
    }

    const result = decompressSubProcessToCanvas(subProcessNodeId, currentProject);
    if ('error' in result) {
      return { success: false, error: result.error };
    }

    projectStore.setProjectData(result.project);
    set({
      selectedNodeIds: result.unpackedNodeIds,
      selectedNodeId: result.unpackedNodeIds[0] || null
    });

    return { success: true };
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
        description: 'Descripción operativa de la actividad...',
        nodeType,
        laneId: targetLaneId,
        laneName: targetLane?.name,
        roleName: targetLane?.role,
        itSystem: targetLane?.system || 'SAM / VUPRA',
        legalFramework: 'Marco normativo general',
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

    set({ selectedNodeId: newNodeId, selectedNodeIds: [newNodeId], selectedEdgeId: null });
  },

  updateNodeData: (nodeId: string, updates: Partial<BpmnNodeData>) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    const nextNodes = currentProject.nodes.map((node) => {
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

  applyCardStyleToScope: (targetNodeId: string, scope: 'single' | 'same_type' | 'all', styleChanges: Partial<BpmnNodeData>) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    const targetNode = currentProject.nodes.find((n) => n.id === targetNodeId);
    if (!targetNode && scope !== 'all') return;

    const targetType = targetNode?.data?.nodeType;

    const nextNodes = currentProject.nodes.map((node) => {
      let shouldApply = false;
      if (scope === 'single') {
        shouldApply = node.id === targetNodeId;
      } else if (scope === 'same_type') {
        shouldApply = node.data.nodeType === targetType;
      } else if (scope === 'all') {
        shouldApply = true;
      }

      if (shouldApply) {
        return {
          ...node,
          data: {
            ...node.data,
            ...styleChanges
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

    const nextEdges = currentProject.edges.map((edge) => {
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
      let matches = false;
      if (filter === 'ALL') {
        matches = true;
      } else if (filter.nodeType && node.data.nodeType === filter.nodeType) {
        matches = true;
      } else if (filter.laneId && node.data.laneId === filter.laneId) {
        matches = true;
      }

      if (matches) {
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
    const { selectedNodeIds, selectedNodeId, selectedEdgeId } = get();
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    const targetNodeIds = selectedNodeIds.length > 0 ? selectedNodeIds : (selectedNodeId ? [selectedNodeId] : []);

    if (targetNodeIds.length > 0) {
      const deleteSet = new Set(targetNodeIds);
      const nextNodes = currentProject.nodes.filter(n => !deleteSet.has(n.id));
      const nextEdges = currentProject.edges.filter(
        e => !deleteSet.has(e.source) && !deleteSet.has(e.target)
      );
      projectStore.setProjectData({
        ...currentProject,
        nodes: nextNodes,
        edges: nextEdges
      });
      set({ selectedNodeId: null, selectedNodeIds: [] });
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
