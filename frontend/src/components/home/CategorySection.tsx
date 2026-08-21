import type { ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getListings } from '../../services/listing.service';
import { ListingCard } from '../ui/ListingCard';
import './CategorySection.css';
import type { ListingCategory } from '../../types';

interface CategorySectionProps {
  title: string;
  category: ListingCategory | string;
  icon?: ReactNode;
}

export const CategorySection = ({ title, category, icon }: CategorySectionProps) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['categoryListings', category],
    queryFn: () => getListings({ category, limit: 4, status: 'active' }),
  });

  const listings = data?.data?.items || [];

  return (
    <section className="category-section">
      <div className="category-section-header">
        <div className="section-title-wrap">
          {icon && <span className="section-icon">{icon}</span>}
          <h3>{title}</h3>
        </div>
        <Link to={`/listings?category=${category}`} className="see-all-link">
          সব দেখুন →
        </Link>
      </div>

      <div className="category-content">
        {isLoading ? (
          <div className="listings-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="listing-skeleton"></div>
            ))}
          </div>
        ) : error ? (
          <div className="error-message">লোড করতে সমস্যা হয়েছে।</div>
        ) : listings.length > 0 ? (
          <div className="listings-grid">
            {listings.slice(0, 4).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        ) : (
          <div className="empty-message">এই ক্যাটাগরিতে কোনো আইটেম নেই।</div>
        )}
      </div>
    </section>
  );
};
