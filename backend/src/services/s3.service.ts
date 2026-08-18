import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../config/s3';
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = process.env.AWS_S3_BUCKET || '';

export const generatePresignedUploadUrl = async (
  fileName: string,
  fileType: string,
  folder: string
) => {
  const allowedFileTypes = ['image/webp', 'image/jpeg', 'image/png'];
  if (!allowedFileTypes.includes(fileType)) {
    throw new Error('Invalid file type. Only webp, jpeg, and png are allowed.');
  }

  const uniqueId = uuidv4();
  // Sanitize file name to avoid spaces or weird characters if needed, but for now we just use it
  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
  const fileKey = `${folder}/${uniqueId}_${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes
  const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileKey}`;

  return { uploadUrl, fileUrl };
};

export const generatePresignedReadUrl = async (fileKey: string) => {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
  });

  const readUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes
  return readUrl;
};
