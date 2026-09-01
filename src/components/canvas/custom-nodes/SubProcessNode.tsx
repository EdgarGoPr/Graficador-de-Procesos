import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
import { useUiStore } from '../../../store/useUiStore';
import { Layers, Maximize2, ListOrdered } from 'lucide-react';

export const SubProcessNode = memo(({ id, data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;
  const { openSubProcessDetail } = useUiStore();

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    openSubProcessDetail(id);
  };

  const stepsCount = nodeData.subProcessSteps?.length || 0;

  return (
    <div
      className={`group relative w-full h-full min-w-[220px] min-h-[130px] flex flex-col justify-between rounded-xl bg-theme-surface/95 backdrop-blur-md border-2 border-[#3B82F6] transition-all duration-150 shadow-xl ${
        selected
          ? 'ring-4 ring-[#3B82F6]/30 border-[#3B82F6] shadow-[#3B82F6]/20 shadow-2xl scale-[1.01]'
          : 'hover:border-[#3B82F6] hover:shadow-2xl'
      }`}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={210}
        minHeight={120}
        handleClassName="!w-3 !h-3 !bg-[#3B82F6] !border-2 !border-slate-900 !rounded-full shadow-lg"
        lineClassName="!border-[#3B82F6] !border-dashed"
      />

      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 bg-[#3B82F6] border-2 border-theme-surface !left-[-7px]"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#3B82F6]/20 to-transparent rounded-t-lg border-b border-theme-border">
        <div className="flex items-center space-x-1.5">
          <div className="p-1 rounded bg-[#3B82F6]/15 text-[#3B82F6]">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-mono font-bold tracking-wider text-[#3B82F6]">
            {nodeData.standardId || 'SUB-01'}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30">
            Subproceso
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3.5">
        <h4 className="text-xs font-bold text-theme-text leading-snug line-clamp-2 mb-1 group-hover:text-[#3B82F6] transition-colors">
          {nodeData.title}
        </h4>
        <p className="text-[11px] text-theme-text-muted line-clamp-2 leading-relaxed mb-3">
          {nodeData.description}
        </p>

        {/* Steps indicator and Expand Button */}
        <div className="flex items-center justify-between pt-2 border-t border-theme-border text-[10px]">
          <div className="flex items-center text-theme-text-muted">
            <ListOrdered className="w-3 h-3 mr-1 text-[#3B82F6]" />
            <span>{stepsCount > 0 ? `${stepsCount} etapas internas` : 'Detalle configurable'}</span>
          </div>

          <button
            onClick={handleExpand}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-[#3B82F6]/15 hover:bg-[#3B82F6] text-[#3B82F6] hover:text-white border border-[#3B82F6]/30 text-[10px] font-bold transition-all shadow-sm group-hover:animate-pulse"
            title="Ampliar y ver el flujo detallado de este subproceso"
          >
            <Maximize2 className="w-2.5 h-2.5" />
            <span>Ampliar</span>
          </button>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3.5 h-3.5 bg-[#3B82F6] border-2 border-theme-surface !right-[-7px]"
      />
    </div>
  );
});

SubProcessNode.displayName = 'SubProcessNode';


