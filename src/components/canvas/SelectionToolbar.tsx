import React from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { Box, Copy, Clipboard, Trash2, RotateCcw, AlignJustify, Lock, Unlock } from 'lucide-react';

export const SelectionToolbar: React.FC = () => {
  const {
    selectedNodeIds,
    clipboardPayload,
    copySelection,
    pasteSelection,
    setCompressModalOpen,
    deleteSelected,
    updateNodeData,
    alignAllLanes,
    isCanvasLocked,
    toggleCanvasLock,
    toggleLockSelected
  } = useCanvasStore();

  const { currentProject } = useProjectStore();
  const { showNotification } = useUiStore();

  const hasSelection = selectedNodeIds.length > 0;
  const hasMultiple = selectedNodeIds.length >= 2;
  const hasClipboard = Boolean(clipboardPayload && clipboardPayload.nodes.length > 0);
  const hasLanes = currentProject?.nodes.some((n) => n.type === 'PoolLane') ?? false;
  const isSelectionLocked = hasSelection && (currentProject?.nodes.some((n) => selectedNodeIds.includes(n.id) && n.data?.isLocked) ?? false);

  if (!hasSelection && !hasClipboard && !hasLanes && !isCanvasLocked) return null;

  const handleCopy = () => {
    const ok = copySelection();
    if (ok) {
      showNotification(`Copiado al portapapeles (${selectedNodeIds.length} elemento${selectedNodeIds.length > 1 ? 's' : ''})`, 'info');
    }
  };

  const handlePaste = () => {
    const ok = pasteSelection();
    if (ok) {
      showNotification('Elementos pegados en el lienzo', 'success');
    }
  };

  const handleToggleOrientation = () => {
    if (!currentProject) return;
    selectedNodeIds.forEach((id) => {
      const node = currentProject.nodes.find((n) => n.id === id);
      if (node) {
        const nextOrientation = node.data.orientation === 'vertical' ? 'horizontal' : 'vertical';
        updateNodeData(id, { orientation: nextOrientation });
      }
    });
    showNotification('Orientación actualizada', 'info');
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-1.5 p-1.5 rounded-2xl bg-theme-surface/95 backdrop-blur-md border border-theme-border shadow-2xl animate-fadeIn">
      {hasSelection && (
        <div className="flex items-center px-2 py-1 bg-theme-surface-subtle rounded-xl text-[11px] font-mono font-bold text-theme-accent border border-theme-border mr-1">
          <span>{selectedNodeIds.length} selecc.</span>
        </div>
      )}

      {/* Lock / Unlock Selected Nodes Button */}
      {hasSelection && (
        <button
          onClick={() => {
            toggleLockSelected();
            showNotification(
              isSelectionLocked
                ? 'Elementos desbloqueados (permiten arrastrar su posición)'
                : 'Elementos fijados (al arrastrar sobre ellos se desplaza el mapa)',
              'info'
            );
          }}
          className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
            isSelectionLocked
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 hover:bg-amber-500/25 font-bold shadow-sm'
              : 'bg-theme-surface-subtle hover:bg-theme-surface border-theme-border text-theme-text'
          }`}
          title={
            isSelectionLocked
              ? 'Desfijar elementos seleccionados para moverlos de lugar'
              : 'Fijar posición de elementos seleccionados (permite arrastrar el mapa sobre ellos sin moverlos)'
          }
        >
          {isSelectionLocked ? (
            <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <Unlock className="w-3.5 h-3.5 text-theme-text-muted shrink-0" />
          )}
          <span>{isSelectionLocked ? 'Fijado' : 'Fijar'}</span>
        </button>
      )}

      {/* Global Canvas Lock / Pan Mode Toggle */}
      <button
        onClick={() => {
          toggleCanvasLock();
          showNotification(
            isCanvasLocked
              ? 'Lienzo desbloqueado (edición libre de posiciones)'
              : 'Lienzo fijado en modo mapa / navegación',
            'info'
          );
        }}
        className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer ${
          isCanvasLocked
            ? 'bg-sky-500/20 border-sky-400 text-sky-400 ring-1 ring-sky-400 font-bold'
            : 'bg-theme-surface-subtle hover:bg-theme-surface border-theme-border text-theme-text-muted hover:text-theme-text'
        }`}
        title={
          isCanvasLocked
            ? 'Lienzo fijado: clic para habilitar el arrastre de elementos'
            : 'Fijar todo el mapa para navegar libremente arrastrando sobre cualquier elemento'
        }
      >
        {isCanvasLocked ? (
          <Lock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        ) : (
          <Unlock className="w-3.5 h-3.5 text-theme-text-muted shrink-0" />
        )}
        <span className="hidden md:inline">{isCanvasLocked ? 'Mapa Fijado' : 'Fijar Mapa'}</span>
      </button>

      {/* Dock and Align Lanes Button */}
      {hasLanes && (
        <button
          onClick={() => {
            alignAllLanes();
            showNotification('Carriles alineados y acoplados con éxito', 'success');
          }}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-theme-surface-subtle hover:bg-theme-surface border border-theme-border text-xs font-medium text-sky-400 transition-colors cursor-pointer"
          title="Acoplar y alinear todos los carriles en secuencia continua sin solapamientos"
        >
          <AlignJustify className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Acoplar Carriles</span>
        </button>
      )}

      {hasMultiple && (
        <button
          onClick={() => setCompressModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
          title="Encapsular actividades seleccionadas en un único Subproceso"
        >
          <Box className="w-3.5 h-3.5" />
          <span>Comprimir en Subproceso</span>
        </button>
      )}

      {hasSelection && (
        <button
          onClick={handleToggleOrientation}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-theme-surface-subtle hover:bg-theme-surface border border-theme-border text-xs font-medium text-theme-text transition-colors cursor-pointer"
          title="Alternar orientación de la tarjeta (Horizontal / Vertical)"
        >
          <RotateCcw className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Orientación</span>
        </button>
      )}

      {hasSelection && (
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-theme-surface-subtle hover:bg-theme-surface border border-theme-border text-xs font-medium text-theme-text transition-colors cursor-pointer"
          title="Copiar selección (Ctrl + C)"
        >
          <Copy className="w-3.5 h-3.5 text-theme-accent" />
          <span className="hidden sm:inline">Copiar</span>
        </button>
      )}

      {hasClipboard && (
        <button
          onClick={handlePaste}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-theme-surface-subtle hover:bg-theme-surface border border-theme-border text-xs font-medium text-theme-text transition-colors cursor-pointer"
          title="Pegar elementos copiados (Ctrl + V)"
        >
          <Clipboard className="w-3.5 h-3.5 text-emerald-500" />
          <span>Pegar</span>
        </button>
      )}

      {hasSelection && (
        <button
          onClick={deleteSelected}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl hover:bg-red-500/15 border border-transparent hover:border-red-500/30 text-xs font-medium text-red-400 transition-colors cursor-pointer"
          title="Eliminar elementos seleccionados (Supr / Delete)"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Eliminar</span>
        </button>
      )}
    </div>
  );
};
