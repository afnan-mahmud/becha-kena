import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from './Button';
import './EmptyState.css';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  actionText?: string;
  actionLink?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionText,
  actionLink,
  onAction,
}) => {
  return (
    <div className="empty-state">
      <div className="empty-state-icon">
        {icon}
      </div>
      <h3 className="empty-state-title">{title}</h3>
      {description && (
        <p className="empty-state-description">{description}</p>
      )}
      
      {(actionText || onAction) && (
        <div className="empty-state-actions">
          {actionLink ? (
            <Link to={actionLink}>
              <Button variant="primary">{actionText}</Button>
            </Link>
          ) : (
            <Button variant="primary" onClick={onAction}>
              {actionText}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
