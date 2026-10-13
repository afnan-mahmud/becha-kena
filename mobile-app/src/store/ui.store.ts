import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'system' | 'light' | 'dark';

export type InAppNotificationType = 'chat' | 'success' | 'warning' | 'error' | 'info';

export interface InAppNotification {
  id: string;
  type: InAppNotificationType;
  title: string;
  body?: string;
  /** Used by the chat variant to render an initial-letter avatar */
  avatarName?: string;
  onPress?: () => void;
}

export interface UiState {
  /** 'system' follows the OS setting */
  themeMode: ThemeMode;
  /** Default division for the home feed. null = সারা বাংলাদেশ */
  selectedDivision: string | null;
  /** In-app notification queue — the first item is the one on screen */
  notificationQueue: InAppNotification[];

  setThemeMode: (mode: ThemeMode) => void;
  setSelectedDivision: (division: string | null) => void;
  showNotification: (notification: Omit<InAppNotification, 'id'>) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
}

const MAX_QUEUE = 5;

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      themeMode: 'system',
      selectedDivision: null,
      notificationQueue: [],

      setThemeMode: (themeMode) => set({ themeMode }),
      setSelectedDivision: (selectedDivision) => set({ selectedDivision }),

      showNotification: (notification) =>
        set((state) => {
          const item: InAppNotification = {
            ...notification,
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
          };
          // Drop exact duplicates that are already waiting (e.g. the same network error twice)
          const isDuplicate = state.notificationQueue.some(
            (n) => n.type === item.type && n.title === item.title && n.body === item.body
          );
          if (isDuplicate) return state;
          return { notificationQueue: [...state.notificationQueue, item].slice(-MAX_QUEUE) };
        }),

      dismissNotification: (id) =>
        set((state) => ({
          notificationQueue: state.notificationQueue.filter((n) => n.id !== id),
        })),

      clearNotifications: () => set({ notificationQueue: [] }),
    }),
    {
      name: 'bk_ui_storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        themeMode: state.themeMode,
        selectedDivision: state.selectedDivision,
      }),
    }
  )
);
