import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';

import { getMyListings, deleteListing, renewListing } from '../../services/listing.service';
import { MyListingItem } from '../../components/dashboard/MyListingItem';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { MarkAsSoldModal } from '../../components/dashboard/MarkAsSoldModal';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

import './MyListingsPage.css';

type TabStatus = 'all' | 'active' | 'under_review' | 'expired' | 'sold';

export const MyListingsPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabStatus>('all');
  
  // Modals state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<string | null>(null);
  const [soldModalOpen, setSoldModalOpen] = useState(false);
  const [listingToMarkSold, setListingToMarkSold] = useState<string | null>(null);

  const { data: listingsData, isLoading } = useQuery({
    queryKey: ['my-listings', activeTab],
    queryFn: () => getMyListings(activeTab === 'all' ? undefined : activeTab)
  });

  const listings = listingsData?.data || [];

  const handleEdit = (id: string) => {
    navigate(`/listings/${id}/edit`);
  };

  const handleSoldClick = (id: string) => {
    setListingToMarkSold(id);
    setSoldModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setListingToDelete(id);
    setDeleteModalOpen(true);
  };

  const handleRenew = async (id: string) => {
    try {
      await renewListing(id);
      toast.success('বিজ্ঞাপন সফলভাবে নবায়ন করা হয়েছে');
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    } catch (error) {
      toast.error('নবায়ন করতে সমস্যা হয়েছে');
    }
  };

  const confirmDelete = async () => {
    if (!listingToDelete) return;
    try {
      await deleteListing(listingToDelete);
      toast.success('বিজ্ঞাপনটি মুছে ফেলা হয়েছে');
      queryClient.invalidateQueries({ queryKey: ['my-listings'] });
    } catch (error) {
      toast.error('সমস্যা হয়েছে');
    }
  };

  const refreshListings = () => {
    queryClient.invalidateQueries({ queryKey: ['my-listings'] });
  };

  return (
    <div className="my-listings-page container">
      <h1>আমার বিজ্ঞাপন</h1>

      <div className="dashboard-tabs">
        <button 
          className={`dashboard-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          সব
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          সক্রিয়
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'under_review' ? 'active' : ''}`}
          onClick={() => setActiveTab('under_review')}
        >
          অপেক্ষমান
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'expired' ? 'active' : ''}`}
          onClick={() => setActiveTab('expired')}
        >
          আর্কাইভড
        </button>
        <button 
          className={`dashboard-tab ${activeTab === 'sold' ? 'active' : ''}`}
          onClick={() => setActiveTab('sold')}
        >
          বিক্রিত
        </button>
      </div>

      <div className="my-listings-list">
        {isLoading ? (
          <LoadingSpinner />
        ) : listings.length > 0 ? (
          listings.map(listing => (
            <MyListingItem 
              key={listing.id} 
              listing={listing} 
              onEdit={handleEdit}
              onSold={handleSoldClick}
              onRenew={handleRenew}
              onDelete={handleDeleteClick}
            />
          ))
        ) : (
          <div className="my-listings-empty">
            <p>আপনার কোন বিজ্ঞাপন নেই। আপনার প্রথম বিজ্ঞাপন পোস্ট করুন!</p>
            <Link to="/listings/create" className="btn btn-primary flex-center gap-1" style={{ display: 'inline-flex' }}>
              <Plus size={18} /> নতুন বিজ্ঞাপন দিন
            </Link>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="বিজ্ঞাপনটি মুছতে চান?"
        message="আপনি কি নিশ্চিত? বিজ্ঞাপনটি মুছে ফেললে তা আর সাধারণ ব্যবহারকারীরা দেখতে পারবে না।"
        confirmText="মুছে ফেলুন"
        confirmVariant="danger"
      />

      {listingToMarkSold && (
        <MarkAsSoldModal
          isOpen={soldModalOpen}
          onClose={() => setSoldModalOpen(false)}
          onSuccess={refreshListings}
          listingId={listingToMarkSold}
        />
      )}
    </div>
  );
};
