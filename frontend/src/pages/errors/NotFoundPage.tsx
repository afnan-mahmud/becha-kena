import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';
import './NotFoundPage.css';

export const NotFoundPage = () => {
  return (
    <div className="error-page-container">
      <div className="error-page-content">
        <div className="error-icon-wrapper">
          <FileQuestion size={40} />
        </div>
        <h1 className="error-code">৪০৪</h1>
        <h2 className="error-title">পৃষ্ঠাটি পাওয়া যায়নি (Page Not Found)</h2>
        <p className="error-description">
          আপনি যে পৃষ্ঠাটি খুঁজছেন তা মুছে ফেলা হয়েছে, নাম পরিবর্তন করা হয়েছে অথবা সাময়িকভাবে অনুপলব্ধ।
        </p>
        <Link to="/" className="btn btn-primary flex-center gap-2">
          <Home size={18} />
          হোম পেজে ফিরে যান
        </Link>
      </div>
    </div>
  );
};
