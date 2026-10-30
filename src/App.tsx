import React, { useEffect, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useProjectStore } from './store/useProjectStore';
import { useUiStore } from './store/useUiStore';
import { useAuthStore } from './store/useAuthStore';
import { Header } from './components/layout/Header';
import { SidebarPalette } from './components/layout/SidebarPalette';
import { ProcessCanvas } from './components/canvas/ProcessCanvas';
import { RightSidebar } from './components/layout/RightSidebar';
import { ProjectDashboard } from './components/dashboard/ProjectDashboard';
import { SipocMatrixView } from './components/sipoc/SipocMatrixView';
import { RaciMatrixView } from './components/raci/RaciMatrixView';
import { FlowchartView } from './components/flowchart/FlowchartView';
import { TechnicalReportView } from './components/report/TechnicalReportView';
import { NewProjectModal } from './components/modals/NewProjectModal';
import { SubProcessDetailModal } from './components/modals/SubProcessDetailModal';
import { ThemeCustomizationModal } from './components/modals/ThemeCustomizationModal';
import { CompressSubProcessModal } from './components/modals/CompressSubProcessModal';
import { QualityAuditModal } from './components/quality/QualityAuditModal';
import { ExportCenterModal } from './components/export/ExportCenterModal';
import { SimulationModal } from './components/simulation/SimulationModal';
import { VersionDiffModal } from './components/diff/VersionDiffModal';
import { ManageLanesModal } from './components/modals/ManageLanesModal';
import { ProcessDocumentationModal } from './components/documentation/ProcessDocumentationModal';
import { MasterCatalogsModal } from './components/catalogs/MasterCatalogsModal';
import { TextToDiagramModal } from './components/modals/TextToDiagramModal';
import { CommandPaletteModal } from './components/modals/CommandPaletteModal';
import { TutorialCenterModal } from './components/tutorial/TutorialCenterModal';
import { InteractiveTourOverlay } from './components/tutorial/InteractiveTourOverlay';
import { AuthModal } from './components/auth/AuthModal';
import { AdminConsoleModal } from './components/admin/AdminConsoleModal';
import { IdleLockOverlay } from './components/auth/IdleLockOverlay';
import { IdleWarningToast } from './components/auth/IdleWarningToast';
import { PermissionService } from './services/permissionService';
import { hasUserModuleAccess } from './types/auth';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { VersionBadge } from './components/common/VersionBadge';
import { CheckCircle2, Info, AlertCircle, AlertTriangle, X } from 'lucide-react';

