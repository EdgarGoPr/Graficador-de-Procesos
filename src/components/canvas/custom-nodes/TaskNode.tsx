import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { BpmnNodeData, BPMN_NODE_TYPES } from '../../../types/process';
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

  const customContainerStyle: React.CSSProperties = {
    backgroundColor: nodeData.customBgColor || undefined,
    borderColor: nodeData.customBorderColor || undefined,
  };

  return (
    <div
      style={customContainerStyle}
      className={`group relative w-full h-full min-w-[210px] min-h-[120px] flex flex-col justify-between rounded-xl bg-theme-surface/95 backdrop-blur-sm border transition-all duration-150 shadow-md ${!nodeData.customBorderColor ? typeConfig.color : ''} ${
        selected ? 'ring-2 ring-sky-400/40 border-sky-400 shadow-xl scale-[1.01]' : 'hover:border-sky-400/70 hover:shadow-lg'
      }`}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={110}
        handleClassName="!w-2.5 !h-2.5 !bg-sky-400 !border-2 !border-slate-900 !rounded-full shadow-md"
        lineClassName="!border-sky-400 !border-dashed"
      />

      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 bg-sky-400 border-2 border-theme-surface !left-[-5px]"
      />

      {/* Card Header */}
      <div className={`flex items-center justify-between px-3 py-1.5 bg-gradient-to-r ${typeConfig.headerBg} to-transparent rounded-t-xl border-b border-theme-border`}>
        <div className="flex items-center space-x-1.5">
          <div className="p-1 rounded-md bg-theme-surface-subtle text-theme-text-muted">
            <Icon className="w-3 h-3" />
          </div>
          <span className="text-[10px] font-mono font-bold tracking-wider text-theme-text">
            {nodeData.standardId || 'TSK-00'}
          </span>
        </div>
        <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${typeConfig.badge}`}>
          {typeConfig.label}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-3">
        <h4 className="text-xs font-semibold text-theme-text leading-snug line-clamp-2 mb-1">
          {nodeData.title}
        </h4>
        <p className="text-[11px] text-theme-text-muted line-clamp-2 leading-relaxed mb-2.5">
          {nodeData.description}
        </p>

        {/* Metadata Badges */}
        <div className="space-y-1 pt-1.5 border-t border-theme-border text-[10px]">
          {nodeData.itSystem && (
            <div className="flex items-center text-theme-text-muted truncate">
              <Server className="w-3 h-3 text-sky-400 mr-1.5 shrink-0" />
              <span className="truncate font-mono text-[10px]">{nodeData.itSystem}</span>
            </div>
          )}

          {nodeData.slaDuration && (
            <div className={`flex items-center font-mono ${nodeData.slaDuration.isPeremptory ? 'text-amber-400 font-semibold' : 'text-theme-text-muted'}`}>
              <Clock className="w-3 h-3 mr-1.5 shrink-0 text-amber-400" />
              <span className="text-[10px]">
                {nodeData.slaDuration.value} {nodeData.slaDuration.unit === 'BUSINESS_DAYS' ? 'días hábiles' : nodeData.slaDuration.unit === 'CALENDAR_DAYS' ? 'días corr.' : 'hrs'} ({nodeData.slaDuration.iso8601String})
              </span>
            </div>
          )}
        </div>

        {/* Quality & Risk Status Flags */}
        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-theme-border">
          <div className="flex items-center space-x-1.5">
            {hasQuality && (
              <span className="flex items-center text-[9px] font-medium bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/25">
                <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                ISO 9001
              </span>
            )}
          </div>

          {hasRisks && (
            <div className="flex items-center text-[9px] font-medium text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/25">
              <AlertTriangle className="w-2.5 h-2.5 mr-1" />
              <span>{nodeData.operationalRisks?.length} Riesgo</span>
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 bg-sky-400 border-2 border-theme-surface !right-[-5px]"
      />
    </div>
  );
});

TaskNode.displayName = 'TaskNode';
