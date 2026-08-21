import { useQuery } from '@tanstack/react-query';
import { getListings } from '../../services/listing.service';
import { ListingCardCompact } from '../ui/ListingCardCompact';
import { Sparkles, ThumbsUp } from 'lucide-react';
import './SidebarSpecialItems.css';

export const SidebarSpecialItems = () => {
  // Mocking special/recommended using different sorts or just getting some random listings
  const { data: specialData, isLoading: isLoadingSpecial } = useQuery({
    queryKey: ['sidebarSpecial'],
    queryFn: () => getListings({ limit: 4, status: 'active' }),
  });

  const { data: recData, isLoading: isLoadingRec } = useQuery({
    queryKey: ['sidebarRecommended'],
    queryFn: () => getListings({ limit: 4, status: 'active', category: 'Electronics' }), // Just as an example
  });

  const specialListings = specialData?.data?.items || [];
  const recommendedListings = recData?.data?.items || [];

  return (
    <div className="sidebar-container">
      <div className="sidebar-widget">
        <div className="widget-header">
          <Sparkles size={18} className="widget-icon" />
          <h3>স্পেশাল আইটেমস</h3>
        </div>
        <div className="widget-content">
          {isLoadingSpecial ? (
            <div className="sidebar-skeleton"></div>
          ) : specialListings.length > 0 ? (
            specialListings.map(listing => (
              <ListingCardCompact key={listing.id} listing={listing} />
            ))
          ) : (
             <div className="empty-message">কিছু পাওয়া যায়নি</div>
          )}
        </div>
      </div>

      <div className="sidebar-widget">
        <div className="widget-header">
          <ThumbsUp size={18} className="widget-icon" />
          <h3>রিকমেন্ডেড আইটেমস</h3>
        </div>
        <div className="widget-content">
          {isLoadingRec ? (
            <div className="sidebar-skeleton"></div>
          ) : recommendedListings.length > 0 ? (
            recommendedListings.map(listing => (
              <ListingCardCompact key={listing.id} listing={listing} />
            ))
          ) : (
             <div className="empty-message">কিছু পাওয়া যায়নি</div>
          )}
        </div>
      </div>
    </div>
  );
};
