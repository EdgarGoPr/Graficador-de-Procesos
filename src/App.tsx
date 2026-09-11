import React, { useEffect, useState } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { useProjectStore } from './store/useProjectStore';
import { useUiStore } from './store/useUiStore';
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
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

export const App: React.FC = () => {
  const { initialize, isLoading } = useProjectStore();
  const {
    activeView,
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
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-theme-bg flex flex-col items-center justify-center text-theme-text">
        <div className="w-10 h-10 border-4 border-theme-accent border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-bold tracking-wider font-mono">
          CARGANDO PROCESSTUDIO PORTABLE...
        </h2>
        <p className="text-xs text-theme-text-muted mt-1 font-mono">
          Inicializando persistencia local en ../Proyectos/
        </p>
      </div>
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
      </div>
    </ErrorBoundary>
  );
};
export default App;


