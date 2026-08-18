import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IVerificationLog extends Document {
  userId: mongoose.Types.ObjectId;
  nidHash: string;
  dob: Date;
  selfieUrl: string;
  verificationStatus: 'pending_review' | 'approved' | 'rejected';
  attemptsToday: number;
  lastAttemptDate: Date;
  manualReviewReason: string | null;
  verifiedBy: mongoose.Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const verificationLogSchema = new Schema<IVerificationLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    nidHash: {
      type: String,
      required: true,
    },
    dob: {
      type: Date,
      required: true,
    },
    selfieUrl: {
      type: String,
      required: true,
    },
    verificationStatus: {
      type: String,
      enum: ['pending_review', 'approved', 'rejected'],
      default: 'pending_review',
    },
    attemptsToday: {
      type: Number,
      default: 1,
      max: 3,
    },
    lastAttemptDate: {
      type: Date,
      default: Date.now,
    },
    manualReviewReason: {
      type: String,
      default: null,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
verificationLogSchema.index({ userId: 1 });
verificationLogSchema.index({ nidHash: 1 });
verificationLogSchema.index({ lastAttemptDate: -1 });

const VerificationLog: Model<IVerificationLog> = mongoose.model<IVerificationLog>('VerificationLog', verificationLogSchema);

export default VerificationLog;
