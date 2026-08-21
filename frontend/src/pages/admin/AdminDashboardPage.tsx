import { Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  IdCard, 
  Flag, 
  Users, 
  Package,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';

import './AdminDashboardPage.css';

// Mock data for initial implementation
const mockStats = {
  pendingListings: 12,
  pendingKYC: 5,
  pendingReports: 3,
  activeUsers: 1254,
  activeListings: 890
};

const mockActivity = [
  { id: 1, type: 'approve', action: 'Approved listing "iPhone 13 Pro"', user: 'Admin 1', time: '10 minutes ago', icon: <CheckCircle size={16} className="text-green-600" /> },
  { id: 2, type: 'reject', action: 'Rejected KYC for User ID #892', user: 'Admin 2', time: '1 hour ago', icon: <XCircle size={16} className="text-red-600" /> },
  { id: 3, type: 'review', action: 'Reviewed report against listing "Honda Civic"', user: 'Admin 1', time: '2 hours ago', icon: <Eye size={16} className="text-blue-600" /> },
  { id: 4, type: 'approve', action: 'Approved KYC for User ID #891', user: 'Admin 2', time: '3 hours ago', icon: <CheckCircle size={16} className="text-green-600" /> },
];

export const AdminDashboardPage = () => {
  return (
    <div className="admin-dashboard">
      <div className="admin-stats-grid">
        <Link to="/admin/moderation" className="admin-stat-card">
          <div className="stat-icon-wrapper bg-blue-light">
            <ShieldAlert size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Pending Listings</div>
            <div className="stat-value">{mockStats.pendingListings}</div>
          </div>
        </Link>

        <Link to="/admin/kyc-queue" className="admin-stat-card">
          <div className="stat-icon-wrapper bg-yellow-light">
            <IdCard size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Pending KYC</div>
            <div className="stat-value">{mockStats.pendingKYC}</div>
          </div>
        </Link>

        <Link to="/admin/reports" className="admin-stat-card">
          <div className="stat-icon-wrapper bg-red-light">
            <Flag size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Pending Reports</div>
            <div className="stat-value">{mockStats.pendingReports}</div>
          </div>
        </Link>

        <Link to="/admin/users" className="admin-stat-card">
          <div className="stat-icon-wrapper bg-purple-light">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Active Users</div>
            <div className="stat-value">{mockStats.activeUsers}</div>
          </div>
        </Link>

        <div className="admin-stat-card" style={{ cursor: 'default' }}>
          <div className="stat-icon-wrapper bg-green-light">
            <Package size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-label">Active Listings</div>
            <div className="stat-value">{mockStats.activeListings}</div>
          </div>
        </div>
      </div>

      <div className="admin-activity-section">
        <div className="activity-header">
          <h2>Recent Activity</h2>
        </div>
        <div className="activity-list">
          {mockActivity.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">
                {activity.icon}
              </div>
              <div className="activity-details">
                <div className="activity-text">
                  <strong>{activity.user}</strong> {activity.action}
                </div>
                <div className="activity-time">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
