import { Link } from 'react-router-dom';
import { ShieldCheck, MessageCircle, BadgeCheck } from 'lucide-react';
import { CATEGORIES } from '../../utils/constants';
import { Logo } from './Logo';
import './Footer.css';

export const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="stitch-divider" aria-hidden="true" />
      <div className="container site-footer__grid">
        <div className="site-footer__about">
          <Logo variant="light" />
          <p>
            বাংলাদেশের প্রথম ১০০% NID ভেরিফাইড সেকেন্ড-হ্যান্ড মার্কেটপ্লেস। পুরনো জিনিস বেচুন সহজে, কিনুন নিশ্চিন্তে।
          </p>
          <ul className="site-footer__trust">
            <li><ShieldCheck size={16} /> NID যাচাইকৃত ইউজার</li>
            <li><MessageCircle size={16} /> নিরাপদ ইন-অ্যাপ চ্যাট</li>
            <li><BadgeCheck size={16} /> রিভিউ ও রেটিং</li>
          </ul>
        </div>

        <div>
          <h4>বেচা-কেনা</h4>
          <ul>
            <li><Link to="/listings">সব বিজ্ঞাপন</Link></li>
            <li><Link to="/listings/create">বিজ্ঞাপন দিন</Link></li>
            <li><Link to="/verify">NID ভেরিফিকেশন</Link></li>
            <li><Link to="/dashboard/my-listings">আমার বিজ্ঞাপন</Link></li>
          </ul>
        </div>

        <div>
          <h4>জনপ্রিয় ক্যাটাগরি</h4>
          <ul>
            {CATEGORIES.slice(0, 6).map((cat) => (
              <li key={cat.value}>
                <Link to={`/listings?category=${encodeURIComponent(cat.value)}`}>{cat.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>সহায়তা</h4>
          <ul>
            <li><a href="/#how-it-works">কীভাবে কাজ করে</a></li>
            <li><a href="/#safety">নিরাপত্তা টিপস</a></li>
            <li><Link to="/profile/reports">আমার রিপোর্ট</Link></li>
            <li><a href="mailto:support@bechakena.com">support@bechakena.com</a></li>
          </ul>
        </div>
      </div>

      <div className="site-footer__bottom">
        <div className="container site-footer__bottom-inner">
          <p>© {year} বেচা-কেনা। সব লেনদেন ক্রেতা-বিক্রেতার নিজ দায়িত্বে, সামনাসামনি সম্পন্ন হয়।</p>
          <p className="site-footer__made">ভালোবাসা দিয়ে তৈরি, বাংলাদেশে 🇧🇩</p>
        </div>
      </div>
    </footer>
  );
};
