import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { PRESET_THEMES, hexToRgba } from '../../types/theme';

import { StartEventNode } from './custom-nodes/StartEventNode';
import { EndEventNode } from './custom-nodes/EndEventNode';
import { TaskNode } from './custom-nodes/TaskNode';
import { GatewayNode } from './custom-nodes/GatewayNode';
import { QualityCheckpointNode } from './custom-nodes/QualityCheckpointNode';
import { TimerBoundaryNode } from './custom-nodes/TimerBoundaryNode';
import { SubProcessNode } from './custom-nodes/SubProcessNode';
import { SwimlaneNode } from './custom-nodes/SwimlaneNode';
import { StickyNoteNode } from './custom-nodes/StickyNoteNode';
import { SequenceFlowEdge } from './custom-edges/SequenceFlowEdge';
import { AlignmentGuidesOverlay, AlignmentGuide } from './AlignmentGuidesOverlay';
import { PrintFrameOverlay } from './PrintFrameOverlay';
import { NewerVersionBanner } from './NewerVersionBanner';
import { SubProcessBreadcrumbs } from './SubProcessBreadcrumbs';
import { CustomMiniMapNode } from './CustomMiniMapNode';
import { QuickAddNodeToolbar } from './QuickAddNodeToolbar';
import { getGraphForPath } from '../../store/useCanvasStore';
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
  StickyNote: StickyNoteNode,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const EDGE_TYPES: any = {
  sequenceFlow: SequenceFlowEdge,
};

