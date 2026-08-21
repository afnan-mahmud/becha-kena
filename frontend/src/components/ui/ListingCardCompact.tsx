import { Link } from 'react-router-dom';
import type { IListing } from '../../types';
import { formatPrice } from '../../utils/formatters';
import './ListingCardCompact.css';

interface ListingCardCompactProps {
  listing: IListing;
}

export const ListingCardCompact = ({ listing }: ListingCardCompactProps) => {
  const mainImage = listing.images && listing.images.length > 0 
    ? listing.images[0] 
    : 'https://via.placeholder.com/60x60?text=No+Image';

  return (
    <Link to={`/listings/${listing.id}`} className="listing-card-compact">
      <div className="compact-image">
        <img src={mainImage} alt={listing.title} loading="lazy" />
      </div>
      <div className="compact-content">
        <h4 className="compact-title truncate">{listing.title}</h4>
        <span className="compact-price">{formatPrice(listing.price)}</span>
      </div>
    </Link>
  );
};
