import { memo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, BadgeCheck, Star } from 'lucide-react';
import type { IListing } from '../../types';
import { formatPrice, formatRelativeTime } from '../../utils/formatters';
import { getConditionLabel } from '../../utils/constants';
import { formatLocation, getCoverImage, getSeller } from '../../utils/listing';
import './ListingCard.css';

interface ListingCardProps {
  listing: IListing;
}

export const ListingCard = memo(({ listing }: ListingCardProps) => {
  const seller = getSeller(listing);
  const condition = getConditionLabel(listing.condition);

  return (
    <Link to={`/listings/${listing.id}`} className="listing-card" aria-label={listing.title}>
      <div className="listing-card__media">
        <img src={getCoverImage(listing)} alt="" loading="lazy" decoding="async" />
        {condition && <span className={`listing-card__condition is-${listing.condition}`}>{condition}</span>}
        {listing.images?.length > 1 && <span className="listing-card__count">+{listing.images.length - 1}</span>}
        {listing.status === 'sold' && <div className="listing-card__sold">বিক্রি হয়ে গেছে</div>}
      </div>

      <div className="listing-card__body">
        <div className="listing-card__price">{formatPrice(listing.price)}</div>
        <h3 className="listing-card__title line-clamp-2">{listing.title}</h3>

        <div className="listing-card__meta">
          <span className="listing-card__loc truncate">
            <MapPin size={13} aria-hidden="true" />
            {formatLocation(listing) || 'বাংলাদেশ'}
          </span>
          <span className="listing-card__time">{formatRelativeTime(listing.createdAt)}</span>
        </div>

        {seller && (
          <div className="listing-card__seller">
            <span className="truncate">{seller.displayName}</span>
            {seller.isVerified && <BadgeCheck size={15} className="listing-card__verified" aria-label="NID ভেরিফাইড" />}
            {seller.averageRating > 0 && (
              <span className="listing-card__rating">
                <Star size={12} fill="currentColor" aria-hidden="true" /> {seller.averageRating.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
});

ListingCard.displayName = 'ListingCard';

export const ListingCardSkeleton = () => (
  <div className="listing-card listing-card--skeleton" aria-hidden="true">
    <div className="listing-card__media skeleton" />
    <div className="listing-card__body">
      <div className="skeleton" style={{ height: 20, width: '45%' }} />
      <div className="skeleton" style={{ height: 14, width: '90%', marginTop: 10 }} />
      <div className="skeleton" style={{ height: 14, width: '70%', marginTop: 6 }} />
    </div>
  </div>
);
