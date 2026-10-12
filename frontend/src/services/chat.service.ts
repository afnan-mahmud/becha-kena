import api from '../api/axios';
import type { ApiResponse, IChatRoom, MessagesPage } from '../types';

export const getRooms = async (): Promise<ApiResponse<IChatRoom[]>> => {
  const response = await api.get<ApiResponse<IChatRoom[]>>('/chat/rooms');
  return response.data;
};

export const getMessages = async (roomId: string, page = 1): Promise<ApiResponse<MessagesPage>> => {
  const response = await api.get<ApiResponse<MessagesPage>>(`/chat/rooms/${roomId}/messages`, { params: { page } });
  return response.data;
};

export const createRoom = async (listingId: string): Promise<ApiResponse<IChatRoom>> => {
  const response = await api.post<ApiResponse<IChatRoom>>('/chat/rooms', { listingId });
  return response.data;
};
