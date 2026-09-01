import { create } from 'zustand';
import { AppThemeId, ThemeColors, PRESET_THEMES, applyThemeToDocument } from '../types/theme';

export type ActiveView = 'DASHBOARD' | 'CANVAS' | 'SIPOC' | 'REPORT';
export type ThemeMode = 'dark' | 'light';
export type RightPanelTab = 'PROPERTIES' | 'NAVIGATOR';

interface UiStoreState {
  activeView: ActiveView;
  theme: ThemeMode;
  currentThemeId: AppThemeId;
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

const getInitialCustomTheme = (): ThemeColors => {
  const saved = localStorage.getItem('procesos_custom_theme');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {
      // fallback
    }
  }
  return PRESET_THEMES['antigravity-dark'].colors;
};

const getInitialThemeId = (): AppThemeId => {
  const savedId = localStorage.getItem('procesos_theme_id') as AppThemeId;
  if (savedId && PRESET_THEMES[savedId]) {
    return savedId;
  }
  return 'antigravity-dark';
};

const initStore = () => {
  const themeId = getInitialThemeId();
  const customColors = getInitialCustomTheme();
  const colors = themeId === 'custom' ? customColors : PRESET_THEMES[themeId].colors;
  applyThemeToDocument(colors);
  return {
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

  setAppTheme: (themeId) => {
    localStorage.setItem('procesos_theme_id', themeId);
    const colors = themeId === 'custom' ? get().customThemeColors : PRESET_THEMES[themeId].colors;
    applyThemeToDocument(colors);
    set({
      currentThemeId: themeId,
      theme: colors.isDark ? 'dark' : 'light'
    });
  },

  updateCustomTheme: (updates) => {
    const nextCustom = { ...get().customThemeColors, ...updates };
    localStorage.setItem('procesos_custom_theme', JSON.stringify(nextCustom));
    localStorage.setItem('procesos_theme_id', 'custom');
    applyThemeToDocument(nextCustom);
    set({
      currentThemeId: 'custom',
      customThemeColors: nextCustom,
      theme: nextCustom.isDark ? 'dark' : 'light'
    });
  },

  setCanvasBgColor: (color) => {
    const currentId = get().currentThemeId;
    if (currentId === 'custom') {
      get().updateCustomTheme({ canvasBg: color });
    } else {
      const activePreset = PRESET_THEMES[currentId].colors;
      get().updateCustomTheme({
        ...activePreset,
        canvasBg: color
      });
    }
  },

  setThemeModalOpen: (open) => set({ isThemeModalOpen: open }),

  toggleTheme: () => {
    const current = get().currentThemeId;
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
