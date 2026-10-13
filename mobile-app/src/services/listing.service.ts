import { apiClient } from '@/services/api';
import { ENDPOINTS } from '@/constants/api';
import {
  Listing,
  SellerSummary,
  GetListingsParams,
  ListingsResponse,
  CreateListingBody,
  UpdateListingBody,
  ListingStatus,
} from '@/types/listing.types';

/**
 * Drop undefined, null, or empty string params
 */
function cleanParams(params?: object): Record<string, string | number | boolean> {
  if (!params) return {};
  const cleaned: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

/**
 * Helper: returns listing.sellerId when it is a populated SellerSummary object, else null.
 */
export function getSeller(listing?: Listing | null): SellerSummary | null {
  if (!listing) return null;
  if (typeof listing.sellerId === 'object' && listing.sellerId !== null) {
    return listing.sellerId as SellerSummary;
  }
  return null;
}

export const listingService = {
  /**
   * GET /listings with filters & pagination
   * Returns data = { listings, total, page, limit, totalPages }
   */
  getListings: async (params?: GetListingsParams): Promise<ListingsResponse> => {
    return apiClient.get<ListingsResponse>(
      ENDPOINTS.LISTINGS.BASE,
      cleanParams(params)
    );
  },

  /**
   * GET /listings/:id — Full ad with populated sellerId
   */
  getListing: async (id: string): Promise<Listing> => {
    return apiClient.get<Listing>(ENDPOINTS.LISTINGS.BY_ID(id));
  },

  /**
   * GET /listings/my — User's own ads
   */
  getMyListings: async (
    status?: ListingStatus | string,
    page?: number,
    limit?: number
  ): Promise<ListingsResponse> => {
    return apiClient.get<ListingsResponse>(
      ENDPOINTS.LISTINGS.MY,
      cleanParams({ status, page, limit })
    );
  },

  /**
   * POST /listings — Create new listing
   */
  createListing: async (body: CreateListingBody): Promise<Listing> => {
    return apiClient.post<Listing>(ENDPOINTS.LISTINGS.BASE, body);
  },

  /**
   * PUT /listings/:id — Update listing
   */
  updateListing: async (
    id: string,
    partial: UpdateListingBody
  ): Promise<Listing> => {
    return apiClient.put<Listing>(ENDPOINTS.LISTINGS.BY_ID(id), partial);
  },

  /**
   * PATCH /listings/:id/sell — Mark listing as sold
   * Sends {} when buyerId is undefined
   */
  markAsSold: async (id: string, buyerId?: string): Promise<Listing> => {
    const payload = buyerId ? { buyerId } : {};
    return apiClient.patch<Listing>(ENDPOINTS.LISTINGS.SELL(id), payload);
  },

  /**
   * PATCH /listings/:id/renew — Renew listing (+30 days)
   */
  renewListing: async (id: string): Promise<Listing> => {
    return apiClient.patch<Listing>(ENDPOINTS.LISTINGS.RENEW(id));
  },

  /**
   * DELETE /listings/:id — Soft delete (status: archived)
   */
  deleteListing: async (id: string): Promise<void> => {
    return apiClient.delete<void>(ENDPOINTS.LISTINGS.BY_ID(id));
  },

  getSeller,
};

export default listingService;
