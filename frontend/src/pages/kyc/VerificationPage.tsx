import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ShieldCheck, Users, ArrowLeft, Lock, Clock, BadgeCheck, IdCard } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { getVerificationStatus, submitAdultVerification, submitMinorVerification } from '../../services/kyc.service';
import { uploadImage } from '../../services/media.service';
import { CameraCapture } from '../../components/common/CameraCapture';
import { SEOHead } from '../../components/common/SEOHead';
import { getErrorMessage } from '../../utils/formatters';
import './VerificationPage.css';

type KycType = 'adult' | 'minor' | null;

const NID_PATTERN = /^(\d{10}|\d{13}|\d{17})$/;

export const VerificationPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [kycType, setKycType] = useState<KycType>(null);
  const [nidNumber, setNidNumber] = useState('');
  const [dob, setDob] = useState('');
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: statusData } = useQuery({ queryKey: ['kyc-status'], queryFn: getVerificationStatus });
  const pending = statusData?.data?.status?.verificationStatus === 'pending_review';

  useEffect(() => {
    if (user?.isVerified) {
      toast('আপনার অ্যাকাউন্ট ইতিমধ্যে যাচাই করা হয়েছে', { icon: '✅' });
      navigate('/profile', { replace: true });
    } else if (pending) {
      navigate('/verify/status', { replace: true });
    }
  }, [user, pending, navigate]);

  const today = new Date().toISOString().split('T')[0];
  const nidValid = NID_PATTERN.test(nidNumber);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nidValid) return toast.error('NID নম্বর ১০, ১৩ বা ১৭ ডিজিটের হতে হবে');
    if (!dob) return toast.error('জন্ম তারিখ দিন');
    if (!selfieFile) return toast.error('একটি সেলফি তুলুন');
    if (kycType === 'minor' && !consentGiven) return toast.error('অভিভাবকের সম্মতি প্রয়োজন');

    setIsSubmitting(true);
    try {
      const selfieUrl = await uploadImage(selfieFile, 'kyc');
      if (kycType === 'adult') {
        await submitAdultVerification({ nidNumber, dob, selfieUrl });
      } else {
        await submitMinorVerification({ parentNidNumber: nidNumber, dob, parentSelfieUrl: selfieUrl, consentConfirmed: consentGiven });
      }
      toast.success('আবেদন জমা হয়েছে! ১২ ঘণ্টার মধ্যে ফলাফল জানানো হবে।');
      navigate('/verify/status');
    } catch (error) {
      toast.error(getErrorMessage(error, 'ভেরিফিকেশন জমা দিতে সমস্যা হয়েছে।'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (kycType === null) {
    return (
      <div className="kyc container">
        <SEOHead title="NID ভেরিফিকেশন — বেচা-কেনা" />
        <div className="kyc__hero">
          <span className="kyc__shield"><ShieldCheck size={36} /></span>
          <h1>আপনার পরিচয় যাচাই করুন</h1>
          <p>বিজ্ঞাপন দিতে, চ্যাট করতে ও বিক্রেতার ফোন নম্বর দেখতে একবার NID দিয়ে যাচাই করতে হবে।</p>
          <div className="kyc__perks">
            <span><Lock size={16} /> তথ্য এনক্রিপ্টেড</span>
            <span><Clock size={16} /> মাত্র ২ মিনিট</span>
            <span><BadgeCheck size={16} /> একবার যাচাই, সবসময় ভেরিফাইড</span>
          </div>
        </div>

        <div className="kyc__choices">
          <button type="button" className="kyc-choice" onClick={() => setKycType('adult')}>
            <span className="kyc-choice__icon"><IdCard size={30} /></span>
            <h3>আমার বয়স ১৮+</h3>
            <p>নিজের জাতীয় পরিচয়পত্র (NID) দিয়ে যাচাই করুন</p>
          </button>
          <button type="button" className="kyc-choice" onClick={() => setKycType('minor')}>
            <span className="kyc-choice__icon kyc-choice__icon--yellow"><Users size={30} /></span>
            <h3>আমার বয়স ১৮-এর কম</h3>
            <p>বাবা/মা বা অভিভাবকের NID ও সম্মতি দিয়ে যাচাই করুন</p>
          </button>
        </div>

        <p className="kyc__note">
          <Lock size={14} /> আপনার NID নম্বর আমরা সরাসরি সংরক্ষণ করি না — শুধু একটি এনক্রিপ্টেড হ্যাশ রাখা হয়।
        </p>
      </div>
    );
  }

  const isMinor = kycType === 'minor';

  return (
    <div className="kyc container">
      <SEOHead title="NID ভেরিফিকেশন — বেচা-কেনা" />
      <form className="kyc-form" onSubmit={handleSubmit}>
        <div className="kyc-form__head">
          <button type="button" className="icon-btn" onClick={() => setKycType(null)} aria-label="ফিরে যান">
            <ArrowLeft size={20} />
          </button>
          <h2>{isMinor ? 'অভিভাবকের মাধ্যমে যাচাই' : 'প্রাপ্তবয়স্ক যাচাই'}</h2>
        </div>

        <section className="kyc-step">
          <h3 className="kyc-step__title"><span>১</span> {isMinor ? 'অভিভাবকের NID ও আপনার জন্ম তারিখ' : 'NID তথ্য'}</h3>
          <div className="kyc-grid">
            <div className="form-group">
              <label className="form-label" htmlFor="nid">{isMinor ? 'অভিভাবকের NID নম্বর' : 'NID নম্বর'} *</label>
              <input
                id="nid"
                className="input"
                inputMode="numeric"
                value={nidNumber}
                onChange={(e) => setNidNumber(e.target.value.replace(/\D/g, '').slice(0, 17))}
                placeholder="১০, ১৩ বা ১৭ ডিজিট"
                required
              />
              {nidNumber && !nidValid && <span className="error-text">NID ১০, ১৩ বা ১৭ ডিজিটের হয়</span>}
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="dob">আপনার জন্ম তারিখ *</label>
              <input id="dob" type="date" className="input" value={dob} max={today} onChange={(e) => setDob(e.target.value)} required />
            </div>
          </div>
        </section>

        <section className="kyc-step">
          <h3 className="kyc-step__title"><span>২</span> {isMinor ? 'অভিভাবকের লাইভ সেলফি' : 'আপনার লাইভ সেলফি'}</h3>
          <p className="help-text">ভালো আলোতে, চশমা/মাস্ক ছাড়া, মুখ পরিষ্কার দেখা যায় এমন সেলফি তুলুন।</p>
          <CameraCapture onCapture={setSelfieFile} />
        </section>

        <section className="kyc-step">
          <h3 className="kyc-step__title"><span>৩</span> নিশ্চিত করুন</h3>
          <div className="kyc-privacy">
            <ShieldCheck size={20} />
            <span>আপনার তথ্য শুধু পরিচয় যাচাইয়ের জন্য ব্যবহার হবে এবং কখনো অন্য কারো সাথে শেয়ার করা হবে না।</span>
          </div>

          {isMinor && (
            <label className="kyc-consent">
              <input type="checkbox" checked={consentGiven} onChange={(e) => setConsentGiven(e.target.checked)} />
              <span>আমি নিশ্চিত করছি যে আমার অভিভাবক এই অ্যাকাউন্ট ব্যবহারে সম্মতি দিয়েছেন এবং প্রদত্ত NID তাঁর।</span>
            </label>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg btn-block"
            disabled={isSubmitting || !selfieFile || !nidValid || !dob || (isMinor && !consentGiven)}
          >
            {isSubmitting ? 'জমা দেওয়া হচ্ছে…' : 'যাচাইয়ের জন্য জমা দিন'}
          </button>
        </section>
      </form>
    </div>
  );
};
