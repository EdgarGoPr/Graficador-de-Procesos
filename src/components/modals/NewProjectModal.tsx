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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Crear Nuevo Proyecto BPMN 2.0</h3>
              <p className="text-[11px] text-slate-400">Se guardará como archivo JSON en ../Proyectos/</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          <div>
            <label className="flex items-center text-[11px] font-bold text-slate-300 mb-1">
              <FileText className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              Título Formal del Procedimiento *
            </label>
            <input
              type="text"
              required
              placeholder="ej: Procedimiento Sancionatorio por Obras Clandestinas"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-cyan-500 outline-none text-xs"
            />
          </div>

          <div>
            <label className="flex items-center text-[11px] font-bold text-slate-300 mb-1">
              <User className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
              Responsable / Autor del Modelado
            </label>
            <input
              type="text"
              placeholder="ej: Lic. Fernando Gómez (Analista de Procesos)"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-cyan-500 outline-none text-xs"
            />
          </div>

          <div>
            <label className="flex items-center text-[11px] font-bold text-slate-300 mb-1">
              <Building2 className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
              Unidad Organizativa / Dependencia
            </label>
            <input
              type="text"
              placeholder="ej: Dirección de Obras Privadas / Tribunal de Faltas"
              value={orgUnit}
              onChange={(e) => setOrgUnit(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-100 placeholder-slate-500 focus:border-cyan-500 outline-none text-xs"
            />
          </div>

          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 transition-transform active:scale-95"
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
