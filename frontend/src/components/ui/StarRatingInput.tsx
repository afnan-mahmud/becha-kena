import { useState } from 'react';
import { Star } from 'lucide-react';

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
  size?: 'sm' | 'md' | 'lg';
}

export const StarRatingInput = ({ value, onChange, size = 'md' }: StarRatingInputProps) => {
  const [hoverRating, setHoverRating] = useState(0);

  const sizes = {
    sm: 16,
    md: 24,
    lg: 32
  };

  const iconSize = sizes[size];

  return (
    <div className="flex items-center gap-1" style={{ display: 'flex', gap: '0.25rem' }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = (hoverRating || value) >= star;
        return (
          <button
            key={star}
            type="button"
            className="star-rating-btn"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              color: isFilled ? '#eab308' : '#d1d5db',
              transition: 'color 0.2s ease, transform 0.1s ease',
            }}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => onChange(star)}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.9)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Star
              size={iconSize}
              fill={isFilled ? 'currentColor' : 'none'}
              strokeWidth={isFilled ? 0 : 2}
            />
          </button>
        );
      })}
    </div>
  );
};
