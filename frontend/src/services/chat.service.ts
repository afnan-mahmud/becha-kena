import api from '../api/axios';
import type { ApiResponse, IChatRoom, IMessage, PaginatedResponse } from '../types';

export const getRooms = async (): Promise<ApiResponse<IChatRoom[]>> => {
  const response = await api.get<ApiResponse<IChatRoom[]>>('/chat/rooms');
  return response.data;
};

export const getMessages = async (roomId: string, page?: number): Promise<PaginatedResponse<IMessage>> => {
  const response = await api.get<PaginatedResponse<IMessage>>(`/chat/rooms/${roomId}/messages`, { params: { page } });
  return response.data;
};

export const createRoom = async (listingId: string): Promise<ApiResponse<IChatRoom>> => {
  const response = await api.post<ApiResponse<IChatRoom>>('/chat/rooms', { listingId });
  return response.data;
};
