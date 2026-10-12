import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, ShieldCheck, MessageCircle, Star, ArrowRight, Camera, BadgeCheck, Handshake, AlertTriangle, MapPin,
} from 'lucide-react';
import { getListings } from '../../services/listing.service';
import { ListingCard, ListingCardSkeleton } from '../../components/ui/ListingCard';
import { SEOHead } from '../../components/common/SEOHead';
import { CATEGORIES } from '../../utils/constants';
import { DIVISIONS } from '../../utils/locations';
import { formatNumber } from '../../utils/formatters';
import { useRequireVerified } from '../../hooks/useAuth';
import './HomePage.css';

const ListingRail = ({ title, eyebrow, category, link }: { title: string; eyebrow?: string; category?: string; link: string }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['listings', 'rail', category || 'latest'],
    queryFn: () => getListings({ category, limit: 8, sort: 'newest' }),
  });

  const listings = data?.data?.listings || [];
  if (!isLoading && (isError || listings.length === 0) && category) return null;

  return (
    <section className="section home-rail">
      <div className="section-head">
        <div>
          {eyebrow && <div className="section-eyebrow">{eyebrow}</div>}
          <h2>{title}</h2>
        </div>
        <Link to={link} className="section-link">সব দেখুন <ArrowRight size={16} /></Link>
      </div>

      {isLoading ? (
        <div className="listings-grid">
          {Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}
        </div>
      ) : listings.length === 0 ? (
        <div className="empty-state">
          <p>এখনো কোনো বিজ্ঞাপন নেই — প্রথম বিজ্ঞাপনটি আপনিই দিন!</p>
        </div>
      ) : (
        <div className="listings-grid">
          {listings.map((listing) => <ListingCard key={listing.id} listing={listing} />)}
        </div>
      )}
    </section>
  );
};

