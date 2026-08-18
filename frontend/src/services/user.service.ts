import api from '../api/axios';
import type { ApiResponse, IUser } from '../types';

export const getMe = async (): Promise<ApiResponse<IUser>> => {
  const response = await api.get<ApiResponse<IUser>>('/users/me');
  return response.data;
};

export const updateProfile = async (data: { displayName?: string }): Promise<ApiResponse<IUser>> => {
  const response = await api.put<ApiResponse<IUser>>('/users/me', data);
  return response.data;
};

export const deleteAccount = async (): Promise<ApiResponse> => {
  const response = await api.delete<ApiResponse>('/users/me');
  return response.data;
};

export const getPublicProfile = async (userId: string): Promise<ApiResponse<IUser>> => {
  const response = await api.get<ApiResponse<IUser>>(`/users/${userId}`);
  return response.data;
};
