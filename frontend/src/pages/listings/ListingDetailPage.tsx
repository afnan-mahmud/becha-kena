import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  MapPin, Clock, Phone, MessageCircle, Flag, Share2, ShieldCheck, AlertTriangle, Tag, CalendarDays, Pencil, ChevronRight,
} from 'lucide-react';
import { getListingById, getListings } from '../../services/listing.service';
import { createRoom } from '../../services/chat.service';
import { ImageGallery } from '../../components/ui/ImageGallery';
import { RatingStars } from '../../components/ui/RatingStars';
import { VerifiedBadge } from '../../components/ui/VerifiedBadge';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { ListingCard } from '../../components/ui/ListingCard';
import { ReportModal } from '../../components/report/ReportModal';
import { SEOHead } from '../../components/common/SEOHead';
import { useAuthStore } from '../../store/authStore';
import { useRequireVerified } from '../../hooks/useAuth';
import { formatDate, formatPrice, formatRelativeTime, getErrorMessage } from '../../utils/formatters';
import { getCategory, getConditionLabel } from '../../utils/constants';
import { formatLocation, getSeller, getSellerId } from '../../utils/listing';
import './ListingDetailPage.css';

export const ListingDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isVerified } = useAuthStore();
  const requireVerified = useRequireVerified();

  const [showPhone, setShowPhone] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['listing', id, isAuthenticated, isVerified],
    queryFn: () => getListingById(id as string),
    enabled: !!id,
  });

  const listing = data?.data;

  const { data: relatedData } = useQuery({
    queryKey: ['listings', 'related', listing?.category],
    queryFn: () => getListings({ category: listing?.category, limit: 5 }),
    enabled: !!listing?.category,
  });

  const related = (relatedData?.data?.listings || []).filter((item) => item.id !== id).slice(0, 4);

  if (isLoading) {
    return (
      <div className="container detail">
        <div className="detail__layout">
          <div className="skeleton" style={{ aspectRatio: '4 / 3', borderRadius: 20 }} />
          <div>
            <div className="skeleton" style={{ height: 36, width: '60%' }} />
            <div className="skeleton" style={{ height: 22, width: '90%', marginTop: 16 }} />
            <div className="skeleton" style={{ height: 180, marginTop: 24, borderRadius: 20 }} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="container detail">
        <div className="empty-state" style={{ marginTop: 40 }}>
          <div style={{ fontSize: 44 }} aria-hidden="true">🫥</div>
          <h2>বিজ্ঞাপনটি পাওয়া যায়নি</h2>
          <p>বিজ্ঞাপনটি মুছে ফেলা হয়েছে, বিক্রি হয়ে গেছে বা এখনো রিভিউতে আছে।</p>
          <Link to="/listings" className="btn btn-primary mt-4">সব বিজ্ঞাপন দেখুন</Link>
        </div>
      </div>
    );
  }

  const seller = getSeller(listing);
  const sellerId = getSellerId(listing);
  const isOwner = !!user && user.id === sellerId;
  const isSold = listing.status === 'sold';
  const category = getCategory(listing.category);
  const condition = getConditionLabel(listing.condition);
  const canContact = listing.status === 'active' && !isOwner;

  const handleChat = async () => {
    if (!requireVerified(`/listings/${listing.id}`)) {
      if (isAuthenticated) toast('চ্যাট করতে আগে NID দিয়ে যাচাই করুন', { icon: '🪪' });
      return;
    }
    setIsStartingChat(true);
    try {
      const res = await createRoom(listing.id);
      navigate(`/chat/${res.data.id}`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'চ্যাট শুরু করা যায়নি'));
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleShowPhone = () => {
    if (!requireVerified(`/listings/${listing.id}`)) {
      if (isAuthenticated) toast('ফোন নম্বর দেখতে আগে NID দিয়ে যাচাই করুন', { icon: '🪪' });
      return;
    }
    setShowPhone(true);
  };

  const handleReport = () => {
    if (requireVerified(`/listings/${listing.id}`)) setIsReportOpen(true);
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: listing.title, text: `${listing.title} — ${formatPrice(listing.price)}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('লিংক কপি করা হয়েছে');
      }
    } catch {
      /* user cancelled share */
    }
  };

  const phone = seller?.phoneNumber ? seller.phoneNumber.replace(/^\+88/, '') : null;

  return (
    <div className="container detail">
      <SEOHead
        title={`${listing.title} — ${formatPrice(listing.price)} — বেচা-কেনা`}
        description={listing.description.substring(0, 160)}
        ogImage={listing.images[0]}
      />

      <nav className="detail__crumbs" aria-label="Breadcrumb">
        <Link to="/">হোম</Link>
        <ChevronRight size={14} />
        <Link to="/listings">বিজ্ঞাপন</Link>
        {category && (
          <>
            <ChevronRight size={14} />
            <Link to={`/listings?category=${encodeURIComponent(category.value)}`}>{category.label}</Link>
          </>
        )}
      </nav>

      {listing.status !== 'active' && !isSold && (
        <div className="detail__notice">
          <AlertTriangle size={18} />
          {listing.status === 'pending'
            ? 'এই বিজ্ঞাপনটি মডারেশনের অপেক্ষায় আছে — শুধু আপনি দেখতে পাচ্ছেন।'
            : 'এই বিজ্ঞাপনটি আর্কাইভ করা — অন্য কেউ দেখতে পাচ্ছে না।'}
        </div>
      )}

      <div className="detail__layout">
        <div className="detail__main">
          <ImageGallery images={listing.images} isSold={isSold} />

          <section className="detail__card">
            <h2 className="detail__h">বিস্তারিত বিবরণ</h2>
            <dl className="detail__specs">
              {category && <div><dt><Tag size={15} /> ক্যাটাগরি</dt><dd>{category.emoji} {category.label}</dd></div>}
              {condition && <div><dt><ShieldCheck size={15} /> অবস্থা</dt><dd>{condition}</dd></div>}
              <div><dt><MapPin size={15} /> এলাকা</dt><dd>{formatLocation(listing, 3)}</dd></div>
              <div><dt><CalendarDays size={15} /> পোস্ট</dt><dd>{formatDate(listing.createdAt)}</dd></div>
            </dl>
            <div className="detail__desc">
              {listing.description.split('\n').map((p, i) => <p key={i}>{p}</p>)}
            </div>
          </section>
        </div>

        <aside className="detail__side">
          <section className="detail__card detail__summary">
            <div className="detail__badges">
              {condition && <span className="badge badge-green">{condition}</span>}
              {isSold && <span className="badge badge-red">বিক্রি হয়ে গেছে</span>}
            </div>
            <h1 className="detail__title">{listing.title}</h1>
            <div className="detail__price">{formatPrice(listing.price)}</div>
            <div className="detail__meta">
              <span><MapPin size={15} /> {formatLocation(listing)}</span>
              <span><Clock size={15} /> {formatRelativeTime(listing.createdAt)}</span>
            </div>

            {isOwner ? (
              <div className="detail__actions">
                <Link to={`/listings/${listing.id}/edit`} className="btn btn-primary btn-block"><Pencil size={18} /> বিজ্ঞাপন এডিট করুন</Link>
                <Link to="/dashboard/my-listings" className="btn btn-outline btn-block">আমার বিজ্ঞাপনগুলো</Link>
              </div>
            ) : canContact ? (
              <div className="detail__actions">
                <button type="button" className="btn btn-primary btn-lg btn-block" onClick={handleChat} disabled={isStartingChat}>
                  <MessageCircle size={20} /> {isStartingChat ? 'চ্যাট খোলা হচ্ছে…' : 'বিক্রেতার সাথে চ্যাট করুন'}
                </button>

                {listing.hidePhoneNumber ? (
                  <p className="detail__chat-only">🔒 বিক্রেতা শুধু চ্যাটে যোগাযোগ করতে চান</p>
                ) : showPhone && phone ? (
                  <a href={`tel:${phone}`} className="btn btn-outline btn-lg btn-block detail__phone"><Phone size={18} /> {phone}</a>
                ) : (
                  <button type="button" className="btn btn-outline btn-lg btn-block" onClick={handleShowPhone}>
                    <Phone size={18} /> ফোন নম্বর দেখুন
                  </button>
                )}
              </div>
            ) : null}

            <div className="detail__secondary">
              <button type="button" className="btn btn-ghost btn-sm" onClick={handleShare}><Share2 size={16} /> শেয়ার</button>
              {!isOwner && (
                <button type="button" className="btn btn-ghost btn-sm detail__report" onClick={handleReport}><Flag size={16} /> রিপোর্ট</button>
              )}
            </div>
          </section>

          {seller && (
            <section className="detail__card detail__seller">
              <h2 className="detail__h">বিক্রেতা</h2>
              <Link to={`/user/${sellerId}`} className="detail__seller-row">
                <UserAvatar name={seller.displayName || 'U'} size="lg" />
                <div>
                  <div className="detail__seller-name">{seller.displayName}</div>
                  {seller.isVerified && <VerifiedBadge size="sm" />}
                </div>
              </Link>
              {seller.verifiedName && <p className="detail__legal">আইনগত নাম: <strong>{seller.verifiedName}</strong></p>}
              <div className="detail__seller-stats">
                <div>
                  <RatingStars rating={seller.averageRating} size="sm" />
                  <span>{seller.totalReviews > 0 ? `${seller.averageRating.toFixed(1)} (${seller.totalReviews} রিভিউ)` : 'এখনো রিভিউ নেই'}</span>
                </div>
                {seller.createdAt && <div><CalendarDays size={14} /> সদস্য: {formatDate(seller.createdAt)}</div>}
              </div>
              <Link to={`/user/${sellerId}`} className="btn btn-outline btn-block btn-sm">প্রোফাইল ও অন্যান্য বিজ্ঞাপন</Link>
            </section>
          )}

          <section className="detail__safety">
            <AlertTriangle size={20} />
            <div>
              <strong>নিরাপত্তা টিপস</strong>
              <p>জনবহুল জায়গায় দেখা করুন, পণ্য দেখে তারপর টাকা দিন। কখনো অগ্রিম টাকা পাঠাবেন না।</p>
            </div>
          </section>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>একই ধরনের আরো বিজ্ঞাপন</h2>
            <Link to={`/listings?category=${encodeURIComponent(listing.category)}`} className="section-link">সব দেখুন</Link>
          </div>
          <div className="listings-grid">
            {related.map((item) => <ListingCard key={item.id} listing={item} />)}
          </div>
        </section>
      )}

      {/* Sticky contact bar on phones */}
      {canContact && (
        <div className="detail__mobile-bar">
          <div>
            <div className="detail__mobile-price">{formatPrice(listing.price)}</div>
            <div className="detail__mobile-title truncate">{listing.title}</div>
          </div>
          <button type="button" className="btn btn-primary" onClick={handleChat} disabled={isStartingChat}>
            <MessageCircle size={18} /> চ্যাট
          </button>
        </div>
      )}

      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} targetType="Listing" targetId={listing.id} />
    </div>
  );
};
