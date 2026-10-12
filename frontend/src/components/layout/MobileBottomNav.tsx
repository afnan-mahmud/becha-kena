import { NavLink, useNavigate } from 'react-router-dom';
import { Home, Search, Plus, MessageCircle, User } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useRequireVerified } from '../../hooks/useAuth';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import { formatNumber } from '../../utils/formatters';
import './MobileBottomNav.css';

export const MobileBottomNav = () => {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const requireVerified = useRequireVerified();
  const unread = useUnreadCount();

  const go = (path: string) => () => {
    if (requireVerified(path)) navigate(path);
  };

  return (
    <nav className="bottom-nav" aria-label="মোবাইল নেভিগেশন">
      <NavLink to="/" end className="bottom-nav__item">
        <Home size={22} />
        <span>হোম</span>
      </NavLink>

      <NavLink to="/listings" className="bottom-nav__item">
        <Search size={22} />
        <span>খুঁজুন</span>
      </NavLink>

      <button type="button" className="bottom-nav__item bottom-nav__post" onClick={go('/listings/create')}>
        <span className="bottom-nav__fab"><Plus size={26} strokeWidth={2.5} /></span>
        <span>বিজ্ঞাপন দিন</span>
      </button>

      <button type="button" className="bottom-nav__item" onClick={go('/chat')}>
        <span className="bottom-nav__icon">
          <MessageCircle size={22} />
          {unread > 0 && <span className="bottom-nav__badge">{unread > 9 ? '৯+' : formatNumber(unread)}</span>}
        </span>
        <span>চ্যাট</span>
      </button>

      <NavLink to={isAuthenticated ? '/profile' : '/login'} className="bottom-nav__item">
        <User size={22} />
        <span>{isAuthenticated ? 'প্রোফাইল' : 'লগইন'}</span>
      </NavLink>
    </nav>
  );
};
