import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
import { hexToRgba } from '../../../types/theme';
import { Clock, AlertCircle } from 'lucide-react';

export const TimerBoundaryNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;
  const sla = nodeData.slaDuration;
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
      className={`group relative flex flex-col items-center justify-center w-24 h-24 rounded-full bg-theme-surface/95 backdrop-blur-sm border-2 border-dashed transition-all duration-150 shadow-md border-amber-500/50 overflow-hidden ${
        selected
          ? 'border-amber-400 ring-2 ring-amber-400/40 shadow-xl scale-105'
          : 'hover:border-amber-400/80 hover:shadow-lg'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 bg-amber-400 border-2 border-theme-surface !left-[-5px]"
      />

      <div style={customHeaderStyle} className="flex flex-col items-center justify-center p-2 text-center rounded-full overflow-hidden w-full">
        <div className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center mb-0.5 shrink-0">
          <Clock className="w-3 h-3" />
        </div>
        {!isTitleOnly && (
          <span className="text-[9px] font-mono font-bold text-amber-400 tracking-wider truncate max-w-[78px]">
            {nodeData.standardId || 'TMR'}
          </span>
        )}
        <span
          style={{ fontSize: titleFontSize }}
          className="text-[9px] font-medium text-theme-text line-clamp-2 max-w-[78px] leading-tight break-words overflow-hidden text-ellipsis"
        >
          {!isTitleOnly && sla ? `${sla.value} ${sla.unit === 'BUSINESS_DAYS' ? 'días háb.' : 'hrs'}` : nodeData.title}
        </span>
        {!isTitleOnly && sla?.isPeremptory && (
          <span className="flex items-center text-[8px] font-bold text-amber-400 mt-0.5 truncate">
            <AlertCircle className="w-2 h-2 mr-0.5 shrink-0" />
            <span>PERENTORIO</span>
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 bg-amber-400 border-2 border-theme-surface !right-[-5px]"
      />
    </div>
  );
});

TimerBoundaryNode.displayName = 'TimerBoundaryNode';
