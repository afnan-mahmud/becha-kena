import React from 'react';
import './Skeleton.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  variant?: 'text' | 'circular' | 'rectangular';
  count?: number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  variant = 'text',
  count = 1,
  className = '',
  style,
}) => {
  const elements = Array.from({ length: count }).map((_, index) => (
    <span
      key={index}
      className={`skeleton-loader skeleton-variant-${variant} ${className}`}
      style={{
        width: width ?? (variant === 'text' ? '100%' : undefined),
        height: height ?? (variant === 'text' ? undefined : '100%'),
        ...style,
      }}
      aria-hidden="true"
    />
  ));

  return <>{elements}</>;
};
