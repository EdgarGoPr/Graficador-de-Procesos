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
        className={`relative w-20 h-20 rotate-45 rounded-lg bg-slate-900 border-2 transition-all duration-200 shadow-xl flex items-center justify-center ${
          isExclusive ? 'border-amber-500 bg-amber-950/30' : 'border-indigo-500 bg-indigo-950/30'
        } ${
          selected
            ? 'ring-4 ring-amber-400/40 border-amber-300 shadow-amber-500/20 shadow-2xl scale-105'
            : 'hover:scale-105'
        }`}
      >
        {/* Handles on the diamond tips */}
        <Handle
          type="target"
          position={Position.Left}
          className="w-3 h-3 bg-amber-400 border-2 border-slate-900 -rotate-45"
          style={{ top: '50%', left: '-6px' }}
        />
        <Handle
          type="source"
          position={Position.Right}
          className="w-3 h-3 bg-amber-400 border-2 border-slate-900 -rotate-45"
          style={{ top: '50%', right: '-6px' }}
        />
        <Handle
          type="source"
          id="bottom"
          position={Position.Bottom}
          className="w-3 h-3 bg-amber-400 border-2 border-slate-900 -rotate-45"
          style={{ bottom: '-6px', left: '50%' }}
        />
        <Handle
          type="source"
          id="top"
          position={Position.Top}
          className="w-3 h-3 bg-amber-400 border-2 border-slate-900 -rotate-45"
          style={{ top: '-6px', left: '50%' }}
        />

        {/* Center Icon */}
        <div className="-rotate-45 flex flex-col items-center justify-center">
          {isExclusive ? (
            <X className="w-7 h-7 text-amber-400 stroke-[2.5]" />
          ) : (
            <Plus className="w-7 h-7 text-indigo-400 stroke-[2.5]" />
          )}
        </div>
      </div>

      {/* Label under the diamond */}
      <div className="mt-3 text-center max-w-[140px] bg-slate-900/90 backdrop-blur-sm px-2 py-1 rounded-md border border-slate-800 shadow-md">
        <div className="flex items-center justify-center space-x-1">
          <GitBranch className="w-3 h-3 text-amber-400" />
          <span className="text-[10px] font-mono font-bold text-amber-400">
            {nodeData.standardId || 'GTW'}
          </span>
        </div>
        <div className="text-[11px] font-semibold text-slate-200 line-clamp-2 leading-tight">
          {nodeData.title}
        </div>
      </div>
    </div>
  );
});

GatewayNode.displayName = 'GatewayNode';
