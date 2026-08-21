import './StatusBadge.css';

interface StatusBadgeProps {
  status: string;
  variant: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export const StatusBadge = ({ status, variant }: StatusBadgeProps) => {
  return (
    <span className={`status-badge badge-${variant}`}>
      {status}
    </span>
  );
};
