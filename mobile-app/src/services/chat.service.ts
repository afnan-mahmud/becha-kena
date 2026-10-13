import { apiClient } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import type { ChatRoom, MessagesPage, UserPreview } from '@/types/chat.types';

export const MESSAGES_PAGE_SIZE = 30;

export const chatService = {
  /** GET /chat/rooms — newest activity first */
  getRooms: () => apiClient.get<ChatRoom[]>(ENDPOINTS.CHAT.ROOMS),

  /** POST /chat/rooms { listingId } → existing or new room */
  createRoom: (listingId: string) => apiClient.post<ChatRoom>(ENDPOINTS.CHAT.ROOMS, { listingId }),

  /**
   * GET /chat/rooms/:roomId/messages — NEWEST FIRST.
   * Also marks the other person's messages as read on the server.
   */
  getMessages: (roomId: string, page = 1, limit = MESSAGES_PAGE_SIZE) =>
    apiClient.get<MessagesPage>(ENDPOINTS.CHAT.MESSAGES(roomId), { page, limit }),
};

/** The other participant of a room, from my point of view */
export const getOtherUser = (room: ChatRoom, myId?: string | null): UserPreview | null =>
  room.sellerId === myId ? room.buyer : room.seller;

/** Am I the seller in this room? */
export const isSellerInRoom = (room: ChatRoom, myId?: string | null) => room.sellerId === myId;

export default chatService;
