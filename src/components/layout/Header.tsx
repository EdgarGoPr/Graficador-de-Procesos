import React, { useEffect } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore, ActiveView } from '../../store/useUiStore';
import { StorageService } from '../../services/storageService';
import {
  LayoutDashboard,
  GitGraph,
  Table,
  FileCheck,
  Save,
  Download,
  FolderOpen,
  Plus,
  Shield,
  Layers,
  Clock,
  Sparkles
} from 'lucide-react';

interface HeaderProps {
  onOpenNewProjectModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewProjectModal }) => {
  const {
    currentProject,
    saveCurrentProject,
    isSaving,
    hasUnsavedChanges,
    lastSavedAt
  } = useProjectStore();

  const {
    activeView,
    setActiveView,
    showNotification
  } = useUiStore();

  // Keyboard shortcut Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentProject, hasUnsavedChanges]);

  const handleSave = async () => {
    if (!currentProject) return;
    const ok = await saveCurrentProject();
    if (ok) {
      showNotification(`Proyecto guardado en ../Proyectos/${currentProject.fileName}`, 'success');
    }
  };

  const handleExportJson = () => {
    if (!currentProject) return;
    StorageService.exportProjectToJsonFile(currentProject);
    showNotification('Archivo JSON exportado correctamente', 'info');
  };

  const navTabs: { id: ActiveView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'DASHBOARD', label: 'Proyectos USB', icon: LayoutDashboard },
    { id: 'CANVAS', label: 'Lienzo BPMN 2.0', icon: GitGraph },
    { id: 'SIPOC', label: 'Matriz SIPOC', icon: Table },
    { id: 'REPORT', label: 'Ficha Técnica ISO 9001', icon: FileCheck },
  ];

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between shrink-0 select-none z-30">
      {/* Brand & Project Info */}
      <div className="flex items-center space-x-3">
        <div
          onClick={() => setActiveView('DASHBOARD')}
          className="flex items-center space-x-2 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-wider text-slate-100 uppercase flex items-center">
              <span>ProcesosStudio</span>
              <span className="ml-1.5 text-[9px] font-mono font-normal bg-cyan-950 text-cyan-400 px-1 py-0.2 rounded border border-cyan-800/60">
                PORTABLE
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              BPMN 2.0 &bull; ISO 9001:2015
            </div>
          </div>
        </div>

        {currentProject && (
          <div className="hidden lg:flex items-center space-x-2 pl-3 border-l border-slate-800">
            <div className="max-w-md truncate">
              <span className="text-xs font-bold text-slate-200 truncate block">
                {currentProject.documentControl.documentTitle}
              </span>
              <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                <span className="text-cyan-400">{currentProject.documentControl.documentCode}</span>
                <span>&bull;</span>
                <span className="text-amber-400">{currentProject.documentControl.version}</span>
                <span>&bull;</span>
                <span className="truncate max-w-[140px]">{currentProject.documentControl.authorName}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800/80">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/60 font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2">
        <button
          onClick={onOpenNewProjectModal}
          className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          title="Crear nuevo proyecto"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" />
          <span className="hidden sm:inline">Nuevo</span>
        </button>

        {currentProject && (
          <>
            <button
              onClick={handleExportJson}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-colors"
              title="Descargar archivo JSON"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md transition-all ${
                hasUnsavedChanges
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white animate-pulse'
                  : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'
              }`}
              title="Guardar cambios (Ctrl+S)"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Guardando...' : hasUnsavedChanges ? 'Guardar (Ctrl+S)' : 'Guardado'}</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
};
