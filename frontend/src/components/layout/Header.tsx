import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, NavLink, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, User, LogOut, MessageCircle, FileText, ShieldCheck, Plus, ChevronDown, LayoutDashboard, Flag,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLogout, useRequireVerified } from '../../hooks/useAuth';
import { useUnreadCount } from '../../hooks/useUnreadCount';
import { formatNumber } from '../../utils/formatters';
import { Logo } from './Logo';
import './Header.css';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, isVerified } = useAuthStore();
  const logout = useLogout();
  const requireVerified = useRequireVerified();
  const unread = useUnreadCount();

  const [query, setQuery] = useState(searchParams.get('search') || '');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Keep the box in sync when navigating between searches
  useEffect(() => {
    setQuery(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => setMenuOpen(false), [location.pathname]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    navigate(q ? `/listings?search=${encodeURIComponent(q)}` : '/listings');
  };

  const handlePostAd = () => {
    if (requireVerified('/listings/create')) navigate('/listings/create');
  };

  const isStaff = user?.role === 'admin' || user?.role === 'moderator';

  return (
    <header className="site-header">
      <div className="container site-header__inner">
        <Logo />

        <form className="header-search" onSubmit={handleSearch} role="search">
          <Search size={18} className="header-search__icon" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="মোবাইল, বাইক, ফার্নিচার… কী খুঁজছেন?"
            aria-label="বিজ্ঞাপন খুঁজুন"
          />
          <button type="submit" className="header-search__btn">খুঁজুন</button>
        </form>

        <nav className="header-actions" aria-label="অ্যাকাউন্ট">
          {isAuthenticated && isVerified && (
            <Link to="/chat" className="header-icon-link" aria-label="মেসেজ">
              <MessageCircle size={22} />
              {unread > 0 && <span className="header-dot">{unread > 9 ? '৯+' : formatNumber(unread)}</span>}
            </Link>
          )}

          {!isAuthenticated ? (
            <Link to="/login" className="header-login">
              <User size={18} />
              <span>লগইন</span>
            </Link>
          ) : (
            <div className="account-menu" ref={menuRef}>
              <button
                type="button"
                className="account-menu__btn"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
              >
                <span className="account-avatar">{user?.displayName?.charAt(0).toUpperCase() || 'U'}</span>
                <span className="account-name">{user?.displayName || 'আমার অ্যাকাউন্ট'}</span>
                <ChevronDown size={16} />
              </button>

              {menuOpen && (
                <div className="account-dropdown" role="menu">
                  <div className="account-dropdown__head">
                    <strong>{user?.displayName}</strong>
                    {isVerified ? (
                      <span className="badge badge-green"><ShieldCheck size={12} /> ভেরিফাইড</span>
                    ) : (
                      <span className="badge badge-yellow">যাচাই বাকি</span>
                    )}
                  </div>
                  <NavLink to="/profile" end className="dropdown-item"><User size={16} /> আমার প্রোফাইল</NavLink>
                  <NavLink to="/dashboard/my-listings" className="dropdown-item"><FileText size={16} /> আমার বিজ্ঞাপন</NavLink>
                  {isVerified && (
                    <NavLink to="/chat" className="dropdown-item">
                      <MessageCircle size={16} /> মেসেজ
                      {unread > 0 && <span className="dropdown-count">{formatNumber(unread)}</span>}
                    </NavLink>
                  )}
                  <NavLink to="/profile/reports" className="dropdown-item"><Flag size={16} /> আমার রিপোর্ট</NavLink>
                  {!isVerified && (
                    <NavLink to="/verify" className="dropdown-item dropdown-item--highlight"><ShieldCheck size={16} /> NID দিয়ে যাচাই করুন</NavLink>
                  )}
                  {isStaff && (
                    <NavLink to="/admin" className="dropdown-item"><LayoutDashboard size={16} /> অ্যাডমিন প্যানেল</NavLink>
                  )}
                  <button type="button" onClick={logout} className="dropdown-item dropdown-item--danger">
                    <LogOut size={16} /> লগআউট
                  </button>
                </div>
              )}
            </div>
          )}

          <button type="button" onClick={handlePostAd} className="btn btn-accent header-post">
            <Plus size={18} strokeWidth={2.5} />
            <span>বিজ্ঞাপন দিন</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
