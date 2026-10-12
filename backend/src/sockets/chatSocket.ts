import { Server, Socket } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';
import User from '../models/User';
import { Types } from 'mongoose';
import ChatRoom from '../models/ChatRoom';
import Message from '../models/Message';
import * as chatService from '../services/chat.service';

/** Every socket also joins a personal channel so it gets messages for rooms it hasn't opened */
const userChannel = (userId: string) => `user:${userId}`;

const isParticipantOf = async (roomId: string, userId: string) => {
  if (!roomId || !Types.ObjectId.isValid(roomId)) return null;
  const room = await ChatRoom.findById(roomId);
  if (!room) return null;
  const isParticipant = room.buyerId.toString() === userId || room.sellerId.toString() === userId;
  return isParticipant ? room : null;
};

/**
 * Parses raw cookie header string into an object
 */
const parseCookies = (cookieHeader?: string): Record<string, string> => {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;

  cookieHeader.split(';').forEach((cookieStr) => {
    const parts = cookieStr.split('=');
    const name = parts[0]?.trim();
    const value = parts.slice(1).join('=').trim();
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
  });

  return cookies;
};

export const initializeChatSocket = (io: Server) => {
  const chatNamespace = io.of('/chat');

  // Authentication middleware for /chat namespace
  chatNamespace.use(async (socket: Socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      const token =
        cookies.accessToken ||
        (socket.handshake.auth?.token as string) ||
        (socket.handshake.query?.token as string);

      if (!token) {
        return next(new Error('Authentication failed: Token missing'));
      }

      const payload = verifyAccessToken(token);
      if (!payload || !payload.userId) {
        return next(new Error('Authentication failed: Invalid token'));
      }

      const user = await User.findById(payload.userId);
      if (!user) {
        return next(new Error('Authentication failed: User not found'));
      }

      if (user.status === 'suspended') {
        return next(new Error('Authentication failed: Account suspended'));
      }

      if (payload.tokenVersion !== user.tokenVersion) {
        return next(new Error('Authentication failed: Token revoked'));
      }

      if (!user.isVerified) {
        return next(new Error('Authentication failed: Verified account required'));
      }

      socket.data.userId = user._id.toString();
      socket.data.user = user;
      next();
    } catch (error: any) {
      return next(new Error('Authentication failed'));
    }
  });

  // Socket connection handlers
  chatNamespace.on('connection', (socket: Socket) => {
    const userId = socket.data.userId;
    console.log(`[ChatSocket] User connected: ${userId} (Socket ID: ${socket.id})`);
    socket.join(userChannel(userId));

    // 1. Join Room
    socket.on('join_room', async ({ roomId }: { roomId: string }, callback?: (res: any) => void) => {
      try {
        if (!roomId) {
          if (callback) callback({ success: false, error: 'roomId is required' });
          return;
        }

        const room = await isParticipantOf(roomId, userId);
        if (!room) {
          if (callback) callback({ success: false, error: 'Chat room not found or not a participant' });
          return;
        }

        socket.join(roomId);
        socket.emit('room_joined', { roomId });
        if (callback) callback({ success: true, roomId });
      } catch (err: any) {
        console.error('[ChatSocket] join_room error:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // 2. Send Message
    socket.on(
      'send_message',
      async (
        { roomId, messageText }: { roomId: string; messageText: string },
        callback?: (res: any) => void
      ) => {
        try {
          if (!roomId || !messageText) {
            if (callback) callback({ success: false, error: 'roomId and messageText are required' });
            return;
          }

          const result = await chatService.sendMessage(roomId, userId, messageText);

          // Deliver to everyone viewing the room + both participants' personal channels.
          // Socket.io de-duplicates, so each socket receives the event exactly once.
          chatNamespace
            .to(roomId)
            .to(userChannel(result.room.buyerId.toString()))
            .to(userChannel(result.room.sellerId.toString()))
            .emit('new_message', result.message);

          // If safety warnings exist, notify sender
          if (result.warnings && result.warnings.length > 0) {
            socket.emit('message_warning', {
              roomId,
              messageId: (result.message as any)._id,
              warnings: result.warnings,
            });
          }

          if (callback) callback({ success: true, data: { message: result.message, warnings: result.warnings } });
        } catch (err: any) {
          console.error('[ChatSocket] send_message error:', err);
          socket.emit('chat_error', {
            message: err.message,
            code: err.code || 'SEND_ERROR',
          });
          if (callback) callback({ success: false, error: err.message });
        }
      }
    );

    // 3. Leave Room (when the conversation screen closes)
    socket.on('leave_room', ({ roomId }: { roomId: string }) => {
      if (roomId) socket.leave(roomId);
    });

    // 4. User Typing Indicator (only relayed inside rooms this socket has joined)
    socket.on('typing', ({ roomId }: { roomId: string }) => {
      if (!roomId || !socket.rooms.has(roomId)) return;
      socket.to(roomId).emit('user_typing', { roomId, userId });
    });

    // 5. Mark Messages Read
    socket.on('mark_read', async ({ roomId }: { roomId: string }, callback?: (res: any) => void) => {
      try {
        const room = await isParticipantOf(roomId, userId);
        if (!room) {
          if (callback) callback({ success: false, error: 'Chat room not found or not a participant' });
          return;
        }

        await Message.updateMany(
          { roomId, senderId: { $ne: userId }, readStatus: false },
          { $set: { readStatus: true } }
        );

        chatNamespace
          .to(roomId)
          .to(userChannel(room.buyerId.toString()))
          .to(userChannel(room.sellerId.toString()))
          .emit('messages_read', { roomId, readBy: userId });
        if (callback) callback({ success: true });
      } catch (err: any) {
        console.error('[ChatSocket] mark_read error:', err);
        if (callback) callback({ success: false, error: err.message });
      }
    });

    // 6. Disconnect
    socket.on('disconnect', (reason) => {
      console.log(`[ChatSocket] User disconnected: ${userId} (Reason: ${reason})`);
    });
  });
};
