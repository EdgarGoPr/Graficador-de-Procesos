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
    ? { icon: User, label: 'User Task', color: 'border-[#3B82F6]', badge: 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30', headerBg: 'from-[#3B82F6]/20' }
    : isServiceTask
    ? { icon: Cpu, label: 'Service Task', color: 'border-[#3B82F6]', badge: 'bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30', headerBg: 'from-[#3B82F6]/20' }
    : { icon: Wrench, label: 'Manual Task', color: 'border-[#F59E0B]', badge: 'bg-[#F59E0B]/15 text-[#F59E0B] border border-[#F59E0B]/30', headerBg: 'from-[#F59E0B]/20' };

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
      className={`group relative w-full h-full min-w-[210px] min-h-[120px] flex flex-col justify-between rounded-xl bg-theme-surface backdrop-blur-md border transition-all duration-150 shadow-xl ${!nodeData.customBorderColor ? typeConfig.color : ''} ${
        selected ? 'ring-4 ring-[#3B82F6]/30 border-[#3B82F6] shadow-2xl scale-[1.01]' : 'hover:border-theme-accent'
      }`}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={110}
        handleClassName="!w-3 !h-3 !bg-[#38BDF8] !border-2 !border-slate-900 !rounded-full shadow-lg"
        lineClassName="!border-[#38BDF8] !border-dashed"
      />

      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 bg-[#3B82F6] border-2 border-theme-surface !left-[-7px]"
      />

      {/* Card Header */}
      <div className={`flex items-center justify-between px-3 py-2 bg-gradient-to-r ${typeConfig.headerBg} to-transparent rounded-t-xl border-b border-theme-border`}>
        <div className="flex items-center space-x-1.5">
          <div className="p-1 rounded-md bg-theme-surface-subtle text-theme-text">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-mono font-bold tracking-wider text-theme-text">
            {nodeData.standardId || 'TSK-00'}
          </span>
        </div>
        <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${typeConfig.badge}`}>
          {typeConfig.label}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-3">
        <h4 className="text-xs font-semibold text-theme-text leading-snug line-clamp-2 mb-1.5">
          {nodeData.title}
        </h4>
        <p className="text-[11px] text-theme-text-muted line-clamp-2 leading-relaxed mb-3">
          {nodeData.description}
        </p>

        {/* Metadata Badges */}
        <div className="space-y-1.5 pt-2 border-t border-theme-border text-[10px]">
          {nodeData.itSystem && (
            <div className="flex items-center text-theme-text truncate">
              <Server className="w-3 h-3 text-theme-accent mr-1.5 shrink-0" />
              <span className="truncate font-mono">{nodeData.itSystem}</span>
            </div>
          )}

          {nodeData.slaDuration && (
            <div className={`flex items-center font-mono ${nodeData.slaDuration.isPeremptory ? 'text-[#F59E0B] font-semibold' : 'text-theme-text-muted'}`}>
              <Clock className="w-3 h-3 mr-1.5 shrink-0 text-[#F59E0B]" />
              <span>
                {nodeData.slaDuration.value} {nodeData.slaDuration.unit === 'BUSINESS_DAYS' ? 'días hábiles' : nodeData.slaDuration.unit === 'CALENDAR_DAYS' ? 'días corr.' : 'hrs'} ({nodeData.slaDuration.iso8601String})
              </span>
            </div>
          )}
        </div>

        {/* Quality & Risk Status Flags */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-theme-border">
          <div className="flex items-center space-x-1.5">
            {hasQuality && (
              <span className="flex items-center text-[9px] font-semibold bg-[#10B981]/15 text-[#10B981] px-1.5 py-0.5 rounded border border-[#10B981]/30">
                <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                ISO 9001
              </span>
            )}
            {hasRisks && (
              <span className="flex items-center text-[9px] font-semibold bg-[#EF4444]/15 text-[#EF4444] px-1.5 py-0.5 rounded border border-[#EF4444]/30">
                <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                {nodeData.operationalRisks.length} Riesgo{nodeData.operationalRisks.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {nodeData.legalFramework && (
            <span className="text-[9px] text-theme-text-muted font-mono truncate max-w-[80px]">
              {nodeData.legalFramework}
            </span>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3.5 h-3.5 bg-[#3B82F6] border-2 border-theme-surface !right-[-7px]"
      />
    </div>
  );
});

TaskNode.displayName = 'TaskNode';

