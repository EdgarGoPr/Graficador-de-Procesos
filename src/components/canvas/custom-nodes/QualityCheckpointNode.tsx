import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
import { ShieldCheck, CheckCircle2, AlertOctagon } from 'lucide-react';

export const QualityCheckpointNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;
  const qc = nodeData.qualityCheckpoint;

  return (
    <div
      className={`group relative w-full h-full min-w-[200px] min-h-[110px] flex flex-col justify-between rounded-xl bg-theme-surface backdrop-blur-md border-2 border-[#10B981] transition-all duration-150 shadow-xl ${
        selected ? 'ring-4 ring-[#10B981]/40 border-[#10B981] shadow-[#10B981]/20 shadow-2xl scale-[1.01]' : 'hover:border-[#10B981]/80'
      }`}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={190}
        minHeight={100}
        handleClassName="!w-3 !h-3 !bg-[#10B981] !border-2 !border-slate-900 !rounded-full shadow-lg"
        lineClassName="!border-[#10B981] !border-dashed"
      />

      <Handle
        type="target"
        position={Position.Left}
        className="w-3.5 h-3.5 bg-[#10B981] border-2 border-theme-surface !left-[-7px]"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-[#10B981]/20 to-transparent rounded-t-lg border-b border-theme-border">
        <div className="flex items-center space-x-1.5">
          <div className="p-1 rounded-md bg-[#10B981]/15 text-[#10B981]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-mono font-bold tracking-wider text-[#10B981]">
            {qc?.checkpointCode || nodeData.standardId || 'QC-01'}
          </span>
        </div>
        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 uppercase">
          ISO 9001:2015
        </span>
      </div>

      {/* Body */}
      <div className="p-3">
        <h4 className="text-xs font-bold text-theme-text leading-snug line-clamp-2 mb-1">
          {nodeData.title}
        </h4>
        
        {qc?.inspectionCriteria && (
          <div className="mt-2 p-2 rounded bg-theme-surface-subtle border border-theme-border text-[10px] text-theme-text leading-relaxed">
            <div className="font-semibold text-[#10B981] flex items-center mb-0.5">
              <CheckCircle2 className="w-3 h-3 mr-1 shrink-0" />
              Criterio de Inspección:
            </div>
            <p className="line-clamp-2 text-theme-text-muted">{qc.inspectionCriteria}</p>
          </div>
        )}

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-theme-border text-[9px] text-theme-text-muted">
          <span className="flex items-center text-[#10B981] font-medium">
            <AlertOctagon className="w-2.5 h-2.5 mr-1" />
            Muestreo: {qc?.sampleRatePercentage ?? 100}%
          </span>
          <span className="font-mono text-theme-text-muted truncate max-w-[90px]">
            {nodeData.legalFramework || 'Norma de Calidad'}
          </span>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3.5 h-3.5 bg-[#10B981] border-2 border-theme-surface !right-[-7px]"
      />
    </div>
  );
});

QualityCheckpointNode.displayName = 'QualityCheckpointNode';

