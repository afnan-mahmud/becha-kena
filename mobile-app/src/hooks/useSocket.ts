import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { setupSocketListeners, useChatStore } from '@/store/chat.store';
import { connectSocket, disconnectSocket } from '@/lib/socket';

/**
 * Keeps ONE socket connection for the whole logged-in session (Prompt 27):
 * connects when the user is logged in AND verified, disconnects otherwise.
 * Mount once in the (app) layout.
 */
export function useSocket() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isVerified = useAuthStore((s) => s.user?.isVerified ?? false);
  const isConnected = useChatStore((s) => s.isConnected);

  useEffect(() => {
    if (isAuthenticated && isVerified) {
      setupSocketListeners();
      connectSocket();
      // Load rooms so the tab badge shows the unread count straight away
      useChatStore.getState().fetchRooms();
    } else {
      disconnectSocket();
      useChatStore.getState().setConnected(false);
    }
  }, [isAuthenticated, isVerified]);

  return { isConnected };
}

export default useSocket;
