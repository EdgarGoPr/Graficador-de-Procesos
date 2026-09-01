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
  addLane: (poolId?: string, name?: string, role?: string, system?: string, colorHex?: string) => void;
  updateLane: (laneId: string, updates: { name?: string; role?: string; system?: string; colorHex?: string }) => void;
  moveLane: (laneId: string, direction: 'up' | 'down') => void;
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

    // Apply Real Magnetic Snapping during drag
    const SNAP_RADIUS = 16;
    const GAP_X = 40;
    const GAP_Y = 30;

    const modifiedChanges = changes.map((change) => {
      if (change.type === 'position' && change.position && change.dragging) {
        const draggingNode = currentProject.nodes.find((n) => n.id === change.id);
        if (!draggingNode || draggingNode.type === 'PoolLane') return change;

        const dWidth = (draggingNode.measured?.width || draggingNode.width || 210) as number;
        const dHeight = (draggingNode.measured?.height || draggingNode.height || 120) as number;

        let snapX = change.position.x;
        let snapY = change.position.y;

        const otherNodes = currentProject.nodes.filter(
          (n) => n.id !== change.id && n.type !== 'PoolLane'
        );

        for (const other of otherNodes) {
          const oWidth = (other.measured?.width || other.width || 210) as number;
          const oHeight = (other.measured?.height || other.height || 120) as number;
          const oX = other.position.x;
          const oY = other.position.y;

          // --- HORIZONTAL AXIS SNAP (X) ---
          // 1. Center to Center
          if (Math.abs((snapX + dWidth / 2) - (oX + oWidth / 2)) <= SNAP_RADIUS) {
            snapX = oX + oWidth / 2 - dWidth / 2;
          }
          // 2. Left to Left
          else if (Math.abs(snapX - oX) <= SNAP_RADIUS) {
            snapX = oX;
          }
          // 3. Right to Right
          else if (Math.abs((snapX + dWidth) - (oX + oWidth)) <= SNAP_RADIUS) {
            snapX = oX + oWidth - dWidth;
          }
          // 4. Side-by-Side Right (Snap to the right of other with Gap)
          else if (Math.abs(snapX - (oX + oWidth + GAP_X)) <= SNAP_RADIUS) {
            snapX = oX + oWidth + GAP_X;
          }
          // 5. Side-by-Side Left (Snap to the left of other with Gap)
          else if (Math.abs((snapX + dWidth) - (oX - GAP_X)) <= SNAP_RADIUS) {
            snapX = oX - GAP_X - dWidth;
          }

          // --- VERTICAL AXIS SNAP (Y) ---
          // 1. Center to Center
          if (Math.abs((snapY + dHeight / 2) - (oY + oHeight / 2)) <= SNAP_RADIUS) {
            snapY = oY + oHeight / 2 - dHeight / 2;
          }
          // 2. Top to Top
          else if (Math.abs(snapY - oY) <= SNAP_RADIUS) {
            snapY = oY;
          }
          // 3. Bottom to Bottom
          else if (Math.abs((snapY + dHeight) - (oY + oHeight)) <= SNAP_RADIUS) {
            snapY = oY + oHeight - dHeight;
          }
          // 4. Stacked Below (Snap below other with Gap)
          else if (Math.abs(snapY - (oY + oHeight + GAP_Y)) <= SNAP_RADIUS) {
            snapY = oY + oHeight + GAP_Y;
          }
          // 5. Stacked Above (Snap above other with Gap)
          else if (Math.abs((snapY + dHeight) - (oY - GAP_Y)) <= SNAP_RADIUS) {
            snapY = oY - GAP_Y - dHeight;
          }
        }

        return {
          ...change,
          position: {
            x: snapX,
            y: snapY
          }
        };
      }
      return change;
    });

    const nextNodes = applyNodeChanges(modifiedChanges, currentProject.nodes);
    
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
    else if (nodeType === BPMN_NODE_TYPES.POOL_LANE) prefix = 'LANE';

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
      [BPMN_NODE_TYPES.POOL_LANE]: `Carril Funcional #${count}`
    }[nodeType] || 'Nuevo Elemento';

    const isLane = nodeType === BPMN_NODE_TYPES.POOL_LANE;
    const newNodeId = isLane ? `lane_node_${Date.now()}` : `node_${Date.now()}`;
    const newNode: Node<BpmnNodeData> = {
      id: newNodeId,
      type: nodeType,
      position,
      style: isLane ? { width: 2200, height: 160, zIndex: -1 } : undefined,
      zIndex: isLane ? -1 : 1,
      data: {
        standardId,
        title: defaultTitle,
        description: isLane ? 'Carril contenedor de actividades' : 'Descripción operativa de la actividad...',
        nodeType,
        laneId: isLane ? newNodeId : targetLaneId,
        laneName: targetLane?.name,
        roleName: targetLane?.role || 'Responsable de Área',
        itSystem: targetLane?.system || 'SAM / VUPRA',
        legalFramework: 'Marco normativo general',
        customBorderColor: isLane ? '#38bdf8' : undefined,
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

  addLane: (poolId?: string, name?: string, role?: string, system?: string, colorHex?: string) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    const pool = currentProject.pools.find(p => p.id === poolId) || currentProject.pools[0];
    if (!pool) return;

    const newLaneId = `lane-${Date.now()}`;
    const defaultColors = ['#38bdf8', '#818cf8', '#34d399', '#f59e0b', '#ec4899', '#06b6d4', '#a855f7', '#64748b'];
    const chosenColor = colorHex || defaultColors[pool.lanes.length % defaultColors.length];

    const newLane = {
      id: newLaneId,
      name: name || `Nuevo Carril ${pool.lanes.length + 1}`,
      role: role || 'Responsable de Área',
      system: system || 'Sistema Informático',
      colorHex: chosenColor,
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

  moveLane: (laneId: string, direction: 'up' | 'down') => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject || !currentProject.pools[0]?.lanes) return;

    const pool = currentProject.pools[0];
    const lanes = [...pool.lanes];
    const index = lanes.findIndex(l => l.id === laneId);
    if (index === -1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lanes.length) return;

    const laneA = lanes[index];
    const laneB = lanes[targetIndex];

    // Swap lanes in array
    lanes[index] = laneB;
    lanes[targetIndex] = laneA;
    lanes.forEach((l, i) => { l.order = i; });

    const deltaYA = (targetIndex - index) * 140;
    const deltaYB = (index - targetIndex) * 140;

    // Shift nodes belonging to laneA and laneB
    const nextNodes = currentProject.nodes.map(node => {
      if (node.data?.laneId === laneA.id) {
        return {
          ...node,
          position: {
            ...node.position,
            y: node.position.y + deltaYA
          }
        };
      } else if (node.data?.laneId === laneB.id) {
        return {
          ...node,
          position: {
            ...node.position,
            y: node.position.y + deltaYB
          }
        };
      }
      return node;
    });

    const nextPools = currentProject.pools.map(p => {
      if (p.id === pool.id) {
        return { ...p, lanes };
      }
      return p;
    });

    projectStore.setProjectData({
      ...currentProject,
      pools: nextPools,
      nodes: nextNodes
    });
  },

  deleteLane: (laneId: string) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject || !currentProject.pools[0]?.lanes) return;

    const pool = currentProject.pools[0];
    if (pool.lanes.length <= 1) {
      alert('El proceso debe tener al menos un carril operativo.');
      return;
    }

    const deletedIndex = pool.lanes.findIndex(l => l.id === laneId);
    if (deletedIndex === -1) return;

    const remainingLanes = pool.lanes.filter(l => l.id !== laneId);
    remainingLanes.forEach((l, i) => { l.order = i; });

    // Target lane for reassignment
    const targetLane = remainingLanes[Math.min(deletedIndex, remainingLanes.length - 1)];

    // Shift up all nodes in subsequent lanes and reassign nodes in deleted lane
    const nextNodes = currentProject.nodes.map(node => {
      if (node.data?.laneId === laneId) {
        return {
          ...node,
          data: {
            ...node.data,
            laneId: targetLane.id
          }
        };
      }

      const originalLaneIndex = pool.lanes.findIndex(l => l.id === node.data?.laneId);
      if (originalLaneIndex > deletedIndex) {
        return {
          ...node,
          position: {
            ...node.position,
            y: node.position.y - 140
          }
        };
      }
      return node;
    });

    const nextPools = currentProject.pools.map(p => {
      if (p.id === pool.id) {
        return { ...p, lanes: remainingLanes };
      }
      return p;
    });

    projectStore.setProjectData({
      ...currentProject,
      pools: nextPools,
      nodes: nextNodes
    });
  }
}));
