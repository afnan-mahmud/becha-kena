import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, ShoppingBag, User, LogOut, MessageCircle, Settings, FileText, CheckCircle, PlusCircle, Globe } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useUiStore } from '../../store/uiStore';
import './Header.css';

export const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isVerified, clearUser } = useAuthStore();
  const { toggleMobileMenu } = useUiStore();

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
                <Link to="/profile" className="dropdown-item">
                  <User size={16} /> My Profile
                </Link>
                <Link to="/dashboard/listings" className="dropdown-item">
                  <FileText size={16} /> My Listings
                </Link>
                <Link to="/chat" className="dropdown-item">
                  <MessageCircle size={16} /> Messages
                  <span className="badge">2</span>
                </Link>
                {!isVerified && (
                  <Link to="/verify" className="dropdown-item verify-link">
                    <CheckCircle size={16} /> Verify Account
                  </Link>
                )}
                <Link to="/profile/settings" className="dropdown-item">
                  <Settings size={16} /> Settings
                </Link>
                <button onClick={clearUser} className="dropdown-item logout-btn">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
          )}

          <button onClick={handlePostAd} className="post-ad-btn">
            <PlusCircle size={18} />
            <span>বিজ্ঞাপন দিন</span>
          </button>
        </div>
      </div>
    </header>
  );
};
