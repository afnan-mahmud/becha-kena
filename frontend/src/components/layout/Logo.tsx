import { Link } from 'react-router-dom';
import './Logo.css';

interface LogoProps {
  variant?: 'dark' | 'light';
  compact?: boolean;
}

/** Exchange-arrows mark + Bangla wordmark */
export const Logo = ({ variant = 'dark', compact = false }: LogoProps) => (
  <Link to="/" className={`brand-logo brand-logo--${variant}`} aria-label="বেচা-কেনা হোম">
    <svg className="brand-mark" viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="16" fill="currentColor" />
      <path d="M18 26h22l-6-6M46 38H24l6 6" fill="none" stroke="#fff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="47" cy="17" r="6" fill="#E63946" />
    </svg>
    {!compact && (
      <span className="brand-text">
        <span className="brand-bn">বেচা-কেনা</span>
        <span className="brand-en">Becha-Kena</span>
      </span>
    )}
  </Link>
);
