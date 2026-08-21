import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, UserX, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { getReports, resolveReport, dismissReport, banUser } from '../../services/admin.service';
import { formatRelativeTime } from '../../utils/formatters';
import { Pagination } from '../../components/common/Pagination';
import { useAuthStore } from '../../store/authStore';
import './ReportManagementPage.css';

type TabType = 'pending' | 'resolved' | 'dismissed';

export const ReportManagementPage = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [page, setPage] = useState(1);
  
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState('');
  
  const [banningUserId, setBanningUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', activeTab, page],
    queryFn: () => getReports(activeTab, page),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => resolveReport(id, text),
    onSuccess: () => {
      toast.success('রিপোর্ট সমাধান করা হয়েছে');
      setResolvingId(null);
      setResolutionText('');
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    },
    onError: () => toast.error('সমস্যা হয়েছে')
  });

  const dismissMutation = useMutation({
    mutationFn: (id: string) => dismissReport(id),
    onSuccess: () => {
      toast.success('রিপোর্ট বাতিল করা হয়েছে');
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
    },
    onError: () => toast.error('সমস্যা হয়েছে')
  });

  const banMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => banUser(id, reason),
    onSuccess: () => {
      toast.success('ইউজার ব্যান করা হয়েছে');
      setBanningUserId(null);
      setBanReason('');
    },
    onError: () => toast.error('সমস্যা হয়েছে')
  });

  const handleResolveSubmit = () => {
    if (!resolutionText.trim()) {
      toast.error('সমাধানের বিবরণ লিখুন');
      return;
    }
    resolveMutation.mutate({ id: resolvingId!, text: resolutionText });
  };

  const handleDismiss = (id: string) => {
    if (window.confirm('আপনি কি এই রিপোর্টটি বাতিল করতে চান?')) {
      dismissMutation.mutate(id);
    }
  };

  const handleBanSubmit = () => {
    if (!banReason.trim()) {
      toast.error('ব্যান করার কারণ লিখুন');
      return;
    }
    banMutation.mutate({ id: banningUserId!, reason: banReason });
  };

  const getStatusBadgeClass = (status: string) => {
    switch(status) {
      case 'pending': return 'status-badge-pending';
      case 'resolved': return 'status-badge-resolved';
      case 'dismissed': return 'status-badge-rejected';
      default: return 'status-badge-pending';
    }
  };

  if (isLoading) {
    return <div className="flex-center p-10"><div className="spinner"></div></div>;
  }

  const reports = data?.data?.items || [];
  const totalPages = data?.data?.totalPages || 1;

  return (
    <div className="report-management">
      <div className="report-tabs">
        <button 
          className={`report-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => { setActiveTab('pending'); setPage(1); }}
        >
          অপেক্ষমান
        </button>
        <button 
          className={`report-tab ${activeTab === 'resolved' ? 'active' : ''}`}
          onClick={() => { setActiveTab('resolved'); setPage(1); }}
        >
          সমাধান হয়েছে
        </button>
        <button 
          className={`report-tab ${activeTab === 'dismissed' ? 'active' : ''}`}
          onClick={() => { setActiveTab('dismissed'); setPage(1); }}
        >
          বাতিল
        </button>
      </div>

      <div className="report-table-container">
        <table className="report-table">
          <thead>
            <tr>
              <th>রিপোর্টার</th>
              <th>টার্গেট</th>
              <th>কারণ ও বিবরণ</th>
              <th>স্ট্যাটাস</th>
              <th>তারিখ</th>
              {activeTab === 'pending' && <th>অ্যাকশন</th>}
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 ? (
              <tr>
                <td colSpan={activeTab === 'pending' ? 6 : 5}>
                  <div className="empty-state">
                    কোনো রিপোর্ট পাওয়া যায়নি
                  </div>
                </td>
              </tr>
            ) : (
              reports.map(report => (
                <tr key={report.id}>
                  <td className="font-medium text-primary">
                    {typeof report.reporterId === 'object' && report.reporterId !== null
                      ? (report.reporterId as any).displayName 
                      : 'Unknown User'}
                  </td>
                  <td>
                    <div className="target-type-badge">{report.targetType}</div>
                    <div className="text-sm">ID: {report.targetId.slice(-6)}</div>
                  </td>
                  <td>
                    <div className="report-reason">{report.reason}</div>
                    <div className="report-description" title={report.description}>
                      {report.description}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(report.status)}`}>
                      {report.status}
                    </span>
                  </td>
                  <td>
                    {formatRelativeTime(report.createdAt)}
                  </td>
                  {activeTab === 'pending' && (
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn btn-resolve"
                          title="সমাধান করুন"
                          onClick={() => setResolvingId(report.id)}
                          disabled={resolveMutation.isPending}
                        >
                          <CheckCircle size={18} />
                        </button>
                        <button 
                          className="action-btn btn-dismiss"
                          title="বাতিল করুন"
                          onClick={() => handleDismiss(report.id)}
                          disabled={dismissMutation.isPending}
                        >
                          <XCircle size={18} />
                        </button>
                        
                        {/* Only Admin can ban */}
                        {user?.role === 'admin' && report.targetType === 'user' && (
                          <button 
                            className="action-btn btn-ban"
                            title="ইউজার ব্যান করুন"
                            onClick={() => setBanningUserId(report.targetId)}
                          >
                            <UserX size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
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

      {/* Resolve Modal */}
      {resolvingId && (
        <div className="resolve-modal-overlay" onClick={() => setResolvingId(null)}>
          <div className="resolve-modal" onClick={e => e.stopPropagation()}>
            <h3>রিপোর্ট সমাধান</h3>
            <textarea 
              className="resolve-textarea"
              placeholder="কিভাবে সমাধান করা হলো তার বিবরণ লিখুন..."
              value={resolutionText}
              onChange={e => setResolutionText(e.target.value)}
            />
            <div className="resolve-actions">
              <button 
                className="btn btn-outline"
                onClick={() => setResolvingId(null)}
              >
                বন্ধ করুন
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleResolveSubmit}
                disabled={resolveMutation.isPending}
              >
                সাবমিট করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ban User Modal */}
      {banningUserId && (
        <div className="resolve-modal-overlay" onClick={() => setBanningUserId(null)}>
          <div className="resolve-modal border-t-4 border-red-500" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertTriangle size={24} />
              <h3 className="!m-0 text-red-600">ইউজার ব্যান করুন</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              এই একশনটি পার্মানেন্ট। ব্যান করার কারণ উল্লেখ করুন।
            </p>
            <textarea 
              className="resolve-textarea border-red-200 focus:border-red-500"
              placeholder="ব্যান করার কারণ..."
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
            />
            <div className="resolve-actions">
              <button 
                className="btn btn-outline"
                onClick={() => setBanningUserId(null)}
              >
                বাতিল
              </button>
              <button 
                className="btn bg-red-600 hover:bg-red-700 text-white"
                onClick={handleBanSubmit}
                disabled={banMutation.isPending}
              >
                ব্যান নিশ্চিত করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
