import React, { useId } from 'react';
import { useUiStore } from '../../store/useUiStore';
import { AppThemeId, PRESET_THEMES } from '../../types/theme';

interface LogoPSProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showSubtitle?: boolean;
  themeOverride?: AppThemeId;
  className?: string;
}

export const LogoPS: React.FC<LogoPSProps> = ({
  size = 'md',
  showText = true,
  showSubtitle,
  themeOverride,
  className = ''
}) => {
  const uniqueId = useId().replace(/:/g, '');
  const { currentThemeId, baseThemeId, customThemeColors } = useUiStore();

  const effectiveThemeId = themeOverride || currentThemeId || baseThemeId || 'antigravity-dark';
  const activeColors =
    effectiveThemeId === 'custom'
      ? {
          ...PRESET_THEMES[baseThemeId || 'antigravity-dark'].colors,
          ...customThemeColors
        }
      : (PRESET_THEMES[effectiveThemeId] || PRESET_THEMES['antigravity-dark']).colors;

  const gradStart = activeColors.logoGradStart || '#6366F1';
  const gradMid = activeColors.logoGradMid || activeColors.accent || '#0EA5E9';
  const gradEnd = activeColors.logoGradEnd || '#34D399';
  const wordPrimary = activeColors.logoWordPrimary || activeColors.text || '#FFFFFF';
  const wordAccent = activeColors.logoWordAccent || activeColors.accent || '#29B6F6';
  const subtitleColor = activeColors.logoSubtitle || activeColors.textMuted || '#B0BEC5';

  // Por defecto mostramos el subtítulo "PLATAFORMA DE PROCESOS" en tamaños md, lg y xl
  const shouldShowSubtitle = showSubtitle !== undefined ? showSubtitle : size !== 'xs';

  const sizeMap = {
    xs: {
      svg: 'w-7 h-6',
      title: 'text-xs',
      sub: 'text-[6px] tracking-[0.18em] mt-0',
      gap: 'space-x-1.5'
    },
    sm: {
      svg: 'w-9 h-7',
      title: 'text-sm',
      sub: 'text-[6.5px] tracking-[0.20em] -mt-0.5',
      gap: 'space-x-2'
    },
    md: {
      svg: 'w-11 h-9',
      title: 'text-[17px]',
      sub: 'text-[7px] tracking-[0.22em] -mt-0.5',
      gap: 'space-x-2.5'
    },
    lg: {
      svg: 'w-14 h-12',
      title: 'text-2xl',
      sub: 'text-[8.5px] tracking-[0.25em] mt-0.5',
      gap: 'space-x-3'
    },
    xl: {
      svg: 'w-20 h-16',
      title: 'text-3xl',
      sub: 'text-[10px] tracking-[0.27em] mt-1',
      gap: 'space-x-3.5'
    }
  };

  const currentSize = sizeMap[size] || sizeMap.md;
  const gradId = `ps-logo-grad-${uniqueId}`;
  const shadowId = `ps-logo-shadow-${uniqueId}`;

  return (
    <div
      className={`inline-flex items-center select-none font-brand ${currentSize.gap} ${className}`}
      title="ProcesStudio — Plataforma de Procesos"
    >
      {/* Isotipo Vectorial PS con Circuito de Proceso y Flechas */}
      <svg
        viewBox="0 0 116 98"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${currentSize.svg} shrink-0 overflow-visible`}
      >
        <defs>
          <linearGradient id={gradId} x1="8%" y1="92%" x2="92%" y2="8%">
            <stop offset="0%" stopColor={gradStart} />
            <stop offset="52%" stopColor={gradMid} />
            <stop offset="100%" stopColor={gradEnd} />
          </linearGradient>
          <filter id={shadowId} x="-12%" y="-12%" width="124%" height="124%">
            <feDropShadow
              dx="0"
              dy="2"
              stdDeviation="2"
              floodColor="#000000"
              floodOpacity={activeColors.isDark ? '0.45' : '0.16'}
            />
          </filter>
        </defs>

        <g filter={`url(#${shadowId})`}>
          {/* 1. Trazo principal de la letra P (izquierda) */}
          <path
            d="M 26 84 V 21 H 49 C 60 21 67 27.5 67 36.5 C 67 45.5 60 52 49 52 H 26"
            stroke={`url(#${gradId})`}
            strokeWidth="9.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Nodo circular en la base del asta vertical de la P */}
          <circle cx="26" cy="85" r="7" fill={`url(#${gradId})`} />

          {/* 2. Derivación inferior de P con flecha horizontal hacia S */}
          <path
            d="M 41 52 V 75 H 60"
            stroke={`url(#${gradId})`}
            strokeWidth="6.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M 56 67.5 L 68.5 75 L 56 82.5 Z"
            fill={`url(#${gradId})`}
          />

          {/* 3. Línea de flujo diagonal (circuito) que cruza P hacia el nodo cuadrado superior */}
          <path
            d="M 10 61 H 20 L 66 14 H 87"
            stroke={`url(#${gradId})`}
            strokeWidth="6.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Nodo circular inferior izquierdo del circuito */}
          <circle cx="10" cy="61" r="6.5" fill={`url(#${gradId})`} />
          {/* Nodo circular central dentro del bucle de la P */}
          <circle cx="44" cy="36.5" r="7.5" fill={`url(#${gradId})`} />
          {/* Nodo cuadrado redondeado en el extremo superior derecho */}
          <rect x="83" y="7" width="14" height="14" rx="3.5" fill={`url(#${gradId})`} />

          {/* 4. Letra S (derecha) */}
          <path
            d="M 99 35 C 95 27 87 24 78 25 C 68 26 63 32 64 39.5 C 65 47 74 50.5 85 55 C 95 59 101 65 100 74.5 C 99 84 89 90 77 89 C 68 88 62 84 59 79"
            stroke={`url(#${gradId})`}
            strokeWidth="9.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* 5. Flecha curva interna que acompaña el flujo hacia el interior de la S */}
          <path
            d="M 52 48 C 60 56 68 63 78 68"
            stroke={`url(#${gradId})`}
            strokeWidth="5.8"
            strokeLinecap="round"
          />
          <path
            d="M 75 60.5 L 86 70.5 L 71.5 72.5 Z"
            fill={`url(#${gradId})`}
          />
        </g>
      </svg>

      {/* Logotipo Tipográfico: ProcesStudio + PLATAFORMA DE PROCESOS */}
      {showText && (
        <div className="flex flex-col justify-center leading-none">
          <div className={`font-extrabold tracking-tight flex items-baseline ${currentSize.title}`}>
            <span style={{ color: wordPrimary }} className="not-italic font-extrabold">
              Proces
            </span>
            <span style={{ color: wordAccent }} className="italic font-extrabold ml-[1px]">
              Studio
            </span>
          </div>
          {shouldShowSubtitle && (
            <span
              style={{ color: subtitleColor }}
              className={`uppercase font-normal whitespace-nowrap ${currentSize.sub}`}
            >
              PLATAFORMA DE PROCESOS
            </span>
          )}
        </div>
      )}
    </div>
  );
};
