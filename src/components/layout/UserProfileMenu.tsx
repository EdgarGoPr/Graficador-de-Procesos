import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useUiStore } from '../../store/useUiStore';
import { useProjectStore } from '../../store/useProjectStore';
import { StorageService } from '../../services/storageService';
import {
  Shield,
  Sun,
  Moon,
  Palette,
  FolderOpen,
  LogOut,
  ChevronDown,
  User,
  Sparkles,
  ExternalLink,
  Laptop
} from 'lucide-react';

interface UserProfileMenuProps {
  onOpenFolder?: () => void;
}

export const UserProfileMenu: React.FC<UserProfileMenuProps> = ({ onOpenFolder }) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const { currentUser, setAdminConsoleOpen, logout, openAuthModal } = useAuthStore();
  const { theme, toggleTheme, setThemeModalOpen, showNotification } = useUiStore();
  const { currentProject } = useProjectStore();

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleDefaultOpenFolder = async () => {
    if (onOpenFolder) {
      onOpenFolder();
      setIsOpen(false);
      return;
    }

    if (StorageService.isElectron()) {
      try {
        const ok = await StorageService.openProjectsFolder();
        if (ok) {
          showNotification('Carpeta de proyectos abierta en el explorador', 'info');
        } else {
          showNotification('Directorio de proyectos: MiAppProcesos_USB/Proyectos/', 'info');
        }
      } catch {
        showNotification('Directorio de proyectos: MiAppProcesos_USB/Proyectos/', 'info');
      }
    } else {
      if (currentProject) {
        StorageService.exportProjectToJsonFile(currentProject);
        showNotification(`Archivo ${currentProject.fileName} descargado a tu computador`, 'info');
      } else {
        showNotification('En la Web los proyectos están guardados de forma segura en tu navegador.', 'info');
      }
    }
    setIsOpen(false);
  };

  if (!currentUser) {
    return (
      <button
        onClick={() => openAuthModal('LOGIN')}
        className="py-1.5 px-3.5 rounded-xl bg-theme-accent hover:opacity-95 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
      >
        <User className="w-3.5 h-3.5" />
        <span>Iniciar Sesión</span>
      </button>
    );
  }

  const userInitial = currentUser.fullName?.charAt(0).toUpperCase() || 'U';
  const firstName = currentUser.fullName?.split(' ')[0] || 'Usuario';
  const isAdmin = currentUser.role === 'ADMIN';

  return (
    <div ref={menuRef} className="relative select-none">
      {/* Trigger Button: Sleek Interactive Avatar Pill */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center space-x-2 pl-1.5 pr-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
          isOpen
            ? 'bg-theme-surface border-theme-accent/60 shadow-md ring-2 ring-theme-accent/20'
            : 'bg-theme-surface-subtle hover:bg-theme-surface border-theme-border/80 hover:border-theme-border'
        }`}
        title={`Mi Cuenta: ${currentUser.fullName} (${currentUser.role})`}
        aria-expanded={isOpen}
      >
        {/* Avatar Circle with Active Presence Dot */}
        <div className="relative">
          <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-theme-accent to-sky-400 flex items-center justify-center text-white font-bold text-xs shadow-inner">
            {userInitial}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 border border-theme-surface shadow-xs" />
        </div>

        {/* User Info Text */}
        <div className="text-left hidden sm:block">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs font-semibold text-theme-text leading-none truncate max-w-[90px]">
              {firstName}
            </span>
            <span
              className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded leading-none ${
                isAdmin
                  ? 'text-theme-accent bg-theme-accent/15 border border-theme-accent/30'
                  : 'text-theme-text-muted bg-theme-border/40'
              }`}
            >
              {currentUser.role}
            </span>
          </div>
        </div>

        {/* Chevron Icon */}
        <ChevronDown
          className={`w-3.5 h-3.5 text-theme-text-muted transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-theme-accent' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-theme-surface/98 backdrop-blur-2xl border border-theme-border/90 rounded-2xl shadow-2xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header: User Profile Card */}
          <div className="p-3 bg-gradient-to-b from-theme-surface-subtle/70 to-transparent rounded-xl border border-theme-border/40 mb-1">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-theme-accent to-indigo-500 flex items-center justify-center text-white font-bold text-base shadow-md">
                {userInitial}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h4 className="text-xs font-bold text-theme-text truncate leading-tight">
                    {currentUser.fullName}
                  </h4>
                </div>
                <p className="text-[11px] text-theme-text-muted truncate mt-0.5">
                  {currentUser.email}
                </p>
                <div className="flex items-center space-x-2 mt-1.5">
                  <span
                    className={`inline-flex items-center text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isAdmin
                        ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30'
                        : 'text-sky-400 bg-sky-500/10 border border-sky-500/30'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                    {isAdmin ? 'ADMINISTRADOR' : 'USUARIO ACTIVO'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Management Section */}
          {isAdmin && (
            <div className="px-1 py-1">
              <button
                onClick={() => {
                  setAdminConsoleOpen(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-gradient-to-r from-theme-accent/10 to-indigo-500/10 hover:from-theme-accent/20 hover:to-indigo-500/20 border border-theme-accent/30 text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center space-x-2.5">
                  <div className="p-1.5 rounded-lg bg-theme-accent/20 text-theme-accent group-hover:scale-110 transition-transform">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-theme-accent flex items-center space-x-1">
                      <span>Consola de Administración</span>
                      <Sparkles className="w-3 h-3 text-amber-400" />
                    </div>
                    <div className="text-[10px] text-theme-text-muted leading-tight">
                      Gobernanza, usuarios, roles y auditoría ISO 9001
                    </div>
                  </div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-theme-accent -rotate-90 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          )}

          {/* Preferences & Utilities Section */}
          <div className="py-1 px-1 space-y-0.5">
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-theme-text-muted/70">
              Personalización & Entorno
            </div>

            {/* Dark / Light Mode Switch */}
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-theme-text hover:bg-theme-surface-subtle transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-theme-accent" />
                )}
                <span>Apariencia</span>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-theme-surface border border-theme-border text-theme-text-muted">
                {theme === 'dark' ? 'Modo Oscuro' : 'Modo Claro'}
              </span>
            </button>

            {/* Antigravity IDE Themes */}
            <button
              onClick={() => {
                setThemeModalOpen(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-theme-text hover:bg-theme-surface-subtle transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <Palette className="w-4 h-4 text-purple-400" />
                <span>Paleta de Colores & Temas</span>
              </div>
              <span className="text-[10px] text-theme-accent font-medium">Antigravity</span>
            </button>

            {/* Open Folder in Local / Web */}
            <button
              onClick={handleDefaultOpenFolder}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs text-theme-text hover:bg-theme-surface-subtle transition-colors cursor-pointer"
            >
              <div className="flex items-center space-x-2.5">
                <FolderOpen className="w-4 h-4 text-sky-400" />
                <span>Almacenamiento Local</span>
              </div>
              <ExternalLink className="w-3 h-3 text-theme-text-muted" />
            </button>
          </div>

          {/* Footer: Sign Out */}
          <div className="pt-1 mt-1 border-t border-theme-border/60 px-1">
            <button
              onClick={() => {
                setIsOpen(false);
                logout();
              }}
              className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
