import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import type { Socket } from 'socket.io-client';
import { getRooms } from '../../services/chat.service';
import { useAuthStore } from '../../store/authStore';
import { UserAvatar } from '../ui/UserAvatar';
import { formatChatTime, formatNumber } from '../../utils/formatters';
import { PLACEHOLDER_IMAGE } from '../../utils/constants';
import './ChatRoomsList.css';

interface ChatRoomsListProps {
  activeRoomId?: string;
  socket: Socket | null;
  isConnected: boolean;
}

export const ChatRoomsList = ({ activeRoomId, isConnected }: ChatRoomsListProps) => {
  const { user } = useAuthStore();
  const [filter, setFilter] = useState('');

  // Live updates come from useUnreadCount (mounted in the header), which invalidates this query
  const { data, isLoading } = useQuery({ queryKey: ['chat-rooms'], queryFn: getRooms });

  const rooms = useMemo(() => {
    const list = data?.data || [];
    const q = filter.trim().toLowerCase();
    if (!q) return list;
    return list.filter((room) => {
      const other = room.sellerId === user?.id ? room.buyer : room.seller;
      return `${other?.displayName || ''} ${room.listing?.title || ''}`.toLowerCase().includes(q);
    });
  }, [data, filter, user?.id]);

  return (
    <div className="rooms">
      <div className="rooms__head">
        <h2>মেসেজ <span className={`rooms__status ${isConnected ? 'is-online' : ''}`} title={isConnected ? 'সংযুক্ত' : 'সংযোগ হচ্ছে…'} /></h2>
        <label className="rooms__search">
          <Search size={16} aria-hidden="true" />
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="নাম বা বিজ্ঞাপন খুঁজুন" aria-label="চ্যাট খুঁজুন" />
        </label>
      </div>

      <div className="rooms__list">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton rooms__skeleton" />)
        ) : rooms.length === 0 ? (
          <div className="rooms__empty">
            <p>{filter ? 'কিছু পাওয়া যায়নি' : 'এখনো কোনো চ্যাট নেই। কোনো বিজ্ঞাপন থেকে বিক্রেতার সাথে চ্যাট শুরু করুন।'}</p>
          </div>
        ) : (
          rooms.map((room) => {
            const iAmSeller = room.sellerId === user?.id;
            const other = iAmSeller ? room.buyer : room.seller;
            const last = room.lastMessage;
            const unread = room.unreadCount > 0 && activeRoomId !== room.id;

            return (
              <Link key={room.id} to={`/chat/${room.id}`} className={`room ${activeRoomId === room.id ? 'active' : ''} ${unread ? 'is-unread' : ''}`}>
                <div className="room__avatar">
                  <UserAvatar name={other?.displayName || 'U'} size="md" />
                  <img src={room.listing?.images?.[0] || PLACEHOLDER_IMAGE} alt="" className="room__thumb" />
                </div>
                <div className="room__body">
                  <div className="room__top">
                    <span className="room__name truncate">{other?.displayName || 'অজ্ঞাত'}</span>
                    <span className="room__time">{formatChatTime(last?.createdAt || room.updatedAt)}</span>
                  </div>
                  <div className="room__listing truncate">
                    <span className="room__role">{iAmSeller ? 'ক্রেতা' : 'বিক্রেতা'}</span> {room.listing?.title}
                  </div>
                  <div className="room__bottom">
                    <span className="room__last truncate">
                      {last ? `${last.senderId === user?.id ? 'আপনি: ' : ''}${last.messageText}` : 'চ্যাট শুরু করুন 👋'}
                    </span>
                    {unread && <span className="room__badge">{formatNumber(room.unreadCount)}</span>}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
};
