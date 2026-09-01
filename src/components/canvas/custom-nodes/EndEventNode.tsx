import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
import { Square } from 'lucide-react';

export const EndEventNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;

  return (
    <div
      className={`group relative flex flex-col items-center justify-center w-28 h-28 rounded-full bg-theme-surface border-4 transition-all duration-200 shadow-lg ${
        selected
          ? 'border-[#EF4444] ring-4 ring-[#EF4444]/30 shadow-[#EF4444]/20 shadow-xl'
          : 'border-[#EF4444] hover:border-[#EF4444]/80'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-[#EF4444] border-2 border-theme-surface !left-[-6px]"
      />

      <div className="flex flex-col items-center justify-center p-2 text-center">
        <div className="w-8 h-8 rounded-full bg-[#EF4444]/20 text-[#EF4444] flex items-center justify-center mb-1">
          <Square className="w-3.5 h-3.5 fill-[#EF4444]" />
        </div>
        <span className="text-[10px] font-mono font-bold text-[#EF4444] tracking-wider">
          {nodeData.standardId || 'END'}
        </span>
        <span className="text-[10px] font-semibold text-theme-text line-clamp-1 max-w-[90px] leading-tight mt-0.5">
          {nodeData.title}
        </span>
      </div>
    </div>
  );
});

EndEventNode.displayName = 'EndEventNode';

