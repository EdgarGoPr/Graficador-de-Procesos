import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
import { hexToRgba } from '../../../types/theme';
import { Square } from 'lucide-react';

export const EndEventNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;
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
    <div
      style={customContainerStyle}
      className={`group relative flex flex-col items-center justify-center w-24 h-24 rounded-full bg-theme-surface/95 backdrop-blur-sm border-[3px] transition-all duration-150 shadow-md overflow-hidden ${
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

      <div style={customHeaderStyle} className="flex flex-col items-center justify-center p-2 text-center rounded-full overflow-hidden w-full">
        <div className="w-6 h-6 rounded-full bg-rose-500/15 text-rose-400 flex items-center justify-center mb-0.5 shrink-0">
          <Square className="w-2.5 h-2.5 fill-rose-400" />
        </div>
        {!isTitleOnly && (
          <span className="text-[9px] font-mono font-bold text-rose-400 tracking-wider truncate max-w-[78px]">
            {nodeData.standardId || 'END'}
          </span>
        )}
        <span
          style={{ fontSize: titleFontSize }}
          className="text-[9px] font-medium text-theme-text line-clamp-2 max-w-[78px] leading-tight break-words overflow-hidden text-ellipsis"
        >
          {nodeData.title}
        </span>
      </div>
    </div>
  );
});

EndEventNode.displayName = 'EndEventNode';
