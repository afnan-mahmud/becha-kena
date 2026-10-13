import { Image } from 'react-native';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { apiClient } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import { ApiError } from '@/types/api.types';

export type MediaFolder = 'listings' | 'kyc' | 'avatars';
export type MediaFileType = 'image/jpeg' | 'image/png' | 'image/webp';

interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
}

const getImageSize = (uri: string) =>
  new Promise<{ width: number; height: number } | null>((resolve) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve(null)
    );
  });

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Only network / server hiccups are worth retrying — not 4xx validation errors */
const isRetryable = (err: unknown) => {
  if (err instanceof ApiError) return err.code === 'NETWORK_ERROR' || err.status >= 500;
  return true; // fetch() network failures, S3 5xx
};

/**
 * 1. POST /media/presigned-url → { uploadUrl, fileUrl }.
 * The URL expires in 5 minutes, so request it right before uploading.
 */
export const getPresignedUrl = (fileName: string, fileType: MediaFileType, folder: MediaFolder) =>
  apiClient.post<PresignedUrlResponse>(ENDPOINTS.MEDIA.PRESIGNED_URL, { fileName, fileType, folder });

/**
 * 2. Resize (never upscale) and re-encode as JPEG — accepted by the backend and
 * readable on every platform (HEIC photos from iPhones are converted too).
 */
export async function compressImage(
  uri: string,
  { maxWidth = 1280, quality = 0.75 }: { maxWidth?: number; quality?: number } = {}
): Promise<string> {
  const size = await getImageSize(uri);
  const context = ImageManipulator.manipulate(uri);
  if (!size || size.width > maxWidth) {
    context.resize({ width: maxWidth });
  }
  const image = await context.renderAsync();
  try {
    const result = await image.saveAsync({ compress: quality, format: SaveFormat.JPEG });
    return result.uri;
  } finally {
    image.release();
    context.release();
  }
}

/** 3. PUT the raw bytes to the presigned S3 URL */
export async function putToS3(localUri: string, uploadUrl: string, contentType: MediaFileType) {
  const body = await (await fetch(localUri)).blob();
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': contentType },
    body,
  });
  if (!res.ok) {
    throw new Error(`ছবি আপলোড ব্যর্থ হয়েছে (${res.status})`);
  }
}

/**
 * 4. compress → presign → PUT → return the public fileUrl.
 * Network failures are retried up to 3 times (1s, 2s, 4s).
 */
export async function uploadImage(localUri: string, folder: MediaFolder): Promise<string> {
  const compressedUri = await compressImage(localUri);
  const maxRetries = 3;

  for (let attempt = 0; ; attempt++) {
    try {
      const fileName = `photo_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`;
      const { uploadUrl, fileUrl } = await getPresignedUrl(fileName, 'image/jpeg', folder);
      await putToS3(compressedUri, uploadUrl, 'image/jpeg');
      return fileUrl;
    } catch (err) {
      if (attempt >= maxRetries || !isRetryable(err)) throw err;
      await wait(1000 * 2 ** attempt);
    }
  }
}

/**
 * 5. Uploads in parallel (max 3 at a time) and returns the fileUrls in the
 * same order as `uris`.
 */
export async function uploadMany(
  uris: string[],
  folder: MediaFolder,
  onProgress?: (done: number, total: number) => void
): Promise<string[]> {
  const results: string[] = new Array(uris.length);
  let next = 0;
  let done = 0;

  const worker = async () => {
    while (next < uris.length) {
      const index = next++;
      results[index] = await uploadImage(uris[index], folder);
      done++;
      onProgress?.(done, uris.length);
    }
  };

  await Promise.all(Array.from({ length: Math.min(3, uris.length) }, worker));
  return results;
}

export const mediaService = {
  getPresignedUrl,
  compressImage,
  putToS3,
  uploadImage,
  uploadMany,
};

export default mediaService;
