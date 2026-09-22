import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { bumpVersion, generateRevisionFilename } from '../../services/processVersionManager';
import {
  GitCommit,
  Sparkles,
  Layers,
  Laptop,
  Building2,
  FileCode2,
  X,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';

interface NewRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewRevisionModal: React.FC<NewRevisionModalProps> = ({ isOpen, onClose }) => {
  const { currentProject, saveProjectAsNewRevision, isSaving } = useProjectStore();
  const { showNotification } = useUiStore();

  const [bumpType, setBumpType] = useState<'minor' | 'patch' | 'major'>('minor');
  const [deviceTag, setDeviceTag] = useState<'casa' | 'trabajo' | 'personalizado'>('casa');
  const [customTag, setCustomTag] = useState('');
  const [changeDescription, setChangeDescription] = useState('');

  if (!isOpen || !currentProject) return null;

  const currentVersion = currentProject.documentControl.version || '1.0';
  const nextVersion = bumpVersion(currentVersion, bumpType);
  const activeTag = deviceTag === 'personalizado' ? customTag : deviceTag;
  const previewFilename = generateRevisionFilename(
    currentProject.documentControl.documentTitle,
    nextVersion,
    activeTag || undefined
  );

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const fileName = await saveProjectAsNewRevision({
      bumpType,
      customTag: activeTag || undefined,
      changeDescription: changeDescription || `Revisión ${nextVersion} creada desde equipo (${deviceTag})`
    });

    if (fileName) {
      showNotification(`Nueva versión guardada: ${fileName}`, 'success');
      onClose();
    } else {
      showNotification('Error al guardar la nueva revisión', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-theme-surface border border-theme-border p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-theme-border pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-theme-accent/15 text-theme-accent border border-theme-accent/30">
              <GitCommit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-theme-text">
                Guardar Nueva Versión (Multi-Equipo)
              </h2>
              <p className="text-xs text-theme-text-muted">
                Crea un archivo inmutable que evita conflictos de Git entre Casa y Trabajo.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-theme-surface-subtle text-theme-text-muted hover:text-theme-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {/* Version Increment */}
          <div>
            <label className="block text-xs font-semibold text-theme-text mb-2">
              Tipo de Incremento de Versión
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setBumpType('minor')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  bumpType === 'minor'
                    ? 'border-theme-accent bg-theme-accent/10 ring-1 ring-theme-accent text-theme-text'
                    : 'border-theme-border bg-theme-surface-subtle hover:bg-theme-surface text-theme-text-muted'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Menor (+0.1)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-theme-surface border border-theme-border">
                    v{bumpVersion(currentVersion, 'minor')}
                  </span>
                </div>
                <div className="text-[10px] mt-1 text-theme-text-muted">Edición de flujo estándar</div>
              </button>

              <button
                type="button"
                onClick={() => setBumpType('patch')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  bumpType === 'patch'
                    ? 'border-theme-accent bg-theme-accent/10 ring-1 ring-theme-accent text-theme-text'
                    : 'border-theme-border bg-theme-surface-subtle hover:bg-theme-surface text-theme-text-muted'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Parche (+0.0.1)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-theme-surface border border-theme-border">
                    v{bumpVersion(currentVersion, 'patch')}
                  </span>
                </div>
                <div className="text-[10px] mt-1 text-theme-text-muted">Ajuste menor / texto</div>
              </button>

              <button
                type="button"
                onClick={() => setBumpType('major')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  bumpType === 'major'
                    ? 'border-theme-accent bg-theme-accent/10 ring-1 ring-theme-accent text-theme-text'
                    : 'border-theme-border bg-theme-surface-subtle hover:bg-theme-surface text-theme-text-muted'
                }`}
              >
                <div className="text-xs font-bold flex items-center justify-between">
                  <span>Mayor (+1.0)</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-theme-surface border border-theme-border">
                    v{bumpVersion(currentVersion, 'major')}
                  </span>
                </div>
                <div className="text-[10px] mt-1 text-theme-text-muted">Reestructuración total</div>
              </button>
            </div>
          </div>

          {/* Device / Location Tag */}
          <div>
            <label className="block text-xs font-semibold text-theme-text mb-2">
              Origen / Equipo Actual
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDeviceTag('casa')}
                className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  deviceTag === 'casa'
                    ? 'border-theme-accent bg-theme-accent/10 ring-1 ring-theme-accent text-theme-text'
                    : 'border-theme-border bg-theme-surface-subtle text-theme-text-muted'
                }`}
              >
                <Laptop className="w-4 h-4 text-sky-400" />
                <span>PC Casa</span>
              </button>

              <button
                type="button"
                onClick={() => setDeviceTag('trabajo')}
                className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  deviceTag === 'trabajo'
                    ? 'border-theme-accent bg-theme-accent/10 ring-1 ring-theme-accent text-theme-text'
                    : 'border-theme-border bg-theme-surface-subtle text-theme-text-muted'
                }`}
              >
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>PC Trabajo</span>
              </button>

              <button
                type="button"
                onClick={() => setDeviceTag('personalizado')}
                className={`flex items-center space-x-2 p-2.5 rounded-xl border text-xs font-medium transition-all ${
                  deviceTag === 'personalizado'
                    ? 'border-theme-accent bg-theme-accent/10 ring-1 ring-theme-accent text-theme-text'
                    : 'border-theme-border bg-theme-surface-subtle text-theme-text-muted'
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Personalizado</span>
              </button>
            </div>

            {deviceTag === 'personalizado' && (
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Ej. oficina-norte, sprint2..."
                className="mt-2 w-full px-3 py-2 rounded-xl bg-theme-surface-subtle border border-theme-border text-xs text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
              />
            )}
          </div>

          {/* Change Description */}
          <div>
            <label className="block text-xs font-semibold text-theme-text mb-1">
              Descripción del Cambio (Historial de Revisiones ISO 9001)
            </label>
            <input
              type="text"
              value={changeDescription}
              onChange={(e) => setChangeDescription(e.target.value)}
              placeholder="Ej. Se agregaron compuertas de control y roles SAM..."
              className="w-full px-3 py-2 rounded-xl bg-theme-surface-subtle border border-theme-border text-xs text-theme-text focus:outline-none focus:ring-2 focus:ring-theme-accent"
            />
          </div>

          {/* Live File Preview */}
          <div className="p-3 rounded-xl bg-theme-surface-subtle border border-theme-border space-y-1.5">
            <div className="flex items-center space-x-1.5 text-[11px] font-semibold text-theme-text">
              <FileCode2 className="w-3.5 h-3.5 text-theme-accent" />
              <span>Nombre del nuevo archivo generado:</span>
            </div>
            <div className="font-mono text-xs text-theme-accent break-all bg-theme-surface p-2 rounded-lg border border-theme-border">
              {previewFilename}
            </div>
            <div className="text-[10px] text-theme-text-muted flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>El archivo previo permanece intacto. Cero colisiones en Git.</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-theme-border text-xs font-semibold text-theme-text hover:bg-theme-surface-subtle transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center space-x-2 px-5 py-2 rounded-xl bg-theme-accent hover:bg-theme-accent-hover text-white text-xs font-bold shadow-lg transition-all"
            >
              <GitCommit className="w-4 h-4" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Nueva Versión'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
