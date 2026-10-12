import { useState } from 'react';
import { ShieldCheck, X } from 'lucide-react';
import './AnnouncementBar.css';

const STORAGE_KEY = 'announcement-dismissed';

const readDismissed = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const AnnouncementBar = () => {
  const [isVisible, setIsVisible] = useState(() => !readDismissed());

  const handleDismiss = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      /* storage unavailable — fine */
    }
  };

  if (!isVisible) return null;

  return (
    <div className="announcement-bar">
      <div className="container announcement-content">
        <p className="announcement-text">
          <ShieldCheck size={16} aria-hidden="true" />
          প্রত্যেক বিক্রেতা NID দিয়ে যাচাইকৃত — নিশ্চিন্তে কিনুন, নিরাপদে বেচুন। কখনো অগ্রিম টাকা পাঠাবেন না।
        </p>
        <button onClick={handleDismiss} className="announcement-close" aria-label="বন্ধ করুন">
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
