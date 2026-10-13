import { create } from 'zustand';
import { chatService, MESSAGES_PAGE_SIZE } from '@/services/chat.service';
import { markRead as socketMarkRead, onSocketEvent } from '@/lib/socket';
import { toast } from '@/lib/toast';
import type { ChatRoom, Message } from '@/types/chat.types';

/**
 * Chat state (Prompt 28). Server data for rooms/messages lives here (not in
 * TanStack Query) because the socket mutates it in real time.
 */
export interface ChatState {
  rooms: ChatRoom[];
  roomsLoaded: boolean;
  roomsLoading: boolean;
  roomsError: string | null;
  /** oldest → newest (display order) */
  messagesByRoom: Record<string, Message[]>;
  pageByRoom: Record<string, number>;
  hasMoreByRoom: Record<string, boolean>;
  loadingByRoom: Record<string, boolean>;
  typingByRoom: Record<string, boolean>;
  activeRoomId: string | null;
  isConnected: boolean;
  /** derived: sum of room.unreadCount */
  totalUnread: number;

  fetchRooms: () => Promise<void>;
  upsertRoom: (room: ChatRoom) => void;
  fetchMessages: (roomId: string) => Promise<void>;
  fetchOlder: (roomId: string) => Promise<void>;
  addMessage: (message: Message) => void;
  markRoomRead: (roomId: string) => void;
  setTyping: (roomId: string, typing: boolean) => void;
  setActiveRoom: (roomId: string | null) => void;
  setConnected: (connected: boolean) => void;
  reset: () => void;
}

// Lazy require avoids a require cycle (auth.store → chat.store → auth.store)
const getMyId = (): string | undefined => {
  const { useAuthStore } = require('@/store/auth.store');
  return useAuthStore.getState().user?.id;
};

const sortRooms = (rooms: ChatRoom[]) =>
  [...rooms].sort((a, b) => new Date(b.latestActivity).getTime() - new Date(a.latestActivity).getTime());

const withRooms = (rooms: ChatRoom[]) => ({
  rooms,
  totalUnread: rooms.reduce((sum, r) => sum + (r.unreadCount || 0), 0),
});

/** Merge messages by id and keep them oldest → newest */
const mergeMessages = (existing: Message[], incoming: Message[]) => {
  const map = new Map<string, Message>();
  for (const m of existing) map.set(m.id, m);
  for (const m of incoming) map.set(m.id, { ...map.get(m.id), ...m });
  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
};

const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

const initialState = {
  rooms: [] as ChatRoom[],
  roomsLoaded: false,
  roomsLoading: false,
  roomsError: null as string | null,
  messagesByRoom: {} as Record<string, Message[]>,
  pageByRoom: {} as Record<string, number>,
  hasMoreByRoom: {} as Record<string, boolean>,
  loadingByRoom: {} as Record<string, boolean>,
  typingByRoom: {} as Record<string, boolean>,
  activeRoomId: null as string | null,
  isConnected: false,
  totalUnread: 0,
};

