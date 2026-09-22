import React, { useEffect, useState, useRef } from 'react';
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
  Tv,
  ChevronDown,
  Sparkles,
  Check
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
    setThemeModalOpen,
    setQualityAuditModalOpen,
    setExportCenterModalOpen,
    setSimulationModalOpen,
    setVersionDiffModalOpen,
    setPresentationModalOpen,
    toggleTheme,
    showNotification,
    isPropertiesPanelOpen,
    setPropertiesPanelOpen,
    setActiveRightTab
  } = useUiStore();

  const [isViewsMenuOpen, setIsViewsMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);

  const viewsMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (viewsMenuRef.current && !viewsMenuRef.current.contains(event.target as Node)) {
        setIsViewsMenuOpen(false);
      }
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(event.target as Node)) {
        setIsToolsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Global keyboard shortcuts
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
      } else if (e.key === 'F5' || ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'p' || e.key === 'P'))) {
        e.preventDefault();
        setPresentationModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentProject, hasUnsavedChanges, canUndo, canRedo, undo, redo, setPresentationModalOpen]);

  const handleSave = async () => {
    if (!currentProject) return;
    const ok = await saveCurrentProject();
    if (ok) {
      showNotification(`Proyecto guardado en ../Proyectos/${currentProject.fileName}`, 'success');
    }
  };

  const handleOpenFolder = async () => {
    try {
      const ok = await StorageService.openProjectsFolder();
      if (ok) {
        showNotification('Carpeta de proyectos abierta en el explorador', 'info');
      } else {
        showNotification('Directorio de proyectos: MiAppProcesos_USB/Proyectos/', 'info');
      }
    } catch {
      showNotification('Directorio de proyectos: MiAppProcesos_USB/Proyectos/', 'info');
    }
  };

  const isAnalyticalViewActive = ['FLOWCHART', 'SIPOC', 'RACI', 'REPORT'].includes(activeView);

  return (
    <header className="h-14 border-b border-theme-border bg-theme-surface/95 backdrop-blur-md px-4 flex items-center justify-between z-30 shrink-0 select-none shadow-sm transition-colors">
      {/* Left: Logo & Project Details */}
      <div className="flex items-center space-x-3 shrink-0">
        <div
          onClick={() => setActiveView('DASHBOARD')}
          className="cursor-pointer group hover:opacity-90 transition-opacity"
          title="Ir al panel de proyectos"
        >
          <LogoPS size="sm" />
        </div>

        {currentProject && (
          <div className="hidden lg:flex items-center space-x-2 pl-3 border-l border-theme-border">
            <div className="max-w-xs xl:max-w-sm truncate">
              <span className="text-xs font-bold text-theme-text truncate block">
                {currentProject.documentControl.documentTitle}
              </span>
              <div className="flex items-center space-x-2 text-[10px] text-theme-text-muted font-mono">
                <span className="text-theme-accent font-semibold">{currentProject.documentControl.documentCode}</span>
                <span>&bull;</span>
                <span className="text-[#F59E0B] font-semibold">{currentProject.documentControl.version}</span>
                <span>&bull;</span>
                <span className="truncate max-w-[120px]">{currentProject.documentControl.authorName}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Center: Primary Tabs & Dropdown Menus */}
      <div className="flex items-center space-x-2">
        {/* Primary View Tabs */}
        <div className="flex items-center bg-theme-surface-subtle p-1 rounded-lg border border-theme-border">
          {/* Projects Dashboard */}
          <button
            onClick={() => setActiveView('DASHBOARD')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === 'DASHBOARD'
                ? 'bg-theme-surface text-theme-accent shadow-sm border border-theme-border font-bold'
                : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-surface/50'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Proyectos</span>
          </button>

          {/* BPMN Canvas */}
          <button
            onClick={() => setActiveView('CANVAS')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              activeView === 'CANVAS'
                ? 'bg-theme-surface text-theme-accent shadow-sm border border-theme-border font-bold'
                : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-surface/50'
            }`}
          >
            <GitGraph className="w-3.5 h-3.5" />
            <span>Lienzo BPMN</span>
          </button>

          {/* Views & Matrices Dropdown */}
          <div ref={viewsMenuRef} className="relative">
            <button
              onClick={() => {
                setIsViewsMenuOpen((v) => !v);
                setIsToolsMenuOpen(false);
              }}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                isAnalyticalViewActive || isViewsMenuOpen
                  ? 'bg-theme-surface text-theme-accent shadow-sm border border-theme-border font-bold'
                  : 'text-theme-text-muted hover:text-theme-text hover:bg-theme-surface/50'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Vistas & Matrices</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${isViewsMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Views Dropdown Card */}
            {isViewsMenuOpen && (
              <div className="absolute top-full mt-1.5 left-0 w-60 bg-theme-surface/95 backdrop-blur-xl border border-theme-border rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                <button
                  onClick={() => {
                    setActiveView('FLOWCHART');
                    setIsViewsMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left ${
                    activeView === 'FLOWCHART' ? 'text-theme-accent font-bold bg-theme-accent/10' : 'text-theme-text'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Workflow className="w-4 h-4 text-sky-400" />
                    <div>
                      <div className="font-medium">Flujograma de Procesos</div>
                      <div className="text-[10px] text-theme-text-muted">Vista simplificada horizontal</div>
                    </div>
                  </div>
                  {activeView === 'FLOWCHART' && <Check className="w-3.5 h-3.5 text-theme-accent" />}
                </button>

                <button
                  onClick={() => {
                    setActiveView('SIPOC');
                    setIsViewsMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left ${
                    activeView === 'SIPOC' ? 'text-theme-accent font-bold bg-theme-accent/10' : 'text-theme-text'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Table className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="font-medium">Matriz SIPOC</div>
                      <div className="text-[10px] text-theme-text-muted">Insumos, proveedores y clientes</div>
                    </div>
                  </div>
                  {activeView === 'SIPOC' && <Check className="w-3.5 h-3.5 text-theme-accent" />}
                </button>

                <button
                  onClick={() => {
                    setActiveView('RACI');
                    setIsViewsMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left ${
                    activeView === 'RACI' ? 'text-theme-accent font-bold bg-theme-accent/10' : 'text-theme-text'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <GitGraph className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="font-medium">Matriz RACI</div>
                      <div className="text-[10px] text-theme-text-muted">Roles y responsabilidades</div>
                    </div>
                  </div>
                  {activeView === 'RACI' && <Check className="w-3.5 h-3.5 text-theme-accent" />}
                </button>

                <button
                  onClick={() => {
                    setActiveView('REPORT');
                    setIsViewsMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left border-t border-theme-border/60 mt-1 pt-1.5 ${
                    activeView === 'REPORT' ? 'text-theme-accent font-bold bg-theme-accent/10' : 'text-theme-text'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <FileCheck className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-medium">Documento & Reporte Técnico</div>
                      <div className="text-[10px] text-theme-text-muted">Memoria técnica e ISO 9001</div>
                    </div>
                  </div>
                  {activeView === 'REPORT' && <Check className="w-3.5 h-3.5 text-theme-accent" />}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tools Dropdown Menu */}
        {currentProject && (
          <div ref={toolsMenuRef} className="relative">
            <button
              onClick={() => {
                setIsToolsMenuOpen((t) => !t);
                setIsViewsMenuOpen(false);
              }}
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-xs font-semibold border transition-all ${
                isToolsMenuOpen
                  ? 'bg-theme-accent/20 text-theme-accent border-theme-accent/50 shadow-sm'
                  : 'bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border-theme-border'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-theme-accent" />
              <span>Herramientas</span>
              <ChevronDown className={`w-3 h-3 text-theme-text-muted transition-transform ${isToolsMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Tools Dropdown Card */}
            {isToolsMenuOpen && (
              <div className="absolute top-full mt-1.5 left-0 w-64 bg-theme-surface/95 backdrop-blur-xl border border-theme-border rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95">
                {/* Prezi Presentation */}
                <button
                  onClick={() => {
                    setPresentationModalOpen(true);
                    setIsToolsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text group"
                >
                  <div className="flex items-center space-x-2.5">
                    <Tv className="w-4 h-4 text-theme-accent group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-bold flex items-center space-x-1.5">
                        <span>Presentación (Prezi)</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-theme-accent animate-pulse" />
                      </div>
                      <div className="text-[10px] text-theme-text-muted">Paseo dinámico paso a paso</div>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-theme-surface border border-theme-border text-theme-text-muted">
                    F5
                  </span>
                </button>

                {/* Quality Audit Linter */}
                <button
                  onClick={() => {
                    setQualityAuditModalOpen(true);
                    setIsToolsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text group"
                >
                  <div className="flex items-center space-x-2.5">
                    <Shield className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-semibold">Auditor de Calidad</div>
                      <div className="text-[10px] text-theme-text-muted">Linter BPMN 2.0 / ISO 9001</div>
                    </div>
                  </div>
                </button>

                {/* Simulation */}
                <button
                  onClick={() => {
                    setSimulationModalOpen(true);
                    setIsToolsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text group"
                >
                  <div className="flex items-center space-x-2.5">
                    <Flame className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-semibold">Simulador de Flujos</div>
                      <div className="text-[10px] text-theme-text-muted">Detección de cuellos de botella</div>
                    </div>
                  </div>
                </button>

                {/* Version Diff */}
                <button
                  onClick={() => {
                    setVersionDiffModalOpen(true);
                    setIsToolsMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text group"
                >
                  <div className="flex items-center space-x-2.5">
                    <GitCompare className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-semibold">Comparar Versiones</div>
                      <div className="text-[10px] text-theme-text-muted">Auditoría visual de JSON diff</div>
                    </div>
                  </div>
                </button>

                {/* Subprocess Navigator (Canvas mode only) */}
                {activeView === 'CANVAS' && (
                  <button
                    onClick={() => {
                      if (isPropertiesPanelOpen) {
                        setActiveRightTab('NAVIGATOR');
                      } else {
                        setPropertiesPanelOpen(true);
                        setActiveRightTab('NAVIGATOR');
                      }
                      setIsToolsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text border-t border-theme-border/60 mt-1 pt-1.5 group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Compass className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="font-semibold">Navegador de Jerarquías</div>
                        <div className="text-[10px] text-theme-text-muted">Árbol de macro y subprocesos</div>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Compact Utilities & Primary Action Buttons */}
      <div className="flex items-center space-x-2 shrink-0">
        {/* History Undo / Redo (Compact) */}
        {currentProject && (
          <div className="flex items-center bg-theme-surface-subtle p-0.5 rounded-lg border border-theme-border">
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-md transition-all ${
                canUndo
                  ? 'text-theme-text hover:text-theme-accent hover:bg-theme-surface cursor-pointer'
                  : 'text-theme-text-muted/40 cursor-not-allowed opacity-40'
              }`}
              title={canUndo ? 'Deshacer último cambio (Ctrl+Z)' : 'Nada que deshacer'}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded-md transition-all ${
                canRedo
                  ? 'text-theme-text hover:text-theme-accent hover:bg-theme-surface cursor-pointer'
                  : 'text-theme-text-muted/40 cursor-not-allowed opacity-40'
              }`}
              title={canRedo ? 'Rehacer cambio (Ctrl+Y)' : 'Nada que rehacer'}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Quick Utilities Group */}
        <div className="flex items-center space-x-1 bg-theme-surface-subtle p-0.5 rounded-lg border border-theme-border">
          {/* Open Folder in Explorer */}
          <button
            onClick={handleOpenFolder}
            className="p-1.5 rounded-md text-theme-text hover:text-theme-accent hover:bg-theme-surface transition-colors"
            title="Abrir carpeta de proyectos JSON en disco"
          >
            <FolderOpen className="w-3.5 h-3.5" />
          </button>

          {/* Antigravity IDE Themes */}
          <button
            onClick={() => setThemeModalOpen(true)}
            className="p-1.5 rounded-md text-theme-text hover:text-theme-accent hover:bg-theme-surface transition-colors group"
            title="Personalizar Temas de Antigravity IDE y Paleta"
          >
            <Palette className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
          </button>

          {/* Dark / Light Mode Switch */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-md text-theme-text hover:text-theme-accent hover:bg-theme-surface transition-colors"
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
          >
            {theme === 'dark' ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-theme-accent" />
            )}
          </button>
        </div>

        {/* Primary Project Actions (Icon-Only) */}
        {currentProject && (
          <button
            onClick={() => setExportCenterModalOpen(true)}
            className="p-2 bg-theme-surface-subtle hover:bg-theme-surface text-theme-text hover:text-theme-accent rounded-lg text-xs font-semibold border border-theme-border transition-all hover:scale-105"
            title="Centro de Exportación: PNG HD, SVG Vectorial, PDF, BPMN 2.0 XML y Word (.doc)"
          >
            <ArrowDownToLine className="w-4 h-4 text-theme-accent" />
          </button>
        )}

        <button
          onClick={onOpenNewProjectModal}
          className="p-2 bg-theme-surface-subtle hover:bg-theme-surface text-theme-text hover:text-theme-accent rounded-lg text-xs font-semibold border border-theme-border transition-all hover:scale-105"
          title="Crear nuevo proyecto"
        >
          <Plus className="w-4 h-4 text-theme-accent" />
        </button>

        {currentProject && (
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`p-2 rounded-lg text-xs font-bold shadow-md transition-all hover:scale-105 flex items-center justify-center ${
              hasUnsavedChanges
                ? 'bg-gradient-to-r from-[#0284C7] to-[#3B82F6] hover:brightness-110 text-white animate-pulse'
                : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
            }`}
            title={isSaving ? 'Guardando...' : hasUnsavedChanges ? 'Guardar cambios pendientes (Ctrl+S)' : 'Todos los cambios guardados (Ctrl+S)'}
          >
            <Save className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
