import api from '../api/axios';
import type { ApiResponse, IListing, ListingFilters, ListingsPage } from '../types';

export interface ListingPayload {
  title: string;
  description: string;
  price: number;
  category: string;
  condition: string;
  images: string[];
  hidePhoneNumber: boolean;
  location: {
    type: 'Point';
    coordinates: [number, number];
    division: string;
    district: string;
    thana: string;
    addressLine?: string;
  };
}

const cleanParams = (filters: ListingFilters) =>
  Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== undefined && v !== '' && v !== null));

export const getListings = async (filters: ListingFilters = {}): Promise<ApiResponse<ListingsPage>> => {
  const response = await api.get<ApiResponse<ListingsPage>>('/listings', { params: cleanParams(filters) });
  return response.data;
};

export const getListingById = async (id: string): Promise<ApiResponse<IListing>> => {
  const response = await api.get<ApiResponse<IListing>>(`/listings/${id}`);
  return response.data;
};

export const createListing = async (data: ListingPayload): Promise<ApiResponse<IListing>> => {
  const response = await api.post<ApiResponse<IListing>>('/listings', data);
  return response.data;
};

export const updateListing = async (id: string, data: Partial<ListingPayload>): Promise<ApiResponse<IListing>> => {
  const response = await api.put<ApiResponse<IListing>>(`/listings/${id}`, data);
  return response.data;
};

/** Omit buyerId when the item was sold outside Becha-Kena */
export const markAsSold = async (id: string, buyerId?: string): Promise<ApiResponse<IListing>> => {
  const response = await api.patch<ApiResponse<IListing>>(`/listings/${id}/sell`, buyerId ? { buyerId } : {});
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

export const getMyListings = async (status?: string, page = 1, limit = 50): Promise<ApiResponse<ListingsPage>> => {
  const response = await api.get<ApiResponse<ListingsPage>>('/listings/my', { params: { status, page, limit } });
  return response.data;
};