export const useChatStore = create<ChatState>((set, get) => ({
  ...initialState,

  fetchRooms: async () => {
    set({ roomsLoading: true, roomsError: null });
    try {
      const rooms = await chatService.getRooms();
      set({ ...withRooms(sortRooms(rooms)), roomsLoaded: true, roomsLoading: false });
    } catch (err) {
      set({
        roomsLoading: false,
        roomsError: err instanceof Error ? err.message : 'চ্যাট লোড করা যায়নি',
      });
    }
  },

  upsertRoom: (room) => {
    const others = get().rooms.filter((r) => r.id !== room.id);
    const existing = get().rooms.find((r) => r.id === room.id);
    set(withRooms(sortRooms([{ ...existing, ...room, unreadCount: room.unreadCount ?? existing?.unreadCount ?? 0, latestActivity: room.latestActivity ?? existing?.latestActivity ?? room.updatedAt }, ...others])));
  },

  fetchMessages: async (roomId) => {
    set((s) => ({ loadingByRoom: { ...s.loadingByRoom, [roomId]: true } }));
    try {
      // Page 1 also marks the other person's messages as read on the server
      const page = await chatService.getMessages(roomId, 1, MESSAGES_PAGE_SIZE);
      set((s) => ({
        messagesByRoom: {
          ...s.messagesByRoom,
          // keep anything that arrived over the socket while the request was running
          [roomId]: mergeMessages(s.messagesByRoom[roomId] ?? [], page.messages),
        },
        pageByRoom: { ...s.pageByRoom, [roomId]: 1 },
        hasMoreByRoom: { ...s.hasMoreByRoom, [roomId]: page.page < page.totalPages },
        loadingByRoom: { ...s.loadingByRoom, [roomId]: false },
      }));
    } catch (err) {
      set((s) => ({ loadingByRoom: { ...s.loadingByRoom, [roomId]: false } }));
      throw err;
    }
  },

  fetchOlder: async (roomId) => {
    const { hasMoreByRoom, loadingByRoom, pageByRoom } = get();
    if (!hasMoreByRoom[roomId] || loadingByRoom[roomId]) return;
    const nextPage = (pageByRoom[roomId] ?? 1) + 1;
    set((s) => ({ loadingByRoom: { ...s.loadingByRoom, [roomId]: true } }));
    try {
      const page = await chatService.getMessages(roomId, nextPage, MESSAGES_PAGE_SIZE);
      set((s) => ({
        messagesByRoom: { ...s.messagesByRoom, [roomId]: mergeMessages(s.messagesByRoom[roomId] ?? [], page.messages) },
        pageByRoom: { ...s.pageByRoom, [roomId]: nextPage },
        hasMoreByRoom: { ...s.hasMoreByRoom, [roomId]: page.page < page.totalPages },
        loadingByRoom: { ...s.loadingByRoom, [roomId]: false },
      }));
    } catch {
      set((s) => ({ loadingByRoom: { ...s.loadingByRoom, [roomId]: false } }));
    }
  },

  addMessage: (message) => {
    const myId = getMyId();
    const state = get();
    const existingMessages = state.messagesByRoom[message.roomId];
    const alreadyHave = existingMessages?.some((m) => m.id === message.id);

    const room = state.rooms.find((r) => r.id === message.roomId);
    if (!room) {
      // A brand-new conversation (e.g. someone just messaged about my ad)
      get().fetchRooms();
    }

    const isIncoming = message.senderId !== myId;
    const isOpen = state.activeRoomId === message.roomId;

    const rooms = room
      ? sortRooms(
          state.rooms.map((r) =>
            r.id === message.roomId
              ? {
                  ...r,
                  lastMessage: message,
                  latestActivity: message.createdAt,
                  unreadCount:
                    isIncoming && !isOpen && !alreadyHave ? (r.unreadCount || 0) + 1 : r.unreadCount,
                }
              : r
          )
        )
      : state.rooms;

    set({
      ...withRooms(rooms),
      // Only keep messages for rooms whose history has been loaded
      messagesByRoom: existingMessages
        ? { ...state.messagesByRoom, [message.roomId]: mergeMessages(existingMessages, [message]) }
        : state.messagesByRoom,
    });

    // The sender stopped typing once the message arrived
    if (isIncoming && state.typingByRoom[message.roomId]) {
      get().setTyping(message.roomId, false);
    }
  },

  markRoomRead: (roomId) => {
    set((s) => withRooms(s.rooms.map((r) => (r.id === roomId ? { ...r, unreadCount: 0 } : r))));
    socketMarkRead(roomId);
  },

  setTyping: (roomId, typing) => {
    const existing = typingTimers.get(roomId);
    if (existing) clearTimeout(existing);
    if (typing) {
      typingTimers.set(
        roomId,
        setTimeout(() => {
          typingTimers.delete(roomId);
          set((s) => ({ typingByRoom: { ...s.typingByRoom, [roomId]: false } }));
        }, 3000)
      );
    } else {
      typingTimers.delete(roomId);
    }
    set((s) => ({ typingByRoom: { ...s.typingByRoom, [roomId]: typing } }));
  },

  setActiveRoom: (activeRoomId) => set({ activeRoomId }),
  setConnected: (isConnected) => set({ isConnected }),

  reset: () => {
    typingTimers.forEach((t) => clearTimeout(t));
    typingTimers.clear();
    set({ ...initialState });
  },
}));

// ─── Socket wiring ───────────────────────────────────────────────────────────

let listenersReady = false;

/** Register the socket handlers ONCE for the whole app session */
export function setupSocketListeners() {
  if (listenersReady) return;
  listenersReady = true;
  const store = useChatStore.getState;

  onSocketEvent('connect', () => store().setConnected(true));
  onSocketEvent('disconnect', () => store().setConnected(false));

  onSocketEvent('new_message', (message) => {
    store().addMessage(message);
    // Banner / local notification for messages from the other person
    if (message.senderId !== getMyId()) {
      const { notifyIncomingMessage } = require('@/lib/notifications');
      notifyIncomingMessage(message);
    }
  });

  onSocketEvent('user_typing', ({ roomId, userId }) => {
    if (userId !== getMyId()) store().setTyping(roomId, true);
  });

  onSocketEvent('messages_read', ({ roomId, readBy }) => {
    if (readBy === getMyId()) return;
    const myId = getMyId();
    useChatStore.setState((s) => {
      const list = s.messagesByRoom[roomId];
      const rooms = s.rooms.map((r) =>
        r.id === roomId && r.lastMessage && r.lastMessage.senderId === myId
          ? { ...r, lastMessage: { ...r.lastMessage, readStatus: true } }
          : r
      );
      if (!list) return { rooms };
      return {
        rooms,
        messagesByRoom: {
          ...s.messagesByRoom,
          [roomId]: list.map((m) => (m.senderId === myId && !m.readStatus ? { ...m, readStatus: true } : m)),
        },
      };
    });
  });

  onSocketEvent('message_warning', ({ warnings }) => {
    if (warnings?.length) {
      toast.warning('মেসেজ সম্পর্কে সতর্কতা', { body: warnings.join('\n') });
    }
  });

  onSocketEvent('chat_error', ({ message }) => {
    if (message) toast.error('চ্যাট ত্রুটি', { body: message });
  });
}

/** Selector helper */
export const selectTotalUnread = (s: ChatState) => s.totalUnread;
