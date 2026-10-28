import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Lock, ShieldAlert, ArrowRight } from 'lucide-react';

export const IdleLockOverlay: React.FC = () => {
  const { isLockedByInactivity, currentUser, unlockInactivity, logout } = useAuthStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isLockedByInactivity || !currentUser) return null;

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const ok = await unlockInactivity(password);
    if (!ok) {
      setError('Contraseña incorrecta.');
      setIsSubmitting(false);
    } else {
      setPassword('');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/95 backdrop-blur-xl animate-fadeIn select-none">
      <div className="w-full max-w-sm p-6 rounded-3xl bg-theme-surface border border-theme-border shadow-2xl text-center space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-base font-bold text-theme-text">Sesión Bloqueada por Inactividad</h2>
          <p className="text-xs text-theme-text-muted mt-1">
            Por directivas de seguridad corporativa, la pantalla se ha protegido tras 30 minutos sin actividad.
          </p>
        </div>

        <div className="p-3 rounded-xl bg-theme-bg/60 border border-theme-border flex items-center space-x-3 text-left">
          <div className="w-8 h-8 rounded-full bg-theme-accent/20 flex items-center justify-center text-theme-accent font-bold text-xs uppercase">
            {currentUser.fullName.charAt(0)}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-theme-text truncate">{currentUser.fullName}</p>
            <p className="text-[11px] text-theme-text-muted truncate">{currentUser.email}</p>
          </div>
        </div>

        <form onSubmit={handleUnlock} className="space-y-3">
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 w-4 h-4 text-theme-text-muted" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña para reanudar"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-theme-bg border border-theme-border focus:border-theme-accent outline-none text-xs text-theme-text"
            />
          </div>

          {error && <p className="text-xs text-red-400 font-medium">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 px-4 rounded-xl bg-theme-accent hover:opacity-95 font-semibold text-xs text-white shadow-lg flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Verificando...' : 'Desbloquear Pantalla'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2">
          <button
            onClick={() => logout()}
            className="text-xs text-theme-text-muted hover:text-red-400 transition-colors"
          >
            Cerrar sesión e ir al inicio
          </button>
        </div>
      </div>
    </div>
  );
};
