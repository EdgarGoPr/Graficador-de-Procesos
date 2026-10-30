import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useProjectStore } from '../../store/useProjectStore';
import { useUiStore } from '../../store/useUiStore';
import { AuthService } from '../../services/authService';
import { PermissionService } from '../../services/permissionService';
import { AuditLoggerService } from '../../services/auditLoggerService';
import { AuditPdfExportService } from '../../services/auditPdfExportService';
import { MasterCatalogsService } from '../../services/masterCatalogsService';
import {
  ALL_SYSTEM_MODULES,
  AppUser,
  AuditLogEntry,
  CanvasPermission,
  MODULE_PRESET_PROFILES,
  ProjectUserPermission,
  SYSTEM_MODULE_LABELS,
  SystemModuleKey,
  UserAccessRequest,
  UserRole
} from '../../types/auth';
import {
  Shield,
  Users,
  KeyRound,
  FolderKanban,
  FileSpreadsheet,
  FileCheck,
  Check,
  X,
  AlertCircle,
  Copy,
  Search,
  Filter,
  CheckCircle2,
  QrCode,
  Smartphone,
  Eye,
  MessageSquare,
  PenTool,
  Lock,
  UserPlus,
  Pencil,
  Database,
  LayoutGrid,
  CheckSquare,
  Square
} from 'lucide-react';
import { UserFormModal } from './UserFormModal';

type AdminTab = 'REQUESTS' | 'USERS' | 'CANVAS_PERMS' | 'CATALOGS_ABM' | 'AUDIT_LOGS' | '2FA_SECURITY';

