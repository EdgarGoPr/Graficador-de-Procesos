import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Clock, ShieldAlert } from 'lucide-react';

export const IdleWarningToast: React.FC = () => {
  const { inactivityWarningSeconds, dismissInactivityWarning } = useAuthStore();

  if (inactivityWarningSeconds === null) return null;

  return (
    <div className="fixed top-5 right-5 z-[90] max-w-sm p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 backdrop-blur-md shadow-2xl animate-slideDown text-theme-text flex items-start space-x-3">
      <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
        <Clock className="w-5 h-5 animate-spin" />
      </div>
      <div className="flex-1">
        <h4 className="text-xs font-bold text-amber-400 flex items-center space-x-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Aviso de Inactividad</span>
        </h4>
        <p className="text-[11px] text-theme-text-muted mt-0.5">
          Tu sesión se suspenderá automáticamente en 2 minutos para proteger la información del proceso.
        </p>
        <button
          onClick={dismissInactivityWarning}
          className="mt-2.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-[11px] hover:bg-amber-400 active:scale-95 transition-all"
        >
          Continuar Trabajando
        </button>
      </div>
    </div>
  );
};
