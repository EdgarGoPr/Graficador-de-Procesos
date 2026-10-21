import React, { useState, useEffect } from 'react';
import { NodeToolbar, Position } from '@xyflow/react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useUiStore } from '../../store/useUiStore';
import { RadialNodeMenu } from './RadialNodeMenu';
import { BpmnNodeType } from '../../types/process';
import { Plus } from 'lucide-react';

export const QuickAddNodeToolbar: React.FC = () => {
  const { selectedNodeIds, getActiveGraph, addConnectedNode } = useCanvasStore();
  const { showNotification } = useUiStore();
  const [isRadialOpen, setIsRadialOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Close radial menu if selection changes
  useEffect(() => {
    setIsRadialOpen(false);
    setIsDragging(false);
  }, [selectedNodeIds]);

  // Only show when exactly one node is selected
  if (selectedNodeIds.length !== 1) return null;

  const activeGraph = getActiveGraph();
  const selectedNode = activeGraph.nodes.find((n) => n.id === selectedNodeIds[0]);
  if (!selectedNode) return null;

  // Exclude structural/background elements (PoolLane, StickyNote)
  if (selectedNode.type === 'PoolLane' || selectedNode.type === 'StickyNote') {
    return null;
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsRadialOpen(true);
    setIsDragging(true);
  };

  const handleSelectOption = (nodeType: BpmnNodeType) => {
    setIsRadialOpen(false);
    setIsDragging(false);

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
      className="!pointer-events-auto z-40"
    >
      <div className="relative flex items-center justify-center">
        {/* Quick Add '+' Button */}
        <button
          type="button"
          onPointerDown={handlePointerDown}
          onClick={(e) => {
            e.stopPropagation();
            setIsRadialOpen(!isRadialOpen);
          }}
          className={`group flex items-center justify-center w-7 h-7 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-lg shadow-sky-500/30 border-2 border-slate-900 transition-all duration-150 hover:scale-125 active:scale-95 cursor-pointer z-40 ${
            isRadialOpen ? 'scale-110 ring-2 ring-sky-400' : ''
          }`}
          title="Agregar y conectar próximo elemento BPMN (arrastrar o hacer clic)"
        >
          <Plus className={`w-4 h-4 transition-transform duration-200 ${isRadialOpen ? 'rotate-45' : 'group-hover:rotate-90'}`} />
        </button>

        {/* Circular / Radial Selection Menu */}
        <RadialNodeMenu
          isOpen={isRadialOpen}
          onClose={() => {
            setIsRadialOpen(false);
            setIsDragging(false);
          }}
          onSelectOption={handleSelectOption}
          isDraggingMode={isDragging}
        />
      </div>
    </NodeToolbar>
  );
};
