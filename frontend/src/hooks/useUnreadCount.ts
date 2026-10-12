import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRooms } from '../services/chat.service';
import { useAuthStore } from '../store/authStore';
import { useSocket } from './useSocket';

/** Total unread chat messages, kept fresh by the shared socket */
export const useUnreadCount = () => {
  const { isAuthenticated, isVerified } = useAuthStore();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: getRooms,
    enabled: isAuthenticated && isVerified,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!socket) return;
    const refresh = () => queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
    socket.on('new_message', refresh);
    socket.on('messages_read', refresh);
    return () => {
      socket.off('new_message', refresh);
      socket.off('messages_read', refresh);
    };
  }, [socket, queryClient]);

  return (data?.data || []).reduce((sum, room) => sum + (room.unreadCount || 0), 0);
};
