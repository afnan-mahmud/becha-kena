import api from '../api/axios';
import type { ApiResponse } from '../types';

export type UploadFolder = 'listings' | 'kyc' | 'avatars';

export const getPresignedUrl = async (fileName: string, fileType: string, folder: UploadFolder = 'listings'): Promise<ApiResponse<{ uploadUrl: string; fileUrl: string }>> => {
  const response = await api.post<ApiResponse<{ uploadUrl: string; fileUrl: string }>>('/media/presigned-url', { fileName, fileType, folder });
  return response.data;
};

export const uploadFileToS3 = async (uploadUrl: string, file: File): Promise<void> => {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });
  if (!res.ok) {
    throw new Error('ছবি আপলোড করা যায়নি। আবার চেষ্টা করুন।');
  }
};

/** Presign + upload in one go, returns the public file URL */
export const uploadImage = async (file: File, folder: UploadFolder): Promise<string> => {
  const { data } = await getPresignedUrl(file.name, file.type, folder);
  await uploadFileToS3(data.uploadUrl, file);
  return data.fileUrl;
};
