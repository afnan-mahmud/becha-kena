import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  phoneNumber: string;
  displayName: string;
  verifiedName: string | null;
  isVerified: boolean;
  ageGroup: 'adult' | 'minor' | null;
  parentNIDHash: string | null;
  role: 'user' | 'moderator' | 'admin';
  status: 'active' | 'suspended' | 'inactive';
  tokenVersion: number;
  averageRating: number;
  totalReviews: number;
  fcmTokens: string[];
  lastLoginDate: Date;
  deletionRequestedAt: Date | null;
  minorTransitionDueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
      match: [/^\+8801[3-9]\d{8}$/, 'Please provide a valid Bangladeshi phone number in the format +8801XXXXXXXXX'],
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 30,
    },
    verifiedName: {
      type: String,
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    ageGroup: {
      type: String,
      enum: ['adult', 'minor', null],
      default: null,
    },
    parentNIDHash: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ['user', 'moderator', 'admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'inactive'],
      default: 'active',
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    fcmTokens: {
      type: [String],
      default: [],
    },
    lastLoginDate: {
      type: Date,
      default: Date.now,
    },
    deletionRequestedAt: {
      type: Date,
      default: null,
    },
    minorTransitionDueDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
userSchema.index({ status: 1 });
// Note: phoneNumber uniqueness implicitly creates a unique index, 
// but we can explicitly define it as requested just to be sure.
userSchema.index({ phoneNumber: 1 }, { unique: true });

const User: Model<IUser> = mongoose.model<IUser>('User', userSchema);

export default User;
