import { AppState, AppStateStatus } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@/constants/api';
import { getAccessToken } from '@/lib/storage';
import type {
  ChatErrorEvent,
  JoinRoomAck,
  Message,
  ReadEvent,
  SendMessageAck,
  TypingEvent,
  WarningEvent,
} from '@/types/chat.types';

/**
 * Socket.io client singleton for the /chat namespace (Prompt 27).
 * See "Socket.io" in docs/mobile-app-prompts.md and backend/src/sockets/chatSocket.ts.
 *
 * - Only verified users may connect (the server rejects everyone else).
 * - The access token is read again before EVERY (re)connect attempt.
 * - Expired token → refresh once via api.ts, then reconnect; otherwise log out.
 * - Disconnects after 30s in the background, reconnects on foreground.
 * - Listeners are registered through `onSocketEvent` so they survive a new socket instance.
 */

export interface ServerToClientEvents {
  new_message: (message: Message) => void;
  user_typing: (e: TypingEvent) => void;
  messages_read: (e: ReadEvent) => void;
  message_warning: (e: WarningEvent) => void;
  chat_error: (e: ChatErrorEvent) => void;
  room_joined: (e: { roomId: string }) => void;
  connect: () => void;
  disconnect: (reason: string) => void;
}

type EventName = keyof ServerToClientEvents;
type AnyHandler = (...args: any[]) => void;

let socket: Socket | null = null;
/** true while the app WANTS a connection (logged in + verified) */
let shouldBeConnected = false;
let refreshAttempted = false;
let backgroundTimer: ReturnType<typeof setTimeout> | null = null;
let appStateSub: { remove: () => void } | null = null;
let connectPromise: Promise<Socket | null> | null = null;

const BACKGROUND_DISCONNECT_MS = 30_000;
const handlers = new Map<EventName, Set<AnyHandler>>();

// ─── Listener registry ───────────────────────────────────────────────────────

/** Subscribe to a server event. Works before/after connect; returns an unsubscribe fn. */
export function onSocketEvent<E extends EventName>(event: E, handler: ServerToClientEvents[E]): () => void {
  if (!handlers.has(event)) handlers.set(event, new Set());
  handlers.get(event)!.add(handler as AnyHandler);
  socket?.on(event as string, handler as AnyHandler);
  return () => {
    handlers.get(event)?.delete(handler as AnyHandler);
    socket?.off(event as string, handler as AnyHandler);
  };
}

const attachRegisteredHandlers = (s: Socket) => {
  handlers.forEach((set, event) => set.forEach((h) => s.on(event as string, h)));
};

// ─── Connection lifecycle ────────────────────────────────────────────────────

const handleConnectError = async (err: Error) => {
  const message = err?.message ?? '';

  // Unverified users are rejected for good — do not retry
  if (message.includes('Verified account required')) {
    shouldBeConnected = false;
    socket?.disconnect();
    return;
  }

  // Lazy requires avoid circular imports (api.ts / auth.store import this file indirectly)
  const logout = () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy require breaks an import cycle
    const { useAuthStore } = require('@/store/auth.store');
    useAuthStore.getState().localLogout();
  };

  if (message.includes('Account suspended')) {
    shouldBeConnected = false;
    logout();
    return;
  }

  if (message.includes('Token') || message.includes('Authentication failed')) {
    if (refreshAttempted) return; // the built-in reconnection keeps trying with backoff
    refreshAttempted = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- lazy require breaks an import cycle
      const { refreshAccessToken } = require('@/services/api');
      await refreshAccessToken();
      // Middleware rejections stop socket.io's auto-reconnect — reconnect manually
      if (shouldBeConnected) socket?.connect();
    } catch (refreshErr: unknown) {
      const isNetwork = refreshErr instanceof Error && /network/i.test(refreshErr.message);
      if (!isNetwork) {
        shouldBeConnected = false;
        logout();
      }
    }
  }
};

