import React, { useState, useRef, useCallback } from 'react';
import { ViewportPortal, Panel, useReactFlow } from '@xyflow/react';
import { useProjectStore } from '../../store/useProjectStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useUiStore } from '../../store/useUiStore';
import { PrintFrame, PageFormat, PageOrientation, DEFAULT_PAGE_DIMENSIONS, getFrameAspectRatio } from '../../types/printFrame';
import { exportMultiPageDiagramPdf } from '../../services/pdfDiagramExportService';
import {
  Printer,
  Plus,
  Maximize2,
  Trash2,
  Download,
  X,
  Layers,
  RotateCw,
  FileSpreadsheet,
  CheckCircle2
} from 'lucide-react';

interface DragState {
  type: 'move' | 'resize';
  handle?: 'se' | 'sw' | 'ne' | 'nw' | 'e' | 's';
  frameId: string;
  startX: number;
  startY: number;
  initialFrameX: number;
  initialFrameY: number;
  initialWidth: number;
  initialHeight: number;
  aspectRatio: number;
}

export const PrintFrameOverlay: React.FC = () => {
  const { currentProject } = useProjectStore();
  const {
    isPrintOverlayVisible,
    togglePrintOverlay,
    addPrintFrame,
    updatePrintFrame,
    deletePrintFrame,
    autoLayoutPrintFrames
  } = useCanvasStore();
  const { showNotification } = useUiStore();
  const { getZoom } = useReactFlow();

  const [isExporting, setIsExporting] = useState(false);
  const dragStateRef = useRef<DragState | null>(null);

  const frames = currentProject?.printFrames || [];

  // Drag & Move Handler
  const handleMouseDownMove = (e: React.MouseEvent, frame: PrintFrame) => {
    e.stopPropagation();
    e.preventDefault();

    const zoom = getZoom() || 1;
    dragStateRef.current = {
      type: 'move',
      frameId: frame.id,
      startX: e.clientX,
      startY: e.clientY,
      initialFrameX: frame.x,
      initialFrameY: frame.y,
      initialWidth: frame.width,
      initialHeight: frame.height,
      aspectRatio: getFrameAspectRatio(frame.format, frame.orientation),
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStateRef.current || dragStateRef.current.type !== 'move') return;
      const dx = (moveEvent.clientX - dragStateRef.current.startX) / zoom;
      const dy = (moveEvent.clientY - dragStateRef.current.startY) / zoom;

      updatePrintFrame(dragStateRef.current.frameId, {
        x: Math.round(dragStateRef.current.initialFrameX + dx),
        y: Math.round(dragStateRef.current.initialFrameY + dy),
      });
    };

    const handleMouseUp = () => {
      dragStateRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Resize Handler
  const handleMouseDownResize = (
    e: React.MouseEvent,
    frame: PrintFrame,
    handle: 'se' | 'sw' | 'ne' | 'nw' | 'e' | 's'
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const zoom = getZoom() || 1;
    const aspect = getFrameAspectRatio(frame.format, frame.orientation);

    dragStateRef.current = {
      type: 'resize',
      handle,
      frameId: frame.id,
      startX: e.clientX,
      startY: e.clientY,
      initialFrameX: frame.x,
      initialFrameY: frame.y,
      initialWidth: frame.width,
      initialHeight: frame.height,
      aspectRatio: aspect,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!dragStateRef.current || dragStateRef.current.type !== 'resize') return;
      const state = dragStateRef.current;
      const dx = (moveEvent.clientX - state.startX) / zoom;
      const dy = (moveEvent.clientY - state.startY) / zoom;

      let newWidth = state.initialWidth;
      let newHeight = state.initialHeight;
      let newX = state.initialFrameX;
      let newY = state.initialFrameY;

      if (state.handle === 'se') {
        newWidth = Math.max(300, state.initialWidth + dx);
        newHeight = Math.round(newWidth / state.aspectRatio);
      } else if (state.handle === 'e') {
        newWidth = Math.max(300, state.initialWidth + dx);
        newHeight = Math.round(newWidth / state.aspectRatio);
      } else if (state.handle === 's') {
        newHeight = Math.max(200, state.initialHeight + dy);
        newWidth = Math.round(newHeight * state.aspectRatio);
      } else if (state.handle === 'sw') {
        newWidth = Math.max(300, state.initialWidth - dx);
        newHeight = Math.round(newWidth / state.aspectRatio);
        newX = state.initialFrameX + (state.initialWidth - newWidth);
      } else if (state.handle === 'ne') {
        newWidth = Math.max(300, state.initialWidth + dx);
        newHeight = Math.round(newWidth / state.aspectRatio);
        newY = state.initialFrameY + (state.initialHeight - newHeight);
      } else if (state.handle === 'nw') {
        newWidth = Math.max(300, state.initialWidth - dx);
        newHeight = Math.round(newWidth / state.aspectRatio);
        newX = state.initialFrameX + (state.initialWidth - newWidth);
        newY = state.initialFrameY + (state.initialHeight - newHeight);
      }

      updatePrintFrame(state.frameId, {
        x: Math.round(newX),
        y: Math.round(newY),
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      });
    };

    const handleMouseUp = () => {
      dragStateRef.current = null;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleExportPdf = async () => {
    if (!currentProject) return;
    try {
      setIsExporting(true);
      const fileName = await exportMultiPageDiagramPdf(currentProject, frames, {
        themeMode: 'light',
        includeHeaderFooter: true,
      });
      showNotification(`PDF generado exitosamente: ${fileName}`, 'success');
    } catch (error) {
      console.error('Error al exportar PDF:', error);
      showNotification('Ocurrió un error al generar el documento PDF.', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isPrintOverlayVisible) return null;

  return (
    <>
      {/* 1. Canvas Viewport Layer: Dotted Framing Boxes */}
      <ViewportPortal>
        {frames.map((frame, index) => {
          return (
            <div
              key={frame.id}
              style={{
                position: 'absolute',
                transform: `translate(${frame.x}px, ${frame.y}px)`,
                width: `${frame.width}px`,
                height: `${frame.height}px`,
                pointerEvents: 'auto',
                zIndex: 10,
              }}
              className="group border-2 border-dashed border-[#0284C7] bg-[#0284C7]/[0.03] rounded-xl transition-shadow hover:border-[#38BDF8] hover:shadow-lg select-none"
            >
              {/* Header Floating Action Bar */}
              <div
                onMouseDown={(e) => handleMouseDownMove(e, frame)}
                className="absolute -top-10 left-0 right-0 h-9 bg-[#0F172A]/90 hover:bg-[#0F172A] border border-[#0284C7]/60 backdrop-blur-md rounded-lg px-3 flex items-center justify-between shadow-md cursor-grab active:cursor-grabbing text-xs text-white"
              >
                {/* Badge / Page Number */}
                <div className="flex items-center space-x-2 font-bold">
                  <span className="flex items-center text-[#38BDF8]">
                    <Printer className="w-3.5 h-3.5 mr-1.5" />
                    Hoja {index + 1}
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className="text-slate-300 font-normal">
                    {frame.format} {frame.orientation === 'landscape' ? 'Apaisado' : 'Retrato'}
                  </span>
                </div>

                {/* Controls */}
                <div
                  className="flex items-center space-x-1.5"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  {/* Format Selector */}
                  <select
                    value={frame.format}
                    onChange={(e) =>
                      updatePrintFrame(frame.id, {
                        format: e.target.value as PageFormat,
                      })
                    }
                    className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-1.5 py-0.5 text-[11px] font-medium outline-none hover:border-[#0284C7]"
                  >
                    <option value="A4">A4 (297×210 mm)</option>
                    <option value="LETTER">Carta (11×8.5")</option>
                    <option value="A3">A3 (420×297 mm)</option>
                  </select>

                  {/* Orientation Switch */}
                  <button
                    onClick={() =>
                      updatePrintFrame(frame.id, {
                        orientation:
                          frame.orientation === 'landscape'
                            ? 'portrait'
                            : 'landscape',
                      })
                    }
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
                    title={
                      frame.orientation === 'landscape'
                        ? 'Cambiar a Retrato (Vertical)'
                        : 'Cambiar a Apaisado (Horizontal)'
                    }
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>

                  {/* Delete Frame */}
                  <button
                    onClick={() => deletePrintFrame(frame.id)}
                    className="p-1 rounded bg-red-950/60 hover:bg-red-600 text-red-300 hover:text-white border border-red-800/40 transition-colors"
                    title="Eliminar esta hoja de impresión"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Watermark Page Indicator */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <span className="text-6xl font-black tracking-widest text-[#0284C7]">
                  PÁGINA {index + 1}
                </span>
              </div>

              {/* Resize Handles */}
              {/* Southeast (Bottom-Right) */}
              <div
                onMouseDown={(e) => handleMouseDownResize(e, frame, 'se')}
                className="absolute -bottom-2 -right-2 w-4 h-4 bg-[#0284C7] border-2 border-white rounded-full cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                title="Arrastrar para redimensionar hoja"
              />

              {/* Southwest (Bottom-Left) */}
              <div
                onMouseDown={(e) => handleMouseDownResize(e, frame, 'sw')}
                className="absolute -bottom-2 -left-2 w-4 h-4 bg-[#0284C7] border-2 border-white rounded-full cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                title="Arrastrar para redimensionar hoja"
              />

              {/* Northeast (Top-Right) */}
              <div
                onMouseDown={(e) => handleMouseDownResize(e, frame, 'ne')}
                className="absolute -top-2 -right-2 w-4 h-4 bg-[#0284C7] border-2 border-white rounded-full cursor-nesw-resize shadow-md hover:scale-125 transition-transform"
                title="Arrastrar para redimensionar hoja"
              />

              {/* Northwest (Top-Left) */}
              <div
                onMouseDown={(e) => handleMouseDownResize(e, frame, 'nw')}
                className="absolute -top-2 -left-2 w-4 h-4 bg-[#0284C7] border-2 border-white rounded-full cursor-nwse-resize shadow-md hover:scale-125 transition-transform"
                title="Arrastrar para redimensionar hoja"
              />
            </div>
          );
        })}
      </ViewportPortal>

      {/* 2. Floating Bottom Toolbar for Print Setup */}
      <Panel position="bottom-center" className="mb-6 z-30 pointer-events-auto">
        <div className="bg-[#0F172A]/95 border border-[#0284C7]/50 backdrop-blur-lg rounded-2xl px-5 py-2.5 shadow-2xl flex items-center space-x-3 select-none animate-slideUp">
          {/* Header Tag */}
          <div className="flex items-center space-x-2 pr-3 border-r border-slate-700">
            <div className="p-1.5 rounded-lg bg-[#0284C7]/20 text-[#38BDF8]">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Hojas de Impresión</span>
                <span className="px-1.5 py-0.2 bg-[#0284C7] text-white rounded text-[10px] font-mono">
                  {frames.length} {frames.length === 1 ? 'Hoja' : 'Hojas'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Arrastra y ajusta los recuadros punteados
              </p>
            </div>
          </div>

          {/* Action: Add Page */}
          <button
            onClick={() => addPrintFrame('A4', 'landscape')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white text-xs font-medium border border-slate-700 transition-all active:scale-95"
            title="Agregar una nueva hoja A4 horizontal"
          >
            <Plus className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span>+ Agregar Hoja</span>
          </button>

          {/* Action: Auto-Encuadrar */}
          <button
            onClick={() => autoLayoutPrintFrames('A4', 'landscape')}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 hover:text-white text-xs font-medium border border-slate-700 transition-all active:scale-95"
            title="Calcular y distribuir automáticamente las hojas sobre todo el proceso"
          >
            <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Auto-Encuadrar</span>
          </button>

          {/* Action: Export Multi-page PDF */}
          <button
            onClick={handleExportPdf}
            disabled={isExporting || frames.length === 0}
            className="flex items-center space-x-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#3B82F6] hover:brightness-110 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-sky-500/20 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Generando PDF...' : 'Guardar PDF Diagrama'}</span>
          </button>

          {/* Close Overlay */}
          <button
            onClick={togglePrintOverlay}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors"
            title="Ocultar recuadros de impresión"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </Panel>
    </>
  );
};
