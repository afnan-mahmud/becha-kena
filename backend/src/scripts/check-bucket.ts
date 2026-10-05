import { S3Client, GetPublicAccessBlockCommand, GetBucketPolicyCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
dotenv.config();

const BUCKET_NAME = process.env.AWS_S3_BUCKET || '';

const client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
  }
});

async function checkBucket() {
  console.log(`Checking bucket: ${BUCKET_NAME}`);
  
  try {
    const pubAccessBlock = await client.send(new GetPublicAccessBlockCommand({ Bucket: BUCKET_NAME }));
    console.log('Public Access Block Configuration:', pubAccessBlock.PublicAccessBlockConfiguration);
  } catch (err: any) {
    if (err.name === 'NoSuchPublicAccessBlockConfiguration') {
      console.log('No Public Access Block Configuration found (meaning it is NOT blocking public access).');
    } else {
      console.error('Error fetching PublicAccessBlock:', err.message);
    }
  }

  try {
    const bucketPolicy = await client.send(new GetBucketPolicyCommand({ Bucket: BUCKET_NAME }));
    console.log('Bucket Policy:', bucketPolicy.Policy);
  } catch (err: any) {
    if (err.name === 'NoSuchBucketPolicy') {
      console.log('No Bucket Policy found. (This usually means objects are private by default).');
    } else {
      console.error('Error fetching Bucket Policy:', err.message);
    }
  }
}

checkBucket();
