import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Grid, PlusCircle, MessageCircle, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import './MobileBottomNav.css';

export const MobileBottomNav = () => {
  const { isAuthenticated, isVerified } = useAuthStore();
  const navigate = useNavigate();

  const handlePostAd = (e: React.MouseEvent) => {
    e.preventDefault();
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
    <nav className="mobile-bottom-nav">
      <NavLink 
        to="/" 
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        end
      >
        <Home size={24} />
        <span>হোম</span>
      </NavLink>

      <NavLink 
        to="/listings" 
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <Grid size={24} />
        <span>ক্যাটেগরি</span>
      </NavLink>

      <div className="bottom-nav-item post-ad-container" onClick={handlePostAd}>
        <div className="post-ad-fab">
          <PlusCircle size={28} />
        </div>
        <span>পোস্ট করুন</span>
      </div>

      <NavLink 
        to="/chat" 
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <div className="icon-badge-container">
          <MessageCircle size={24} />
          <span className="badge">2</span>
        </div>
        <span>মেসেজ</span>
      </NavLink>

      <NavLink 
        to={isAuthenticated ? "/profile" : "/login"} 
        className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
      >
        <User size={24} />
        <span>{isAuthenticated ? 'প্রোফাইল' : 'লগইন'}</span>
      </NavLink>
    </nav>
  );
};
