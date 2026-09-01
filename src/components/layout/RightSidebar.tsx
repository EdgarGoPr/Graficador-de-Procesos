import React from 'react';
import { useUiStore, RightPanelTab } from '../../store/useUiStore';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useProjectStore } from '../../store/useProjectStore';
import { ProcessHierarchyNavigator } from './ProcessHierarchyNavigator';
import { PropertiesPanel } from './PropertiesPanel';
import {
  Compass,
  SlidersHorizontal,
  X,
  Layers,
  FileCode2
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

  if (!isPropertiesPanelOpen || !currentProject) return null;

  const hasSelection = Boolean(selectedNodeId || selectedEdgeId);

  return (
    <aside className="w-84 md:w-92 h-full bg-theme-surface border-l border-theme-border flex flex-col shrink-0 select-none overflow-hidden transition-colors shadow-2xl z-20">
      {/* Top Tab Bar */}
      <div className="h-11 px-2 bg-theme-surface-subtle border-b border-theme-border flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-1 bg-theme-surface p-1 rounded-lg border border-theme-border/60">
          <button
            onClick={() => setActiveRightTab('NAVIGATOR')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              activeRightTab === 'NAVIGATOR'
                ? 'bg-gradient-to-r from-[#0284C7] to-[#3B82F6] text-white shadow-sm font-bold'
                : 'text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Navegador</span>
          </button>

          <button
            onClick={() => setActiveRightTab('PROPERTIES')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              activeRightTab === 'PROPERTIES'
                ? 'bg-gradient-to-r from-[#0284C7] to-[#3B82F6] text-white shadow-sm font-bold'
                : 'text-theme-text-muted hover:text-theme-text'
            }`}
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
          title="Ocultar panel lateral"
        >
          <X className="w-4 h-4" />
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
