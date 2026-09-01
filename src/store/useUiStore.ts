import { create } from 'zustand';

export type ActiveView = 'DASHBOARD' | 'CANVAS' | 'SIPOC' | 'REPORT';

interface UiStoreState {
  activeView: ActiveView;
  isSidebarOpen: boolean;
  isPropertiesPanelOpen: boolean;
  searchFilter: string;
  activeNotification: { message: string; type: 'success' | 'info' | 'error' } | null;

  setActiveView: (view: ActiveView) => void;
  toggleSidebar: () => void;
  togglePropertiesPanel: () => void;
  setPropertiesPanelOpen: (open: boolean) => void;
  setSearchFilter: (query: string) => void;
  showNotification: (message: string, type?: 'success' | 'info' | 'error') => void;
  clearNotification: () => void;
}

export const useUiStore = create<UiStoreState>((set) => ({
  activeView: 'DASHBOARD',
  isSidebarOpen: true,
  isPropertiesPanelOpen: true,
  searchFilter: '',
  activeNotification: null,

  setActiveView: (view) => set({ activeView: view }),
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
