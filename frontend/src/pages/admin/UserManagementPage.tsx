import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShieldAlert, ShieldCheck, CheckCircle2, AlertTriangle, UserX } from 'lucide-react';
import toast from 'react-hot-toast';
import { getUsers, banUser } from '../../services/admin.service';
import { formatRelativeTime } from '../../utils/formatters';
import { Pagination } from '../../components/common/Pagination';
import { useAuthStore } from '../../store/authStore';
import './UserManagementPage.css';

export const UserManagementPage = () => {
  const { user: currentUser } = useAuthStore();
  const [page, setPage] = useState(1);
  const [banningUserId, setBanningUserId] = useState<string | null>(null);
  const [banReason, setBanReason] = useState('');
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page],
    queryFn: () => getUsers(page),
  });

  const banMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => banUser(id, reason),
    onSuccess: () => {
      toast.success('ইউজার ব্যান করা হয়েছে');
      setBanningUserId(null);
      setBanReason('');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: () => toast.error('সমস্যা হয়েছে')
  });

  const handleBanSubmit = () => {
    if (!banReason.trim()) {
      toast.error('ব্যান করার কারণ লিখুন');
      return;
    }
    banMutation.mutate({ id: banningUserId!, reason: banReason });
  };

  if (isLoading) {
    return <div className="flex-center p-10"><div className="spinner"></div></div>;
  }

  const users = data?.data?.items || [];
  const totalPages = data?.data?.totalPages || 1;

  return (
    <div className="user-management">
      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>নাম ও ফোন</th>
              <th>রোল</th>
              <th>ভেরিফিকেশন</th>
              <th>স্ট্যাটাস</th>
              <th>যোগদানের তারিখ</th>
              {currentUser?.role === 'admin' && <th>অ্যাকশন</th>}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={currentUser?.role === 'admin' ? 6 : 5}>
                  <div className="empty-state">
                    কোনো ইউজার পাওয়া যায়নি
                  </div>
                </td>
              </tr>
            ) : (
              users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="font-medium text-primary">{user.displayName || 'নামহীন'}</div>
                    <div className="text-sm text-gray-500">{user.phoneNumber}</div>
                  </td>
                  <td>
                    <span className={`user-role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    {user.isVerified ? (
                      <span className="verified-badge">
                        <CheckCircle2 size={16} /> ভেরিফাইড
                        {user.ageGroup && <span className="text-xs text-gray-400 ml-1">({user.ageGroup})</span>}
                      </span>
                    ) : (
                      <span className="unverified-badge">
                        <AlertTriangle size={16} /> আনভেরিফাইড
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`user-status-badge status-${user.status}`}>
                      {user.status === 'active' && <ShieldCheck size={14} />}
                      {(user.status === 'suspended' || user.status === 'banned') && <ShieldAlert size={14} />}
                      {user.status}
                    </span>
                  </td>
                  <td>
                    {formatRelativeTime(user.createdAt)}
                  </td>
                  {currentUser?.role === 'admin' && (
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="action-btn btn-ban"
                          title="ইউজার ব্যান করুন"
                          onClick={() => setBanningUserId(user.id)}
                          disabled={user.status === 'banned' || user.role === 'admin'}
                        >
                          <UserX size={18} />
                        </button>
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

      {/* Ban User Modal */}
      {banningUserId && (
        <div className="ban-modal-overlay" onClick={() => setBanningUserId(null)}>
          <div className="ban-modal border-t-4 border-red-500" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertTriangle size={24} />
              <h3 className="!m-0 text-red-600">ইউজার ব্যান করুন</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              এই একশনটি পার্মানেন্ট। ব্যান করার কারণ উল্লেখ করুন।
            </p>
            <textarea 
              className="ban-textarea border-red-200 focus:border-red-500"
              placeholder="ব্যান করার কারণ..."
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
            />
            <div className="ban-actions">
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
