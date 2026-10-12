import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query';
import { ArrowLeft, SendHorizontal, ShieldAlert, Star, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Socket } from 'socket.io-client';
import { getMessages, getRooms } from '../../services/chat.service';
import { useAuthStore } from '../../store/authStore';
import { UserAvatar } from '../ui/UserAvatar';
import { VerifiedBadge } from '../ui/VerifiedBadge';
import { SubmitReviewModal } from '../review/SubmitReviewModal';
import { MessageBubble } from './MessageBubble';
import { formatDayLabel, formatPrice } from '../../utils/formatters';
import { PLACEHOLDER_IMAGE } from '../../utils/constants';
import type { ApiResponse, IMessage, MessagesPage } from '../../types';
import './ChatConversation.css';

interface ChatConversationProps {
  roomId: string;
  socket: Socket | null;
}

type MessagesCache = InfiniteData<ApiResponse<MessagesPage>, number>;

const MAX_LENGTH = 1000;

export const ChatConversation = ({ roomId, socket }: ChatConversationProps) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingEmit = useRef(0);

  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSafety, setShowSafety] = useState(true);
  const [reviewOpen, setReviewOpen] = useState(false);

  const { data: roomsData, isLoading: roomsLoading } = useQuery({ queryKey: ['chat-rooms'], queryFn: getRooms });
  const room = roomsData?.data?.find((r) => r.id === roomId);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ['chat-messages', roomId],
    queryFn: ({ pageParam }) => getMessages(roomId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.data.page < last.data.totalPages ? last.data.page + 1 : undefined),
  });

  // API pages are newest-first; flatten and reverse for display (oldest at top)
  const messages = useMemo(
    () => (data?.pages.flatMap((p) => p.data.messages) || []).slice().reverse(),
    [data]
  );

  const scrollToBottom = (smooth = true) => bottomRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' });

  useEffect(() => {
    if (!socket) return;

    socket.emit('join_room', { roomId });
    socket.emit('mark_read', { roomId });

    const onMessage = (message: IMessage) => {
      if (message.roomId !== roomId) return;
      queryClient.setQueryData<MessagesCache>(['chat-messages', roomId], (old) => {
        if (!old) return old;
        if (old.pages.some((p) => p.data.messages.some((m) => m.id === message.id))) return old;
        const [first, ...rest] = old.pages;
        return { ...old, pages: [{ ...first, data: { ...first.data, messages: [message, ...first.data.messages] } }, ...rest] };
      });
      if (message.senderId !== user?.id) {
        setIsTyping(false);
        socket.emit('mark_read', { roomId });
      }
      requestAnimationFrame(() => scrollToBottom());
    };

    const onTyping = (payload: { roomId: string; userId: string }) => {
      if (payload.roomId !== roomId || payload.userId === user?.id) return;
      setIsTyping(true);
      if (typingTimer.current) clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => setIsTyping(false), 3000);
    };

    const onRead = (payload: { roomId: string; readBy: string }) => {
      if (payload.roomId !== roomId || payload.readBy === user?.id) return;
      queryClient.setQueryData<MessagesCache>(['chat-messages', roomId], (old) =>
        old && {
          ...old,
          pages: old.pages.map((p) => ({
            ...p,
            data: { ...p.data, messages: p.data.messages.map((m) => (m.senderId === user?.id ? { ...m, readStatus: true } : m)) },
          })),
        }
      );
    };

    const onWarning = (payload: { roomId: string; warnings: string[] }) => {
      if (payload.roomId === roomId) payload.warnings.forEach((w) => toast(w, { icon: '⚠️' }));
    };

    socket.on('new_message', onMessage);
    socket.on('user_typing', onTyping);
    socket.on('messages_read', onRead);
    socket.on('message_warning', onWarning);

    return () => {
      socket.emit('leave_room', { roomId });
      socket.off('new_message', onMessage);
      socket.off('user_typing', onTyping);
      socket.off('messages_read', onRead);
      socket.off('message_warning', onWarning);
    };
  }, [socket, roomId, queryClient, user?.id]);

  // Opening a room marks it read on the server — refresh unread badges
  useEffect(() => {
    if (!isLoading) queryClient.invalidateQueries({ queryKey: ['chat-rooms'] });
  }, [isLoading, queryClient]);

  useEffect(() => {
    if (!isLoading) scrollToBottom(false);
  }, [isLoading]);

  const send = (e?: FormEvent) => {
    e?.preventDefault();
    const messageText = text.trim();
    if (!messageText || !socket) return;
    if (!socket.connected) {
      toast.error('সংযোগ নেই — একটু পর চেষ্টা করুন');
      return;
    }
    socket.emit('send_message', { roomId, messageText }, (res: { success: boolean; error?: string }) => {
      if (!res?.success) toast.error(res?.error || 'মেসেজ পাঠানো যায়নি');
    });
    setText('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleChange = (value: string) => {
    setText(value.slice(0, MAX_LENGTH));
    const now = Date.now();
    if (socket && now - lastTypingEmit.current > 1500) {
      socket.emit('typing', { roomId });
      lastTypingEmit.current = now;
    }
  };

  if (roomsLoading || isLoading) {
    return <div className="conv conv--loading"><span className="spinner" /></div>;
  }

  if (!room) {
    return (
      <div className="conv conv--loading">
        <p>চ্যাটটি পাওয়া যায়নি।</p>
        <Link to="/chat" className="btn btn-outline btn-sm">সব মেসেজ</Link>
      </div>
    );
  }

  const iAmSeller = room.sellerId === user?.id;
  const other = iAmSeller ? room.buyer : room.seller;
  const listing = room.listing;
  const canReview = !iAmSeller && listing?.status === 'sold' && listing.soldToBuyerId === user?.id;
  const closed = listing?.status && listing.status !== 'active';

  return (
    <div className="conv">
      <header className="conv__head">
        <button type="button" className="icon-btn conv__back" onClick={() => navigate('/chat')} aria-label="ফিরে যান">
          <ArrowLeft size={20} />
        </button>
        <UserAvatar name={other?.displayName || 'U'} size="sm" />
        <div className="conv__who">
          <div className="conv__name">
            <span className="truncate">{other?.displayName || 'অজ্ঞাত'}</span>
            {other?.isVerified && <VerifiedBadge size="sm" label="ভেরিফাইড" />}
          </div>
          <span className="conv__role">{iAmSeller ? 'ক্রেতা' : 'বিক্রেতা'}</span>
        </div>
      </header>

      {listing && (
        <Link to={`/listings/${listing.id}`} className="conv__listing">
          <img src={listing.images?.[0] || PLACEHOLDER_IMAGE} alt="" />
          <div className="conv__listing-text">
            <span className="truncate">{listing.title}</span>
            <strong>{formatPrice(listing.price)}</strong>
          </div>
          {listing.status === 'sold' && <span className="badge badge-blue">বিক্রিত</span>}
        </Link>
      )}

      {canReview && (
        <div className="conv__review">
          <Star size={18} />
          <span>আপনি এই পণ্যটি কিনেছেন! বিক্রেতাকে রিভিউ দিয়ে অন্যদের সাহায্য করুন।</span>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setReviewOpen(true)}>রিভিউ দিন</button>
        </div>
      )}

      {showSafety && (
        <div className="conv__safety">
          <ShieldAlert size={16} />
          <span>জনবহুল জায়গায় দেখা করুন। পণ্য না দেখে বিকাশ/নগদে অগ্রিম টাকা পাঠাবেন না।</span>
          <button type="button" onClick={() => setShowSafety(false)} aria-label="বন্ধ করুন"><X size={14} /></button>
        </div>
      )}

      <div className="conv__messages">
        {hasNextPage && (
          <button type="button" className="btn btn-ghost btn-sm conv__more" onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
            {isFetchingNextPage ? 'লোড হচ্ছে…' : 'পুরনো মেসেজ দেখুন'}
          </button>
        )}

        {messages.length === 0 && (
          <div className="conv__empty">
            <span aria-hidden="true">👋</span>
            <p>হ্যালো বলুন! পণ্যটি এখনো আছে কি না, দাম আলোচনা করা যাবে কি না জিজ্ঞেস করুন।</p>
          </div>
        )}

        {messages.map((msg, i) => {
          const day = formatDayLabel(msg.createdAt);
          const showDay = i === 0 || formatDayLabel(messages[i - 1].createdAt) !== day;
          return (
            <Fragment key={msg.id}>
              {showDay && <div className="conv__day"><span>{day}</span></div>}
              <MessageBubble message={msg} isOwn={msg.senderId === user?.id} />
            </Fragment>
          );
        })}

        {isTyping && (
          <div className="typing" aria-label="টাইপ করছে">
            <span /><span /><span />
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {closed ? (
        <div className="conv__closed">এই বিজ্ঞাপনটি আর সক্রিয় নেই — নতুন মেসেজ পাঠানো যাবে, তবে পণ্যটি হয়তো আর পাওয়া যাবে না।</div>
      ) : null}

      <form className="conv__input" onSubmit={send}>
        <textarea
          value={text}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="মেসেজ লিখুন…"
          rows={1}
          aria-label="মেসেজ"
        />
        <button type="submit" className="conv__send" disabled={!text.trim()} aria-label="পাঠান">
          <SendHorizontal size={20} />
        </button>
      </form>

      {listing && canReview && (
        <SubmitReviewModal
          isOpen={reviewOpen}
          onClose={() => setReviewOpen(false)}
          listingId={listing.id}
          sellerName={other?.displayName}
          listingTitle={listing.title}
        />
      )}
    </div>
  );
};
