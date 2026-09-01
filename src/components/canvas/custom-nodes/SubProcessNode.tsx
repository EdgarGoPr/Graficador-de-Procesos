import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
import { Layers, PlusSquare } from 'lucide-react';

export const SubProcessNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;

  return (
    <div
      className={`group relative w-64 rounded-xl bg-theme-surface backdrop-blur-md border-2 border-[#3B82F6] transition-all duration-200 shadow-xl ${
        selected ? 'ring-4 ring-[#3B82F6]/30 border-[#3B82F6] shadow-[#3B82F6]/20 shadow-2xl scale-[1.02]' : 'hover:border-[#3B82F6]/80'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 bg-[#3B82F6] border-2 border-theme-surface !left-[-7px]"
      />

      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#3B82F6]/20 to-transparent rounded-t-lg border-b border-theme-border">
        <div className="flex items-center space-x-1.5">
          <div className="p-1 rounded bg-[#3B82F6]/15 text-[#3B82F6]">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-mono font-bold tracking-wider text-[#3B82F6]">
            {nodeData.standardId || 'SUB-01'}
          </span>
        </div>
        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30">
          Subproceso
        </span>
      </div>

      <div className="p-3">
        <h4 className="text-xs font-bold text-theme-text leading-snug line-clamp-2 mb-1">
          {nodeData.title}
        </h4>
        <p className="text-[11px] text-theme-text-muted line-clamp-2 leading-relaxed mb-2">
          {nodeData.description}
        </p>
        
        <div className="flex items-center justify-center pt-2 border-t border-theme-border text-[10px] text-[#3B82F6]">
          <PlusSquare className="w-3.5 h-3.5 mr-1" />
          <span>Detalle Expandible</span>
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

