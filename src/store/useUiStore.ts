import { create } from 'zustand';
import { AppThemeId, ThemeColors, PRESET_THEMES, applyThemeToDocument } from '../types/theme';

export type ActiveView = 'DASHBOARD' | 'CANVAS' | 'FLOWCHART' | 'SIPOC' | 'REPORT';
export type ThemeMode = 'dark' | 'light';
export type RightPanelTab = 'PROPERTIES' | 'NAVIGATOR';

interface UiStoreState {
  activeView: ActiveView;
  theme: ThemeMode;
  currentThemeId: AppThemeId;
  baseThemeId: AppThemeId; // Temática base activa sobre la cual se aplican personalizaciones
  customThemeColors: ThemeColors;
  isSidebarOpen: boolean;
  isPropertiesPanelOpen: boolean;
  activeRightTab: RightPanelTab;
  activeSubProcessNodeId: string | null;
  searchFilter: string;
  activeNotification: { message: string; type: 'success' | 'info' | 'error' } | null;
  isThemeModalOpen: boolean;

  setActiveView: (view: ActiveView) => void;
  setTheme: (theme: ThemeMode) => void;
  setAppTheme: (themeId: AppThemeId) => void;
  updateCustomTheme: (updates: Partial<ThemeColors>) => void;
  setCanvasBgColor: (color: string) => void;
  setThemeModalOpen: (open: boolean) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  togglePropertiesPanel: () => void;
  setPropertiesPanelOpen: (open: boolean) => void;
  setActiveRightTab: (tab: RightPanelTab) => void;
  openSubProcessDetail: (nodeId: string) => void;
  closeSubProcessDetail: () => void;
  setSearchFilter: (query: string) => void;
  showNotification: (message: string, type?: 'success' | 'info' | 'error') => void;
  clearNotification: () => void;
}

const getInitialBaseThemeId = (): AppThemeId => {
  const savedBase = localStorage.getItem('procesos_base_theme_id') as AppThemeId;
  if (savedBase && PRESET_THEMES[savedBase] && savedBase !== 'custom') {
    return savedBase;
  }
  return 'antigravity-dark';
};

const getInitialThemeId = (): AppThemeId => {
  const savedId = localStorage.getItem('procesos_theme_id') as AppThemeId;
  if (savedId && PRESET_THEMES[savedId]) {
    return savedId;
  }
  return 'antigravity-dark';
};

const getInitialCustomTheme = (baseId: AppThemeId): ThemeColors => {
  const saved = localStorage.getItem('procesos_custom_theme');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  const basePreset = PRESET_THEMES[baseId] || PRESET_THEMES['antigravity-dark'];
  return { ...basePreset.colors };
};

const initStore = () => {
  const baseId = getInitialBaseThemeId();
  const themeId = getInitialThemeId();
  const customColors = getInitialCustomTheme(baseId);
  const colors = themeId === 'custom' ? customColors : (PRESET_THEMES[themeId]?.colors || customColors);
  applyThemeToDocument(colors);
  return {
    baseId,
    themeId,
    customColors,
    themeMode: colors.isDark ? ('dark' as ThemeMode) : ('light' as ThemeMode)
  };
};

const initialData = initStore();

export const useUiStore = create<UiStoreState>((set, get) => ({
  activeView: 'DASHBOARD',
  theme: initialData.themeMode,
  currentThemeId: initialData.themeId,
  baseThemeId: initialData.baseId,
  customThemeColors: initialData.customColors,
  isSidebarOpen: true,
  isPropertiesPanelOpen: true,
  activeRightTab: 'NAVIGATOR',
  activeSubProcessNodeId: null,
  searchFilter: '',
  activeNotification: null,
  isThemeModalOpen: false,

  setActiveView: (view) => set({ activeView: view }),

  setTheme: (theme) => {
    const targetThemeId = theme === 'dark' ? 'antigravity-dark' : 'antigravity-light';
    get().setAppTheme(targetThemeId);
  },

  /**
   * Sets the active base theme.
   * Copies the full preset color scheme as the new baseline for subsequent customizations.
   */
  setAppTheme: (themeId) => {
    localStorage.setItem('procesos_theme_id', themeId);
    
    if (themeId !== 'custom') {
      const presetColors = PRESET_THEMES[themeId].colors;
      localStorage.setItem('procesos_base_theme_id', themeId);
      localStorage.setItem('procesos_custom_theme', JSON.stringify(presetColors));
      applyThemeToDocument(presetColors);
      set({
        baseThemeId: themeId,
        currentThemeId: themeId,
        customThemeColors: { ...presetColors },
        theme: presetColors.isDark ? 'dark' : 'light'
      });
    } else {
      const currentCustom = get().customThemeColors;
      applyThemeToDocument(currentCustom);
      set({
        currentThemeId: 'custom',
        theme: currentCustom.isDark ? 'dark' : 'light'
      });
    }
  },

  /**
   * Updates specific color variables while keeping the rest derived from the active base theme.
   */
  updateCustomTheme: (updates) => {
    const baseId = get().baseThemeId;
    const baseColors = PRESET_THEMES[baseId]?.colors || get().customThemeColors;
    
    // Merge: base colors + existing custom overrides + new updates
    const nextCustom: ThemeColors = {
      ...baseColors,
      ...get().customThemeColors,
      ...updates
    };

    localStorage.setItem('procesos_custom_theme', JSON.stringify(nextCustom));
    localStorage.setItem('procesos_theme_id', 'custom');
    applyThemeToDocument(nextCustom);
    
    set({
      currentThemeId: 'custom',
      customThemeColors: nextCustom,
      theme: nextCustom.isDark ? 'dark' : 'light'
    });
  },

  /**
   * Modifies only the canvas background color, maintaining the entire active base theme.
   */
  setCanvasBgColor: (color) => {
    get().updateCustomTheme({ canvasBg: color });
  },

  setThemeModalOpen: (open) => set({ isThemeModalOpen: open }),

  toggleTheme: () => {
    const isCurrentlyDark = get().theme === 'dark';
    const nextId = isCurrentlyDark ? 'antigravity-light' : 'antigravity-dark';
    get().setAppTheme(nextId);
  },

  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  togglePropertiesPanel: () => set((state) => ({ isPropertiesPanelOpen: !state.isPropertiesPanelOpen })),
  setPropertiesPanelOpen: (open) => set({ isPropertiesPanelOpen: open }),
  setActiveRightTab: (tab) => set({ activeRightTab: tab, isPropertiesPanelOpen: true }),
  openSubProcessDetail: (nodeId) => set({ activeSubProcessNodeId: nodeId }),
  closeSubProcessDetail: () => set({ activeSubProcessNodeId: null }),
  setSearchFilter: (query) => set({ searchFilter: query }),
  showNotification: (message, type = 'success') => {
    set({ activeNotification: { message, type } });
    setTimeout(() => {
      set({ activeNotification: null });
    }, 4000);
  },
  clearNotification: () => set({ activeNotification: null })
}));
