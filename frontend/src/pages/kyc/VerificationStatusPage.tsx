import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CheckCircle2, Clock, XCircle, FileQuestion } from 'lucide-react';
import { getVerificationStatus } from '../../services/kyc.service';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useAuthStore } from '../../store/authStore';
import { formatDate } from '../../utils/formatters';
import './VerificationStatusPage.css';

export const VerificationStatusPage = () => {
  const { fetchUser } = useAuthStore();
  const { data, isLoading } = useQuery({ queryKey: ['kyc-status'], queryFn: getVerificationStatus, refetchInterval: 60_000 });

  const log = data?.data?.status;

  // When an admin approves, pull the fresh user so the whole app unlocks
  useEffect(() => {
    if (log?.verificationStatus === 'approved') fetchUser();
  }, [log?.verificationStatus, fetchUser]);

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (!log) {
    return (
      <div className="kyc-status container">
        <div className="kyc-status__card">
          <span className="kyc-status__icon is-empty"><FileQuestion size={36} /></span>
          <h1>কোনো আবেদন পাওয়া যায়নি</h1>
          <p>আপনি এখনো অ্যাকাউন্ট যাচাইয়ের জন্য আবেদন করেননি।</p>
          <Link to="/verify" className="btn btn-primary">এখনই যাচাই করুন</Link>
        </div>
      </div>
    );
  }

  const content = {
    approved: { icon: <CheckCircle2 size={40} />, cls: 'is-approved', title: 'অভিনন্দন! আপনি এখন ভেরিফাইড 🎉', desc: 'এখন আপনি বিজ্ঞাপন দিতে, চ্যাট করতে ও বিক্রেতার নম্বর দেখতে পারবেন।', label: 'অনুমোদিত' },
    rejected: { icon: <XCircle size={40} />, cls: 'is-rejected', title: 'আবেদনটি বাতিল হয়েছে', desc: 'প্রদত্ত তথ্য যাচাই করা যায়নি। কারণ দেখে আবার চেষ্টা করুন।', label: 'বাতিল' },
    pending_review: { icon: <Clock size={40} />, cls: 'is-pending', title: 'রিভিউ চলছে…', desc: 'আমাদের টিম আপনার তথ্য যাচাই করছে। সাধারণত ১২ ঘণ্টার মধ্যে ফলাফল জানানো হয়।', label: 'অপেক্ষমাণ' },
  }[log.verificationStatus];

  return (
    <div className="kyc-status container">
      <div className="kyc-status__card">
        <span className={`kyc-status__icon ${content.cls}`}>{content.icon}</span>
        <h1>{content.title}</h1>
        <p>{content.desc}</p>

        <dl className="kyc-status__details">
          <div><dt>আবেদনের তারিখ</dt><dd>{formatDate(log.createdAt)}</dd></div>
          <div><dt>ধরন</dt><dd>{log.verificationType === 'minor' ? 'অভিভাবকের মাধ্যমে' : 'প্রাপ্তবয়স্ক'}</dd></div>
          <div><dt>অবস্থা</dt><dd className={content.cls}>{content.label}</dd></div>
          {log.verificationStatus === 'rejected' && log.manualReviewReason && (
            <div className="kyc-status__reason"><dt>কারণ</dt><dd>{log.manualReviewReason}</dd></div>
          )}
        </dl>

        <div className="kyc-status__actions">
          {log.verificationStatus === 'rejected' && <Link to="/verify" className="btn btn-primary">আবার আবেদন করুন</Link>}
          {log.verificationStatus === 'approved' && <Link to="/listings/create" className="btn btn-accent">প্রথম বিজ্ঞাপন দিন</Link>}
          <Link to="/profile" className="btn btn-outline">প্রোফাইলে যান</Link>
        </div>
      </div>
    </div>
  );
};
