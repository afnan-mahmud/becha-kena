import { ShieldCheck, MessageCircle, FileCheck, ThumbsUp, Users } from 'lucide-react';
import './TrustBar.css';

export const TrustBar = () => {
  const trustItems = [
    { id: 1, icon: <ShieldCheck size={24} />, title: '১০০% ভেরিফাইড', subtitle: 'ইউজার' },
    { id: 2, icon: <MessageCircle size={24} />, title: 'নিরাপদ চ্যাট', subtitle: 'ইন-অ্যাপ' },
    { id: 3, icon: <FileCheck size={24} />, title: 'NID যাচাইকৃত', subtitle: 'নিরাপত্তা' },
    { id: 4, icon: <ThumbsUp size={24} />, title: 'সহজ ব্যবহার', subtitle: 'দ্রুত এবং সহজ' },
    { id: 5, icon: <Users size={24} />, title: 'বিশ্বস্ত কমিউনিটি', subtitle: 'সবার জন্য' },
  ];

  return (
    <div className="trust-bar-wrapper">
      <div className="trust-bar container">
        {trustItems.map((item) => (
          <div key={item.id} className="trust-item">
            <div className="trust-icon">
              {item.icon}
            </div>
            <div className="trust-text">
              <h4>{item.title}</h4>
              <p>{item.subtitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
