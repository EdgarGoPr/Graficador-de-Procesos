import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
import { hexToRgba } from '../../../types/theme';
import { useUiStore } from '../../../store/useUiStore';
import { useCanvasStore } from '../../../store/useCanvasStore';
import { Layers, Maximize2, ListOrdered, FolderOpen } from 'lucide-react';

export const SubProcessNode = memo(({ id, data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;
  const { openSubProcessDetail, showNotification } = useUiStore();
  const { decompressSubProcess } = useCanvasStore();

  const handleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    openSubProcessDetail(id);
  };

  const handleDecompress = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`¿Desea descomprimir "${nodeData.title}" y desplegar sus etapas individuales en el lienzo?`)) {
      const result = decompressSubProcess(id);
      if (result.success) {
        showNotification('Subproceso descomprimido en el lienzo', 'success');
      } else {
        showNotification(result.error || 'Error al descomprimir', 'error');
      }
    }
  };

  const stepsCount = nodeData.subProcessSteps?.length || 0;
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
  const descFontSize = nodeData.customFontSize ? `${Math.max(9, nodeData.customFontSize - 2)}px` : undefined;

  return (
    <div
      style={customContainerStyle}
      className={`group relative w-full h-full ${isTitleOnly ? 'min-w-[180px] min-h-[75px]' : 'min-w-[220px] min-h-[130px]'} flex flex-col justify-between rounded-xl bg-theme-surface/95 backdrop-blur-sm border-2 border-indigo-400/50 transition-all duration-150 shadow-md ${
        selected
          ? '!ring-2 !ring-indigo-400 !border-indigo-400 shadow-2xl scale-[1.01]'
          : 'hover:border-indigo-400/80 hover:shadow-lg'
      }`}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={isTitleOnly ? 160 : 210}
        minHeight={isTitleOnly ? 65 : 120}
        handleClassName="!w-3 !h-3 !bg-indigo-400 !border-2 !border-slate-900 !rounded-full shadow-lg hover:scale-125 transition-transform z-50 cursor-nwse-resize"
        lineClassName="!border-2 !border-indigo-400 !border-dashed"
      />

      {/* Target Handle (Left) */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3.5 !h-3.5 !bg-indigo-400 !border-2 !border-slate-900 !rounded-full shadow-md !left-[-7px] hover:scale-125 transition-transform z-40"
      />

      {/* Inner Clipped Content Container */}
      <div className="w-full h-full flex flex-col justify-between rounded-xl overflow-hidden">
        {/* Header / Title Box */}
        <div
          style={customHeaderStyle}
          className="flex items-center justify-between px-2.5 py-1.5 bg-gradient-to-r from-indigo-500/10 to-transparent rounded-t-lg border-b border-theme-border overflow-hidden shrink-0"
        >
          <div className="flex items-center space-x-1.5 min-w-0">
            <div className="p-1 rounded bg-indigo-500/10 text-indigo-400 shrink-0">
              <Layers className="w-3 h-3" />
            </div>
            <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-400 truncate">
              {nodeData.standardId || 'SUB-01'}
            </span>
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
              Subproceso
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-2.5 flex-1 flex flex-col justify-between overflow-hidden">
          <div className="overflow-hidden">
            <h4
              style={{ fontSize: titleFontSize }}
              className="text-xs font-semibold text-theme-text leading-snug line-clamp-2 mb-1 group-hover:text-indigo-300 transition-colors break-words overflow-hidden text-ellipsis"
            >
              {nodeData.title}
            </h4>
            {!isTitleOnly && nodeData.description && (
              <p
                style={{ fontSize: descFontSize }}
                className="text-[11px] text-theme-text-muted line-clamp-2 leading-relaxed mb-2 break-words overflow-hidden text-ellipsis"
              >
                {nodeData.description}
              </p>
            )}
          </div>

          {/* Steps indicator and Expand / Decompress Buttons */}
          <div className="flex items-center justify-between pt-1.5 border-t border-theme-border text-[10px] overflow-hidden">
            <div className="flex items-center text-theme-text-muted truncate">
              <ListOrdered className="w-3 h-3 mr-1 text-indigo-400 shrink-0" />
              <span className="truncate">{stepsCount > 0 ? `${stepsCount} etapas` : 'Detalle'}</span>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              {stepsCount > 0 && (
                <button
                  onClick={handleDecompress}
                  className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 text-[9px] font-medium transition-all"
                  title="Descomprimir y desplegar actividades en el lienzo"
                >
                  <FolderOpen className="w-2.5 h-2.5" />
                  <span>Descomprimir</span>
                </button>
              )}

              <button
                onClick={handleExpand}
                className="flex items-center space-x-0.5 px-2 py-0.5 rounded bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-[9px] font-semibold transition-all shadow-sm"
                title="Ampliar y ver el flujo detallado de este subproceso"
              >
                <Maximize2 className="w-2.5 h-2.5" />
                <span>Ampliar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Source Handle (Right) */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3.5 !h-3.5 !bg-indigo-400 !border-2 !border-slate-900 !rounded-full shadow-md !right-[-7px] hover:scale-125 transition-transform z-40"
      />
    </div>
  );
});

SubProcessNode.displayName = 'SubProcessNode';
