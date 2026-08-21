import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Timer } from 'lucide-react';
import { getListings } from '../../services/listing.service';
import { ListingCard } from '../ui/ListingCard';
import './HotDeals.css';

export const HotDeals = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['hotDeals'],
    queryFn: () => getListings({ limit: 8, status: 'active' }),
  });

  const listings = data?.data?.items || [];

  return (
    <section className="hot-deals-section">
      <div className="hot-deals-header">
        <div className="header-title">
          <h2>🔥 হট ডিল</h2>
        </div>
        <div className="header-timer">
          <Timer size={18} />
          <span>শেষ হতে বাকি: ০৩ দিন ১২:৪৫:৩০</span>
        </div>
      </div>

      <div className="hot-deals-content">
        {isLoading ? (
          <div className="listings-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="listing-skeleton"></div>
            ))}
          </div>
        ) : error ? (
          <div className="error-message">ডিল লোড করতে সমস্যা হয়েছে।</div>
        ) : listings.length > 0 ? (
          <>
            <div className="listings-grid">
              {listings.slice(0, 4).map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
            <div className="see-more-container">
              <Link to="/listings" className="see-more-link">আরও দেখুন</Link>
            </div>
          </>
        ) : (
          <div className="empty-message">বর্তমানে কোনো ডিল নেই।</div>
        )}
      </div>
    </section>
  );
};
