import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBannedNid extends Document {
  nidHash: string;
  reason: string;
  bannedBy: mongoose.Types.ObjectId;
  bannedAt: Date;
}

const bannedNidSchema = new Schema<IBannedNid>(
  {
    nidHash: {
      type: String,
      required: true,
      unique: true,
    },
    reason: {
      type: String,
      required: true,
    },
    bannedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bannedAt: {
      type: Date,
      default: Date.now,
    },
  }
);

// Indexes
// The unique constraint on the nidHash field implicitly creates a unique index, 
// but we explicitly define it as requested.
bannedNidSchema.index({ nidHash: 1 }, { unique: true });

const BannedNid: Model<IBannedNid> = mongoose.model<IBannedNid>('BannedNid', bannedNidSchema);

export default BannedNid;
