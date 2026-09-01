import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
import { Square } from 'lucide-react';

export const EndEventNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;

  const customContainerStyle: React.CSSProperties = {
    backgroundColor: nodeData.customBgColor || undefined,
    borderColor: nodeData.customBorderColor || undefined,
  };

  return (
    <div
      style={customContainerStyle}
      className={`group relative flex flex-col items-center justify-center w-24 h-24 rounded-full bg-theme-surface/95 backdrop-blur-sm border-[3px] transition-all duration-150 shadow-md ${
        selected
          ? 'border-rose-400 ring-2 ring-rose-400/30 shadow-lg scale-[1.02]'
          : 'border-rose-500/80 hover:border-rose-400 hover:shadow-lg'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 bg-rose-400 border-2 border-theme-surface !left-[-5px]"
      />

      <div className="flex flex-col items-center justify-center p-2 text-center">
        <div className="w-6 h-6 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center mb-0.5">
          <Square className="w-2.5 h-2.5 fill-rose-400" />
        </div>
        <span className="text-[9px] font-mono font-bold text-rose-400 tracking-wider">
          {nodeData.standardId || 'END'}
        </span>
        <span className="text-[9px] font-medium text-theme-text line-clamp-1 max-w-[78px] leading-tight">
          {nodeData.title}
        </span>
      </div>
    </div>
  );
});

EndEventNode.displayName = 'EndEventNode';
