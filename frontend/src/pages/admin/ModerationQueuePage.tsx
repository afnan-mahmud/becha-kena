import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Check, X, Eye, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getModerationQueue, moderateListing } from '../../services/admin.service';
import { formatPrice, formatRelativeTime } from '../../utils/formatters';
import { Pagination } from '../../components/common/Pagination';
import './ModerationQueuePage.css';

export const ModerationQueuePage = () => {
  const [page, setPage] = useState(1);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['moderation-queue', page],
    queryFn: () => getModerationQueue(page),
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, action, reason }: { id: string; action: 'approve' | 'reject'; reason?: string }) => 
      moderateListing(id, action, reason),
    onSuccess: (_, variables) => {
      toast.success(`বিজ্ঞাপনটি ${variables.action === 'approve' ? 'অনুমোদিত' : 'বাতিল'} হয়েছে`);
      setRejectingId(null);
      setRejectReason('');
      queryClient.invalidateQueries({ queryKey: ['moderation-queue'] });
    },
    onError: () => {
      toast.error('সমস্যা হয়েছে, আবার চেষ্টা করুন');
    }
  });

  const handleApprove = (id: string) => {
    if (window.confirm('আপনি কি এই বিজ্ঞাপনটি অনুমোদন করতে চান?')) {
      moderateMutation.mutate({ id, action: 'approve' });
    }
  };

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) {
      toast.error('বাতিল করার কারণ উল্লেখ করুন');
      return;
    }
    moderateMutation.mutate({ id: rejectingId!, action: 'reject', reason: rejectReason });
  };

  if (isLoading) {
    return <div className="flex-center p-10"><div className="spinner"></div></div>;
  }

  const listings = data?.data?.items || [];
  const totalPages = data?.data?.totalPages || 1;

  return (
    <div className="moderation-queue">
      <div className="moderation-table-container">
        <table className="moderation-table">
          <thead>
            <tr>
              <th>ছবি</th>
              <th>শিরোনাম ও বিক্রেতা</th>
              <th>ক্যাটাগরি ও মূল্য</th>
              <th>তারিখ</th>
              <th>স্ট্যাটাস</th>
              <th>অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {listings.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    কিউ-তে কোনো বিজ্ঞাপন নেই
                  </div>
                </td>
              </tr>
            ) : (
              listings.map(listing => (
                <tr key={listing.id}>
                  <td>
                    <img 
                      src={listing.images[0] || '/placeholder.jpg'} 
                      alt={listing.title}
                      className="moderation-thumb"
                    />
                  </td>
                  <td>
                    <div className="listing-title">{listing.title}</div>
                    <div className="listing-meta">
                      {typeof listing.sellerId === 'object' && listing.sellerId !== null
                        ? (listing.sellerId as any).displayName 
                        : 'Unknown Seller'}
                    </div>
                  </td>
                  <td>
                    <div>{listing.category}</div>
                    <div className="font-semibold text-primary">{formatPrice(listing.price)}</div>
                  </td>
                  <td>
                    {formatRelativeTime(listing.createdAt)}
                  </td>
                  <td>
                    {listing.moderationFlags?.isFlagged && (
                      <span className="flag-badge">
                        <AlertTriangle size={12} />
                        {listing.moderationFlags.flagType || 'Flagged'}
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="action-btn btn-approve"
                        title="অনুমোদন করুন"
                        onClick={() => handleApprove(listing.id)}
                        disabled={moderateMutation.isPending}
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        className="action-btn btn-reject"
                        title="বাতিল করুন"
                        onClick={() => setRejectingId(listing.id)}
                        disabled={moderateMutation.isPending}
                      >
                        <X size={18} />
                      </button>
                      <Link 
                        to={`/listings/${listing.id}`} 
                        target="_blank"
                        className="action-btn btn-view"
                        title="বিস্তারিত দেখুন"
                      >
                        <Eye size={18} />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination 
          currentPage={page} 
          totalPages={totalPages} 
          onPageChange={setPage} 
        />
      )}

      {/* Reject Modal */}
      {rejectingId && (
        <div className="reject-modal-overlay" onClick={() => setRejectingId(null)}>
          <div className="reject-modal" onClick={e => e.stopPropagation()}>
            <h3>বাতিল করার কারণ</h3>
            <textarea 
              className="reject-textarea"
              placeholder="কেন এই বিজ্ঞাপনটি বাতিল করা হচ্ছে তা লিখুন..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="reject-actions">
              <button 
                className="btn btn-outline"
                onClick={() => setRejectingId(null)}
              >
                বন্ধ করুন
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleRejectSubmit}
                disabled={moderateMutation.isPending}
              >
                নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
