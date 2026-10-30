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
import { PrintFrame, PageFormat, PageOrientation, DEFAULT_PAGE_DIMENSIONS } from '../types/printFrame';
import { calculateAutoFrames } from '../services/pdfDiagramExportService';
import { useProjectStore } from './useProjectStore';
import {
  validateSubProcessCompression,  compressNodesInGraph,
  decompressSubProcessInGraph,
  createClipboardPayload,
  pasteClipboardPayload,
  ValidationResult
} from '../services/subprocessService';
import type { ProcessProjectFile } from '../types/project';
import {
  getCurrentProcessInfo,
  getNextSubProcessCode,
  formatHierarchicalStandardId,
  getAllProjectProcesses
} from '../services/processHierarchyService';

export interface SubProcessPathItem {
  id: string;
  title: string;
  standardId: string;
}

// Helper: Traverse down the tree to get the active nodes and edges for the given subProcessPath
export function getGraphForPath(
  project: ProcessProjectFile | null,
  path: SubProcessPathItem[]
): { nodes: Node<BpmnNodeData>[]; edges: Edge<SequenceFlowData>[] } {
  if (!project) return { nodes: [], edges: [] };
  if (!path || path.length === 0) {
    return { nodes: project.nodes || [], edges: project.edges || [] };
  }

  let currentNodes: Node<BpmnNodeData>[] = project.nodes || [];
  let currentEdges: Edge<SequenceFlowData>[] = project.edges || [];

  for (let i = 0; i < path.length; i++) {
    const step = path[i];
    const subNode = currentNodes.find((n) => n.id === step.id);
    if (!subNode) {
      return { nodes: [], edges: [] };
    }

    if (subNode.data.subProcessCanvas && subNode.data.subProcessCanvas.nodes !== undefined) {
      currentNodes = subNode.data.subProcessCanvas.nodes;
      currentEdges = subNode.data.subProcessCanvas.edges || [];
    } else if (subNode.data.compressedSnapshot && subNode.data.compressedSnapshot.nodes?.length) {
      const snap = subNode.data.compressedSnapshot;
      currentNodes = snap.nodes.map((sn) => ({
        id: sn.id,
        type: sn.type || (sn.data?.nodeType as any) || 'UserTask',
        position: { x: sn.relativeX, y: sn.relativeY },
        style: sn.width && sn.height ? { width: sn.width, height: sn.height } : undefined,
        data: sn.data,
      }));
      currentEdges = (snap.internalEdges || []).map((se) => ({
        id: se.id,
        source: se.source,
        target: se.target,
        type: 'sequenceFlow',
        data: se.data,
      }));
    } else {
      // Empty or newly created subprocess: generate initial standard flow
      const allProc = getAllProjectProcesses(project);
      const matched = allProc.find((p) => p.id === subNode.id);
      const procCode = subNode.data?.processCode || matched?.code || `P${(i + 2) < 10 ? '0' + (i + 2) : i + 2}`;
      const lvlCode = `N${(i + 1) < 10 ? '0' + (i + 1) : i + 1}`;

      const startId = `start_${subNode.id}_${Date.now()}`;
      const taskId = `task_${subNode.id}_${Date.now()}`;
      const endId = `end_${subNode.id}_${Date.now()}`;
      currentNodes = [
        {
          id: startId,
          type: 'StartEvent',
          position: { x: 100, y: 160 },
          data: {
            standardId: `${procCode}-${lvlCode}-INI-01`,
            title: `Inicio de ${step.title}`,
            description: 'Disparador formal de ingreso a este subproceso',
            nodeType: 'StartEvent',
            laneId: subNode.data.laneId || 'lane_1',
            itSystem: subNode.data.itSystem || 'Gestión',
            legalFramework: subNode.data.legalFramework || '',
            inputs: [],
            outputs: [],
            operationalRisks: [],
            tags: ['Subproceso'],
          },
        },
        {
          id: taskId,
          type: 'UserTask',
          position: { x: 280, y: 130 },
          data: {
            standardId: `${procCode}-${lvlCode}-TSK-01`,
            title: 'Ejecución de Etapa Principal',
            description: 'Procedimiento operativo interno',
            nodeType: 'UserTask',
            laneId: subNode.data.laneId || 'lane_1',
            itSystem: subNode.data.itSystem || 'Gestión',
            legalFramework: subNode.data.legalFramework || '',
            inputs: [],
            outputs: [],
            operationalRisks: [],
            tags: ['Subproceso'],
          },
        },
        {
          id: endId,
          type: 'EndEvent',
          position: { x: 560, y: 160 },
          data: {
            standardId: `${procCode}-${lvlCode}-FIN-01`,
            title: `Fin de ${step.title}`,
            description: 'Culminación de la etapa',
            nodeType: 'EndEvent',
            laneId: subNode.data.laneId || 'lane_1',
            itSystem: subNode.data.itSystem || 'Gestión',
            legalFramework: subNode.data.legalFramework || '',
            inputs: [],
            outputs: [],
            operationalRisks: [],
            tags: ['Subproceso'],
          },
        },
      ];
      currentEdges = [
        {
          id: `flow_${startId}_${taskId}`,
          source: startId,
          target: taskId,
          type: 'sequenceFlow',
          data: { id: `flow_${startId}_${taskId}`, source: startId, target: taskId },
        },
        {
          id: `flow_${taskId}_${endId}`,
          source: taskId,
          target: endId,
          type: 'sequenceFlow',
          data: { id: `flow_${taskId}_${endId}`, source: taskId, target: endId },
        },
      ];
    }
  }

  return { nodes: currentNodes, edges: currentEdges };
}

