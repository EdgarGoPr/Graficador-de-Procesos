import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BpmnNodeData, BPMN_NODE_TYPES } from '../../../types/process';
import { User, Cpu, Wrench, Clock, AlertTriangle, ShieldCheck, Server } from 'lucide-react';

export const TaskNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;

  const isUserTask = nodeData.nodeType === BPMN_NODE_TYPES.USER_TASK;
  const isServiceTask = nodeData.nodeType === BPMN_NODE_TYPES.SERVICE_TASK;
  const isManualTask = nodeData.nodeType === BPMN_NODE_TYPES.MANUAL_TASK;

  const typeConfig = isUserTask
    ? { icon: User, label: 'User Task', color: 'border-blue-500/80', badge: 'bg-blue-500/20 text-blue-300', headerBg: 'from-blue-900/40' }
    : isServiceTask
    ? { icon: Cpu, label: 'Service Task', color: 'border-purple-500/80', badge: 'bg-purple-500/20 text-purple-300', headerBg: 'from-purple-900/40' }
    : { icon: Wrench, label: 'Manual Task', color: 'border-amber-500/80', badge: 'bg-amber-500/20 text-amber-300', headerBg: 'from-amber-900/40' };

  const Icon = typeConfig.icon;
  const hasRisks = nodeData.operationalRisks && nodeData.operationalRisks.length > 0;
  const hasQuality = !!nodeData.qualityCheckpoint;

  return (
    <div
      className={`group relative w-64 rounded-xl bg-slate-900/95 backdrop-blur-md border transition-all duration-200 shadow-xl ${typeConfig.color} ${
        selected ? 'ring-4 ring-blue-500/30 border-blue-400 shadow-2xl scale-[1.02]' : 'hover:border-slate-400'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 bg-blue-400 border-2 border-slate-900 !left-[-7px]"
      />

      {/* Card Header */}
      <div className={`flex items-center justify-between px-3 py-2 bg-gradient-to-r ${typeConfig.headerBg} to-transparent rounded-t-xl border-b border-slate-800/80`}>
        <div className="flex items-center space-x-1.5">
          <div className="p-1 rounded-md bg-slate-800 text-slate-300">
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-mono font-bold tracking-wider text-slate-200">
            {nodeData.standardId || 'TSK-00'}
          </span>
        </div>
        <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full ${typeConfig.badge}`}>
          {typeConfig.label}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-3">
        <h4 className="text-xs font-semibold text-slate-100 leading-snug line-clamp-2 mb-1.5">
          {nodeData.title}
        </h4>
        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {nodeData.description}
        </p>

        {/* Metadata Badges */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-[10px]">
          {nodeData.itSystem && (
            <div className="flex items-center text-slate-300 truncate">
              <Server className="w-3 h-3 text-cyan-400 mr-1.5 shrink-0" />
              <span className="truncate font-mono">{nodeData.itSystem}</span>
            </div>
          )}

          {nodeData.slaDuration && (
            <div className={`flex items-center font-mono ${nodeData.slaDuration.isPeremptory ? 'text-amber-400 font-semibold' : 'text-slate-400'}`}>
              <Clock className="w-3 h-3 mr-1.5 shrink-0 text-amber-400" />
              <span>
                {nodeData.slaDuration.value} {nodeData.slaDuration.unit === 'BUSINESS_DAYS' ? 'días hábiles' : nodeData.slaDuration.unit === 'CALENDAR_DAYS' ? 'días corr.' : 'hrs'} ({nodeData.slaDuration.iso8601String})
              </span>
            </div>
          )}
        </div>

        {/* Quality & Risk Status Flags */}
        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800/60">
          <div className="flex items-center space-x-1.5">
            {hasQuality && (
              <span className="flex items-center text-[9px] font-semibold bg-pink-500/20 text-pink-300 px-1.5 py-0.5 rounded border border-pink-500/30">
                <ShieldCheck className="w-2.5 h-2.5 mr-0.5" />
                ISO 9001
              </span>
            )}
            {hasRisks && (
              <span className="flex items-center text-[9px] font-semibold bg-rose-500/20 text-rose-300 px-1.5 py-0.5 rounded border border-rose-500/30">
                <AlertTriangle className="w-2.5 h-2.5 mr-0.5" />
                {nodeData.operationalRisks.length} Riesgo{nodeData.operationalRisks.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {nodeData.legalFramework && (
            <span className="text-[9px] text-slate-400 font-mono truncate max-w-[80px]">
              {nodeData.legalFramework}
            </span>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3.5 h-3.5 bg-blue-400 border-2 border-slate-900 !right-[-7px]"
      />
    </div>
  );
});

TaskNode.displayName = 'TaskNode';
