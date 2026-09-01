import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BpmnNodeData, BPMN_NODE_TYPES } from '../../../types/process';
import { X, Plus, GitBranch } from 'lucide-react';

export const GatewayNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;
  const isExclusive = nodeData.nodeType === BPMN_NODE_TYPES.EXCLUSIVE_GATEWAY;

  return (
    <div className="relative group flex flex-col items-center">
      <div
        className={`relative w-20 h-20 rotate-45 rounded-lg bg-theme-surface border-2 transition-all duration-200 shadow-xl flex items-center justify-center border-[#F59E0B] bg-[#F59E0B]/10 ${
          selected
            ? 'ring-4 ring-[#F59E0B]/40 border-[#F59E0B] shadow-[#F59E0B]/20 shadow-2xl scale-105'
            : 'hover:scale-105'
        }`}
      >
        {/* Handles on the diamond tips */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-[#F59E0B] border-2 border-theme-surface -rotate-45"
          style={{ top: '50%', left: '-6px' }}
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-[#F59E0B] border-2 border-theme-surface -rotate-45"
          style={{ top: '50%', right: '-6px' }}
        />
        <Handle
          type="source"
          id="bottom"
          position={Position.Bottom}
          className="w-3 h-3 bg-[#F59E0B] border-2 border-theme-surface -rotate-45"
          style={{ bottom: '-6px', left: '50%' }}
        />
        <Handle
          type="source"
          id="top"
          position={Position.Top}
          className="w-3 h-3 bg-[#F59E0B] border-2 border-theme-surface -rotate-45"
          style={{ top: '-6px', left: '50%' }}
        />

        {/* Center Icon */}
        <div className="-rotate-45 flex flex-col items-center justify-center">
          {isExclusive ? (
            <X className="w-7 h-7 text-[#F59E0B] stroke-[2.5]" />
          ) : (
            <Plus className="w-7 h-7 text-[#F59E0B] stroke-[2.5]" />
          )}
        </div>
      </div>

      {/* Label under the diamond */}
      <div className="mt-3 text-center max-w-[140px] bg-theme-surface/95 backdrop-blur-sm px-2 py-1 rounded-md border border-theme-border shadow-md">
        <div className="flex items-center justify-center space-x-1">
          <GitBranch className="w-3 h-3 text-[#F59E0B]" />
          <span className="text-[10px] font-mono font-bold text-[#F59E0B]">
            {nodeData.standardId || 'GTW'}
          </span>
        </div>
        <div className="text-[11px] font-semibold text-theme-text line-clamp-2 leading-tight">
          {nodeData.title}
        </div>
      </div>
    </div>
  );
});

GatewayNode.displayName = 'GatewayNode';

