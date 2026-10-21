import React, { useState, useEffect, useRef } from 'react';
import { NodeToolbar, Position } from '@xyflow/react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useUiStore } from '../../store/useUiStore';
import { RadialNodeMenu } from './RadialNodeMenu';
import { BpmnNodeType, BPMN_NODE_TYPES } from '../../types/process';
import { Plus } from 'lucide-react';

const SECTOR_TYPES: BpmnNodeType[] = [
  BPMN_NODE_TYPES.USER_TASK,
  BPMN_NODE_TYPES.SERVICE_TASK,
  BPMN_NODE_TYPES.EXCLUSIVE_GATEWAY,
  BPMN_NODE_TYPES.PARALLEL_GATEWAY,
  BPMN_NODE_TYPES.QUALITY_CHECKPOINT_EVENT,
  BPMN_NODE_TYPES.SUB_PROCESS,
  BPMN_NODE_TYPES.END_EVENT
];

export const QuickAddNodeToolbar: React.FC = () => {
  const { selectedNodeIds, getActiveGraph, addConnectedNode } = useCanvasStore();
  const { showNotification } = useUiStore();

  const [isRadialOpen, setIsRadialOpen] = useState(false);
  const [hoveredType, setHoveredType] = useState<BpmnNodeType | null>(null);

  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const hasMovedRef = useRef<boolean>(false);
  const hoveredTypeRef = useRef<BpmnNodeType | null>(null);

  // Keep ref in sync for pointerup event
  useEffect(() => {
    hoveredTypeRef.current = hoveredType;
  }, [hoveredType]);

  // Close menu if selection changes
  useEffect(() => {
    setIsRadialOpen(false);
    setHoveredType(null);
  }, [selectedNodeIds]);

  // Only show when exactly one node is selected
  if (selectedNodeIds.length !== 1) return null;

  const activeGraph = getActiveGraph();
  const selectedNode = activeGraph.nodes.find((n) => n.id === selectedNodeIds[0]);
  if (!selectedNode) return null;

  // Exclude structural elements (PoolLane, StickyNote) and EndEvent
  if (
    selectedNode.type === 'PoolLane' ||
    selectedNode.type === 'StickyNote' ||
    selectedNode.type === 'EndEvent'
  ) {
    return null;
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Fallback if browser pointer capture is restricted
    }

    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    hasMovedRef.current = false;
    setHoveredType(null);
    setIsRadialOpen(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!pointerStartRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const dx = e.clientX - pointerStartRef.current.x;
    const dy = e.clientY - pointerStartRef.current.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 7) {
      hasMovedRef.current = true;
    }

    // Polar angle calculation relative to button center
    if (dist >= 38 && dist <= 145) {
      const deg = (Math.atan2(dy, dx) * 180) / Math.PI;
      const normalizedDeg = (deg + 90 + 360) % 360; // 0deg = top, clockwise
      const sectorIndex = Math.floor(normalizedDeg / (360 / SECTOR_TYPES.length));
      if (sectorIndex >= 0 && sectorIndex < SECTOR_TYPES.length) {
        setHoveredType(SECTOR_TYPES[sectorIndex]);
      } else {
        setHoveredType(null);
      }
    } else {
      setHoveredType(null);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }

    const wasDragging = hasMovedRef.current;
    const chosenType = hoveredTypeRef.current;
    pointerStartRef.current = null;
    hasMovedRef.current = false;

    // If user dragged to a sector and released:
    if (wasDragging) {
      if (chosenType) {
        handleSelectOption(chosenType);
      } else {
        setIsRadialOpen(false);
      }
      return;
    }

    // If it was a quick static click, keep menu open for direct clicking
    // (do nothing, menu stays open)
  };

  const handleSelectOption = (nodeType: BpmnNodeType) => {
    setIsRadialOpen(false);
    setHoveredType(null);

    const newNodeId = addConnectedNode(selectedNode.id, nodeType);
    if (newNodeId) {
      showNotification('Elemento conectado con éxito', 'success');
    }
  };

  return (
    <NodeToolbar
      nodeId={selectedNode.id}
      isVisible={true}
      position={Position.Right}
      offset={14}
      align="center"
      className="nodrag nopan nowheel !pointer-events-auto z-40 select-none"
    >
      <div className="relative flex items-center justify-center nodrag nopan nowheel">
        {/* Quick Add '+' Button with Pointer Capture */}
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onClick={(e) => {
            e.stopPropagation();
            if (!hasMovedRef.current) {
              setIsRadialOpen((prev) => !prev);
            }
          }}
          className={`group nodrag nopan nowheel flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg shadow-sky-500/30 border-2 border-slate-900 transition-all duration-150 hover:scale-125 active:scale-95 cursor-pointer z-40 ${
            isRadialOpen ? 'scale-110 ring-2 ring-sky-400' : ''
          }`}
          title="Agregar y conectar próximo elemento BPMN (mantener pulsado y arrastrar, o hacer clic)"
        >
          <Plus className={`w-4 h-4 transition-transform duration-200 pointer-events-none ${isRadialOpen ? 'rotate-45' : 'group-hover:rotate-90'}`} />
        </button>

        {/* Circular Donut / Pie Wheel Menu */}
        <RadialNodeMenu
          isOpen={isRadialOpen}
          onClose={() => {
            setIsRadialOpen(false);
            setHoveredType(null);
          }}
          onSelectOption={handleSelectOption}
          hoveredType={hoveredType}
          onHoverTypeChange={setHoveredType}
        />
      </div>
    </NodeToolbar>
  );
};
