import React, { useEffect } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore, ActiveView } from '../../store/useUiStore';
import { StorageService } from '../../services/storageService';
import { LogoPS } from '../common/LogoPS';
import {
  LayoutDashboard,
  GitGraph,
  Workflow,
  Table,
  FileCheck,
  Save,
  Download,
  Plus,
  Shield,
  Sun,
  Moon,
  FolderOpen,
  Compass,
  Palette,
  Undo2,
  Redo2,
  Flame,
  GitCompare,
  ArrowDownToLine,
  ShieldAlert
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
    undo,
    redo,
    canUndo,
    canRedo,
  } = useProjectStore();

  const {
    activeView,
    setActiveView,
    theme,
    currentThemeId,
    setThemeModalOpen,
    setQualityAuditModalOpen,
    setExportCenterModalOpen,
    setSimulationModalOpen,
    setVersionDiffModalOpen,
    toggleTheme,
    showNotification,
    isPropertiesPanelOpen,
    setPropertiesPanelOpen,
    setActiveRightTab
  } = useUiStore();

  const handleUndo = () => {
    if (canUndo) {
      const ok = undo();
      if (ok) {
        showNotification('↩️ Acción deshecha (Ctrl+Z)', 'info');
      }
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      const ok = redo();
      if (ok) {
        showNotification('↪️ Acción rehecha (Ctrl+Y)', 'info');
      }
    }
  };

  // Global keyboard shortcuts: Ctrl+S (Save), Ctrl+Z (Undo), Ctrl+Y / Ctrl+Shift+Z (Redo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if (
        ((e.ctrlKey || e.metaKey) && (e.key === 'y' || e.key === 'Y')) ||
        ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'z' || e.key === 'Z'))
      ) {
        e.preventDefault();
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentProject, hasUnsavedChanges, canUndo, canRedo, undo, redo]);

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
    { id: 'FLOWCHART', label: 'Flujograma', icon: Workflow },
    { id: 'SIPOC', label: 'Matriz SIPOC', icon: Table },
    { id: 'RACI', label: 'Matriz RACI', icon: Table },
    { id: 'REPORT', label: 'Documento & Diagrama', icon: FileCheck },
  ];

  return (
    <header className="h-14 bg-theme-surface border-b border-theme-border px-4 flex items-center justify-between shrink-0 select-none z-30 transition-colors print:hidden">
      {/* Brand & Project Info */}
      <div className="flex items-center space-x-3">
        <div
          onClick={() => setActiveView('DASHBOARD')}
          className="cursor-pointer group hover:opacity-90 transition-opacity"
        >
          <LogoPS size="sm" />
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

        {/* Antigravity IDE Themes & Custom Colors Button */}
        <button
          onClick={() => setThemeModalOpen(true)}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-theme-surface-subtle hover:bg-theme-surface text-theme-text rounded-lg text-xs font-medium border border-theme-border transition-colors group"
          title="Personalizar Temas de Antigravity IDE, Fondo de Pizarra y Paleta"
        >
          <Palette className="w-3.5 h-3.5 text-theme-accent group-hover:rotate-12 transition-transform" />
          <span className="hidden sm:inline text-[11px] text-theme-text">Temas</span>
          <span className="w-1.5 h-1.5 rounded-full bg-theme-accent shrink-0" />
        </button>

        {/* Quick Dark/Light Mode Toggle Button */}
        <button
          onClick={toggleTheme}
          className="flex items-center space-x-1.5 px-2 py-1.5 bg-theme-surface-subtle hover:bg-theme-surface text-theme-text rounded-lg text-xs font-medium border border-theme-border transition-colors"
          title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {theme === 'dark' ? (
            <Sun className="w-3.5 h-3.5 text-[#F59E0B]" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-theme-accent" />
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

        {/* Undo / Redo History Buttons */}
        {currentProject && (
          <div className="flex items-center space-x-0.5 bg-theme-surface-subtle p-0.5 rounded-lg border border-theme-border">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                canUndo
                  ? 'text-theme-text hover:text-theme-accent hover:bg-theme-surface cursor-pointer'
                  : 'text-theme-text-muted/40 cursor-not-allowed opacity-50'
              }`}
              title={canUndo ? 'Deshacer último movimiento (Ctrl+Z)' : 'Nada que deshacer'}
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px]">Deshacer</span>
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`flex items-center space-x-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                canRedo
                  ? 'text-theme-text hover:text-theme-accent hover:bg-theme-surface cursor-pointer'
                  : 'text-theme-text-muted/40 cursor-not-allowed opacity-50'
              }`}
              title={canRedo ? 'Rehacer movimiento (Ctrl+Y o Ctrl+Shift+Z)' : 'Nada que rehacer'}
            >
              <Redo2 className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px]">Rehacer</span>
            </button>
          </div>
        )}

        {/* Quality Audit, Simulation, Diff, and Export Tools */}
        {currentProject && (
          <>
            <button
              onClick={() => setQualityAuditModalOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-[#10B981] rounded-lg text-xs font-semibold border border-emerald-500/30 transition-colors"
              title="Auditor de Calidad y Linter BPMN 2.0 / ISO 9001"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Auditar</span>
            </button>

            <button
              onClick={() => setSimulationModalOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-[#F59E0B] rounded-lg text-xs font-semibold border border-amber-500/30 transition-colors"
              title="Simulador de Flujos y Detección de Cuellos de Botella"
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Simular</span>
            </button>

            <button
              onClick={() => setVersionDiffModalOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-theme-surface-subtle hover:bg-theme-surface text-theme-text rounded-lg text-xs font-medium border border-theme-border transition-colors"
              title="Comparador Visual de Versiones JSON"
            >
              <GitCompare className="w-3.5 h-3.5 text-theme-accent" />
              <span className="hidden xl:inline">Comparar</span>
            </button>

            <button
              onClick={() => setExportCenterModalOpen(true)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 bg-theme-surface-subtle hover:bg-theme-surface text-theme-text rounded-lg text-xs font-medium border border-theme-border transition-colors"
              title="Centro de Exportación: PNG HD, SVG Vectorial, BPMN 2.0 XML y Word (.doc)"
            >
              <ArrowDownToLine className="w-3.5 h-3.5 text-theme-accent" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </>
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


