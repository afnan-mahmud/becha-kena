import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { LayoutGrid } from 'lucide-react';
import { CATEGORIES } from '../../utils/constants';
import './CategoryNav.css';

/** Horizontally scrollable category strip under the header */
export const CategoryNav = () => {
  const location = useLocation();
  const [params] = useSearchParams();
  const active = location.pathname === '/listings' ? params.get('category') : null;

  return (
    <div className="category-strip">
      <nav className="container category-strip__inner" aria-label="ক্যাটাগরি">
        <Link to="/listings" className={`category-strip__link ${location.pathname === '/listings' && !active ? 'active' : ''}`}>
          <LayoutGrid size={16} />
          সব বিজ্ঞাপন
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat.value}
            to={`/listings?category=${encodeURIComponent(cat.value)}`}
            className={`category-strip__link ${active === cat.value ? 'active' : ''}`}
          >
            <span aria-hidden="true">{cat.emoji}</span>
            {cat.label}
          </Link>
        ))}
      </nav>
    </div>
  );
};
