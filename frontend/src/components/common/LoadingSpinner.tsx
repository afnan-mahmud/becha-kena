import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ fullScreen = false }) => {
  const content = (
    <div className="spinner-container">
      <div className="spinner"></div>
    </div>
  );

  if (fullScreen) {
    return <div className="spinner-fullscreen">{content}</div>;
  }

  return content;
};
