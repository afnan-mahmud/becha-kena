import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  MapPin, 
  Clock, 
  Phone, 
  MessageSquare, 
  Flag, 
  Share2, 
  MessageCircle, // Using MessageCircle for WhatsApp for now
  AlertTriangle 
} from 'lucide-react';
import { getListingById, getListings } from '../../services/listing.service';
import { ImageGallery } from '../../components/ui/ImageGallery';
import { RatingStars } from '../../components/ui/RatingStars';
import { VerifiedBadge } from '../../components/ui/VerifiedBadge';
import { ListingCard } from '../../components/ui/ListingCard';
import { ReportModal } from '../../components/report/ReportModal';
import { formatPrice, formatRelativeTime } from '../../utils/formatters';
import './ListingDetailPage.css';

export const ListingDetailPage = () => {
  const { id } = useParams<{ id: string }>();

  const [showPhone, setShowPhone] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => getListingById(id as string),
    enabled: !!id
  });

  const listing = data?.data;

  const { data: relatedData } = useQuery({
    queryKey: ['relatedListings', listing?.category],
    queryFn: () => getListings({ category: listing?.category, limit: 4 }),
    enabled: !!listing?.category
  });

  const relatedListings = relatedData?.data?.items?.filter(item => item.id !== id) || [];

  const handleChatClick = () => {
    // Check auth and verification here in real app
    // navigate('/chat/new/' + listing.id);
    alert('চ্যাট ফিচারটি এখনো তৈরি করা হয়নি (Chat feature coming soon)');
  };

  const handleShare = (platform: string) => {
    const url = window.location.href;
    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      alert('লিংক কপি করা হয়েছে');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(url)}`, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="container detail-page loading-skeleton">
        <div className="skeleton-row">
          <div className="skeleton-col-left">
            <div className="skeleton-box" style={{ height: '400px' }}></div>
          </div>
          <div className="skeleton-col-right">
            <div className="skeleton-box" style={{ height: '40px', marginBottom: '20px' }}></div>
            <div className="skeleton-box" style={{ height: '200px', marginBottom: '20px' }}></div>
            <div className="skeleton-box" style={{ height: '150px' }}></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="container error-page">
        <h2>বিজ্ঞাপনটি পাওয়া যায়নি</h2>
        <p>আপনি যে বিজ্ঞাপনটি খুঁজছেন তা মুছে ফেলা হয়েছে বা মেয়াদ শেষ হয়ে গেছে।</p>
        <Link to="/listings" className="btn btn-primary">সব বিজ্ঞাপন দেখুন</Link>
      </div>
    );
  }

  const isSold = listing.status === 'sold';
  const conditionLabel = listing.condition === 'New' ? 'নতুন' : listing.condition === 'Like New' ? 'প্রায় নতুন' : 'ব্যবহৃত';

  return (
    <div className="detail-page container">
      <div className="detail-layout">
        {/* Left Column - Gallery & Description */}
        <div className="detail-main">
          <ImageGallery images={listing.images} isSold={isSold} />
          
          <div className="detail-description-card mt-4">
            <h3>বিবরণ</h3>
            <div className="description-content">
              {listing.description.split('\n').map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Info, Seller, Actions */}
        <div className="detail-sidebar">
          <div className="product-info-card">
            <div className="badges-row">
              <span className="badge condition-badge">{conditionLabel}</span>
              <span className="badge category-badge">{listing.category}</span>
            </div>
            
            <h1 className="product-title">{listing.title}</h1>
            <div className="product-price">{formatPrice(listing.price)}</div>
            
            <div className="product-meta">
              <div className="meta-item">
                <MapPin size={16} />
                <span>{listing.location.thana}, {listing.location.district}, {listing.location.division}</span>
              </div>
              <div className="meta-item">
                <Clock size={16} />
                <span>পোস্ট করা হয়েছে {formatRelativeTime(listing.createdAt)}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="action-buttons">
              <button 
                className="btn btn-primary btn-block action-btn" 
                onClick={handleChatClick}
                disabled={isSold}
              >
                <MessageSquare size={18} />
                চ্যাট করুন
              </button>
              
              {!listing.hidePhoneNumber ? (
                showPhone ? (
                  <a href={`tel:${listing.seller?.phoneNumber}`} className="btn btn-outline btn-block action-btn">
                    <Phone size={18} />
                    {listing.seller?.phoneNumber || '01XXXXXXXXX'}
                  </a>
                ) : (
                  <button className="btn btn-outline btn-block action-btn" onClick={() => setShowPhone(true)}>
                    <Phone size={18} />
                    ফোন নম্বর দেখুন
                  </button>
                )
              ) : (
                <div className="chat-only-notice">
                  শুধুমাত্র চ্যাটে যোগাযোগ করুন
                </div>
              )}
            </div>

            {/* Share and Report */}
            <div className="secondary-actions">
              <button className="text-link-sm flex-center gap-1" onClick={() => setIsReportModalOpen(true)}>
                <Flag size={14} /> রিপোর্ট করুন
              </button>
              
              <div className="share-actions">
                <span>শেয়ার:</span>

                <button className="icon-btn-sm" onClick={() => handleShare('whatsapp')} title="Share on WhatsApp"><MessageCircle size={16} /></button>
                <button className="icon-btn-sm" onClick={() => handleShare('copy')} title="Copy Link"><Share2 size={16} /></button>
              </div>
            </div>
          </div>

          {/* Seller Card */}
          {listing.seller && (
            <div className="seller-info-card">
              <h3>সেলার সম্পর্কে</h3>
              <div className="seller-profile">
                <div className="seller-avatar">
                  {listing.seller.displayName?.charAt(0) || 'U'}
                </div>
                <div className="seller-details">
                  <div className="seller-name-row">
                    <span className="seller-name">{listing.seller.displayName}</span>
                    {listing.seller.isVerified && <VerifiedBadge size="sm" />}
                  </div>
                  {listing.seller.verifiedName && (
                    <div className="verified-name-text">আইনত যাচাইকৃত: {listing.seller.verifiedName}</div>
                  )}
                  <div className="seller-rating">
                    <RatingStars 
                      rating={listing.seller.averageRating} 
                      count={listing.seller.totalReviews} 
                      showCount 
                      size="sm" 
                    />
                  </div>
                </div>
              </div>
              <Link to={`/user/${listing.sellerId}`} className="btn btn-outline btn-block mt-3">
                সেলারের সব বিজ্ঞাপন দেখুন
              </Link>
            </div>
          )}

          {/* Map Preview Placeholder */}
          <div className="map-card">
            <h3>লোকেশন ম্যাপ</h3>
            <div className="map-placeholder">
              <img src="https://via.placeholder.com/400x200?text=Map+Preview" alt="Map Preview" />
            </div>
          </div>
        </div>
      </div>

      {/* Safety Banner */}
      <div className="safety-banner mt-4">
        <AlertTriangle size={24} className="safety-icon" />
        <div>
          <h4>নিরাপত্তা পরামর্শ</h4>
          <p>সর্বদা জনবহুল জায়গায় দেখা করুন। অগ্রিম পেমেন্ট করবেন না। যেকোনো প্রতারণামূলক কার্যকলাপ রিপোর্ট করুন।</p>
        </div>
      </div>

      {/* Related Listings */}
      {relatedListings.length > 0 && (
        <div className="related-listings-section mt-5">
          <h2 className="section-title">সম্পর্কিত বিজ্ঞাপন</h2>
          <div className="listings-grid">
            {relatedListings.slice(0, 4).map(item => (
              <ListingCard key={item.id} listing={item} />
            ))}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {listing && (
        <ReportModal 
          isOpen={isReportModalOpen} 
          onClose={() => setIsReportModalOpen(false)} 
          targetType="listing" 
          targetId={listing.id} 
        />
      )}
    </div>
  );
};
