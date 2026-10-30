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
  // Tokens de Identidad Visual del Logotipo por Temática (PST-089)
  logoGradStart?: string;
  logoGradMid?: string;
  logoGradEnd?: string;
  logoWordPrimary?: string;
  logoWordAccent?: string;
  logoSubtitle?: string;
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
    name: 'ProcesStudio Slate Pro (Mate)',
    description: 'Fondo grafito mate, borde azul cian y cabecera tenue.',
    bgColor: '#1B263B',
    bgOpacity: 95,
    borderColor: '#29B6F6',
    headerBgColor: 'rgba(41, 182, 246, 0.15)',
    badgeBg: 'bg-sky-500/20 text-sky-300'
  },
  {
    id: 'midnight-steel',
    name: 'Midnight Executive',
    description: 'Azul ejecutivo espacial con ribete acero y cabecera equilibrada.',
    bgColor: '#131C31',
    bgOpacity: 95,
    borderColor: '#5B9BD5',
    headerBgColor: 'rgba(91, 155, 213, 0.15)',
    badgeBg: 'bg-blue-500/20 text-blue-300'
  },
  {
    id: 'forest-sage',
    name: 'Forest Sage',
    description: 'Verde bosque profundo y salvia institucional armónico.',
    bgColor: '#142E26',
    bgOpacity: 95,
    borderColor: '#57B894',
    headerBgColor: 'rgba(87, 184, 148, 0.15)',
    badgeBg: 'bg-emerald-500/20 text-emerald-300'
  },
  {
    id: 'nebula-modern',
    name: 'Nebula Modern',
    description: 'Púrpura espacial profundo con acento lavanda moderno.',
    bgColor: '#1F1333',
    bgOpacity: 95,
    borderColor: '#9F7AEA',
    headerBgColor: 'rgba(159, 122, 234, 0.15)',
    badgeBg: 'bg-purple-500/20 text-purple-300'
  },
  {
    id: 'nordic-light',
    name: 'Nordic Studio Light',
    description: 'Fondo blanco nórdico con borde azul océano/cerúleo.',
    bgColor: '#FFFFFF',
    bgOpacity: 100,
    borderColor: '#1A85B8',
    headerBgColor: 'rgba(26, 133, 184, 0.10)',
    badgeBg: 'bg-sky-100 text-sky-800'
  },
  {
    id: 'sand-warm',
    name: 'Warm Sandpaper',
    description: 'Fondo cálido papiro con borde ocre dorado y texto espresso.',
    bgColor: '#FFFDF9',
    bgOpacity: 100,
    borderColor: '#C87D20',
    headerBgColor: 'rgba(200, 125, 32, 0.12)',
    badgeBg: 'bg-amber-100 text-amber-900'
  },
  {
    id: 'warm-amber',
    name: 'Ámbar Cálido (Oscuro)',
    description: 'Tono ocre y madera oscura para hitos normativos y auditorías.',
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
    bgColor: '#1B263B',
    bgOpacity: 55,
    borderColor: '#94A3B8',
    headerBgColor: 'rgba(255, 255, 255, 0.08)',
    badgeBg: 'bg-slate-500/20 text-slate-300'
  }
];

