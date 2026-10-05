import { useState, useEffect } from 'react';
import './NetworkStatus.css';

export const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 3000); // Hide restored message after 3s
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestored(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showRestored) return null;

  return (
    <div className={`network-status-banner ${isOnline ? 'online' : 'offline'}`}>
      {isOnline ? 'সংযোগ পুনরুদ্ধার হয়েছে' : 'ইন্টারনেট সংযোগ বিচ্ছিন্ন'}
    </div>
  );
};
