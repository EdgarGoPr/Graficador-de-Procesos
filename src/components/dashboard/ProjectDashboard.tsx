import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { ProjectCard } from './ProjectCard';
import {
  FolderGit2,
  Plus,
  Search,
  HardDrive,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  FileCheck2
} from 'lucide-react';

interface ProjectDashboardProps {
  onOpenNewModal: () => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ onOpenNewModal }) => {
  const {
    projectList,
    currentProject,
    openProject,
    duplicateProject,
    deleteProject,
    refreshProjectList,
    isLoading
  } = useProjectStore();

  const { setActiveView, showNotification } = useUiStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = projectList.filter((p) => {
    const term = searchTerm.toLowerCase();
    return (
      p.documentTitle.toLowerCase().includes(term) ||
      p.documentCode.toLowerCase().includes(term) ||
      p.authorName.toLowerCase().includes(term) ||
      p.fileName.toLowerCase().includes(term)
    );
  });

  const handleOpen = async (fileName: string) => {
    const ok = await openProject(fileName);
    if (ok) {
      setActiveView('CANVAS');
      showNotification(`Proyecto ${fileName} cargado`, 'info');
    }
  };

  const handleDuplicate = async (fileName: string) => {
    const newName = await duplicateProject(fileName);
    if (newName) {
      showNotification(`Proyecto duplicado como ${newName}`, 'success');
    }
  };

  const handleDelete = async (fileName: string) => {
    if (window.confirm(`¿Está seguro de eliminar el archivo "${fileName}" de la carpeta de proyectos?`)) {
      const ok = await deleteProject(fileName);
      if (ok) {
        showNotification(`Archivo ${fileName} eliminado`, 'info');
      }
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-slate-950 p-6 md:p-10 select-none">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-cyan-950/40 border border-slate-800 shadow-2xl">
          <div>
            <div className="flex items-center space-x-2 text-cyan-400 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
              <HardDrive className="w-4 h-4" />
              <span>Entorno Portable USB &bull; Ruta relativa: ../Proyectos/</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-slate-100 tracking-tight">
              Gestor de Proyectos de Procesos
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Modelado estandarizado bajo BPMN 2.0 (ISO 19510), matrices SIPOC y gestión de riesgos conforme a ISO 9001:2015.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => refreshProjectList()}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
              title="Actualizar listado de archivos"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onOpenNewModal}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Proyecto</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por título, código (ej: PRC-TF-001), autor o archivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 outline-none"
            />
          </div>

          <div className="text-xs text-slate-400 font-mono">
            {filteredProjects.length} proyecto{filteredProjects.length === 1 ? '' : 's'} disponible{filteredProjects.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Project Grid */}
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/30">
            <FolderGit2 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-300">No se encontraron proyectos</h3>
            <p className="text-xs text-slate-500 mt-1">
              Creá un nuevo proyecto o verificá los archivos JSON en la carpeta ../Proyectos/.
            </p>
            <button
              onClick={onOpenNewModal}
              className="mt-4 px-4 py-2 rounded-lg bg-cyan-600 text-white text-xs font-semibold hover:bg-cyan-500 inline-flex items-center space-x-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear Primer Proyecto</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.fileName}
                project={project}
                isActive={currentProject?.fileName === project.fileName}
                onOpen={handleOpen}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
