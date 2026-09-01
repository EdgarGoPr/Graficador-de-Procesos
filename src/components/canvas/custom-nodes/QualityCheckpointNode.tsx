import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
import { hexToRgba } from '../../../types/theme';
import { ShieldCheck, CheckCircle2, AlertOctagon } from 'lucide-react';

export const QualityCheckpointNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;
  const qc = nodeData.qualityCheckpoint;
  const isTitleOnly = nodeData.displayMode === 'title_only';

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

  return (
    <div
      style={customContainerStyle}
      className={`group relative w-full h-full ${isTitleOnly ? 'min-w-[170px] min-h-[70px]' : 'min-w-[200px] min-h-[110px]'} flex flex-col justify-between rounded-xl bg-theme-surface/95 backdrop-blur-sm border-2 border-emerald-500/40 transition-all duration-150 shadow-md ${
        selected ? '!ring-2 !ring-emerald-400 !border-emerald-400 shadow-2xl scale-[1.01]' : 'hover:border-emerald-400/80 hover:shadow-lg'
      }`}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={isTitleOnly ? 150 : 190}
        minHeight={isTitleOnly ? 60 : 100}
        handleClassName="!w-3 !h-3 !bg-emerald-400 !border-2 !border-slate-900 !rounded-full shadow-lg hover:scale-125 transition-transform z-50 cursor-nwse-resize"
        lineClassName="!border-2 !border-emerald-400 !border-dashed"
      />

      {/* Target Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-emerald-400 !border-2 !border-slate-900 !rounded-full shadow-md !left-[-7px] hover:scale-125 transition-transform z-40"
      />

      {/* Top Handle */}
      <Handle
        type="source"
        id="top"
        position={Position.Top}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-slate-900 !rounded-full shadow-md !top-[-6px] hover:scale-125 transition-transform z-40 opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* Bottom Handle */}
      <Handle
        type="source"
        id="bottom"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-emerald-400 !border-2 !border-slate-900 !rounded-full shadow-md !bottom-[-6px] hover:scale-125 transition-transform z-40 opacity-0 group-hover:opacity-100 transition-opacity"
      />

      {/* Inner Clipped Content Container */}
      <div className="w-full h-full flex flex-col justify-between rounded-xl overflow-hidden">
        {/* Header / Title Box */}
        <div
          style={customHeaderStyle}
          className="flex items-center justify-between px-2.5 py-1.5 bg-gradient-to-r from-emerald-500/10 to-transparent rounded-t-lg border-b border-theme-border overflow-hidden shrink-0"
        >
          <div className="flex items-center space-x-1.5 min-w-0">
            <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-400 truncate">
              {qc?.checkpointCode || nodeData.standardId || 'QC-01'}
            </span>
          </div>
          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 uppercase shrink-0">
            ISO 9001
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
          </div>
          
          {!isTitleOnly && (
            <div className="overflow-hidden">
              {qc?.inspectionCriteria && (
                <div className="mt-1 p-1.5 rounded bg-theme-surface-subtle border border-theme-border text-[10px] text-theme-text-muted leading-relaxed overflow-hidden">
                  <div className="font-medium text-emerald-400 flex items-center mb-0.5 truncate">
                    <CheckCircle2 className="w-2.5 h-2.5 mr-1 shrink-0" />
                    <span className="truncate">Criterio de Aceptación:</span>
                  </div>
                  <p className="line-clamp-2 overflow-hidden text-ellipsis">{qc.inspectionCriteria}</p>
                </div>
              )}

              {qc?.evidenceRequired && (
                <div className="mt-1 flex items-center text-[9px] text-theme-text-muted truncate">
                  <AlertOctagon className="w-2.5 h-2.5 text-emerald-400 mr-1 shrink-0" />
                  <span className="truncate font-mono">Reg: {qc.evidenceRequired}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Source Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-emerald-400 !border-2 !border-slate-900 !rounded-full shadow-md !right-[-7px] hover:scale-125 transition-transform z-40"
      />
    </div>
  );
});

QualityCheckpointNode.displayName = 'QualityCheckpointNode';
