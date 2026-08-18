import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IChatRoom extends Document {
  listingId: Types.ObjectId;
  buyerId: Types.ObjectId;
  sellerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const chatRoomSchema = new Schema<IChatRoom>(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
    },
    buyerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sellerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to ensure only ONE chat room exists between a specific buyer, seller, and listing
chatRoomSchema.index({ buyerId: 1, sellerId: 1, listingId: 1 }, { unique: true });

const ChatRoom = mongoose.model<IChatRoom>('ChatRoom', chatRoomSchema);

export default ChatRoom;
