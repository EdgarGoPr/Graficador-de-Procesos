import React, { useState, useEffect } from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useUiStore } from '../../store/useUiStore';
import { useProjectStore } from '../../store/useProjectStore';
import { Layers, X, ArrowRight, AlertTriangle, CheckCircle2, Box } from 'lucide-react';

export const CompressSubProcessModal: React.FC = () => {
  const {
    isCompressModalOpen,
    setCompressModalOpen,
    selectedNodeIds,
    validateSelectionForCompression,
    compressSelection
  } = useCanvasStore();

  const { showNotification } = useUiStore();
  const { currentProject } = useProjectStore();

  const [title, setTitle] = useState('');
  const [standardId, setStandardId] = useState('');
  const [description, setDescription] = useState('');
  const [validation, setValidation] = useState<{ isValid: boolean; error?: string } | null>(null);

  useEffect(() => {
    if (isCompressModalOpen) {
      const val = validateSelectionForCompression();
      setValidation(val);

      const existingSubsCount = currentProject?.nodes.filter((n) => n.type === 'SubProcess').length || 0;
      const nextNum = existingSubsCount + 1;
      setStandardId(`SUB-${nextNum < 10 ? '0' + nextNum : nextNum}`);
      setTitle(`Subproceso Operativo ${nextNum}`);
      setDescription(`Subproceso integrado que encapsula ${selectedNodeIds.length} actividades operativas.`);
    }
  }, [isCompressModalOpen, selectedNodeIds, validateSelectionForCompression, currentProject]);

  if (!isCompressModalOpen) return null;

  const handleCompress = () => {
    if (!title.trim()) {
      showNotification('Por favor ingrese un título para el subproceso', 'error');
      return;
    }

    const result = compressSelection(title, standardId, description);
    if (result.success) {
      showNotification(`Subproceso "${title}" creado exitosamente`, 'success');
      setCompressModalOpen(false);
    } else {
      showNotification(result.error || 'Error al comprimir en subproceso', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-theme-surface border border-theme-border rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-theme-border flex items-center justify-between bg-theme-surface-subtle">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-500/15 text-blue-500 border border-blue-500/30">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-theme-text flex items-center space-x-2">
                <span>Comprimir en Subproceso</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30">
                  {selectedNodeIds.length} elementos
                </span>
              </h3>
              <p className="text-xs text-theme-text-muted">
                Encapsula las actividades seleccionadas en un único nodo jerárquico BPMN 2.0
              </p>
            </div>
          </div>
          <button
            onClick={() => setCompressModalOpen(false)}
            className="p-1.5 rounded-lg hover:bg-theme-surface text-theme-text-muted hover:text-theme-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Validation Alert */}
        {validation && !validation.isValid && (
          <div className="p-4 bg-red-500/10 border-b border-red-500/30 flex items-start space-x-2.5 text-xs text-red-400">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <div className="space-y-1">
              <strong className="block font-semibold">Regla de Encapsulamiento BPMN:</strong>
              <p className="text-[11px] leading-relaxed">{validation.error}</p>
            </div>
          </div>
        )}

        {/* Form Body */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-[11px] font-semibold text-theme-text-muted block mb-1">
                Código Estándar
              </label>
              <input
                type="text"
                value={standardId}
                onChange={(e) => setStandardId(e.target.value)}
                placeholder="SUB-01"
                className="w-full bg-theme-surface-subtle border border-theme-border rounded-lg px-3 py-2 text-xs font-mono font-bold text-theme-text outline-none focus:border-theme-accent uppercase"
              />
            </div>

            <div className="col-span-2">
              <label className="text-[11px] font-semibold text-theme-text-muted block mb-1">
                Título del Subproceso *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="ej: Trámite de Regularización y Descargo"
                className="w-full bg-theme-surface-subtle border border-theme-border rounded-lg px-3 py-2 text-xs font-semibold text-theme-text outline-none focus:border-theme-accent"
                autoFocus
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-theme-text-muted block mb-1">
              Descripción y Alcance
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describa el objetivo operativo que agrupa este subproceso..."
              className="w-full bg-theme-surface-subtle border border-theme-border rounded-lg p-3 text-xs text-theme-text outline-none focus:border-theme-accent leading-relaxed resize-none"
            />
          </div>

          <div className="p-3 rounded-xl bg-theme-surface-subtle border border-theme-border flex items-center space-x-2 text-xs text-theme-text-muted">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-[11px]">
              Al comprimir, las {selectedNodeIds.length} actividades se guardarán como etapas internas y podrán desplegarse o descomprimirse en cualquier momento.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-theme-border flex items-center justify-between bg-theme-surface-subtle">
          <button
            type="button"
            onClick={() => setCompressModalOpen(false)}
            className="px-3.5 py-1.5 rounded-lg border border-theme-border hover:bg-theme-surface text-xs text-theme-text-muted font-medium transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={validation ? !validation.isValid : false}
            onClick={handleCompress}
            className={`px-4 py-2 rounded-xl text-white text-xs font-bold shadow-md transition-all flex items-center space-x-1.5 ${
              validation && !validation.isValid
                ? 'bg-slate-600 opacity-50 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110'
            }`}
          >
            <span>Comprimir a Subproceso</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
