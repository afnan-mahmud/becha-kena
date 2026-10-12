import { Link } from 'react-router-dom';
import { MapPin, Clock, BadgeCheck } from 'lucide-react';
import type { IListing } from '../../types';
import { formatPrice, formatRelativeTime } from '../../utils/formatters';
import { getCategoryLabel, getConditionLabel } from '../../utils/constants';
import { formatLocation, getCoverImage, getSeller } from '../../utils/listing';
import './ListingCardList.css';

export const ListingCardList = ({ listing }: { listing: IListing }) => {
  const seller = getSeller(listing);
  const condition = getConditionLabel(listing.condition);

  return (
    <Link to={`/listings/${listing.id}`} className="listing-row">
      <div className="listing-row__media">
        <img src={getCoverImage(listing)} alt="" loading="lazy" />
      </div>

      <div className="listing-row__body">
        <div className="listing-row__tags">
          {condition && <span className="badge badge-green">{condition}</span>}
          <span className="badge">{getCategoryLabel(listing.category)}</span>
        </div>
        <h3 className="listing-row__title line-clamp-2">{listing.title}</h3>
        <p className="listing-row__desc line-clamp-2">{listing.description}</p>

        <div className="listing-row__foot">
          <span><MapPin size={14} /> {formatLocation(listing, 3)}</span>
          <span><Clock size={14} /> {formatRelativeTime(listing.createdAt)}</span>
          {seller && (
            <span className="listing-row__seller">
              {seller.displayName}
              {seller.isVerified && <BadgeCheck size={14} />}
            </span>
          )}
        </div>
      </div>

      <div className="listing-row__price">{formatPrice(listing.price)}</div>
    </Link>
  );
};
