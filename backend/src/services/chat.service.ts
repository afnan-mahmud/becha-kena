import { Types } from 'mongoose';
import ChatRoom from '../models/ChatRoom';
import Message from '../models/Message';
import Listing from '../models/Listing';
import { AppError } from '../utils/AppError';
import { sanitizeMessage } from '../utils/chatFilters';

/**
 * Gets an existing chat room or creates a new one between buyer, seller, and listing
 */
export const getOrCreateRoom = async (
  buyerId: string | Types.ObjectId,
  sellerId: string | Types.ObjectId,
  listingId: string | Types.ObjectId
) => {
  // 1. Validate listing exists and is active
  const listing = await Listing.findById(listingId);
  if (!listing) {
    throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
  }

  if (listing.status !== 'active') {
    throw new AppError('Cannot start a chat on an inactive or archived listing', 400, 'INACTIVE_LISTING');
  }

  // 2. Validate buyer is not seller
  if (buyerId.toString() === listing.sellerId.toString() || buyerId.toString() === sellerId.toString()) {
    throw new AppError('You cannot start a chat with yourself', 400, 'SELF_CHAT_NOT_ALLOWED');
  }

  // Ensure target seller matches the listing's actual seller
  const actualSellerId = listing.sellerId;

  // 3. Upsert chat room on compound key
  const room = await ChatRoom.findOneAndUpdate(
    { buyerId, sellerId: actualSellerId, listingId },
    { $setOnInsert: { buyerId, sellerId: actualSellerId, listingId } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )
    .populate('listingId', 'title images price status')
    .populate('buyerId', 'displayName verifiedName isVerified')
    .populate('sellerId', 'displayName verifiedName isVerified');

  return room;
};

/**
 * Retrieves all chat rooms for a given user with latest message preview and unread count
 */
export const getRoomsForUser = async (userId: string | Types.ObjectId) => {
  const rooms = await ChatRoom.find({
    $or: [{ buyerId: userId }, { sellerId: userId }],
  })
    .populate('listingId', 'title images price status')
    .populate('buyerId', 'displayName verifiedName isVerified')
    .populate('sellerId', 'displayName verifiedName isVerified')
    .lean();

  const roomsWithDetails = await Promise.all(
    rooms.map(async (room) => {
      const lastMessage = await Message.findOne({ roomId: room._id })
        .sort({ createdAt: -1 })
        .lean();

      const unreadCount = await Message.countDocuments({
        roomId: room._id,
        senderId: { $ne: userId },
        readStatus: false,
      });

      const latestActivity = lastMessage?.createdAt || room.updatedAt || room.createdAt;

      return {
        ...room,
        lastMessage: lastMessage || null,
        unreadCount,
        latestActivity,
      };
    })
  );

  // Sort by most recent activity descending
  roomsWithDetails.sort(
    (a, b) => new Date(b.latestActivity).getTime() - new Date(a.latestActivity).getTime()
  );

  return roomsWithDetails;
};

/**
 * Retrieves messages for a specific room with pagination and marks unread messages as read
 */
export const getMessages = async (
  roomId: string | Types.ObjectId,
  userId: string | Types.ObjectId,
  page: number | string = 1,
  limit: number | string = 50
) => {
  const room = await ChatRoom.findById(roomId);
  if (!room) {
    throw new AppError('Chat room not found', 404, 'ROOM_NOT_FOUND');
  }

  // Verify participant
  const isParticipant =
    room.buyerId.toString() === userId.toString() ||
    room.sellerId.toString() === userId.toString();

  if (!isParticipant) {
    throw new AppError('You are not a participant in this chat room', 403, 'FORBIDDEN');
  }

  const parsedPage = Math.max(1, parseInt(page as string, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 50));
  const skip = (parsedPage - 1) * parsedLimit;

  const [messages, total] = await Promise.all([
    Message.find({ roomId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parsedLimit)
      .populate('senderId', 'displayName verifiedName isVerified')
      .lean(),
    Message.countDocuments({ roomId }),
  ]);

  // Mark unread messages sent to this user as read
  await Message.updateMany(
    { roomId, senderId: { $ne: userId }, readStatus: false },
    { $set: { readStatus: true } }
  );

  return {
    messages,
    total,
    page: parsedPage,
    totalPages: Math.ceil(total / parsedLimit) || 1,
  };
};

/**
 * Validates, filters, and creates a new message in a room
 */
export const sendMessage = async (
  roomId: string | Types.ObjectId,
  senderId: string | Types.ObjectId,
  messageText: string
) => {
  const room = await ChatRoom.findById(roomId);
  if (!room) {
    throw new AppError('Chat room not found', 404, 'ROOM_NOT_FOUND');
  }

  const isParticipant =
    room.buyerId.toString() === senderId.toString() ||
    room.sellerId.toString() === senderId.toString();

  if (!isParticipant) {
    throw new AppError('You are not a participant in this chat room', 403, 'FORBIDDEN');
  }

  const { sanitizedText, warnings } = sanitizeMessage(messageText);

  if (!sanitizedText || sanitizedText.trim().length === 0) {
    throw new AppError('Message text cannot be empty', 400, 'EMPTY_MESSAGE');
  }

  const message = await Message.create({
    roomId,
    senderId,
    messageText: sanitizedText,
    readStatus: false,
  });

  // Update room's updatedAt timestamp
  await ChatRoom.findByIdAndUpdate(roomId, { updatedAt: new Date() });

  const populatedMessage = await Message.findById(message._id)
    .populate('senderId', 'displayName verifiedName isVerified')
    .lean();

  return {
    message: populatedMessage || message,
    warnings,
  };
};
