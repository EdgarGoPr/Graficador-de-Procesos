import { create } from 'zustand';
import { AppUser, CanvasActiveLock, CanvasPermission } from '../types/auth';
import { AuthService } from '../services/authService';
import { GoogleAuthService } from '../services/googleAuthService';
import { PermissionService } from '../services/permissionService';
import { ConcurrencyLockService } from '../services/concurrencyLockService';
import { IdleTimeoutService } from '../services/idleTimeoutService';

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

  initializeAuth: async () => {
    set({ isLoading: true });
    try {
      await AuthService.initialize();

      // Verificar si el navegador acaba de retornar desde accounts.google.com con access_token
      const googleProfile = await GoogleAuthService.handleOAuthRedirectCallback();
      if (googleProfile) {
        const result = await AuthService.loginWithGoogle(googleProfile);
        if (result.ok && result.user) {
          set({ currentUser: result.user, isAuthModalOpen: false });
        }
      } else {
        const existing = AuthService.getCurrentUser();
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
    AuthService.setCurrentUser(user);
    set({ currentUser: user });
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
    if (activeCanvasLock && currentUser) {
      await ConcurrencyLockService.releaseLock(activeCanvasLock.projectFileName, currentUser);
    }
    await AuthService.logout();
    set({
      currentUser: null,
      isAdminConsoleOpen: false,
      activeCanvasLock: null,
      currentCanvasPermission: null,
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

    // Verificar si es la contraseña correcta o confirmación
    if (user.passwordHash) {
      const { verifyPassword } = await import('../utils/cryptoUtils');
      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) return false;
    }

    IdleTimeoutService.resetTimers();
    set({ isLockedByInactivity: false, inactivityWarningSeconds: null });
    return true;
  }
}));
