import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { detectNewerVersionAvailable } from '../../services/processVersionManager';
import { Sparkles, ArrowRight, X, Clock, RefreshCw } from 'lucide-react';

export const NewerVersionBanner: React.FC = () => {
  const { currentProject, projectList, openProject, isLoading } = useProjectStore();
  const { showNotification } = useUiStore();
  const [isDismissed, setIsDismissed] = useState(false);

  if (!currentProject || isDismissed) return null;

  const newerCandidate = detectNewerVersionAvailable(currentProject, projectList);
  if (!newerCandidate) return null;

  const candidateDate = new Date(newerCandidate.updatedAt).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleLoadNewer = async () => {
    const ok = await openProject(newerCandidate.fileName);
    if (ok) {
      showNotification(`Cargada la versión más reciente: ${newerCandidate.fileName}`, 'success');
      setIsDismissed(true);
    }
  };

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-40 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div className="flex items-center space-x-3 px-4 py-2.5 rounded-2xl bg-theme-surface/95 backdrop-blur-xl border border-theme-accent/40 shadow-2xl text-theme-text ring-2 ring-theme-accent/20">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-theme-accent/20 text-theme-accent animate-pulse">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-theme-accent">Versión más reciente detectada:</span>{' '}
            <span className="font-mono font-semibold">v{newerCandidate.version}</span>{' '}
            <span className="text-theme-text-muted">({candidateDate})</span>
          </div>
        </div>

        <div className="flex items-center space-x-2 pl-2 border-l border-theme-border">
          <button
            onClick={handleLoadNewer}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-theme-accent hover:bg-theme-accent-hover text-white text-xs font-bold shadow-md transition-all hover:scale-105"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Cargar Última Versión</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            title="Ignorar sugerencia"
            className="p-1 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-subtle transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
