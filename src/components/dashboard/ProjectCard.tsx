import React from 'react';
import { ProjectSummary } from '../../types/project';
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
  HardDrive
} from 'lucide-react';

interface ProjectCardProps {
  project: ProjectSummary;
  isActive: boolean;
  onOpen: (fileName: string) => void;
  onDuplicate: (fileName: string) => void;
  onDelete: (fileName: string) => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  isActive,
  onOpen,
  onDuplicate,
  onDelete
}) => {
  const { showNotification } = useUiStore();

  const formattedDate = new Date(project.updatedAt).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const handleRevealLocation = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (StorageService.isElectron()) {
      await StorageService.openProjectFile(project.fileName);
      showNotification(`Ubicación abierta: ../Proyectos/${project.fileName}`, 'info');
    } else {
      const fullProj = await StorageService.loadProject(project.fileName);
      if (fullProj) {
        StorageService.exportProjectToJsonFile(fullProj);
        showNotification('Archivo JSON descargado a tu PC', 'info');
      }
    }
  };

  return (
    <div
      className={`group relative rounded-xl bg-theme-surface border transition-all duration-200 p-5 flex flex-col justify-between shadow-xl ${
        isActive
          ? 'border-theme-accent ring-2 ring-theme-accent/25 shadow-lg'
          : 'border-theme-border hover:border-theme-accent/60 hover:shadow-2xl'
      }`}
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold text-theme-accent bg-theme-surface-subtle px-2 py-0.5 rounded border border-theme-border">
            {project.documentCode} &bull; {project.version}
          </span>
          <button
            onClick={handleRevealLocation}
            title="Abrir ubicación en el Explorador de Windows"
            className="flex items-center space-x-1 text-[10px] font-mono text-theme-text-muted hover:text-theme-accent truncate max-w-[150px] transition-colors"
          >
            <HardDrive className="w-3 h-3 shrink-0" />
            <span className="truncate">{project.fileName}</span>
          </button>
        </div>

        <h3 className="text-sm font-bold text-theme-text group-hover:text-theme-accent transition-colors line-clamp-2 leading-snug mb-2">
          {project.documentTitle}
        </h3>

        <div className="space-y-1 text-xs text-theme-text-muted">
          <div className="flex items-center truncate">
            <User className="w-3.5 h-3.5 mr-1.5 text-theme-text-muted shrink-0" />
            <span className="truncate">{project.authorName}</span>
          </div>
          <div className="text-[11px] text-theme-text-muted truncate pl-5">
            {project.organizationUnit}
          </div>
        </div>
      </div>

      {/* Metrics Badges */}
      <div className="my-4 pt-3 border-t border-theme-border grid grid-cols-3 gap-2 text-center">
        <div className="bg-theme-surface-subtle p-2 rounded-lg border border-theme-border">
          <div className="flex items-center justify-center text-theme-text-muted mb-0.5">
            <Layers className="w-3 h-3 mr-1" />
            <span className="text-[10px]">Nodos</span>
          </div>
          <span className="text-xs font-bold text-theme-text font-mono">
            {project.nodeCount}
          </span>
        </div>

        <div className="bg-theme-surface-subtle p-2 rounded-lg border border-theme-border">
          <div className="flex items-center justify-center text-[#F59E0B] mb-0.5">
            <Clock className="w-3 h-3 mr-1" />
            <span className="text-[10px]">Lead Time</span>
          </div>
          <span className="text-xs font-bold text-[#F59E0B] font-mono">
            {project.totalLeadTimeBusinessDays > 0 ? `${project.totalLeadTimeBusinessDays}d háb.` : `${project.totalLeadTimeHours}h`}
          </span>
        </div>

        <div className="bg-theme-surface-subtle p-2 rounded-lg border border-theme-border">
          <div className="flex items-center justify-center text-[#10B981] mb-0.5">
            <ShieldCheck className="w-3 h-3 mr-1" />
            <span className="text-[10px]">ISO 9001</span>
          </div>
          <span className="text-xs font-bold text-[#10B981] font-mono">
            {project.checkpointCount} QC / {project.riskCount} Rsk
          </span>
        </div>
      </div>

      {/* Footer & Actions */}
      <div className="pt-2 border-t border-theme-border flex items-center justify-between">
        <div className="flex items-center text-[10px] text-theme-text-muted font-mono">
          <Calendar className="w-3 h-3 mr-1 text-theme-text-muted" />
          <span>{formattedDate}</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={handleRevealLocation}
            title="Ver archivo en carpeta / disco"
            className="p-1.5 rounded-lg bg-theme-surface-subtle hover:bg-theme-surface border border-theme-border text-theme-text-muted hover:text-theme-accent transition-colors"
          >
            <HardDrive className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDuplicate(project.fileName)}
            title="Duplicar proyecto"
            className="p-1.5 rounded-lg bg-theme-surface-subtle hover:bg-theme-surface border border-theme-border text-theme-text transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(project.fileName)}
            title="Eliminar proyecto de disco USB"
            className="p-1.5 rounded-lg bg-theme-surface-subtle hover:bg-[#EF4444]/15 border border-theme-border text-theme-text-muted hover:text-[#EF4444] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onOpen(project.fileName)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-theme-accent hover:bg-theme-accent-hover text-white text-xs font-semibold shadow-md transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Abrir</span>
          </button>
        </div>
      </div>
    </div>
  );
};


