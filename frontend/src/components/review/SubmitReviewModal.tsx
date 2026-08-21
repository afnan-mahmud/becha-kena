import { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { StarRatingInput } from '../ui/StarRatingInput';
import { submitReview } from '../../services/review.service';

import './SubmitReviewModal.css';

interface SubmitReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
}

export const SubmitReviewModal = ({ isOpen, onClose, listingId }: SubmitReviewModalProps) => {
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('অনুগ্রহ করে একটি রেটিং দিন');
      return;
    }
    if (!reviewText.trim()) {
      toast.error('অনুগ্রহ করে আপনার মন্তব্য লিখুন');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReview({ listingId, rating, reviewText });
      toast.success('রিভিউ সফলভাবে জমা দেওয়া হয়েছে!');
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'রিভিউ জমা দিতে সমস্যা হয়েছে';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal-container" onClick={e => e.stopPropagation()}>
        <div className="review-modal-header">
          <h2>বিক্রেতাকে রিভিউ দিন</h2>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="review-modal-body">
            <div className="review-rating-container">
              <span className="review-rating-label">আপনার অভিজ্ঞতা কেমন ছিল?</span>
              <StarRatingInput 
                value={rating} 
                onChange={setRating} 
                size="lg" 
              />
            </div>

            <div className="form-group">
              <label className="form-label">আপনার মন্তব্য *</label>
              <textarea
                className="form-control"
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                maxLength={500}
                placeholder="বিক্রেতা এবং পণ্য সম্পর্কে আপনার অভিজ্ঞতা বিস্তারিত লিখুন..."
                required
              />
              <div className="text-right text-xs text-muted mt-1">
                {reviewText.length}/500
              </div>
            </div>
          </div>

          <div className="review-modal-footer">
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              বাতিল
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isSubmitting || rating === 0 || !reviewText.trim()}
            >
              {isSubmitting ? 'জমা দেওয়া হচ্ছে...' : 'রিভিউ জমা দিন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