const handleAppStateChange = (state: AppStateStatus) => {
  if (state === 'active') {
    if (backgroundTimer) {
      clearTimeout(backgroundTimer);
      backgroundTimer = null;
    }
    if (shouldBeConnected && socket && !socket.connected) socket.connect();
  } else if (state === 'background') {
    if (backgroundTimer) clearTimeout(backgroundTimer);
    backgroundTimer = setTimeout(() => {
      socket?.disconnect();
      backgroundTimer = null;
    }, BACKGROUND_DISCONNECT_MS);
  }
};

/** Connect (or reuse) the /chat socket. Call only for logged-in, verified users. */
export function connectSocket(): Promise<Socket | null> {
  shouldBeConnected = true;
  if (socket?.connected) return Promise.resolve(socket);
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    const token = await getAccessToken();
    if (!token) return null;

    if (!socket) {
      socket = io(`${SOCKET_URL}/chat`, {
        // A function, so the LATEST token is read before every (re)connect attempt
        auth: (cb) => {
          getAccessToken()
            .then((t) => cb({ token: t ?? '' }))
            .catch(() => cb({ token: '' }));
        },
        transports: ['websocket'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 10000,
        autoConnect: false,
      });
      socket.on('connect', () => {
        refreshAttempted = false;
      });
      socket.on('connect_error', handleConnectError);
      attachRegisteredHandlers(socket);
    }

    if (!appStateSub) {
      appStateSub = AppState.addEventListener('change', handleAppStateChange);
    }

    if (!socket.connected) socket.connect();
    return socket;
  })().finally(() => {
    connectPromise = null;
  });

  return connectPromise;
}

/** Disconnect and throw the instance away (logout, account deletion). Listeners stay registered. */
export function disconnectSocket() {
  shouldBeConnected = false;
  refreshAttempted = false;
  if (backgroundTimer) {
    clearTimeout(backgroundTimer);
    backgroundTimer = null;
  }
  appStateSub?.remove();
  appStateSub = null;
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

export const getSocket = () => socket;
export const isSocketConnected = () => !!socket?.connected;

// ─── Typed emit helpers ──────────────────────────────────────────────────────

const ACK_TIMEOUT = 15_000;

export async function joinRoom(roomId: string): Promise<JoinRoomAck> {
  if (!socket?.connected) return { success: false, error: 'not connected' };
  try {
    return (await socket.timeout(ACK_TIMEOUT).emitWithAck('join_room', { roomId })) as JoinRoomAck;
  } catch {
    return { success: false, error: 'timeout' };
  }
}

export function leaveRoom(roomId: string) {
  socket?.emit('leave_room', { roomId });
}

/** Resolves with the saved (sanitised) message + warnings, rejects with a readable error */
export async function sendMessage(roomId: string, messageText: string) {
  if (!socket?.connected) {
    throw new Error('চ্যাট সার্ভারের সাথে সংযোগ নেই, একটু পরে আবার চেষ্টা করুন');
  }
  let ack: SendMessageAck;
  try {
    ack = (await socket.timeout(ACK_TIMEOUT).emitWithAck('send_message', { roomId, messageText })) as SendMessageAck;
  } catch {
    throw new Error('মেসেজ পাঠানো যায়নি (সময় শেষ), আবার চেষ্টা করুন');
  }
  if (!ack.success) throw new Error(ack.error || 'মেসেজ পাঠানো যায়নি');
  return ack.data;
}

const lastTypingAt = new Map<string, number>();
const TYPING_THROTTLE_MS = 1500;

/** Throttled to once per 1.5s per room */
export function sendTyping(roomId: string) {
  const now = Date.now();
  if (now - (lastTypingAt.get(roomId) ?? 0) < TYPING_THROTTLE_MS) return;
  lastTypingAt.set(roomId, now);
  socket?.emit('typing', { roomId });
}

export function markRead(roomId: string) {
  socket?.emit('mark_read', { roomId });
}
