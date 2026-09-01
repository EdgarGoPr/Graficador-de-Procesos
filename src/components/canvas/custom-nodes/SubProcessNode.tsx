import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
import { Layers, PlusSquare } from 'lucide-react';

export const SubProcessNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;

  return (
    <div
      className={`group relative w-64 rounded-xl bg-slate-900/90 backdrop-blur-md border-2 border-indigo-500/70 transition-all duration-200 shadow-xl ${
        selected ? 'ring-4 ring-indigo-500/30 border-indigo-400 shadow-indigo-500/20 shadow-2xl scale-[1.02]' : 'hover:border-indigo-400'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 bg-indigo-400 border-2 border-slate-900 !left-[-7px]"
      />

      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-indigo-950/60 to-transparent rounded-t-lg border-b border-indigo-900/40">
        <div className="flex items-center space-x-1.5">
          <div className="p-1 rounded bg-indigo-500/20 text-indigo-300">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-mono font-bold tracking-wider text-indigo-300">
            {nodeData.standardId || 'SUB-01'}
          </span>
        </div>
        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300">
          Subproceso
        </span>
      </div>

      <div className="p-3">
        <h4 className="text-xs font-bold text-slate-100 leading-snug line-clamp-2 mb-1">
          {nodeData.title}
        </h4>
        <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2">
          {nodeData.description}
        </p>
        
        <div className="flex items-center justify-center pt-2 border-t border-slate-800 text-[10px] text-indigo-400">
          <PlusSquare className="w-3.5 h-3.5 mr-1" />
          <span>Detalle Expandible</span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3.5 h-3.5 bg-indigo-400 border-2 border-slate-900 !right-[-7px]"
      />
    </div>
  );
});

SubProcessNode.displayName = 'SubProcessNode';
