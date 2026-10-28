import React, { useState, useEffect } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { useAuthStore } from '../../store/useAuthStore';
import { StorageService } from '../../services/storageService';
import { AuditLoggerService } from '../../services/auditLoggerService';
import {
  X,
  Pencil,
  FileText,
  User,
  Building2,
  Hash,
  Target,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export interface ProjectForEdit {
  fileName: string;
  documentTitle?: string;
  documentCode?: string;
  authorName?: string;
  organizationUnit?: string;
  processObjective?: string;
  createdByEmail?: string;
  createdByUserId?: string;
}

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectForEdit | null;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const { currentProject, refreshProjectList } = useProjectStore();
  const { showNotification } = useUiStore();
  const { currentUser } = useAuthStore();

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [author, setAuthor] = useState('');
  const [orgUnit, setOrgUnit] = useState('');
  const [objective, setObjective] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen && project) {
      setTitle(project.documentTitle || '');
      setCode(project.documentCode || '');
      setAuthor(project.authorName || '');
      setOrgUnit(project.organizationUnit || '');
      setObjective(project.processObjective || '');

      // Load full project to ensure full objective is populated
      setIsLoading(true);
      StorageService.loadProject(project.fileName)
        .then((fullProj) => {
          if (fullProj?.documentControl) {
            setTitle(fullProj.documentControl.documentTitle || '');
            setCode(fullProj.documentControl.documentCode || '');
            setAuthor(fullProj.documentControl.authorName || '');
            setOrgUnit(fullProj.documentControl.organizationUnit || '');
            setObjective(fullProj.documentControl.processObjective || '');
          }
        })
        .catch((err) => {
          console.warn('Error al cargar datos completos del proyecto para edición:', err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, project?.fileName]);

  if (!isOpen || !project) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !project) return;

    setIsSaving(true);
    try {
      const fullProject = await StorageService.loadProject(project.fileName);
      if (!fullProject) {
        showNotification('No se pudo encontrar el archivo del proyecto para guardar cambios.', 'error');
        setIsSaving(false);
        return;
      }

      const now = new Date().toISOString();

      // Update document control fields
      fullProject.documentControl.documentTitle = title.trim();
      fullProject.documentControl.documentCode = code.trim() || fullProject.documentControl.documentCode;
      fullProject.documentControl.authorName = author.trim() || fullProject.documentControl.authorName;
      fullProject.documentControl.organizationUnit = orgUnit.trim() || fullProject.documentControl.organizationUnit;
      fullProject.documentControl.processObjective = objective.trim() || fullProject.documentControl.processObjective;
      fullProject.documentControl.updatedAt = now;

      // Synchronize primary pool title and organization
      if (fullProject.pools && fullProject.pools.length > 0) {
        fullProject.pools[0].name = title.trim();
        fullProject.pools[0].organization = orgUnit.trim() || fullProject.pools[0].organization;
      }

      // Add revision history entry
      if (!fullProject.documentControl.revisionHistory) {
        fullProject.documentControl.revisionHistory = [];
      }
      fullProject.documentControl.revisionHistory.push({
        revisionDate: now,
        version: fullProject.documentControl.version,
        author: author.trim() || currentUser?.fullName || 'Analista de Procesos',
        changeDescription: 'Modificación de metadatos de ficha del proyecto'
      });

      // Save project to storage
      await StorageService.saveProject(fullProject);

      // If this is the active project loaded in the canvas, update reactive state
      if (currentProject && currentProject.fileName === project.fileName) {
        useProjectStore.setState({ currentProject: fullProject });
      }

      // Refresh dashboard list
      await refreshProjectList();

      // Audit log
      if (currentUser) {
        await AuditLoggerService.log(
          'PROJECT_METADATA_UPDATED',
          currentUser,
          project.fileName,
          {
            updatedTitle: title.trim(),
            updatedCode: code.trim(),
            updatedAuthor: author.trim(),
            updatedOrgUnit: orgUnit.trim()
          }
        );
      }

      showNotification('✅ Ficha del proyecto actualizada exitosamente', 'success');
      onClose();
    } catch (err: any) {
      console.error('Error al guardar metadatos de proyecto:', err);
      showNotification(err?.message ? `Error al guardar: ${err.message}` : 'Error al guardar los cambios.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-md p-4 animate-fadeIn select-none">
      <div className="w-full max-w-lg bg-theme-surface border border-theme-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-theme-surface-subtle border-b border-theme-border flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-theme-accent/15 border border-theme-accent/30 text-theme-accent">
              <Pencil className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-theme-text">Editar Ficha del Proyecto</h3>
              <p className="text-xs text-theme-text-muted mt-0.5 font-mono truncate max-w-xs">
                {project.fileName}
              </p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {/* Document Title */}
          <div>
            <label className="flex items-center text-[11px] font-bold text-theme-text mb-1">
              <FileText className="w-3.5 h-3.5 mr-1.5 text-theme-accent" />
              Título Formal del Procedimiento *
            </label>
            <input
              type="text"
              required
              disabled={isLoading || isSaving}
              placeholder="Título del procedimiento o proceso"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-theme-surface-subtle border border-theme-border rounded-xl px-3 py-2 text-theme-text placeholder-theme-text-muted focus:border-theme-accent outline-none text-xs font-medium"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Document Code */}
            <div>
              <label className="flex items-center text-[11px] font-bold text-theme-text mb-1">
                <Hash className="w-3.5 h-3.5 mr-1.5 text-sky-400" />
                Código Documental (ISO 9001)
              </label>
              <input
                type="text"
                disabled={isLoading || isSaving}
                placeholder="Ej. PRC-9413"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-theme-surface-subtle border border-theme-border rounded-xl px-3 py-2 text-theme-text placeholder-theme-text-muted focus:border-sky-400 outline-none text-xs font-mono font-semibold"
              />
            </div>

            {/* Author Name */}
            <div>
              <label className="flex items-center text-[11px] font-bold text-theme-text mb-1">
                <User className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
                Responsable / Autor
              </label>
              <input
                type="text"
                disabled={isLoading || isSaving}
                placeholder="Nombre del responsable"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full bg-theme-surface-subtle border border-theme-border rounded-xl px-3 py-2 text-theme-text placeholder-theme-text-muted focus:border-amber-400 outline-none text-xs font-medium"
              />
            </div>
          </div>

          {/* Organization Unit */}
          <div>
            <label className="flex items-center text-[11px] font-bold text-theme-text mb-1">
              <Building2 className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Unidad Organizativa / Dependencia
            </label>
            <input
              type="text"
              disabled={isLoading || isSaving}
              placeholder="Área, dirección o dependencia"
              value={orgUnit}
              onChange={(e) => setOrgUnit(e.target.value)}
              className="w-full bg-theme-surface-subtle border border-theme-border rounded-xl px-3 py-2 text-theme-text placeholder-theme-text-muted focus:border-emerald-400 outline-none text-xs font-medium"
            />
          </div>

          {/* Process Objective */}
          <div>
            <label className="flex items-center text-[11px] font-bold text-theme-text mb-1">
              <Target className="w-3.5 h-3.5 mr-1.5 text-purple-400" />
              Objetivo y Alcance del Proceso
            </label>
            <textarea
              rows={3}
              disabled={isLoading || isSaving}
              placeholder="Describe el objetivo y alcance operativo del proceso..."
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full bg-theme-surface-subtle border border-theme-border rounded-xl px-3 py-2 text-theme-text placeholder-theme-text-muted focus:border-purple-400 outline-none text-xs font-medium resize-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-theme-border flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-theme-surface hover:bg-theme-surface-hover border border-theme-border text-xs font-bold text-theme-text transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || !title.trim()}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-theme-accent to-blue-600 hover:brightness-110 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
