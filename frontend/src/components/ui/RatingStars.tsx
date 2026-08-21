import { Star, StarHalf } from 'lucide-react';

interface RatingStarsProps {
  rating: number; // 0-5
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  count?: number;
}

export const RatingStars = ({ rating, size = 'md', showCount = false, count = 0 }: RatingStarsProps) => {
  const getIconSize = () => {
    switch (size) {
      case 'sm': return 14;
      case 'lg': return 24;
      case 'md':
      default: return 18;
    }
  };

  const iconSize = getIconSize();
  const safeRating = Math.max(0, Math.min(5, rating)); // Clamp between 0-5
  const fullStars = Math.floor(safeRating);
  const hasHalfStar = safeRating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      <div style={{ display: 'flex', color: '#f39c12' }}>
        {[...Array(fullStars)].map((_, i) => (
          <Star key={`full-${i}`} size={iconSize} fill="currentColor" />
        ))}
        {hasHalfStar && <StarHalf size={iconSize} fill="currentColor" />}
        {[...Array(emptyStars)].map((_, i) => (
          <Star key={`empty-${i}`} size={iconSize} color="#d1d5db" />
        ))}
      </div>
      
      {showCount && (
        <span style={{ 
          fontSize: size === 'sm' ? '0.75rem' : size === 'lg' ? '1rem' : '0.875rem',
          color: 'var(--text-light)',
          marginLeft: '4px' 
        }}>
          ({count})
        </span>
      )}
    </div>
  );
};
