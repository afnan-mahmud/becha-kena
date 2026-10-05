import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, BadgeCheck, Star } from 'lucide-react';
import type { IListing } from '../../types';
import { formatPrice, formatRelativeTime } from '../../utils/formatters';
import './ListingCard.css';

interface ListingCardProps {
  listing: IListing;
}

export const ListingCard = React.memo(({ listing }: ListingCardProps) => {
  const mainImage = listing.images && listing.images.length > 0 
    ? listing.images[0] 
    : 'https://via.placeholder.com/400x300?text=No+Image';

  return (
    <Link to={`/listings/${listing.id}`} className="listing-card" aria-label={`View details for ${listing.title}`}>
      <div className="card-image-wrapper">
        <img src={mainImage} alt={`${listing.title} - photo 1`} loading="lazy" />
        {listing.status === 'sold' && (
          <div className="sold-badge">বিক্রি হয়ে গেছে</div>
        )}
      </div>
      <div className="card-content">
        <h3 className="card-title line-clamp-2">{listing.title}</h3>
        <div className="card-location">
          <MapPin size={14} />
          <span className="truncate">{listing.location?.division}, {listing.location?.district}</span>
        </div>
        <div className="card-price-row">
          <span className="card-price">{formatPrice(listing.price)}</span>
          <span className="card-date">{formatRelativeTime(listing.createdAt)}</span>
        </div>
        {listing.seller && (
          <div className="card-seller">
            <span className="seller-name truncate">{listing.seller.displayName}</span>
            {listing.seller.isVerified && <BadgeCheck size={14} className="verified-icon" />}
            {listing.seller.averageRating > 0 && (
              <span className="seller-rating">
                <Star size={12} fill="currentColor" /> {listing.seller.averageRating.toFixed(1)}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
});
