import React, { useEffect, useState } from 'react';
import { useProjectStore } from './store/useProjectStore';
import { useUiStore } from './store/useUiStore';
import { Header } from './components/layout/Header';
import { SidebarPalette } from './components/layout/SidebarPalette';
import { ProcessCanvas } from './components/canvas/ProcessCanvas';
import { PropertiesPanel } from './components/layout/PropertiesPanel';
import { ProjectDashboard } from './components/dashboard/ProjectDashboard';
import { SipocMatrixView } from './components/sipoc/SipocMatrixView';
import { TechnicalReportView } from './components/report/TechnicalReportView';
import { NewProjectModal } from './components/modals/NewProjectModal';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';

export const App: React.FC = () => {
  const { initialize, isLoading } = useProjectStore();
  const {
    activeView,
    isPropertiesPanelOpen,
    activeNotification,
    clearNotification
  } = useUiStore();

  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-bold tracking-wider font-mono">
          CARGANDO PROCESOSSTUDIO PORTABLE...
        </h2>
        <p className="text-xs text-slate-500 mt-1 font-mono">
          Inicializando persistencia local en ../Proyectos/
        </p>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Header */}
      <Header onOpenNewProjectModal={() => setIsNewProjectModalOpen(true)} />

      {/* Main Workspace Area */}
      <main className="flex-1 flex overflow-hidden relative">
        {activeView === 'DASHBOARD' && (
          <ProjectDashboard onOpenNewModal={() => setIsNewProjectModalOpen(true)} />
        )}

        {activeView === 'CANVAS' && (
          <div className="flex-1 flex w-full h-full overflow-hidden">
            <SidebarPalette />
            <ProcessCanvas />
            {isPropertiesPanelOpen && <PropertiesPanel />}
          </div>
        )}

        {activeView === 'SIPOC' && <SipocMatrixView />}

        {activeView === 'REPORT' && <TechnicalReportView />}
      </main>

      {/* Notification Toast */}
      {activeNotification && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center space-x-3 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl animate-slideUp text-xs">
          {activeNotification.type === 'success' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          {activeNotification.type === 'info' && (
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          )}
          {activeNotification.type === 'error' && (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span className="text-slate-200 font-medium">{activeNotification.message}</span>
          <button
            onClick={clearNotification}
            className="text-slate-500 hover:text-slate-300 p-0.5"
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
    </div>
  );
};
export default App;
