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

export const PRESET_THEMES: Record<AppThemeId, AppThemeDefinition> = {
  'antigravity-dark': {
    id: 'antigravity-dark',
    name: 'Antigravity Slate Dark (Mate)',
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
    name: 'Antigravity Cosmic (Midnight)',
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
    name: 'Antigravity Forest Sage',
    description: 'Gris bosque con acento salvia y esmeralda mate relajante.',
    badge: '🌿 Salvia',
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
    name: 'Antigravity Nebula Violet',
    description: 'Púrpura espacial profundo y lavanda suave mate.',
    badge: '🔮 Lavanda',
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
    name: 'Antigravity Light Studio',
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
    name: 'Antigravity Warm Solar',
    description: 'Tonalidad cálida arena y ámbar suave para lectura prolongada.',
    badge: '🏖️ Cálido',
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
    name: 'Tema Personalizado',
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
