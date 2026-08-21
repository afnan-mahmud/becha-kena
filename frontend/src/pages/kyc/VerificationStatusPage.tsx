import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, XCircle, FileText } from 'lucide-react';
import { getVerificationStatus } from '../../services/kyc.service';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';

import './VerificationStatusPage.css';

export const VerificationStatusPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: getVerificationStatus,
    retry: 1
  });

  if (isLoading) return <LoadingSpinner fullScreen />;

  // API returns 404 or success false if no log exists
  const hasNoLog = error || !data?.success;
  
  if (hasNoLog) {
    return (
      <div className="kyc-status-container">
        <div className="kyc-status-card">
          <div className="empty-status-state">
            <div className="status-icon-wrapper" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
              <FileText size={32} />
            </div>
            <h2>কোনো আবেদন পাওয়া যায়নি</h2>
            <p>আপনি এখনও অ্যাকাউন্ট যাচাইয়ের জন্য আবেদন করেননি।</p>
            <Link to="/verify" className="btn btn-primary">এখনই যাচাই করুন</Link>
          </div>
        </div>
      </div>
    );
  }

  const log = data.data;
  
  const getStatusContent = () => {
    switch (log.verificationStatus) {
      case 'approved':
        return {
          icon: <CheckCircle size={40} />,
          title: 'যাচাই সম্পন্ন!',
          desc: 'আপনার অ্যাকাউন্ট সফলভাবে যাচাই করা হয়েছে। এখন আপনি বিজ্ঞাপন পোস্ট করতে এবং অন্য ব্যবহারকারীদের সাথে চ্যাট করতে পারবেন।',
          colorClass: 'approved'
        };
      case 'rejected':
        return {
          icon: <XCircle size={40} />,
          title: 'আবেদন বাতিল হয়েছে',
          desc: 'দুঃখিত, আপনার প্রদত্ত তথ্যে কিছু সমস্যা থাকায় আবেদনটি বাতিল করা হয়েছে। অনুগ্রহ করে কারণটি দেখুন এবং পুনরায় চেষ্টা করুন।',
          colorClass: 'rejected'
        };
      case 'pending':
      default:
        return {
          icon: <Clock size={40} />,
          title: 'পর্যালোচনার অপেক্ষায়',
          desc: 'আপনার আবেদন ম্যানুয়াল পর্যালোচনার জন্য পাঠানো হয়েছে। ১২ ঘণ্টার মধ্যে ফলাফল জানানো হবে।',
          colorClass: 'pending'
        };
    }
  };

  const content = getStatusContent();

  return (
    <div className="kyc-status-container">
      <div className="kyc-status-card">
        <div className={`status-icon-wrapper ${content.colorClass}`}>
          {content.icon}
        </div>
        
        <h1>{content.title}</h1>
        <p className="status-description">{content.desc}</p>

        <div className="status-details-box">
          <div className="status-detail-row">
            <span className="status-detail-label">আবেদনের তারিখ:</span>
            <span className="status-detail-value">{formatDate(log.createdAt)}</span>
          </div>
          <div className="status-detail-row">
            <span className="status-detail-label">বর্তমান অবস্থা:</span>
            <span className={`status-detail-value text-${content.colorClass}`}>
              {log.verificationStatus === 'approved' && 'অনুমোদিত'}
              {log.verificationStatus === 'pending' && 'অপেক্ষমাণ'}
              {log.verificationStatus === 'rejected' && 'বাতিল'}
            </span>
          </div>
          
          {log.verificationStatus === 'rejected' && log.manualReviewReason && (
            <div className="status-rejection-reason">
              <span className="label">বাতিলের কারণ:</span>
              <p>{log.manualReviewReason}</p>
            </div>
          )}
        </div>

        <div className="kyc-status-actions">
          {log.verificationStatus === 'rejected' && (
            <Link to="/verify" className="btn btn-primary">পুনরায় আবেদন করুন</Link>
          )}
          <Link to="/profile" className="btn btn-outline">প্রোফাইলে ফিরে যান</Link>
        </div>
      </div>
    </div>
  );
};
