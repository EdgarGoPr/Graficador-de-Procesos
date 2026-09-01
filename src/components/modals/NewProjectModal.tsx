import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { X, Plus, Shield, Building2, User, FileText } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose }) => {
  const { createNewProject } = useProjectStore();
  const { setActiveView, showNotification } = useUiStore();

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [orgUnit, setOrgUnit] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const fileName = await createNewProject(
      title.trim(),
      author.trim() || 'Analista de Procesos',
      orgUnit.trim() || 'Unidad Organizativa'
    );

    showNotification(`Proyecto creado: ${fileName}`, 'success');
    setActiveView('CANVAS');
    onClose();
    setTitle('');
    setAuthor('');
    setOrgUnit('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 select-none animate-fadeIn">
      <div className="w-full max-w-lg bg-theme-surface border border-theme-border rounded-2xl shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-6 py-4 bg-theme-surface-subtle border-b border-theme-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-[#0284C7]/15 text-theme-accent">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-theme-text">Crear Nuevo Proyecto BPMN 2.0</h3>
              <p className="text-[11px] text-theme-text-muted">Se guardará como archivo JSON en ../Proyectos/</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-theme-surface-hover text-theme-text-muted hover:text-theme-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="flex items-center text-[11px] font-bold text-theme-text mb-1">
              <FileText className="w-3.5 h-3.5 mr-1.5 text-theme-accent" />
              Título Formal del Procedimiento *
            </label>
            <input
              type="text"
              required
              placeholder="ej: Procedimiento Sancionatorio por Obras Clandestinas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-theme-surface-subtle border border-theme-border rounded-xl px-3 py-2 text-theme-text placeholder-theme-text-muted focus:border-theme-accent outline-none text-xs"
            />
          </div>

          <div>
            <label className="flex items-center text-[11px] font-bold text-theme-text mb-1">
              <User className="w-3.5 h-3.5 mr-1.5 text-[#3B82F6]" />
              Responsable / Autor del Modelado
            </label>
            <input
              type="text"
              placeholder="ej: Lic. Fernando Gómez (Analista de Procesos)"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-theme-surface-subtle border border-theme-border rounded-xl px-3 py-2 text-theme-text placeholder-theme-text-muted focus:border-[#3B82F6] outline-none text-xs"
            />
          </div>

          <div>
            <label className="flex items-center text-[11px] font-bold text-theme-text mb-1">
              <Building2 className="w-3.5 h-3.5 mr-1.5 text-[#F59E0B]" />
              Unidad Organizativa / Dependencia
            </label>
            <input
              type="text"
              placeholder="ej: Dirección de Obras Privadas / Tribunal de Faltas"
              value={orgUnit}
              onChange={(e) => setOrgUnit(e.target.value)}
              className="w-full bg-theme-surface-subtle border border-theme-border rounded-xl px-3 py-2 text-theme-text placeholder-theme-text-muted focus:border-[#F59E0B] outline-none text-xs"
            />
          </div>

          <div className="pt-4 border-t border-theme-border flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-theme-surface-subtle hover:bg-theme-surface border border-theme-border text-theme-text text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#3B82F6] hover:brightness-110 text-white text-xs font-bold shadow-lg shadow-blue-500/20 transition-transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Crear Proyecto</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

