import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { BpmnNodeData, BPMN_NODE_TYPES } from '../../../types/process';
import { hexToRgba } from '../../../types/theme';
import { User, Cpu, Wrench, Clock, AlertTriangle, ShieldCheck, Server } from 'lucide-react';

export const TaskNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;

  const isUserTask = nodeData.nodeType === BPMN_NODE_TYPES.USER_TASK;
  const isServiceTask = nodeData.nodeType === BPMN_NODE_TYPES.SERVICE_TASK;
  const isManualTask = nodeData.nodeType === BPMN_NODE_TYPES.MANUAL_TASK;

  const typeConfig = isUserTask
    ? { icon: User, label: 'User Task', color: 'border-sky-500/40', badge: 'bg-sky-500/10 text-sky-400 border border-sky-500/25', headerBg: 'from-sky-500/10' }
    : isServiceTask
    ? { icon: Cpu, label: 'Service Task', color: 'border-cyan-500/40', badge: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/25', headerBg: 'from-cyan-500/10' }
    : { icon: Wrench, label: 'Manual Task', color: 'border-amber-500/40', badge: 'bg-amber-500/10 text-amber-400 border border-amber-500/25', headerBg: 'from-amber-500/10' };

  const Icon = typeConfig.icon;
  const hasRisks = nodeData.operationalRisks && nodeData.operationalRisks.length > 0;
  const hasQuality = !!nodeData.qualityCheckpoint;
  const isTitleOnly = nodeData.displayMode === 'title_only';
  const isVertical = nodeData.orientation === 'vertical';

  const opacity = nodeData.customBgOpacity ?? 95;
  const customContainerStyle: React.CSSProperties = {
    backgroundColor: nodeData.customBgColor ? hexToRgba(nodeData.customBgColor, opacity) : undefined,
    borderColor: nodeData.customBorderColor || undefined,
    color: nodeData.customTextColor || undefined,
  };

  const customHeaderStyle: React.CSSProperties = {
    backgroundColor: nodeData.customHeaderBgColor || undefined,
    color: nodeData.customHeaderTextColor || undefined,
  };

  const titleFontSize = nodeData.customFontSize ? `${nodeData.customFontSize}px` : undefined;
  const descFontSize = nodeData.customFontSize ? `${Math.max(9, nodeData.customFontSize - 2)}px` : undefined;

  return (
    <div
      style={customContainerStyle}
      className={`group relative w-full h-full ${
        isVertical
          ? 'min-w-[150px] min-h-[190px]'
          : isTitleOnly
          ? 'min-w-[170px] min-h-[70px]'
          : 'min-w-[210px] min-h-[120px]'
      } flex flex-col justify-between rounded-xl bg-theme-surface/95 backdrop-blur-sm border transition-all duration-150 shadow-md ${
        selected
          ? '!ring-2 !ring-sky-400 !border-sky-400 shadow-2xl scale-[1.01]'
          : (!nodeData.customBorderColor ? typeConfig.color : '') + ' hover:border-sky-400/70 hover:shadow-lg'
      }`}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={isVertical ? 140 : isTitleOnly ? 150 : 200}
        minHeight={isVertical ? 160 : isTitleOnly ? 60 : 110}
        handleClassName="!w-3 !h-3 !bg-sky-400 !border-2 !border-slate-900 !rounded-full shadow-lg hover:scale-125 transition-transform z-50 cursor-nwse-resize"
        lineClassName="!border-2 !border-sky-400 !border-dashed"
      />

      {/* Connection Handles (Left & Right, plus Top & Bottom for Vertical) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-sky-400 !border-2 !border-slate-900 !rounded-full shadow-md !left-[-7px] hover:scale-125 transition-transform z-40"
      />
      {isVertical && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-3.5 !h-3.5 !bg-sky-400 !border-2 !border-slate-900 !rounded-full shadow-md !top-[-7px] hover:scale-125 transition-transform z-40"
        />
      )}

      {/* Inner Content */}
      <div className="w-full h-full flex flex-col justify-between rounded-xl overflow-hidden">
        {/* Header / Title Box */}
        <div
          style={customHeaderStyle}
          className={`flex items-center justify-between px-2.5 py-1.5 bg-gradient-to-r ${typeConfig.headerBg} to-transparent rounded-t-xl border-b border-theme-border overflow-hidden shrink-0`}
        >
          <div className="flex items-center space-x-1.5 min-w-0">
            <div className="p-1 rounded-md bg-theme-surface-subtle text-theme-text-muted shrink-0">
              <Icon className="w-3 h-3" />
            </div>
            <span className="text-[10px] font-mono font-bold tracking-wider text-theme-text truncate">
              {nodeData.standardId || 'TSK-00'}
            </span>
          </div>
          <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full shrink-0 ${typeConfig.badge}`}>
            {typeConfig.label}
          </span>
        </div>

        {/* Body */}
        <div className="p-2.5 flex-1 flex flex-col justify-between overflow-hidden">
          <div className="overflow-hidden">
            <h4
              style={{ fontSize: titleFontSize }}
              className="text-xs font-semibold text-theme-text leading-snug line-clamp-2 mb-1 break-words overflow-hidden text-ellipsis"
            >
              {nodeData.title}
            </h4>

            {!isTitleOnly && nodeData.description && (
              <p
                style={{ fontSize: descFontSize }}
                className="text-[11px] text-theme-text-muted line-clamp-2 leading-relaxed mb-2 break-words overflow-hidden text-ellipsis"
              >
                {nodeData.description}
              </p>
            )}
          </div>

          {/* Details */}
          {!isTitleOnly && (
            <div className="overflow-hidden">
              <div className="space-y-1 pt-1.5 border-t border-theme-border text-[10px] overflow-hidden">
                {nodeData.itSystem && (
                  <div className="flex items-center text-theme-text-muted truncate">
                    <Server className="w-3 h-3 text-sky-400 mr-1.5 shrink-0" />
                    <span className="truncate">{nodeData.itSystem}</span>
                  </div>
                )}
                {nodeData.slaDuration && (
                  <div className="flex items-center text-theme-text-muted truncate">
                    <Clock className="w-3 h-3 text-amber-400 mr-1.5 shrink-0" />
                    <span className="truncate">
                      SLA: {nodeData.slaDuration.value} {nodeData.slaDuration.unit.toLowerCase()}
                    </span>
                  </div>
                )}
              </div>

              {/* Status Badges */}
              {(hasRisks || hasQuality) && (
                <div className="flex items-center space-x-2 pt-1.5 mt-1.5 border-t border-theme-border">
                  {hasQuality && (
                    <span className="flex items-center text-[9px] text-emerald-400 font-mono">
                      <ShieldCheck className="w-3 h-3 mr-0.5" /> QC
                    </span>
                  )}
                  {hasRisks && (
                    <span className="flex items-center text-[9px] text-amber-400 font-mono">
                      <AlertTriangle className="w-3 h-3 mr-0.5" /> RIESGO
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Source Handle (Right & Bottom for Vertical) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-sky-400 !border-2 !border-slate-900 !rounded-full shadow-md !right-[-7px] hover:scale-125 transition-transform z-40"
      />
      {isVertical && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!w-3.5 !h-3.5 !bg-sky-400 !border-2 !border-slate-900 !rounded-full shadow-md !bottom-[-7px] hover:scale-125 transition-transform z-40"
        />
      )}
    </div>
  );
});

TaskNode.displayName = 'TaskNode';