// Helper: Immutably update the active level in project recursively
export function updateGraphForPath(
  project: ProcessProjectFile,
  path: SubProcessPathItem[],
  newNodes: Node<BpmnNodeData>[],
  newEdges: Edge<SequenceFlowData>[]
): ProcessProjectFile {
  if (!path || path.length === 0) {
    return {
      ...project,
      nodes: newNodes,
      edges: newEdges,
    };
  }

  function updateRecursive(
    nodes: Node<BpmnNodeData>[],
    edges: Edge<SequenceFlowData>[],
    pathIndex: number
  ): { nodes: Node<BpmnNodeData>[]; edges: Edge<SequenceFlowData>[] } {
    const currentStep = path[pathIndex];
    const isLeaf = pathIndex === path.length - 1;

    const updatedNodes = nodes.map((node) => {
      if (node.id !== currentStep.id) return node;

      if (isLeaf) {
        const steps = newNodes
          .filter((n) => n.type !== 'PoolLane')
          .map((n, idx) => ({
            id: `step_${n.id}`,
            stepNumber: idx + 1,
            title: n.data?.title || `Paso ${idx + 1}`,
            description: n.data?.description || '',
            role: n.data?.roleName || 'Operador',
            system: n.data?.itSystem || 'Sistema Interno',
            duration: n.data?.slaDuration?.iso8601String || 'P1D',
            inputs: n.data?.inputs || [],
            outputs: n.data?.outputs || [],
            qualityCheck: n.data?.qualityCheckpoint?.inspectionCriteria,
            risk: n.data?.operationalRisks?.[0]?.description,
          }));

        return {
          ...node,
          data: {
            ...node.data,
            subProcessCanvas: {
              nodes: newNodes,
              edges: newEdges,
            },
            subProcessSteps: steps,
          },
        };
      } else {
        const childCanvas =
          node.data.subProcessCanvas || getGraphForPath(project, path.slice(0, pathIndex + 1));
        const updatedChild = updateRecursive(childCanvas.nodes, childCanvas.edges, pathIndex + 1);

        return {
          ...node,
          data: {
            ...node.data,
            subProcessCanvas: {
              nodes: updatedChild.nodes,
              edges: updatedChild.edges,
            },
          },
        };
      }
    });

    return { nodes: updatedNodes, edges };
  }

  const result = updateRecursive(project.nodes, project.edges, 0);
  return {
    ...project,
    nodes: result.nodes,
    edges: result.edges,
  };
}

interface CanvasStoreState {
  selectedNodeId: string | null;
  selectedNodeIds: string[];
  selectedEdgeId: string | null;
  clipboardPayload: { nodes: Node<BpmnNodeData>[]; edges: Edge<SequenceFlowData>[] } | null;
  isCompressModalOpen: boolean;
  isCanvasLocked: boolean; // Modo fijado global: ningún elemento se desplaza y arrastrar sobre ellos desplaza el mapa
  isPrintOverlayVisible: boolean; // Visibilidad de recuadros punteados de impresión

  // Hierarchical SubProcess Navigation (Recursive N-levels)
  subProcessPath: SubProcessPathItem[];
  enterSubProcess: (subProcessNodeId: string) => void;
  leaveSubProcess: () => void;
  jumpToSubProcessLevel: (levelIndex: number) => void;
  navigateToSubProcessPath: (path: SubProcessPathItem[]) => void;
  getActiveGraph: () => { nodes: Node<BpmnNodeData>[]; edges: Edge<SequenceFlowData>[] };
  setActiveGraph: (nodes: Node<BpmnNodeData>[], edges: Edge<SequenceFlowData>[]) => void;
  pendingFocusNodeId: string | null;
  setPendingFocusNodeId: (id: string | null) => void;

  // React Flow Handlers
  onNodesChange: OnNodesChange<Node<BpmnNodeData>>;
  onEdgesChange: OnEdgesChange<Edge<SequenceFlowData>>;
  onConnect: OnConnect;
  
  // Custom Selection
  selectNode: (nodeId: string | null) => void;
  setSelectedNodeIds: (ids: string[]) => void;
  selectEdge: (edgeId: string | null) => void;
  setCompressModalOpen: (open: boolean) => void;

  // Print Frames Management
  togglePrintOverlay: () => void;
  setPrintOverlayVisible: (visible: boolean) => void;
  addPrintFrame: (format?: PageFormat, orientation?: PageOrientation) => void;
  updatePrintFrame: (frameId: string, updates: Partial<PrintFrame>) => void;
  deletePrintFrame: (frameId: string) => void;
  autoLayoutPrintFrames: (format?: PageFormat, orientation?: PageOrientation) => void;

  // Lock / Pin controls
  toggleCanvasLock: () => void;
  toggleLockSelected: () => void;
  setNodeLock: (nodeId: string, isLocked: boolean) => void;

  // Clipboard (Copy / Paste)
  copySelection: () => boolean;
  pasteSelection: () => boolean;

  // SubProcess Compression & Decompression
  validateSelectionForCompression: () => ValidationResult;
  compressSelection: (title: string, standardId: string, description: string) => { success: boolean; error?: string };
  decompressSubProcess: (subProcessNodeId: string) => { success: boolean; error?: string };

  // Node Manipulation
  addNode: (nodeType: BpmnNodeType, position: { x: number; y: number }, laneId?: string) => void;
  addConnectedNode: (sourceNodeId: string, nodeType: BpmnNodeType, targetPosition?: { x: number; y: number }) => string | undefined;
  updateNodeData: (nodeId: string, updates: Partial<BpmnNodeData>) => void;
  applyCardStyleToScope: (targetNodeId: string, scope: 'single' | 'same_type' | 'all', styleChanges: Partial<BpmnNodeData>) => void;
  updateEdgeData: (edgeId: string, updates: Partial<SequenceFlowData>, pushSnapshot?: boolean) => void;
  bulkUpdateNodeColors: (filter: { nodeType?: BpmnNodeType; laneId?: string } | 'ALL', colors: { customBgColor?: string; customBorderColor?: string; customTextColor?: string }) => void;
  bulkUpdateEdgeColors: (colors: { strokeColor?: string; strokeWidth?: number; isAnimated?: boolean }) => void;
  deleteSelected: () => void;
  setNodeRelatedCard: (noteId: string, targetNodeId: string | null) => void;
  
  // Lane & Pool management
  addLane: (poolId?: string, name?: string, role?: string, system?: string, colorHex?: string) => string | undefined;
  updateLane: (laneId: string, updates: { name?: string; role?: string; system?: string; colorHex?: string }) => void;
  moveLane: (laneId: string, direction: 'up' | 'down') => void;
  deleteLane: (laneId: string) => void;
  alignAllLanes: () => void;
}

