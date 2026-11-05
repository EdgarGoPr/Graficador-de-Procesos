import { create } from 'zustand';
import { AppUser, CanvasActiveLock, CanvasPermission } from '../types/auth';
import { AuthService } from '../services/authService';
import { GoogleAuthService } from '../services/googleAuthService';
import { PermissionService } from '../services/permissionService';
import { ConcurrencyLockService } from '../services/concurrencyLockService';
import { IdleTimeoutService } from '../services/idleTimeoutService';
import { PresenceService } from '../services/presenceService';
import { setSessionExpiredHandler } from '../services/apiClient';

export type AuthModalMode = 'LOGIN' | 'REQUEST_ACCESS' | 'REQUEST_RESET' | 'FORCE_PASSWORD' | 'VERIFY_TOTP';

interface AuthStoreState {
  currentUser: AppUser | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: AuthModalMode;
  tempTotpUserId: string | null;
  forcePasswordEmail: string | null;
  forcePasswordCode: string | null;
  isAdminConsoleOpen: boolean;
  isLockedByInactivity: boolean;
  inactivityWarningSeconds: number | null;
  activeCanvasLock: CanvasActiveLock | null;
  currentCanvasPermission: CanvasPermission | null;
  concurrencyConflictNotice: string | null;
  /** Mensaje a mostrar en la pantalla de ingreso (ej. error al volver de Google o sesión vencida). */
  authNotice: string | null;
  /** Datos de Google para precargar la solicitud de habilitación de un correo no registrado. */
  pendingAccessProfile: { email: string; fullName: string } | null;

  // Actions
  initializeAuth: () => Promise<void>;
  setCurrentUser: (user: AppUser | null) => void;
  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: AuthModalMode) => void;
  setAdminConsoleOpen: (open: boolean) => void;
  logout: () => Promise<void>;

  // Concurrency & Locks
  acquireCanvasLock: (
    projectFileName: string,
    projectInfo?: { authorName?: string; createdByEmail?: string; createdByUserId?: string } | null
  ) => Promise<{ allowed: boolean; permission: CanvasPermission; message?: string }>;
  releaseCanvasLock: (projectFileName: string) => Promise<void>;
  dismissConcurrencyNotice: () => void;

  // Inactivity
  dismissInactivityWarning: () => void;
  unlockInactivity: (passwordOrGoogleConfirm: string) => Promise<boolean>;
}