export const PRESET_THEMES: Record<AppThemeId, AppThemeDefinition> = {
  'antigravity-dark': {
    id: 'antigravity-dark',
    name: 'ProcesStudio Slate Pro (Mate)',
    description: 'Azul pizarra mate profundo con isotipo tricolor (violeta-cian-esmeralda) y acento cian.',
    badge: '🌑 Slate Pro',
    category: 'dark',
    colors: {
      appBg: '#101726',
      canvasBg: '#141D2F',
      surface: '#1B263B',
      surfaceSubtle: '#131C2E',
      surfaceHover: '#24324C',
      card: '#1B263B',
      text: '#FFFFFF',
      textMuted: '#B0BEC5',
      accent: '#29B6F6',
      accentHover: '#0288D1',
      border: '#2B3A55',
      borderSubtle: '#1B263B',
      edgeColor: '#64748B',
      dotGridColor: '#2B3A55',
      isDark: true,
      logoGradStart: '#6366F1',
      logoGradMid: '#0EA5E9',
      logoGradEnd: '#34D399',
      logoWordPrimary: '#FFFFFF',
      logoWordAccent: '#29B6F6',
      logoSubtitle: '#C5D1DE'
    }
  },
  'antigravity-cosmic': {
    id: 'antigravity-cosmic',
    name: 'Midnight Executive',
    description: 'Azul medianoche ejecutivo con isotipo azul real a acero y tipografía corporativa.',
    badge: '🪐 Midnight',
    category: 'dark',
    colors: {
      appBg: '#090E1A',
      canvasBg: '#0C1322',
      surface: '#131C31',
      surfaceSubtle: '#0B1120',
      surfaceHover: '#1C2844',
      card: '#131C31',
      text: '#FFFFFF',
      textMuted: '#94A3B8',
      accent: '#5B9BD5',
      accentHover: '#3B82F6',
      border: '#22314E',
      borderSubtle: '#131C31',
      edgeColor: '#64748B',
      dotGridColor: '#22314E',
      isDark: true,
      logoGradStart: '#2563EB',
      logoGradMid: '#3B82F6',
      logoGradEnd: '#7AAEF2',
      logoWordPrimary: '#FFFFFF',
      logoWordAccent: '#5B9BD5',
      logoSubtitle: '#B0C0D4'
    }
  },
  'antigravity-emerald': {
    id: 'antigravity-emerald',
    name: 'Forest Sage',
    description: 'Verde bosque oscuro con isotipo esmeralda a salvia menta y ergonomía visual.',
    badge: '🌿 Forest Sage',
    category: 'dark',
    colors: {
      appBg: '#0A1914',
      canvasBg: '#0E211B',
      surface: '#142E26',
      surfaceSubtle: '#0C1D18',
      surfaceHover: '#1D3F35',
      card: '#142E26',
      text: '#FFFFFF',
      textMuted: '#98B4AA',
      accent: '#57B894',
      accentHover: '#10B981',
      border: '#21473B',
      borderSubtle: '#142E26',
      edgeColor: '#5E8077',
      dotGridColor: '#21473B',
      isDark: true,
      logoGradStart: '#10B981',
      logoGradMid: '#34D399',
      logoGradEnd: '#6EE7B7',
      logoWordPrimary: '#FFFFFF',
      logoWordAccent: '#57B894',
      logoSubtitle: '#A7C4B9'
    }
  },
  'antigravity-purple': {
    id: 'antigravity-purple',
    name: 'Nebula Modern',
    description: 'Violeta espacial profundo con isotipo púrpura a lavanda y estética vanguardista.',
    badge: '🔮 Nebula',
    category: 'dark',
    colors: {
      appBg: '#11091C',
      canvasBg: '#160D24',
      surface: '#1F1333',
      surfaceSubtle: '#140B21',
      surfaceHover: '#2B1B47',
      card: '#1F1333',
      text: '#FFFFFF',
      textMuted: '#A39BB5',
      accent: '#9F7AEA',
      accentHover: '#8B5CF6',
      border: '#342254',
      borderSubtle: '#1F1333',
      edgeColor: '#716494',
      dotGridColor: '#342254',
      isDark: true,
      logoGradStart: '#7C3AED',
      logoGradMid: '#9F7AEA',
      logoGradEnd: '#C4B5FD',
      logoWordPrimary: '#FFFFFF',
      logoWordAccent: '#9F7AEA',
      logoSubtitle: '#BEB4D4'
    }
  },
  'antigravity-light': {
    id: 'antigravity-light',
    name: 'Nordic Studio Light',
    description: 'Fondo blanco perla nórdico con texto azul marino profundo y acento cerúleo.',
    badge: '☀️ Nordic Light',
    category: 'light',
    colors: {
      appBg: '#F4F6F9',
      canvasBg: '#ECF0F5',
      surface: '#FFFFFF',
      surfaceSubtle: '#F4F6F9',
      surfaceHover: '#E6ECF4',
      card: '#FFFFFF',
      text: '#0F2942',
      textMuted: '#475569',
      accent: '#1A85B8',
      accentHover: '#0369A1',
      border: '#DCE3EC',
      borderSubtle: '#ECF0F5',
      edgeColor: '#94A3B8',
      dotGridColor: '#CBD5E1',
      isDark: false,
      logoGradStart: '#0C4A6E',
      logoGradMid: '#0284C7',
      logoGradEnd: '#06B6D4',
      logoWordPrimary: '#0F2942',
      logoWordAccent: '#1A85B8',
      logoSubtitle: '#0F2942'
    }
  },
  'antigravity-solar': {
    id: 'antigravity-solar',
    name: 'Warm Sandpaper',
    description: 'Fondo cálido arena papiro con tipografía marrón espresso y acento ocre dorado.',
    badge: '🏖️ Sandpaper',
    category: 'light',
    colors: {
      appBg: '#FAF6EE',
      canvasBg: '#F3EDE0',
      surface: '#FFFDF9',
      surfaceSubtle: '#FAF6EE',
      surfaceHover: '#EFE7D6',
      card: '#FFFDF9',
      text: '#3E1F0D',
      textMuted: '#6B4C35',
      accent: '#C87D20',
      accentHover: '#A86414',
      border: '#E6DEC8',
      borderSubtle: '#F3EDE0',
      edgeColor: '#A89882',
      dotGridColor: '#D6CBB5',
      isDark: false,
      logoGradStart: '#4A2511',
      logoGradMid: '#9A5518',
      logoGradEnd: '#E59838',
      logoWordPrimary: '#3E1F0D',
      logoWordAccent: '#C87D20',
      logoSubtitle: '#3E1F0D'
    }
  },
  'custom': {
    id: 'custom',
    name: 'Tema Personalizado (Custom Studio)',
    description: 'Paleta cromática configurada a medida por el usuario.',
    badge: '🎨 Custom',
    category: 'custom',
    colors: {
      appBg: '#101726',
      canvasBg: '#141D2F',
      surface: '#1B263B',
      surfaceSubtle: '#131C2E',
      surfaceHover: '#24324C',
      card: '#1B263B',
      text: '#FFFFFF',
      textMuted: '#B0BEC5',
      accent: '#29B6F6',
      accentHover: '#0288D1',
      border: '#2B3A55',
      borderSubtle: '#1B263B',
      edgeColor: '#64748B',
      dotGridColor: '#2B3A55',
      isDark: true,
      logoGradStart: '#6366F1',
      logoGradMid: '#0EA5E9',
      logoGradEnd: '#34D399',
      logoWordPrimary: '#FFFFFF',
      logoWordAccent: '#29B6F6',
      logoSubtitle: '#C5D1DE'
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

  // Tokens de Identidad del Logo
  root.style.setProperty('--theme-logo-grad-start', colors.logoGradStart || colors.accentHover);
  root.style.setProperty('--theme-logo-grad-mid', colors.logoGradMid || colors.accent);
  root.style.setProperty('--theme-logo-grad-end', colors.logoGradEnd || colors.accent);
  root.style.setProperty('--theme-logo-word-primary', colors.logoWordPrimary || colors.text);
  root.style.setProperty('--theme-logo-word-accent', colors.logoWordAccent || colors.accent);
  root.style.setProperty('--theme-logo-subtitle', colors.logoSubtitle || colors.textMuted);

  if (colors.isDark) {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.add('light');
    root.classList.remove('dark');
  }
}
