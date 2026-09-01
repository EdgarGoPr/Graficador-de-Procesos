import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
import { Clock, AlertCircle } from 'lucide-react';

export const TimerBoundaryNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;
  const sla = nodeData.slaDuration;

  return (
    <div
      className={`group relative flex flex-col items-center justify-center w-28 h-28 rounded-full bg-slate-900 border-2 border-dashed transition-all duration-200 shadow-xl ${
        selected
          ? 'border-cyan-300 ring-4 ring-cyan-500/30 shadow-cyan-500/20 shadow-xl scale-105'
          : 'border-cyan-400 hover:border-cyan-300'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-cyan-400 border-2 border-slate-900 !left-[-6px]"
      />

      <div className="flex flex-col items-center justify-center p-2 text-center">
        <div className="w-8 h-8 rounded-full bg-cyan-500/20 text-cyan-300 flex items-center justify-center mb-1 animate-pulse">
          <Clock className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-mono font-bold text-cyan-300 tracking-wider">
          {nodeData.standardId || 'TMR'}
        </span>
        <span className="text-[10px] font-semibold text-slate-200 line-clamp-1 max-w-[90px] leading-tight">
          {sla ? `${sla.value} ${sla.unit === 'BUSINESS_DAYS' ? 'días háb.' : 'hrs'}` : nodeData.title}
        </span>
        {sla?.isPeremptory && (
          <span className="flex items-center text-[8px] font-bold text-amber-400 mt-0.5">
            <AlertCircle className="w-2 h-2 mr-0.5" />
            PERENTORIO
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-cyan-400 border-2 border-slate-900 !right-[-6px]"
      />
    </div>
  );
});

TimerBoundaryNode.displayName = 'TimerBoundaryNode';
