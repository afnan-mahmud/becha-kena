import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  listingId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  revieweeId: mongoose.Types.ObjectId;
  rating: number;
  reviewText: string;
}

const reviewSchema = new Schema<IReview>(
  {
    listingId: {
      type: Schema.Types.ObjectId,
      ref: 'Listing',
      required: true,
      unique: true,
    },
    reviewerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    revieweeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    reviewText: {
      type: String,
      required: true,
      maxlength: 500,
    },
  },
  { timestamps: true }
);

reviewSchema.index({ listingId: 1 }, { unique: true });
reviewSchema.index({ revieweeId: 1 });

export const Review = mongoose.model<IReview>('Review', reviewSchema);
