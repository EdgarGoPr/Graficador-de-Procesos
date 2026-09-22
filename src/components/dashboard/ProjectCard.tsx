import React, { useState } from 'react';
import { ProcessGroupSummary, ProjectSummary } from '../../types/project';
import { StorageService } from '../../services/storageService';
import { useUiStore } from '../../store/useUiStore';
import {
  FolderOpen,
  Copy,
  Trash2,
  Clock,
  Layers,
  ShieldCheck,
  Calendar,
  User,
  HardDrive,
  ChevronDown,
  Sparkles,
  GitCommit,
  CheckCircle2,
  FileCode2
} from 'lucide-react';

interface ProjectCardProps {
  group: ProcessGroupSummary;
  activeFileName?: string | null;
  onOpen: (fileName: string) => void;
  onDuplicate: (fileName: string) => void;
  onDelete: (fileName: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  group,
  activeFileName,
  onOpen,
  onDuplicate,
  onDelete
}) => {
  const { showNotification } = useUiStore();
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const latest = group.latestVersion;
  const isCurrentlyActive = group.versions.some(v => v.fileName === activeFileName);

  const formattedLatestDate = new Date(latest.updatedAt).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleRevealLocation = async (e: React.MouseEvent, fileName: string) => {
    e.stopPropagation();
    if (StorageService.isElectron()) {
      await StorageService.openProjectFile(fileName);
      showNotification(`Ubicación abierta: ../Proyectos/${fileName}`, 'info');
    } else {
      const fullProj = await StorageService.loadProject(fileName);
      if (fullProj) {
        StorageService.exportProjectToJsonFile(fullProj);
        showNotification('Archivo JSON descargado a tu PC', 'info');
      }
    }
  };

  return (
    <div
      className={`group relative rounded-2xl bg-theme-surface border transition-all duration-300 p-5 flex flex-col justify-between shadow-xl ${
        isCurrentlyActive
          ? 'border-theme-accent ring-2 ring-theme-accent/25 shadow-2xl'
          : 'border-theme-border hover:border-theme-accent/60 hover:shadow-2xl'
      }`}
    >
      {/* Top Badges & Process Identity */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
            <span className="text-[10px] font-mono font-bold text-theme-accent bg-theme-surface-subtle px-2 py-0.5 rounded-lg border border-theme-border">
              {group.documentCode}
            </span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/30 flex items-center space-x-1">
              <Sparkles className="w-2.5 h-2.5" />
              <span>v{latest.version} (Última)</span>
            </span>
            {group.versionCount > 1 && (
              <span className="text-[10px] font-mono text-theme-text-muted bg-theme-surface-subtle px-1.5 py-0.5 rounded-lg border border-theme-border">
                {group.versionCount} versiones
              </span>
            )}
          </div>

          <button
            onClick={(e) => handleRevealLocation(e, latest.fileName)}
            title="Abrir ubicación en el Explorador de Windows"
            className="flex items-center space-x-1 text-[10px] font-mono text-theme-text-muted hover:text-theme-accent truncate max-w-[130px] transition-colors"
          >
            <HardDrive className="w-3 h-3 shrink-0" />
            <span className="truncate">{latest.fileName}</span>
          </button>
        </div>

        <h3 className="text-base font-bold text-theme-text group-hover:text-theme-accent transition-colors line-clamp-2 leading-snug mb-2">
          {group.documentTitle}
        </h3>

        <div className="space-y-1 text-xs text-theme-text-muted">
          <div className="flex items-center truncate">
            <User className="w-3.5 h-3.5 mr-1.5 text-theme-text-muted shrink-0" />
            <span className="truncate">{group.authorName}</span>
          </div>
          <div className="text-[11px] text-theme-text-muted truncate pl-5">
            {group.organizationUnit}
          </div>
        </div>
      </div>

      {/* Metrics of the Latest Version */}
      <div className="my-4 pt-3 border-t border-theme-border grid grid-cols-3 gap-2 text-center">
        <div className="bg-theme-surface-subtle p-2 rounded-xl border border-theme-border">
          <div className="flex items-center justify-center text-theme-text-muted mb-0.5">
            <Layers className="w-3 h-3 mr-1" />
            <span className="text-[10px]">Nodos</span>
          </div>
          <span className="text-xs font-bold text-theme-text font-mono">
            {latest.nodeCount}
          </span>
        </div>

        <div className="bg-theme-surface-subtle p-2 rounded-xl border border-theme-border">
          <div className="flex items-center justify-center text-[#F59E0B] mb-0.5">
            <Clock className="w-3 h-3 mr-1" />
            <span className="text-[10px]">Lead Time</span>
          </div>
          <span className="text-xs font-bold text-[#F59E0B] font-mono">
            {latest.totalLeadTimeBusinessDays > 0 ? `${latest.totalLeadTimeBusinessDays}d háb.` : `${latest.totalLeadTimeHours}h`}
          </span>
        </div>

        <div className="bg-theme-surface-subtle p-2 rounded-xl border border-theme-border">
          <div className="flex items-center justify-center text-[#10B981] mb-0.5">
            <ShieldCheck className="w-3 h-3 mr-1" />
            <span className="text-[10px]">ISO 9001</span>
          </div>
          <span className="text-xs font-bold text-[#10B981] font-mono">
            {latest.checkpointCount} QC / {latest.riskCount} Rsk
          </span>
        </div>
      </div>

      {/* Version History Accordion if multiple versions exist */}
      {group.versionCount > 1 && (
        <div className="mb-3 border border-theme-border/70 rounded-xl overflow-hidden bg-theme-surface-subtle/50">
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-theme-text-muted hover:text-theme-text hover:bg-theme-surface-subtle transition-colors"
          >
            <div className="flex items-center space-x-1.5">
              <GitCommit className="w-3.5 h-3.5 text-theme-accent" />
              <span>Historial de versiones y copias ({group.versionCount})</span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isHistoryOpen ? 'rotate-180' : ''}`} />
          </button>

          {isHistoryOpen && (
            <div className="p-2 space-y-1.5 border-t border-theme-border/70 max-h-48 overflow-y-auto">
              {group.versions.map((ver, idx) => {
                const isLatest = idx === 0;
                const isVerActive = activeFileName === ver.fileName;
                const verDate = new Date(ver.updatedAt).toLocaleDateString('es-AR', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });

                return (
                  <div
                    key={ver.fileName}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs transition-colors ${
                      isVerActive
                        ? 'bg-theme-accent/15 border border-theme-accent/40'
                        : 'bg-theme-surface hover:bg-theme-surface-subtle border border-theme-border/50'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center space-x-1.5 font-medium text-theme-text">
                        <span className="font-mono font-bold text-theme-accent">v{ver.version}</span>
                        {isLatest && (
                          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1 py-0.2 rounded">
                            MÁS RECIENTE
                          </span>
                        )}
                        <span className="text-[10px] text-theme-text-muted truncate">({verDate})</span>
                      </div>
                      <div className="text-[10px] text-theme-text-muted font-mono truncate" title={ver.fileName}>
                        {ver.fileName}
                      </div>
                    </div>

                    <div className="flex items-center space-x-1 shrink-0">
                      <button
                        onClick={(e) => handleRevealLocation(e, ver.fileName)}
                        title="Ver archivo en disco"
                        className="p-1 rounded text-theme-text-muted hover:text-theme-accent hover:bg-theme-surface transition-colors"
                      >
                        <HardDrive className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDuplicate(ver.fileName)}
                        title="Duplicar esta versión"
                        className="p-1 rounded text-theme-text-muted hover:text-theme-text hover:bg-theme-surface transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onDelete(ver.fileName)}
                        title="Eliminar este archivo"
                        className="p-1 rounded text-theme-text-muted hover:text-[#EF4444] hover:bg-[#EF4444]/15 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => onOpen(ver.fileName)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                          isLatest
                            ? 'bg-theme-accent text-white hover:bg-theme-accent-hover'
                            : 'bg-theme-surface-subtle text-theme-text hover:bg-theme-surface border border-theme-border'
                        }`}
                      >
                        Cargar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Footer & Primary Actions */}
      <div className="pt-2 border-t border-theme-border flex items-center justify-between">
        <div className="flex items-center text-[10px] text-theme-text-muted font-mono">
          <Calendar className="w-3 h-3 mr-1 text-theme-text-muted" />
          <span>{formattedLatestDate}</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={(e) => handleRevealLocation(e, latest.fileName)}
            title="Ver archivo en carpeta / disco"
            className="p-1.5 rounded-lg bg-theme-surface-subtle hover:bg-theme-surface border border-theme-border text-theme-text-muted hover:text-theme-accent transition-colors"
          >
            <HardDrive className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDuplicate(latest.fileName)}
            title="Duplicar proyecto"
            className="p-1.5 rounded-lg bg-theme-surface-subtle hover:bg-theme-surface border border-theme-border text-theme-text transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(latest.fileName)}
            title="Eliminar proyecto de disco USB"
            className="p-1.5 rounded-lg bg-theme-surface-subtle hover:bg-[#EF4444]/15 border border-theme-border text-theme-text-muted hover:text-[#EF4444] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onOpen(latest.fileName)}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-theme-accent to-blue-600 hover:brightness-110 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-105"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>{group.versionCount > 1 ? 'Abrir Última Versión' : 'Abrir'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
