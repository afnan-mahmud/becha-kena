import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X, UserSearch } from 'lucide-react';
import toast from 'react-hot-toast';
import { getKYCQueue, resolveVerification } from '../../services/admin.service';
import { formatRelativeTime } from '../../utils/formatters';
import { Pagination } from '../../components/common/Pagination';
import './KYCQueuePage.css';

export const KYCQueuePage = () => {
  const [page, setPage] = useState(1);
  const [viewingSelfie, setViewingSelfie] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['kyc-queue', page],
    queryFn: () => getKYCQueue(page),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, action, verifiedName, reason }: { id: string; action: 'approve' | 'reject'; verifiedName?: string; reason?: string }) =>
      resolveVerification(id, action, { verifiedName, reason }),
    onSuccess: (_, variables) => {
      toast.success(`KYC ${variables.action === 'approve' ? 'অনুমোদিত' : 'বাতিল'} হয়েছে`);
      queryClient.invalidateQueries({ queryKey: ['kyc-queue'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'সমস্যা হয়েছে, আবার চেষ্টা করুন');
    }
  });

  const handleResolve = (id: string, action: 'approve' | 'reject') => {
    if (action === 'approve') {
      // The legal name shown on profiles must match the NID card exactly
      const verifiedName = window.prompt('NID কার্ডে লেখা আইনগত নাম লিখুন (যেমন: MD. RAHIM UDDIN):');
      if (verifiedName === null) return;
      resolveMutation.mutate({ id, action, verifiedName: verifiedName.trim() || undefined });
    } else {
      const reason = window.prompt('বাতিলের কারণ লিখুন (ইউজার দেখতে পাবে):');
      if (reason === null) return;
      resolveMutation.mutate({ id, action, reason: reason.trim() || undefined });
    }
  };

  const handleViewSelfie = async (path?: string) => {
    if (!path) {
      toast.error('সেলফি পাওয়া যায়নি');
      return;
    }
    setViewingSelfie('loading');
    
    // In a real app with S3 private bucket, you'd fetch a presigned read URL here.
    // For now we will assume path is a public URL or we mock it.
    setTimeout(() => {
      setSelfieUrl(path);
      setViewingSelfie(path);
    }, 500);
  };

  if (isLoading) {
    return <div className="flex-center p-10"><div className="spinner"></div></div>;
  }

  const verifications = data?.data?.items || [];
  const totalPages = data?.data?.totalPages || 1;

  return (
    <div className="kyc-queue">
      <div className="kyc-table-container">
        <table className="kyc-table">
          <thead>
            <tr>
              <th>ইউজার নাম</th>
              <th>ফোন নম্বর</th>
              <th>যাচাইকরণের ধরন</th>
              <th>তারিখ</th>
              <th>রিভিউর কারণ</th>
              <th>অ্যাকশন</th>
            </tr>
          </thead>
          <tbody>
            {verifications.length === 0 ? (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    কিউ-তে কোনো KYC আবেদন নেই
                  </div>
                </td>
              </tr>
            ) : (
              verifications.map(log => {
                // Ensure user exists before trying to render its properties
                if (!log.userId || typeof log.userId === 'string') return null;

                return (
                  <tr key={log.id}>
                    <td className="font-medium text-primary">
                      {(log.userId as any).displayName}
                    </td>
                    <td>
                      {(log.userId as any).phoneNumber}
                    </td>
                    <td>
                      <span className={`kyc-type-badge ${log.verificationType === 'minor' ? 'kyc-type-minor' : 'kyc-type-adult'}`}>
                        {log.verificationType === 'minor' ? 'অভিভাবকের NID (অপ্রাপ্তবয়স্ক)' : 'নিজের NID'}
                      </span>
                    </td>
                    <td>
                      {formatRelativeTime(log.createdAt)}
                    </td>
                    <td>
                      <div className="kyc-reason" title={log.manualReviewReason || undefined}>
                        {log.manualReviewReason || 'Automated Check Failed'}
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn btn-approve"
                          title="অনুমোদন করুন"
                          onClick={() => handleResolve(log.id, 'approve')}
                          disabled={resolveMutation.isPending}
                        >
                          <Check size={18} />
                        </button>
                        <button 
                          className="action-btn btn-reject"
                          title="বাতিল করুন"
                          onClick={() => handleResolve(log.id, 'reject')}
                          disabled={resolveMutation.isPending}
                        >
                          <X size={18} />
                        </button>
                        <button 
                          className="action-btn btn-view"
                          title="সেলফি দেখুন"
                          onClick={() => handleViewSelfie(log.selfieUrl)}
                          disabled={viewingSelfie === 'loading'}
                        >
                          <UserSearch size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
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

      {/* Selfie Modal */}
      {viewingSelfie && viewingSelfie !== 'loading' && (
        <div className="selfie-modal-overlay" onClick={() => { setViewingSelfie(null); setSelfieUrl(null); }}>
          <div className="selfie-modal" onClick={e => e.stopPropagation()}>
            <button className="selfie-modal-close" onClick={() => { setViewingSelfie(null); setSelfieUrl(null); }}>
              <X size={24} />
            </button>
            <h3 className="font-semibold text-lg">ভেরিফিকেশন সেলফি</h3>
            {selfieUrl ? (
              <img src={selfieUrl} alt="Selfie" className="selfie-image" />
            ) : (
              <div className="p-10 text-center text-gray-500">ছবি লোড করা যাচ্ছে না</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
