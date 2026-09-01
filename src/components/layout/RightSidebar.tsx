import React, { useState, useRef, useCallback } from 'react';
import { useUiStore, RightPanelTab } from '../../store/useUiStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useProjectStore } from '../../store/useProjectStore';
import { ProcessHierarchyNavigator } from './ProcessHierarchyNavigator';
import { PropertiesPanel } from './PropertiesPanel';
import {
  Compass,
  SlidersHorizontal,
  X,
  PanelRightClose,
  PanelRightOpen,
  Layers
} from 'lucide-react';

export const RightSidebar: React.FC = () => {
  const {
    isPropertiesPanelOpen,
    setPropertiesPanelOpen,
    activeRightTab,
    setActiveRightTab
  } = useUiStore();

  const { selectedNodeId, selectedEdgeId } = useCanvasStore();
  const { currentProject } = useProjectStore();

  const [width, setWidth] = useState<number>(360);
  const isResizingRef = useRef<boolean>(false);

  // Mouse Drag Resizing Logic on Left Edge
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (!isResizingRef.current) return;
      const newWidth = Math.max(260, Math.min(680, window.innerWidth - moveEvent.clientX));
      setWidth(newWidth);
    };

    const onMouseUp = () => {
      isResizingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  }, []);

  if (!isPropertiesPanelOpen || !currentProject) return null;

  const hasSelection = Boolean(selectedNodeId || selectedEdgeId);

  return (
    <aside
      style={{ width: `${width}px` }}
      className="relative h-full bg-theme-surface border-l border-theme-border flex flex-col shrink-0 select-none overflow-hidden transition-colors shadow-2xl z-20 group/rightsidebar"
    >
      {/* Manual Drag Resizer on Left Edge */}
      <div
        onMouseDown={startResizing}
        className="absolute top-0 left-[-3px] w-2 h-full cursor-col-resize hover:bg-theme-accent/50 active:bg-theme-accent transition-colors z-30"
        title="Arrastrar con el ratón para ajustar ancho del panel"
      />

      {/* Top Tab Bar */}
      <div className="h-12 px-3 bg-theme-surface-subtle border-b border-theme-border flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-1 bg-theme-surface p-1 rounded-lg border border-theme-border/60">
          <button
            onClick={() => setActiveRightTab('NAVIGATOR')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeRightTab === 'NAVIGATOR'
                ? 'bg-gradient-to-r from-[#0284C7] to-[#3B82F6] text-white shadow-sm font-bold'
                : 'text-theme-text-muted hover:text-theme-text'
            }`}
            title="Ver jerarquía de Macroprocesos y Subprocesos"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Navegador</span>
          </button>

          <button
            onClick={() => setActiveRightTab('PROPERTIES')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              activeRightTab === 'PROPERTIES'
                ? 'bg-gradient-to-r from-[#0284C7] to-[#3B82F6] text-white shadow-sm font-bold'
                : 'text-theme-text-muted hover:text-theme-text'
            }`}
            title="Ver y editar propiedades del elemento seleccionado"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Propiedades</span>
            {hasSelection && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-ping" />
            )}
          </button>
        </div>

        <button
          onClick={() => setPropertiesPanelOpen(false)}
          className="p-1.5 rounded-lg hover:bg-theme-surface text-theme-text-muted hover:text-theme-text transition-colors"
          title="Contraer / Cerrar panel lateral"
        >
          <PanelRightClose className="w-4 h-4" />
        </button>
      </div>

      {/* Panel Content Body */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {activeRightTab === 'NAVIGATOR' ? (
          <ProcessHierarchyNavigator />
        ) : (
          <PropertiesPanel />
        )}
      </div>
    </aside>
  );
};
