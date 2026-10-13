// Chat types — must match backend/src/services/chat.service.ts (serializeRoom / serializeMessage)
import type { ListingStatus } from './listing.types';

export interface UserPreview {
  id: string;
  displayName: string;
  verifiedName: string | null;
  isVerified: boolean;
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  sender: UserPreview | null;
  messageText: string;
  readStatus: boolean;
  createdAt: string;
}

export interface ChatRoomListing {
  id: string;
  title: string;
  images: string[];
  price: number;
  status: ListingStatus;
  soldToBuyerId: string | null;
  sellerId: string;
}

export interface ChatRoom {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  listing: ChatRoomListing | null;
  buyer: UserPreview | null;
  seller: UserPreview | null;
  lastMessage: Message | null;
  unreadCount: number;
  latestActivity: string;
  createdAt: string;
  updatedAt: string;
}

/** GET /chat/rooms/:roomId/messages — messages are NEWEST FIRST */
export interface MessagesPage {
  messages: Message[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── Socket payloads ─────────────────────────────────────────────────────────

export interface TypingEvent {
  roomId: string;
  userId: string;
}

export interface ReadEvent {
  roomId: string;
  readBy: string;
}

export interface WarningEvent {
  roomId: string;
  messageId: string;
  warnings: string[];
}

export interface ChatErrorEvent {
  message: string;
  code: string;
}

export type SendMessageAck =
  | { success: true; data: { message: Message; warnings: string[] } }
  | { success: false; error: string };

export type JoinRoomAck = { success: boolean; roomId?: string; error?: string };
