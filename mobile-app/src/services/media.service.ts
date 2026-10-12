import * as ImageManipulator from 'expo-image-manipulator';
import { api } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import { ApiResponse } from '@/types/api.types';

interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
}

/**
 * Minimal media upload service (scaffolded for Prompt 20).
 *
 * uploadImage(uri, folder):
 *   1. Compress to JPEG via expo-image-manipulator.
 *   2. POST /media/presigned-url → { uploadUrl, fileUrl }.
 *   3. PUT compressed bytes to uploadUrl with Content-Type: image/jpeg.
 *   4. Return fileUrl.
 */
export const mediaService = {
  uploadImage: async (uri: string, folder: string = 'general'): Promise<string> => {
    // 1. Compress to JPEG (quality 0.8, max 1200px wide)
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }],
      { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
    );

    const fileName = `${folder}_${Date.now()}.jpg`;

    // 2. Get pre-signed upload URL from backend
    const presignedRes = await api.post<ApiResponse<PresignedUrlResponse>>(
      ENDPOINTS.MEDIA.PRESIGNED_URL,
      {
        fileName,
        fileType: 'image/jpeg',
        folder,
      }
    );

    const { uploadUrl, fileUrl } = presignedRes.data.data;

    // 3. Fetch the compressed image as blob and PUT to pre-signed URL
    const imageResponse = await fetch(manipResult.uri);
    const blob = await imageResponse.blob();

    await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: blob,
    });

    // 4. Return the public file URL
    return fileUrl;
  },
};