const ProcessCanvasInternal: React.FC = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition, setCenter, setViewport, getViewport } = useReactFlow();
  const prevSubProcessPathRef = useRef<string | null>(null);

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
    selectedNodeIds,
    isCanvasLocked,
    subProcessPath
  } = useCanvasStore();

  const {
    setPropertiesPanelOpen,
    currentThemeId,
    customThemeColors,
    theme,
    showNotification
  } = useUiStore();

  const activeColors = currentThemeId === 'custom'
    ? customThemeColors
    : (PRESET_THEMES[currentThemeId]?.colors || PRESET_THEMES['antigravity-dark'].colors);

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

  // MiniMap navigation handlers: Smoothly center canvas on clicked location or node
  const handleMiniMapClick = useCallback(
    (_event: React.MouseEvent, position: { x: number; y: number }) => {
      setCenter(position.x, position.y, { duration: 400 });
    },
    [setCenter]
  );

  const handleMiniMapNodeClick = useCallback(
    (_event: React.MouseEvent, node: any) => {
      const x = (node.position?.x ?? 0) + (node.measured?.width ?? node.width ?? 100) / 2;
      const y = (node.position?.y ?? 0) + (node.measured?.height ?? node.height ?? 60) / 2;
      setCenter(x, y, { duration: 400 });
      selectNode(node.id);
      setPropertiesPanelOpen(true);
    },
    [setCenter, selectNode, setPropertiesPanelOpen]
  );

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

  const onNodeDragStart = useCallback(() => {
    useProjectStore.getState().pushSnapshot('Mover elemento');
  }, []);

  const onNodeDragStop = useCallback(() => {
    setAlignmentGuides([]);
  }, []);

  const activeGraph = React.useMemo(() => {
    return getGraphForPath(currentProject, subProcessPath);
  }, [currentProject, subProcessPath]);

  // Intelligent auto-centering or left-aligning the first StartEvent when entering a subprocess, parent process, or root (PST-057)
  useEffect(() => {
    const projId = currentProject?.documentControl?.documentCode || currentProject?.fileName || 'default';
    const subPathStr =
      subProcessPath && subProcessPath.length > 0
        ? subProcessPath.map((p) => p.id).join('->')
        : 'root';
    const currentFullKey = `${projId}:${subPathStr}`;
    const wasFullKey = prevSubProcessPathRef.current;
    prevSubProcessPathRef.current = currentFullKey;

    // Trigger only when the navigation level or active project actually changes
    if (wasFullKey === currentFullKey) {
      return;
    }

    const timer = setTimeout(() => {
      const currentProj = useProjectStore.getState().currentProject;
      const currentPath = useCanvasStore.getState().subProcessPath;
      const graph = getGraphForPath(currentProj, currentPath);
      const processNodes = (graph?.nodes || []).filter((n) => n.type !== 'PoolLane');
      if (processNodes.length === 0) return;

      const wrapperRect = reactFlowWrapper.current?.getBoundingClientRect();
      const viewportWidth = wrapperRect?.width || window.innerWidth;
      const viewportHeight = wrapperRect?.height || window.innerHeight;

      const currentViewport = getViewport();
      const zoom = currentViewport.zoom || 1;

      // Check if returning to a specific subProcess card (PST-058)
      const pendingFocusId = useCanvasStore.getState().pendingFocusNodeId;
      if (pendingFocusId) {
        useCanvasStore.getState().setPendingFocusNodeId(null);
        const focusNode = processNodes.find((n) => n.id === pendingFocusId);
        if (focusNode) {
          const focusW = (focusNode.measured?.width || focusNode.width || (focusNode.type === 'SubProcess' ? 240 : 210)) as number;
          const focusH = (focusNode.measured?.height || focusNode.height || (focusNode.type === 'SubProcess' ? 120 : 120)) as number;
          const nodeCenterX = focusNode.position.x + focusW / 2;
          const nodeCenterY = focusNode.position.y + focusH / 2;
          setCenter(nodeCenterX, nodeCenterY, { zoom, duration: 450 });
          selectNode(focusNode.id);
          return;
        }
      }

      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;

      for (const n of processNodes) {
        const w = (n.measured?.width || n.width || (n.type === 'StartEvent' || n.type === 'EndEvent' ? 96 : 210)) as number;
        const h = (n.measured?.height || n.height || (n.type === 'StartEvent' || n.type === 'EndEvent' ? 96 : 120)) as number;
        const x = n.position.x;
        const y = n.position.y;
        if (x < minX) minX = x;
        if (x + w > maxX) maxX = x + w;
        if (y < minY) minY = y;
        if (y + h > maxY) maxY = y + h;
      }

      const diagramWidth = maxX - minX;
      // Available width at current zoom, reserving comfortable margins
      const availableWidth = (viewportWidth - 180) / zoom;
      const isTooLong = diagramWidth > availableWidth;

      if (!isTooLong) {
        // Fits comfortably: center the entire diagram bounding box smoothly
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        setCenter(centerX, centerY, { zoom, duration: 400 });
      } else {
        // Diagram is too long horizontally for the current zoom:
        // Position the first StartEvent vertically centered and on the left
        const startNodes = processNodes.filter((n) => n.type === 'StartEvent');
        const startNode =
          startNodes.length > 0
            ? startNodes.sort((a, b) => a.position.x - b.position.x)[0]
            : processNodes.slice().sort((a, b) => a.position.x - b.position.x)[0];

        const startW = (startNode.measured?.width || startNode.width || 96) as number;
        const startH = (startNode.measured?.height || startNode.height || 96) as number;
        const nodeCenterX = startNode.position.x + startW / 2;
        const nodeCenterY = startNode.position.y + startH / 2;

        const desiredScreenX = Math.max(140, Math.min(180, viewportWidth * 0.12));
        const desiredScreenY = viewportHeight / 2;

        const nextX = desiredScreenX - nodeCenterX * zoom;
        const nextY = desiredScreenY - nodeCenterY * zoom;

        setViewport({ x: nextX, y: nextY, zoom }, { duration: 400 });
      }
    }, 60);

    return () => clearTimeout(timer);
  }, [subProcessPath, currentProject?.documentControl?.documentCode, setCenter, setViewport, getViewport]);

  // Stable hierarchical sorting so sections/lanes are rendered in background (first in array),
  // and tasks, gateways, and events are rendered on top (foreground).
  // Dynamically set draggable to false if the canvas is locked or if the node is individually locked.
  const hierarchicalNodes = React.useMemo(() => {
    if (!activeGraph?.nodes) return [];
    const getHierarchyLevel = (type?: string) => {
      if (type === 'PoolLane') return 0; // Jerarquía más básica (fondo)
      if (type === 'SubProcess') return 1; // Subprocesos contenedores
      if (type?.includes('Task')) return 2; // Tareas de usuario / servicio / manual
      if (type?.includes('Gateway')) return 3; // Compuertas
      if (type?.includes('Event')) return 4; // Eventos inicio, fin, calidad, timer
      return 2;
    };
    return [...activeGraph.nodes]
      .map((node) => ({
        ...node,
        draggable: !isCanvasLocked && !node.data?.isLocked
      }))
      .sort((a, b) => getHierarchyLevel(a.type) - getHierarchyLevel(b.type));
  }, [activeGraph?.nodes, isCanvasLocked]);

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
      style={{ backgroundColor: activeColors.canvasBg }}
      className="flex-1 h-full relative transition-colors outline-none"
      onKeyDown={onKeyDown}
      tabIndex={0}
    >
      <ReactFlow
        nodes={hierarchicalNodes}
        edges={activeGraph.edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onNodeDragStart={onNodeDragStart}
        onNodeDrag={onNodeDrag}
        onNodeDragStop={onNodeDragStop}
        onDragOver={onDragOver}
        onDrop={onDrop}
        nodeTypes={NODE_TYPES}
        edgeTypes={EDGE_TYPES}
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode={['Shift']}
        nodesDraggable={!isCanvasLocked}
        nodesConnectable={!isCanvasLocked}
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
        style={{ backgroundColor: activeColors.canvasBg }}
        defaultEdgeOptions={{
          type: 'sequenceFlow',
          animated: false,
        }}
      >
        <AlignmentGuidesOverlay guides={alignmentGuides} />
        <PrintFrameOverlay />
        <NewerVersionBanner />
        <SubProcessBreadcrumbs />
        <QuickAddNodeToolbar />
        <Controls className="!bg-theme-surface !border-theme-border !text-theme-text fill-current shadow-lg" />
        <MiniMap
          pannable={true}
          zoomable={true}
          onClick={handleMiniMapClick}
          onNodeClick={handleMiniMapNodeClick}
          nodeComponent={CustomMiniMapNode}
          nodeColor={(node) => {
            // 1. Jerarquía base: Carril / Sección (Fondo traslúcido suave con borde distintivo para no tapar los elementos de encima)
            if (node.type === 'PoolLane') {
              const laneColor = (node.data as any)?.customBorderColor || '#38BDF8';
              return hexToRgba(laneColor, 18);
            }
            // 2. Eventos Iniciales y Calidad (Verde Esmeralda)
            if (node.type === 'StartEvent') return '#10B981';
            if (node.type === 'QualityCheckpointEvent') return '#059669';
            
            // 3. Eventos Finales (Rojo Carmesí)
            if (node.type === 'EndEvent') return '#EF4444';
            
            // 4. Compuertas y Decisiones (Ámbar / Dorado)
            if (node.type === 'ExclusiveGateway' || node.type === 'ParallelGateway') return '#F59E0B';
            
            // 5. Eventos Temporizadores (Naranja Cálido)
            if (node.type === 'TimerBoundaryEvent') return '#F97316';
            
            // 6. Subprocesos (Púrpura / Violeta)
            if (node.type === 'SubProcess') return '#A855F7';

            // 7. Tareas por tipo
            if (node.type === 'UserTask') return '#38BDF8';     // Azul Cielo (Usuario)
            if (node.type === 'ServiceTask') return '#06B6D4';  // Cian (Sistema/Servicio)
            if (node.type === 'ManualTask') return '#F59E0B';   // Ámbar (Manual)

            return '#3B82F6';
          }}
          nodeStrokeColor={(node) => {
            if (node.type === 'PoolLane') {
              return (node.data as any)?.customBorderColor || '#38BDF8';
            }
            if (node.type === 'StartEvent' || node.type === 'QualityCheckpointEvent') return '#047857';
            if (node.type === 'EndEvent') return '#B91C1C';
            if (node.type === 'ExclusiveGateway' || node.type === 'ParallelGateway' || node.type === 'ManualTask') return '#B45309';
            if (node.type === 'TimerBoundaryEvent') return '#C2410C';
            if (node.type === 'SubProcess') return '#7E22CE';
            if (node.type === 'ServiceTask') return '#0891B2';
            return '#0284C7';
          }}
          nodeStrokeWidth={1.5}
          nodeBorderRadius={4}
          className="!bg-theme-surface/90 !border-theme-border !rounded-xl shadow-2xl backdrop-blur-md cursor-pointer"
          maskColor={activeColors.isDark ? 'rgba(15, 23, 42, 0.70)' : 'rgba(241, 245, 249, 0.70)'}
          maskStrokeColor={activeColors.accent}
          maskStrokeWidth={1.5}
        />
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1.5}
          color={activeColors.dotGridColor}
          bgColor={activeColors.canvasBg}
          style={{ backgroundColor: activeColors.canvasBg }}
        />
      </ReactFlow>
    </div>
  );
};

export const ProcessCanvas: React.FC = () => {
  return <ProcessCanvasInternal />;
};
