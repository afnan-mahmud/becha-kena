import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';

const seedAdmin = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB Connected');

    const phoneNumber = '+8801791225000';

    // Check if user already exists
    const existingUser = await User.findOne({ phoneNumber });

    if (existingUser) {
      // Update existing user to admin
      existingUser.role = 'admin';
      await existingUser.save();
      console.log(`✅ Existing user (${phoneNumber}) updated to admin role.`);
    } else {
      // Create new admin user
      const adminUser = new User({
        phoneNumber,
        displayName: 'Admin',
        role: 'admin',
        status: 'active',
        isVerified: true,
      });
      await adminUser.save();
      console.log(`✅ Admin user created with phone: ${phoneNumber}`);
    }

    await mongoose.disconnect();
    console.log('✅ Done. Disconnected from MongoDB.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
