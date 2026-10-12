// Chat and messaging types

export interface ChatParticipant {
  id: string;
  displayName: string;
  avatarUrl?: string;
  isVerified?: boolean;
}

export interface ChatMessage {
  id: string;
  _id?: string;
  roomId: string;
  senderId: string;
  text: string;
  createdAt: string;
  readBy?: string[];
}

export interface ChatRoom {
  id: string;
  _id?: string;
  participants: ChatParticipant[];
  listingId?: {
    id: string;
    title: string;
    price: number;
    images?: string[];
  };
  lastMessage?: {
    text: string;
    createdAt: string;
    senderId: string;
  };
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}
