import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';
import { getMyListings, deleteListing, renewListing } from '../../services/listing.service';
import { MyListingItem } from '../../components/dashboard/MyListingItem';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { MarkAsSoldModal } from '../../components/dashboard/MarkAsSoldModal';
import { SEOHead } from '../../components/common/SEOHead';
import { formatNumber, getErrorMessage } from '../../utils/formatters';
import type { ListingStatus } from '../../types';
import './MyListingsPage.css';

const TABS: { key: 'all' | ListingStatus; label: string }[] = [
  { key: 'all', label: 'সব' },
  { key: 'active', label: 'সক্রিয়' },
  { key: 'pending', label: 'রিভিউতে' },
  { key: 'sold', label: 'বিক্রিত' },
  { key: 'archived', label: 'আর্কাইভড' },
];

export const MyListingsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const activeTab = (TABS.find((t) => t.key === params.get('tab'))?.key || 'all') as (typeof TABS)[number]['key'];

  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [listingToSell, setListingToSell] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['my-listings', activeTab],
    queryFn: () => getMyListings(activeTab === 'all' ? undefined : activeTab),
  });

  const listings = data?.data?.listings || [];
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['my-listings'] });

  const handleRenew = async (id: string) => {
    try {
      await renewListing(id);
      toast.success('বিজ্ঞাপন আরো ৩০ দিনের জন্য নবায়ন হয়েছে');
      refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, 'নবায়ন করা যায়নি'));
    }
  };

  const confirmDelete = async () => {
    if (!listingToDelete) return;
    try {
      await deleteListing(listingToDelete);
      toast.success('বিজ্ঞাপনটি সরিয়ে ফেলা হয়েছে');
      refresh();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setListingToDelete(null);
    }
  };

  return (
    <div className="my-listings container">
      <SEOHead title="আমার বিজ্ঞাপন — বেচা-কেনা" />
      <div className="my-listings__head">
        <div>
          <h1>আমার বিজ্ঞাপন</h1>
          <p>আপনার সব বিজ্ঞাপন এক জায়গায় — এডিট, নবায়ন বা বিক্রিত হিসেবে চিহ্নিত করুন।</p>
        </div>
        <Link to="/listings/create" className="btn btn-accent"><Plus size={18} /> নতুন বিজ্ঞাপন</Link>
      </div>

      <div className="tabs-row" role="tablist">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setParams(tab.key === 'all' ? {} : { tab: tab.key }, { replace: true })}
          >
            {tab.label}
            {activeTab === tab.key && data?.data && <span className="tab__count">{formatNumber(data.data.total)}</span>}
          </button>
        ))}
      </div>

      <div className="my-listings__list">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 18 }} />)
        ) : isError ? (
          <div className="empty-state">
            <p>লোড করা যায়নি।</p>
            <button type="button" className="btn btn-outline btn-sm mt-3" onClick={() => refetch()}>আবার চেষ্টা করুন</button>
          </div>
        ) : listings.length > 0 ? (
          listings.map((listing) => (
            <MyListingItem
              key={listing.id}
              listing={listing}
              onEdit={(id) => navigate(`/listings/${id}/edit`)}
              onSold={setListingToSell}
              onRenew={handleRenew}
              onDelete={setListingToDelete}
            />
          ))
        ) : (
          <div className="empty-state">
            <div style={{ fontSize: 40 }} aria-hidden="true">📦</div>
            <h3>এখানে কোনো বিজ্ঞাপন নেই</h3>
            <p>ঘরের অপ্রয়োজনীয় জিনিসের ছবি তুলে আজই বিজ্ঞাপন দিন।</p>
            <Link to="/listings/create" className="btn btn-primary mt-4"><Plus size={18} /> বিজ্ঞাপন দিন</Link>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={!!listingToDelete}
        onClose={() => setListingToDelete(null)}
        onConfirm={confirmDelete}
        title="বিজ্ঞাপনটি সরিয়ে ফেলবেন?"
        message="বিজ্ঞাপনটি আর্কাইভ হবে এবং আর কেউ দেখতে পাবে না।"
        confirmText="সরিয়ে ফেলুন"
        confirmVariant="danger"
      />

      {listingToSell && (
        <MarkAsSoldModal isOpen onClose={() => setListingToSell(null)} onSuccess={refresh} listingId={listingToSell} />
      )}
    </div>
  );
};
