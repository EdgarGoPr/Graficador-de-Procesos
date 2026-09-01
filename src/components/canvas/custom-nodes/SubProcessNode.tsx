import React, { memo } from 'react';
import { Handle, Position, NodeProps, NodeResizer } from '@xyflow/react';
import { BpmnNodeData } from '../../../types/process';
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

  const customContainerStyle: React.CSSProperties = {
    backgroundColor: nodeData.customBgColor || undefined,
    borderColor: nodeData.customBorderColor || undefined,
  };

  return (
    <div
      style={customContainerStyle}
      className={`group relative w-full h-full min-w-[220px] min-h-[130px] flex flex-col justify-between rounded-xl bg-theme-surface/95 backdrop-blur-sm border-2 border-indigo-400/50 transition-all duration-150 shadow-md ${
        selected
          ? 'ring-2 ring-indigo-400/40 border-indigo-400 shadow-xl scale-[1.01]'
          : 'hover:border-indigo-400/80 hover:shadow-lg'
      }`}
    >
      <NodeResizer
        isVisible={selected}
        minWidth={210}
        minHeight={120}
        handleClassName="!w-2.5 !h-2.5 !bg-indigo-400 !border-2 !border-slate-900 !rounded-full shadow-md"
        lineClassName="!border-indigo-400 !border-dashed"
      />

      <Handle
        type="target"
        position={Position.Left}
        className="w-2.5 h-2.5 bg-indigo-400 border-2 border-theme-surface !left-[-5px]"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-indigo-500/10 to-transparent rounded-t-lg border-b border-theme-border">
        <div className="flex items-center space-x-1.5">
          <div className="p-1 rounded bg-indigo-500/10 text-indigo-400">
            <Layers className="w-3 h-3" />
          </div>
          <span className="text-[10px] font-mono font-bold tracking-wider text-indigo-400">
            {nodeData.standardId || 'SUB-01'}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/25">
            Subproceso
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-3">
        <h4 className="text-xs font-semibold text-theme-text leading-snug line-clamp-2 mb-1 group-hover:text-indigo-300 transition-colors">
          {nodeData.title}
        </h4>
        <p className="text-[11px] text-theme-text-muted line-clamp-2 leading-relaxed mb-2.5">
          {nodeData.description}
        </p>

        {/* Steps indicator and Expand / Decompress Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-theme-border text-[10px]">
          <div className="flex items-center text-theme-text-muted">
            <ListOrdered className="w-3 h-3 mr-1 text-indigo-400" />
            <span>{stepsCount > 0 ? `${stepsCount} etapas` : 'Detalle configurable'}</span>
          </div>

          <div className="flex items-center space-x-1.5">
            {stepsCount > 0 && (
              <button
                onClick={handleDecompress}
                className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/25 text-[10px] font-medium transition-all"
                title="Descomprimir y desplegar actividades en el lienzo"
              >
                <FolderOpen className="w-2.5 h-2.5" />
                <span>Descomprimir</span>
              </button>
            )}

            <button
              onClick={handleExpand}
              className="flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-indigo-500/15 hover:bg-indigo-500/30 text-indigo-300 hover:text-white border border-indigo-500/30 text-[10px] font-semibold transition-all shadow-sm"
              title="Ampliar y ver el flujo detallado de este subproceso"
            >
              <Maximize2 className="w-2.5 h-2.5" />
              <span>Ampliar</span>
            </button>
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-2.5 h-2.5 bg-indigo-400 border-2 border-theme-surface !right-[-5px]"
      />
    </div>
  );
});

SubProcessNode.displayName = 'SubProcessNode';
