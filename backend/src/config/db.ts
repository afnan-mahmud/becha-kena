import mongoose from 'mongoose';
import config from './env';

export const connectDB = async () => {
  // Configure Mongoose to globally transform _id to id and remove __v when converting to JSON
  mongoose.set('toJSON', {
    virtuals: true,
    transform: (doc, ret: Record<string, any>) => {
      ret.id = ret._id;
      delete ret._id;
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
