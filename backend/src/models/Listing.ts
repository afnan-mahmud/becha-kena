import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IListing extends Document {
  sellerId: Types.ObjectId;
  title: string;
  description: string;
  price: number;
  category: string;
  condition?: 'new' | 'like_new' | 'used';
  images: string[];
  hidePhoneNumber: boolean;
  location: {
    type: 'Point';
    coordinates: number[]; // [longitude, latitude]
    addressLine?: string;
    division?: string;
    district?: string;
    thana?: string;
  };
  soldToBuyerId?: Types.ObjectId | null;
  status: 'pending' | 'active' | 'archived' | 'sold';
  moderationFlags: {
    flagType?: 'keyword' | 'image' | 'report' | 'manual' | null;
    flagReason?: string | null;
    reviewedBy?: Types.ObjectId | null;
  };
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const listingSchema = new Schema<IListing>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true, trim: true, minlength: 10, maxlength: 80 },
    description: { type: String, required: true, minlength: 50, maxlength: 500 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true },
    condition: { type: String, enum: ['new', 'like_new', 'used'] },
    images: { type: [String], required: true },
    hidePhoneNumber: { type: Boolean, default: false },
    location: {
      type: { type: String, enum: ['Point'], required: true, default: 'Point' },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
      addressLine: { type: String },
      division: { type: String },
      district: { type: String },
      thana: { type: String },
    },
    soldToBuyerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    status: {
      type: String,
      enum: ['pending', 'active', 'archived', 'sold'],
      default: 'pending',
    },
    moderationFlags: {
      flagType: {
        type: String,
        enum: ['keyword', 'image', 'report', 'manual', null],
        default: null,
      },
      flagReason: { type: String, default: null },
      reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    },
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

// Create a 2dsphere index on location
listingSchema.index({ location: '2dsphere' });

// Create compound indexes
listingSchema.index({ sellerId: 1, status: 1 });
listingSchema.index({ status: 1, expiresAt: 1 });

const Listing = mongoose.model<IListing>('Listing', listingSchema);

export default Listing;
