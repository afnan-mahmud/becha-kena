import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { OTPInput } from '../../components/common/OTPInput';
import { useAuthStore } from '../../store/authStore';
import * as authService from '../../services/auth.service';
import { Button } from '../../components/common/Button';
import './LoginPage.css';

export const LoginPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchUser } = useAuthStore();

  const [step, setStep] = useState<1 | 2>(1);
  const [phone, setPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes

  useEffect(() => {
    let timer: number;
    if (step === 2 && timeLeft > 0) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft]);

  const validatePhone = (num: string) => {
    const regex = /^01[3-9]\d{8}$/;
    return regex.test(num);
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhoneError('');

    if (!validatePhone(phone)) {
      setPhoneError('সঠিক ১১-ডিজিটের মোবাইল নম্বর দিন');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.requestOTP(phone);
      if (res.success) {
        setStep(2);
        setTimeLeft(180);
      } else {
        setPhoneError(res.message || 'Error sending OTP');
      }
    } catch (error) {
      setPhoneError('Too many attempts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (otp.length !== 6) {
      setOtpError('৬-ডিজিটের OTP কোড দিন');
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.verifyOTP(phone, otp);
      if (res.success) {
        await fetchUser(); // Update global auth state
        const { user: loggedInUser } = useAuthStore.getState();
        const defaultRedirect = (loggedInUser?.role === 'admin' || loggedInUser?.role === 'moderator') ? '/admin' : '/';
        const redirectTo = searchParams.get('redirect') || defaultRedirect;
        navigate(redirectTo, { replace: true });
      } else {
        setOtpError('ভুল OTP কোড');
      }
    } catch (error) {
      setOtpError('ভুল OTP কোড');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Mask phone number for display
  const maskedPhone = phone ? `${phone.substring(0, 3)}***${phone.substring(8)}` : '';

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <Link to="/" className="login-logo">
            <ShoppingBag size={32} className="logo-icon" />
            <span className="logo-text-dark">Becha</span>
            <span className="logo-text-yellow">-Kena</span>
          </Link>
          <h1 className="login-title">লগইন / রেজিস্ট্রেশন</h1>
        </div>

        {step === 1 ? (
          <form onSubmit={handlePhoneSubmit} className="login-form">
            <p className="login-subtext">আপনার মোবাইল নম্বর দিয়ে শুরু করুন</p>

            <div className="phone-input-group">
              <span className="phone-prefix">+88</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  if (val.length <= 11) setPhone(val);
                }}
                placeholder="01XXXXXXXXX"
                className={`phone-input ${phoneError ? 'has-error' : ''}`}
                disabled={isLoading}
                autoFocus
              />
            </div>
            {phoneError && <p className="error-text">{phoneError}</p>}

            <Button
              type="submit"
              className="login-btn"
              disabled={phone.length !== 11}
              isLoading={isLoading}
            >
              OTP পাঠান
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifySubmit} className="login-form">
            <button
              type="button"
              className="back-btn"
              onClick={() => {
                setStep(1);
                setOtp('');
                setOtpError('');
              }}
              disabled={isLoading}
            >
              <ArrowLeft size={16} /> ফোন নম্বর পরিবর্তন করুন
            </button>

            <div className="otp-info">
              <p><strong>{maskedPhone}</strong> নম্বরে OTP পাঠানো হয়েছে</p>
            </div>

            <OTPInput
              length={6}
              value={otp}
              onChange={setOtp}
              disabled={isLoading}
              error={!!otpError}
            />
            {otpError && <p className="error-text text-center">{otpError}</p>}

            <div className="timer-section">
              {timeLeft > 0 ? (
                <p className="timer-text">সময় বাকি: <strong>{formatTime(timeLeft)}</strong></p>
              ) : (
                <button
                  type="button"
                  className="resend-link"
                  onClick={handlePhoneSubmit}
                  disabled={isLoading}
                >
                  Resend OTP
                </button>
              )}
            </div>

            <Button
              type="submit"
              className="login-btn"
              disabled={otp.length !== 6}
              isLoading={isLoading}
            >
              ভেরিফাই করুন
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};