export const AdminConsoleModal: React.FC = () => {
  const { isAdminConsoleOpen, setAdminConsoleOpen, currentUser, setCurrentUser } = useAuthStore();
  const { projectList } = useProjectStore();
  const { setMasterCatalogsModalOpen, showNotification } = useUiStore();

  const [activeTab, setActiveTab] = useState<AdminTab>('REQUESTS');
  const [users, setUsers] = useState<AppUser[]>([]);
  const [requests, setRequests] = useState<UserAccessRequest[]>([]);
  const [permissions, setPermissions] = useState<ProjectUserPermission[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros de Auditoría
  const [auditFilterUser, setAuditFilterUser] = useState('');
  const [auditFilterAction, setAuditFilterAction] = useState('ALL');
  const [auditFilterProject, setAuditFilterProject] = useState('');
  const [auditFilterStartDate, setAuditFilterStartDate] = useState('');
  const [auditFilterEndDate, setAuditFilterEndDate] = useState('');

  // Selector de asignación de lienzos
  const [selectedUserForPerms, setSelectedUserForPerms] = useState<string>('');

  // Diálogo de código generado
  const [generatedCodeDialog, setGeneratedCodeDialog] = useState<{
    isOpen: boolean;
    title: string;
    targetUserEmail: string;
    code: string;
    note: string;
  } | null>(null);

  // Diálogo de enrolamiento 2FA
  const [totpSetupData, setTotpSetupData] = useState<{ secret: string; uri: string } | null>(null);
  const [totpVerificationInput, setTotpVerificationInput] = useState('');
  const [totpFeedback, setTotpFeedback] = useState<{ success?: string; error?: string } | null>(null);

  // Copiado al portapapeles
  const [copiedCode, setCopiedCode] = useState(false);

  // Modal de Alta y Edición de Usuario
  const [userFormModalState, setUserFormModalState] = useState<{
    isOpen: boolean;
    mode: 'CREATE' | 'EDIT';
    userToEdit: AppUser | null;
  }>({
    isOpen: false,
    mode: 'CREATE',
    userToEdit: null
  });

  useEffect(() => {
    if (isAdminConsoleOpen && currentUser?.role === 'ADMIN') {
      loadAllData();
    }
  }, [isAdminConsoleOpen, currentUser]);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [uList, rList, pList, lList] = await Promise.all([
        AuthService.listUsers(),
        AuthService.listAccessRequests(),
        PermissionService.listAllPermissions(),
        AuditLoggerService.queryLogs({ limit: 200 })
      ]);
      setUsers(uList);
      setRequests(rList);
      setPermissions(pList);
      setAuditLogs(lList);

      if (uList.length > 0 && !selectedUserForPerms) {
        setSelectedUserForPerms(uList[0].id);
      }
    } catch (err) {
      console.error('Error al cargar datos de consola de administración:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAdminConsoleOpen || currentUser?.role !== 'ADMIN') return null;

  // 1. Aprobar solicitud de habilitación
  const handleApproveRequest = async (requestId: string, role: UserRole) => {
    if (!currentUser) return;
    const res = await AuthService.reviewAccessRequest(currentUser, requestId, true, role);
    if (res.ok && res.generatedInitialCode) {
      const req = requests.find(r => r.id === requestId);
      setGeneratedCodeDialog({
        isOpen: true,
        title: 'Usuario Habilitado Exitosamente',
        targetUserEmail: req ? req.email : 'Usuario',
        code: res.generatedInitialCode,
        note: 'Informa este código de 6 dígitos al usuario para que pueda ingresar. Al acceder, el sistema le exigirá definir su nueva contraseña.'
      });
      loadAllData();
    }
  };

  // 2. Rechazar solicitud
  const handleRejectRequest = async (requestId: string) => {
    if (!currentUser) return;
    await AuthService.reviewAccessRequest(currentUser, requestId, false);
    loadAllData();
  };

  // 3. Generar Código de 6 Dígitos para Reseteo de Contraseña
  const handleGenerateResetCode = async (targetUser: AppUser) => {
    if (!currentUser) return;
    const res = await AuthService.generateResetCodeByAdmin(currentUser, targetUser.id);
    if (res.ok && res.code) {
      setGeneratedCodeDialog({
        isOpen: true,
        title: 'Código de Restablecimiento Generado',
        targetUserEmail: targetUser.email,
        code: res.code,
        note: `Comunica este código de 6 dígitos a ${targetUser.fullName}. Al colocarlo en el campo de contraseña, el sistema le exigirá establecer su nueva clave.`
      });
      loadAllData();
    }
  };

  // 4. Cambiar estado activo / inactivo de usuario
  const handleToggleUserStatus = async (user: AppUser) => {
    if (!currentUser || user.id === currentUser.id) return;
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    await AuthService.updateUserStatus(currentUser, user.id, nextStatus);
    loadAllData();
  };

  // 5. Asignar / Desasignar permiso de lienzo
  const handleSetPermission = async (
    targetUserId: string,
    projectFileName: string,
    level: CanvasPermission | 'UNASSIGNED'
  ) => {
    if (!currentUser) return;

    if (level === 'UNASSIGNED') {
      await PermissionService.removePermission(currentUser, targetUserId, projectFileName);
    } else {
      await PermissionService.assignPermission(currentUser, targetUserId, projectFileName, level);
    }
    const updated = await PermissionService.listAllPermissions();
    setPermissions(updated);
  };

  // 6. Aplicar filtros a logs de auditoría
  const handleFilterAudit = async () => {
    setIsLoading(true);
    const logs = await AuditLoggerService.queryLogs({
      userEmail: auditFilterUser || undefined,
      actionType: auditFilterAction !== 'ALL' ? auditFilterAction : undefined,
      targetResource: auditFilterProject || undefined,
      startDate: auditFilterStartDate || undefined,
      endDate: auditFilterEndDate || undefined,
      limit: 300
    });
    setAuditLogs(logs);
    setIsLoading(false);
  };

  // 7. Configuración de 2FA
  const handleStart2FaSetup = async () => {
    if (!currentUser) return;
    const data = await AuthService.setupTotp(currentUser.id);
    setTotpSetupData(data);
    setTotpFeedback(null);
  };

  const handleConfirm2Fa = async () => {
    if (!currentUser || !totpSetupData) return;
    const res = await AuthService.confirmAndEnableTotp(currentUser.id, totpSetupData.secret, totpVerificationInput);
    if (res.ok) {
      setTotpFeedback({ success: '✓ Segundo factor de autenticación (2FA / TOTP) activado exitosamente.' });
      loadAllData();
    } else {
      setTotpFeedback({ error: res.error || 'Código incorrecto.' });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const pendingRequests = requests.filter(r => r.status === 'PENDING');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-5xl h-[85vh] bg-theme-surface border border-theme-border rounded-3xl shadow-2xl overflow-hidden flex flex-col text-theme-text transition-all">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between shrink-0 bg-theme-bg/40">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-theme-accent/20 border border-theme-accent/30 text-theme-accent">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold">Consola de Administración y Gobernanza</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-theme-accent text-white uppercase tracking-wider">
                  Admin Master
                </span>
              </div>
              <p className="text-xs text-theme-text-muted">
                Control de Acceso (RBAC), Asignación de Lienzos y Trazabilidad ISO 9001:2015
              </p>
            </div>
          </div>
          <button
            onClick={() => setAdminConsoleOpen(false)}
            className="p-1.5 rounded-xl text-theme-text-muted hover:text-theme-text hover:bg-theme-border/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Pestañas */}
        <div className="px-6 border-b border-theme-border flex space-x-2 shrink-0 bg-theme-bg/20 overflow-x-auto">
          <button
            onClick={() => setActiveTab('REQUESTS')}
            className={`py-3 px-3.5 border-b-2 text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === 'REQUESTS'
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Solicitudes de Acceso</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-slate-950">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('USERS')}
            className={`py-3 px-3.5 border-b-2 text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === 'USERS'
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Usuarios & Claves</span>
          </button>

          <button
            onClick={() => setActiveTab('CANVAS_PERMS')}
            className={`py-3 px-3.5 border-b-2 text-xs font-semibold flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'CANVAS_PERMS'
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <FolderKanban className="w-4 h-4" />
            <span>Módulos & Lienzos</span>
          </button>

          <button
            onClick={() => setActiveTab('CATALOGS_ABM')}
            className={`py-3 px-3.5 border-b-2 text-xs font-semibold flex items-center space-x-2 transition-all whitespace-nowrap ${
              activeTab === 'CATALOGS_ABM'
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-400" />
            <span>Catálogos ABM</span>
          </button>

          <button
            onClick={() => setActiveTab('AUDIT_LOGS')}
            className={`py-3 px-3.5 border-b-2 text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === 'AUDIT_LOGS'
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Logs de Auditoría & ISO 9001</span>
          </button>

          <button
            onClick={() => setActiveTab('2FA_SECURITY')}
            className={`py-3 px-3.5 border-b-2 text-xs font-semibold flex items-center space-x-2 transition-all ${
              activeTab === '2FA_SECURITY'
                ? 'border-theme-accent text-theme-accent'
                : 'border-transparent text-theme-text-muted hover:text-theme-text'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Doble Factor (2FA TOTP)</span>
          </button>
        </div>

        {/* Contenido de la Pestaña Activa */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* ============================================================= */}
          {/* PESTAÑA 1: SOLICITUDES DE HABILITACIÓN                       */}
          {/* ============================================================= */}
          {activeTab === 'REQUESTS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Solicitudes de Habilitación Pendientes</h3>
                  <p className="text-xs text-theme-text-muted">
                    Los usuarios no pueden auto-registrarse. Al aprobar una solicitud, se generará un código de 6 dígitos que deberás informarle.
                  </p>
                </div>
                <button
                  onClick={loadAllData}
                  className="px-3 py-1.5 rounded-xl border border-theme-border text-xs hover:bg-theme-border/40 font-semibold"
                >
                  Actualizar
                </button>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="p-10 rounded-2xl border border-dashed border-theme-border text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-theme-text">No hay solicitudes pendientes</p>
                  <p className="text-[11px] text-theme-text-muted mt-0.5">
                    Todas las solicitudes de habilitación han sido evaluadas.
                  </p>
                </div>
              ) : (
                <div className="border border-theme-border rounded-2xl overflow-hidden divide-y divide-theme-border">
                  {pendingRequests.map(req => (
                    <div key={req.id} className="p-4 bg-theme-bg/40 flex items-start justify-between space-x-4">
                      <div className="space-y-1 max-w-xl">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-theme-text">{req.fullName}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-theme-border text-theme-text-muted">
                            {req.email}
                          </span>
                        </div>
                        <p className="text-xs text-theme-accent font-medium">Área: {req.organizationUnit}</p>
                        <p className="text-xs text-theme-text-muted italic bg-theme-surface/60 p-2.5 rounded-xl border border-theme-border/50">
                          "{req.justification}"
                        </p>
                        <p className="text-[10px] text-theme-text-muted">
                          Solicitado el {new Date(req.createdAt).toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          onClick={() => handleRejectRequest(req.id)}
                          className="px-3 py-1.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-semibold transition-all"
                        >
                          Rechazar
                        </button>
                        <button
                          onClick={() => handleApproveRequest(req.id, 'USER')}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md flex items-center space-x-1.5 transition-all"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Aprobar Usuario</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* PESTAÑA 2: USUARIOS Y GESTIÓN DE CLAVES                      */}
          {/* ============================================================= */}
          {activeTab === 'USERS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Usuarios del Sistema y Reseteo Exclusivo de Claves</h3>
                  <p className="text-xs text-theme-text-muted">
                    Como Administrador, puedes dar de alta nuevos usuarios, editar sus perfiles o generar códigos de 6 dígitos.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      setUserFormModalState({
                        isOpen: true,
                        mode: 'CREATE',
                        userToEdit: null
                      })
                    }
                    className="px-3.5 py-1.5 rounded-xl bg-theme-accent text-white hover:bg-theme-accent/90 text-xs font-semibold shadow-md shadow-theme-accent/20 flex items-center space-x-1.5 transition-all"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>+ Nuevo Usuario</span>
                  </button>
                  <button
                    onClick={loadAllData}
                    className="px-3 py-1.5 rounded-xl border border-theme-border text-xs hover:bg-theme-border/40 font-semibold"
                  >
                    Refrescar
                  </button>
                </div>
              </div>

              <div className="border border-theme-border rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-theme-bg/60 border-b border-theme-border text-[11px] uppercase tracking-wider text-theme-text-muted">
                    <tr>
                      <th className="p-3">Usuario</th>
                      <th className="p-3">Área</th>
                      <th className="p-3">Rol</th>
                      <th className="p-3">Estado</th>
                      <th className="p-3">Reseteo</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border">
                    {users.map(u => (
                      <tr key={u.id} className="hover:bg-theme-bg/30 transition-colors">
                        <td className="p-3">
                          <p className="font-semibold text-theme-text">{u.fullName}</p>
                          <p className="text-[11px] text-theme-text-muted font-mono">{u.email}</p>
                        </td>
                        <td className="p-3 text-theme-text-muted">{u.organizationUnit}</td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.role === 'ADMIN'
                                ? 'bg-theme-accent/20 text-theme-accent'
                                : 'bg-slate-700/30 text-slate-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-red-500/15 text-red-400'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {u.resetRequestStatus === 'REQUESTED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 animate-pulse">
                              Solicitud Pendiente
                            </span>
                          ) : (
                            <span className="text-theme-text-muted text-[11px]">-</span>
                          )}
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={() =>
                              setUserFormModalState({
                                isOpen: true,
                                mode: 'EDIT',
                                userToEdit: u
                              })
                            }
                            className="px-2.5 py-1 rounded-lg border border-theme-border hover:bg-theme-border/40 text-theme-text text-[11px] font-semibold transition-all inline-flex items-center space-x-1"
                            title="Editar usuario"
                          >
                            <Pencil className="w-3 h-3 text-theme-accent" />
                            <span>Editar</span>
                          </button>
                          <button
                            onClick={() => handleGenerateResetCode(u)}
                            className="px-2.5 py-1 rounded-lg bg-theme-accent/15 border border-theme-accent/30 text-theme-accent hover:bg-theme-accent hover:text-white text-[11px] font-semibold transition-all"
                            title="Generar código de 6 dígitos y comunicárselo"
                          >
                            Generar Código 6 Dígitos
                          </button>
                          {u.id !== currentUser.id && (
                            <>
                              <button
                                onClick={() => handleToggleUserStatus(u)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                                  u.status === 'ACTIVE'
                                    ? 'border border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                                    : 'border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                                }`}
                              >
                                {u.status === 'ACTIVE' ? 'Desactivar' : 'Activar'}
                              </button>
                              {u.email.toLowerCase() !== 'egdeprada@gmail.com' && (
                                <button
                                  onClick={async () => {
                                    if (window.confirm(`¿Confirmas eliminar definitivamente la cuenta de ${u.fullName} (${u.email}) y revocar sus accesos?`)) {
                                      const res = await AuthService.deleteUserByAdmin(currentUser, u.id);
                                      if (res.ok) {
                                        loadAllData();
                                      } else {
                                        alert(res.error || 'Error al eliminar usuario');
                                      }
                                    }
                                  }}
                                  className="px-2.5 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/15 text-[11px] font-semibold transition-all"
                                  title="Dar de baja y eliminar usuario"
                                >
                                  Eliminar
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* PESTAÑA 3: ASIGNACIÓN DE LIENZOS POR USUARIO                */}
          {/* ============================================================= */}
          {activeTab === 'CANVAS_PERMS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Matriz de Asignación y Permisos por Lienzo</h3>
                  <p className="text-xs text-theme-text-muted">
                    Los usuarios regulares solo verán los lienzos que les asignes aquí, respetando su nivel de permiso.
                  </p>
                </div>
                {/* Selector de Usuario */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-theme-text-muted font-semibold">Seleccionar Usuario:</span>
                  <select
                    value={selectedUserForPerms}
                    onChange={(e) => setSelectedUserForPerms(e.target.value)}
                    className="py-1.5 px-3 rounded-xl bg-theme-bg border border-theme-border text-xs text-theme-text outline-none font-semibold"
                  >
                    {users
                      .filter(u => u.role === 'USER')
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.fullName} ({u.email})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {users.filter(u => u.role === 'USER').length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-theme-border text-center text-xs text-theme-text-muted">
                  No hay usuarios con rol 'USER' dados de alta aún. Aprueba solicitudes o crea usuarios primero.
                </div>
              ) : (
                <>
                  {/* Panel de Acceso a Módulos y Vistas del Sistema para el Usuario Seleccionado */}
                  {(() => {
                    const targetU = users.find((u) => u.id === selectedUserForPerms);
                    if (!targetU) return null;
                    const userMods: SystemModuleKey[] =
                      targetU.allowedModules && Array.isArray(targetU.allowedModules)
                        ? targetU.allowedModules
                        : [...ALL_SYSTEM_MODULES];

                    const handleToggleUserModule = async (modKey: SystemModuleKey) => {
                      if (!currentUser) return;
                      const nextMods = userMods.includes(modKey)
                        ? userMods.filter((m) => m !== modKey)
                        : [...userMods, modKey];
                      if (nextMods.length === 0) {
                        showNotification('El usuario debe tener al menos un módulo habilitado.', 'warning');
                        return;
                      }
                      const res = await AuthService.updateUserModulesByAdmin(currentUser, targetU.id, nextMods);
                      if (res.ok && res.user) {
                        setUsers((prev) => prev.map((item) => (item.id === targetU.id ? res.user! : item)));
                        if (currentUser.id === targetU.id) {
                          setCurrentUser(res.user);
                        }
                      }
                    };

                    const handleApplyPresetToUser = async (presetModules: SystemModuleKey[], presetName: string) => {
                      if (!currentUser) return;
                      const res = await AuthService.updateUserModulesByAdmin(currentUser, targetU.id, presetModules);
                      if (res.ok && res.user) {
                        setUsers((prev) => prev.map((item) => (item.id === targetU.id ? res.user! : item)));
                        showNotification(`Perfil "${presetName}" aplicado a ${targetU.fullName}`, 'success');
                      }
                    };

                    return (
                      <div className="p-4 rounded-2xl bg-theme-bg/50 border border-theme-border space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <h4 className="text-xs font-bold text-theme-text flex items-center gap-1.5">
                              <LayoutGrid className="w-4 h-4 text-theme-accent" />
                              <span>1. Módulos y Vistas del Sistema habilitados para {targetU.fullName}</span>
                            </h4>
                            <p className="text-[11px] text-theme-text-muted">
                              Activa o desactiva qué secciones y sub-vistas puede ver este usuario en su barra superior:
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {MODULE_PRESET_PROFILES.map((preset) => (
                              <button
                                key={preset.id}
                                type="button"
                                onClick={() => handleApplyPresetToUser([...preset.modules], preset.name)}
                                title={preset.description}
                                className="px-2.5 py-1 rounded-lg bg-theme-surface hover:bg-theme-surface-hover border border-theme-border text-[10px] font-semibold text-theme-text hover:text-theme-accent transition-colors cursor-pointer"
                              >
                                ⚡ {preset.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                          {SYSTEM_MODULE_LABELS.map((mod) => {
                            const isChecked = userMods.includes(mod.key);
                            return (
                              <button
                                key={mod.key}
                                type="button"
                                onClick={() => handleToggleUserModule(mod.key)}
                                className={`p-2.5 rounded-xl border text-left flex items-start space-x-2.5 transition-all cursor-pointer ${
                                  isChecked
                                    ? 'bg-theme-accent/15 border-theme-accent/50 text-theme-text shadow-xs'
                                    : 'bg-theme-surface/40 border-theme-border/60 text-theme-text-muted opacity-75'
                                }`}
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-theme-accent shrink-0 mt-0.5" />
                                ) : (
                                  <Square className="w-4 h-4 text-theme-text-muted shrink-0 mt-0.5" />
                                )}
                                <div>
                                  <div className="text-xs font-bold flex items-center gap-1.5">
                                    <span>{mod.label}</span>
                                    {mod.group === 'VIEWS' && (
                                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-theme-surface border border-theme-border text-theme-text-muted">
                                        Vistas & PDF
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-theme-text-muted leading-tight mt-0.5">
                                    {mod.description}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-theme-text mb-2 flex items-center gap-1.5">
                      <FolderKanban className="w-4 h-4 text-theme-accent" />
                      <span>2. Asignación de Permisos por Proyecto / Lienzo</span>
                    </h4>
                    <div className="border border-theme-border rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-theme-bg/60 border-b border-theme-border text-[11px] uppercase tracking-wider text-theme-text-muted">
                      <tr>
                        <th className="p-3">Lienzo / Proyecto de Proceso</th>
                        <th className="p-3">Código</th>
                        <th className="p-3 text-center">Desasignado</th>
                        <th className="p-3 text-center">👁️ Solo Lectura</th>
                        <th className="p-3 text-center">💬 Comentarios (Solo Notas)</th>
                        <th className="p-3 text-center">✏️ Editor</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-border">
                      {projectList.map((proj: any) => {
                        const currentPerm = permissions.find(
                          p => p.userId === selectedUserForPerms && p.projectFileName === proj.fileName
                        )?.permissionLevel;

                        return (
                          <tr key={proj.fileName} className="hover:bg-theme-bg/30 transition-colors">
                            <td className="p-3">
                              <p className="font-semibold text-theme-text">{proj.documentTitle}</p>
                              <p className="text-[11px] text-theme-text-muted font-mono">{proj.fileName}</p>
                            </td>
                            <td className="p-3 font-mono text-theme-text-muted">{proj.documentCode}</td>
                            <td className="p-3 text-center">
                              <input
                                type="radio"
                                name={`perm_${proj.fileName}`}
                                checked={!currentPerm}
                                onChange={() => handleSetPermission(selectedUserForPerms, proj.fileName, 'UNASSIGNED')}
                                className="accent-red-500 w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="radio"
                                name={`perm_${proj.fileName}`}
                                checked={currentPerm === 'READ_ONLY'}
                                onChange={() => handleSetPermission(selectedUserForPerms, proj.fileName, 'READ_ONLY')}
                                className="accent-blue-500 w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="radio"
                                name={`perm_${proj.fileName}`}
                                checked={currentPerm === 'COMMENTS'}
                                onChange={() => handleSetPermission(selectedUserForPerms, proj.fileName, 'COMMENTS')}
                                className="accent-amber-500 w-4 h-4 cursor-pointer"
                              />
                            </td>
                            <td className="p-3 text-center">
                              <input
                                type="radio"
                                name={`perm_${proj.fileName}`}
                                checked={currentPerm === 'EDITOR'}
                                onChange={() => handleSetPermission(selectedUserForPerms, proj.fileName, 'EDITOR')}
                                className="accent-emerald-500 w-4 h-4 cursor-pointer"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ============================================================= */}
          {/* PESTAÑA 3.B: CATÁLOGOS MAESTROS Y ABMs CORPORATIVOS           */}
          {/* ============================================================= */}
          {activeTab === 'CATALOGS_ABM' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-theme-bg/50 border border-theme-border">
                <div>
                  <h3 className="text-sm font-bold text-theme-text flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-400" />
                    <span>Centro Maestro de Catálogos y ABMs del Sistema</span>
                  </h3>
                  <p className="text-xs text-theme-text-muted mt-0.5">
                    Administra de forma centralizada todas las tablas maestras que alimentan los formularios, carriles y reportes de ProcesStudio.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setAdminConsoleOpen(false);
                    setMasterCatalogsModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <Database className="w-4 h-4" />
                  <span>Abrir Gestor Completo de Catálogos ABM</span>
                </button>
              </div>

              {(() => {
                const cats = MasterCatalogsService.getCatalogsSync();
                const summaryCards = [
                  {
                    title: 'Unidades Organizativas / Áreas',
                    count: cats.orgUnits.length,
                    desc: 'Direcciones, gerencias y secretarías con código y titular responsable.',
                    color: 'text-sky-400 border-sky-500/30 bg-sky-500/10'
                  },
                  {
                    title: 'Roles y Cargos Funcionales (Carriles)',
                    count: cats.roles.length,
                    desc: 'Puestos operativos vinculables en 1 clic como Swimlanes del lienzo.',
                    color: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/10'
                  },
                  {
                    title: 'Marcos Normativos y Legales',
                    count: cats.normatives.length,
                    desc: 'Leyes, decretos, ordenanzas y normas ISO aplicables a los procedimientos.',
                    color: 'text-amber-400 border-amber-500/30 bg-amber-500/10'
                  },
                  {
                    title: 'Sistemas TI, Formularios y Registros',
                    count: cats.systemsDocs.length,
                    desc: 'Plataformas informáticas, formularios y expedientes para entradas/salidas SIPOC.',
                    color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                  },
                  {
                    title: 'Catálogo de Riesgos y Controles',
                    count: cats.risksControls.length,
                    desc: 'Riesgos operativos tipificados con sus controles mitigantes preventivos/detectivos.',
                    color: 'text-rose-400 border-rose-500/30 bg-rose-500/10'
                  },
                  {
                    title: 'Papelera de Reciclaje de Proyectos',
                    count: cats.deletedProjects.length,
                    desc: 'Proyectos dados de baja con capacidad de restauración inmediata en 1 clic.',
                    color: 'text-purple-400 border-purple-500/30 bg-purple-500/10'
                  }
                ];

                return (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {summaryCards.map((c, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setAdminConsoleOpen(false);
                          setMasterCatalogsModalOpen(true);
                        }}
                        className="p-4 rounded-2xl bg-theme-bg/40 hover:bg-theme-bg/70 border border-theme-border hover:border-theme-accent/50 transition-all cursor-pointer flex flex-col justify-between space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-theme-text">{c.title}</h4>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold border ${c.color}`}>
                            {c.count}
                          </span>
                        </div>
                        <p className="text-[11px] text-theme-text-muted leading-relaxed">{c.desc}</p>
                        <div className="text-[11px] font-semibold text-theme-accent flex items-center gap-1 pt-1">
                          <span>Gestionar ABM (Alta / Baja / Modificación) →</span>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          )}

          {/* ============================================================= */}
          {/* PESTAÑA 4: LOGS DE AUDITORÍA Y CERTIFICACIÓN ISO 9001         */}
          {/* ============================================================= */}
          {activeTab === 'AUDIT_LOGS' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold">Registro Centralizado de Auditoría & Trazabilidad</h3>
                  <p className="text-xs text-theme-text-muted">
                    Historial inmutable de accesos, comentarios y cambios conforme a ISO 9001:2015.
                  </p>
                </div>
                {/* Botones de Exportación */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => AuditLoggerService.exportToExcel(auditLogs)}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-md transition-all"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Exportar Excel (.xlsx)</span>
                  </button>
                  <button
                    onClick={() =>
                      AuditPdfExportService.generateCertifiedReport(auditLogs, currentUser.fullName, {
                        userEmail: auditFilterUser,
                        startDate: auditFilterStartDate,
                        endDate: auditFilterEndDate
                      })
                    }
                    className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-md transition-all"
                  >
                    <FileCheck className="w-4 h-4" />
                    <span>Informe Foliado PDF (ISO 9001)</span>
                  </button>
                </div>
              </div>

              {/* Filtros Rápidos */}
              <div className="p-3.5 rounded-2xl bg-theme-bg/50 border border-theme-border grid grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="block text-[10px] uppercase font-bold text-theme-text-muted mb-1">Usuario</label>
                  <input
                    type="text"
                    value={auditFilterUser}
                    onChange={(e) => setAuditFilterUser(e.target.value)}
                    placeholder="Filtrar por email..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-theme-surface border border-theme-border outline-none text-xs text-theme-text"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-theme-text-muted mb-1">Acción</label>
                  <select
                    value={auditFilterAction}
                    onChange={(e) => setAuditFilterAction(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-theme-surface border border-theme-border outline-none text-xs text-theme-text"
                  >
                    <option value="ALL">Todas las acciones</option>
                    <option value="AUTH_LOGIN_SUCCESS">Login Exitoso</option>
                    <option value="AUTH_RESET_REQUESTED">Reseteo Solicitado</option>
                    <option value="AUTH_RESET_CODE_ISSUED">Código Emitido</option>
                    <option value="AUTH_PASSWORD_CHANGED">Clave Cambiada</option>
                    <option value="CANVAS_COMMENT_ADDED">Comentario / Nota</option>
                    <option value="CANVAS_LOCK_ACQUIRED">Candado Edición</option>
                    <option value="CANVAS_PERMISSION_ASSIGNED">Permiso Asignado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-theme-text-muted mb-1">Lienzo</label>
                  <input
                    type="text"
                    value={auditFilterProject}
                    onChange={(e) => setAuditFilterProject(e.target.value)}
                    placeholder="Nombre o código..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-theme-surface border border-theme-border outline-none text-xs text-theme-text"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-bold text-theme-text-muted mb-1">Desde</label>
                  <input
                    type="date"
                    value={auditFilterStartDate}
                    onChange={(e) => setAuditFilterStartDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-theme-surface border border-theme-border outline-none text-xs text-theme-text"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleFilterAudit}
                    className="w-full py-1.5 rounded-lg bg-theme-accent hover:opacity-95 font-semibold text-xs text-white shadow-sm flex items-center justify-center space-x-1"
                  >
                    <Filter className="w-3.5 h-3.5" />
                    <span>Filtrar</span>
                  </button>
                </div>
              </div>

              {/* Tabla de Logs */}
              <div className="border border-theme-border rounded-2xl overflow-hidden max-h-[48vh] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-theme-bg/60 border-b border-theme-border text-[11px] uppercase tracking-wider text-theme-text-muted sticky top-0">
                    <tr>
                      <th className="p-3">Marca Temporal</th>
                      <th className="p-3">Usuario</th>
                      <th className="p-3">Rol</th>
                      <th className="p-3">Acción</th>
                      <th className="p-3">Recurso / Lienzo</th>
                      <th className="p-3">Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border">
                    {auditLogs.map(l => (
                      <tr key={l.id} className="hover:bg-theme-bg/30 transition-colors">
                        <td className="p-3 font-mono text-[11px] text-theme-text-muted">
                          {l.timestamp.replace('T', ' ').slice(0, 19)}
                        </td>
                        <td className="p-3 font-medium text-theme-text">{l.userEmail}</td>
                        <td className="p-3">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-theme-border">
                            {l.userRole}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-theme-accent text-[11px]">{l.actionType}</td>
                        <td className="p-3 text-theme-text-muted font-mono text-[11px]">{l.targetResource || '-'}</td>
                        <td className="p-3 font-mono text-[10px] text-theme-text-muted max-w-xs truncate">
                          {JSON.stringify(l.details)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================= */}
          {/* PESTAÑA 5: SEGURIDAD 2FA (TOTP)                              */}
          {/* ============================================================= */}
          {activeTab === '2FA_SECURITY' && (
            <div className="max-w-xl mx-auto space-y-5 text-center p-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-theme-accent/20 border border-theme-accent/40 flex items-center justify-center text-theme-accent">
                <Smartphone className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-base font-bold">Doble Factor de Autenticación (2FA / TOTP)</h3>
                <p className="text-xs text-theme-text-muted mt-1 leading-relaxed">
                  Protege tu cuenta de Administrador vinculando una app de autenticación (Google Authenticator, Microsoft Authenticator o Authy) mediante código estándar RFC 6238.
                </p>
              </div>

              {currentUser.isTotpEnabled ? (
                <div className="p-5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 space-y-2">
                  <CheckCircle2 className="w-8 h-8 mx-auto" />
                  <p className="font-bold text-sm">2FA Activo y Protegiendo tu Cuenta</p>
                  <p className="text-xs text-theme-text-muted">
                    Cada vez que inicies sesión se te solicitará el código dinámico de 6 dígitos.
                  </p>
                </div>
              ) : !totpSetupData ? (
                <button
                  onClick={handleStart2FaSetup}
                  className="py-3 px-6 rounded-xl bg-theme-accent hover:opacity-95 text-white font-bold text-xs shadow-lg shadow-theme-accent/25 transition-all"
                >
                  Configurar 2FA con Código QR
                </button>
              ) : (
                <div className="p-5 rounded-2xl bg-theme-bg/60 border border-theme-border text-left space-y-4">
                  <p className="text-xs font-bold text-theme-text text-center">
                    Paso 1: Escanea este enlace o ingresa la clave manual en tu App
                  </p>
                  <div className="p-3 bg-white text-slate-900 rounded-xl font-mono text-[11px] break-all select-all text-center">
                    {totpSetupData.secret}
                  </div>
                  <p className="text-[11px] text-theme-text-muted text-center">
                    URI de sincronización: <span className="font-mono text-[10px]">{totpSetupData.uri}</span>
                  </p>

                  <div className="pt-2">
                    <label className="block text-xs font-bold text-theme-text mb-1 text-center">
                      Paso 2: Ingresa el código de 6 dígitos generado por tu teléfono
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={totpVerificationInput}
                      onChange={(e) => setTotpVerificationInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full py-2.5 px-4 text-center font-mono text-xl tracking-[0.4em] rounded-xl bg-theme-surface border border-theme-border outline-none focus:border-theme-accent"
                    />
                  </div>

                  {totpFeedback?.error && (
                    <p className="text-xs text-red-400 text-center font-semibold">{totpFeedback.error}</p>
                  )}
                  {totpFeedback?.success && (
                    <p className="text-xs text-emerald-400 text-center font-semibold">{totpFeedback.success}</p>
                  )}

                  <button
                    onClick={handleConfirm2Fa}
                    disabled={totpVerificationInput.length !== 6}
                    className="w-full py-2.5 rounded-xl bg-theme-accent hover:opacity-95 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all"
                  >
                    Confirmar y Activar 2FA
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal de Diálogo para Código Generado */}
        {generatedCodeDialog && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-sm p-6 rounded-3xl bg-theme-surface border border-theme-border shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-theme-text">{generatedCodeDialog.title}</h3>
              <p className="text-xs text-theme-text-muted">
                Usuario destino: <strong className="text-theme-text">{generatedCodeDialog.targetUserEmail}</strong>
              </p>

              <div className="p-4 rounded-2xl bg-theme-bg border border-theme-border flex items-center justify-center space-x-3">
                <span className="font-mono text-3xl font-extrabold tracking-[0.3em] text-amber-400">
                  {generatedCodeDialog.code}
                </span>
                <button
                  onClick={() => handleCopyCode(generatedCodeDialog.code)}
                  className="p-2 rounded-xl bg-theme-surface border border-theme-border hover:bg-theme-border/40 text-theme-text transition-colors"
                  title="Copiar Código"
                >
                  {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <p className="text-xs text-theme-text-muted leading-relaxed bg-theme-bg/50 p-3 rounded-xl border border-theme-border/60">
                {generatedCodeDialog.note}
              </p>

              <button
                onClick={() => setGeneratedCodeDialog(null)}
                className="w-full py-2.5 rounded-xl bg-theme-accent hover:opacity-95 text-white font-bold text-xs shadow-md"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* Modal de Alta y Edición de Usuarios */}
        {userFormModalState.isOpen && currentUser && (
          <UserFormModal
            isOpen={userFormModalState.isOpen}
            mode={userFormModalState.mode}
            userToEdit={userFormModalState.userToEdit}
            currentAdmin={currentUser}
            onClose={() =>
              setUserFormModalState({ isOpen: false, mode: 'CREATE', userToEdit: null })
            }
            onSuccess={result => {
              if (result.mode === 'CREATE' && result.generatedInitialCode) {
                setGeneratedCodeDialog({
                  isOpen: true,
                  title: 'Usuario Dado de Alta Exitosamente',
                  targetUserEmail: result.user?.email || 'Nuevo Usuario',
                  code: result.generatedInitialCode,
                  note: 'Informa este código provisorio de 6 dígitos al nuevo usuario para su primer ingreso. El sistema le exigirá definir su contraseña definitiva de inmediato.'
                });
              }
              loadAllData();
            }}
          />
        )}
      </div>
    </div>
  );
};
