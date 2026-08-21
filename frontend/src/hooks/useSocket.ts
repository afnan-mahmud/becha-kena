import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    // Only connect if the user is authenticated
    if (!isAuthenticated) {
      return;
    }

    if (!socketRef.current) {
      socketRef.current = io(`${SOCKET_URL}/chat`, {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });

      socketRef.current.on('connect', () => {
        setIsConnected(true);
      });

      socketRef.current.on('disconnect', () => {
        setIsConnected(false);
      });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setIsConnected(false);
      }
    };
  }, [isAuthenticated]);

  return {
    socket: socketRef.current,
    isConnected,
  };
};
