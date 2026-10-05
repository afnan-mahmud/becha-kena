import api from '../api/axios';
import type { ApiResponse, IListing, ListingFilters, PaginatedResponse } from '../types';

export const getListings = async (filters: ListingFilters): Promise<PaginatedResponse<IListing>> => {
  const response = await api.get<any>('/listings', { params: filters });
  
  if (response.data?.data && response.data.data.listings && !response.data.data.items) {
    response.data.data.items = response.data.data.listings;
  }
  
  return response.data;
};

export const getListingById = async (id: string): Promise<ApiResponse<IListing>> => {
  const response = await api.get<ApiResponse<IListing>>(`/listings/${id}`);
  return response.data;
};

export const createListing = async (data: Partial<IListing>): Promise<ApiResponse<IListing>> => {
  const response = await api.post<ApiResponse<IListing>>('/listings', data);
  return response.data;
};

export const updateListing = async (id: string, data: Partial<IListing>): Promise<ApiResponse<IListing>> => {
  const response = await api.put<ApiResponse<IListing>>(`/listings/${id}`, data);
  return response.data;
};

export const markAsSold = async (id: string, buyerId: string): Promise<ApiResponse<IListing>> => {
  const response = await api.patch<ApiResponse<IListing>>(`/listings/${id}/sell`, { buyerId });
  return response.data;
};

export const renewListing = async (id: string): Promise<ApiResponse<IListing>> => {
  const response = await api.patch<ApiResponse<IListing>>(`/listings/${id}/renew`);
  return response.data;
};

export const deleteListing = async (id: string): Promise<ApiResponse> => {
  const response = await api.delete<ApiResponse>(`/listings/${id}`);
  return response.data;
};

export const getMyListings = async (status?: string): Promise<ApiResponse<{ listings: IListing[], total: number, page: number, totalPages: number }>> => {
  const response = await api.get<ApiResponse<{ listings: IListing[], total: number, page: number, totalPages: number }>>('/listings/my', { params: { status } });
  return response.data;
};
