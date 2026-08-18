import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITemporaryOtp extends Document {
  phoneNumber: string;
  otpCode: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const temporaryOtpSchema = new Schema<ITemporaryOtp>(
  {
    phoneNumber: {
      type: String,
      required: true,
      match: [/^\+8801[3-9]\d{8}$/, 'Please provide a valid Bangladeshi phone number in the format +8801XXXXXXXXX'],
    },
    otpCode: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      // Using a function ensures the default is calculated at document creation time, not schema evaluation time
      default: () => new Date(Date.now() + 180_000), 
    },
  },
  {
    timestamps: true,
  }
);

// TTL index for auto-deletion
temporaryOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for phone number searches
temporaryOtpSchema.index({ phoneNumber: 1 });

const TemporaryOtp: Model<ITemporaryOtp> = mongoose.model<ITemporaryOtp>('TemporaryOtp', temporaryOtpSchema);

export default TemporaryOtp;
