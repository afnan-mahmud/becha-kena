import mongoose from 'mongoose';
import config from './env';

export const connectDB = async () => {
  // Configure Mongoose to globally expose a string `id` (alongside `_id`) and remove __v when converting to JSON
  mongoose.set('toJSON', {
    virtuals: true,
    transform: (doc, ret: Record<string, any>) => {
      if (ret._id !== undefined) ret.id = String(ret._id);
      delete ret.__v;
      return ret;
    }
  });

  try {
    const conn = await mongoose.connect(config.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error connecting to MongoDB:`, error);
    process.exit(1);
  }
};
