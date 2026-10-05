import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ShieldAlert, 
  IdCard, 
  Flag, 
  Users, 
  Package,
} from 'lucide-react';
import { getDashboardStats } from '../../services/admin.service';

import './AdminDashboardPage.css';

export const AdminDashboardPage = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: getDashboardStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const stats = data?.data;

  if (isLoading) {
    return <div className="flex-center p-10"><div className="spinner"></div></div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-stats-grid">
        <Link to="/admin/moderation" className="admin-stat-card">
          <div className="stat-icon-wrapper bg-blue-light">
            <ShieldAlert size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Pending Listings</div>
            <div className="stat-value">{stats?.pendingListings ?? 0}</div>
          </div>
        </Link>

        <Link to="/admin/kyc-queue" className="admin-stat-card">
          <div className="stat-icon-wrapper bg-yellow-light">
            <IdCard size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Pending KYC</div>
            <div className="stat-value">{stats?.pendingKYC ?? 0}</div>
          </div>
        </Link>

        <Link to="/admin/reports" className="admin-stat-card">
          <div className="stat-icon-wrapper bg-red-light">
            <Flag size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Pending Reports</div>
            <div className="stat-value">{stats?.pendingReports ?? 0}</div>
          </div>
        </Link>

        <Link to="/admin/users" className="admin-stat-card">
          <div className="stat-icon-wrapper bg-purple-light">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Active Users</div>
            <div className="stat-value">{stats?.activeUsers ?? 0}</div>
          </div>
        </Link>

        <div className="admin-stat-card" style={{ cursor: 'default' }}>
          <div className="stat-icon-wrapper bg-green-light">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Active Listings</div>
            <div className="stat-value">{stats?.activeListings ?? 0}</div>
          </div>
        </div>
      </div>

      <div className="admin-activity-section">
        <div className="activity-header">
          <h2>Recent Activity</h2>
        </div>
        <div className="activity-list">
          <div className="empty-state" style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
            কোনো সাম্প্রতিক কার্যকলাপ নেই
          </div>
        </div>
      </div>
    </div>
  );
};
