import React from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { Home, ChevronRight, Layers, ArrowLeft } from 'lucide-react';

export const SubProcessBreadcrumbs: React.FC = () => {
  const { subProcessPath, leaveSubProcess, jumpToSubProcessLevel } = useCanvasStore();

  if (!subProcessPath || subProcessPath.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-3 left-4 z-30 flex items-center bg-theme-surface/95 border border-theme-border/80 backdrop-blur-md px-3.5 py-1.5 rounded-xl shadow-xl space-x-2 text-xs select-none animate-in fade-in slide-in-from-top-2 duration-200">
      <button
        onClick={() => jumpToSubProcessLevel(-1)}
        className="flex items-center space-x-1.5 text-theme-text-muted hover:text-theme-accent transition-colors font-medium hover:underline"
        title="Volver al proceso principal"
      >
        <Home className="w-3.5 h-3.5 text-theme-accent" />
        <span>Proceso Principal</span>
      </button>

      {subProcessPath.map((step, idx) => {
        const isCurrent = idx === subProcessPath.length - 1;
        return (
          <React.Fragment key={step.id}>
            <ChevronRight className="w-3 h-3 text-theme-text-muted/60 shrink-0" />
            {isCurrent ? (
              <span className="font-bold text-theme-text flex items-center space-x-1.5 bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-md border border-indigo-500/25">
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="font-mono">{step.standardId}:</span>
                <span className="truncate max-w-[180px]">{step.title}</span>
                <span className="text-[10px] font-mono bg-indigo-500/20 px-1 py-0.2 rounded ml-1">
                  Nivel {idx + 1}
                </span>
              </span>
            ) : (
              <button
                onClick={() => jumpToSubProcessLevel(idx)}
                className="text-theme-text-muted hover:text-theme-accent transition-colors font-medium hover:underline flex items-center space-x-1"
                title={`Ir a ${step.title}`}
              >
                <span className="font-mono">{step.standardId}</span>
              </button>
            )}
          </React.Fragment>
        );
      })}

      <div className="w-[1px] h-4 bg-theme-border mx-1" />

      <button
        onClick={leaveSubProcess}
        className="flex items-center space-x-1 px-2 py-0.5 rounded-md bg-theme-surface-subtle hover:bg-theme-surface-hover border border-theme-border text-theme-text hover:text-theme-accent text-[11px] font-semibold transition-all shadow-sm active:scale-95"
        title="Subir un nivel (Regresar al proceso contenedor)"
      >
        <ArrowLeft className="w-3 h-3" />
        <span>Volver</span>
      </button>
    </div>
  );
};
