import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { useAuthStore } from '../../store/useAuthStore';
import { hasUserModuleAccess } from '../../types/auth';
import { StorageService } from '../../services/storageService';
import { PermissionService } from '../../services/permissionService';
import {
  autoLayoutProcessCanvas,
  calculateProcessReadinessScore
} from '../../services/autoLayoutAndGeneratorService';
import { LogoPS } from '../common/LogoPS';
import { NewRevisionModal } from '../modals/NewRevisionModal';
import { ProjectParticipantsModal } from '../modals/ProjectParticipantsModal';
import { EditProjectModal } from '../modals/EditProjectModal';
import { UserProfileMenu } from './UserProfileMenu';
import {
  LayoutDashboard,
  GitGraph,
  Workflow,
  Table,
  FileCheck,
  Save,
  Plus,
  Shield,
  Compass,
  Undo2,
  Redo2,
  Flame,
  GitCompare,
  ArrowDownToLine,
  Tv,
  ChevronDown,
  Sparkles,
  Check,
  GitCommit,
  Users,
  Pencil,
  Wand2,
  GraduationCap,
  Search
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
    setProjectData,
    pushSnapshot
  } = useProjectStore();

  const {
    activeView,
    setActiveView,
    setQualityAuditModalOpen,
    setExportCenterModalOpen,
    setSimulationModalOpen,
    setVersionDiffModalOpen,
    setPresentationModalOpen,
    setDocumentationModalOpen,
    setTextToDiagramModalOpen,
    setCommandPaletteOpen,
    setTutorialModalOpen,
    setInteractiveTourActive,
    showNotification,
    isPropertiesPanelOpen,
    setPropertiesPanelOpen,
    setActiveRightTab
  } = useUiStore();

  const {
    currentUser,
    currentCanvasPermission,
    releaseCanvasLock
  } = useAuthStore();

  const [isViewsMenuOpen, setIsViewsMenuOpen] = useState(false);
  const [isToolsMenuOpen, setIsToolsMenuOpen] = useState(false);
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const canManageParticipants = currentProject
    ? PermissionService.canUserManageProjectParticipants(currentUser, currentProject.documentControl)
    : false;

  // Permisos de módulos por usuario (PST-090)
  const canAccessDashboard = hasUserModuleAccess(currentUser, 'DASHBOARD');
  const canAccessCanvas = hasUserModuleAccess(currentUser, 'CANVAS');
  const canAccessReport = hasUserModuleAccess(currentUser, 'VIEW_REPORT');
  const canAccessSipoc = hasUserModuleAccess(currentUser, 'VIEW_SIPOC');
  const canAccessRaci = hasUserModuleAccess(currentUser, 'VIEW_RACI');
  const canAccessFlowchart = hasUserModuleAccess(currentUser, 'VIEW_FLOWCHART');
  const canAccessAnyAnalyticalView =
    canAccessReport || canAccessSipoc || canAccessRaci || canAccessFlowchart;
  const canAccessToolsMenu = hasUserModuleAccess(currentUser, 'TOOLS_MENU');
  const canAccessExportCenter = hasUserModuleAccess(currentUser, 'EXPORT_CENTER');
  const canCreateProjects = hasUserModuleAccess(currentUser, 'CREATE_PROJECTS');

  const readiness = useMemo(
    () => calculateProcessReadinessScore(currentProject),
    [currentProject]
  );

  const viewsMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);

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

  const handleAutoLayout = () => {
    if (!currentProject) return;
    if (currentCanvasPermission === 'READ_ONLY' || currentCanvasPermission === 'COMMENTS') {
      showNotification('Se requiere permiso de Editor para auto-ordenar el lienzo.', 'warning');
      return;
    }
    pushSnapshot('Antes de Auto-Ordenar Lienzo');
    const aligned = autoLayoutProcessCanvas(currentProject);
    setProjectData(aligned);
    if (canAccessCanvas) {
      setActiveView('CANVAS');
    }
    showNotification('✨ ¡Lienzo auto-ordenado y alineado por carril!', 'success');
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
        if (canAccessToolsMenu) {
          e.preventDefault();
          setPresentationModalOpen(true);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentProject, hasUnsavedChanges, canUndo, canRedo, undo, redo, setPresentationModalOpen, canAccessToolsMenu]);

  const handleSave = async () => {
    if (!currentProject) return;
    if (currentCanvasPermission === 'READ_ONLY') {
      showNotification('No puedes guardar cambios en modo Solo Lectura.', 'warning');
      return;
    }
    const ok = await saveCurrentProject();
    if (ok) {
      if (StorageService.isElectron()) {
        showNotification(`Proyecto guardado en ../Proyectos/${currentProject.fileName}`, 'success');
      } else {
        showNotification(`Proyecto guardado (${currentProject.fileName})`, 'success');
      }
    }
  };

  const handleGoToDashboard = () => {
    if (!canAccessDashboard) return;
    if (currentProject?.fileName) {
      releaseCanvasLock(currentProject.fileName);
    }
    setActiveView('DASHBOARD');
  };

  const handleOpenFolder = async () => {
    if (StorageService.isElectron()) {
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
    } else {
      if (currentProject) {
        StorageService.exportProjectToJsonFile(currentProject);
        showNotification(`Archivo ${currentProject.fileName} descargado a tu computador`, 'info');
      } else {
        showNotification('En la Web los proyectos están guardados de forma segura en tu navegador.', 'info');
      }
    }
  };

  const isAnalyticalViewActive = ['FLOWCHART', 'SIPOC', 'RACI', 'REPORT'].includes(activeView);

  return (
    <>
      <header
        style={{ backgroundColor: 'var(--theme-surface)' }}
        className="h-14 border-b border-theme-border bg-theme-surface px-4 flex items-center justify-between z-30 shrink-0 select-none shadow-sm transition-colors"
      >
        {/* Left: Logo & Project Details */}
        <div className="flex items-center space-x-3 shrink-0">
          <div
            onClick={handleGoToDashboard}
            className="cursor-pointer group hover:opacity-90 transition-opacity"
            title="Ir al panel de proyectos"
          >
            <LogoPS size="sm" />
          </div>

          {currentProject ? (
            <div className="hidden lg:flex items-center space-x-2 pl-3 border-l border-theme-border">
              <div className="max-w-xs xl:max-w-sm truncate">
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-bold text-theme-text truncate block">
                    {currentProject.documentControl.documentTitle}
                  </span>
                  {canManageParticipants && (
                    <button
                      onClick={() => setIsEditModalOpen(true)}
                      title="Editar ficha y metadatos del proyecto"
                      className="p-0.5 rounded text-theme-text-muted hover:text-amber-400 hover:bg-theme-surface-subtle transition-colors shrink-0 cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                  {currentCanvasPermission && (
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                        currentCanvasPermission === 'READ_ONLY'
                          ? 'text-sky-400 bg-sky-500/10 border-sky-500/30'
                          : currentCanvasPermission === 'COMMENTS'
                          ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                          : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                      }`}
                    >
                      {currentCanvasPermission === 'READ_ONLY' && 'Solo Lectura'}
                      {currentCanvasPermission === 'COMMENTS' && 'Comentarios'}
                      {currentCanvasPermission === 'EDITOR' && 'Editor'}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-[10px] text-theme-text-muted font-mono">
                  <span className="text-theme-accent font-semibold">{currentProject.documentControl.documentCode}</span>
                  <span>&bull;</span>
                  <span className="text-[#F59E0B] font-semibold">v{currentProject.documentControl.version}</span>
                  {canAccessReport && (
                    <>
                      <span>&bull;</span>
                      <button
                        onClick={() => setActiveView('REPORT')}
                        title={
                          readiness.missingTips.length > 0
                            ? `Completitud documental: ${readiness.scorePercentage}%. Sugerencia: ${readiness.missingTips[0]}`
                            : '¡Proceso 100% completo y listo para descargar Manual PDF!'
                        }
                        className={`px-1.5 py-0.2 rounded font-bold cursor-pointer ${
                          readiness.scorePercentage >= 80
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-amber-500/15 text-amber-400'
                        }`}
                      >
                        Salud PDF: {readiness.scorePercentage}%
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Center: Primary View Options & Dropdowns (Unified "Herramientas" Design) */}
        <div className="flex items-center space-x-2">
          {/* Projects Dashboard */}
          {canAccessDashboard && (
            <button
              onClick={() => setActiveView('DASHBOARD')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                activeView === 'DASHBOARD'
                  ? 'bg-theme-accent/20 text-theme-accent border-theme-accent/50 shadow-sm font-bold'
                  : 'bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border-theme-border'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-theme-accent" />
              <span>Proyectos</span>
            </button>
          )}

          {/* Lienzo */}
          {canAccessCanvas && (
            <button
              onClick={() => setActiveView('CANVAS')}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                activeView === 'CANVAS'
                  ? 'bg-theme-accent/20 text-theme-accent border-theme-accent/50 shadow-sm font-bold'
                  : 'bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border-theme-border'
              }`}
            >
              <GitGraph className="w-3.5 h-3.5 text-theme-accent" />
              <span>Lienzo</span>
            </button>
          )}

          {/* Views & Manual PDF Dropdown (Unified with Herramientas style) */}
          {canAccessAnyAnalyticalView && (
            <div ref={viewsMenuRef} className="relative">
              <button
                onClick={() => {
                  setIsViewsMenuOpen((v) => !v);
                  setIsToolsMenuOpen(false);
                }}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isAnalyticalViewActive || isViewsMenuOpen
                    ? 'bg-theme-accent/20 text-theme-accent border-theme-accent/50 shadow-sm font-bold'
                    : 'bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border-theme-border'
                }`}
              >
                <Table className="w-3.5 h-3.5 text-theme-accent" />
                <span>Vistas & Manual PDF</span>
                <ChevronDown className={`w-3 h-3 text-theme-text-muted transition-transform ${isViewsMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Views Dropdown Card (Solid Background, same geometry as Herramientas) */}
              {isViewsMenuOpen && (
                <div
                  style={{ backgroundColor: 'var(--theme-surface)' }}
                  className="absolute top-full mt-1.5 left-0 w-72 bg-theme-surface border border-theme-border rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95"
                >
                  {canAccessReport && (
                    <button
                      onClick={() => {
                        setActiveView('REPORT');
                        setIsViewsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <FileCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="font-bold text-amber-400">Manual PDF</div>
                          <div className="text-[10px] text-theme-text-muted">Generador automatizado de documento</div>
                        </div>
                      </div>
                      {activeView === 'REPORT' && <Check className="w-3.5 h-3.5 text-theme-accent" />}
                    </button>
                  )}

                  {canAccessSipoc && (
                    <button
                      onClick={() => {
                        setActiveView('SIPOC');
                        setIsViewsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Table className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="font-bold text-emerald-400">Matriz SIPOC</div>
                          <div className="text-[10px] text-theme-text-muted">Proveedores, entradas, salidas y clientes</div>
                        </div>
                      </div>
                      {activeView === 'SIPOC' && <Check className="w-3.5 h-3.5 text-theme-accent" />}
                    </button>
                  )}

                  {canAccessRaci && (
                    <button
                      onClick={() => {
                        setActiveView('RACI');
                        setIsViewsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <GitGraph className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="font-bold text-purple-400">Matriz RACI</div>
                          <div className="text-[10px] text-theme-text-muted">Roles y responsabilidades</div>
                        </div>
                      </div>
                      {activeView === 'RACI' && <Check className="w-3.5 h-3.5 text-theme-accent" />}
                    </button>
                  )}

                  {canAccessFlowchart && (
                    <button
                      onClick={() => {
                        setActiveView('FLOWCHART');
                        setIsViewsMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text group cursor-pointer"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Workflow className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                        <div>
                          <div className="font-bold text-sky-400">Flujograma Secuencial</div>
                          <div className="text-[10px] text-theme-text-muted">Vista ejecutiva horizontal</div>
                        </div>
                      </div>
                      {activeView === 'FLOWCHART' && <Check className="w-3.5 h-3.5 text-theme-accent" />}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tools Dropdown Menu (Solid Background, includes Texto a BPMN & Tutorial) */}
          {canAccessToolsMenu && (
            <div ref={toolsMenuRef} className="relative">
              <button
                onClick={() => {
                  setIsToolsMenuOpen((t) => !t);
                  setIsViewsMenuOpen(false);
                }}
                className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                  isToolsMenuOpen
                    ? 'bg-theme-accent/20 text-theme-accent border-theme-accent/50 shadow-sm font-bold'
                    : 'bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border-theme-border'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-theme-accent" />
                <span>Herramientas</span>
                <ChevronDown className={`w-3 h-3 text-theme-text-muted transition-transform ${isToolsMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Tools Dropdown Card (Solid / Less Transparent Background) */}
              {isToolsMenuOpen && (
                <div
                  style={{ backgroundColor: 'var(--theme-surface)' }}
                  className="absolute top-full mt-1.5 left-0 w-72 bg-theme-surface border border-theme-border rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95"
                >
                  {currentProject && (
                    <>
                      {/* 1. Generador Texto a Diagrama y Plantillas */}
                      <button
                        onClick={() => {
                          setTextToDiagramModalOpen(true);
                          setIsToolsMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text group cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5">
                          <Wand2 className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-bold text-sky-400">Texto a BPMN / Plantillas</div>
                            <div className="text-[10px] text-theme-text-muted">Crea el diagrama completo en 1 clic</div>
                          </div>
                        </div>
                      </button>

                      {/* 2. Magic Auto-Layout */}
                      <button
                        onClick={() => {
                          handleAutoLayout();
                          setIsToolsMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text group cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5">
                          <Sparkles className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-bold text-emerald-400">✨ Auto-Ordenar Lienzo (1-Clic)</div>
                            <div className="text-[10px] text-theme-text-muted">Alinea carriles y figuras sin cruces</div>
                          </div>
                        </div>
                      </button>

                      {/* 3. Bóveda Documental IA */}
                      <button
                        onClick={() => {
                          setDocumentationModalOpen(true);
                          setIsToolsMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text group border-t border-theme-border/60 mt-1 pt-1.5 cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5">
                          <Sparkles className="w-4 h-4 text-violet-400 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-bold flex items-center space-x-1.5 text-violet-400">
                              <span>Bóveda Documental IA</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                            </div>
                            <div className="text-[10px] text-theme-text-muted">Textos, notas de voz y Gemini AI</div>
                          </div>
                        </div>
                      </button>

                      {/* Prezi Presentation */}
                      <button
                        onClick={() => {
                          setPresentationModalOpen(true);
                          setIsToolsMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text group cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5">
                          <Tv className="w-4 h-4 text-theme-accent group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-bold flex items-center space-x-1.5">
                              <span>Presentación (Prezi)</span>
                            </div>
                            <div className="text-[10px] text-theme-text-muted">Paseo dinámico paso a paso</div>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-theme-surface-subtle border border-theme-border text-theme-text-muted">
                          F5
                        </span>
                      </button>

                      {/* Quality Audit Linter */}
                      <button
                        onClick={() => {
                          setQualityAuditModalOpen(true);
                          setIsToolsMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text group cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5">
                          <Shield className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-semibold">Auditor de Calidad</div>
                            <div className="text-[10px] text-theme-text-muted">Auditoría y Linter BPMN 2.0</div>
                          </div>
                        </div>
                      </button>

                      {/* Simulation */}
                      <button
                        onClick={() => {
                          setSimulationModalOpen(true);
                          setIsToolsMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text group cursor-pointer"
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
                        className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text group cursor-pointer"
                      >
                        <div className="flex items-center space-x-2.5">
                          <GitCompare className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                          <div>
                            <div className="font-semibold">Comparar Versiones</div>
                            <div className="text-[10px] text-theme-text-muted">Auditoría visual de JSON diff</div>
                          </div>
                        </div>
                      </button>

                      {/* Subprocess Navigator */}
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
                          className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text border-t border-theme-border/60 mt-1 pt-1.5 group cursor-pointer"
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

                      {/* Editar Ficha del Proceso (Admin o Creador) */}
                      {canManageParticipants && (
                        <button
                          onClick={() => {
                            setIsEditModalOpen(true);
                            setIsToolsMenuOpen(false);
                          }}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text border-t border-theme-border/60 mt-1 pt-1.5 group cursor-pointer"
                        >
                          <div className="flex items-center space-x-2.5">
                            <Pencil className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                            <div>
                              <div className="font-semibold text-amber-400">Editar Ficha del Proceso</div>
                              <div className="text-[10px] text-theme-text-muted">Título, código, autor y unidad</div>
                            </div>
                          </div>
                        </button>
                      )}
                    </>
                  )}

                  {/* Tutorial y Centro de Aprendizaje dentro de Herramientas */}
                  <button
                    onClick={() => {
                      setTutorialModalOpen(true);
                      setIsToolsMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text group cursor-pointer ${
                      currentProject ? 'border-t border-theme-border/60 mt-1 pt-1.5' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <GraduationCap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="font-bold text-amber-400">Tutorial y Guía de Uso</div>
                        <div className="text-[10px] text-theme-text-muted">Centro de aprendizaje y guía rápida</div>
                      </div>
                    </div>
                  </button>

                  {/* Iniciar Tour Guiado Interactivo */}
                  <button
                    onClick={() => {
                      setInteractiveTourActive(true);
                      setIsToolsMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 text-xs hover:bg-theme-surface-subtle transition-colors text-left text-theme-text group cursor-pointer"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Sparkles className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="font-semibold text-emerald-400">Tour Guiado Interactivo</div>
                        <div className="text-[10px] text-theme-text-muted">Recorrido paso a paso en pantalla</div>
                      </div>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Unified Action Cluster & Integrated User Profile Menu */}
        <div className="flex items-center space-x-2 shrink-0">
          {/* Quick Search / Command Palette (Ctrl+K) */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="p-2 rounded-xl bg-theme-surface-subtle hover:bg-theme-surface border border-theme-border/80 text-theme-text-muted hover:text-theme-accent transition-all cursor-pointer"
            title="Buscador Global y Paleta de Comandos Rápida (Ctrl + K)"
          >
            <Search className="w-3.5 h-3.5" />
          </button>

          {/* Project Actions Cluster (When a Project is Active) */}
          {currentProject && (
            <div className="flex items-center space-x-1.5">
              {/* History Undo / Redo */}
              {canAccessCanvas && (
                <div className="flex items-center bg-theme-surface-subtle p-0.5 rounded-xl border border-theme-border/80">
                  <button
                    onClick={handleUndo}
                    disabled={!canUndo}
                    className={`p-1.5 rounded-lg transition-all ${
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
                    className={`p-1.5 rounded-lg transition-all ${
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

              {/* Document Workspace Action Group */}
              <div className="flex items-center space-x-1 bg-theme-surface-subtle p-1 rounded-xl border border-theme-border/80">
                {/* Manage Participants (Admin or Creator) */}
                {canManageParticipants && (
                  <button
                    onClick={() => setIsParticipantsModalOpen(true)}
                    className="p-1.5 rounded-lg text-theme-text hover:text-theme-accent hover:bg-theme-surface transition-all cursor-pointer"
                    title="Gestionar participantes y permisos de este proyecto"
                  >
                    <Users className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Export Center */}
                {canAccessExportCenter && (
                  <button
                    onClick={() => setExportCenterModalOpen(true)}
                    className="p-1.5 rounded-lg text-theme-text hover:text-theme-accent hover:bg-theme-surface transition-all cursor-pointer"
                    title="Centro de Exportación: Manual Oficial PDF, PNG HD, SVG, BPMN XML y Word"
                  >
                    <ArrowDownToLine className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* New Revision */}
                {canAccessCanvas && (
                  <button
                    onClick={() => setIsRevisionModalOpen(true)}
                    disabled={isSaving}
                    className="p-1.5 rounded-lg text-theme-text hover:text-theme-accent hover:bg-theme-surface transition-all cursor-pointer"
                    title="Guardar como nueva versión inmutable"
                  >
                    <GitCommit className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Primary Save Button */}
              {canAccessCanvas && (
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
                    hasUnsavedChanges
                      ? 'bg-gradient-to-r from-[#0284C7] to-[#3B82F6] hover:brightness-110 text-white animate-pulse shadow-blue-500/20'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                  }`}
                  title={
                    isSaving
                      ? 'Guardando cambios...'
                      : hasUnsavedChanges
                      ? 'Guardar cambios pendientes (Ctrl+S)'
                      : 'Todos los cambios guardados (Ctrl+S)'
                  }
                >
                  <Save className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">
                    {isSaving ? 'Guardando...' : hasUnsavedChanges ? 'Guardar' : 'Guardado'}
                  </span>
                </button>
              )}
            </div>
          )}

          {/* Global Action: New Project Button */}
          {canCreateProjects && (
            <button
              onClick={onOpenNewProjectModal}
              className={`flex items-center space-x-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                !currentProject
                  ? 'px-3 py-1.5 bg-theme-accent/15 hover:bg-theme-accent hover:text-white border-theme-accent/30 text-theme-accent shadow-sm'
                  : 'p-1.5 bg-theme-surface-subtle hover:bg-theme-surface text-theme-text hover:text-theme-accent border-theme-border/80'
              }`}
              title="Crear un nuevo proyecto de proceso"
            >
              <Plus className="w-3.5 h-3.5" />
              {!currentProject && <span className="hidden sm:inline">Nuevo Proceso</span>}
            </button>
          )}

          {/* Unified User Profile & Preferences Dropdown */}
          <UserProfileMenu onOpenFolder={handleOpenFolder} />
        </div>
      </header>

      {/* Modales renderizados FUERA de <header> para evitar recorte en la parte superior */}
      {isRevisionModalOpen && (
        <NewRevisionModal
          isOpen={isRevisionModalOpen}
          onClose={() => setIsRevisionModalOpen(false)}
        />
      )}

      {isParticipantsModalOpen && currentProject && (
        <ProjectParticipantsModal
          isOpen={isParticipantsModalOpen}
          onClose={() => setIsParticipantsModalOpen(false)}
          project={{
            fileName: currentProject.fileName || 'proyecto.json',
            documentTitle: currentProject.documentControl.documentTitle,
            documentCode: currentProject.documentControl.documentCode,
            version: currentProject.documentControl.version,
            authorName: currentProject.documentControl.authorName,
            organizationUnit: currentProject.documentControl.organizationUnit,
            createdByEmail: currentProject.documentControl.createdByEmail,
            createdByUserId: currentProject.documentControl.createdByUserId
          }}
        />
      )}

      {isEditModalOpen && currentProject && (
        <EditProjectModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          project={{
            fileName: currentProject.fileName || 'proyecto.json',
            documentTitle: currentProject.documentControl.documentTitle,
            documentCode: currentProject.documentControl.documentCode,
            authorName: currentProject.documentControl.authorName,
            organizationUnit: currentProject.documentControl.organizationUnit,
            processObjective: currentProject.documentControl.processObjective,
            createdByEmail: currentProject.documentControl.createdByEmail,
            createdByUserId: currentProject.documentControl.createdByUserId
          }}
        />
      )}
    </>
  );
};
