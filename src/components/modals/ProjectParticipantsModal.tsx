import React, { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { PermissionService } from '../../services/permissionService';
import { AuthService } from '../../services/authService';
import { MasterCatalogsService } from '../../services/masterCatalogsService';
import { AppUser, CanvasPermission } from '../../types/auth';
import {
  Users,
  UserPlus,
  Shield,
  Crown,
  Eye,
  MessageSquare,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Search,
  RefreshCw,
  FolderGit2,
  Building2
} from 'lucide-react';

export interface ProjectForParticipants {
  fileName: string;
  documentTitle?: string;
  documentCode?: string;
  version?: string;
  authorName?: string;
  createdByEmail?: string;
  createdByUserId?: string;
  organizationUnit?: string;
}

interface ProjectParticipantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectForParticipants | null;
}

export const ProjectParticipantsModal: React.FC<ProjectParticipantsModalProps> = ({
  isOpen,
  onClose,
  project
}) => {
  const { currentUser } = useAuthStore();
  const { showNotification } = useUiStore();

  const [participants, setParticipants] = useState<
    Array<{
      id: string;
      userId: string;
      fullName: string;
      email: string;
      organizationUnit: string;
      permissionLevel: CanvasPermission;
      assignedAt: string;
    }>
  >([]);
  const [allUsers, setAllUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form states for adding participant
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<CanvasPermission>('READ_ONLY');
  const [selectedOrgUnitForBulk, setSelectedOrgUnitForBulk] = useState('');
  const [selectedBulkLevel, setSelectedBulkLevel] = useState<CanvasPermission>('READ_ONLY');
  const [userSearchFilter, setUserSearchFilter] = useState('');
  const [participantSearchFilter, setParticipantSearchFilter] = useState('');

  const availableOrgUnits = useMemo(() => {
    const fromCatalog = MasterCatalogsService.getCatalogsSync().orgUnits.map(u => u.name);
    const fromUsers = allUsers.map(u => u.organizationUnit).filter(Boolean);
    return Array.from(new Set([...fromCatalog, ...fromUsers]));
  }, [allUsers]);

  const canManage = useMemo(() => {
    return PermissionService.canUserManageProjectParticipants(currentUser, project);
  }, [currentUser, project]);

  const isCreator = useMemo(() => {
    if (!currentUser || !project) return false;
    if (project.createdByUserId && project.createdByUserId === currentUser.id) return true;
    if (project.createdByEmail && currentUser.email && project.createdByEmail.toLowerCase() === currentUser.email.toLowerCase()) return true;
    if (project.authorName && currentUser.fullName && project.authorName.trim().toLowerCase() === currentUser.fullName.trim().toLowerCase()) return true;
    return false;
  }, [currentUser, project]);

  const loadData = async () => {
    if (!project) return;
    setIsLoading(true);
    try {
      const [parts, users] = await Promise.all([
        PermissionService.listProjectParticipants(project.fileName),
        AuthService.listUsers()
      ]);
      setParticipants(parts);
      setAllUsers(users);
    } catch (err: any) {
      console.error('Error al cargar participantes y usuarios:', err);
      showNotification('Error al cargar la lista de participantes', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && project) {
      loadData();
      setSelectedUserId('');
      setUserSearchFilter('');
      setParticipantSearchFilter('');
    }
  }, [isOpen, project?.fileName]);

  if (!isOpen || !project) return null;

  // Available users to add (active and not yet assigned to this project)
  const availableUsersToAdd = allUsers.filter(u => {
    if (u.status !== 'ACTIVE') return false;
    const isAlreadyParticipant = participants.some(p => p.userId === u.id);
    return !isAlreadyParticipant;
  });

  const filteredAvailableUsers = availableUsersToAdd.filter(u => {
    const term = userSearchFilter.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.organizationUnit && u.organizationUnit.toLowerCase().includes(term))
    );
  });

  const filteredParticipants = participants.filter(p => {
    const term = participantSearchFilter.toLowerCase();
    return (
      p.fullName.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term) ||
      p.organizationUnit.toLowerCase().includes(term)
    );
  });

  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !project || !selectedUserId) return;

    if (!canManage) {
      showNotification('No tienes autorización para gestionar participantes en este proyecto.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await PermissionService.assignPermission(
        currentUser,
        selectedUserId,
        project.fileName,
        selectedLevel,
        project
      );

      if (res.ok) {
        showNotification('Participante asignado exitosamente al proyecto', 'success');
        setSelectedUserId('');
        setUserSearchFilter('');
        await loadData();
      } else {
        showNotification(res.error || 'Error al asignar participante', 'error');
      }
    } catch (err: any) {
      showNotification(err?.message || 'Error inesperado al asignar participante', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateLevel = async (targetUserId: string, newLevel: CanvasPermission) => {
    if (!currentUser || !project) return;

    if (!canManage) {
      showNotification('No tienes autorización para modificar permisos.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await PermissionService.assignPermission(
        currentUser,
        targetUserId,
        project.fileName,
        newLevel,
        project
      );

      if (res.ok) {
        showNotification('Nivel de permiso actualizado', 'success');
        await loadData();
      } else {
        showNotification(res.error || 'Error al actualizar permiso', 'error');
      }
    } catch (err: any) {
      showNotification(err?.message || 'Error inesperado', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveParticipant = async (targetUserId: string, participantName: string) => {
    if (!currentUser || !project) return;

    if (!canManage) {
      showNotification('No tienes autorización para remover participantes.', 'error');
      return;
    }

    if (!window.confirm(`¿Estás seguro de revocar el acceso de ${participantName} a este proyecto?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await PermissionService.removePermission(
        currentUser,
        targetUserId,
        project.fileName,
        project
      );

      if (res.ok) {
        showNotification(`Permiso revocado para ${participantName}`, 'info');
        await loadData();
      } else {
        showNotification(res.error || 'Error al revocar permiso', 'error');
      }
    } catch (err: any) {
      showNotification(err?.message || 'Error inesperado al revocar permiso', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fadeIn select-none">
      <div className="w-full max-w-3xl bg-theme-surface border border-theme-border rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-theme-surface-subtle border-b border-theme-border flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-theme-accent/15 border border-theme-accent/30 text-theme-accent">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-theme-text">
                  Participantes & Permisos del Proyecto
                </h3>
                {currentUser?.role === 'ADMIN' ? (
                  <span className="text-[10px] font-mono font-bold text-theme-accent bg-theme-accent/10 px-2 py-0.5 rounded-md border border-theme-accent/30 flex items-center space-x-1">
                    <Shield className="w-3 h-3" />
                    <span>Administrador</span>
                  </span>
                ) : isCreator ? (
                  <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/30 flex items-center space-x-1">
                    <Crown className="w-3 h-3" />
                    <span>Creador del Proyecto</span>
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-theme-text-muted mt-0.5 flex items-center space-x-1.5 font-mono">
                <span className="font-bold text-theme-accent">{project.documentCode || 'PRC'}</span>
                <span>&bull;</span>
                <span className="text-theme-text truncate max-w-xs">{project.documentTitle || project.fileName}</span>
                {project.version && (
                  <>
                    <span>&bull;</span>
                    <span className="text-emerald-400">v{project.version}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={loadData}
              disabled={isLoading}
              title="Refrescar participantes"
              className="p-2 rounded-lg bg-theme-surface hover:bg-theme-surface-hover border border-theme-border text-theme-text-muted hover:text-theme-accent transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-theme-surface-hover text-theme-text-muted hover:text-theme-text transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Creator Information Card */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-theme-surface-subtle to-theme-surface border border-theme-border/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                <Crown className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-[10px] uppercase font-mono font-bold text-amber-400">
                    Propietario / Autor Inicial
                  </span>
                  <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono font-semibold">
                    Acceso Total
                  </span>
                </div>
                <p className="text-xs font-bold text-theme-text mt-0.5">
                  {project.authorName || 'Autor del Proyecto'}
                </p>
                <div className="text-[11px] text-theme-text-muted font-mono flex items-center space-x-2">
                  <span>{project.organizationUnit || 'Unidad Organizativa'}</span>
                  {project.createdByEmail && (
                    <>
                      <span>&bull;</span>
                      <span className="text-sky-400">{project.createdByEmail}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-mono text-theme-text-muted">Archivo físico</span>
              <p className="text-[11px] font-mono text-theme-accent truncate max-w-[200px]" title={project.fileName}>
                {project.fileName}
              </p>
            </div>
          </div>

          {/* Form to Assign New Participant */}
          {canManage ? (
            <div className="p-4 rounded-xl bg-theme-surface-subtle border border-theme-border space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-theme-accent" />
                  <h4 className="text-xs font-bold text-theme-text uppercase tracking-wider">
                    Asignar Nuevo Participante
                  </h4>
                </div>
                <span className="text-[10px] text-theme-text-muted">
                  {availableUsersToAdd.length} usuario{availableUsersToAdd.length === 1 ? '' : 's'} disponible{availableUsersToAdd.length === 1 ? '' : 's'} para vincular
                </span>
              </div>

              <form onSubmit={handleAddParticipant} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                {/* User Selector with Search */}
                <div className="md:col-span-6 space-y-1">
                  <label className="text-[11px] font-semibold text-theme-text-muted">
                    Seleccionar Usuario
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    required
                    disabled={isSubmitting || availableUsersToAdd.length === 0}
                    className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-xs text-theme-text focus:border-theme-accent outline-none"
                  >
                    <option value="">-- Elegir un usuario registrado --</option>
                    {availableUsersToAdd.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.fullName} ({u.email}) - {u.organizationUnit || u.role}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Permission Level Selector */}
                <div className="md:col-span-4 space-y-1">
                  <label className="text-[11px] font-semibold text-theme-text-muted">
                    Nivel de Permiso
                  </label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value as CanvasPermission)}
                    disabled={isSubmitting}
                    className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-2 text-xs text-theme-text focus:border-theme-accent outline-none font-semibold"
                  >
                    <option value="READ_ONLY">👁️ Solo Lectura (Inspección & Exportación)</option>
                    <option value="COMMENTS">💬 Comentarios (Añadir notas sin editar flujo)</option>
                    <option value="EDITOR">✏️ Editor (Modificar nodos y guardar)</option>
                  </select>
                </div>

                {/* Submit Button */}
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedUserId}
                    className="w-full py-2 px-3 rounded-lg bg-theme-accent hover:bg-theme-accent-hover text-white font-bold text-xs transition-all shadow-md shadow-theme-accent/20 flex items-center justify-center space-x-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Asignar</span>
                  </button>
                </div>
              </form>

              {/* Bulk Assignment by Organization Unit (PST-085) */}
              <div className="pt-3 border-t border-theme-border/80">
                <div className="flex items-center space-x-2 mb-2">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[11px] font-bold text-theme-text uppercase tracking-wider">
                    Asignación Masiva por Unidad Organizativa / Área
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-6">
                    <select
                      value={selectedOrgUnitForBulk}
                      onChange={(e) => setSelectedOrgUnitForBulk(e.target.value)}
                      className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-text focus:border-theme-accent outline-none"
                    >
                      <option value="">-- Seleccionar Unidad Organizativa completa --</option>
                      {availableOrgUnits.map((uo) => (
                        <option key={uo} value={uo}>
                          🏢 {uo}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-4">
                    <select
                      value={selectedBulkLevel}
                      onChange={(e) => setSelectedBulkLevel(e.target.value as CanvasPermission)}
                      className="w-full bg-theme-surface border border-theme-border rounded-lg px-3 py-1.5 text-xs text-theme-text focus:border-theme-accent outline-none font-semibold"
                    >
                      <option value="READ_ONLY">👁️ Solo Lectura para el Área</option>
                      <option value="COMMENTS">💬 Comentarios para el Área</option>
                      <option value="EDITOR">✏️ Editor para el Área</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <button
                      type="button"
                      disabled={isSubmitting || !selectedOrgUnitForBulk}
                      onClick={async () => {
                        if (!currentUser || !project || !selectedOrgUnitForBulk) return;
                        setIsSubmitting(true);
                        const res = await PermissionService.assignPermissionByOrganizationUnit(
                          currentUser,
                          selectedOrgUnitForBulk,
                          project.fileName,
                          selectedBulkLevel,
                          allUsers,
                          project
                        );
                        setIsSubmitting(false);
                        if (res.ok) {
                          showNotification(`Permiso asignado a ${res.count} usuario(s) de "${selectedOrgUnitForBulk}"`, 'success');
                          setSelectedOrgUnitForBulk('');
                          await loadData();
                        } else {
                          showNotification(res.error || 'No se encontraron usuarios en el área seleccionada', 'warning');
                        }
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all flex items-center justify-center space-x-1 disabled:opacity-50 cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Habilitar Área</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center space-x-3 text-amber-300">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-xs">
                Estás visualizando la lista de participantes en modo informativo. Para añadir o modificar permisos debes ser el Administrador del Sistema o el Creador de este proyecto.
              </p>
            </div>
          )}

          {/* Current Participants List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-theme-accent" />
                <h4 className="text-xs font-bold text-theme-text uppercase tracking-wider">
                  Participantes Asignados ({participants.length})
                </h4>
              </div>

              {participants.length > 3 && (
                <div className="relative w-56">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-theme-text-muted" />
                  <input
                    type="text"
                    placeholder="Filtrar participante..."
                    value={participantSearchFilter}
                    onChange={(e) => setParticipantSearchFilter(e.target.value)}
                    className="w-full pl-8 pr-3 py-1 bg-theme-surface border border-theme-border rounded-lg text-xs text-theme-text placeholder-theme-text-muted focus:border-theme-accent outline-none"
                  />
                </div>
              )}
            </div>

            {filteredParticipants.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-theme-border rounded-xl bg-theme-surface-subtle/30">
                <Users className="w-8 h-8 text-theme-text-muted mx-auto mb-2 opacity-50" />
                <p className="text-xs font-semibold text-theme-text">No hay participantes adicionales asignados</p>
                <p className="text-[11px] text-theme-text-muted mt-1 max-w-sm mx-auto">
                  {canManage
                    ? 'Usa el formulario superior para incorporar analistas, revisores o supervisores a este lienzo de procesos.'
                    : 'Aún no se han configurado participantes específicos para este proyecto.'}
                </p>
              </div>
            ) : (
              <div className="border border-theme-border rounded-xl overflow-hidden divide-y divide-theme-border bg-theme-surface">
                {filteredParticipants.map(participant => (
                  <div
                    key={participant.userId}
                    className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-theme-surface-subtle/40 transition-colors"
                  >
                    <div className="flex items-center space-x-3 min-w-0 flex-1">
                      <div className="w-8 h-8 rounded-full bg-theme-accent/20 border border-theme-accent/40 flex items-center justify-center text-theme-accent font-bold text-xs shrink-0">
                        {participant.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-theme-text truncate">
                            {participant.fullName}
                          </span>
                          <span
                            className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold border ${
                              participant.permissionLevel === 'READ_ONLY'
                                ? 'text-sky-400 bg-sky-500/10 border-sky-500/30'
                                : participant.permissionLevel === 'COMMENTS'
                                ? 'text-amber-400 bg-amber-500/10 border-amber-500/30'
                                : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                            }`}
                          >
                            {participant.permissionLevel === 'READ_ONLY' && '👁️ Lectura'}
                            {participant.permissionLevel === 'COMMENTS' && '💬 Comentarios'}
                            {participant.permissionLevel === 'EDITOR' && '✏️ Editor'}
                          </span>
                        </div>
                        <div className="text-[11px] text-theme-text-muted font-mono truncate">
                          {participant.email}
                          {participant.organizationUnit && (
                            <>
                              <span className="mx-1">&bull;</span>
                              <span>{participant.organizationUnit}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions: Change level & remove */}
                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                      {canManage ? (
                        <>
                          <select
                            value={participant.permissionLevel}
                            onChange={(e) => handleUpdateLevel(participant.userId, e.target.value as CanvasPermission)}
                            disabled={isSubmitting}
                            className="bg-theme-surface-subtle border border-theme-border rounded-lg px-2.5 py-1 text-xs text-theme-text focus:border-theme-accent outline-none font-medium cursor-pointer"
                          >
                            <option value="READ_ONLY">👁️ Solo Lectura</option>
                            <option value="COMMENTS">💬 Comentarios</option>
                            <option value="EDITOR">✏️ Editor</option>
                          </select>

                          <button
                            onClick={() => handleRemoveParticipant(participant.userId, participant.fullName)}
                            disabled={isSubmitting}
                            title="Revocar acceso al proyecto"
                            className="p-1.5 rounded-lg bg-theme-surface-subtle hover:bg-red-500/15 border border-theme-border text-theme-text-muted hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] font-mono text-theme-text-muted">
                          Asignado el {new Date(participant.assignedAt).toLocaleDateString('es-AR')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reference Legend Card */}
          <div className="p-4 rounded-xl bg-theme-surface-subtle/50 border border-theme-border/70 text-[11px] space-y-1.5 text-theme-text-muted">
            <div className="font-bold text-theme-text flex items-center space-x-1.5">
              <Shield className="w-3.5 h-3.5 text-theme-accent" />
              <span>Gobernanza de Accesos (ISO 9001 - Control Documental)</span>
            </div>
            <ul className="space-y-1 list-disc list-inside">
              <li><strong className="text-theme-text">Solo Lectura:</strong> Permite visualizar el lienzo y generar todas las exportaciones oficiales sin alterar el contenido.</li>
              <li><strong className="text-theme-text">Comentarios:</strong> Permite incorporar notas de revisión, observaciones de auditoría y feedback.</li>
              <li><strong className="text-theme-text">Editor:</strong> Otorga control completo para crear, mover o eliminar nodos y guardar nuevas versiones del proceso.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-theme-surface-subtle border-t border-theme-border flex items-center justify-between shrink-0">
          <span className="text-[11px] font-mono text-theme-text-muted">
            {canManage ? '✅ Cambios sincronizados con la base de datos' : '🔒 Modo consulta'}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-theme-surface hover:bg-theme-surface-hover border border-theme-border text-xs font-bold text-theme-text transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
