import { Link } from 'react-router-dom';
import { ShoppingBag, Globe, Mail, Phone, MessageSquare } from 'lucide-react';
import './Footer.css';

export const Footer = () => {
  return (
    <footer className="main-footer">
      <div className="container footer-container">
        <div className="footer-col about-col">
          <Link to="/" className="footer-logo">
            <ShoppingBag size={24} className="logo-icon" />
            <span className="logo-text-white">Becha</span>
            <span className="logo-text-yellow">-Kena</span>
          </Link>
          <p className="footer-desc">
            বাংলাদেশের সবচেয়ে নিরাপদ সেকেন্ড-হ্যান্ড মার্কেটপ্লেস। আপনার পুরাতন জিনিস বিক্রি করুন সহজে এবং নিরাপদে।
          </p>
          <div className="social-links">
            <a href="#" className="social-link"><Globe size={20} /></a>
            <a href="#" className="social-link"><Mail size={20} /></a>
            <a href="#" className="social-link"><Phone size={20} /></a>
            <a href="#" className="social-link"><MessageSquare size={20} /></a>
          </div>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Quick Links</h4>
          <ul className="footer-links">
            <li><Link to="/">Home</Link></li>
            <li><Link to="/listings">Browse Listings</Link></li>
            <li><Link to="/listings/create">Post Ad</Link></li>
            <li><Link to="/how-it-works">How It Works</Link></li>
            <li><Link to="/contact">Contact Us</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Categories</h4>
          <ul className="footer-links">
            <li><Link to="/listings?category=Mobile">Mobile</Link></li>
            <li><Link to="/listings?category=Electronics">Electronics</Link></li>
            <li><Link to="/listings?category=Vehicles">Vehicles</Link></li>
            <li><Link to="/listings?category=Furniture">Furniture</Link></li>
            <li><Link to="/listings?category=Fashion">Fashion</Link></li>
            <li><Link to="/listings?category=Other">Other</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4 className="footer-heading">Support</h4>
          <ul className="footer-links">
            <li><Link to="/faq">FAQ</Link></li>
            <li><Link to="/safety">Safety Tips</Link></li>
            <li><Link to="/report">Report a Problem</Link></li>
            <li><Link to="/terms">Terms of Service</Link></li>
            <li><Link to="/privacy">Privacy Policy</Link></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="container bottom-content">
          <p className="copyright">© 2026 Becha-Kena. All rights reserved.</p>
          <div className="payment-methods">
            {/* Placeholders for payment method icons */}
            <span className="payment-badge">bKash</span>
            <span className="payment-badge">Nagad</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
