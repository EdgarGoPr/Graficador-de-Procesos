import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
import { Square } from 'lucide-react';

export const EndEventNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;

  return (
    <div
      className={`group relative flex flex-col items-center justify-center w-28 h-28 rounded-full bg-slate-900 border-4 transition-all duration-200 shadow-lg ${
        selected
          ? 'border-rose-400 ring-4 ring-rose-500/20 shadow-rose-500/20 shadow-xl'
          : 'border-rose-500 hover:border-rose-400'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-rose-400 border-2 border-slate-900 !left-[-6px]"
      />

      <div className="flex flex-col items-center justify-center p-2 text-center">
        <div className="w-8 h-8 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mb-1">
          <Square className="w-3.5 h-3.5 fill-rose-400" />
        </div>
        <span className="text-[10px] font-mono font-bold text-rose-400 tracking-wider">
          {nodeData.standardId || 'END'}
        </span>
        <span className="text-[10px] font-semibold text-slate-200 line-clamp-1 max-w-[90px] leading-tight mt-0.5">
          {nodeData.title}
        </span>
      </div>
    </div>
  );
});

EndEventNode.displayName = 'EndEventNode';
