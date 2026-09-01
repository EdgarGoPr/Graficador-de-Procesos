export type AppThemeId =
  | 'antigravity-dark'
  | 'antigravity-cosmic'
  | 'antigravity-emerald'
  | 'antigravity-purple'
  | 'antigravity-light'
  | 'antigravity-solar'
  | 'custom';

export interface ThemeColors {
  appBg: string;
  canvasBg: string;
  surface: string;
  surfaceSubtle: string;
  surfaceHover: string;
  card: string;
  text: string;
  textMuted: string;
  accent: string;
  accentHover: string;
  border: string;
  borderSubtle: string;
  edgeColor: string;
  dotGridColor: string;
  isDark: boolean;
}

export interface AppThemeDefinition {
  id: AppThemeId;
  name: string;
  description: string;
  badge: string;
  category: 'dark' | 'light' | 'custom';
  colors: ThemeColors;
}

export interface CardThemePreset {
  id: string;
  name: string;
  description: string;
  bgColor: string;
  bgOpacity: number;
  borderColor: string;
  headerBgColor: string;
  headerTextColor?: string;
  badgeBg: string;
}

export const CARD_THEME_PRESETS: CardThemePreset[] = [
  {
    id: 'slate-pro',
    name: 'Pizarra Slate Pro',
    description: 'Fondo grafito mate, borde azul cielo y cabecera tenue.',
    bgColor: '#1E293B',
    bgOpacity: 95,
    borderColor: '#38BDF8',
    headerBgColor: 'rgba(56, 189, 248, 0.15)',
    badgeBg: 'bg-sky-500/20 text-sky-300'
  },
  {
    id: 'midnight-steel',
    name: 'Midnight Acero',
    description: 'Azul espacial con ribete acero y cabecera relajante.',
    bgColor: '#151D2E',
    bgOpacity: 95,
    borderColor: '#60A5FA',
    headerBgColor: 'rgba(96, 165, 250, 0.15)',
    badgeBg: 'bg-blue-500/20 text-blue-300'
  },
  {
    id: 'forest-sage',
    name: 'Salvia Forestal',
    description: 'Verde salvia institucional para procesos ISO 9001.',
    bgColor: '#162522',
    bgOpacity: 95,
    borderColor: '#34D399',
    headerBgColor: 'rgba(52, 211, 153, 0.15)',
    badgeBg: 'bg-emerald-500/20 text-emerald-300'
  },
  {
    id: 'nebula-modern',
    name: 'Nebula Violeta',
    description: 'Grafito con acento lavanda suave y cabecera violeta.',
    bgColor: '#1A162D',
    bgOpacity: 95,
    borderColor: '#A78BFA',
    headerBgColor: 'rgba(167, 139, 250, 0.15)',
    badgeBg: 'bg-purple-500/20 text-purple-300'
  },
  {
    id: 'warm-amber',
    name: 'Ámbar Cálido',
    description: 'Tono ocre y madera para hitos normativos y auditorías.',
    bgColor: '#231B15',
    bgOpacity: 95,
    borderColor: '#F59E0B',
    headerBgColor: 'rgba(245, 158, 11, 0.15)',
    badgeBg: 'bg-amber-500/20 text-amber-300'
  },
  {
    id: 'glass-frost',
    name: 'Vidrio Esmerilado',
    description: 'Transparencia alta (55%) para integración con el lienzo.',
    bgColor: '#1E293B',
    bgOpacity: 55,
    borderColor: '#94A3B8',
    headerBgColor: 'rgba(255, 255, 255, 0.08)',
    badgeBg: 'bg-slate-500/20 text-slate-300'
  },
  {
    id: 'nordic-light',
    name: 'Nórdico Studio Claro',
    description: 'Fondo blanco níveo con borde cian y cabecera fresca.',
    bgColor: '#FFFFFF',
    bgOpacity: 100,
    borderColor: '#0284C7',
    headerBgColor: 'rgba(2, 132, 199, 0.10)',
    badgeBg: 'bg-sky-100 text-sky-800'
  },
  {
    id: 'sand-warm',
    name: 'Arena Suave',
    description: 'Fondo cálido papiro con borde ámbar y cabecera suave.',
    bgColor: '#FFFDF9',
    bgOpacity: 100,
    borderColor: '#D97706',
    headerBgColor: 'rgba(217, 119, 6, 0.10)',
    badgeBg: 'bg-amber-100 text-amber-900'
  }
];

