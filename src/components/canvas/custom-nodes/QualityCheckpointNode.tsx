import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
import { hexToRgba } from '../../../types/theme';
import { resolveNodeTextColors } from '../../../utils/nodeContrast';
import { useIsDarkTheme } from '../../../store/useUiStore';
import { ShieldCheck, CheckCircle2, AlertOctagon } from 'lucide-react';

export const QualityCheckpointNode = memo(({ data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;
  const qc = nodeData.qualityCheckpoint;
  const isTitleOnly = nodeData.displayMode === 'title_only';

  const opacity = nodeData.customBgOpacity ?? 95;
  const isDarkTheme = useIsDarkTheme();
  const resolved = resolveNodeTextColors(nodeData, opacity, isDarkTheme);
  const { contrast } = resolved;

  const customContainerStyle: React.CSSProperties = {
    backgroundColor: nodeData.customBgColor ? hexToRgba(nodeData.customBgColor, opacity) : undefined,
    borderColor: nodeData.customBorderColor || undefined,
    color: resolved.descriptionColor,
  };

  const customHeaderStyle: React.CSSProperties = {
    backgroundColor: nodeData.customHeaderBgColor || undefined,
    color: resolved.headerIdColor || undefined,
  };

  const titleFontSize = nodeData.customFontSize ? `${nodeData.customFontSize}px` : undefined;

  return (
    <div
      style={customContainerStyle}
      className={`group relative w-full h-full ${isTitleOnly ? 'min-w-[170px] min-h-[70px]' : 'min-w-[200px] min-h-[110px]'} flex flex-col justify-between rounded-xl bg-theme-surface/95 backdrop-blur-sm border-2 border-fuchsia-500/40 transition-colors transition-shadow duration-150 shadow-md ${
        selected ? '!ring-2 !ring-fuchsia-400 !border-fuchsia-400 shadow-2xl scale-[1.01]' : 'hover:border-fuchsia-400/80 hover:shadow-lg'
      }`}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={isTitleOnly ? 150 : 190}
        minHeight={isTitleOnly ? 60 : 100}
        handleClassName="!w-3 !h-3 !bg-fuchsia-400 !border-2 !border-slate-900 !rounded-full shadow-lg hover:scale-125 transition-transform z-50 cursor-nwse-resize"
        lineClassName="!border-2 !border-fuchsia-400 !border-dashed"
      />

      {/* Target Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-fuchsia-400 !border-2 !border-slate-900 !rounded-full shadow-md !left-[-7px] hover:scale-125 transition-transform z-40"
      />

      {/* Inner Clipped Content Container */}
      <div className="w-full h-full flex flex-col justify-between rounded-xl overflow-hidden">
        {/* Header / Title Box */}
        <div
          style={customHeaderStyle}
          className="flex items-center justify-between px-2.5 py-1.5 bg-gradient-to-r from-fuchsia-500/10 to-transparent rounded-t-lg border-b border-theme-border overflow-hidden shrink-0"
        >
          <div className="flex items-center space-x-1.5 min-w-0">
            <div
              style={resolved.headerIdColor ? { color: resolved.headerIdColor } : undefined}
              className="p-1 rounded-md bg-fuchsia-500/10 text-fuchsia-400 shrink-0"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span
              style={resolved.headerIdColor ? { color: resolved.headerIdColor } : undefined}
              className="text-[10px] font-mono font-bold tracking-wider text-fuchsia-400 truncate"
            >
              {qc?.checkpointCode || nodeData.standardId || 'QCP-01'}
            </span>
          </div>
          <span
            style={resolved.badgeColor ? { color: resolved.badgeColor, borderColor: resolved.badgeColor } : undefined}
            className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/25 uppercase shrink-0"
          >
            CONTROL
          </span>
        </div>

        {/* Body */}
        <div className="p-2.5 flex-1 flex flex-col justify-between overflow-hidden">
          <div className="overflow-hidden">
            <h4
              style={{ fontSize: titleFontSize, color: resolved.titleColor }}
              className="text-xs font-semibold leading-snug line-clamp-2 mb-1 break-words overflow-hidden text-ellipsis"
            >
              {nodeData.title}
            </h4>
          </div>
          
          {!isTitleOnly && (
            <div className="overflow-hidden">
              {qc?.inspectionCriteria && (
                <div
                  style={{ backgroundColor: contrast.subtleBg, borderColor: contrast.borderColor }}
                  className="mt-1 p-1.5 rounded border text-[10px] leading-relaxed overflow-hidden"
                >
                  <div
                    style={nodeData.customDescriptionTextColor || nodeData.customTextColor ? { color: resolved.descriptionColor } : undefined}
                    className="font-medium text-fuchsia-400 flex items-center mb-0.5 truncate"
                  >
                    <CheckCircle2 className="w-2.5 h-2.5 mr-1 shrink-0" />
                    <span className="truncate">Criterio de Aceptación:</span>
                  </div>
                  <p style={{ color: resolved.descriptionColor }} className="line-clamp-2 overflow-hidden text-ellipsis">{qc.inspectionCriteria}</p>
                </div>
              )}

              {qc?.evidenceRequired && (
                <div style={{ color: resolved.metaColor }} className="mt-1 flex items-center text-[9px] truncate">
                  <AlertOctagon
                    style={nodeData.customMetaTextColor || nodeData.customTextColor ? { color: resolved.metaColor } : undefined}
                    className="w-2.5 h-2.5 text-fuchsia-400 mr-1 shrink-0"
                  />
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
        className="!w-3.5 !h-3.5 !bg-fuchsia-400 !border-2 !border-slate-900 !rounded-full shadow-md !right-[-7px] hover:scale-125 transition-transform z-40"
      />
    </div>
  );
});

QualityCheckpointNode.displayName = 'QualityCheckpointNode';
