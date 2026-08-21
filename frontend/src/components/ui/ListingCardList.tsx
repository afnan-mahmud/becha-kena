import type { IListing } from '../../types';
import { Link } from 'react-router-dom';
import { formatPrice, formatRelativeTime } from '../../utils/formatters';
import { MapPin, Clock } from 'lucide-react';
import './ListingCardList.css';

interface ListingCardListProps {
  listing: IListing;
}

export const ListingCardList = ({ listing }: ListingCardListProps) => {
  const primaryImage = listing.images && listing.images.length > 0 
    ? listing.images[0] 
    : 'https://via.placeholder.com/300x200?text=No+Image';

  const formatCondition = (condition: string) => {
    switch (condition) {
      case 'New': return 'নতুন';
      case 'Like New': return 'প্রায় নতুন';
      case 'Used': return 'ব্যবহৃত';
      default: return condition;
    }
  };

  return (
    <Link to={`/listings/${listing.id}`} className="listing-card-list">
      <div className="listing-card-list-image">
        <img src={primaryImage} alt={listing.title} />
        <div className="listing-badge condition-badge">{formatCondition(listing.condition)}</div>
      </div>
      
      <div className="listing-card-list-content">
        <h3 className="listing-card-list-title" title={listing.title}>
          {listing.title}
        </h3>
        
        <p className="listing-card-list-description">
          {listing.description}
        </p>

        <div className="listing-card-list-price">
          {formatPrice(listing.price)}
        </div>

        <div className="listing-card-list-footer">
          <div className="listing-card-list-info">
            <span className="info-item">
              <MapPin size={14} />
              {listing.location.thana}, {listing.location.district}
            </span>
            <span className="info-item">
              <Clock size={14} />
              {formatRelativeTime(listing.createdAt)}
            </span>
          </div>
          {listing.seller && (
            <div className="listing-card-list-seller">
              <span>{listing.seller.displayName}</span>
              {listing.seller.isVerified && <span className="verified-icon">✓</span>}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};