export const PRESET_THEMES: Record<AppThemeId, AppThemeDefinition> = {
  'antigravity-dark': {
    id: 'antigravity-dark',
    name: 'ProcesStudio Slate Pro (Mate)',
    description: 'Grafito profundo y azul pizarra mate para máxima comodidad visual.',
    badge: '🌑 Slate Pro',
    category: 'dark',
    colors: {
      appBg: '#0F172A',
      canvasBg: '#131B2E',
      surface: '#1E293B',
      surfaceSubtle: '#151F32',
      surfaceHover: '#2A384F',
      card: '#1E293B',
      text: '#E2E8F0',
      textMuted: '#94A3B8',
      accent: '#38BDF8',
      accentHover: '#0284C7',
      border: '#334155',
      borderSubtle: '#1E293B',
      edgeColor: '#64748B',
      dotGridColor: '#334155',
      isDark: true
    }
  },
  'antigravity-cosmic': {
    id: 'antigravity-cosmic',
    name: 'Midnight Executive',
    description: 'Azul espacial suave con acento acero equilibrado.',
    badge: '🪐 Midnight',
    category: 'dark',
    colors: {
      appBg: '#0B101B',
      canvasBg: '#0F1626',
      surface: '#151D2E',
      surfaceSubtle: '#0D1422',
      surfaceHover: '#1E293F',
      card: '#151D2E',
      text: '#E2E8F0',
      textMuted: '#8DA0B8',
      accent: '#60A5FA',
      accentHover: '#3B82F6',
      border: '#25334D',
      borderSubtle: '#151D2E',
      edgeColor: '#64748B',
      dotGridColor: '#25334D',
      isDark: true
    }
  },
  'antigravity-emerald': {
    id: 'antigravity-emerald',
    name: 'Forest Sage ISO',
    description: 'Gris bosque con acento salvia y esmeralda mate relajante.',
    badge: '🌿 Salvia ISO',
    category: 'dark',
    colors: {
      appBg: '#0D1514',
      canvasBg: '#101B19',
      surface: '#162522',
      surfaceSubtle: '#0F1A17',
      surfaceHover: '#20332F',
      card: '#162522',
      text: '#E2E8F0',
      textMuted: '#8CA8A0',
      accent: '#34D399',
      accentHover: '#10B981',
      border: '#243D37',
      borderSubtle: '#162522',
      edgeColor: '#5E8077',
      dotGridColor: '#243D37',
      isDark: true
    }
  },
  'antigravity-purple': {
    id: 'antigravity-purple',
    name: 'Nebula Modern',
    description: 'Púrpura espacial profundo y lavanda suave mate.',
    badge: '🔮 Nebula',
    category: 'dark',
    colors: {
      appBg: '#100E1C',
      canvasBg: '#141224',
      surface: '#1A162D',
      surfaceSubtle: '#120F20',
      surfaceHover: '#262040',
      card: '#1A162D',
      text: '#E2E8F0',
      textMuted: '#9E95B8',
      accent: '#A78BFA',
      accentHover: '#8B5CF6',
      border: '#30284F',
      borderSubtle: '#1A162D',
      edgeColor: '#716494',
      dotGridColor: '#30284F',
      isDark: true
    }
  },
  'antigravity-light': {
    id: 'antigravity-light',
    name: 'Nordic Studio Light',
    description: 'Fondo perla claro ultra nítido con acentos cerúleos refinados.',
    badge: '☀️ Studio',
    category: 'light',
    colors: {
      appBg: '#F8FAFC',
      canvasBg: '#F1F5F9',
      surface: '#FFFFFF',
      surfaceSubtle: '#F8FAFC',
      surfaceHover: '#F1F5F9',
      card: '#FFFFFF',
      text: '#1E293B',
      textMuted: '#64748B',
      accent: '#0284C7',
      accentHover: '#0369A1',
      border: '#E2E8F0',
      borderSubtle: '#F1F5F9',
      edgeColor: '#94A3B8',
      dotGridColor: '#CBD5E1',
      isDark: false
    }
  },
  'antigravity-solar': {
    id: 'antigravity-solar',
    name: 'Warm Sandpaper',
    description: 'Tonalidad cálida arena y ámbar suave para lectura prolongada.',
    badge: '🏖️ Sandpaper',
    category: 'light',
    colors: {
      appBg: '#FAF7F2',
      canvasBg: '#F3EFE9',
      surface: '#FFFFFF',
      surfaceSubtle: '#FAF7F2',
      surfaceHover: '#F3EFE9',
      card: '#FFFFFF',
      text: '#292524',
      textMuted: '#78716C',
      accent: '#D97706',
      accentHover: '#B45309',
      border: '#E7DFD8',
      borderSubtle: '#F3EFE9',
      edgeColor: '#A8A29E',
      dotGridColor: '#D6CEC6',
      isDark: false
    }
  },
  'custom': {
    id: 'custom',
    name: 'Tema Personalizado (Custom Studio)',
    description: 'Paleta cromática configurada a medida por el usuario.',
    badge: '🎨 Custom',
    category: 'custom',
    colors: {
      appBg: '#0F172A',
      canvasBg: '#131B2E',
      surface: '#1E293B',
      surfaceSubtle: '#151F32',
      surfaceHover: '#2A384F',
      card: '#1E293B',
      text: '#E2E8F0',
      textMuted: '#94A3B8',
      accent: '#38BDF8',
      accentHover: '#0284C7',
      border: '#334155',
      borderSubtle: '#1E293B',
      edgeColor: '#64748B',
      dotGridColor: '#334155',
      isDark: true
    }
  }
};

