import React, { useState, useRef } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { StorageService } from '../../services/storageService';
import { groupProjectsByProcess } from '../../services/processVersionManager';
import { ProjectCard } from './ProjectCard';
import {
  FolderGit2,
  Plus,
  Search,
  HardDrive,
  RefreshCw,
  FolderOpen,
  Layers,
  Sparkles,
  Upload,
  Globe,
  Database
} from 'lucide-react';
import { DatabaseConfigModal } from './DatabaseConfigModal';
import { useAuthStore } from '../../store/useAuthStore';
import { PermissionService } from '../../services/permissionService';

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
    importProjectFromFile,
    refreshProjectList,
    isLoading
  } = useProjectStore();

  const { currentUser, acquireCanvasLock } = useAuthStore();
  const { setActiveView, showNotification } = useUiStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDbModalOpen, setIsDbModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filter projects by user assignments if the active session is a regular USER
  const assignedFileNames = React.useMemo(() => {
    return PermissionService.getAssignedProjectFileNamesSync(currentUser);
  }, [currentUser]);

  const visibleProjects = React.useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'ADMIN' || assignedFileNames === 'ALL') {
      return projectList;
    }
    return projectList.filter((p) => assignedFileNames.includes(p.fileName));
  }, [projectList, currentUser, assignedFileNames]);

  const processGroups = groupProjectsByProcess(visibleProjects);

  const filteredGroups = processGroups.filter((g) => {
    const term = searchTerm.toLowerCase();
    const matchesGroup =
      g.documentTitle.toLowerCase().includes(term) ||
      g.documentCode.toLowerCase().includes(term) ||
      g.authorName.toLowerCase().includes(term) ||
      g.organizationUnit.toLowerCase().includes(term);

    const matchesAnyFile = g.versions.some((v) =>
      v.fileName.toLowerCase().includes(term) || v.version.toLowerCase().includes(term)
    );

    return matchesGroup || matchesAnyFile;
  });

  const handleOpen = async (fileName: string) => {
    // Acquire canvas lock and check assigned permissions
    const lockResult = await acquireCanvasLock(fileName);
    if (!lockResult.allowed) {
      showNotification(lockResult.message || 'No tienes permisos asignados para acceder a este lienzo.', 'warning');
      return;
    }

    const ok = await openProject(fileName);
    if (ok) {
      setActiveView('CANVAS');
      if (lockResult.message) {
        showNotification(lockResult.message, 'warning');
      } else {
        showNotification(`Proyecto ${fileName} cargado (${lockResult.permission})`, 'info');
      }
    }
  };

  const handleDuplicate = async (fileName: string) => {
    const perm = PermissionService.getUserPermissionForProject(currentUser, fileName);
    if (currentUser?.role !== 'ADMIN' && perm !== 'EDITOR') {
      showNotification('Permiso insuficiente. Solo el Administrador o editores pueden duplicar proyectos.', 'warning');
      return;
    }

    const newName = await duplicateProject(fileName);
    if (newName) {
      showNotification(`Proyecto duplicado como ${newName}`, 'success');
    }
  };

  const handleDelete = async (fileName: string) => {
    const perm = PermissionService.getUserPermissionForProject(currentUser, fileName);
    if (currentUser?.role !== 'ADMIN' && perm !== 'EDITOR') {
      showNotification('Permiso insuficiente. Solo el Administrador o editores pueden eliminar proyectos.', 'warning');
      return;
    }

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
      showNotification('En la Web los proyectos se guardan de forma segura en tu navegador. Puedes pulsar "Importar JSON" para subir procesos o descargarlos desde cada tarjeta.', 'info');
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importProjectFromFile(file);
    if (result.success && result.fileName) {
      showNotification(`✅ Proyecto "${result.fileName}" importado con éxito`, 'success');
      // If desired, open the imported project immediately
      const ok = await openProject(result.fileName);
      if (ok) {
        setActiveView('CANVAS');
      }
    } else {
      showNotification(`❌ Error al importar: ${result.error || 'Archivo inválido'}`, 'error');
    }

    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const isWebEnvironment = !StorageService.isElectron();

  return (
    <div className="flex-1 h-full overflow-y-auto bg-theme-bg p-6 md:p-10 select-none transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-theme-surface border border-theme-border shadow-xl">
          <div>
            <div className="flex items-center flex-wrap gap-2 text-xs font-mono font-semibold uppercase tracking-wider mb-1">
              {StorageService.isNeonConfigured() ? (
                <button
                  onClick={() => setIsDbModalOpen(true)}
                  className="flex items-center space-x-1.5 text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-0.5 rounded-md border border-sky-500/30 transition-colors cursor-pointer"
                  title="Base de datos Neon PostgreSQL conectada. Clic para ver detalles."
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Neon PostgreSQL Cloud &bull; Activo</span>
                </button>
              ) : isWebEnvironment ? (
                <button
                  onClick={() => setIsDbModalOpen(true)}
                  className="flex items-center space-x-1.5 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/20 transition-colors cursor-pointer"
                  title="Entorno Web con persistencia local. Clic para conectar a Neon PostgreSQL."
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Entorno Web &bull; Conectar Base de Datos</span>
                </button>
              ) : (
                <div className="flex items-center space-x-1.5 text-theme-accent bg-theme-accent/10 px-2 py-0.5 rounded-md border border-theme-accent/20">
                  <HardDrive className="w-3.5 h-3.5" />
                  <span>Entorno Portable USB &bull; Ruta relativa: ../Proyectos/</span>
                </div>
              )}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-theme-text tracking-tight">
              Gestor de Proyectos de Procesos
            </h1>
            <p className="text-sm text-theme-text-muted mt-1 max-w-2xl">
              {isWebEnvironment
                ? 'Modelado, visualización y auditoría de procesos BPMN 2.0 e ISO 9001:2015 desde cualquier computador en la nube.'
                : 'Agrupación inteligente de versiones y sincronización multi-equipo (Casa / Trabajo) bajo BPMN 2.0 e ISO 9001:2015.'}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => refreshProjectList()}
              className="p-2.5 rounded-xl bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border border-theme-border transition-colors"
              title="Actualizar listado de archivos"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Hidden File Input for JSON import */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFileInputChange}
            />

            {/* Database Settings button */}
            {currentUser?.role === 'ADMIN' && (
              <>
                <button
                  onClick={() => setIsDbModalOpen(true)}
                  className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border border-theme-border text-sm font-semibold transition-colors hover:border-sky-500/50"
                  title="Configurar y sincronizar base de datos PostgreSQL en Neon"
                >
                  <Database className="w-4 h-4 text-sky-400" />
                  <span>Base de Datos</span>
                </button>

                {/* Import JSON button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border border-theme-border text-sm font-semibold transition-colors hover:border-emerald-500/50"
                  title="Importar un archivo de proyecto .json desde cualquier computador o pendrive"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Importar JSON</span>
                </button>

                <button
                  onClick={handleOpenFolder}
                  className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border border-theme-border text-sm font-semibold transition-colors"
                  title={isWebEnvironment ? "Ver información de almacenamiento web" : "Abrir carpeta física en el Explorador de Windows"}
                >
                  <FolderOpen className="w-4 h-4 text-theme-accent" />
                  <span>{isWebEnvironment ? 'Almacenamiento' : 'Abrir Carpeta'}</span>
                </button>

                <button
                  onClick={onOpenNewModal}
                  className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#3B82F6] hover:brightness-110 text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo Proyecto</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted" />
            <input
              type="text"
              placeholder="Buscar por título, código, autor o archivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-theme-surface border border-theme-border rounded-xl text-xs text-theme-text placeholder-theme-text-muted focus:border-theme-accent outline-none"
            />
          </div>

          <div className="flex items-center space-x-2 text-xs text-theme-text-muted font-mono">
            <Layers className="w-3.5 h-3.5 text-theme-accent" />
            <span>
              {currentUser?.role === 'USER'
                ? `${filteredGroups.length} proceso${filteredGroups.length === 1 ? '' : 's'} asignado${filteredGroups.length === 1 ? '' : 's'}`
                : `${filteredGroups.length} proceso${filteredGroups.length === 1 ? '' : 's'} (${projectList.length} archivo${projectList.length === 1 ? '' : 's'} en disco)`}
            </span>
          </div>
        </div>

        {/* Project Grid */}
        {filteredGroups.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-theme-border rounded-2xl bg-theme-surface/50">
            <FolderGit2 className="w-12 h-12 text-theme-text-muted mx-auto mb-3" />
            <h3 className="text-base font-bold text-theme-text">
              {currentUser?.role === 'USER' ? 'No tienes lienzos de procesos asignados' : 'No se encontraron proyectos'}
            </h3>
            <p className="text-xs text-theme-text-muted mt-1 max-w-md mx-auto">
              {currentUser?.role === 'USER'
                ? 'Actualmente no cuentas con lienzos habilitados para lectura, comentarios o edición. Solicita al Administrador del Sistema la asignación correspondiente de tus procesos.'
                : 'Creá un nuevo proyecto o verificá los archivos JSON en tu almacenamiento.'}
            </p>
            {currentUser?.role === 'ADMIN' && (
              <button
                onClick={onOpenNewModal}
                className="mt-4 px-4 py-2 rounded-lg bg-theme-accent text-white text-xs font-semibold hover:bg-theme-accent-hover inline-flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Crear Primer Proyecto</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGroups.map((group) => (
              <ProjectCard
                key={group.groupKey}
                group={group}
                activeFileName={currentProject?.fileName}
                onOpen={handleOpen}
                onDuplicate={handleDuplicate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Database Connection & Sync Modal */}
        <DatabaseConfigModal
          isOpen={isDbModalOpen}
          onClose={() => setIsDbModalOpen(false)}
        />
      </div>
    </div>
  );
};
