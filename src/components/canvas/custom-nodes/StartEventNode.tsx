import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
import { Play } from 'lucide-react';

export const StartEventNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;

  return (
    <div
      className={`group relative flex flex-col items-center justify-center w-28 h-28 rounded-full bg-slate-900 border-2 transition-all duration-200 shadow-lg ${
        selected
          ? 'border-emerald-400 ring-4 ring-emerald-500/20 shadow-emerald-500/20 shadow-xl'
          : 'border-emerald-500 hover:border-emerald-400'
      }`}
    >
      <div className="flex flex-col items-center justify-center p-2 text-center">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-1">
          <Play className="w-4 h-4 fill-emerald-400 ml-0.5" />
        </div>
        <span className="text-[10px] font-mono font-bold text-emerald-400 tracking-wider">
          {nodeData.standardId || 'START'}
        </span>
        <span className="text-[10px] font-semibold text-slate-200 line-clamp-1 max-w-[90px] leading-tight mt-0.5">
          {nodeData.title}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-emerald-400 border-2 border-slate-900 !right-[-6px]"
      />
    </div>
  );
});

StartEventNode.displayName = 'StartEventNode';