/**
 * Converts a hex or rgb string with an opacity percentage (0-100) into a valid rgba() CSS color
 */
export function hexToRgba(colorStr?: string, opacityPercent: number = 100): string {
  if (!colorStr) return 'transparent';
  if (colorStr.startsWith('rgba')) {
    if (opacityPercent === 100) return colorStr;
    return colorStr.replace(/[\d\.]+\)$/, `${Math.max(0, Math.min(1, opacityPercent / 100))})`);
  }
  if (colorStr.startsWith('rgb(')) {
    const rgbValues = colorStr.replace('rgb(', '').replace(')', '');
    return `rgba(${rgbValues}, ${Math.max(0, Math.min(1, opacityPercent / 100))})`;
  }
  let hex = colorStr.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map((x) => x + x).join('');
  if (hex.length !== 6) return colorStr;
  const num = parseInt(hex, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const a = Math.max(0, Math.min(1, opacityPercent / 100));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Injects CSS Custom Variables into document.documentElement for dynamic real-time theme application
 */
export function applyThemeToDocument(colors: ThemeColors) {
  const root = document.documentElement;

  root.style.setProperty('--theme-bg', colors.appBg);
  root.style.setProperty('--theme-canvas-bg', colors.canvasBg);
  root.style.setProperty('--theme-surface', colors.surface);
  root.style.setProperty('--theme-surface-subtle', colors.surfaceSubtle);
  root.style.setProperty('--theme-surface-hover', colors.surfaceHover);
  root.style.setProperty('--theme-card', colors.card);
  root.style.setProperty('--theme-text', colors.text);
  root.style.setProperty('--theme-text-muted', colors.textMuted);
  root.style.setProperty('--theme-accent', colors.accent);
  root.style.setProperty('--theme-accent-hover', colors.accentHover);
  root.style.setProperty('--theme-border', colors.border);
  root.style.setProperty('--theme-border-subtle', colors.borderSubtle);
  root.style.setProperty('--theme-edge-color', colors.edgeColor);
  root.style.setProperty('--theme-dot-grid', colors.dotGridColor);

  if (colors.isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
}
