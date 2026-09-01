import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BpmnNodeData, BPMN_NODE_TYPES } from '../../../types/process';
import { hexToRgba } from '../../../types/theme';
import { X, Plus, GitBranch } from 'lucide-react';

export const GatewayNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;
  const isExclusive = nodeData.nodeType === BPMN_NODE_TYPES.EXCLUSIVE_GATEWAY;
  const isTitleOnly = nodeData.displayMode === 'title_only';

  const opacity = nodeData.customBgOpacity ?? 95;
  const customContainerStyle: React.CSSProperties = {
    backgroundColor: nodeData.customBgColor ? hexToRgba(nodeData.customBgColor, opacity) : undefined,
    borderColor: nodeData.customBorderColor || undefined,
  };

  const customHeaderStyle: React.CSSProperties = {
    backgroundColor: nodeData.customHeaderBgColor || undefined,
    color: nodeData.customHeaderTextColor || undefined,
  };

  const titleFontSize = nodeData.customFontSize ? `${nodeData.customFontSize}px` : undefined;

  return (
    <div className="relative group flex flex-col items-center">
      <div
        style={customContainerStyle}
        className={`relative w-16 h-16 rotate-45 rounded-lg bg-theme-surface/95 backdrop-blur-sm border-2 transition-all duration-150 shadow-md flex items-center justify-center border-amber-500/50 bg-amber-500/10 ${
          selected
            ? '!ring-2 !ring-amber-400 !border-amber-400 shadow-2xl scale-110'
            : 'hover:border-amber-400/80 hover:shadow-lg'
        }`}
      >
        {/* Handles on the diamond tips */}
        <Handle
          type="target"
          position={Position.Left}
          className="!w-3.5 !h-3.5 !bg-amber-400 !border-2 !border-slate-900 !rounded-full shadow-md -rotate-45 hover:scale-125 transition-transform z-40"
          style={{ top: '50%', left: '-7px' }}
        />
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3.5 !h-3.5 !bg-amber-400 !border-2 !border-slate-900 !rounded-full shadow-md -rotate-45 hover:scale-125 transition-transform z-40"
          style={{ top: '50%', right: '-7px' }}
        />
        <Handle
          type="source"
          id="bottom"
          position={Position.Bottom}
          className="!w-3.5 !h-3.5 !bg-amber-400 !border-2 !border-slate-900 !rounded-full shadow-md -rotate-45 hover:scale-125 transition-transform z-40"
          style={{ bottom: '-7px', left: '50%' }}
        />
        <Handle
          type="source"
          id="top"
          position={Position.Top}
          className="!w-3.5 !h-3.5 !bg-amber-400 !border-2 !border-slate-900 !rounded-full shadow-md -rotate-45 hover:scale-125 transition-transform z-40"
          style={{ top: '-7px', left: '50%' }}
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

      {/* Label / Title Box under the diamond */}
      <div
        style={customHeaderStyle}
        className="mt-2.5 text-center max-w-[130px] bg-theme-surface/95 backdrop-blur-sm px-2 py-1 rounded-md border border-theme-border shadow-sm overflow-hidden"
      >
        {!isTitleOnly && (
          <div className="flex items-center justify-center space-x-1 truncate">
            <GitBranch className="w-2.5 h-2.5 text-amber-400 shrink-0" />
            <span className="text-[9px] font-mono font-bold text-amber-400 truncate">
              {nodeData.standardId || 'GTW'}
            </span>
          </div>
        )}
        <p
          style={{ fontSize: titleFontSize }}
          className="text-[10px] font-medium text-theme-text line-clamp-2 leading-tight mt-0.5 break-words overflow-hidden text-ellipsis"
        >
          {nodeData.title}
        </p>
      </div>
    </div>
  );
});

GatewayNode.displayName = 'GatewayNode';
