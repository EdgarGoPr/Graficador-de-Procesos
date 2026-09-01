import React from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useUiStore } from '../../store/useUiStore';
import { Box, Copy, Clipboard, Trash2, Layers } from 'lucide-react';

export const SelectionToolbar: React.FC = () => {
  const {
    selectedNodeIds,
    clipboardPayload,
    copySelection,
    pasteSelection,
    setCompressModalOpen,
    deleteSelected
  } = useCanvasStore();

  const { showNotification } = useUiStore();

  const hasSelection = selectedNodeIds.length > 0;
  const hasMultiple = selectedNodeIds.length >= 2;
  const hasClipboard = Boolean(clipboardPayload && clipboardPayload.nodes.length > 0);

  if (!hasSelection && !hasClipboard) return null;

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

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 flex items-center space-x-1.5 p-1.5 rounded-2xl bg-theme-surface/95 backdrop-blur-md border border-theme-border shadow-2xl animate-fadeIn">
      {hasSelection && (
        <div className="flex items-center px-2 py-1 bg-theme-surface-subtle rounded-xl text-[11px] font-mono font-bold text-theme-accent border border-theme-border mr-1">
          <span>{selectedNodeIds.length} selecc.</span>
        </div>
      )}

      {hasMultiple && (
        <button
          onClick={() => setCompressModalOpen(true)}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white text-xs font-bold shadow-md transition-all"
          title="Encapsular actividades seleccionadas en un único Subproceso"
        >
          <Box className="w-3.5 h-3.5" />
          <span>Comprimir en Subproceso</span>
        </button>
      )}

      {hasSelection && (
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-theme-surface-subtle hover:bg-theme-surface border border-theme-border text-xs font-medium text-theme-text transition-colors"
          title="Copiar selección (Ctrl + C)"
        >
          <Copy className="w-3.5 h-3.5 text-theme-accent" />
          <span className="hidden sm:inline">Copiar</span>
        </button>
      )}

      {hasClipboard && (
        <button
          onClick={handlePaste}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-theme-surface-subtle hover:bg-theme-surface border border-theme-border text-xs font-medium text-theme-text transition-colors"
          title="Pegar elementos copiados (Ctrl + V)"
        >
          <Clipboard className="w-3.5 h-3.5 text-emerald-500" />
          <span>Pegar</span>
        </button>
      )}

      {hasSelection && (
        <button
          onClick={deleteSelected}
          className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl hover:bg-red-500/15 border border-transparent hover:border-red-500/30 text-xs font-medium text-red-400 transition-colors"
          title="Eliminar elementos seleccionados (Supr / Delete)"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Eliminar</span>
        </button>
      )}
    </div>
  );
};
