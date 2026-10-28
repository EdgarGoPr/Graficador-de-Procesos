import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { AuthService } from '../../services/authService';
import {
  Lock,
  Mail,
  User,
  Shield,
  KeyRound,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  X,
  FileText,
  Building,
  Smartphone,
  Eye,
  EyeOff
} from 'lucide-react';

export const AuthModal: React.FC<{ isGatekeeper?: boolean }> = ({ isGatekeeper = false }) => {
  const {
    isAuthModalOpen,
    authModalMode,
    closeAuthModal,
    setAuthModalMode,
    setCurrentUser,
    currentUser,
    tempTotpUserId
  } = useAuthStore();

  // Estados de formularios
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [organizationUnit, setOrganizationUnit] = useState('');
  const [justification, setJustification] = useState('');

  // Reseteo y cambio forzado
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  // 2FA TOTP
  const [totpCode, setTotpCode] = useState('');

  // UI Feedback
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isAuthModalOpen && !isGatekeeper) return null;

  const resetMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // 1. Iniciar sesión por Correo / Contraseña (o código de 6 dígitos)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsSubmitting(true);

    try {
      const result = await AuthService.loginWithEmail(email, password);

      if (!result.ok) {
        setErrorMessage(result.error || 'Error al iniciar sesión.');
        setIsSubmitting(false);
        return;
      }

      if (result.mustChangePassword) {
        // El usuario ingresó con el código temporal de 6 dígitos provisto por el Admin
        setResetCode(password); // Pre-cargar el código usado
        setAuthModalMode('FORCE_PASSWORD');
        setSuccessMessage('Has ingresado con un código temporal de recuperación. Por seguridad, debes definir tu nueva contraseña a continuación.');
        setIsSubmitting(false);
        return;
      }

      if (result.requiresTotp && result.tempUserId) {
        setAuthModalMode('VERIFY_TOTP');
        useAuthStore.setState({ tempTotpUserId: result.tempUserId });
        setIsSubmitting(false);
        return;
      }

      if (result.user) {
        setCurrentUser(result.user);
        closeAuthModal();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error inesperado al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Iniciar sesión con Google (Simulado / Google GIS)
  const handleGoogleLogin = async () => {
    resetMessages();
    setIsSubmitting(true);

    try {
      const targetEmail = (email && email.trim()) || 'egdeprada@gmail.com';
      const isAdminEmail = targetEmail.toLowerCase() === 'egdeprada@gmail.com';

      const googleProfile = {
        email: targetEmail,
        fullName: isAdminEmail ? 'Edgar González de Prada' : (fullName || 'Usuario Google Corporativo'),
        googleId: 'google_oauth_' + (isAdminEmail ? 'admin_egdeprada' : Math.floor(Math.random() * 1000000)),
        avatarUrl: isAdminEmail 
          ? 'https://lh3.googleusercontent.com/a/ACg8ocISAdminUserEdgar' 
          : 'https://lh3.googleusercontent.com/a/default-user'
      };

      const result = await AuthService.loginWithGoogle(googleProfile);

      if (!result.ok) {
        if (result.notRegistered) {
          setErrorMessage(result.error || 'Tu correo de Google no se encuentra habilitado en el sistema.');
          setEmail(googleProfile.email);
          setFullName(googleProfile.fullName);
          // Invitar a solicitar habilitación
          setAuthModalMode('REQUEST_ACCESS');
        } else {
          setErrorMessage(result.error || 'Error al autenticar con Google.');
        }
        setIsSubmitting(false);
        return;
      }

      if (result.requiresTotp && result.tempUserId) {
        setAuthModalMode('VERIFY_TOTP');
        useAuthStore.setState({ tempTotpUserId: result.tempUserId });
        setIsSubmitting(false);
        return;
      }

      if (result.user) {
        setCurrentUser(result.user);
        closeAuthModal();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Fallo en la comunicación con el servicio de Google.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Enviar solicitud de habilitación de cuenta (Sin auto-registro)
  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsSubmitting(true);

    try {
      const result = await AuthService.submitAccessRequest({
        email,
        fullName,
        organizationUnit,
        justification
      });

      if (!result.ok) {
        setErrorMessage(result.error || 'No se pudo enviar la solicitud.');
      } else {
        setSuccessMessage('✓ Tu solicitud ha sido enviada al Administrador. Una vez evaluada y aprobada, te informarán el código de acceso inicial.');
        setTimeout(() => {
          setAuthModalMode('LOGIN');
          resetMessages();
        }, 4000);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al remitir la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 4. Solicitar restablecimiento de contraseña al Administrador
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setIsSubmitting(true);

    try {
      const result = await AuthService.requestPasswordReset(email);
      setSuccessMessage(result.message);
      setTimeout(() => {
        setAuthModalMode('LOGIN');
      }, 5000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al tramitar el pedido de reseteo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 5. Cambio forzado de contraseña con el código de 6 dígitos
  const handleForcePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();

    if (newPassword !== confirmPassword) {
      setErrorMessage('La confirmación de la contraseña no coincide.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('La nueva contraseña debe tener un mínimo de 8 caracteres.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await AuthService.changePasswordWithCode(email, resetCode, newPassword);

      if (!result.ok) {
        setErrorMessage(result.error || 'No se pudo cambiar la contraseña.');
      } else if (result.user) {
        setCurrentUser(result.user);
        closeAuthModal();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al actualizar contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 6. Verificar código 2FA TOTP para Administrador
  const handleVerifyTotp = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    if (!tempTotpUserId) return;

    setIsSubmitting(true);
    try {
      const result = await AuthService.verifyAdminTotp(tempTotpUserId, totpCode);
      if (!result.ok) {
        setErrorMessage(result.error || 'Código TOTP incorrecto.');
      } else if (result.user) {
        setCurrentUser(result.user);
        closeAuthModal();
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al validar segundo factor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isGatekeeper ? 'bg-slate-950/80' : 'bg-black/70'} backdrop-blur-md animate-fadeIn`}>
      <div className="relative w-full max-w-md bg-theme-surface border border-theme-border rounded-2xl shadow-2xl overflow-hidden transition-all text-theme-text">
        {/* Cabecera del Modal */}
        <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-theme-border/60">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-theme-accent/15 border border-theme-accent/30 text-theme-accent">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">ProcesStudio Access</h2>
              <p className="text-xs text-theme-text-muted">Gobernanza, Roles y Calidad ISO 9001</p>
            </div>
          </div>
          {currentUser && !isGatekeeper && (
            <button
              onClick={closeAuthModal}
              className="p-1 rounded-lg text-theme-text-muted hover:text-theme-text hover:bg-theme-border/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Mensajes de Alerta / Éxito */}
        <div className="px-6 pt-4">
          {errorMessage && (
            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}
          {successMessage && (
            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMessage}</span>
            </div>
          )}
        </div>

        {/* ================================================================= */}
        {/* MODO 1: INICIO DE SESIÓN PRINCIPAL                                */}
        {/* ================================================================= */}
        {authModalMode === 'LOGIN' && (
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-theme-text-muted mb-1.5">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-theme-text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-theme-bg/60 border border-theme-border focus:border-theme-accent focus:ring-1 focus:ring-theme-accent outline-none text-xs text-theme-text placeholder:text-theme-text-muted transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-theme-text-muted">
                  Contraseña o Código de 6 Dígitos
                </label>
                <button
                  type="button"
                  onClick={() => {
                    resetMessages();
                    setAuthModalMode('REQUEST_RESET');
                  }}
                  className="text-[11px] text-theme-accent hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-theme-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• o código de 6 dígitos"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-theme-bg/60 border border-theme-border focus:border-theme-accent focus:ring-1 focus:ring-theme-accent outline-none text-xs text-theme-text placeholder:text-theme-text-muted transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-theme-text-muted hover:text-theme-text"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-theme-accent hover:opacity-95 active:scale-[0.99] font-semibold text-xs text-white shadow-lg shadow-theme-accent/25 flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Validando...' : 'Iniciar Sesión'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-theme-border/60"></div>
              </div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
                <span className="px-3 bg-theme-surface text-theme-text-muted">O accede con</span>
              </div>
            </div>

            {/* Botón Oficial Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs border border-slate-200 shadow-sm flex items-center justify-center space-x-3 transition-all disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.16 0 9.94 0 12s.45 3.84 1.24 5.42l4.04-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{email ? `Continuar con Google (${email})` : 'Continuar con Google (egdeprada@gmail.com)'}</span>
            </button>
            <p className="text-[11px] text-center text-theme-text-muted mt-1">
              El correo <span className="font-semibold text-theme-text">egdeprada@gmail.com</span> ingresa automáticamente como <span className="font-bold text-theme-accent">ADMIN</span>
            </p>

            {/* Enlace a Solicitar Habilitación */}
            <div className="pt-2 text-center text-xs text-theme-text-muted">
              <span>¿No cuentas con acceso habilitado? </span>
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setAuthModalMode('REQUEST_ACCESS');
                }}
                className="font-semibold text-theme-accent hover:underline"
              >
                Solicitar Habilitación
              </button>
            </div>
          </form>
        )}

        {/* ================================================================= */}
        {/* MODO 2: SOLICITAR HABILITACIÓN DE CUENTA (Sin auto-registro)      */}
        {/* ================================================================= */}
        {authModalMode === 'REQUEST_ACCESS' && (
          <form onSubmit={handleRequestAccess} className="p-6 space-y-3.5">
            <div className="p-3 rounded-xl bg-theme-accent/10 border border-theme-accent/20 text-xs text-theme-text">
              <p className="font-semibold text-theme-accent mb-0.5">Control de Acceso Cerrado</p>
              <p className="text-theme-text-muted text-[11px]">
                ProcesStudio opera bajo gobernanza estricta. Las solicitudes son evaluadas por el Administrador antes de habilitar una cuenta.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-theme-text-muted mb-1">
                Nombre y Apellido
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-theme-text-muted" />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ing. María González"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-theme-bg/60 border border-theme-border focus:border-theme-accent outline-none text-xs text-theme-text"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-theme-text-muted mb-1">
                Correo Electrónico (o Google)
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-theme-text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="maria.gonzalez@empresa.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-theme-bg/60 border border-theme-border focus:border-theme-accent outline-none text-xs text-theme-text"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-theme-text-muted mb-1">
                Unidad Organizativa / Área
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3 w-4 h-4 text-theme-text-muted" />
                <input
                  type="text"
                  required
                  value={organizationUnit}
                  onChange={(e) => setOrganizationUnit(e.target.value)}
                  placeholder="Gerencia de Auditoría y Calidad"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-theme-bg/60 border border-theme-border focus:border-theme-accent outline-none text-xs text-theme-text"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-theme-text-muted mb-1">
                Justificación del Acceso
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3 w-4 h-4 text-theme-text-muted" />
                <textarea
                  required
                  rows={2}
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Modelado y revisión de diagramas de procesos ISO 9001..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-theme-bg/60 border border-theme-border focus:border-theme-accent outline-none text-xs text-theme-text resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setAuthModalMode('LOGIN');
                }}
                className="w-1/3 py-2.5 rounded-xl border border-theme-border text-xs font-semibold text-theme-text hover:bg-theme-border/30 transition-all"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 py-2.5 rounded-xl bg-theme-accent hover:opacity-95 font-semibold text-xs text-white shadow-md transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
              </button>
            </div>
          </form>
        )}

        {/* ================================================================= */}
        {/* MODO 3: SOLICITAR RESTABLECIMIENTO DE CONTRASEÑA                  */}
        {/* ================================================================= */}
        {authModalMode === 'REQUEST_RESET' && (
          <form onSubmit={handleRequestReset} className="p-6 space-y-4">
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-theme-text">
              <p className="font-semibold text-amber-400 mb-1">Reseteo por Administrador</p>
              <p className="text-theme-text-muted text-[11px] leading-relaxed">
                El Administrador es el único facultado para generar códigos de reseteo. Al enviar tu solicitud, el Administrador te informará el código de 6 dígitos para ingresar.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-theme-text-muted mb-1.5">
                Ingresa tu Correo Electrónico Registrado
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-theme-text-muted" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@empresa.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-theme-bg/60 border border-theme-border focus:border-theme-accent outline-none text-xs text-theme-text"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setAuthModalMode('LOGIN');
                }}
                className="w-1/3 py-2.5 rounded-xl border border-theme-border text-xs font-semibold text-theme-text hover:bg-theme-border/30 transition-all"
              >
                Volver
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 font-semibold text-xs text-white shadow-md transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Solicitando...' : 'Solicitar al Administrador'}
              </button>
            </div>
          </form>
        )}

        {/* ================================================================= */}
        {/* MODO 4: CAMBIO FORZADO OBLIGATORIO DE CONTRASEÑA                 */}
        {/* ================================================================= */}
        {authModalMode === 'FORCE_PASSWORD' && (
          <form onSubmit={handleForcePasswordChange} className="p-6 space-y-4">
            <div className="p-3 rounded-xl bg-theme-accent/15 border border-theme-accent/30 text-xs">
              <p className="font-semibold text-theme-accent mb-0.5">Actualización Obligatoria</p>
              <p className="text-theme-text-muted text-[11px]">
                Has ingresado con un código temporal de recuperación. Debes establecer tu nueva contraseña con confirmación para continuar.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-theme-text-muted mb-1">
                Código de 6 Dígitos Informado
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-theme-text-muted" />
                <input
                  type="text"
                  required
                  maxLength={6}
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  placeholder="123456"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-theme-bg/60 border border-theme-border font-mono tracking-widest text-center text-sm text-theme-text outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-theme-text-muted mb-1">
                Nueva Contraseña (mínimo 8 caracteres)
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-theme-text-muted" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-theme-bg/60 border border-theme-border focus:border-theme-accent outline-none text-xs text-theme-text"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-theme-text-muted hover:text-theme-text"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-theme-text-muted mb-1">
                Confirmar Nueva Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-theme-text-muted" />
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-theme-bg/60 border border-theme-border focus:border-theme-accent outline-none text-xs text-theme-text"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-semibold text-xs text-white shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Actualizando...' : 'Guardar y Acceder'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ================================================================= */}
        {/* MODO 5: VERIFICACIÓN 2FA TOTP PARA ADMINISTRADOR                 */}
        {/* ================================================================= */}
        {authModalMode === 'VERIFY_TOTP' && (
          <form onSubmit={handleVerifyTotp} className="p-6 space-y-4">
            <div className="p-3.5 rounded-xl bg-theme-accent/15 border border-theme-accent/30 text-xs text-theme-text text-center">
              <Smartphone className="w-8 h-8 text-theme-accent mx-auto mb-2" />
              <p className="font-semibold text-theme-text mb-0.5">Segundo Factor Obligatorio (2FA)</p>
              <p className="text-theme-text-muted text-[11px]">
                Ingresa el código dinámico de 6 dígitos generado por tu aplicación Authenticator para confirmar tu rol de Administrador.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-theme-text-muted text-center mb-2">
                Código de Autenticación TOTP
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                className="w-full py-3 px-4 rounded-xl bg-theme-bg border border-theme-border text-center font-mono text-2xl tracking-[0.5em] text-theme-text outline-none focus:border-theme-accent focus:ring-1 focus:ring-theme-accent transition-all"
              />
            </div>

            <div className="pt-2 flex items-center space-x-3">
              <button
                type="button"
                onClick={() => {
                  resetMessages();
                  setAuthModalMode('LOGIN');
                }}
                className="w-1/3 py-2.5 rounded-xl border border-theme-border text-xs font-semibold text-theme-text hover:bg-theme-border/30 transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || totpCode.length !== 6}
                className="w-2/3 py-2.5 rounded-xl bg-theme-accent hover:opacity-95 font-semibold text-xs text-white shadow-md transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Verificando...' : 'Verificar y Entrar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
