import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
import { Play } from 'lucide-react';

export const StartEventNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;

  return (
    <div
      className={`group relative flex flex-col items-center justify-center w-28 h-28 rounded-full bg-theme-surface border-2 transition-all duration-200 shadow-lg ${
        selected
          ? 'border-[#10B981] ring-4 ring-[#10B981]/30 shadow-[#10B981]/20 shadow-xl'
          : 'border-[#10B981] hover:border-[#10B981]/80'
      }`}
    >
      <div className="flex flex-col items-center justify-center p-2 text-center">
        <div className="w-8 h-8 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center mb-1">
          <Play className="w-4 h-4 fill-[#10B981] ml-0.5" />
        </div>
        <span className="text-[10px] font-mono font-bold text-[#10B981] tracking-wider">
          {nodeData.standardId || 'START'}
        </span>
        <span className="text-[10px] font-semibold text-theme-text line-clamp-1 max-w-[90px] leading-tight mt-0.5">
          {nodeData.title}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-[#10B981] border-2 border-theme-surface !right-[-6px]"
      />
    </div>
  );
});

StartEventNode.displayName = 'StartEventNode';

