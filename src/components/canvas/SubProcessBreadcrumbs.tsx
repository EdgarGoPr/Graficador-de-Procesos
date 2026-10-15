import React from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useProjectStore } from '../../store/useProjectStore';
import { getAllProjectProcesses, getCurrentProcessInfo } from '../../services/processHierarchyService';
import { Home, ChevronRight, Layers, ArrowLeft } from 'lucide-react';

export const SubProcessBreadcrumbs: React.FC = () => {
  const { currentProject } = useProjectStore();
  const {
    subProcessPath,
    leaveSubProcess,
    navigateToSubProcessPath
  } = useCanvasStore();

  if (!currentProject) {
    return null;
  }

  // Get all processes in the project (P01N00, P02N01, P03N01...)
  const allProcesses = getAllProjectProcesses(currentProject);
  const currentProcess = getCurrentProcessInfo(currentProject, subProcessPath);
  const isAtRoot = !subProcessPath || subProcessPath.length === 0;

  return (
    <div
      className="absolute top-3 left-4 z-30 flex items-center bg-theme-surface/95 border border-theme-border/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-xl space-x-1.5 text-xs select-none animate-in fade-in slide-in-from-top-2 duration-200 max-w-[calc(100vw-360px)] overflow-x-auto no-scrollbar"
      title="Navegación entre Procesos y Subprocesos Anidados"
    >
      {allProcesses.map((proc, index) => {
        const isCurrent = isAtRoot
          ? proc.id === 'root'
          : subProcessPath[subProcessPath.length - 1]?.id === proc.id;

        return (
          <React.Fragment key={proc.id}>
            {index > 0 && (
              <ChevronRight className="w-3 h-3 text-theme-text-muted/40 shrink-0 mx-0.5" />
            )}

            {isCurrent ? (
              // Selected / Active Process: Expanded with Title and Level
              <span className="font-bold text-theme-text flex items-center space-x-1.5 bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-lg border border-indigo-500/25 shrink-0 shadow-xs">
                {proc.level === 0 ? (
                  <Home className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                ) : (
                  <Layers className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                )}
                <span className="font-mono text-[11px] font-black">{proc.sigla}:</span>
                <span className="truncate max-w-[200px] text-theme-text" title={proc.title}>
                  {proc.title}
                </span>
                <span className="text-[10px] font-mono bg-indigo-500/20 px-1.5 py-0.2 rounded text-indigo-300 shrink-0">
                  Nivel {proc.level}
                </span>
              </span>
            ) : (
              // Unselected / Inactive Process: Concise acronym (P01N00, P02N01, etc.)
              <button
                type="button"
                onClick={() => navigateToSubProcessPath(proc.path)}
                className="px-2 py-1 rounded-md text-theme-text-muted hover:text-indigo-400 hover:bg-theme-surface-hover/80 border border-transparent hover:border-theme-border transition-all flex items-center space-x-1 shrink-0 font-mono text-[11px] font-bold"
                title={`Ir a ${proc.title} (Nivel ${proc.level})`}
              >
                {proc.level === 0 && <Home className="w-3 h-3 mr-0.5 opacity-70" />}
                {proc.level > 0 && <Layers className="w-3 h-3 mr-0.5 opacity-70" />}
                <span>{proc.sigla}</span>
              </button>
            )}
          </React.Fragment>
        );
      })}

      {/* Volver / Step up button when nested */}
      {!isAtRoot && (
        <>
          <div className="w-[1px] h-4 bg-theme-border mx-1 shrink-0" />
          <button
            type="button"
            onClick={leaveSubProcess}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md bg-theme-surface-subtle hover:bg-theme-surface-hover border border-theme-border text-theme-text hover:text-indigo-400 text-[11px] font-semibold transition-all shadow-sm active:scale-95 shrink-0"
            title="Subir un nivel (Regresar al proceso contenedor)"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Volver</span>
          </button>
        </>
      )}
    </div>
  );
};
