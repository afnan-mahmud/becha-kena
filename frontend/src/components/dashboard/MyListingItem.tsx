import { Link } from 'react-router-dom';
import { Pencil, CheckCircle2, RefreshCw, Trash2, CalendarDays, Hourglass, Eye } from 'lucide-react';
import type { IListing } from '../../types';
import { formatDate, formatPrice } from '../../utils/formatters';
import { getCoverImage, isRejected } from '../../utils/listing';
import './MyListingItem.css';

interface MyListingItemProps {
  listing: IListing;
  onEdit: (id: string) => void;
  onSold: (id: string) => void;
  onRenew: (id: string) => void;
  onDelete: (id: string) => void;
}

const STATUS = {
  active: { label: 'সক্রিয়', cls: 'badge-green' },
  pending: { label: 'রিভিউতে আছে', cls: 'badge-yellow' },
  sold: { label: 'বিক্রিত', cls: 'badge-blue' },
  archived: { label: 'আর্কাইভড', cls: '' },
  rejected: { label: 'বাতিল', cls: 'badge-red' },
} as const;

export const MyListingItem = ({ listing, onEdit, onSold, onRenew, onDelete }: MyListingItemProps) => {
  const rejected = isRejected(listing);
  const status = rejected ? STATUS.rejected : STATUS[listing.status];
  const daysLeft = Math.ceil((new Date(listing.expiresAt).getTime() - Date.now()) / 86_400_000);
  const canEdit = listing.status === 'active' || listing.status === 'pending';

  return (
    <article className="my-item">
      <Link to={`/listings/${listing.id}`} className="my-item__thumb">
        <img src={getCoverImage(listing)} alt="" loading="lazy" />
      </Link>

      <div className="my-item__body">
        <div className="my-item__top">
          <span className={`badge ${status.cls}`}>{status.label}</span>
          {listing.status === 'active' && daysLeft <= 5 && daysLeft > 0 && (
            <span className="badge badge-red"><Hourglass size={12} /> {daysLeft} দিন বাকি</span>
          )}
        </div>
        <Link to={`/listings/${listing.id}`} className="my-item__title line-clamp-2">{listing.title}</Link>
        <div className="my-item__price">{formatPrice(listing.price)}</div>
        <div className="my-item__meta">
          <span><CalendarDays size={14} /> পোস্ট: {formatDate(listing.createdAt)}</span>
          {listing.status === 'active' && <span>মেয়াদ: {formatDate(listing.expiresAt)}</span>}
        </div>
        {rejected && listing.moderationFlags?.flagReason && (
          <p className="my-item__reason">বাতিলের কারণ: {listing.moderationFlags.flagReason}</p>
        )}
        {listing.status === 'pending' && (
          <p className="my-item__hint">আমাদের টিম বিজ্ঞাপনটি রিভিউ করছে। অনুমোদনের পর সবাই দেখতে পাবে।</p>
        )}
      </div>

      <div className="my-item__actions">
        {listing.status === 'active' && (
          <button type="button" className="btn btn-primary btn-sm" onClick={() => onSold(listing.id)}>
            <CheckCircle2 size={15} /> বিক্রি হয়েছে
          </button>
        )}
        {canEdit && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onEdit(listing.id)}>
            <Pencil size={15} /> এডিট
          </button>
        )}
        {listing.status === 'archived' && !rejected && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onRenew(listing.id)}>
            <RefreshCw size={15} /> নবায়ন
          </button>
        )}
        {listing.status === 'active' && daysLeft <= 5 && (
          <button type="button" className="btn btn-outline btn-sm" onClick={() => onRenew(listing.id)}>
            <RefreshCw size={15} /> মেয়াদ বাড়ান
          </button>
        )}
        {listing.status !== 'archived' && listing.status !== 'sold' && (
          <button type="button" className="btn btn-danger-outline btn-sm" onClick={() => onDelete(listing.id)}>
            <Trash2 size={15} /> সরান
          </button>
        )}
        {listing.status === 'sold' && (
          <Link to={`/listings/${listing.id}`} className="btn btn-ghost btn-sm"><Eye size={15} /> দেখুন</Link>
        )}
      </div>
    </article>
  );
};
