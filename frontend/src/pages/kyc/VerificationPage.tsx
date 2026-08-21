import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Users, ArrowLeft, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore } from '../../store/authStore';
import { submitAdultVerification, submitMinorVerification } from '../../services/kyc.service';
import { getPresignedUrl, uploadFileToS3 } from '../../services/media.service';
import { CameraCapture } from '../../components/common/CameraCapture';

import './VerificationPage.css';

type KycType = 'adult' | 'minor' | null;

export const VerificationPage = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [kycType, setKycType] = useState<KycType>(null);

  // Form State
  const [nidNumber, setNidNumber] = useState('');
  const [dob, setDob] = useState('');
  const [parentNid, setParentNid] = useState('');
  const [parentDob, setParentDob] = useState('');
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user?.isVerified) {
      toast('আপনার অ্যাকাউন্ট ইতিমধ্যে যাচাই করা হয়েছে', { icon: '✅' });
      navigate('/profile', { replace: true });
    }
  }, [user, navigate]);

  const uploadSelfie = async (): Promise<string> => {
    if (!selfieFile) throw new Error("Selfie is missing");
    
    // Get presigned URL
    const { data } = await getPresignedUrl('selfie.webp', selfieFile.type, `kyc/${user?.id}`);
    
    // Upload to S3
    await uploadFileToS3(data.uploadUrl, selfieFile);
    
    return data.fileUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selfieFile) {
      toast.error('অনুগ্রহ করে সেলফি যুক্ত করুন');
      return;
    }
    if (kycType === 'minor' && !consentGiven) {
      toast.error('অভিভাবকের সম্মতি প্রয়োজন');
      return;
    }

    setIsSubmitting(true);
    try {
      const selfieUrl = await uploadSelfie();

      if (kycType === 'adult') {
        await submitAdultVerification({
          nidNumber,
          dateOfBirth: dob,
          selfieUrl
        });
      } else {
        await submitMinorVerification({
          nidNumber,
          dateOfBirth: dob,
          parentNidNumber: parentNid,
          parentDateOfBirth: parentDob,
          parentSelfieUrl: selfieUrl // Minor form uses parent selfie for simplicity/MVP
        });
      }

      toast.success('আপনার আবেদন জমা দেওয়া হয়েছে!');
      navigate('/verify/status');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'ভেরিফিকেশন জমা দিতে সমস্যা হয়েছে।';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (kycType === null) {
    return (
      <div className="kyc-page-container">
        <div className="kyc-header">
          <h1>পরিচয় যাচাই করুন</h1>
          <p>বিজ্ঞাপন দিতে ও চ্যাট করতে আপনার জাতীয় পরিচয়পত্র (NID) দিয়ে যাচাই সম্পন্ন করুন।</p>
        </div>

        <div className="kyc-choice-grid">
          <div className="kyc-choice-card" onClick={() => setKycType('adult')}>
            <div className="kyc-choice-icon">
              <Shield size={32} />
            </div>
            <h3>প্রাপ্তবয়স্ক (১৮+)</h3>
            <p className="text-secondary text-sm">নিজের NID কার্ড ব্যবহার করুন</p>
          </div>

          <div className="kyc-choice-card" onClick={() => setKycType('minor')}>
            <div className="kyc-choice-icon">
              <Users size={32} />
            </div>
            <h3>অপ্রাপ্তবয়স্ক (১৮ এর নিচে)</h3>
            <p className="text-secondary text-sm">অভিভাবকের NID কার্ড ব্যবহার করুন</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="kyc-page-container">
      <div className="kyc-form-container">
        <div className="kyc-form-header">
          <button type="button" onClick={() => setKycType(null)}>
            <ArrowLeft size={20} />
          </button>
          <h2>{kycType === 'adult' ? 'প্রাপ্তবয়স্ক ভেরিফিকেশন' : 'অপ্রাপ্তবয়স্ক ভেরিফিকেশন'}</h2>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: NID Details */}
          <div className="kyc-step">
            <div className="kyc-step-title">
              <span className="step-number">১</span> NID তথ্য
            </div>
            <div className="kyc-grid-2">
              <div className="form-group">
                <label className="form-label">আপনার NID নম্বর *</label>
                <input
                  type="text"
                  className="form-control"
                  value={nidNumber}
                  onChange={(e) => setNidNumber(e.target.value.replace(/\D/g, ''))}
                  placeholder="১০ বা ১৭ ডিজিট"
                  maxLength={17}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">আপনার জন্ম তারিখ *</label>
                <input
                  type="date"
                  className="form-control"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                />
              </div>
            </div>

            {kycType === 'minor' && (
              <div className="kyc-grid-2" style={{ marginTop: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">অভিভাবকের NID নম্বর *</label>
                  <input
                    type="text"
                    className="form-control"
                    value={parentNid}
                    onChange={(e) => setParentNid(e.target.value.replace(/\D/g, ''))}
                    placeholder="১০ বা ১৭ ডিজিট"
                    maxLength={17}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">অভিভাবকের জন্ম তারিখ *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={parentDob}
                    onChange={(e) => setParentDob(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* Step 2: Selfie */}
          <div className="kyc-step">
            <div className="kyc-step-title">
              <span className="step-number">২</span> 
              {kycType === 'minor' ? 'অভিভাবকের সেলফি' : 'আপনার সেলফি'}
            </div>
            <p className="text-secondary text-sm mb-4">
              চেহারা পরিষ্কারভাবে বোঝা যায় এমন একটি সেলফি তুলুন।
            </p>
            <CameraCapture onCapture={(file) => setSelfieFile(file)} />
          </div>

          {/* Step 3: Review & Submit */}
          <div className="kyc-step">
            <div className="kyc-step-title">
              <span className="step-number">৩</span> নিশ্চিত করুন
            </div>
            
            <div className="privacy-disclaimer">
              <ShieldCheck size={20} className="text-primary flex-shrink-0" />
              <span>আপনার NID নম্বর এবং অন্যান্য তথ্য এনক্রিপ্ট করে সুরক্ষিতভাবে সংরক্ষণ করা হবে। এটি অন্য কোথাও প্রকাশ করা হবে না।</span>
            </div>

            {kycType === 'minor' && (
              <div className="consent-checkbox">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consentGiven}
                  onChange={(e) => setConsentGiven(e.target.checked)}
                  required
                />
                <label htmlFor="consent">
                  আমি নিশ্চিত করছি যে আমার অভিভাবক এই যাচাইয়ের জন্য সম্মতি দিয়েছেন এবং এটি তার NID।
                </label>
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary w-full" 
              disabled={isSubmitting || !selfieFile || (kycType === 'minor' && !consentGiven)}
            >
              {isSubmitting ? 'জমা দেওয়া হচ্ছে...' : 'যাচাইয়ের জন্য জমা দিন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