export const HomePage = () => {
  const navigate = useNavigate();
  const requireVerified = useRequireVerified();
  const [query, setQuery] = useState('');
  const [division, setDivision] = useState('');

  const { data: stats } = useQuery({
    queryKey: ['listings', 'count'],
    queryFn: () => getListings({ limit: 1 }),
  });
  const totalAds = stats?.data?.total ?? 0;

  const handleSearch = (e: FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    if (division) params.set('division', division);
    navigate(`/listings${params.toString() ? `?${params}` : ''}`);
  };

  const postAd = () => {
    if (requireVerified('/listings/create')) navigate('/listings/create');
  };

  return (
    <div className="home-page">
      <SEOHead
        title="বেচা-কেনা — বাংলাদেশের ভেরিফাইড সেকেন্ড-হ্যান্ড মার্কেটপ্লেস"
        description="বেচা-কেনা — বাংলাদেশের সবচেয়ে নিরাপদ সেকেন্ড-হ্যান্ড মার্কেটপ্লেস। ১০০% NID ভেরিফাইড ইউজার। পুরনো জিনিস বেচুন সহজে, কিনুন নিশ্চিন্তে।"
      />

      {/* Hero */}
      <section className="hero">
        <div className="hero__pattern" aria-hidden="true" />
        <div className="container hero__inner">
          <div className="hero__copy">
            <span className="hero__pill"><ShieldCheck size={16} /> ১০০% NID ভেরিফাইড কমিউনিটি</span>
            <h1 className="hero__title">
              পুরনো জিনিস, <span className="hero__highlight">নতুন ঠিকানা</span>
            </h1>
            <p className="hero__subtitle">
              ঢাকা থেকে দিনাজপুর — যাচাইকৃত মানুষের সাথে নিরাপদে কিনুন ও বেচুন। কোনো ফেক আইডি নেই, কোনো ঝামেলা নেই।
            </p>

            <form className="hero-search" onSubmit={handleSearch} role="search">
              <label className="hero-search__field">
                <Search size={20} aria-hidden="true" />
                <input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="যেমন: iPhone 13, Yamaha FZ, খাট…"
                  aria-label="কী খুঁজছেন"
                />
              </label>
              <label className="hero-search__field hero-search__field--select">
                <MapPin size={18} aria-hidden="true" />
                <select value={division} onChange={(e) => setDivision(e.target.value)} aria-label="বিভাগ">
                  <option value="">সারা বাংলাদেশ</option>
                  {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <button type="submit" className="btn btn-secondary hero-search__btn">খুঁজুন</button>
            </form>

            <div className="hero__stats">
              <div><strong>{formatNumber(totalAds)}+</strong><span>সক্রিয় বিজ্ঞাপন</span></div>
              <div><strong>৮</strong><span>বিভাগে কেনা-বেচা</span></div>
              <div><strong>০৳</strong><span>বিজ্ঞাপন দিতে খরচ</span></div>
            </div>
          </div>

          <div className="hero__art" aria-hidden="true">
            <div className="hero-card hero-card--a">
              <div className="hero-card__img">📱</div>
              <div className="hero-card__price">৳৪৮,০০০</div>
              <div className="hero-card__title">iPhone 13 — ৯২% ব্যাটারি</div>
              <div className="hero-card__meta"><BadgeCheck size={13} /> ধানমন্ডি, ঢাকা</div>
            </div>
            <div className="hero-card hero-card--b">
              <div className="hero-card__img hero-card__img--yellow">🏍️</div>
              <div className="hero-card__price">৳১,৮৫,০০০</div>
              <div className="hero-card__title">Yamaha FZS V3</div>
              <div className="hero-card__meta"><BadgeCheck size={13} /> আগ্রাবাদ, চট্টগ্রাম</div>
            </div>
            <div className="hero-chat">
              <MessageCircle size={16} />
              <span>“ভাই, দাম কি একটু কমানো যাবে?”</span>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {/* Categories */}
        <section className="section home-categories">
          <div className="section-head">
            <div>
              <div className="section-eyebrow">ক্যাটাগরি</div>
              <h2>কী কিনতে চান আজ?</h2>
            </div>
            <Link to="/listings" className="section-link">সব বিজ্ঞাপন <ArrowRight size={16} /></Link>
          </div>
          <div className="category-grid">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                to={`/listings?category=${encodeURIComponent(cat.value)}`}
                className="category-tile"
                style={{ ['--tile' as string]: cat.tint }}
              >
                <span className="category-tile__emoji" aria-hidden="true">{cat.emoji}</span>
                <span className="category-tile__label">{cat.label}</span>
              </Link>
            ))}
          </div>
        </section>

        <ListingRail title="সর্বশেষ বিজ্ঞাপন" eyebrow="এইমাত্র যুক্ত হয়েছে" link="/listings" />

        {/* How it works */}
        <section className="section how" id="how-it-works">
          <div className="section-head">
            <div>
              <div className="section-eyebrow">কীভাবে কাজ করে</div>
              <h2>৩ ধাপে নিরাপদ বেচা-কেনা</h2>
            </div>
          </div>
          <ol className="how__steps">
            <li>
              <span className="how__icon"><ShieldCheck size={26} /></span>
              <h3>NID দিয়ে যাচাই করুন</h3>
              <p>একবার জাতীয় পরিচয়পত্র ও সেলফি দিয়ে ভেরিফাই করুন। সবাই আসল মানুষ, তাই প্রতারণার ভয় কম।</p>
            </li>
            <li>
              <span className="how__icon how__icon--yellow"><Camera size={26} /></span>
              <h3>ছবি তুলে বিজ্ঞাপন দিন</h3>
              <p>পণ্যের ছবি, দাম আর এলাকা দিন। মডারেশনের পর বিজ্ঞাপন সবার কাছে পৌঁছে যাবে — সম্পূর্ণ ফ্রি।</p>
            </li>
            <li>
              <span className="how__icon how__icon--red"><Handshake size={26} /></span>
              <h3>চ্যাট করে ডিল ফাইনাল</h3>
              <p>অ্যাপের ভেতরেই নিরাপদে চ্যাট করুন, সামনাসামনি দেখা করে পণ্য বুঝে নিন, তারপর রিভিউ দিন।</p>
            </li>
          </ol>
        </section>

        <ListingRail title="মোবাইল ফোন" eyebrow="📱 জনপ্রিয়" category="Mobile" link="/listings?category=Mobile" />
        <ListingRail title="গাড়ি ও বাইক" eyebrow="🏍️ জনপ্রিয়" category="Vehicles" link="/listings?category=Vehicles" />

        {/* Safety */}
        <section className="section" id="safety">
          <div className="safety">
            <div className="safety__icon"><AlertTriangle size={28} /></div>
            <div className="safety__body">
              <h2>নিরাপদ থাকার ৪টি নিয়ম</h2>
              <ul>
                <li>বিকাশ/নগদে <strong>কখনো অগ্রিম টাকা</strong> পাঠাবেন না।</li>
                <li>জনবহুল জায়গায়, দিনের বেলায় দেখা করুন।</li>
                <li>পণ্য হাতে নিয়ে ভালোভাবে যাচাই করে তারপর টাকা দিন।</li>
                <li>সন্দেহজনক কিছু দেখলে সাথে সাথে <strong>রিপোর্ট</strong> করুন।</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Sell CTA */}
        <section className="section">
          <div className="sell-cta">
            <div>
              <h2>ঘরের অপ্রয়োজনীয় জিনিস এখন টাকায় রূপান্তর করুন</h2>
              <p>মাত্র ২ মিনিটে বিজ্ঞাপন দিন। শুধু যাচাইকৃত ক্রেতারাই আপনার সাথে যোগাযোগ করতে পারবে।</p>
              <div className="sell-cta__trust">
                <span><ShieldCheck size={16} /> যাচাইকৃত ক্রেতা</span>
                <span><MessageCircle size={16} /> ইন-অ্যাপ চ্যাট</span>
                <span><Star size={16} /> রিভিউ সিস্টেম</span>
              </div>
            </div>
            <button type="button" className="btn btn-secondary btn-lg" onClick={postAd}>
              ফ্রি বিজ্ঞাপন দিন <ArrowRight size={18} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
