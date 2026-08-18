import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Flame, Sparkles } from 'lucide-react';
import { MegaMenu } from './MegaMenu';
import './CategoryNav.css';

export const CategoryNav = () => {
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);

  return (
    <div className="category-nav-wrapper">
      <div className="container category-nav-container">
        <div 
          className="all-categories-btn"
          onMouseEnter={() => setIsMegaMenuOpen(true)}
          onMouseLeave={() => setIsMegaMenuOpen(false)}
        >
          <Menu size={20} />
          <span>সব ক্যাটেগরি</span>
          
          {/* MegaMenu is positioned absolute relative to its container */}
          <MegaMenu isOpen={isMegaMenuOpen} />
        </div>

        <nav className="category-links">
          <Link to="/listings?sort=deals" className="nav-link highlight">
            <Flame size={16} className="text-accent" />
            হট ডিল
          </Link>
          <Link to="/listings?sort=new" className="nav-link">
            <Sparkles size={16} className="text-primary-light" />
            নতুন বিজ্ঞাপন
          </Link>
          <Link to="/listings?category=Mobile" className="nav-link">মোবাইল</Link>
          <Link to="/listings?category=Electronics" className="nav-link">ইলেকট্রনিক্স</Link>
          <Link to="/listings?category=Vehicles" className="nav-link">গাড়ি</Link>
          <Link to="/listings?category=Furniture" className="nav-link">আসবাবপত্র</Link>
        </nav>

        <div className="special-offer">
          <span className="offer-text">Special Offer!</span>
        </div>
      </div>
    </div>
  );
};
