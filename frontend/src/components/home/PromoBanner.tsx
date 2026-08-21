import { Link } from 'react-router-dom';
import './PromoBanner.css';

interface PromoBannerProps {
  title: string;
  subtitle: string;
  bgGradient: string;
  ctaText: string;
  ctaLink: string;
}

export const PromoBanner = ({ title, subtitle, bgGradient, ctaText, ctaLink }: PromoBannerProps) => {
  return (
    <div className="promo-banner" style={{ background: bgGradient }}>
      <div className="promo-banner-content">
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <Link to={ctaLink} className="promo-banner-cta">
          {ctaText}
        </Link>
      </div>
    </div>
  );
};
