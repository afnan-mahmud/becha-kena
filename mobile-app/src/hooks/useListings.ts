import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { listingService } from '@/services/listing.service';
import { STALE } from '@/lib/queryClient';
import type {
  CreateListingBody,
  GetListingsParams,
  Listing,
  ListingCondition,
  ListingSort,
  ListingStatus,
  UpdateListingBody,
} from '@/types/listing.types';

/**
 * Server data lives in TanStack Query — NOT in Zustand (Prompt 21).
 * Query keys:
 *   ['listings', …]     public feeds / search
 *   ['listing', id]     one ad
 *   ['my-listings', …]  my ads
 */

/** Filters used by Search + FilterBottomSheet. sort 'nearby' = lat/lng/radius search. */
export interface SearchFilters {
  search?: string;
  category?: string;
  condition?: ListingCondition;
  minPrice?: number;
  maxPrice?: number;
  division?: string;
  district?: string;
  thana?: string;
  sort?: ListingSort | 'nearby';
  lat?: number;
  lng?: number;
  /** meters */
  radius?: number;
}

export const NEARBY_RADIUS_METERS = 10_000;

/** SearchFilters → GET /listings params */
export function filtersToParams(filters: SearchFilters): GetListingsParams {
  const { sort, lat, lng, radius, ...rest } = filters;
  if (sort === 'nearby' && lat !== undefined && lng !== undefined) {
    // Distance search replaces the area filter; results come sorted by distance
    const { division, district, thana, ...withoutArea } = rest;
    return { ...withoutArea, lat, lng, radius: radius ?? NEARBY_RADIUS_METERS };
  }
  return { ...rest, sort: sort === 'nearby' ? 'newest' : sort };
}

export function useListingsFeed(filters: SearchFilters, { limit = 20, enabled = true } = {}) {
  const params = filtersToParams(filters);
  return useInfiniteQuery({
    queryKey: ['listings', params, limit],
    queryFn: ({ pageParam }) => listingService.getListings({ ...params, page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page < last.totalPages ? last.page + 1 : undefined),
    staleTime: STALE.feed,
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useListing(id?: string) {
  return useQuery({
    queryKey: ['listing', id],
    queryFn: () => listingService.getListing(id!),
    enabled: !!id,
    staleTime: STALE.listing,
  });
}

export function useMyListings(status?: ListingStatus) {
  return useQuery({
    queryKey: ['my-listings', status ?? 'all'],
    queryFn: () => listingService.getMyListings(status, 1, 50),
    staleTime: 30_000,
  });
}

/** Just the `total` for a status — used by the profile stats row */
export function useMyListingsCount(status: ListingStatus) {
  return useQuery({
    queryKey: ['my-listings', status, 'count'],
    queryFn: () => listingService.getMyListings(status, 1, 1),
    select: (page) => page.total,
    staleTime: 60_000,
  });
}

const useInvalidateListings = () => {
  const queryClient = useQueryClient();
  return (id?: string) => {
    queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    queryClient.invalidateQueries({ queryKey: ['listings'] });
    if (id) queryClient.invalidateQueries({ queryKey: ['listing', id] });
  };
};

export function useCreateListing() {
  const invalidate = useInvalidateListings();
  return useMutation({
    mutationFn: (body: CreateListingBody) => listingService.createListing(body),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateListing() {
  const invalidate = useInvalidateListings();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateListingBody }) => listingService.updateListing(id, body),
    onSuccess: (listing: Listing) => {
      queryClient.setQueryData(['listing', listing.id], (old: Listing | undefined) =>
        // keep the populated seller object from the detail endpoint
        old ? { ...old, ...listing, sellerId: old.sellerId } : listing
      );
      invalidate(listing.id);
    },
  });
}

export function useMarkAsSold() {
  const invalidate = useInvalidateListings();
  return useMutation({
    mutationFn: ({ id, buyerId }: { id: string; buyerId?: string }) => listingService.markAsSold(id, buyerId),
    onSuccess: (_data, { id }) => invalidate(id),
  });
}

export function useRenewListing() {
  const invalidate = useInvalidateListings();
  return useMutation({
    mutationFn: (id: string) => listingService.renewListing(id),
    onSuccess: (_data, id) => invalidate(id),
  });
}

export function useDeleteListing() {
  const invalidate = useInvalidateListings();
  return useMutation({
    mutationFn: (id: string) => listingService.deleteListing(id),
    onSuccess: (_data, id) => invalidate(id),
  });
}
