import React from 'react';
import { Badge } from '@/components/ui';
import type { Listing } from '@/types/listing.types';

/** A rejected ad is stored as archived + a manual moderation flag */
export const isRejected = (listing: Pick<Listing, 'status' | 'moderationFlags'>) =>
  listing.status === 'archived' && listing.moderationFlags?.flagType === 'manual';

export type ListingDisplayState = 'pending' | 'active' | 'sold' | 'archived' | 'rejected';

export const getDisplayState = (listing: Pick<Listing, 'status' | 'moderationFlags'>): ListingDisplayState =>
  isRejected(listing) ? 'rejected' : listing.status;

const CONFIG: Record<ListingDisplayState, { label: string; variant: 'yellow' | 'green' | 'blue' | 'neutral' | 'red' }> = {
  pending: { label: '🟡 রিভিউতে আছে', variant: 'yellow' },
  active: { label: '🟢 সক্রিয়', variant: 'green' },
  sold: { label: '🔵 বিক্রিত', variant: 'blue' },
  archived: { label: '⚫ আর্কাইভড', variant: 'neutral' },
  rejected: { label: '🔴 বাতিল', variant: 'red' },
};

/** Status badge for an ad (Prompt 23). Rejected ads show the moderator's reason. */
export function ModerationBadge({
  listing,
  showReason = true,
  size = 'sm',
}: {
  listing: Pick<Listing, 'status' | 'moderationFlags'>;
  showReason?: boolean;
  size?: 'sm' | 'md';
}) {
  const state = getDisplayState(listing);
  const { label, variant } = CONFIG[state];
  const reason = listing.moderationFlags?.flagReason;
  return (
    <Badge
      size={size}
      variant={variant}
      label={state === 'rejected' && showReason && reason ? `${label} — কারণ: ${reason}` : label}
    />
  );
}

export default ModerationBadge;
