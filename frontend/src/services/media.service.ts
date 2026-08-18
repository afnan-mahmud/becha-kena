import api from '../api/axios';
import type { ApiResponse } from '../types';

export const getPresignedUrl = async (fileName: string, fileType: string, folder?: string): Promise<ApiResponse<{ uploadUrl: string; fileUrl: string }>> => {
  const response = await api.post<ApiResponse<{ uploadUrl: string; fileUrl: string }>>('/media/presigned-url', { fileName, fileType, folder });
  return response.data;
};

export const uploadFileToS3 = async (uploadUrl: string, file: File): Promise<void> => {
  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });
};
