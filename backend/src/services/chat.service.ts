import { Types } from 'mongoose';
import ChatRoom from '../models/ChatRoom';
import Message from '../models/Message';
import Listing from '../models/Listing';
import { AppError } from '../utils/AppError';
import { sanitizeMessage } from '../utils/chatFilters';
import { withIds, toIdString } from '../utils/serialize';

const LISTING_PREVIEW_FIELDS = 'title images price status soldToBuyerId sellerId';
const USER_PREVIEW_FIELDS = 'displayName verifiedName isVerified';

/**
 * Flattens a populated ChatRoom into a stable API shape:
 * ids are plain strings and the populated docs live in `listing`, `buyer`, `seller`.
 */
export const serializeRoom = (room: any) => {
  const plain = withIds(typeof room.toObject === 'function' ? room.toObject() : room);
  const listing = plain.listingId && typeof plain.listingId === 'object' ? plain.listingId : null;
  const buyer = plain.buyerId && typeof plain.buyerId === 'object' ? plain.buyerId : null;
  const seller = plain.sellerId && typeof plain.sellerId === 'object' ? plain.sellerId : null;

  return {
    ...plain,
    id: toIdString(plain._id),
    listingId: toIdString(plain.listingId),
    buyerId: toIdString(plain.buyerId),
    sellerId: toIdString(plain.sellerId),
    listing: listing
      ? { ...listing, soldToBuyerId: listing.soldToBuyerId ? toIdString(listing.soldToBuyerId) : null, sellerId: toIdString(listing.sellerId) }
      : null,
    buyer,
    seller,
  };
};

/**
 * Flattens a message: `senderId` and `roomId` are plain strings, populated sender lives in `sender`.
 */
export const serializeMessage = (message: any) => {
  const plain = withIds(typeof message.toObject === 'function' ? message.toObject() : message);
  const sender = plain.senderId && typeof plain.senderId === 'object' ? plain.senderId : null;
  return {
    ...plain,
    id: toIdString(plain._id),
    roomId: toIdString(plain.roomId),
    senderId: toIdString(plain.senderId),
    sender,
  };
};

/**
 * Gets an existing chat room or creates a new one between buyer, seller, and listing
 */
export const getOrCreateRoom = async (
  buyerId: string | Types.ObjectId,
  sellerId: string | Types.ObjectId,
  listingId: string | Types.ObjectId
) => {
  if (!Types.ObjectId.isValid(String(listingId))) {
    throw new AppError('Listing not found', 404, 'LISTING_NOT_FOUND');
  }

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
    .populate('listingId', LISTING_PREVIEW_FIELDS)
    .populate('buyerId', USER_PREVIEW_FIELDS)
    .populate('sellerId', USER_PREVIEW_FIELDS);

  return serializeRoom(room);
};

/**
 * Retrieves all chat rooms for a given user with latest message preview and unread count
 */
export const getRoomsForUser = async (userId: string | Types.ObjectId) => {
  const rooms = await ChatRoom.find({
    $or: [{ buyerId: userId }, { sellerId: userId }],
  })
    .populate('listingId', LISTING_PREVIEW_FIELDS)
    .populate('buyerId', USER_PREVIEW_FIELDS)
    .populate('sellerId', USER_PREVIEW_FIELDS)
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
        ...serializeRoom(room),
        lastMessage: lastMessage ? serializeMessage(lastMessage) : null,
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
  if (!Types.ObjectId.isValid(String(roomId))) {
    throw new AppError('Chat room not found', 404, 'ROOM_NOT_FOUND');
  }

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
      .populate('senderId', USER_PREVIEW_FIELDS)
      .lean(),
    Message.countDocuments({ roomId }),
  ]);

  // Mark unread messages sent to this user as read
  await Message.updateMany(
    { roomId, senderId: { $ne: userId }, readStatus: false },
    { $set: { readStatus: true } }
  );

  return {
    // Newest first — reverse on the client for display
    messages: messages.map(serializeMessage),
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
  if (!Types.ObjectId.isValid(String(roomId))) {
    throw new AppError('Chat room not found', 404, 'ROOM_NOT_FOUND');
  }

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

  if (sanitizedText.length > 1000) {
    throw new AppError('Message is too long (max 1000 characters)', 400, 'MESSAGE_TOO_LONG');
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
    .populate('senderId', USER_PREVIEW_FIELDS)
    .lean();

  return {
    message: serializeMessage(populatedMessage || message),
    room,
    warnings,
  };
};
