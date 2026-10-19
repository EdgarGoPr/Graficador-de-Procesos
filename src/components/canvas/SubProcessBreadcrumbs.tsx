import React from 'react';
import { useCanvasStore } from '../../store/useCanvasStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { PRESET_THEMES } from '../../types/theme';
import { getAllProjectProcesses, getCurrentProcessInfo } from '../../services/processHierarchyService';
import { Home, ChevronRight, Layers, ArrowLeft } from 'lucide-react';

export const SubProcessBreadcrumbs: React.FC = () => {
  const { currentProject } = useProjectStore();
  const {
    subProcessPath,
    leaveSubProcess,
    navigateToSubProcessPath
  } = useCanvasStore();
  const { theme, currentThemeId, customThemeColors } = useUiStore();

  if (!currentProject) {
    return null;
  }

  const isDark =
    currentThemeId === 'custom'
      ? customThemeColors.isDark
      : (PRESET_THEMES[currentThemeId]?.colors.isDark ?? theme === 'dark');

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

        // Calculate ancestor distance: 0 = current, 1 = direct parent, 2 = grandparent, -1 = not in active lineage
        let ancestorDistance = -1;
        if (isCurrent) {
          ancestorDistance = 0;
        } else if (!isAtRoot) {
          if (proc.id === 'root') {
            ancestorDistance = subProcessPath.length;
          } else {
            const idx = subProcessPath.findIndex((p) => p.id === proc.id);
            if (idx !== -1) {
              ancestorDistance = (subProcessPath.length - 1) - idx;
            }
          }
        }

        const isAncestor = ancestorDistance > 0;
        const bgOpacity = isAncestor ? Math.max(0.12, 0.28 - ancestorDistance * 0.05) : 0;
        const borderOpacity = isAncestor ? (isDark ? Math.max(0.3, 0.55 - ancestorDistance * 0.1) : Math.max(0.35, 0.65 - ancestorDistance * 0.1)) : 0;
        const textOpacity = isAncestor ? Math.max(0.85, 1.0 - ancestorDistance * 0.05) : 1;

        return (
          <React.Fragment key={proc.id}>
            {index > 0 && (
              <ChevronRight
                className={`w-3.5 h-3.5 shrink-0 mx-0.5 transition-colors ${
                  isAncestor || isCurrent
                    ? isDark ? 'text-indigo-400/80' : 'text-indigo-600/80'
                    : isDark ? 'text-slate-500/50' : 'text-slate-400/60'
                }`}
              />
            )}

            {isCurrent ? (
              // Selected / Active Process: Expanded with Title and Level in High Contrast
              <span
                className={`font-bold flex items-center space-x-1.5 px-3 py-1 rounded-lg border-2 shrink-0 shadow-md ${
                  isDark
                    ? 'bg-indigo-500/25 border-indigo-400 ring-2 ring-indigo-400/30'
                    : 'bg-indigo-100/95 border-indigo-600 ring-2 ring-indigo-500/25'
                }`}
              >
                {proc.level === 0 ? (
                  <Home className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`} />
                ) : (
                  <Layers className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-indigo-300' : 'text-indigo-700'}`} />
                )}
                <span className={`font-mono text-[11px] font-black ${isDark ? 'text-indigo-200' : 'text-indigo-950'}`}>
                  {proc.sigla}:
                </span>
                <span className={`truncate max-w-[220px] font-bold ${isDark ? 'text-white' : 'text-slate-900'}`} title={proc.title}>
                  {proc.title}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0 shadow-xs ${
                    isDark
                      ? 'bg-indigo-500/40 text-indigo-100 border border-indigo-400/50'
                      : 'bg-indigo-600 text-white border border-indigo-700'
                  }`}
                >
                  Nivel {proc.level}
                </span>
              </span>
            ) : isAncestor ? (
              // Ancestor Process in Lineage: Highlighted with high-contrast text and fading opacity as it generalizes
              <button
                type="button"
                onClick={() => navigateToSubProcessPath(proc.path)}
                style={{
                  backgroundColor: `rgba(99, 102, 241, ${bgOpacity})`,
                  borderColor: isDark ? `rgba(129, 140, 248, ${borderOpacity})` : `rgba(79, 70, 229, ${borderOpacity})`,
                  color: isDark ? `rgba(224, 231, 255, ${textOpacity})` : `rgba(49, 46, 129, ${textOpacity})`,
                }}
                className="px-2.5 py-1 rounded-md border-2 transition-all flex items-center space-x-1 shrink-0 font-mono text-[11px] font-black hover:brightness-110 shadow-xs"
                title={`Proceso contenedor (Nivel ${proc.level}) de ${currentProcess.sigla}. Clic para subir a este proceso.`}
              >
                {proc.level === 0 && <Home className={`w-3 h-3 mr-0.5 ${isDark ? 'text-indigo-200' : 'text-indigo-800'}`} />}
                {proc.level > 0 && <Layers className={`w-3 h-3 mr-0.5 ${isDark ? 'text-indigo-200' : 'text-indigo-800'}`} />}
                <span>{proc.sigla}</span>
              </button>
            ) : (
              // Unselected / Inactive Process: Concise neutral acronym with high contrast
              <button
                type="button"
                onClick={() => navigateToSubProcessPath(proc.path)}
                className={`px-2 py-1 rounded-md border transition-all flex items-center space-x-1 shrink-0 font-mono text-[11px] font-bold ${
                  isDark
                    ? 'text-slate-300 hover:text-indigo-300 hover:bg-white/10 border-transparent hover:border-slate-600'
                    : 'text-slate-700 hover:text-indigo-700 hover:bg-slate-200/70 border-transparent hover:border-slate-300'
                }`}
                title={`Ir a ${proc.title} (Nivel ${proc.level})`}
              >
                {proc.level === 0 && <Home className="w-3 h-3 mr-0.5 opacity-80" />}
                {proc.level > 0 && <Layers className="w-3 h-3 mr-0.5 opacity-80" />}
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
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-md border transition-all shadow-xs active:scale-95 shrink-0 text-[11px] font-bold ${
              isDark
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-100 border-slate-700 hover:text-indigo-300'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 hover:text-indigo-700'
            }`}
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
