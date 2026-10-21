import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
import { hexToRgba } from '../../../types/theme';
import { getNodeTextContrast } from '../../../utils/nodeContrast';
import { useUiStore } from '../../../store/useUiStore';
import { useCanvasStore } from '../../../store/useCanvasStore';
import { Layers, Maximize2, ListOrdered, FolderOpen, Plus, FolderInput, ExternalLink } from 'lucide-react';

export const SubProcessNode = memo(({ id, data, selected }: NodeProps<any>) => {
  const nodeData = data as BpmnNodeData;
  const { openSubProcessDetail, showNotification } = useUiStore();
  const { decompressSubProcess, enterSubProcess } = useCanvasStore();

  const handleOpenLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!nodeData.link) return;
    const raw = nodeData.link.trim();
    if (!raw) return;
    const href = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  const handleEnterSubProcess = (e: React.MouseEvent) => {
    e.stopPropagation();
    enterSubProcess(id);
  };

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
  const contrast = getNodeTextContrast(nodeData.customBgColor, opacity);

  const customContainerStyle: React.CSSProperties = {
    backgroundColor: nodeData.customBgColor ? hexToRgba(nodeData.customBgColor, opacity) : undefined,
    borderColor: nodeData.customBorderColor || undefined,
    color: nodeData.customTextColor || contrast.bodyColor,
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
      onDoubleClick={handleEnterSubProcess}
      title="Doble clic o clic en [+] para ingresar al subproceso"
      className={`group relative w-full h-full ${isTitleOnly ? 'min-w-[180px] min-h-[75px]' : 'min-w-[230px] min-h-[135px]'} flex flex-col justify-between rounded-xl bg-theme-surface/95 backdrop-blur-sm border-2 border-indigo-400/50 transition-colors transition-shadow duration-150 shadow-md ${
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
            {nodeData.link && (
              <button
                type="button"
                onClick={handleOpenLink}
                title={`Abrir enlace: ${nodeData.link}`}
                className="p-1 rounded bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 transition-all hover:scale-110 shadow-xs cursor-pointer flex items-center justify-center"
              >
                <ExternalLink className="w-2.5 h-2.5" />
              </button>
            )}
            <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
              Subproceso
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-2.5 flex-1 flex flex-col justify-between overflow-hidden">
          <div className="overflow-hidden">
            <h4
              style={{ fontSize: titleFontSize, color: nodeData.customTextColor || contrast.titleColor }}
              className="text-xs font-semibold leading-snug line-clamp-2 mb-1 group-hover:text-indigo-300 transition-colors break-words overflow-hidden text-ellipsis cursor-pointer"
            >
              {nodeData.title}
            </h4>
            {!isTitleOnly && nodeData.description && (
              <p
                style={{ fontSize: descFontSize, color: contrast.bodyColor }}
                className="text-[11px] line-clamp-2 leading-relaxed mb-2 break-words overflow-hidden text-ellipsis"
              >
                {nodeData.description}
              </p>
            )}
          </div>

          {/* Steps indicator and Action Buttons */}
          <div
            style={{ borderColor: contrast.borderColor }}
            className="flex items-center justify-between pt-1.5 border-t text-[10px] overflow-hidden"
          >
            <div style={{ color: contrast.mutedColor }} className="flex items-center truncate">
              <ListOrdered className="w-3 h-3 mr-1 text-indigo-400 shrink-0" />
              <span className="truncate">{stepsCount > 0 ? `${stepsCount} etapas` : 'Detalle'}</span>
            </div>

            <div className="flex items-center space-x-1 shrink-0">
              {stepsCount > 0 && (
                <button
                  type="button"
                  onClick={handleDecompress}
                  className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 text-[9px] font-medium transition-all"
                  title="Descomprimir y desplegar actividades en el lienzo actual"
                >
                  <FolderOpen className="w-2.5 h-2.5" />
                  <span>Descomprimir</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleExpand}
                className="flex items-center space-x-0.5 px-1.5 py-0.5 rounded bg-theme-surface-subtle hover:bg-theme-surface text-theme-text-muted hover:text-theme-text border border-theme-border text-[9px] font-medium transition-all"
                title="Ver resumen y propiedades del subproceso"
              >
                <Maximize2 className="w-2.5 h-2.5" />
                <span>Detalle</span>
              </button>

              <button
                type="button"
                onClick={handleEnterSubProcess}
                className="flex items-center space-x-0.5 px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/40 text-[9px] font-semibold transition-all shadow-sm"
                title="Ingresar y editar el diagrama interno de este subproceso (Doble clic)"
              >
                <FolderInput className="w-2.5 h-2.5" />
                <span>Ingresar</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BPMN 2.0 Standard Collapsed Sub-Process [+] Marker */}
      <button
        type="button"
        onClick={handleEnterSubProcess}
        className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-30 flex items-center justify-center w-6 h-6 rounded bg-slate-900 border-2 border-indigo-400 text-indigo-300 hover:bg-indigo-600 hover:text-white shadow-lg hover:scale-110 active:scale-95 transition-all group-hover:border-indigo-300"
        title="BPMN 2.0 [+] Entrar al diagrama de este subproceso (o doble clic)"
      >
        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
      </button>

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
