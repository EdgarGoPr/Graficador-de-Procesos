import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
import { ShieldCheck, CheckCircle2, AlertOctagon } from 'lucide-react';

export const QualityCheckpointNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;
  const qc = nodeData.qualityCheckpoint;

  const isCritical = qc?.severity === 'CRITICAL';

  return (
    <div
      className={`group relative w-60 rounded-xl bg-slate-900/95 backdrop-blur-md border-2 transition-all duration-200 shadow-xl ${
        isCritical ? 'border-pink-500 shadow-pink-500/10' : 'border-pink-400'
      } ${
        selected ? 'ring-4 ring-pink-500/40 border-pink-300 shadow-pink-500/20 shadow-2xl scale-[1.02]' : 'hover:border-pink-300'
      }`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 bg-pink-400 border-2 border-slate-900 !left-[-7px]"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-pink-950/60 to-slate-900 rounded-t-lg border-b border-pink-900/40">
        <div className="flex items-center space-x-1.5">
          <div className="p-1 rounded-md bg-pink-500/20 text-pink-300">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-mono font-bold tracking-wider text-pink-300">
            {qc?.checkpointCode || nodeData.standardId || 'QC-01'}
          </span>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 uppercase">
          ISO 9001:2015
        </span>
      </div>

      {/* Body */}
      <div className="p-3">
        <h4 className="text-xs font-bold text-slate-100 leading-snug line-clamp-2 mb-1">
          {nodeData.title}
        </h4>
        
        {qc?.inspectionCriteria && (
          <div className="mt-2 p-2 rounded bg-pink-950/30 border border-pink-900/30 text-[10px] text-pink-200/90 leading-relaxed">
            <div className="font-semibold text-pink-300 flex items-center mb-0.5">
              <CheckCircle2 className="w-3 h-3 mr-1 shrink-0" />
              Criterio de Inspección:
            </div>
            <p className="line-clamp-2">{qc.inspectionCriteria}</p>
          </div>
        )}

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[9px] text-slate-400">
          <span className="flex items-center text-pink-400 font-medium">
            <AlertOctagon className="w-2.5 h-2.5 mr-1" />
            Muestreo: {qc?.sampleRatePercentage ?? 100}%
          </span>
          <span className="font-mono text-slate-400 truncate max-w-[90px]">
            {nodeData.legalFramework || 'Norma de Calidad'}
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3.5 h-3.5 bg-pink-400 border-2 border-slate-900 !right-[-7px]"
      />
    </div>
  );
});

QualityCheckpointNode.displayName = 'QualityCheckpointNode';