export const useCanvasStore = create<CanvasStoreState>((set, get) => ({
  selectedNodeId: null,
  selectedNodeIds: [],
  selectedEdgeId: null,
  clipboardPayload: null,
  isCompressModalOpen: false,
  isCanvasLocked: false,
  isPrintOverlayVisible: false,
  subProcessPath: [],
  pendingFocusNodeId: null,
  setPendingFocusNodeId: (id: string | null) => set({ pendingFocusNodeId: id }),

  getActiveGraph: () => {
    const project = useProjectStore.getState().currentProject;
    const path = get().subProcessPath;
    return getGraphForPath(project, path);
  },

  setActiveGraph: (nodes: Node<BpmnNodeData>[], edges: Edge<SequenceFlowData>[]) => {
    const projectStore = useProjectStore.getState();
    const project = projectStore.currentProject;
    if (!project) return;
    const path = get().subProcessPath;
    const nextProject = updateGraphForPath(project, path, nodes, edges);
    projectStore.setProjectData(nextProject);
  },

  enterSubProcess: (nodeId: string) => {
    const project = useProjectStore.getState().currentProject;
    if (!project) return;
    const active = get().getActiveGraph();
    const targetNode = active.nodes.find((n) => n.id === nodeId);
    if (!targetNode) return;

    useProjectStore.getState().pushSnapshot(`Ingresar al subproceso ${targetNode.data.title}`);

    const newPathItem: SubProcessPathItem = {
      id: targetNode.id,
      title: targetNode.data.title || 'Subproceso',
      standardId: targetNode.data.standardId || 'SUB',
    };
    const nextPath = [...get().subProcessPath, newPathItem];

    // Ensure child canvas is initialized in project
    const subGraph = getGraphForPath(project, nextPath);
    const updatedProject = updateGraphForPath(project, nextPath, subGraph.nodes, subGraph.edges);
    useProjectStore.getState().setProjectData(updatedProject);

    set({
      subProcessPath: nextPath,
      selectedNodeId: null,
      selectedNodeIds: [],
      selectedEdgeId: null,
    });
  },

  leaveSubProcess: () => {
    const path = get().subProcessPath;
    if (path.length === 0) return;
    const lastStep = path[path.length - 1];
    set({
      subProcessPath: path.slice(0, -1),
      selectedNodeId: lastStep?.id || null,
      selectedNodeIds: lastStep?.id ? [lastStep.id] : [],
      selectedEdgeId: null,
      pendingFocusNodeId: lastStep?.id || null,
    });
  },

  jumpToSubProcessLevel: (levelIndex: number) => {
    const path = get().subProcessPath;
    if (levelIndex < 0) {
      const focusId = path[0]?.id || null;
      set({
        subProcessPath: [],
        selectedNodeId: focusId,
        selectedNodeIds: focusId ? [focusId] : [],
        selectedEdgeId: null,
        pendingFocusNodeId: focusId,
      });
      return;
    }
    if (levelIndex < path.length) {
      const focusId = path[levelIndex + 1]?.id || null;
      set({
        subProcessPath: path.slice(0, levelIndex + 1),
        selectedNodeId: focusId,
        selectedNodeIds: focusId ? [focusId] : [],
        selectedEdgeId: null,
        pendingFocusNodeId: focusId,
      });
    }
  },

  navigateToSubProcessPath: (targetPath: SubProcessPathItem[]) => {
    const currentPath = get().subProcessPath;
    const project = useProjectStore.getState().currentProject;
    if (!project) return;

    let focusId: string | null = null;
    if (targetPath.length < currentPath.length) {
      focusId = currentPath[targetPath.length]?.id || null;
    }

    if (!targetPath || targetPath.length === 0) {
      set({
        subProcessPath: [],
        selectedNodeId: focusId,
        selectedNodeIds: focusId ? [focusId] : [],
        selectedEdgeId: null,
        pendingFocusNodeId: focusId,
      });
      return;
    }

    // Ensure child canvas is initialized in project
    const subGraph = getGraphForPath(project, targetPath);
    const updatedProject = updateGraphForPath(project, targetPath, subGraph.nodes, subGraph.edges);
    useProjectStore.getState().setProjectData(updatedProject);

    set({
      subProcessPath: targetPath,
      selectedNodeId: focusId,
      selectedNodeIds: focusId ? [focusId] : [],
      selectedEdgeId: null,
      pendingFocusNodeId: focusId,
    });
  },

  togglePrintOverlay: () => {
    const current = get().isPrintOverlayVisible;
    const next = !current;
    set({ isPrintOverlayVisible: next });

    if (next) {
      const projectStore = useProjectStore.getState();
      const currentProject = projectStore.currentProject;
      if (currentProject && (!currentProject.printFrames || currentProject.printFrames.length === 0)) {
        const frames = calculateAutoFrames(currentProject, 'A4', 'landscape');
        projectStore.setProjectData({
          ...currentProject,
          printFrames: frames,
        });
      }
    }
  },

  setPrintOverlayVisible: (visible: boolean) => {
    set({ isPrintOverlayVisible: visible });
  },

  addPrintFrame: (format: PageFormat = 'A4', orientation: PageOrientation = 'landscape') => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    const existingFrames = currentProject.printFrames || [];
    const dim = DEFAULT_PAGE_DIMENSIONS[format][orientation];
    const lastFrame = existingFrames[existingFrames.length - 1];
    const newX = lastFrame ? lastFrame.x + lastFrame.width + 60 : 0;
    const newY = lastFrame ? lastFrame.y : 0;

    const newFrame: PrintFrame = {
      id: `frame_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      pageNumber: existingFrames.length + 1,
      format,
      orientation,
      x: Math.round(newX),
      y: Math.round(newY),
      width: dim.width,
      height: dim.height,
    };

    const nextFrames = [...existingFrames, newFrame].map((f, idx) => ({ ...f, pageNumber: idx + 1 }));
    projectStore.setProjectData({
      ...currentProject,
      printFrames: nextFrames,
    });
    set({ isPrintOverlayVisible: true });
  },

  updatePrintFrame: (frameId: string, updates: Partial<PrintFrame>) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    const existingFrames = currentProject.printFrames || [];
    const nextFrames = existingFrames.map((f) => {
      if (f.id === frameId) {
        const updated = { ...f, ...updates };
        if ((updates.format || updates.orientation) && !updates.width && !updates.height) {
          const dim = DEFAULT_PAGE_DIMENSIONS[updated.format][updated.orientation];
          updated.width = dim.width;
          updated.height = dim.height;
        }
        return updated;
      }
      return f;
    });

    projectStore.setProjectData({
      ...currentProject,
      printFrames: nextFrames,
    });
  },

  deletePrintFrame: (frameId: string) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    const existingFrames = currentProject.printFrames || [];
    const nextFrames = existingFrames
      .filter((f) => f.id !== frameId)
      .map((f, idx) => ({ ...f, pageNumber: idx + 1 }));

    projectStore.setProjectData({
      ...currentProject,
      printFrames: nextFrames,
    });
  },

  autoLayoutPrintFrames: (format: PageFormat = 'A4', orientation: PageOrientation = 'landscape') => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    const frames = calculateAutoFrames(currentProject, format, orientation);
    projectStore.setProjectData({
      ...currentProject,
      printFrames: frames,
    });
    set({ isPrintOverlayVisible: true });
  },

  onNodesChange: (changes) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    const { isCanvasLocked } = get();
    const activeGraph = get().getActiveGraph();

    // Filter out drag position changes if canvas is locked or if the specific node is locked
    const validChanges = changes.filter((change) => {
      if (change.type === 'position' && change.dragging) {
        if (isCanvasLocked) return false;
        const draggingNode = activeGraph.nodes.find((n) => n.id === change.id);
        if (draggingNode?.data?.isLocked) return false;
      }
      return true;
    });

    // Apply Real Magnetic Snapping during drag    const LANE_SNAP = 25;
    const modifiedChanges = validChanges.map((change) => {
      if (change.type === 'position' && change.position && change.dragging) {
        const draggingNode = activeGraph.nodes.find((n) => n.id === change.id);
        if (!draggingNode) return change;

        const isDraggingLane = draggingNode.type === 'PoolLane';
        const dWidth = (draggingNode.style?.width as number) || (draggingNode.measured?.width || draggingNode.width || (isDraggingLane ? 2200 : 210)) as number;
        const dHeight = (draggingNode.style?.height as number) || (draggingNode.measured?.height || draggingNode.height || (isDraggingLane ? 160 : 120)) as number;

        let snapX = change.position.x;
        let snapY = change.position.y;

        if (isDraggingLane) {
          // --- LANE TO LANE SNAPPING (Carriles funcionales que se apilan con contacto 0px) ---
          const otherLanes = activeGraph.nodes.filter(
            (n) => n.id !== change.id && n.type === 'PoolLane'
          );

          for (const other of otherLanes) {
            const oWidth = (other.style?.width as number) || (other.measured?.width || other.width || 2200) as number;
            const oHeight = (other.style?.height as number) || (other.measured?.height || other.height || 160) as number;
            const oX = other.position.x;
            const oY = other.position.y;

            // 1. Left X Align (Snap to same left margin)
            if (Math.abs(snapX - oX) <= LANE_SNAP) {
              snapX = oX;
            }
            // 2. Right X Align
            else if (Math.abs((snapX + dWidth) - (oX + oWidth)) <= LANE_SNAP) {
              snapX = oX + oWidth - dWidth;
            }

            // 3. Stack Below (0px gap contact)
            if (Math.abs(snapY - (oY + oHeight)) <= LANE_SNAP) {
              snapY = oY + oHeight;
            }
            // 4. Stack Above (0px gap contact)
            else if (Math.abs((snapY + dHeight) - oY) <= LANE_SNAP) {
              snapY = oY - dHeight;
            }

            // 5. Vertical Lane: Stack Right
            if (Math.abs(snapX - (oX + oWidth)) <= LANE_SNAP) {
              snapX = oX + oWidth;
            }
            // 6. Vertical Lane: Stack Left
            else if (Math.abs((snapX + dWidth) - oX) <= LANE_SNAP) {
              snapX = oX - dWidth;
            }
            // 7. Vertical Lane: Top Y Align
            if (Math.abs(snapY - oY) <= LANE_SNAP) {
              snapY = oY;
            }
          }
        }
        // Las tarjetas regulares se mueven de forma 100% fluida, suave y continua,
        // quedando exactamente en las coordenadas donde el usuario las suelta.

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

    const nextNodes = applyNodeChanges(modifiedChanges, activeGraph.nodes);
    
    // Update selectedNodeIds based on node selection status
    const selected = nextNodes.filter((n) => n.selected).map((n) => n.id);
    const singleSelected = selected.length === 1 ? selected[0] : (selected.length > 1 ? selected[0] : null);

    set({
      selectedNodeIds: selected,
      selectedNodeId: singleSelected
    });

    get().setActiveGraph(nextNodes, activeGraph.edges);
  },

  onEdgesChange: (changes) => {
    const activeGraph = get().getActiveGraph();
    const nextEdges = applyEdgeChanges(changes, activeGraph.edges);
    get().setActiveGraph(activeGraph.nodes, nextEdges);
  },

  onConnect: (connection: Connection) => {
    const activeGraph = get().getActiveGraph();
    if (!connection.source || !connection.target) return;

    useProjectStore.getState().pushSnapshot('Crear conexión');

    const sourceNode = activeGraph.nodes.find((n) => n.id === connection.source);
    const targetNode = activeGraph.nodes.find((n) => n.id === connection.target);
    const isStickySource = sourceNode?.type === 'StickyNote';
    const isStickyTarget = targetNode?.type === 'StickyNote';
    const isAssociation = isStickySource || isStickyTarget;

    const newEdge: Edge<SequenceFlowData> = {
      id: `e_${connection.source}_${connection.target}_${Date.now()}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle,
      targetHandle: connection.targetHandle,
      type: 'sequenceFlow',
      style: isAssociation ? { strokeDasharray: '4,4' } : undefined,
      data: {
        id: `e_${connection.source}_${connection.target}`,
        source: connection.source,
        target: connection.target,
        conditionText: '',
        isAssociation
      }
    };

    let nextNodes = activeGraph.nodes;
    if (isStickySource && targetNode && !isStickyTarget) {
      nextNodes = nextNodes.map((n) =>
        n.id === sourceNode.id ? { ...n, data: { ...n.data, relatedNodeId: targetNode.id } } : n
      );
    } else if (isStickyTarget && sourceNode && !isStickySource) {
      nextNodes = nextNodes.map((n) =>
        n.id === targetNode.id ? { ...n, data: { ...n.data, relatedNodeId: sourceNode.id } } : n
      );
    }

    const nextEdges = addEdge(newEdge, activeGraph.edges);
    get().setActiveGraph(nextNodes, nextEdges);
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

  // Lock / Pin controls
  toggleCanvasLock: () => set((state) => ({ isCanvasLocked: !state.isCanvasLocked })),

  toggleLockSelected: () => {
    const { selectedNodeIds, selectedNodeId } = get();
    const ids = selectedNodeIds.length > 0 ? selectedNodeIds : (selectedNodeId ? [selectedNodeId] : []);
    if (ids.length === 0) return;

    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    projectStore.pushSnapshot('Fijar/Desfijar elementos');

    // Check if any of the selected nodes are unlocked
    const anyUnlocked = currentProject.nodes.some((n) => ids.includes(n.id) && !n.data?.isLocked);
    const targetState = anyUnlocked; // If any is unlocked, lock all; otherwise unlock all

    const nextNodes = currentProject.nodes.map((node) => {
      if (ids.includes(node.id)) {
        return {
          ...node,
          data: {
            ...node.data,
            isLocked: targetState
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

  setNodeLock: (nodeId: string, isLocked: boolean) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    projectStore.pushSnapshot('Fijar/Desfijar elemento');

    const nextNodes = currentProject.nodes.map((node) => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            isLocked
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

  // CLIPBOARD OPERATIONS
  copySelection: () => {
    const { selectedNodeIds, selectedNodeId } = get();
    const active = get().getActiveGraph();

    const targetIds = selectedNodeIds.length > 0 ? selectedNodeIds : (selectedNodeId ? [selectedNodeId] : []);
    if (targetIds.length === 0) return false;

    const payload = createClipboardPayload(targetIds, active.nodes, active.edges);
    set({ clipboardPayload: payload });
    return true;
  },

  pasteSelection: () => {
    const { clipboardPayload } = get();
    if (!clipboardPayload || clipboardPayload.nodes.length === 0) return false;

    useProjectStore.getState().pushSnapshot('Pegar elementos');
    const active = get().getActiveGraph();

    const { newNodes, newEdges } = pasteClipboardPayload(clipboardPayload, { x: 40, y: 40 });

    // Deselect current and select newly pasted items
    const updatedExistingNodes = active.nodes.map((n) => ({ ...n, selected: false }));
    const finalNodes = [...updatedExistingNodes, ...newNodes];
    const finalEdges = [...active.edges, ...newEdges];

    get().setActiveGraph(finalNodes, finalEdges);

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
    const active = get().getActiveGraph();
    if (!active.nodes.length) {
      return {
        isValid: false,
        incomingEdges: [],
        outgoingEdges: [],
        internalEdges: [],
        error: 'No hay elementos en el lienzo actual.'
      };
    }

    return validateSubProcessCompression(selectedNodeIds, active.nodes, active.edges);
  },

  compressSelection: (title: string, standardId: string, description: string) => {
    const { selectedNodeIds } = get();
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) {
      return { success: false, error: 'No hay un proyecto activo.' };
    }

    projectStore.pushSnapshot('Comprimir subproceso');

    const active = get().getActiveGraph();
    const result = compressNodesInGraph(
      selectedNodeIds,
      title,
      standardId,
      description,
      active.nodes,
      active.edges,
      currentProject.pools[0]?.lanes[0]?.id,
      currentProject.pools[0]?.lanes[0]?.name,
      currentProject.pools[0]?.lanes[0]?.role
    );

    if ('error' in result) {
      return { success: false, error: result.error };
    }

    get().setActiveGraph(result.nodes, result.edges);
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

    projectStore.pushSnapshot('Descomprimir subproceso');

    const active = get().getActiveGraph();
    const result = decompressSubProcessInGraph(subProcessNodeId, active.nodes, active.edges);
    if ('error' in result) {
      return { success: false, error: result.error };
    }

    get().setActiveGraph(result.nodes, result.edges);
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

    projectStore.pushSnapshot('Agregar elemento');

    const active = get().getActiveGraph();
    const firstLane = currentProject.pools[0]?.lanes[0];
    const targetLaneId = laneId || firstLane?.id || 'lane-default';
    const targetLane = currentProject.pools[0]?.lanes.find(l => l.id === targetLaneId);

    // Hierarchical Standard ID
    const currentPath = get().subProcessPath;
    const processInfo = getCurrentProcessInfo(currentProject, currentPath);
    const standardId = formatHierarchicalStandardId(
      processInfo.code,
      processInfo.levelCode,
      nodeType,
      active.nodes
    );

    const count = active.nodes.filter(n => n.data.nodeType === nodeType).length + 1;

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
      [BPMN_NODE_TYPES.POOL_LANE]: `Carril Funcional #${count}`,
      [BPMN_NODE_TYPES.STICKY_NOTE]: `Nota #${count}`
    }[nodeType] || 'Nuevo Elemento';

    const isLane = nodeType === BPMN_NODE_TYPES.POOL_LANE;
    const isSticky = nodeType === BPMN_NODE_TYPES.STICKY_NOTE;
    const isSubProcess = nodeType === BPMN_NODE_TYPES.SUB_PROCESS;
    const newNodeId = isLane ? `lane_node_${Date.now()}` : isSticky ? `note_${Date.now()}` : isSubProcess ? `subproc_${Date.now()}` : `node_${Date.now()}`;

    // Pre-populate initial internal diagram for new SubProcesses
    let initialSubProcessCanvas = undefined;
    let initialSubProcessSteps = undefined;
    let subProcessAssignedCode: string | undefined = undefined;
    let subProcessAssignedLevel: number | undefined = undefined;

    if (isSubProcess) {
      const nextProc = getNextSubProcessCode(currentProject);
      const childLevel = processInfo.level + 1;
      const childLevelCode = `N${childLevel < 10 ? '0' + childLevel : childLevel}`;
      subProcessAssignedCode = nextProc.code;
      subProcessAssignedLevel = childLevel;

      const startId = `start_${newNodeId}`;
      const taskId = `task_${newNodeId}`;
      const endId = `end_${newNodeId}`;

      const starterNodes: Node<BpmnNodeData>[] = [
        {
          id: startId,
          type: 'StartEvent',
          position: { x: 100, y: 160 },
          data: {
            standardId: `${nextProc.code}-${childLevelCode}-INI-01`,
            title: 'Inicio',
            description: '',
            nodeType: BPMN_NODE_TYPES.START_EVENT,
            laneId: targetLaneId || '',
            itSystem: '',
            responsible: '',
            legalFramework: '',
            inputs: [],
            outputs: [],
            operationalRisks: [],
            tags: ['Subproceso']
          }
        },
        {
          id: taskId,
          type: 'UserTask',
          position: { x: 280, y: 130 },
          data: {
            standardId: `${nextProc.code}-${childLevelCode}-TSK-01`,
            title: 'Actividad Principal',
            description: '',
            nodeType: BPMN_NODE_TYPES.USER_TASK,
            laneId: targetLaneId || '',
            itSystem: '',
            responsible: '',
            legalFramework: '',
            inputs: [],
            outputs: [],
            operationalRisks: [],
            tags: ['Subproceso']
          }
        },
        {
          id: endId,
          type: 'EndEvent',
          position: { x: 560, y: 160 },
          data: {
            standardId: `${nextProc.code}-${childLevelCode}-FIN-01`,
            title: 'Fin',
            description: '',
            nodeType: BPMN_NODE_TYPES.END_EVENT,
            laneId: targetLaneId || '',
            itSystem: '',
            responsible: '',
            legalFramework: '',
            inputs: [],
            outputs: [],
            operationalRisks: [],
            tags: ['Subproceso']
          }
        }
      ];

      const starterEdges: Edge<SequenceFlowData>[] = [
        {
          id: `flow_${startId}_${taskId}`,
          source: startId,
          target: taskId,
          type: 'sequenceFlow',
          data: { id: `flow_${startId}_${taskId}`, source: startId, target: taskId }
        },
        {
          id: `flow_${taskId}_${endId}`,
          source: taskId,
          target: endId,
          type: 'sequenceFlow',
          data: { id: `flow_${taskId}_${endId}`, source: taskId, target: endId }
        }
      ];

      initialSubProcessCanvas = { nodes: starterNodes, edges: starterEdges };
      initialSubProcessSteps = [
        {
          id: `step_${taskId}`,
          stepNumber: 1,
          title: 'Actividad Principal',
          description: '',
          role: targetLane?.role || '',
          system: targetLane?.system || '',
          duration: 'P1D',
          inputs: [],
          outputs: []
        }
      ];
    }

    const newNode: Node<BpmnNodeData> = {
      id: newNodeId,
      type: nodeType,
      position,
      style: isLane ? { width: 2200, height: 160, zIndex: -1 } : isSticky ? { width: 220, height: 140, zIndex: 10 } : undefined,
      zIndex: isLane ? -1 : isSticky ? 10 : 1,
      data: {
        standardId,
        title: isLane ? defaultTitle : isSticky ? '' : '',
        description: '',
        nodeType,
        laneId: isLane ? newNodeId : (targetLaneId || ''),
        laneName: targetLane?.name || '',
        roleName: targetLane?.role || '',
        responsible: '',
        itSystem: '',
        legalFramework: '',
        processCode: subProcessAssignedCode,
        processLevel: subProcessAssignedLevel,
        customBgColor: isSticky ? 'yellow' : undefined,
        customBorderColor: isLane ? '#38bdf8' : undefined,
        inputs: [],
        outputs: [],
        operationalRisks: [],
        tags: isSubProcess ? ['Subproceso'] : [],
        subProcessCanvas: initialSubProcessCanvas,
        subProcessSteps: initialSubProcessSteps
      }
    };

    get().setActiveGraph([...active.nodes, newNode], active.edges);
    set({ selectedNodeId: newNodeId, selectedNodeIds: [newNodeId], selectedEdgeId: null });
  },

  addConnectedNode: (sourceNodeId: string, nodeType: BpmnNodeType, targetPosition?: { x: number; y: number }) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return undefined;

    const active = get().getActiveGraph();
    const sourceNode = active.nodes.find((n) => n.id === sourceNodeId);
    if (!sourceNode) return undefined;

    projectStore.pushSnapshot('Conectar próximo elemento');

    // Calculate source dimensions
    const sourceWidth = ((sourceNode.measured?.width || sourceNode.width || 210) as number);

    // Determine target position: if not provided, place ~140px to the right of sourceNode, aligned with sourceNode Y
    let finalPosition = targetPosition;
    if (!finalPosition) {
      finalPosition = {
        x: sourceNode.position.x + sourceWidth + 140,
        y: sourceNode.position.y
      };
    }

    const targetLaneId = sourceNode.data.laneId || currentProject.pools[0]?.lanes[0]?.id || 'lane-default';
    const targetLane = currentProject.pools[0]?.lanes.find(l => l.id === targetLaneId);

    // Hierarchical Standard ID
    const currentPath = get().subProcessPath;
    const processInfo = getCurrentProcessInfo(currentProject, currentPath);
    const standardId = formatHierarchicalStandardId(
      processInfo.code,
      processInfo.levelCode,
      nodeType,
      active.nodes
    );

    const isSubProcess = nodeType === BPMN_NODE_TYPES.SUB_PROCESS;
    const newNodeId = isSubProcess ? `subproc_${Date.now()}` : `node_${Date.now()}`;

    let initialSubProcessCanvas = undefined;
    let initialSubProcessSteps = undefined;
    let subProcessAssignedCode: string | undefined = undefined;
    let subProcessAssignedLevel: number | undefined = undefined;

    if (isSubProcess) {
      const nextProc = getNextSubProcessCode(currentProject);
      const childLevel = processInfo.level + 1;
      const childLevelCode = `N${childLevel < 10 ? '0' + childLevel : childLevel}`;
      subProcessAssignedCode = nextProc.code;
      subProcessAssignedLevel = childLevel;

      const startId = `start_${newNodeId}`;
      const taskId = `task_${newNodeId}`;
      const endId = `end_${newNodeId}`;

      const starterNodes: Node<BpmnNodeData>[] = [
        {
          id: startId,
          type: 'StartEvent',
          position: { x: 100, y: 160 },
          data: {
            standardId: `${nextProc.code}-${childLevelCode}-INI-01`,
            title: 'Inicio',
            description: '',
            nodeType: BPMN_NODE_TYPES.START_EVENT,
            laneId: targetLaneId || '',
            itSystem: '',
            responsible: '',
            legalFramework: '',
            inputs: [],
            outputs: [],
            operationalRisks: [],
            tags: ['Subproceso']
          }
        },
        {
          id: taskId,
          type: 'UserTask',
          position: { x: 280, y: 130 },
          data: {
            standardId: `${nextProc.code}-${childLevelCode}-TSK-01`,
            title: 'Actividad Principal',
            description: '',
            nodeType: BPMN_NODE_TYPES.USER_TASK,
            laneId: targetLaneId || '',
            itSystem: '',
            responsible: '',
            legalFramework: '',
            inputs: [],
            outputs: [],
            operationalRisks: [],
            tags: ['Subproceso']
          }
        },
        {
          id: endId,
          type: 'EndEvent',
          position: { x: 560, y: 160 },
          data: {
            standardId: `${nextProc.code}-${childLevelCode}-FIN-01`,
            title: 'Fin',
            description: '',
            nodeType: BPMN_NODE_TYPES.END_EVENT,
            laneId: targetLaneId || '',
            itSystem: '',
            responsible: '',
            legalFramework: '',
            inputs: [],
            outputs: [],
            operationalRisks: [],
            tags: ['Subproceso']
          }
        }
      ];

      const starterEdges = [
        {
          id: `flow_${startId}_${taskId}`,
          source: startId,
          target: taskId,
          type: 'sequenceFlow',
          data: { id: `flow_${startId}_${taskId}`, source: startId, target: taskId }
        },
        {
          id: `flow_${taskId}_${endId}`,
          source: taskId,
          target: endId,
          type: 'sequenceFlow',
          data: { id: `flow_${taskId}_${endId}`, source: taskId, target: endId }
        }
      ];

      initialSubProcessCanvas = { nodes: starterNodes, edges: starterEdges };
      initialSubProcessSteps = [
        {
          id: `step_${taskId}`,
          stepNumber: 1,
          title: 'Actividad Principal',
          description: '',
          role: targetLane?.role || '',
          system: targetLane?.system || '',
          duration: 'P1D',
          inputs: [],
          outputs: []
        }
      ];
    }

    const newNode: Node<BpmnNodeData> = {
      id: newNodeId,
      type: nodeType,
      position: finalPosition,
      zIndex: 1,
      data: {
        standardId,
        title: '',
        description: '',
        nodeType,
        laneId: targetLaneId || '',
        laneName: targetLane?.name || '',
        roleName: targetLane?.role || '',
        responsible: '',
        itSystem: '',
        legalFramework: '',
        processCode: subProcessAssignedCode,
        processLevel: subProcessAssignedLevel,
        inputs: [],
        outputs: [],
        operationalRisks: [],
        tags: isSubProcess ? ['Subproceso'] : [],
        subProcessCanvas: initialSubProcessCanvas,
        subProcessSteps: initialSubProcessSteps
      }
    };

    const newEdgeId = `e_${sourceNodeId}_${newNodeId}_${Date.now()}`;
    const newEdge: Edge<SequenceFlowData> = {
      id: newEdgeId,
      source: sourceNodeId,
      target: newNodeId,
      type: 'sequenceFlow',
      data: {
        id: `e_${sourceNodeId}_${newNodeId}`,
        source: sourceNodeId,
        target: newNodeId,
        conditionText: '',
        isAssociation: false
      }
    };

    get().setActiveGraph([...active.nodes, newNode], [...active.edges, newEdge]);
    set({ selectedNodeId: newNodeId, selectedNodeIds: [newNodeId], selectedEdgeId: null });
    return newNodeId;
  },

  updateNodeData: (nodeId: string, updates: Partial<BpmnNodeData>) => {
    useProjectStore.getState().pushSnapshot('Modificar elemento');
    const active = get().getActiveGraph();
    const nextNodes = active.nodes.map((node) => {
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

    get().setActiveGraph(nextNodes, active.edges);
  },

  setNodeRelatedCard: (noteId: string, targetNodeId: string | null) => {
    useProjectStore.getState().pushSnapshot('Vincular nota a tarjeta');
    const active = get().getActiveGraph();

    // 1. Update node data relatedNodeId
    const nextNodes = active.nodes.map((n) => {
      if (n.id === noteId) {
        return {
          ...n,
          data: {
            ...n.data,
            relatedNodeId: targetNodeId || undefined
          }
        };
      }
      return n;
    });

    // 2. Remove any previous association edge attached to this note
    let nextEdges = active.edges.filter(
      (e) => !(e.data?.isAssociation && (e.source === noteId || e.target === noteId))
    );

    // 3. If targetNodeId provided, create a new dashed association edge
    if (targetNodeId) {
      const assocEdgeId = `assoc_${noteId}_${targetNodeId}`;
      const assocEdge: Edge<SequenceFlowData> = {
        id: assocEdgeId,
        source: noteId,
        target: targetNodeId,
        type: 'sequenceFlow',
        style: { strokeDasharray: '4,4' },
        data: {
          id: assocEdgeId,
          source: noteId,
          target: targetNodeId,
          conditionText: '',
          isAssociation: true
        }
      };
      nextEdges = [...nextEdges, assocEdge];
    }

    get().setActiveGraph(nextNodes, nextEdges);
  },

  applyCardStyleToScope: (targetNodeId: string, scope: 'single' | 'same_type' | 'all', styleChanges: Partial<BpmnNodeData>) => {
    const projectStore = useProjectStore.getState();
    const project = projectStore.currentProject;
    if (!project) return;

    const active = get().getActiveGraph();
    const targetNode =
      active.nodes.find((n) => n.id === targetNodeId) ||
      project.nodes.find((n) => n.id === targetNodeId);

    if (!targetNode && scope !== 'all') return;

    useProjectStore.getState().pushSnapshot(
      scope === 'same_type'
        ? `Aplicar estilo a tarjetas de tipo ${targetNode?.data?.nodeType || 'mismo tipo'}`
        : 'Aplicar estilo'
    );

    if (scope === 'single') {
      const nextNodes = active.nodes.map((node) => {
        if (node.id === targetNodeId) {
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
      get().setActiveGraph(nextNodes, active.edges);
      return;
    }

    const targetType = targetNode?.data?.nodeType || targetNode?.type;

    const shouldApply = (n: { type?: string; data?: { nodeType?: string } }) => {
      const nType = n.data?.nodeType || n.type;
      if (scope === 'same_type') {
        return nType === targetType;
      }
      if (scope === 'all') {
        return nType !== 'PoolLane' && n.type !== 'PoolLane';
      }
      return false;
    };

    // Recursive deep updater across all hierarchical levels (root, parent processes, and nested subprocesses)
    function updateNodesDeep(nodes: Node<BpmnNodeData>[]): Node<BpmnNodeData>[] {
      if (!nodes) return [];
      return nodes.map((node) => {
        let updatedNode = node;
        if (shouldApply(node)) {
          updatedNode = {
            ...node,
            data: {
              ...node.data,
              ...styleChanges
            }
          };
        }

        // Recursively traverse into subProcessCanvas if present
        if (updatedNode.data?.subProcessCanvas?.nodes) {
          const childNodes = updateNodesDeep(updatedNode.data.subProcessCanvas.nodes);
          updatedNode = {
            ...updatedNode,
            data: {
              ...updatedNode.data,
              subProcessCanvas: {
                ...updatedNode.data.subProcessCanvas,
                nodes: childNodes
              }
            }
          };
        }

        // Recursively traverse into compressedSnapshot if present
        if (updatedNode.data?.compressedSnapshot?.nodes) {
          const childSnapNodes = updatedNode.data.compressedSnapshot.nodes.map((sn) => {
            if (shouldApply(sn)) {
              return {
                ...sn,
                data: {
                  ...sn.data,
                  ...styleChanges
                }
              };
            }
            return sn;
          });
          updatedNode = {
            ...updatedNode,
            data: {
              ...updatedNode.data,
              compressedSnapshot: {
                ...updatedNode.data.compressedSnapshot,
                nodes: childSnapNodes
              }
            }
          };
        }

        return updatedNode;
      });
    }

    const nextRootNodes = updateNodesDeep(project.nodes || []);
    const nextProject: ProcessProjectFile = {
      ...project,
      nodes: nextRootNodes
    };

    projectStore.setProjectData(nextProject);
  },

  updateEdgeData: (edgeId: string, updates: Partial<SequenceFlowData>, pushSnapshot: boolean = true) => {
    if (pushSnapshot) {
      useProjectStore.getState().pushSnapshot('Modificar conector');
    }
    const active = get().getActiveGraph();
    const nextEdges = active.edges.map((edge) => {
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

    get().setActiveGraph(active.nodes, nextEdges);
  },

  bulkUpdateNodeColors: (filter, colors) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    projectStore.pushSnapshot('Cambiar colores');

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

    projectStore.pushSnapshot('Cambiar estilo de conectores');

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
      projectStore.pushSnapshot('Eliminar selección');
      const deleteSet = new Set(targetNodeIds);
      const active = get().getActiveGraph();
      const nextNodes = active.nodes
        .filter((n) => !deleteSet.has(n.id))
        .map((n) => {
          if (n.data?.relatedNodeId && deleteSet.has(n.data.relatedNodeId)) {
            return {
              ...n,
              data: {
                ...n.data,
                relatedNodeId: undefined
              }
            };
          }
          return n;
        });
      const nextEdges = active.edges.filter(
        e => !deleteSet.has(e.source) && !deleteSet.has(e.target)
      );
      get().setActiveGraph(nextNodes, nextEdges);
      set({ selectedNodeId: null, selectedNodeIds: [] });
    } else if (selectedEdgeId) {
      useProjectStore.getState().pushSnapshot('Eliminar conector');
      const active = get().getActiveGraph();
      const nextEdges = active.edges.filter(e => e.id !== selectedEdgeId);
      get().setActiveGraph(active.nodes, nextEdges);
      set({ selectedEdgeId: null });
    }
  },

  addLane: (poolId?: string, name?: string, role?: string, system?: string, colorHex?: string): string | undefined => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return undefined;

    const pool = currentProject.pools.find(p => p.id === poolId) || currentProject.pools[0];
    if (!pool) return undefined;

    projectStore.pushSnapshot('Agregar carril');

    const newLaneId = `lane-${Date.now()}`;
    const defaultColors = ['#38bdf8', '#818cf8', '#34d399', '#f59e0b', '#ec4899', '#06b6d4', '#a855f7', '#64748b'];
    const chosenColor = colorHex || defaultColors[pool.lanes.length % defaultColors.length];

    const newLane = {
      id: newLaneId,
      name: name || `Carril ${pool.lanes.length + 1}`,
      role: role || '',
      system: system || '',
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

    return newLaneId;
  },

  updateLane: (laneId: string, updates: { name?: string; role?: string; system?: string; colorHex?: string }) => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    projectStore.pushSnapshot('Modificar carril');

    const nextPools = currentProject.pools.map(p => ({
      ...p,
      lanes: p.lanes.map(l => (l.id === laneId ? { ...l, ...updates } : l))
    }));

    // Cascade updates to all matching activity nodes and canvas PoolLane nodes
    const nextNodes = currentProject.nodes.map(node => {
      let nodeUpdates: any = null;
      if (node.data?.laneId === laneId) {
        nodeUpdates = {
          ...(nodeUpdates || {}),
          ...(updates.name ? { laneName: updates.name } : {}),
          ...(updates.role ? { roleName: updates.role } : {})
        };
      }
      if (node.type === 'PoolLane' && (node.id === laneId || node.data?.laneId === laneId)) {
        nodeUpdates = {
          ...(nodeUpdates || {}),
          ...(updates.name ? { title: updates.name, laneName: updates.name } : {}),
          ...(updates.role ? { roleName: updates.role } : {}),
          ...(updates.system ? { itSystem: updates.system } : {}),
          ...(updates.colorHex ? { customBorderColor: updates.colorHex } : {})
        };
      }

      if (nodeUpdates) {
        return {
          ...node,
          data: {
            ...node.data,
            ...nodeUpdates
          }
        };
      }
      return node;
    });

    projectStore.setProjectData({
      ...currentProject,
      pools: nextPools,
      nodes: nextNodes
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

    projectStore.pushSnapshot('Mover carril');

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
    const deletedIndex = pool.lanes.findIndex(l => l.id === laneId);
    if (deletedIndex === -1) return;

    projectStore.pushSnapshot('Eliminar carril');

    const remainingLanes = pool.lanes.filter(l => l.id !== laneId);
    remainingLanes.forEach((l, i) => { l.order = i; });

    // Target lane for reassignment (if any remain)
    const targetLane = remainingLanes.length > 0
      ? remainingLanes[Math.min(deletedIndex, remainingLanes.length - 1)]
      : null;

    // Shift up all nodes in subsequent lanes and reassign nodes in deleted lane
    const nextNodes = currentProject.nodes
      .filter(node => !(node.type === 'PoolLane' && node.id === laneId))
      .map(node => {
        if (node.data?.laneId === laneId) {
          return {
            ...node,
            data: {
              ...node.data,
              laneId: targetLane ? targetLane.id : '',
              laneName: targetLane ? targetLane.name : '',
              roleName: targetLane ? targetLane.role : ''
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
  },

  alignAllLanes: () => {
    const projectStore = useProjectStore.getState();
    const currentProject = projectStore.currentProject;
    if (!currentProject) return;

    const laneNodes = currentProject.nodes.filter((n) => n.type === 'PoolLane');
    if (laneNodes.length === 0) return;

    projectStore.pushSnapshot('Alinear carriles');

    const isVertical = laneNodes[0].data.orientation === 'vertical';
    let nextNodes = [...currentProject.nodes];

    if (!isVertical) {
      // Sort horizontal lanes from top to bottom
      const sortedLanes = [...laneNodes].sort((a, b) => a.position.y - b.position.y);
      const minX = Math.min(...sortedLanes.map((l) => l.position.x));
      const startY = Math.min(...sortedLanes.map((l) => l.position.y));
      const targetWidth = Math.max(
        2200,
        ...sortedLanes.map((l) => (l.style?.width as number) || (l.measured?.width as number) || 2200)
      );

      let currentY = startY;

      sortedLanes.forEach((lane) => {
        const laneHeight = (lane.style?.height as number) || (lane.measured?.height as number) || 160;

        nextNodes = nextNodes.map((n) => {
          if (n.id === lane.id) {
            return {
              ...n,
              position: { x: minX, y: currentY },
              style: {
                ...n.style,
                width: targetWidth,
                height: laneHeight,
                zIndex: -1
              },
              zIndex: -1
            };
          }
          return n;
        });

        currentY += laneHeight;
      });
    } else {
      // Sort vertical lanes (columns) from left to right
      const sortedLanes = [...laneNodes].sort((a, b) => a.position.x - b.position.x);
      const startX = Math.min(...sortedLanes.map((l) => l.position.x));
      const minY = Math.min(...sortedLanes.map((l) => l.position.y));
      const targetHeight = Math.max(
        1600,
        ...sortedLanes.map((l) => (l.style?.height as number) || (l.measured?.height as number) || 1600)
      );

      let currentX = startX;

      sortedLanes.forEach((lane) => {
        const laneWidth = (lane.style?.width as number) || (lane.measured?.width as number) || 240;

        nextNodes = nextNodes.map((n) => {
          if (n.id === lane.id) {
            return {
              ...n,
              position: { x: currentX, y: minY },
              style: {
                ...n.style,
                width: laneWidth,
                height: targetHeight,
                zIndex: -1
              },
              zIndex: -1
            };
          }
          return n;
        });

        currentX += laneWidth;
      });
    }

    projectStore.setProjectData({
      ...currentProject,
      nodes: nextNodes
    });
  }
}));
