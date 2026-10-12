import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ShieldCheck, MessageCircle, Star, Smartphone } from 'lucide-react';
import { OTPInput } from '../../components/common/OTPInput';
import { SEOHead } from '../../components/common/SEOHead';
import { Logo } from '../../components/layout/Logo';
import { useAuthStore } from '../../store/authStore';
import * as authService from '../../services/auth.service';
import { getErrorMessage } from '../../utils/formatters';
import './LoginPage.css';

const OTP_SECONDS = 180;

const toBanglaDigits = (text: string) => text.replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[Number(d)]);

export const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUser, isAuthenticated } = useAuthStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(OTP_SECONDS);

  const redirectTo = searchParams.get('redirect');

  useEffect(() => {
    if (isAuthenticated) navigate(redirectTo || '/', { replace: true });
  }, [isAuthenticated, navigate, redirectTo]);

  useEffect(() => {
    if (step !== 2 || timeLeft <= 0) return;
    const timer = window.setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => window.clearInterval(timer);
  }, [step, timeLeft]);

  const isPhoneValid = /^01[3-9]\d{8}$/.test(phone);

  const sendOtp = async () => {
    setPhoneError('');
    if (!isPhoneValid) {
      setPhoneError('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন 017XXXXXXXX)');
      return;
    }
    setIsLoading(true);
    try {
      await authService.requestOTP(phone);
      setStep(2);
      setOtp('');
      setOtpError('');
      setTimeLeft(OTP_SECONDS);
    } catch (error) {
      setPhoneError(getErrorMessage(error, 'OTP পাঠানো যায়নি। কিছুক্ষণ পর চেষ্টা করুন।'));
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneSubmit = (e: FormEvent) => {
    e.preventDefault();
    sendOtp();
  };

  const verify = async (code: string) => {
    if (code.length !== 6) {
      setOtpError('৬ ডিজিটের কোড দিন');
      return;
    }
    setOtpError('');
    setIsLoading(true);
    try {
      await authService.verifyOTP(phone, code);
      await fetchUser();
      const loggedIn = useAuthStore.getState().user;
      const fallback = loggedIn?.role === 'admin' || loggedIn?.role === 'moderator' ? '/admin' : loggedIn?.isVerified ? '/' : '/verify';
      navigate(redirectTo || fallback, { replace: true });
    } catch (error) {
      setOtpError(getErrorMessage(error, 'ভুল OTP কোড'));
      setOtp('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpChange = (value: string) => {
    setOtp(value);
    if (value.length === 6 && !isLoading) verify(value);
  };

  const formatTime = (seconds: number) =>
    toBanglaDigits(`${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`);

  return (
    <div className="auth">
      <SEOHead title="লগইন — বেচা-কেনা" />

      <aside className="auth__brand">
        <div className="auth__pattern" aria-hidden="true" />
        <Logo variant="light" />
        <div className="auth__pitch">
          <h2>বাংলাদেশের সবচেয়ে নিরাপদ কেনা-বেচার জায়গা</h2>
          <ul>
            <li><ShieldCheck size={20} /> প্রত্যেক ইউজার NID দিয়ে যাচাইকৃত</li>
            <li><MessageCircle size={20} /> নম্বর না দিয়েই নিরাপদ চ্যাট</li>
            <li><Star size={20} /> রিভিউ দেখে বিশ্বস্ত বিক্রেতা বাছাই</li>
          </ul>
        </div>
        <p className="auth__foot">আপনার পুরনো জিনিস, কারো নতুন প্রয়োজন।</p>
      </aside>

      <main className="auth__panel">
        <div className="auth__card">
          <div className="auth__mobile-logo"><Logo /></div>

          {step === 1 ? (
            <form onSubmit={handlePhoneSubmit} className="auth__form" noValidate>
              <span className="auth__icon"><Smartphone size={26} /></span>
              <h1>লগইন বা নতুন অ্যাকাউন্ট</h1>
              <p className="auth__sub">মোবাইল নম্বর দিন — আমরা একটি ৬ ডিজিটের কোড পাঠাব। পাসওয়ার্ড লাগবে না।</p>

              <label className="sr-only" htmlFor="phone">মোবাইল নম্বর</label>
              <div className={`phone-field ${phoneError ? 'has-error' : ''}`}>
                <span className="phone-field__prefix">🇧🇩 +88</span>
                <input
                  id="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                  placeholder="01XXXXXXXXX"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
              {phoneError && <p className="error-text">{phoneError}</p>}

              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={!isPhoneValid || isLoading}>
                {isLoading ? <span className="btn-spinner" /> : 'OTP পাঠান'}
              </button>

              <p className="auth__terms">চালিয়ে যাওয়ার মাধ্যমে আপনি আমাদের শর্তাবলি ও গোপনীয়তা নীতিতে সম্মত হচ্ছেন।</p>
            </form>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); verify(otp); }} className="auth__form" noValidate>
              <button type="button" className="auth__back" onClick={() => setStep(1)} disabled={isLoading}>
                <ArrowLeft size={16} /> নম্বর পরিবর্তন
              </button>

              <h1>কোডটি লিখুন</h1>
              <p className="auth__sub">
                <strong>+88 {toBanglaDigits(phone)}</strong> নম্বরে পাঠানো ৬ ডিজিটের কোড দিন
              </p>

              <OTPInput length={6} value={otp} onChange={handleOtpChange} disabled={isLoading} error={!!otpError} />
              {otpError && <p className="error-text text-center">{otpError}</p>}

              <div className="auth__timer">
                {timeLeft > 0 ? (
                  <span>কোডের মেয়াদ: <strong>{formatTime(timeLeft)}</strong></span>
                ) : (
                  <button type="button" className="text-link" onClick={sendOtp} disabled={isLoading}>কোড পাননি? আবার পাঠান</button>
                )}
              </div>

              <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={otp.length !== 6 || isLoading}>
                {isLoading ? <span className="btn-spinner" /> : 'যাচাই করুন'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
