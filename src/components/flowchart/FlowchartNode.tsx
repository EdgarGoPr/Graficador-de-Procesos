import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BpmnNodeData } from '../../types/process';
import {
  Play,
  Square,
  User,
  Server,
  Wrench,
  GitBranch,
  Split,
  ShieldCheck,
  Clock,
  Layers
} from 'lucide-react';

export const FlowchartNode: React.FC<NodeProps> = memo(({ data, selected }) => {
  const nodeData = data as BpmnNodeData & { originalType?: string };
  const type = nodeData.originalType || nodeData.nodeType;

  // Semantic icon and color theme
  let icon = <User className="w-4 h-4 text-sky-400 shrink-0" />;
  let borderClass = 'border-sky-500/40 hover:border-sky-400';
  let bgClass = 'bg-slate-900/90';
  let shapeClass = 'rounded-xl';
  let badgeColor = 'bg-sky-500/20 text-sky-400 border-sky-500/30';

  if (type === 'StartEvent') {
    icon = <Play className="w-4 h-4 text-emerald-400 fill-emerald-400/30 shrink-0" />;
    borderClass = 'border-emerald-500/60 hover:border-emerald-400';
    bgClass = 'bg-emerald-950/40';
    shapeClass = 'rounded-full px-5';
    badgeColor = 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
  } else if (type === 'EndEvent') {
    icon = <Square className="w-4 h-4 text-rose-400 fill-rose-400/30 shrink-0" />;
    borderClass = 'border-rose-500/60 hover:border-rose-400';
    bgClass = 'bg-rose-950/40';
    shapeClass = 'rounded-full px-5';
    badgeColor = 'bg-rose-500/20 text-rose-400 border-rose-500/40';
  } else if (type === 'ExclusiveGateway' || type === 'ParallelGateway') {
    icon = type === 'ExclusiveGateway'
      ? <GitBranch className="w-4 h-4 text-amber-400 shrink-0" />
      : <Split className="w-4 h-4 text-amber-400 shrink-0" />;
    borderClass = 'border-amber-500/60 hover:border-amber-400 shadow-amber-500/10';
    bgClass = 'bg-amber-950/30';
    shapeClass = 'rounded-2xl';
    badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/40';
  } else if (type === 'QualityCheckpointEvent') {
    icon = <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0" />;
    borderClass = 'border-teal-500/60 hover:border-teal-400';
    bgClass = 'bg-teal-950/30';
    badgeColor = 'bg-teal-500/20 text-teal-400 border-teal-500/40';
  } else if (type === 'TimerBoundaryEvent') {
    icon = <Clock className="w-4 h-4 text-orange-400 shrink-0" />;
    borderClass = 'border-orange-500/60 hover:border-orange-400';
    bgClass = 'bg-orange-950/30';
    badgeColor = 'bg-orange-500/20 text-orange-400 border-orange-500/40';
  } else if (type === 'ServiceTask') {
    icon = <Server className="w-4 h-4 text-cyan-400 shrink-0" />;
    borderClass = 'border-cyan-500/40 hover:border-cyan-400';
    bgClass = 'bg-slate-900/90';
    badgeColor = 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
  } else if (type === 'ManualTask') {
    icon = <Wrench className="w-4 h-4 text-amber-400 shrink-0" />;
    borderClass = 'border-amber-500/40 hover:border-amber-400';
    bgClass = 'bg-slate-900/90';
    badgeColor = 'bg-amber-500/20 text-amber-400 border-amber-500/30';
  } else if (type === 'SubProcess') {
    icon = <Layers className="w-4 h-4 text-purple-400 shrink-0" />;
    borderClass = 'border-purple-500/60 hover:border-purple-400';
    bgClass = 'bg-purple-950/30';
    badgeColor = 'bg-purple-500/20 text-purple-400 border-purple-500/40';
  }

  return (
    <div
      className={`relative w-[260px] h-[70px] ${shapeClass} ${bgClass} border-2 ${borderClass} px-3 py-2 flex items-center shadow-lg backdrop-blur-md transition-all ${
        selected ? 'ring-2 ring-sky-400 scale-[1.02] shadow-sky-500/20' : ''
      } print:bg-white print:border-slate-800 print:text-black print:shadow-none`}
    >
      {/* Target handle at TOP */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2.5 !h-2.5 !bg-sky-400 !border-2 !border-slate-900 !-top-1.5 print:!hidden"
      />

      {/* Content: Icon + ID + Main Title */}
      <div className="flex items-center space-x-2.5 w-full overflow-hidden">
        <div className="p-1.5 rounded-lg bg-slate-800/80 border border-slate-700/50 shrink-0 print:bg-slate-100 print:border-slate-400">
          {icon}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center space-x-1.5 mb-0.5">
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${badgeColor} print:bg-slate-200 print:text-black print:border-slate-400`}
            >
              {nodeData.standardId || 'ITEM'}
            </span>
          </div>
          <h4
            className="text-xs font-bold text-slate-100 print:text-black leading-tight line-clamp-2"
            title={nodeData.title}
          >
            {nodeData.title || 'Sin Título'}
          </h4>
        </div>
      </div>

      {/* Source handle at BOTTOM */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2.5 !h-2.5 !bg-sky-400 !border-2 !border-slate-900 !-bottom-1.5 print:!hidden"
      />
    </div>
  );
});
