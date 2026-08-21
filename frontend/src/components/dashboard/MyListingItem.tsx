import { Edit, CheckCircle, RefreshCw, Trash2, Calendar, Eye, Image as ImageIcon } from 'lucide-react';
import type { IListing } from '../../types';
import { StatusBadge } from '../common/StatusBadge';
import { formatPrice, formatDate } from '../../utils/formatters';
import './MyListingItem.css';

interface MyListingItemProps {
  listing: IListing;
  onEdit: (id: string) => void;
  onSold: (id: string) => void;
  onRenew: (id: string) => void;
  onDelete: (id: string) => void;
}

export const MyListingItem = ({ listing, onEdit, onSold, onRenew, onDelete }: MyListingItemProps) => {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending':
      case 'under_review': return 'warning';
      case 'sold': return 'info';
      case 'expired':
      case 'archived': return 'neutral';
      case 'rejected': return 'danger';
      default: return 'neutral';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'সক্রিয়';
      case 'under_review': return 'অপেক্ষমান';
      case 'sold': return 'বিক্রিত';
      case 'expired': return 'মেয়াদোত্তীর্ণ/আর্কাইভড';
      case 'rejected': return 'বাতিল';
      default: return status;
    }
  };

  const isActiveOrPending = listing.status === 'active' || listing.status === 'under_review';
  const isArchivedOrExpired = listing.status === 'expired';

  return (
    <div className="my-listing-item">
      <div className="my-listing-thumbnail">
        {listing.images && listing.images.length > 0 ? (
          <img src={listing.images[0]} alt={listing.title} />
        ) : (
          <div className="my-listing-thumbnail-placeholder">
            <ImageIcon size={32} />
          </div>
        )}
      </div>

      <div className="my-listing-content">
        <div className="my-listing-header">
          <h3 className="my-listing-title">{listing.title}</h3>
          <div className="my-listing-price">{formatPrice(listing.price)}</div>
        </div>

        <div className="my-listing-meta">
          <StatusBadge status={getStatusLabel(listing.status)} variant={getStatusVariant(listing.status)} />
          
          <div className="my-listing-meta-item">
            <Calendar size={14} />
            <span>পোস্ট: {formatDate(listing.createdAt)}</span>
          </div>
          
          <div className="my-listing-meta-item">
            <Calendar size={14} />
            <span>মেয়াদ: {formatDate(listing.expiresAt)}</span>
          </div>
          
          <div className="my-listing-meta-item">
            <Eye size={14} />
            <span>১২৩ ভিউ</span> {/* Mock view count as it's not in schema yet */}
          </div>
        </div>

        <div className="my-listing-actions">
          {isActiveOrPending && (
            <button className="btn btn-outline btn-sm flex-center gap-1" onClick={() => onEdit(listing.id)}>
              <Edit size={14} /> সম্পাদনা
            </button>
          )}
          
          {listing.status === 'active' && (
            <button className="btn btn-primary btn-sm flex-center gap-1" onClick={() => onSold(listing.id)}>
              <CheckCircle size={14} /> বিক্রি হয়েছে
            </button>
          )}

          {isArchivedOrExpired && (
            <button className="btn btn-outline btn-sm flex-center gap-1" onClick={() => onRenew(listing.id)}>
              <RefreshCw size={14} /> নবায়ন
            </button>
          )}

          <button className="btn btn-danger btn-sm flex-center gap-1" onClick={() => onDelete(listing.id)}>
            <Trash2 size={14} /> মুছুন
          </button>
        </div>
      </div>
    </div>
  );
};
