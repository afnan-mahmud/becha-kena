import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Listing from '../models/Listing';

dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    const latestListing = await Listing.findOne().sort({ createdAt: -1 });
    console.log('Latest listing images:', latestListing?.images);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
