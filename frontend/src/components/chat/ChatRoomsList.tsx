import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getRooms } from '../../services/chat.service';
import { useAuthStore } from '../../store/authStore';
import { UserAvatar } from '../ui/UserAvatar';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { formatRelativeTime } from '../../utils/formatters';
import type { IChatRoom, IMessage } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';
import './ChatRoomsList.css';

interface ChatRoomsListProps {
  activeRoomId?: string;
  socket: any;
}

export const ChatRoomsList = ({ activeRoomId, socket }: ChatRoomsListProps) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const { data: roomsData, isLoading } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: getRooms,
  });

  const rooms = roomsData?.data || [];

  // Listen for new messages to update the last message and unread count
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: IMessage) => {
      queryClient.setQueryData(['chat-rooms'], (oldData: any) => {
        if (!oldData?.data) return oldData;
        
        const updatedRooms = oldData.data.map((room: IChatRoom) => {
          if (room.id === message.roomId) {
            return {
              ...room,
              lastMessage: message.messageText,
              updatedAt: message.createdAt,
              // If it's not the active room and we aren't the sender, increment unread count
              unreadCount: (activeRoomId !== room.id && message.senderId !== user?.id) 
                ? (room.unreadCount || 0) + 1 
                : room.unreadCount
            };
          }
          return room;
        });

        // Sort to bring the updated room to the top
        updatedRooms.sort((a: IChatRoom, b: IChatRoom) => 
          new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
        );

        return { ...oldData, data: updatedRooms };
      });
    };

    socket.on('new_message', handleNewMessage);
    
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, queryClient, activeRoomId, user?.id]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="chat-rooms-list">
      <div className="chat-rooms-header">
        <h2>মেসেজ</h2>
      </div>
      
      {rooms.length === 0 ? (
        <div className="chat-rooms-empty">
          <p>আপনার কোনো চ্যাট হিস্ট্রি নেই</p>
        </div>
      ) : (
        rooms.map(room => {
          const isSeller = user?.id === room.sellerId;
          const otherUser = isSeller ? room.buyer : room.seller;
          
          return (
            <Link 
              key={room.id} 
              to={`/chat/${room.id}`}
              className={`chat-room-item ${activeRoomId === room.id ? 'active' : ''}`}
            >
              <UserAvatar name={otherUser?.displayName || 'অজ্ঞাত'} size="md" />
              
              <div className="chat-room-content">
                <div className="chat-room-top">
                  <h3 className="chat-room-name">
                    {otherUser?.displayName || 'অজ্ঞাত ব্যবহারকারী'}
                    {otherUser?.isVerified && <VerifiedBadge size="sm" />}
                  </h3>
                  <span className="chat-room-time">
                    {room.updatedAt ? formatRelativeTime(room.updatedAt) : ''}
                  </span>
                </div>
                
                <div className="chat-room-listing">
                  {room.listing?.title}
                </div>
                
                <div className="chat-room-bottom">
                  <p className="chat-room-last-msg">
                    {room.lastMessage || 'কোনো মেসেজ নেই'}
                  </p>
                  {room.unreadCount > 0 && activeRoomId !== room.id && (
                    <span className="chat-room-unread">{room.unreadCount}</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
};
