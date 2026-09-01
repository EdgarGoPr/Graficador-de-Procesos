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
    name: 'Antigravity Dark (Clásico)',
    description: 'Carbón gris oscuro y destellos azul cian profesionales.',
    badge: '🌑 Oscuro',
    category: 'dark',
    colors: {
      appBg: '#0F172A',
      canvasBg: '#18181B',
      surface: '#1E293B',
      surfaceSubtle: '#0B1120',
      surfaceHover: '#2B394E',
      card: '#1E293B',
      text: '#E2E8F0',
      textMuted: '#94A3B8',
      accent: '#38BDF8',
      accentHover: '#0284C7',
      border: '#334155',
      borderSubtle: '#1E293B',
      edgeColor: '#38BDF8',
      dotGridColor: '#3F3F46',
      isDark: true
    }
  },
  'antigravity-cosmic': {
    id: 'antigravity-cosmic',
    name: 'Antigravity Cosmic (Midnight)',
    description: 'Azul espacial profundo con acento azul eléctrico de alto contraste.',
    badge: '🪐 Cósmico',
    category: 'dark',
    colors: {
      appBg: '#090D16',
      canvasBg: '#0B0F19',
      surface: '#111827',
      surfaceSubtle: '#070A10',
      surfaceHover: '#1F2937',
      card: '#111827',
      text: '#F1F5F9',
      textMuted: '#9CA3AF',
      accent: '#3B82F6',
      accentHover: '#2563EB',
      border: '#1F2937',
      borderSubtle: '#111827',
      edgeColor: '#3B82F6',
      dotGridColor: '#374151',
      isDark: true
    }
  },
  'antigravity-emerald': {
    id: 'antigravity-emerald',
    name: 'Antigravity Cyber Emerald',
    description: 'Gris obsidiana con acentos neón esmeralda ISO 9001.',
    badge: '🌲 Esmeralda',
    category: 'dark',
    colors: {
      appBg: '#08100C',
      canvasBg: '#0C1712',
      surface: '#11221A',
      surfaceSubtle: '#060B08',
      surfaceHover: '#183327',
      card: '#11221A',
      text: '#ECFDF5',
      textMuted: '#6EE7B7',
      accent: '#10B981',
      accentHover: '#059669',
      border: '#1E3A2B',
      borderSubtle: '#11221A',
      edgeColor: '#10B981',
      dotGridColor: '#2D5A43',
      isDark: true
    }
  },
  'antigravity-purple': {
    id: 'antigravity-purple',
    name: 'Antigravity Nebula Violet',
    description: 'Púrpura espacial profundo y tonos neón violeta futuristas.',
    badge: '🔮 Nebulosa',
    category: 'dark',
    colors: {
      appBg: '#0E0919',
      canvasBg: '#130D24',
      surface: '#1B1333',
      surfaceSubtle: '#090510',
      surfaceHover: '#2A1E4F',
      card: '#1B1333',
      text: '#F3E8FF',
      textMuted: '#C084FC',
      accent: '#A855F7',
      accentHover: '#9333EA',
      border: '#33235E',
      borderSubtle: '#1B1333',
      edgeColor: '#A855F7',
      dotGridColor: '#4C338A',
      isDark: true
    }
  },
  'antigravity-light': {
    id: 'antigravity-light',
    name: 'Antigravity Light Studio',
    description: 'Estilo claro ultra nítido con azul cerúleo institucional.',
    badge: '☀️ Claro',
    category: 'light',
    colors: {
      appBg: '#F8F9FA',
      canvasBg: '#F1F3F5',
      surface: '#FFFFFF',
      surfaceSubtle: '#F1F5F9',
      surfaceHover: '#E2E8F0',
      card: '#FFFFFF',
      text: '#1E293B',
      textMuted: '#64748B',
      accent: '#0284C7',
      accentHover: '#0369A1',
      border: '#E2E8F0',
      borderSubtle: '#CBD5E1',
      edgeColor: '#0284C7',
      dotGridColor: '#CBD5E1',
      isDark: false
    }
  },
  'antigravity-solar': {
    id: 'antigravity-solar',
    name: 'Antigravity Warm Solar',
    description: 'Tonalidad arena cálida y ámbar suave para lectura prolongada.',
    badge: '🏖️ Cálido',
    category: 'light',
    colors: {
      appBg: '#FAF7F2',
      canvasBg: '#F3EDE2',
      surface: '#FFFFFF',
      surfaceSubtle: '#F8F4EC',
      surfaceHover: '#ECE3D4',
      card: '#FFFFFF',
      text: '#292524',
      textMuted: '#78716C',
      accent: '#D97706',
      accentHover: '#B45309',
      border: '#E7E0D3',
      borderSubtle: '#D6CBB8',
      edgeColor: '#D97706',
      dotGridColor: '#D6CBB8',
      isDark: false
    }
  },
  'custom': {
    id: 'custom',
    name: '🎨 Tema Personalizado',
    description: 'Paleta totalmente configurable por el usuario.',
    badge: '✨ Libre',
    category: 'custom',
    colors: {
      appBg: '#0F172A',
      canvasBg: '#18181B',
      surface: '#1E293B',
      surfaceSubtle: '#0B1120',
      surfaceHover: '#2B394E',
      card: '#1E293B',
      text: '#E2E8F0',
      textMuted: '#94A3B8',
      accent: '#38BDF8',
      accentHover: '#0284C7',
      border: '#334155',
      borderSubtle: '#1E293B',
      edgeColor: '#38BDF8',
      dotGridColor: '#3F3F46',
      isDark: true
    }
  }
};

/**
 * Applies the CSS variables to document.documentElement in real time
 */
export function applyThemeToDocument(colors: ThemeColors) {
  if (typeof document === 'undefined') return;

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

  root.classList.remove('dark', 'light');
  root.classList.add(colors.isDark ? 'dark' : 'light');
}
