import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
import { hexToRgba } from '../../../types/theme';
import { ShieldCheck, CheckCircle2, AlertOctagon } from 'lucide-react';

export const QualityCheckpointNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;
  const qc = nodeData.qualityCheckpoint;

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

  return (
    <div
      style={customContainerStyle}
      className={`group relative w-full h-full min-w-[200px] min-h-[110px] flex flex-col justify-between rounded-xl bg-theme-surface/95 backdrop-blur-sm border-2 border-emerald-500/40 transition-all duration-150 shadow-md ${
        selected ? 'ring-2 ring-emerald-400/40 border-emerald-400 shadow-xl scale-[1.01]' : 'hover:border-emerald-400/80 hover:shadow-lg'
      }`}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={190}
        minHeight={100}
        handleClassName="!w-2.5 !h-2.5 !bg-emerald-400 !border-2 !border-slate-900 !rounded-full shadow-md"
        lineClassName="!border-emerald-400 !border-dashed"
      />

      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 bg-emerald-400 border-2 border-theme-surface !left-[-5px]"
      />

      {/* Header / Title Box */}
      <div
        style={customHeaderStyle}
        className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-t-lg border-b border-theme-border"
      >
        <div className="flex items-center space-x-1.5">
          <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
          </div>
          <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-400">
            {qc?.checkpointCode || nodeData.standardId || 'QC-01'}
          </span>
        </div>
        <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 uppercase">
          ISO 9001
        </span>
      </div>

      {/* Body */}
      <div className="p-3">
        <h4 className="text-xs font-semibold text-theme-text leading-snug line-clamp-2 mb-1">
          {nodeData.title}
        </h4>
        
        {qc?.inspectionCriteria && (
          <div className="mt-1.5 p-1.5 rounded bg-theme-surface-subtle border border-theme-border text-[10px] text-theme-text-muted leading-relaxed">
            <div className="font-medium text-emerald-400 flex items-center mb-0.5">
              <CheckCircle2 className="w-2.5 h-2.5 mr-1 shrink-0" />
              Criterio de Aceptación:
            </div>
            <p className="line-clamp-2">{qc.inspectionCriteria}</p>
          </div>
        )}

        {qc?.evidenceRequired && (
          <div className="mt-1.5 flex items-center text-[9px] text-theme-text-muted">
            <AlertOctagon className="w-2.5 h-2.5 text-emerald-400 mr-1 shrink-0" />
            <span className="truncate font-mono">Reg: {qc.evidenceRequired}</span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 bg-emerald-400 border-2 border-theme-surface !right-[-5px]"
      />
    </div>
  );
});

QualityCheckpointNode.displayName = 'QualityCheckpointNode';
