import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, Menu, ShoppingBag, User, LogOut, MessageCircle, Settings, FileText, CheckCircle, PlusCircle, Globe, X } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import { logout } from '../../services/auth.service';
import './Header.css';

export const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isVerified, clearUser } = useAuthStore();
  const { toggleMobileMenu } = useUiStore();
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  const handlePostAd = () => {
    if (!isAuthenticated) {
      navigate('/login?redirect=/listings/create');
      return;
    }
    if (!isVerified) {
      navigate('/verify');
      return;
    }
    navigate('/listings/create');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      clearUser();
      navigate('/');
    }
  };

  return (
    <header className="main-header">
      <div className="container header-container">
        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-toggle"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          <Menu size={24} />
        </button>

        {/* Logo */}
        <Link to="/" className="header-logo">
          <ShoppingBag size={28} className="logo-icon" />
          <span className="logo-text-white">Becha</span>
          <span className="logo-text-yellow">-Kena</span>
        </Link>

        {/* Search Bar */}
        <div className="header-search">
          <select className="search-category" defaultValue="">
            <option value="">All Categories</option>
            <option value="Mobile">Mobile</option>
            <option value="Electronics">Electronics</option>
            <option value="Vehicles">Vehicles</option>
            <option value="Furniture">Furniture</option>
            <option value="Cycles">Cycles</option>
            <option value="Fashion">Fashion</option>
            <option value="Other">Other</option>
          </select>
          <input 
            type="text" 
            placeholder="আপনি কি খুঁজছেন?" 
            className="search-input"
          />
          <button className="search-button" aria-label="Search">
            <Search size={20} />
          </button>
        </div>

        {/* Actions */}
        <div className="header-actions">
          <button className="lang-toggle" aria-label="Toggle language">
            <Globe size={18} />
            <span>BN</span>
          </button>

          {!isAuthenticated ? (
            <Link to="/login" className="login-btn">
              <User size={20} />
              <span>Login</span>
            </Link>
          ) : (
            <div className="user-menu">
              <button className="user-menu-btn">
                <div className="user-avatar">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User size={18} />}
                </div>
                <span>My Account</span>
              </button>
              <div className="user-dropdown">
                <NavLink to="/profile" end className={({ isActive }) => `dropdown-item ${isActive ? 'text-primary bg-blue-50 font-medium' : ''}`}>
                  <User size={16} /> My Profile
                </NavLink>
                <NavLink to="/dashboard/my-listings" className={({ isActive }) => `dropdown-item ${isActive ? 'text-primary bg-blue-50 font-medium' : ''}`}>
                  <FileText size={16} /> My Listings
                </NavLink>
                <NavLink to="/chat" className={({ isActive }) => `dropdown-item ${isActive ? 'text-primary bg-blue-50 font-medium' : ''}`}>
                  <MessageCircle size={16} /> Messages
                  <span className="badge">2</span>
                </NavLink>
                {!isVerified && (
                  <NavLink to="/verify" className={({ isActive }) => `dropdown-item verify-link ${isActive ? 'font-medium' : ''}`}>
                    <CheckCircle size={16} /> Verify Account
                  </NavLink>
                )}
                <NavLink to="/profile/settings" className={({ isActive }) => `dropdown-item ${isActive ? 'text-primary bg-blue-50 font-medium' : ''}`}>
                  <Settings size={16} /> Settings
                </NavLink>
                <button onClick={handleLogout} className="dropdown-item logout-btn">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
          )}

          <button 
            className="mobile-search-toggle" 
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            aria-label="Toggle search"
          >
            {isMobileSearchOpen ? <X size={20} /> : <Search size={20} />}
          </button>

          <button onClick={handlePostAd} className="post-ad-btn">
            <PlusCircle size={18} />
            <span>বিজ্ঞাপন দিন</span>
          </button>
        </div>
      </div>

      {/* Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="mobile-search-overlay">
          <div className="container">
            <div className="header-search mobile-search-active">
              <input 
                type="text" 
                placeholder="আপনি কি খুঁজছেন?" 
                className="search-input"
                autoFocus
              />
              <button className="search-button" aria-label="Search">
                <Search size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
