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
  Plus,
  Shield,
  Sun,
  Moon,
  FolderOpen,
  Compass
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
  } = useProjectStore();

  const {
    activeView,
    setActiveView,
    theme,
    toggleTheme,
    showNotification,
    isPropertiesPanelOpen,
    setPropertiesPanelOpen,
    setActiveRightTab
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
    showNotification('Archivo JSON descargado a tu disco', 'info');
  };

  const handleOpenFolder = async () => {
    if (StorageService.isElectron()) {
      if (currentProject?.fileName) {
        await StorageService.openProjectFile(currentProject.fileName);
      } else {
        await StorageService.openProjectsFolder();
      }
      showNotification('Carpeta de proyectos abierta en el Explorador de Windows', 'info');
    } else {
      if (currentProject) {
        StorageService.exportProjectToJsonFile(currentProject);
        showNotification('En la Web el archivo se descarga a tu disco (Descargas)', 'info');
      } else {
        showNotification('En la Web los archivos se almacenan en el navegador. En el ejecutable .exe se guardan en ../Proyectos/', 'info');
      }
    }
  };

  const navTabs: { id: ActiveView; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'DASHBOARD', label: 'Proyectos USB', icon: LayoutDashboard },
    { id: 'CANVAS', label: 'Lienzo BPMN 2.0', icon: GitGraph },
    { id: 'SIPOC', label: 'Matriz SIPOC', icon: Table },
    { id: 'REPORT', label: 'Ficha Técnica ISO 9001', icon: FileCheck },
  ];

  return (
    <header className="h-14 bg-theme-surface border-b border-theme-border px-4 flex items-center justify-between shrink-0 select-none z-30 transition-colors">
      {/* Brand & Project Info */}
      <div className="flex items-center space-x-3">
        <div
          onClick={() => setActiveView('DASHBOARD')}
          className="flex items-center space-x-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#0284C7] to-[#3B82F6] flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-wider text-theme-text uppercase flex items-center">
              <span>ProcesosStudio</span>
              <span className="ml-1.5 text-[9px] font-mono font-semibold bg-[#38BDF8]/10 text-theme-accent px-1.5 py-0.5 rounded border border-theme-accent/30">
                PORTABLE
              </span>
            </div>
            <div className="text-[10px] text-theme-text-muted font-mono">
              BPMN 2.0 &bull; ISO 9001:2015
            </div>
          </div>
        </div>

        {currentProject && (
          <div className="hidden lg:flex items-center space-x-2 pl-3 border-l border-theme-border">
            <div className="max-w-md truncate">
              <span className="text-xs font-bold text-theme-text truncate block">
                {currentProject.documentControl.documentTitle}
              </span>
              <div className="flex items-center space-x-2 text-[10px] text-theme-text-muted font-mono">
                <span className="text-theme-accent font-semibold">{currentProject.documentControl.documentCode}</span>
                <span>&bull;</span>
                <span className="text-[#F59E0B] font-semibold">{currentProject.documentControl.version}</span>
                <span>&bull;</span>
                <span className="truncate max-w-[140px]">{currentProject.documentControl.authorName}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center bg-theme-surface-subtle p-1 rounded-lg border border-theme-border">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveView(tab.id)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isActive
                  ? 'bg-theme-surface text-theme-accent shadow-sm border border-theme-border font-bold'
                  : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-surface/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Action Buttons & Theme Switcher */}
      <div className="flex items-center space-x-2">
        {/* Open Folder Button */}
        <button
          onClick={handleOpenFolder}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-theme-surface-subtle hover:bg-theme-surface text-theme-text rounded-lg text-xs font-medium border border-theme-border transition-colors"
          title="Abrir carpeta donde se guardan los proyectos JSON en disco"
        >
          <FolderOpen className="w-3.5 h-3.5 text-theme-accent" />
          <span className="hidden md:inline">Ver Carpeta</span>
        </button>

        {/* Dark/Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-theme-surface-subtle hover:bg-theme-surface text-theme-text rounded-lg text-xs font-medium border border-theme-border transition-colors"
          title={theme === 'dark' ? 'Cambiar a Modo Claro (#F8F9FA / #FFFFFF)' : 'Cambiar a Modo Oscuro (#0F172A / #1E293B)'}
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-3.5 h-3.5 text-[#F59E0B]" />
              <span className="hidden xl:inline text-[11px] text-theme-text-muted">Modo Claro</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-theme-accent" />
              <span className="hidden xl:inline text-[11px] text-theme-text-muted">Modo Oscuro</span>
            </>
          )}
        </button>

        {/* Navigator & Hierarchy Toggle Button */}
        {activeView === 'CANVAS' && (
          <button
            onClick={() => {
              if (isPropertiesPanelOpen) {
                setActiveRightTab('NAVIGATOR');
              } else {
                setPropertiesPanelOpen(true);
                setActiveRightTab('NAVIGATOR');
              }
            }}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isPropertiesPanelOpen
                ? 'bg-theme-surface-subtle hover:bg-theme-surface text-theme-accent border-theme-accent/40 font-bold'
                : 'bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border-theme-border'
            }`}
            title="Abrir Navegador de Macroprocesos y Subprocesos"
          >
            <Compass className="w-3.5 h-3.5 text-theme-accent" />
            <span className="hidden lg:inline">Navegador</span>
          </button>
        )}

        <button
          onClick={onOpenNewProjectModal}
          className="flex items-center space-x-1 px-2.5 py-1.5 bg-theme-surface-subtle hover:bg-theme-surface text-theme-text rounded-lg text-xs font-medium border border-theme-border transition-colors"
          title="Crear nuevo proyecto"
        >
          <Plus className="w-3.5 h-3.5 text-theme-accent" />
          <span className="hidden sm:inline">Nuevo</span>
        </button>

        {currentProject && (
          <>
            <button
              onClick={handleExportJson}
              className="flex items-center space-x-1 px-2.5 py-1.5 bg-theme-surface-subtle hover:bg-theme-surface text-theme-text rounded-lg text-xs font-medium border border-theme-border transition-colors"
              title="Descargar archivo JSON a tu equipo"
            >
              <Download className="w-3.5 h-3.5 text-theme-text-muted" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold shadow-md transition-all ${
                hasUnsavedChanges
                  ? 'bg-gradient-to-r from-[#0284C7] to-[#3B82F6] hover:brightness-110 text-white animate-pulse'
                  : 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 hover:bg-[#10B981]/25'
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


