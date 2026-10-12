import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Store } from 'lucide-react';
import { getRooms } from '../../services/chat.service';
import { markAsSold } from '../../services/listing.service';
import { useAuthStore } from '../../store/authStore';
import { UserAvatar } from '../ui/UserAvatar';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { getErrorMessage } from '../../utils/formatters';
import './MarkAsSoldModal.css';
import '../common/ConfirmModal.css';

interface MarkAsSoldModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  listingId: string;
}

const EXTERNAL = 'external';

export const MarkAsSoldModal = ({ isOpen, onClose, onSuccess, listingId }: MarkAsSoldModalProps) => {
  const { user } = useAuthStore();
  const [selected, setSelected] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    if (isOpen) window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const { data, isLoading } = useQuery({ queryKey: ['chat-rooms'], queryFn: getRooms, enabled: isOpen });

  // Buyers = people who chatted with me about this listing
  const buyerRooms = (data?.data || []).filter((room) => room.listingId === listingId && room.sellerId === user?.id);

  const handleConfirm = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await markAsSold(listingId, selected === EXTERNAL ? undefined : selected);
      toast.success(selected === EXTERNAL ? 'বিক্রিত হিসেবে চিহ্নিত হয়েছে' : 'বিক্রিত! ক্রেতা এখন আপনাকে রিভিউ দিতে পারবেন।');
      onSuccess();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="mark-sold-modal-content" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 className="modal-title">কার কাছে বিক্রি করেছেন?</h3>
        <p className="modal-message">সঠিক ক্রেতা বেছে নিন — তিনি আপনাকে রিভিউ দিতে পারবেন, যা আপনার বিশ্বাসযোগ্যতা বাড়াবে।</p>

        {isLoading ? (
          <div style={{ padding: 40 }}><LoadingSpinner /></div>
        ) : (
          <div className="buyer-list">
            {buyerRooms.map((room) => (
              <button
                type="button"
                key={room.id}
                className={`buyer-list-item ${selected === room.buyerId ? 'selected' : ''}`}
                onClick={() => setSelected(room.buyerId)}
              >
                <UserAvatar name={room.buyer?.displayName || 'ক'} size="sm" />
                <div className="buyer-info">
                  <div className="buyer-name">{room.buyer?.displayName || 'ক্রেতা'}</div>
                  <div className="buyer-meta truncate">{room.lastMessage?.messageText || 'কোনো মেসেজ নেই'}</div>
                </div>
              </button>
            ))}
            {buyerRooms.length === 0 && <p className="text-sm text-muted">এই বিজ্ঞাপন নিয়ে কারো সাথে চ্যাট হয়নি।</p>}

            <button
              type="button"
              className={`buyer-list-item ${selected === EXTERNAL ? 'selected' : ''}`}
              onClick={() => setSelected(EXTERNAL)}
            >
              <span className="buyer-external-icon"><Store size={18} /></span>
              <div className="buyer-info">
                <div className="buyer-name">বেচা-কেনার বাইরে বিক্রি করেছি</div>
                <div className="buyer-meta">এক্ষেত্রে কেউ রিভিউ দিতে পারবে না</div>
              </div>
            </button>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>বাতিল</button>
          <button type="button" className="btn btn-primary" onClick={handleConfirm} disabled={!selected || isSubmitting}>
            {isSubmitting ? 'সেভ হচ্ছে…' : 'নিশ্চিত করুন'}
          </button>
        </div>
      </div>
    </div>
  );
};
