import { useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

// One shared connection for the whole app (header badge, chat list, conversation)
let sharedSocket: Socket | null = null;
let subscribers = 0;

const getSocket = () => {
  if (!sharedSocket) {
    sharedSocket = io(`${SOCKET_URL}/chat`, {
      withCredentials: true, // the httpOnly accessToken cookie authenticates the handshake
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return sharedSocket;
};

export const useSocket = () => {
  const { isAuthenticated, isVerified } = useAuthStore();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // The /chat namespace only accepts verified users
    if (!isAuthenticated || !isVerified) return;

    const s = getSocket();
    subscribers += 1;
    setSocket(s);
    setIsConnected(s.connected);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    if (!s.connected) s.connect();

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      subscribers -= 1;
      if (subscribers <= 0 && sharedSocket) {
        sharedSocket.disconnect();
        sharedSocket = null;
        subscribers = 0;
      }
    };
  }, [isAuthenticated, isVerified]);

  return { socket, isConnected };
};
