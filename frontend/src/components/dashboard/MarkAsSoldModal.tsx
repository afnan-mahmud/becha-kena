import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getRooms } from '../../services/chat.service';
import { markAsSold } from '../../services/listing.service';
import { UserAvatar } from '../ui/UserAvatar';
import { LoadingSpinner } from '../common/LoadingSpinner';
import './MarkAsSoldModal.css';
import '../common/ConfirmModal.css'; // Reuse modal overlay styles

interface MarkAsSoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  listingId: string;
}

export const MarkAsSoldModal = ({ isOpen, onClose, onSuccess, listingId }: MarkAsSoldModalProps) => {
  const [selectedBuyerId, setSelectedBuyerId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Fetch all rooms and filter by listingId locally
  // In a real app, there would be an API `getRoomsByListing(listingId)`
  const { data: roomsData, isLoading } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: getRooms,
    enabled: isOpen
  });

  const relatedRooms = roomsData?.data?.filter(room => room.listingId === listingId) || [];

  const handleConfirm = async () => {
    if (!selectedBuyerId) {
      toast.error('অনুগ্রহ করে একজন ক্রেতা নির্বাচন করুন');
      return;
    }

    try {
      setIsSubmitting(true);
      await markAsSold(listingId, selectedBuyerId);
      toast.success('বিজ্ঞাপনটি বিক্রিত হিসেবে চিহ্নিত করা হয়েছে');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="mark-sold-modal-content" onClick={e => e.stopPropagation()}>
        <h3 className="modal-title">কাকে বিক্রি করেছেন?</h3>
        <p className="modal-message" style={{ marginBottom: 0 }}>
          যাদের সাথে আপনার এই বিজ্ঞাপনটি নিয়ে চ্যাট হয়েছে তাদের তালিকা নিচে দেওয়া হলো। সঠিক ক্রেতা নির্বাচন করুন।
        </p>

        {isLoading ? (
          <div style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LoadingSpinner />
          </div>
        ) : relatedRooms.length === 0 ? (
          <div className="mark-sold-empty">
            <p>আপনার কোনো চ্যাট হিস্ট্রি পাওয়া যায়নি।</p>
            <p>অন্য কোনো মাধ্যমে বিক্রি করে থাকলে নিচের অপশনটি নির্বাচন করুন।</p>
            {/* Fallback option if no chat history */}
            <div 
              className={`buyer-list-item ${selectedBuyerId === 'external' ? 'selected' : ''}`}
              onClick={() => setSelectedBuyerId('external')}
              style={{ marginTop: '1rem', textAlign: 'left' }}
            >
              <div className="buyer-info">
                <div className="buyer-name">অন্যান্য মাধ্যম</div>
                <div className="buyer-meta">বেচা-কেনা এর বাইরে বিক্রি হয়েছে</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="buyer-list">
            {relatedRooms.map(room => (
              <div 
                key={room.buyerId}
                className={`buyer-list-item ${selectedBuyerId === room.buyerId ? 'selected' : ''}`}
                onClick={() => setSelectedBuyerId(room.buyerId)}
              >
                <UserAvatar name={room.buyer?.displayName || 'অজ্ঞাত'} size="sm" />
                <div className="buyer-info">
                  <div className="buyer-name">{room.buyer?.displayName || 'অজ্ঞাত ক্রেতা'}</div>
                  <div className="buyer-meta">শেষ মেসেজ: {room.lastMessage || '...'}</div>
                </div>
              </div>
            ))}
            
            <div 
              className={`buyer-list-item ${selectedBuyerId === 'external' ? 'selected' : ''}`}
              onClick={() => setSelectedBuyerId('external')}
            >
              <div className="buyer-info">
                <div className="buyer-name">অন্যান্য মাধ্যম</div>
                <div className="buyer-meta">বেচা-কেনা এর বাইরে বিক্রি হয়েছে</div>
              </div>
            </div>
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: 'auto' }}>
          <button className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
            বাতিল করুন
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleConfirm}
            disabled={!selectedBuyerId || isSubmitting}
          >
            {isSubmitting ? 'প্রসেসিং...' : 'নিশ্চিত করুন'}
          </button>
        </div>
      </div>
    </div>
  );
};
