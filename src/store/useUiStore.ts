import { create } from 'zustand';

export type ActiveView = 'DASHBOARD' | 'CANVAS' | 'SIPOC' | 'REPORT';
export type ThemeMode = 'dark' | 'light';

interface UiStoreState {
  activeView: ActiveView;
  theme: ThemeMode;
  isSidebarOpen: boolean;
  isPropertiesPanelOpen: boolean;
  searchFilter: string;
  activeNotification: { message: string; type: 'success' | 'info' | 'error' } | null;

  setActiveView: (view: ActiveView) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  togglePropertiesPanel: () => void;
  setPropertiesPanelOpen: (open: boolean) => void;
  setSearchFilter: (query: string) => void;
  showNotification: (message: string, type?: 'success' | 'info' | 'error') => void;
  clearNotification: () => void;
}

const getInitialTheme = (): ThemeMode => {
  const saved = localStorage.getItem('procesos_theme') as ThemeMode;
  if (saved === 'light' || saved === 'dark') {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(saved);
    }
    return saved;
  }
  if (typeof document !== 'undefined') {
    document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
  }
  return 'dark';
};

export const useUiStore = create<UiStoreState>((set) => ({
  activeView: 'DASHBOARD',
  theme: getInitialTheme(),
  isSidebarOpen: true,
  isPropertiesPanelOpen: true,
  searchFilter: '',
  activeNotification: null,

  setActiveView: (view) => set({ activeView: view }),
  setTheme: (theme) => {
    localStorage.setItem('procesos_theme', theme);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(theme);
    }
    set({ theme });
  },
  toggleTheme: () => {
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('procesos_theme', next);
      if (typeof document !== 'undefined') {
        document.documentElement.classList.remove('dark', 'light');
        document.documentElement.classList.add(next);
      }
      return { theme: next };
    });
  },
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  togglePropertiesPanel: () => set((state) => ({ isPropertiesPanelOpen: !state.isPropertiesPanelOpen })),
  setPropertiesPanelOpen: (open) => set({ isPropertiesPanelOpen: open }),
  setSearchFilter: (query) => set({ searchFilter: query }),
  showNotification: (message, type = 'success') => {
    set({ activeNotification: { message, type } });
    setTimeout(() => {
      set({ activeNotification: null });
    }, 4000);
  },
  clearNotification: () => set({ activeNotification: null })
}));

