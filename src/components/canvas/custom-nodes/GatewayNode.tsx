import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BpmnNodeData, BPMN_NODE_TYPES } from '../../../types/process';
import { X, Plus, GitBranch } from 'lucide-react';

export const GatewayNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;
  const isExclusive = nodeData.nodeType === BPMN_NODE_TYPES.EXCLUSIVE_GATEWAY;

  const customContainerStyle: React.CSSProperties = {
    backgroundColor: nodeData.customBgColor || undefined,
    borderColor: nodeData.customBorderColor || undefined,
  };

  return (
    <div className="relative group flex flex-col items-center">
      <div
        style={customContainerStyle}
        className={`relative w-16 h-16 rotate-45 rounded-lg bg-theme-surface/95 backdrop-blur-sm border-2 transition-all duration-150 shadow-md flex items-center justify-center border-amber-500/50 bg-amber-500/10 ${
          selected
            ? 'ring-2 ring-amber-400/40 border-amber-400 shadow-xl scale-105'
            : 'hover:border-amber-400/80 hover:shadow-lg'
        }`}
      >
        {/* Handles on the diamond tips */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-2.5 h-2.5 bg-amber-400 border-2 border-theme-surface -rotate-45"
          style={{ top: '50%', left: '-5px' }}
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-2.5 h-2.5 bg-amber-400 border-2 border-theme-surface -rotate-45"
          style={{ top: '50%', right: '-5px' }}
        />
        <Handle
          type="source"
          id="bottom"
          position={Position.Bottom}
          className="w-2.5 h-2.5 bg-amber-400 border-2 border-theme-surface -rotate-45"
          style={{ bottom: '-5px', left: '50%' }}
        />
        <Handle
          type="source"
          id="top"
          position={Position.Top}
          className="w-2.5 h-2.5 bg-amber-400 border-2 border-theme-surface -rotate-45"
          style={{ top: '-5px', left: '50%' }}
        />

        {/* Center Icon */}
        <div className="-rotate-45 flex flex-col items-center justify-center">
          {isExclusive ? (
            <X className="w-5 h-5 text-amber-400 stroke-[2.5]" />
          ) : (
            <Plus className="w-5 h-5 text-amber-400 stroke-[2.5]" />
          )}
        </div>
      </div>

      {/* Label under the diamond */}
      <div className="mt-2.5 text-center max-w-[130px] bg-theme-surface/95 backdrop-blur-sm px-2 py-1 rounded-md border border-theme-border shadow-sm">
        <div className="flex items-center justify-center space-x-1">
          <GitBranch className="w-2.5 h-2.5 text-amber-400" />
          <span className="text-[9px] font-mono font-bold text-amber-400">
            {nodeData.standardId || 'GTW'}
          </span>
        </div>
        <p className="text-[10px] font-medium text-theme-text line-clamp-2 leading-tight mt-0.5">
          {nodeData.title}
        </p>
      </div>
    </div>
  );
});

GatewayNode.displayName = 'GatewayNode';
