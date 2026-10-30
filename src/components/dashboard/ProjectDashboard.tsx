import React, { useState, useRef } from 'react';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { StorageService } from '../../services/storageService';
import { groupProjectsByProcess } from '../../services/processVersionManager';
import { ProcessGroupSummary } from '../../types/project';
import { ProjectCard } from './ProjectCard';
import { FolderGit2, Plus, Search, RefreshCw, Layers, Upload } from 'lucide-react';
import { ProjectParticipantsModal } from '../modals/ProjectParticipantsModal';
import { EditProjectModal } from '../modals/EditProjectModal';
import { useAuthStore } from '../../store/useAuthStore';
import { PermissionService } from '../../services/permissionService';
import { hasUserModuleAccess } from '../../types/auth';

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
  const [selectedGroupForParticipants, setSelectedGroupForParticipants] = useState<ProcessGroupSummary | null>(null);
  const [isParticipantsModalOpen, setIsParticipantsModalOpen] = useState(false);
  const [selectedGroupForEdit, setSelectedGroupForEdit] = useState<ProcessGroupSummary | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
    return projectList.filter((p) => {
      if (assignedFileNames.includes(p.fileName)) return true;
      if (p.createdByUserId && p.createdByUserId === currentUser.id) return true;
      if (p.createdByEmail && currentUser.email && p.createdByEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
      if (p.authorName && currentUser.fullName && p.authorName.trim().toLowerCase() === currentUser.fullName.trim().toLowerCase()) return true;
      return false;
    });
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
    const summary = projectList.find(p => p.fileName === fileName);
    // Acquire canvas lock and check assigned permissions
    const lockResult = await acquireCanvasLock(fileName, summary);
    if (!lockResult.allowed) {
      showNotification(lockResult.message || 'No tienes permisos asignados para acceder a este lienzo.', 'warning');
      return;
    }

    const ok = await openProject(fileName);
    if (ok) {
      if (hasUserModuleAccess(currentUser, 'CANVAS')) {
        setActiveView('CANVAS');
      } else if (hasUserModuleAccess(currentUser, 'VIEW_REPORT')) {
        setActiveView('REPORT');
      } else if (hasUserModuleAccess(currentUser, 'VIEW_FLOWCHART')) {
        setActiveView('FLOWCHART');
      } else if (hasUserModuleAccess(currentUser, 'VIEW_SIPOC')) {
        setActiveView('SIPOC');
      } else if (hasUserModuleAccess(currentUser, 'VIEW_RACI')) {
        setActiveView('RACI');
      }
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

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importProjectFromFile(file);
    if (result.success && result.fileName) {
      showNotification(`✅ Proyecto "${result.fileName}" importado con éxito`, 'success');
      // If desired, open the imported project immediately
      const ok = await openProject(result.fileName);
      if (ok) {
        if (hasUserModuleAccess(currentUser, 'CANVAS')) {
          setActiveView('CANVAS');
        } else if (hasUserModuleAccess(currentUser, 'VIEW_REPORT')) {
          setActiveView('REPORT');
        }
      }
    } else {
      showNotification(`❌ Error al importar: ${result.error || 'Archivo inválido'}`, 'error');
    }

    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  return (
    <div className="flex-1 h-full overflow-y-auto bg-theme-bg p-6 md:p-10 select-none transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-theme-surface border border-theme-border shadow-xl">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-theme-text tracking-tight">
              Gestor de Proyectos de Procesos
            </h1>
            <p className="text-sm text-theme-text-muted mt-1 max-w-2xl">
              Modelado, visualización y auditoría de procesos BPMN 2.0 e ISO 9001:2015.
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

            {/* Import JSON button */}
            {currentUser && hasUserModuleAccess(currentUser, 'CREATE_PROJECTS') && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-2 px-3.5 py-2.5 rounded-xl bg-theme-surface-subtle hover:bg-theme-surface text-theme-text border border-theme-border text-sm font-semibold transition-colors hover:border-emerald-500/50"
                title="Importar un archivo de proyecto .json"
              >
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Importar JSON</span>
              </button>
            )}

            {currentUser && hasUserModuleAccess(currentUser, 'CREATE_PROJECTS') && (
              <button
                onClick={onOpenNewModal}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#0284C7] to-[#3B82F6] hover:brightness-110 text-white text-sm font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Proyecto</span>
              </button>
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
                ? `${filteredGroups.length} proceso${filteredGroups.length === 1 ? '' : 's'} disponible${filteredGroups.length === 1 ? '' : 's'}`
                : `${filteredGroups.length} proceso${filteredGroups.length === 1 ? '' : 's'} (${projectList.length} archivo${projectList.length === 1 ? '' : 's'} en disco)`}
            </span>
          </div>
        </div>

        {/* Project Grid */}
        {filteredGroups.length === 0 ? (
          <div className="p-12 text-center border-2 border-dashed border-theme-border rounded-2xl bg-theme-surface/50">
            <FolderGit2 className="w-12 h-12 text-theme-text-muted mx-auto mb-3" />
            <h3 className="text-base font-bold text-theme-text">
              {currentUser?.role === 'USER' ? 'No tienes lienzos de procesos asignados o creados' : 'No se encontraron proyectos'}
            </h3>
            <p className="text-xs text-theme-text-muted mt-1 max-w-md mx-auto">
              {currentUser?.role === 'USER'
                ? 'Puedes crear un nuevo proyecto propio con el botón inferior o solicitar al Administrador la asignación de lienzos existentes.'
                : 'Creá un nuevo proyecto o verificá los archivos JSON en tu almacenamiento.'}
            </p>
            {currentUser && hasUserModuleAccess(currentUser, 'CREATE_PROJECTS') && (
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
                onManageParticipants={(grp) => {
                  setSelectedGroupForParticipants(grp);
                  setIsParticipantsModalOpen(true);
                }}
                onEditMetadata={(grp) => {
                  setSelectedGroupForEdit(grp);
                  setIsEditModalOpen(true);
                }}
              />
            ))}
          </div>
        )}

        {/* Project Participants and Permissions Modal */}
        <ProjectParticipantsModal
          isOpen={isParticipantsModalOpen}
          onClose={() => {
            setIsParticipantsModalOpen(false);
            setSelectedGroupForParticipants(null);
          }}
          project={
            selectedGroupForParticipants
              ? {
                  fileName: selectedGroupForParticipants.latestVersion.fileName,
                  documentTitle: selectedGroupForParticipants.documentTitle,
                  documentCode: selectedGroupForParticipants.documentCode,
                  version: selectedGroupForParticipants.latestVersion.version,
                  authorName: selectedGroupForParticipants.authorName,
                  organizationUnit: selectedGroupForParticipants.organizationUnit,
                  createdByEmail: selectedGroupForParticipants.createdByEmail,
                  createdByUserId: selectedGroupForParticipants.createdByUserId
                }
              : null
          }
        />

        {/* Edit Project Metadata Modal */}
        <EditProjectModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedGroupForEdit(null);
          }}
          project={
            selectedGroupForEdit
              ? {
                  fileName: selectedGroupForEdit.latestVersion.fileName,
                  documentTitle: selectedGroupForEdit.documentTitle,
                  documentCode: selectedGroupForEdit.documentCode,
                  authorName: selectedGroupForEdit.authorName,
                  organizationUnit: selectedGroupForEdit.organizationUnit,
                  createdByEmail: selectedGroupForEdit.createdByEmail,
                  createdByUserId: selectedGroupForEdit.createdByUserId
                }
              : null
          }
        />
      </div>
    </div>
  );
};
