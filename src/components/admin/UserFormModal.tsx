import React, { useState, useEffect } from 'react';
import {
  ALL_SYSTEM_MODULES,
  AppUser,
  CreateUserPayload,
  MODULE_PRESET_PROFILES,
  SYSTEM_MODULE_LABELS,
  SystemModuleKey,
  UpdateUserPayload,
  UserRole,
  UserStatus
} from '../../types/auth';
import { AuthService } from '../../services/authService';
import { MasterCatalogsService } from '../../services/masterCatalogsService';
import {
  UserPlus,
  UserCheck,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  Building2,
  Mail,
  User,
  CheckCircle2,
  Lock,
  LayoutGrid,
  CheckSquare,
  Square
} from 'lucide-react';

interface UserFormModalProps {
  isOpen: boolean;
  mode: 'CREATE' | 'EDIT';
  userToEdit?: AppUser | null;
  currentAdmin: AppUser;
  onClose: () => void;
  onSuccess: (result: { mode: 'CREATE' | 'EDIT'; user?: AppUser; generatedInitialCode?: string }) => void;
}

export const UserFormModal: React.FC<UserFormModalProps> = ({
  isOpen,
  mode,
  userToEdit,
  currentAdmin,
  onClose,
  onSuccess
}) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [organizationUnit, setOrganizationUnit] = useState('');
  const [role, setRole] = useState<UserRole>('USER');
  const [status, setStatus] = useState<UserStatus>('ACTIVE');
  const [allowedModules, setAllowedModules] = useState<SystemModuleKey[]>([...ALL_SYSTEM_MODULES]);

  // Modo Crear: Contraseña
  const [passwordMode, setPasswordMode] = useState<'GENERATE_CODE' | 'MANUAL_PASSWORD'>('GENERATE_CODE');
  const [manualPassword, setManualPassword] = useState('');
  const [showManualPassword, setShowManualPassword] = useState(false);

  // Modo Editar: Opciones de Contraseña
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [changePasswordInEdit, setChangePasswordInEdit] = useState(false);
  const [newEditPassword, setNewEditPassword] = useState('');
  const [showEditPassword, setShowEditPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setErrorMessage(null);
      if (mode === 'EDIT' && userToEdit) {
        setFullName(userToEdit.fullName || '');
        setEmail(userToEdit.email || '');
        setOrganizationUnit(userToEdit.organizationUnit || '');
        setRole(userToEdit.role);
        setStatus(userToEdit.status);
        setAllowedModules(
          userToEdit.allowedModules && userToEdit.allowedModules.length > 0
            ? [...userToEdit.allowedModules]
            : [...ALL_SYSTEM_MODULES]
        );
        setMustChangePassword(userToEdit.mustChangePassword);
        setChangePasswordInEdit(false);
        setNewEditPassword('');
      } else {
        setFullName('');
        setEmail('');
        setOrganizationUnit('');
        setRole('USER');
        setStatus('ACTIVE');
        setAllowedModules([...ALL_SYSTEM_MODULES]);
        setPasswordMode('GENERATE_CODE');
        setManualPassword('');
      }
    }
  }, [isOpen, mode, userToEdit]);

  if (!isOpen) return null;

  const isSelf = userToEdit?.id === currentAdmin.id;

  const toggleModule = (modKey: SystemModuleKey) => {
    setAllowedModules((prev) =>
      prev.includes(modKey) ? prev.filter((k) => k !== modKey) : [...prev, modKey]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (role === 'USER' && allowedModules.length === 0) {
      setErrorMessage('Debes habilitar al menos un módulo del sistema para el usuario.');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'CREATE') {
        const payload: CreateUserPayload = {
          fullName: fullName.trim(),
          email: email.trim().toLowerCase(),
          organizationUnit: organizationUnit.trim(),
          role,
          status,
          allowedModules: role === 'ADMIN' ? [...ALL_SYSTEM_MODULES] : allowedModules,
          passwordMode,
          manualPassword: passwordMode === 'MANUAL_PASSWORD' ? manualPassword : undefined
        };

        const res = await AuthService.createUserByAdmin(currentAdmin, payload);
        if (!res.ok) {
          setErrorMessage(res.error || 'No se pudo crear el usuario.');
          setIsSubmitting(false);
          return;
        }

        onSuccess({ mode: 'CREATE', user: res.user, generatedInitialCode: res.generatedInitialCode });
        onClose();
      } else if (mode === 'EDIT' && userToEdit) {
        const payload: UpdateUserPayload = {
          fullName: fullName.trim(),
          organizationUnit: organizationUnit.trim(),
          role,
          status,
          allowedModules: role === 'ADMIN' ? [...ALL_SYSTEM_MODULES] : allowedModules,
          mustChangePassword,
          newPassword: changePasswordInEdit && newEditPassword.trim().length > 0 ? newEditPassword.trim() : undefined
        };

        const res = await AuthService.updateUserByAdmin(currentAdmin, userToEdit.id, payload);
        if (!res.ok) {
          setErrorMessage(res.error || 'No se pudo actualizar el usuario.');
          setIsSubmitting(false);
          return;
        }

        onSuccess({ mode: 'EDIT', user: res.user });
        onClose();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado al procesar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const orgUnitsCatalog = MasterCatalogsService.getCatalogsSync().orgUnits.filter((u) => u.isActive);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-theme-surface border border-theme-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col text-theme-text transition-all max-h-[90vh]">
        {/* Cabecera del Modal */}
        <div className="px-6 py-4 border-b border-theme-border flex items-center justify-between bg-theme-bg/40 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-theme-accent/15 border border-theme-accent/30 flex items-center justify-center text-theme-accent shrink-0">
              {mode === 'CREATE' ? <UserPlus className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-theme-text">
                {mode === 'CREATE' ? 'Dar de Alta Nuevo Usuario' : 'Modificar Usuario y Permisos de Módulos'}
              </h2>
              <p className="text-[11px] text-theme-text-muted">
                {mode === 'CREATE'
                  ? 'Configura credenciales, área y los módulos del sistema habilitados'
                  : `Actualizar credenciales, área y acceso a módulos de ${userToEdit?.email}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-theme-text-muted hover:text-theme-text p-1.5 rounded-lg hover:bg-theme-border/50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start space-x-2 text-xs text-red-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Nombre y Apellido */}
            <div>
              <label className="block text-xs font-semibold text-theme-text mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-theme-accent" />
                <span>Nombre y Apellido *</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ej. Ing. Martín Belgrano"
                className="w-full px-3.5 py-2 rounded-xl bg-theme-bg border border-theme-border text-xs text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:border-theme-accent transition-colors"
              />
            </div>

            {/* Correo Electrónico */}
            <div>
              <label className="block text-xs font-semibold text-theme-text mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-theme-accent" />
                <span>Correo Electrónico *</span>
              </label>
              <input
                type="email"
                required
                disabled={mode === 'EDIT'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@organizacion.com"
                className={`w-full px-3.5 py-2 rounded-xl border text-xs transition-colors ${
                  mode === 'EDIT'
                    ? 'bg-theme-bg/40 border-theme-border/50 text-theme-text-muted cursor-not-allowed font-mono'
                    : 'bg-theme-bg border-theme-border text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:border-theme-accent'
                }`}
              />
            </div>
          </div>

          {/* Unidad Organizativa / Área */}
          <div>
            <label className="block text-xs font-semibold text-theme-text mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-theme-accent" />
              <span>Unidad Organizativa / Dependencia *</span>
            </label>
            <input
              type="text"
              required
              list="user-form-org-units"
              value={organizationUnit}
              onChange={(e) => setOrganizationUnit(e.target.value)}
              placeholder="Ej. Dirección General de Calidad y Procesos"
              className="w-full px-3.5 py-2 rounded-xl bg-theme-bg border border-theme-border text-xs text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:border-theme-accent transition-colors"
            />
            <datalist id="user-form-org-units">
              {orgUnitsCatalog.map((u) => (
                <option key={u.id} value={u.name}>
                  {u.code}
                </option>
              ))}
            </datalist>
          </div>

          {/* Rol y Estado en 2 Columnas */}
          <div className="grid grid-cols-2 gap-3">
            {/* Rol */}
            <div>
              <label className="block text-xs font-semibold text-theme-text mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-theme-accent" />
                <span>Rol del Sistema</span>
              </label>
              <select
                value={role}
                disabled={isSelf}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-colors ${
                  isSelf
                    ? 'bg-theme-bg/40 border-theme-border/50 text-theme-text-muted cursor-not-allowed'
                    : 'bg-theme-bg border-theme-border text-theme-text focus:border-theme-accent'
                }`}
              >
                <option value="USER">USER (Usuario Regular)</option>
                <option value="ADMIN">ADMIN (Administrador Total)</option>
              </select>
            </div>

            {/* Estado */}
            <div>
              <label className="block text-xs font-semibold text-theme-text mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-theme-accent" />
                <span>Estado</span>
              </label>
              <select
                value={status}
                disabled={isSelf}
                onChange={(e) => setStatus(e.target.value as UserStatus)}
                className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none transition-colors ${
                  isSelf
                    ? 'bg-theme-bg/40 border-theme-border/50 text-theme-text-muted cursor-not-allowed'
                    : 'bg-theme-bg border-theme-border text-theme-text focus:border-theme-accent'
                }`}
              >
                <option value="ACTIVE">ACTIVE (Activo)</option>
                <option value="INACTIVE">INACTIVE (Inactivo)</option>
                {mode === 'EDIT' && <option value="BLOCKED">BLOCKED (Bloqueado)</option>}
              </select>
            </div>
          </div>

          {/* ================================================================= */}
          {/* PERMISOS DE ACCESO A MÓDULOS Y VISTAS DEL SISTEMA (PST-090)       */}
          {/* ================================================================= */}
          {role === 'USER' && (
            <div className="p-3.5 rounded-2xl bg-theme-bg/60 border border-theme-border space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold text-theme-text flex items-center gap-1.5">
                  <LayoutGrid className="w-4 h-4 text-theme-accent" />
                  <span>Acceso a Módulos y Vistas del Sistema</span>
                </label>
                <span className="text-[10px] font-mono text-theme-accent font-semibold">
                  {allowedModules.length} de {ALL_SYSTEM_MODULES.length} habilitados
                </span>
              </div>

              {/* Perfiles rápidos de 1 clic */}
              <div className="flex flex-wrap gap-1.5">
                {MODULE_PRESET_PROFILES.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setAllowedModules([...preset.modules])}
                    title={preset.description}
                    className="px-2.5 py-1 rounded-lg bg-theme-surface hover:bg-theme-surface-hover border border-theme-border text-[10px] font-semibold text-theme-text hover:text-theme-accent transition-colors cursor-pointer"
                  >
                    ⚡ {preset.name}
                  </button>
                ))}
              </div>

              {/* Grupo 1: Módulos Principales */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted mb-1.5">
                  1. Navegación Principal
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SYSTEM_MODULE_LABELS.filter((m) => m.group === 'MAIN').map((mod) => {
                    const checked = allowedModules.includes(mod.key);
                    return (
                      <button
                        key={mod.key}
                        type="button"
                        onClick={() => toggleModule(mod.key)}
                        className={`p-2 rounded-xl border text-left flex items-start space-x-2 transition-all cursor-pointer ${
                          checked
                            ? 'bg-theme-accent/15 border-theme-accent/50 text-theme-text'
                            : 'bg-theme-surface/50 border-theme-border/60 text-theme-text-muted'
                        }`}
                      >
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-theme-accent shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-theme-text-muted shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="text-xs font-bold leading-tight">{mod.label}</div>
                          <div className="text-[10px] text-theme-text-muted leading-tight mt-0.5">
                            {mod.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grupo 2: Vistas & Manual PDF */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted mb-1.5">
                  2. Desplegable "Vistas & Manual PDF"
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {SYSTEM_MODULE_LABELS.filter((m) => m.group === 'VIEWS').map((mod) => {
                    const checked = allowedModules.includes(mod.key);
                    return (
                      <button
                        key={mod.key}
                        type="button"
                        onClick={() => toggleModule(mod.key)}
                        className={`p-2 rounded-xl border text-left flex items-start space-x-2 transition-all cursor-pointer ${
                          checked
                            ? 'bg-theme-accent/15 border-theme-accent/50 text-theme-text'
                            : 'bg-theme-surface/50 border-theme-border/60 text-theme-text-muted'
                        }`}
                      >
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-theme-accent shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-theme-text-muted shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="text-xs font-bold leading-tight">{mod.label}</div>
                          <div className="text-[10px] text-theme-text-muted leading-tight mt-0.5">
                            {mod.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Grupo 3: Funciones Adicionales */}
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-theme-text-muted mb-1.5">
                  3. Funciones y Herramientas Complementarias
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SYSTEM_MODULE_LABELS.filter((m) => m.group === 'EXTRAS').map((mod) => {
                    const checked = allowedModules.includes(mod.key);
                    return (
                      <button
                        key={mod.key}
                        type="button"
                        onClick={() => toggleModule(mod.key)}
                        className={`p-2 rounded-xl border text-left flex items-start space-x-2 transition-all cursor-pointer ${
                          checked
                            ? 'bg-theme-accent/15 border-theme-accent/50 text-theme-text'
                            : 'bg-theme-surface/50 border-theme-border/60 text-theme-text-muted'
                        }`}
                      >
                        {checked ? (
                          <CheckSquare className="w-4 h-4 text-theme-accent shrink-0 mt-0.5" />
                        ) : (
                          <Square className="w-4 h-4 text-theme-text-muted shrink-0 mt-0.5" />
                        )}
                        <div>
                          <div className="text-[11px] font-bold leading-tight">{mod.label}</div>
                          <div className="text-[9.5px] text-theme-text-muted leading-tight mt-0.5">
                            {mod.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Configuración de Contraseña - MODO CREAR */}
          {mode === 'CREATE' && (
            <div className="pt-2 border-t border-theme-border/60 space-y-3">
              <label className="block text-xs font-semibold text-theme-text flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-theme-accent" />
                <span>Asignación de Contraseña Inicial</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPasswordMode('GENERATE_CODE')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                    passwordMode === 'GENERATE_CODE'
                      ? 'border-theme-accent bg-theme-accent/10 text-theme-text'
                      : 'border-theme-border bg-theme-bg/40 text-theme-text-muted hover:text-theme-text'
                  }`}
                >
                  <p className="font-bold text-[11px] text-theme-accent">Código 6 Dígitos</p>
                  <p className="text-[10px] text-theme-text-muted mt-0.5">
                    Provisorio; obliga a definir clave al ingresar.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setPasswordMode('MANUAL_PASSWORD')}
                  className={`p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                    passwordMode === 'MANUAL_PASSWORD'
                      ? 'border-theme-accent bg-theme-accent/10 text-theme-text'
                      : 'border-theme-border bg-theme-bg/40 text-theme-text-muted hover:text-theme-text'
                  }`}
                >
                  <p className="font-bold text-[11px] text-theme-accent">Contraseña Manual</p>
                  <p className="text-[10px] text-theme-text-muted mt-0.5">
                    Definida directamente por el Admin.
                  </p>
                </button>
              </div>

              {passwordMode === 'MANUAL_PASSWORD' && (
                <div className="relative pt-1 animate-fadeIn">
                  <input
                    type={showManualPassword ? 'text' : 'password'}
                    required
                    value={manualPassword}
                    onChange={(e) => setManualPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-theme-bg border border-theme-border text-xs text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:border-theme-accent transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowManualPassword(!showManualPassword)}
                    className="absolute right-3 top-3 text-theme-text-muted hover:text-theme-text"
                  >
                    {showManualPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Configuración de Contraseña - MODO EDITAR */}
          {mode === 'EDIT' && (
            <div className="pt-2 border-t border-theme-border/60 space-y-3">
              <label className="block text-xs font-semibold text-theme-text flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-theme-accent" />
                <span>Opciones de Seguridad & Contraseña</span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-theme-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={mustChangePassword}
                  onChange={(e) => setMustChangePassword(e.target.checked)}
                  className="rounded border-theme-border text-theme-accent focus:ring-0"
                />
                <span>Forzar cambio de contraseña en el próximo inicio de sesión</span>
              </label>

              <label className="flex items-center space-x-2 text-xs text-theme-text cursor-pointer">
                <input
                  type="checkbox"
                  checked={changePasswordInEdit}
                  onChange={(e) => setChangePasswordInEdit(e.target.checked)}
                  className="rounded border-theme-border text-theme-accent focus:ring-0"
                />
                <span>Sobrescribir contraseña del usuario ahora</span>
              </label>

              {changePasswordInEdit && (
                <div className="relative pt-1 animate-fadeIn">
                  <input
                    type={showEditPassword ? 'text' : 'password'}
                    required
                    value={newEditPassword}
                    onChange={(e) => setNewEditPassword(e.target.value)}
                    placeholder="Nueva contraseña (mínimo 8 caracteres)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-theme-bg border border-theme-border text-xs text-theme-text placeholder:text-theme-text-muted focus:outline-none focus:border-theme-accent transition-colors pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEditPassword(!showEditPassword)}
                    className="absolute right-3 top-3 text-theme-text-muted hover:text-theme-text"
                  >
                    {showEditPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Botones de Acción */}
          <div className="pt-3 border-t border-theme-border flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl border border-theme-border text-xs font-semibold text-theme-text-muted hover:bg-theme-border/40 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-theme-accent text-white hover:bg-theme-accent/90 text-xs font-semibold shadow-lg shadow-theme-accent/25 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </span>
              ) : mode === 'CREATE' ? (
                <span>Crear Usuario</span>
              ) : (
                <span>Guardar Cambios</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;
