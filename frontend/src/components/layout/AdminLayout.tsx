import { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  IdCard, 
  Flag, 
  Users, 
  LogOut,
  Menu,
  X,
  ShoppingBag
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

import './AdminLayout.css';

export const AdminLayout = () => {
  const { user, clearUser } = useAuthStore();
  const location = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/admin': return 'ড্যাশবোর্ড (Dashboard)';
      case '/admin/moderation': return 'মডারেশন কিউ (Moderation Queue)';
      case '/admin/kyc-queue': return 'KYC যাচাই কিউ (KYC Queue)';
      case '/admin/reports': return 'রিপোর্টস (Reports)';
      case '/admin/users': return 'ইউজার ম্যানেজমেন্ট (Users)';
      default: return 'অ্যাডমিন প্যানেল';
    }
  };

  const navItems = [
    { path: '/admin', label: 'ড্যাশবোর্ড', icon: <LayoutDashboard size={20} /> },
    { path: '/admin/moderation', label: 'মডারেশন কিউ', icon: <ShieldAlert size={20} />, badge: 12 },
    { path: '/admin/kyc-queue', label: 'KYC যাচাই কিউ', icon: <IdCard size={20} />, badge: 5 },
    { path: '/admin/reports', label: 'রিপোর্টস', icon: <Flag size={20} />, badge: 3 },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/admin/users', label: 'ইউজার ম্যানেজমেন্ট', icon: <Users size={20} /> });
  }

  return (
    <div className="admin-layout">
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="admin-sidebar-header">
          <ShoppingBag size={24} className="text-primary" />
          <h2>Becha-Kena Admin</h2>
          <button 
            className="md:hidden ml-auto text-gray-400 hover:text-white"
            onClick={() => setIsMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `admin-nav-item ${isActive || (item.path === '/admin' && location.pathname === '/admin') ? 'active' : ''}`}
              end={item.path === '/admin'}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge ? (
                <span className="admin-badge">{item.badge}</span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <div className="admin-user-info">
            <div className="admin-avatar-small">
              {user?.displayName?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="admin-user-details">
              <div className="admin-user-name">{user?.displayName || 'Admin User'}</div>
              <div className="admin-user-role">{user?.role}</div>
            </div>
            <button className="admin-logout-btn" onClick={() => clearUser()} title="লগ আউট">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button 
              className="mobile-menu-btn"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu size={24} />
            </button>
            <h1 className="admin-page-title">{getPageTitle()}</h1>
          </div>
          
          <div className="admin-topbar-right">
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('bn-BD', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="admin-content-scroll">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
