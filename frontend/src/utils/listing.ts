import type { IListing, ISellerSummary } from '../types';
import { PLACEHOLDER_IMAGE } from './constants';

/** `sellerId` is populated on public endpoints — this returns the object or null */
export const getSeller = (listing: Pick<IListing, 'sellerId'>): ISellerSummary | null =>
  listing.sellerId && typeof listing.sellerId === 'object' ? listing.sellerId : null;

export const getSellerId = (listing: Pick<IListing, 'sellerId'>): string => {
  const seller = listing.sellerId;
  if (!seller) return '';
  return typeof seller === 'string' ? seller : seller.id || seller._id || '';
};

export const getCoverImage = (listing: Pick<IListing, 'images'>) =>
  listing.images && listing.images.length > 0 ? listing.images[0] : PLACEHOLDER_IMAGE;

export const formatLocation = (listing: Pick<IListing, 'location'>, parts: 2 | 3 = 2) => {
  const { thana, district, division } = listing.location || {};
  const list = parts === 3 ? [thana, district, division] : [thana || district, district === thana ? division : district];
  return list.filter(Boolean).join(', ');
};

/** A moderator rejection archives the listing with a manual flag */
export const isRejected = (listing: Pick<IListing, 'status' | 'moderationFlags'>) =>
  listing.status === 'archived' && listing.moderationFlags?.flagType === 'manual';
