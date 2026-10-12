import { create } from 'zustand';

export interface ChatState {
  activeRoomId: string | null;
  unreadCount: number;
  setActiveRoomId: (roomId: string | null) => void;
  setUnreadCount: (count: number) => void;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  activeRoomId: null,
  unreadCount: 0,
  setActiveRoomId: (activeRoomId) => set({ activeRoomId }),
  setUnreadCount: (unreadCount) => set({ unreadCount }),
  reset: () => set({ activeRoomId: null, unreadCount: 0 }),
}));
