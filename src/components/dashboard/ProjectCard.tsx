import React from 'react';
import { ProjectSummary } from '../../types/project';
import {
  FolderOpen,
  Copy,
  Trash2,
  Clock,
  Layers,
  AlertTriangle,
  ShieldCheck,
  Calendar,
  User,
  FileCode
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
  const formattedDate = new Date(project.updatedAt).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div
      className={`group relative rounded-xl bg-slate-900/90 border transition-all duration-200 p-5 flex flex-col justify-between shadow-xl ${
        isActive
          ? 'border-cyan-400 ring-2 ring-cyan-500/20 shadow-cyan-500/10'
          : 'border-slate-800 hover:border-slate-700 hover:shadow-2xl'
      }`}
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
            {project.documentCode} &bull; {project.version}
          </span>
          <span className="text-[10px] font-mono text-slate-400 truncate max-w-[150px]">
            {project.fileName}
          </span>
        </div>

        <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug mb-2">
          {project.documentTitle}
        </h3>

        <div className="space-y-1 text-xs text-slate-400">
          <div className="flex items-center truncate">
            <User className="w-3.5 h-3.5 mr-1.5 text-slate-400 shrink-0" />
            <span className="truncate">{project.authorName}</span>
          </div>
          <div className="text-[11px] text-slate-400 truncate pl-5">
            {project.organizationUnit}
          </div>
        </div>
      </div>

      {/* Metrics Badges */}
      <div className="my-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center">
        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
          <div className="flex items-center justify-center text-slate-400 mb-0.5">
            <Layers className="w-3 h-3 mr-1" />
            <span className="text-[10px]">Nodos</span>
          </div>
          <span className="text-xs font-bold text-slate-200 font-mono">
            {project.nodeCount}
          </span>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
          <div className="flex items-center justify-center text-amber-400 mb-0.5">
            <Clock className="w-3 h-3 mr-1" />
            <span className="text-[10px]">Lead Time</span>
          </div>
          <span className="text-xs font-bold text-amber-300 font-mono">
            {project.totalLeadTimeBusinessDays > 0 ? `${project.totalLeadTimeBusinessDays}d háb.` : `${project.totalLeadTimeHours}h`}
          </span>
        </div>

        <div className="bg-slate-950/60 p-2 rounded-lg border border-slate-800">
          <div className="flex items-center justify-center text-pink-400 mb-0.5">
            <ShieldCheck className="w-3 h-3 mr-1" />
            <span className="text-[10px]">ISO 9001</span>
          </div>
          <span className="text-xs font-bold text-pink-300 font-mono">
            {project.checkpointCount} QC / {project.riskCount} Rsk
          </span>
        </div>
      </div>

      {/* Footer & Actions */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center text-[10px] text-slate-400 font-mono">
          <Calendar className="w-3 h-3 mr-1 text-slate-400" />
          <span>{formattedDate}</span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => onDuplicate(project.fileName)}
            title="Duplicar proyecto"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(project.fileName)}
            title="Eliminar proyecto de disco USB"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onOpen(project.fileName)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-colors"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Abrir</span>
          </button>
        </div>
      </div>
    </div>
  );
};
