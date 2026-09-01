import React, { useState } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { StorageService } from '../../services/storageService';
import { ProjectCard } from './ProjectCard';
import {
  FolderGit2,
  Plus,
  Search,
  HardDrive,
  RefreshCw,
  FolderOpen
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

  const handleOpenFolder = async () => {
    if (StorageService.isElectron()) {
      await StorageService.openProjectsFolder();
      showNotification('Carpeta de proyectos abierta en el Explorador de Windows', 'info');
    } else {
      showNotification('En la Web los proyectos están en el navegador. Usa la app portable (.exe) para interactuar directamente con carpetas de Windows.', 'info');
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-theme-bg p-6 md:p-10 select-none transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-theme-surface border border-theme-border shadow-xl">
          <div>
            <div className="flex items-center space-x-2 text-theme-accent text-xs font-mono font-semibold uppercase tracking-wider mb-1">
              <HardDrive className="w-4 h-4" />
              <span>Entorno Portable USB &bull; Ruta relativa: ../Proyectos/</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-theme-text tracking-tight">
              Gestor de Proyectos de Procesos
            </h1>
            <p className="text-sm text-theme-text-muted mt-1 max-w-2xl">
              Modelado estandarizado bajo BPMN 2.0 (ISO 19510), matrices SIPOC y gestión de riesgos conforme a ISO 9001:2015.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => refreshProjectList()}
              className="p-2.5 rounded-xl bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border border-theme-border transition-colors"
              title="Actualizar listado de archivos"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleOpenFolder}
              className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border border-theme-border text-sm font-semibold transition-colors"
              title="Abrir carpeta física en el Explorador de Windows"
            >
              <FolderOpen className="w-4 h-4 text-theme-accent" />
              <span>Abrir Carpeta</span>
            </button>
            <button
              onClick={onOpenNewModal}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#3B82F6] hover:brightness-110 text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Proyecto</span>
            </button>
          </div>
        </div>


        {/* Search & Filter Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted" />
            <input
              type="text"
              placeholder="Buscar por título, código (ej: PRC-TF-001), autor o archivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-theme-surface border border-theme-border rounded-xl text-xs text-theme-text placeholder-theme-text-muted focus:border-theme-accent outline-none"
            />
          </div>

          <div className="text-xs text-theme-text-muted font-mono">
            {filteredProjects.length} proyecto{filteredProjects.length === 1 ? '' : 's'} disponible{filteredProjects.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Project Grid */}
        {filteredProjects.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-theme-border rounded-2xl bg-theme-surface/50">
            <FolderGit2 className="w-12 h-12 text-theme-text-muted mx-auto mb-3" />
            <h3 className="text-base font-bold text-theme-text">No se encontraron proyectos</h3>
            <p className="text-xs text-theme-text-muted mt-1">
              Creá un nuevo proyecto o verificá los archivos JSON en la carpeta ../Proyectos/.
            </p>
            <button
              onClick={onOpenNewModal}
              className="mt-4 px-4 py-2 rounded-lg bg-theme-accent text-white text-xs font-semibold hover:bg-theme-accent-hover inline-flex items-center space-x-1.5"
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

