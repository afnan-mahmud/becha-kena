import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, AlertTriangle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

import { getRooms, getMessages } from '../../services/chat.service';
import { useAuthStore } from '../../store/authStore';
import { UserAvatar } from '../ui/UserAvatar';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { MessageBubble } from './MessageBubble';
import { formatPrice } from '../../utils/formatters';
import type { IMessage } from '../../types';
import { LoadingSpinner } from '../common/LoadingSpinner';

import './ChatConversation.css';

interface ChatConversationProps {
  roomId: string;
  socket: any;
}

export const ChatConversation = ({ roomId, socket }: ChatConversationProps) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 1. Fetch Room Details
  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: getRooms,
  });

  const room = roomsData?.data?.find(r => r.id === roomId);

  // 2. Fetch Messages with Infinite Query (Mock implementation of cursor/page based)
  const { 
    data: messagesData, 
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: ({ pageParam = 1 }) => getMessages(roomId, pageParam as number),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.data.page < lastPage.data.totalPages) return lastPage.data.page + 1;
      return undefined;
    },
    enabled: !!roomId,
  });

  // Flatten messages and reverse them to show oldest at top, newest at bottom
  // Assuming the API returns page 1 with the newest messages (descending).
  // We need to reverse them for UI display.
  const allMessages = messagesData?.pages.flatMap(page => page.data.items).reverse() || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Socket Events
  useEffect(() => {
    if (!socket || !roomId) return;

    // Join room
    socket.emit('join_room', { roomId });
    socket.emit('mark_read', { roomId }); // Mark opened room as read

    // Invalidate rooms to clear unread counts if we just opened it
    queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });

    const handleNewMessage = (message: IMessage) => {
      if (message.roomId === roomId) {
        // Optimistically add message
        queryClient.setQueryData(['chat-messages', roomId], (oldData: any) => {
          if (!oldData) return oldData;
          // Add to the first page (since it's the newest)
          const newPages = [...oldData.pages];
          if (newPages.length > 0) {
             const items = [message, ...newPages[0].data.items];
             newPages[0] = { ...newPages[0], data: { ...newPages[0].data, items } };
          }
          return { ...oldData, pages: newPages };
        });
        
        // Mark as read if we are receiving it while open
        if (message.senderId !== user?.id) {
          socket.emit('mark_read', { roomId });
        }
        
        scrollToBottom();
      }
    };

    const handleUserTyping = (data: { roomId: string, userId: string }) => {
      if (data.roomId === roomId && data.userId !== user?.id) {
        setIsTyping(true);
        // Auto hide typing indicator after 3 seconds
        setTimeout(() => setIsTyping(false), 3000);
      }
    };

    const handleMessageWarning = (data: { message: string }) => {
      toast.error(data.message);
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleUserTyping);
    socket.on('message_warning', handleMessageWarning);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('message_warning', handleMessageWarning);
    };
  }, [socket, roomId, queryClient, user?.id]);

  // Scroll to bottom on initial load
  useEffect(() => {
    if (allMessages.length > 0) {
      scrollToBottom();
    }
  }, [allMessages.length]);

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    
    if (socket && roomId) {
      socket.emit('typing', { roomId });
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(() => {
        // Emit stopped typing if API supports it, or just rely on timeout on receiver end
      }, 1000);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !roomId) return;

    const messageData = {
      roomId,
      messageText: inputText.trim()
    };

    socket.emit('send_message', messageData);
    
    // We rely on 'new_message' event to update UI (even for our own messages)
    // Or we could optimistically update here for immediate feedback.
    
    setInputText('');
  };

  // Handle Enter key to send
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (roomsLoading || messagesLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!room) {
    return (
      <div className="chat-conversation" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <p>রুম পাওয়া যায়নি</p>
      </div>
    );
  }

  const isSeller = user?.id === room.sellerId;
  const otherUser = isSeller ? room.buyer : room.seller;

  // Simple date grouping (for MVP)
  // In a real app, you'd iterate and insert <div className="date-separator"></div> where date changes

  return (
    <div className="chat-conversation">
      <div className="chat-conv-header">
        <div className="chat-conv-user-info">
          <button className="back-btn-mobile" onClick={() => navigate('/chat')}>
            <ArrowLeft size={24} />
          </button>
          <UserAvatar name={otherUser?.displayName || 'অজ্ঞাত'} size="sm" />
          <div className="chat-conv-user-details">
            <h2>
              {otherUser?.displayName || 'অজ্ঞাত ব্যবহারকারী'}
              {otherUser?.isVerified && <VerifiedBadge size="sm" />}
            </h2>
            <div className="chat-conv-listing-info">
              {room.listing?.images?.[0] && (
                <img src={room.listing.images[0]} alt="thumbnail" />
              )}
              <span className="chat-conv-listing-title">{room.listing?.title}</span>
              <span className="chat-conv-price">{formatPrice(room.listing?.price || 0)}</span>
            </div>
          </div>
        </div>
        <Link to={`/listings/${room.listingId}`} className="btn btn-outline btn-sm flex-center gap-1">
          <ExternalLink size={14} /> বিজ্ঞাপন দেখুন
        </Link>
      </div>

      <div className="chat-safety-banner">
        <AlertTriangle size={16} />
        <span>নিরাপত্তা: জনবহুল জায়গায় দেখা করুন। অগ্রিম টাকা পাঠাবেন না।</span>
      </div>

      <div className="chat-messages-area">
        {hasNextPage && (
          <div style={{ textAlign: 'center', padding: '1rem 0' }}>
            <button 
              className="btn btn-outline btn-sm" 
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'লোড হচ্ছে...' : 'আরও মেসেজ'}
            </button>
          </div>
        )}

        {/* Date separator example */}
        <div className="date-separator"><span>আজ</span></div>

        {allMessages.map((msg, index) => (
          <MessageBubble 
            key={msg.id || index} 
            message={msg} 
            isOwn={msg.senderId === user?.id} 
          />
        ))}

        {isTyping && (
          <div className="typing-indicator">
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
            <div className="typing-dot"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-area">
        <form className="chat-input-form" onSubmit={handleSendMessage}>
          <div className="chat-input-wrapper">
            <textarea
              className="chat-input"
              placeholder="মেসেজ লিখুন..."
              value={inputText}
              onChange={handleTyping}
              onKeyDown={handleKeyDown}
              rows={1}
            />
          </div>
          <button 
            type="submit" 
            className="btn-send"
            disabled={!inputText.trim() || !socket?.connected}
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};
