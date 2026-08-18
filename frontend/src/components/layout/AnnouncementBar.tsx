import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './AnnouncementBar.css';

export const AnnouncementBar = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const isDismissed = sessionStorage.getItem('announcement-dismissed');
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    sessionStorage.setItem('announcement-dismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="announcement-bar">
      <div className="container announcement-content">
        <p className="announcement-text">
          বেচা-কেনা তে স্বাগতম! ১০০% ভেরিফাইড মার্কেটপ্লেস
        </p>
        <button 
          onClick={handleDismiss} 
          className="announcement-close"
          aria-label="Close announcement"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
};
