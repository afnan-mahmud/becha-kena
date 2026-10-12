import api from '../api/axios';
import type { ApiResponse, IReview, ReviewsPage } from '../types';

export const submitReview = async (data: { listingId: string; rating: number; reviewText: string }): Promise<ApiResponse<IReview>> => {
  const response = await api.post<ApiResponse<IReview>>('/reviews', data);
  return response.data;
};

export const getReviewsForUser = async (userId: string, page = 1): Promise<ApiResponse<ReviewsPage>> => {
  const response = await api.get<ApiResponse<ReviewsPage>>(`/reviews/user/${userId}`, { params: { page } });
  return response.data;
};
