import React from 'react';

interface LogoPSProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
}

export const LogoPS: React.FC<LogoPSProps> = ({
  size = 'md',
  showText = true,
  className = ''
}) => {
  const sizeMap = {
    xs: { box: 'w-6 h-6 rounded-md text-[10px]', text: 'text-xs', sub: 'text-[8px]' },
    sm: { box: 'w-7 h-7 rounded-lg text-xs', text: 'text-xs', sub: 'text-[9px]' },
    md: { box: 'w-8 h-8 rounded-lg text-sm', text: 'text-sm', sub: 'text-[10px]' },
    lg: { box: 'w-10 h-10 rounded-xl text-base', text: 'text-lg', sub: 'text-xs' },
    xl: { box: 'w-14 h-14 rounded-2xl text-xl', text: 'text-2xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div className={`flex items-center space-x-2.5 select-none ${className}`}>
      {/* Monogram PS Icon */}
      <div
        className={`relative flex items-center justify-center font-black tracking-tight font-mono text-white shadow-md transition-transform bg-gradient-to-br from-sky-500 via-indigo-600 to-teal-500 border border-white/20 ${currentSize.box}`}
        title="ProcesStudio"
      >
        <span className="drop-shadow-sm font-sans tracking-tighter">PS</span>
        {/* Subtle geometric dot accent */}
        <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-teal-400 border border-slate-900" />
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col leading-tight">
          <div className={`font-bold tracking-tight text-theme-text flex items-center ${currentSize.text}`}>
            <span>Proces</span>
            <span className="text-sky-400">Studio</span>
            <span className="ml-1.5 text-[9px] font-mono font-semibold bg-sky-500/10 text-sky-400 px-1.5 py-0.2 rounded border border-sky-500/25 uppercase">
              v2.9
            </span>
          </div>
          <div className={`text-theme-text-muted font-mono tracking-wider ${currentSize.sub}`}>
            BPMN 2.0 &bull; ISO 9001:2015
          </div>
        </div>
      )}
    </div>
  );
};
