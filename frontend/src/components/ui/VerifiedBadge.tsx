import { ShieldCheck } from 'lucide-react';
import './VerifiedBadge.css';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md';
  label?: string;
}

export const VerifiedBadge = ({ size = 'md', label = 'NID ভেরিফাইড' }: VerifiedBadgeProps) => (
  <span className={`verified-badge verified-badge--${size}`} title="জাতীয় পরিচয়পত্র (NID) দিয়ে যাচাইকৃত">
    <ShieldCheck size={size === 'sm' ? 13 : 16} aria-hidden="true" />
    <span>{label}</span>
  </span>
);
