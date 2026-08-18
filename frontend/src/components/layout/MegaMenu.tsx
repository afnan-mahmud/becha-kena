import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Smartphone, Monitor, Car, Armchair, Bike, Shirt, 
  Heart, Utensils, Plane, Dumbbell, MoreHorizontal, ChevronRight
} from 'lucide-react';
import './MegaMenu.css';

interface MegaMenuProps {
  isOpen: boolean;
}

const CATEGORIES = [
  { id: 'Mobile', label: 'মোবাইল (Mobile)', icon: Smartphone },
  { id: 'Electronics', label: 'ইলেকট্রনিক্স (Electronics)', icon: Monitor },
  { id: 'Vehicles', label: 'গাড়ি (Vehicles)', icon: Car },
  { id: 'Furniture', label: 'আসবাবপত্র (Furniture)', icon: Armchair },
  { id: 'Cycles', label: 'সাইকেল (Cycles)', icon: Bike },
  { id: 'Fashion', label: 'ফ্যাশন (Fashion)', icon: Shirt },
  { id: 'HealthBeauty', label: 'স্বাস্থ্য ও সৌন্দর্য', icon: Heart },
  { id: 'FoodRestaurant', label: 'খাবার ও রেস্টুরেন্ট', icon: Utensils },
  { id: 'Travel', label: 'ভ্রমণ (Travel)', icon: Plane },
  { id: 'SportsOutdoors', label: 'খেলাধুলা (Sports)', icon: Dumbbell },
  { id: 'Other', label: 'অন্যান্য (Other)', icon: MoreHorizontal },
];

export const MegaMenu: React.FC<MegaMenuProps> = ({ isOpen }) => {
  const [activeCategory, setActiveCategory] = useState<string>(CATEGORIES[0].id);

  if (!isOpen) return null;

  return (
    <div className="mega-menu">
      <div className="mega-menu-left">
        {CATEGORIES.map((cat) => (
          <div 
            key={cat.id} 
            className={`mega-menu-item ${activeCategory === cat.id ? 'active' : ''}`}
            onMouseEnter={() => setActiveCategory(cat.id)}
          >
            <Link to={`/listings?category=${cat.id}`} className="mega-menu-link">
              <cat.icon size={18} className="menu-icon" />
              <span>{cat.label}</span>
            </Link>
            <ChevronRight size={16} className="chevron" />
          </div>
        ))}
      </div>
      
      <div className="mega-menu-right">
        {/* Placeholder for subcategories or featured items based on activeCategory */}
        <div className="sub-category-panel">
          <h3 className="sub-category-title">
            {CATEGORIES.find(c => c.id === activeCategory)?.label}
          </h3>
          <p className="sub-category-desc">
            Find the best deals in this category.
          </p>
          <div className="sub-category-grid">
            <Link to={`/listings?category=${activeCategory}`} className="sub-cat-link">সব দেখুন (View All)</Link>
            <Link to={`/listings?category=${activeCategory}&sort=new`} className="sub-cat-link">নতুন বিজ্ঞাপন</Link>
            <Link to={`/listings?category=${activeCategory}&condition=New`} className="sub-cat-link">নতুন (New)</Link>
            <Link to={`/listings?category=${activeCategory}&condition=Used`} className="sub-cat-link">ব্যবহৃত (Used)</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