export const useAuthStore = create<AuthStoreState>((set, get) => ({
  currentUser: null,
  isLoading: true,
  isAuthModalOpen: false,
  authModalMode: 'LOGIN',
  tempTotpUserId: null,
  forcePasswordEmail: null,
  forcePasswordCode: null,
  isAdminConsoleOpen: false,
  isLockedByInactivity: false,
  inactivityWarningSeconds: null,
  activeCanvasLock: null,
  currentCanvasPermission: null,
  concurrencyConflictNotice: null,
  authNotice: null,
  pendingAccessProfile: null,

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      await AuthService.initialize();

      // Si el servidor informa que la sesión venció, volver a la pantalla de ingreso.
      setSessionExpiredHandler(() => {
        if (!get().currentUser) return;
        ConcurrencyLockService.stopHeartbeat();
        PresenceService.stopPresenceHeartbeat();
        set({
          currentUser: null,
          isAdminConsoleOpen: false,
          activeCanvasLock: null,
          currentCanvasPermission: null,
          concurrencyConflictNotice: null,
          isLockedByInactivity: false,
          inactivityWarningSeconds: null,
          authModalMode: 'LOGIN',
          authNotice: 'Tu sesión expiró. Volvé a iniciar sesión.'
        });
      });

      // ¿El navegador vuelve de accounts.google.com con un access_token?
      const googleReturn = GoogleAuthService.consumeOAuthRedirect();
      if (googleReturn && 'error' in googleReturn) {
        set({ authNotice: googleReturn.error });
      } else if (googleReturn) {
        const result = await AuthService.loginWithGoogle(googleReturn.accessToken);
        if (result.ok && result.requiresTotp) {
          set({ isAuthModalOpen: true, authModalMode: 'VERIFY_TOTP', tempTotpUserId: 'pending' });
        } else if (result.ok && result.user) {
          set({ currentUser: result.user, isAuthModalOpen: false });
        } else if (result.notRegistered) {
          set({
            authNotice: result.error || null,
            authModalMode: 'REQUEST_ACCESS',
            pendingAccessProfile: result.profile || null
          });
        } else {
          set({ authNotice: result.error || 'No se pudo iniciar sesión con Google.' });
        }
      } else {
        const existing = await AuthService.fetchSession();
        if (existing) {
          set({ currentUser: existing });
        }
      }

      // Inicializar servicio de timeout por inactividad
      IdleTimeoutService.init(
        (remainingSeconds) => {
          if (get().currentUser) {
            set({ inactivityWarningSeconds: remainingSeconds });
          }
        },
        () => {
          if (get().currentUser) {
            set({ isLockedByInactivity: true, inactivityWarningSeconds: null });
          }
        }
      );
    } catch (err) {
      console.error('Error al inicializar autenticación:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  setCurrentUser: (user) => {
    set({ currentUser: user, authNotice: null, pendingAccessProfile: null });
  },

  openAuthModal: (mode = 'LOGIN') => {
    set({ isAuthModalOpen: true, authModalMode: mode });
  },

  closeAuthModal: () => {
    set({
      isAuthModalOpen: false,
      authModalMode: 'LOGIN',
      tempTotpUserId: null,
      forcePasswordEmail: null,
      forcePasswordCode: null
    });
  },

  setAuthModalMode: (mode) => set({ authModalMode: mode }),

  setAdminConsoleOpen: (open) => set({ isAdminConsoleOpen: open }),

  logout: async () => {
    const { activeCanvasLock, currentUser } = get();
    if (currentUser) {
      try {
        if (activeCanvasLock) {
          await ConcurrencyLockService.releaseLock(activeCanvasLock.projectFileName, currentUser);
        }
        await ConcurrencyLockService.releaseAllUserLocks(currentUser);
        await PresenceService.markUserLoggedOut(currentUser);
      } catch (err) {
        console.warn('Error al liberar candados y presencia al desloguearse:', err);
      }
    }
    await AuthService.logout();
    set({
      currentUser: null,
      isAdminConsoleOpen: false,
      activeCanvasLock: null,
      currentCanvasPermission: null,
      concurrencyConflictNotice: null,
      isLockedByInactivity: false,
      inactivityWarningSeconds: null
    });
  },

  acquireCanvasLock: async (
    projectFileName: string,
    projectInfo?: { authorName?: string; createdByEmail?: string; createdByUserId?: string } | null
  ) => {
    const user = get().currentUser;
    // Obtener permiso asignado al usuario
    const permission = await PermissionService.getEffectivePermission(user, projectFileName, projectInfo);
    PresenceService.setLockEligibility(permission === 'EDITOR');

    if (!permission) {
      return {
        allowed: false,
        permission: 'READ_ONLY',
        message: 'No tienes permisos asignados por el Administrador para acceder a este lienzo.'
      };
    }

    if (permission === 'READ_ONLY' || permission === 'COMMENTS') {
      set({ currentCanvasPermission: permission, activeCanvasLock: null, concurrencyConflictNotice: null });
      return { allowed: true, permission };
    }

    // Si tiene permiso 'EDITOR', intentar adquirir candado exclusivo
    if (user) {
      const lockResult = await ConcurrencyLockService.acquireLock(projectFileName, user);
      if (!lockResult.ok && lockResult.activeConflict) {
        // Conflicto de edición activa: degradar a Solo Lectura con aviso
        const notice = `⚠️ Lienzo en edición activa por "${lockResult.activeConflict.userName}". Has ingresado en modo Solo Lectura para prevenir pérdida de datos.`;
        set({
          currentCanvasPermission: 'READ_ONLY',
          activeCanvasLock: null,
          concurrencyConflictNotice: notice
        });
        return { allowed: true, permission: 'READ_ONLY', message: notice };
      }

      set({
        currentCanvasPermission: 'EDITOR',
        activeCanvasLock: lockResult.lock || null,
        concurrencyConflictNotice: null
      });
      return { allowed: true, permission: 'EDITOR' };
    }

    return { allowed: true, permission };
  },

  releaseCanvasLock: async (projectFileName: string) => {
    const { currentUser, activeCanvasLock } = get();
    if (currentUser && activeCanvasLock && activeCanvasLock.projectFileName === projectFileName) {
      await ConcurrencyLockService.releaseLock(projectFileName, currentUser);
      set({ activeCanvasLock: null, concurrencyConflictNotice: null });
    }
  },

  dismissConcurrencyNotice: () => set({ concurrencyConflictNotice: null }),

  dismissInactivityWarning: () => {
    IdleTimeoutService.resetTimers();
    set({ inactivityWarningSeconds: null });
  },

  unlockInactivity: async (password: string) => {
    const user = get().currentUser;
    if (!user) return false;

    // La contraseña se verifica en el servidor (el navegador ya no conoce ningún hash).
    const valid = await AuthService.reauthenticate(password);
    if (!valid) return false;

    IdleTimeoutService.resetTimers();
    set({ isLockedByInactivity: false, inactivityWarningSeconds: null });
    return true;
  }
}));
