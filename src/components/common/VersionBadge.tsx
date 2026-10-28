import React from 'react';
import { getFormattedAppVersion } from '../../constants/version';

export const VersionBadge: React.FC = () => {
  const versionString = getFormattedAppVersion();

  return (
    <div
      className="fixed bottom-2 right-3 z-40 pointer-events-none select-none flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-900/60 dark:bg-slate-950/70 backdrop-blur-md border border-slate-700/50 shadow-sm text-[11px] font-mono tracking-wider text-slate-300 transition-opacity"
      title={`ProcesStudio ${versionString}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
      <span className="font-semibold text-slate-200">{versionString}</span>
    </div>
  );
};

export default VersionBadge;
