import dotenv from 'dotenv';

dotenv.config();

const config = {
  PORT: process.env.PORT || 5000,
  MONGODB_URI: process.env.MONGODB_URI || '',
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || '',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || '',
  JWT_ACCESS_EXPIRY: process.env.JWT_ACCESS_EXPIRY || '15m',
  JWT_REFRESH_EXPIRY: process.env.JWT_REFRESH_EXPIRY || '7d',
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID || '',
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY || '',
  AWS_REGION: process.env.AWS_REGION || 'ap-south-1',
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET || '',
  NID_HASH_SALT: process.env.NID_HASH_SALT || '',
  NID_HASH_PEPPER: process.env.NID_HASH_PEPPER || '',
  PORICHOY_API_KEY: process.env.PORICHOY_API_KEY || '',
  PORICHOY_API_URL: process.env.PORICHOY_API_URL || '',
  SMS_API_KEY: process.env.SMS_API_KEY || '',
  SMS_API_URL: process.env.SMS_API_URL || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

if (!config.MONGODB_URI) {
  console.warn('Warning: MONGODB_URI is not set in environment variables');
}

export default config;