export const App: React.FC = () => {
  const { initialize, isLoading, currentProject } = useProjectStore();
  const { initializeAuth, currentUser } = useAuthStore();
  const {
    activeView,
    setActiveView,
    showNotification,
    isPropertiesPanelOpen,
    activeSubProcessNodeId,
    closeSubProcessDetail,
    activeNotification,
    clearNotification,
    isQualityAuditModalOpen,
    setQualityAuditModalOpen,
    isExportCenterModalOpen,
    setExportCenterModalOpen,
    isSimulationModalOpen,
    setSimulationModalOpen,
    isVersionDiffModalOpen,
    setVersionDiffModalOpen
  } = useUiStore();

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  useEffect(() => {
    initialize();
    initializeAuth();
  }, [initialize, initializeAuth]);

  // Guard de visualización estricta de lienzos y módulos habilitados para usuarios regulares
  useEffect(() => {
    if (!currentUser) return;

    const viewModuleMap: Record<string, Parameters<typeof hasUserModuleAccess>[1]> = {
      DASHBOARD: 'DASHBOARD',
      CANVAS: 'CANVAS',
      REPORT: 'VIEW_REPORT',
      SIPOC: 'VIEW_SIPOC',
      RACI: 'VIEW_RACI',
      FLOWCHART: 'VIEW_FLOWCHART'
    };

    const requiredModule = viewModuleMap[activeView];
    if (requiredModule && !hasUserModuleAccess(currentUser, requiredModule)) {
      const fallbackOrder: Array<{ view: typeof activeView; mod: Parameters<typeof hasUserModuleAccess>[1] }> = [
        { view: 'DASHBOARD', mod: 'DASHBOARD' },
        { view: 'CANVAS', mod: 'CANVAS' },
        { view: 'REPORT', mod: 'VIEW_REPORT' },
        { view: 'FLOWCHART', mod: 'VIEW_FLOWCHART' },
        { view: 'SIPOC', mod: 'VIEW_SIPOC' },
        { view: 'RACI', mod: 'VIEW_RACI' }
      ];
      const allowedFallback = fallbackOrder.find(item => hasUserModuleAccess(currentUser, item.mod));
      if (allowedFallback && allowedFallback.view !== activeView) {
        setActiveView(allowedFallback.view);
        return;
      }
    }

    if (currentUser.role === 'USER' && activeView === 'CANVAS' && currentProject?.fileName) {
      const perm = PermissionService.getUserPermissionForProject(currentUser, currentProject.fileName);
      if (!perm) {
        showNotification('Acceso denegado: este lienzo no está asignado a tu usuario.', 'warning');
        setActiveView('DASHBOARD');
      }
    }
  }, [currentUser, activeView, currentProject, setActiveView, showNotification]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-theme-bg flex flex-col items-center justify-center text-theme-text">
        <div className="w-10 h-10 border-4 border-theme-accent border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-bold tracking-wider font-mono">
          CARGANDO PROCESSTUDIO WEB...
        </h2>
        <p className="text-xs text-theme-text-muted mt-1 font-mono">
          Inicializando persistencia, catálogos ABM y seguridad relacional
        </p>
      </div>
    );
  }

  // Auth Gatekeeper Obligatorio: Si no hay usuario autenticado, no se muestra el espacio de trabajo
  if (!currentUser) {
    return (
      <ErrorBoundary>
        <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-100 overflow-hidden select-none relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-slate-950 to-slate-950 pointer-events-none" />
          <AuthModal isGatekeeper={true} />
          <VersionBadge />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen w-screen flex flex-col bg-theme-bg text-theme-text overflow-hidden select-none transition-colors">
        {/* Top Header */}
        <Header onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)} />

        {/* Main Workspace Area */}
        <main className="flex-1 flex overflow-hidden relative">
          {activeView === 'DASHBOARD' && (
            <ProjectDashboard onOpenNewModal={() => setIsNewProjectModalOpen(true)} />
          )}

          {activeView === 'CANVAS' && (
            <ReactFlowProvider>
              <div className="flex-1 flex w-full h-full overflow-hidden">
                <SidebarPalette />
                <ProcessCanvas />
                {isPropertiesPanelOpen && <RightSidebar />}
              </div>
            </ReactFlowProvider>
          )}

          {activeView === 'FLOWCHART' && <FlowchartView />}

          {activeView === 'SIPOC' && <SipocMatrixView />}

          {activeView === 'RACI' && <RaciMatrixView />}

          {activeView === 'REPORT' && <TechnicalReportView />}
        </main>

        {/* SubProcess Detail Expansion Modal */}
        {activeSubProcessNodeId && (
          <SubProcessDetailModal
            nodeId={activeSubProcessNodeId}
            onClose={closeSubProcessDetail}
          />
        )}

        {/* Notification Toast */}
        {activeNotification && (
          <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-3 px-4 py-3 rounded-xl bg-theme-surface border border-theme-border shadow-2xl animate-slideUp text-xs">
            {activeNotification.type === 'success' && (
              <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0" />
            )}
            {activeNotification.type === 'info' && (
              <Info className="w-4 h-4 text-[#3B82F6] shrink-0" />
            )}
            {activeNotification.type === 'error' && (
              <AlertCircle className="w-4 h-4 text-[#EF4444] shrink-0" />
            )}
            {activeNotification.type === 'warning' && (
              <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0" />
            )}
            <span className="text-theme-text font-medium">{activeNotification.message}</span>
            <button
              onClick={clearNotification}
              className="text-theme-text-muted hover:text-theme-text p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* New Project Modal */}
        <NewProjectModal
          isOpen={isNewProjectModalOpen}
          onClose={() => setIsNewProjectModalOpen(false)}
        />

        {/* Theme & Palette Customization Modal */}
        <ThemeCustomizationModal />

        {/* Compress Selection to SubProcess Modal */}
        <CompressSubProcessModal />

        {/* Quality Audit Modal */}
        <QualityAuditModal
          isOpen={isQualityAuditModalOpen}
          onClose={() => setQualityAuditModalOpen(false)}
        />

        {/* Export Center Modal */}
        <ExportCenterModal
          isOpen={isExportCenterModalOpen}
          onClose={() => setExportCenterModalOpen(false)}
        />

        {/* Process Simulation Modal */}
        <SimulationModal
          isOpen={isSimulationModalOpen}
          onClose={() => setSimulationModalOpen(false)}
        />

        {/* Project Version Diff Modal */}
        <VersionDiffModal
          isOpen={isVersionDiffModalOpen}
          onClose={() => setVersionDiffModalOpen(false)}
        />

        {/* Manage Lanes (Swimlanes) Modal */}
        <ManageLanesModal />

        {/* Process Documentation & AI Context Modal */}
        <ProcessDocumentationModal />

        {/* v2.0 Modals: Master Catalogs ABMs, Text-to-Diagram, Command Palette, Tutorial & Interactive Tour */}
        <MasterCatalogsModal />
        <TextToDiagramModal />
        <CommandPaletteModal />
        <TutorialCenterModal />
        <InteractiveTourOverlay />

        {/* Modales de Autenticación, Gobernanza y Seguridad */}
        <AuthModal />
        <AdminConsoleModal />
        <IdleLockOverlay />
        <IdleWarningToast />

        {/* Indicador Global de Versión en Esquina Inferior Derecha */}
        <VersionBadge />
      </div>
    </ErrorBoundary>
  );
};
export default App;
