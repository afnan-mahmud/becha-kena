import { ShieldCheck } from 'lucide-react';

interface VerifiedBadgeProps {
  size?: 'sm' | 'md';
}

export const VerifiedBadge = ({ size = 'md' }: VerifiedBadgeProps) => {
  const iconSize = size === 'sm' ? 14 : 18;
  const fontSize = size === 'sm' ? '0.75rem' : '0.875rem';

  return (
    <div 
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        color: 'var(--success-color)',
        backgroundColor: 'rgba(46, 204, 113, 0.1)',
        padding: size === 'sm' ? '2px 6px' : '4px 8px',
        borderRadius: '12px',
        fontWeight: 500,
        fontSize,
      }}
      title="Verified Citizen"
    >
      <ShieldCheck size={iconSize} />
      <span>✓ ভেরিফাইড</span>
    </div>
  );
};
