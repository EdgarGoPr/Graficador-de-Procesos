import React, { useState, useEffect, useMemo } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { StorageService } from '../../services/storageService';
import { ProcessProjectFile } from '../../types/project';
import { compareProjects } from '../../services/projectDiffService';
import { ProjectDiffResult } from '../../types/diff';
import {
  GitCompare,
  PlusCircle,
  MinusCircle,
  Edit3,
  CheckCircle2,
  X,
  ArrowRight,
  Info
} from 'lucide-react';

interface VersionDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VersionDiffModal: React.FC<VersionDiffModalProps> = ({ isOpen, onClose }) => {
  const { currentProject, projectList } = useProjectStore();
  const [baseFileName, setBaseFileName] = useState<string>('');
  const [targetFileName, setTargetFileName] = useState<string>('');
  const [baseProject, setBaseProject] = useState<ProcessProjectFile | null>(null);
  const [targetProject, setTargetProject] = useState<ProcessProjectFile | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);

  const { sameProjectVersions, otherProjects } = useMemo(() => {
    if (!currentProject) {
      return { sameProjectVersions: [], otherProjects: projectList };
    }
    const isSameProject = (p: (typeof projectList)[number]) =>
      currentProject.projectId && p.projectId
        ? p.projectId === currentProject.projectId
        : p.documentCode === currentProject.documentControl.documentCode;

    const same = projectList
      .filter(isSameProject)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    const others = projectList.filter((p) => !isSameProject(p));
    return { sameProjectVersions: same, otherProjects: others };
  }, [currentProject, projectList]);

  // Initialize with current project as target and previous version of the same project as base
  useEffect(() => {
    if (isOpen && currentProject) {
      const currentFile = currentProject.fileName || '';
      setTargetProject(currentProject);
      setTargetFileName(currentFile);

      const currentIdx = sameProjectVersions.findIndex((p) => p.fileName === currentFile);
      const previousVersion =
        (currentIdx >= 0 ? sameProjectVersions[currentIdx + 1] : undefined) ||
        sameProjectVersions.find((p) => p.fileName !== currentFile);

      if (previousVersion) {
        setBaseFileName(previousVersion.fileName);
        loadBaseProject(previousVersion.fileName);
      } else {
        setBaseProject(currentProject);
        setBaseFileName(currentFile);
      }
    }
  }, [isOpen, currentProject, sameProjectVersions]);

  const loadBaseProject = async (fileName: string) => {
    if (!fileName) return;
    setIsLoadingFiles(true);
    const proj = await StorageService.loadProject(fileName);
    setBaseProject(proj);
    setIsLoadingFiles(false);
  };

  const loadTargetProject = async (fileName: string) => {
    if (!fileName) return;
    setIsLoadingFiles(true);
    const proj = await StorageService.loadProject(fileName);
    setTargetProject(proj);
    setIsLoadingFiles(false);
  };

  const diffResult: ProjectDiffResult | null = useMemo(() => {
    if (!baseProject || !targetProject) return null;
    return compareProjects(baseProject, targetProject);
  }, [baseProject, targetProject]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn select-none">
      <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        {/* Header */}
        <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between bg-theme-surface-subtle shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-theme-accent/15 border border-theme-accent/30 text-theme-accent flex items-center justify-center">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-theme-text">Comparador Visual de Versiones (Visual Diff)</h2>
              <p className="text-xs text-theme-text-muted">
                Auditoría comparativa de cambios entre dos archivos de proyectos JSON
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-surface transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Selectors */}
        <div className="px-6 py-4 bg-theme-surface border-b border-theme-border space-y-3 shrink-0">
          {sameProjectVersions.length <= 1 && (
            <div className="px-3.5 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-xs text-sky-300 flex items-center gap-2">
              <Info className="w-4 h-4 text-sky-400 shrink-0" />
              <span>
                Este proyecto tiene una sola versión guardada. Guardá una nueva versión para comparar su evolución, o elegí otro proyecto en el selector si querés compararlos.
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-mono uppercase text-theme-text-muted font-bold block mb-1">
                Versión Base (Antes)
              </label>
              <select
                value={baseFileName}
                onChange={(e) => {
                  setBaseFileName(e.target.value);
                  loadBaseProject(e.target.value);
                }}
                className="w-full px-3 py-1.5 rounded-xl bg-theme-surface-subtle border border-theme-border text-xs text-theme-text font-mono focus:outline-none focus:border-theme-accent"
              >
                {sameProjectVersions.length > 0 && (
                  <optgroup label="Versiones de este proyecto">
                    {sameProjectVersions.map((p) => (
                      <option key={p.fileName} value={p.fileName}>
                        {p.documentTitle} ({p.version}) - {p.fileName}
                      </option>
                    ))}
                  </optgroup>
                )}
                {otherProjects.length > 0 && (
                  <optgroup label="Otros proyectos">
                    {otherProjects.map((p) => (
                      <option key={p.fileName} value={p.fileName}>
                        {p.documentTitle} ({p.version}) - {p.fileName}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div>
              <label className="text-[10px] font-mono uppercase text-theme-accent font-bold block mb-1">
                Versión Comparada (Después)
              </label>
              <select
                value={targetFileName}
                onChange={(e) => {
                  setTargetFileName(e.target.value);
                  loadTargetProject(e.target.value);
                }}
                className="w-full px-3 py-1.5 rounded-xl bg-theme-surface-subtle border border-theme-accent/50 text-xs text-theme-text font-mono focus:outline-none focus:border-theme-accent"
              >
                {sameProjectVersions.length > 0 && (
                  <optgroup label="Versiones de este proyecto">
                    {sameProjectVersions.map((p) => (
                      <option key={p.fileName} value={p.fileName}>
                        {p.documentTitle} ({p.version}) - {p.fileName}
                      </option>
                    ))}
                  </optgroup>
                )}
                {otherProjects.length > 0 && (
                  <optgroup label="Otros proyectos">
                    {otherProjects.map((p) => (
                      <option key={p.fileName} value={p.fileName}>
                        {p.documentTitle} ({p.version}) - {p.fileName}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Diff Summary Cards */}
        {diffResult && (
          <div className="px-6 py-3 bg-theme-surface-subtle border-b border-theme-border grid grid-cols-3 gap-3 shrink-0">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
              <div className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Agregados</div>
              <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
                +{diffResult.summary.addedNodesCount}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
              <div className="text-[10px] font-mono uppercase text-rose-400 font-bold">Eliminados</div>
              <div className="text-xl font-bold text-rose-400 font-mono mt-0.5">
                -{diffResult.summary.removedNodesCount}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center">
              <div className="text-[10px] font-mono uppercase text-amber-400 font-bold">Modificados</div>
              <div className="text-xl font-bold text-amber-400 font-mono mt-0.5">
                ~{diffResult.summary.modifiedNodesCount}
              </div>
            </div>
          </div>
        )}

        {/* Differences Detailed List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1">
          {isLoadingFiles ? (
            <div className="py-12 text-center text-xs text-theme-text-muted">
              Cargando versiones para comparación...
            </div>
          ) : !diffResult || !diffResult.summary.hasChanges ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-[#10B981]">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-theme-text">Ambas versiones son idénticas</h3>
              <p className="text-xs text-theme-text-muted">
                No se detectaron cambios en las actividades, roles, SLAs o conexiones entre estos dos archivos.
              </p>
            </div>
          ) : (
            diffResult.nodeDiffs.map((diff) => {
              const isAdd = diff.changeType === 'ADDED';
              const isRem = diff.changeType === 'REMOVED';

              const badgeColor = isAdd
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : isRem
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40';

              const Icon = isAdd ? PlusCircle : isRem ? MinusCircle : Edit3;

              return (
                <div
                  key={diff.nodeId}
                  className="p-4 rounded-xl bg-theme-surface-subtle border border-theme-border space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${badgeColor}`}>
                        <Icon className="w-3 h-3" />
                        {diff.changeType}
                      </span>
                      <span className="text-xs font-mono font-bold text-theme-accent">{diff.standardId}</span>
                      <span className="text-xs font-bold text-theme-text">{diff.title}</span>
                    </div>
                  </div>

                  <div className="space-y-1 pl-2 border-l-2 border-theme-border">
                    {diff.changes.map((c, cIdx) => (
                      <div key={cIdx} className="text-xs font-mono flex items-center space-x-2">
                        <span className="text-theme-text-muted font-bold min-w-[80px]">{c.field}:</span>
                        <span className="text-rose-400/80 line-through truncate max-w-[200px]">{c.oldValue || '(vacío)'}</span>
                        <ArrowRight className="w-3 h-3 text-theme-text-muted shrink-0" />
                        <span className="text-emerald-400 font-bold truncate max-w-[200px]">{c.newValue}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-theme-border bg-theme-surface-subtle flex items-center justify-between shrink-0">
          <span className="text-xs font-mono text-theme-text-muted">
            {diffResult?.baseTitle} ({diffResult?.baseVersion}) &rarr; {diffResult?.targetTitle} ({diffResult?.targetVersion})
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-theme-surface hover:bg-theme-surface-hover text-theme-text rounded-lg text-xs font-semibold border border-theme-border transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
