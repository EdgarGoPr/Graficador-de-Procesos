import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
import { Play } from 'lucide-react';

export const StartEventNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;

  const customContainerStyle: React.CSSProperties = {
    backgroundColor: nodeData.customBgColor || undefined,
    borderColor: nodeData.customBorderColor || undefined,
  };

  return (
    <div
      style={customContainerStyle}
      className={`group relative flex flex-col items-center justify-center w-24 h-24 rounded-full bg-theme-surface/95 backdrop-blur-sm border-2 transition-all duration-150 shadow-md ${
        selected
          ? 'border-teal-400 ring-2 ring-teal-400/30 shadow-lg scale-[1.02]'
          : 'border-teal-500/80 hover:border-teal-400 hover:shadow-lg'
      }`}
    >
      <div className="flex flex-col items-center justify-center p-2 text-center">
        <div className="w-6 h-6 rounded-full bg-teal-500/15 text-teal-400 flex items-center justify-center mb-0.5">
          <Play className="w-3 h-3 fill-teal-400 ml-0.5" />
        </div>
        <span className="text-[9px] font-mono font-bold text-teal-400 tracking-wider">
          {nodeData.standardId || 'START'}
        </span>
        <span className="text-[9px] font-medium text-theme-text line-clamp-1 max-w-[78px] leading-tight">
          {nodeData.title}
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 bg-teal-400 border-2 border-theme-surface !right-[-5px]"
      />
    </div>
  );
});

StartEventNode.displayName = 'StartEventNode';
