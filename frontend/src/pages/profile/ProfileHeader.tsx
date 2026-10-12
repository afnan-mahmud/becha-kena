import type { ReactNode } from 'react';
import { CalendarDays, Star } from 'lucide-react';
import { UserAvatar } from '../../components/ui/UserAvatar';
import { VerifiedBadge } from '../../components/ui/VerifiedBadge';
import { formatDate } from '../../utils/formatters';

interface ProfileHeaderProps {
  name: string;
  isVerified: boolean;
  verifiedName?: string | null;
  averageRating: number;
  totalReviews: number;
  createdAt: string | Date;
  extra?: ReactNode;
  actions?: ReactNode;
}

/** Shared banner for "my profile" and public seller profiles */
export const ProfileHeader = ({ name, isVerified, verifiedName, averageRating, totalReviews, createdAt, extra, actions }: ProfileHeaderProps) => (
  <section className="profile-hero">
    <div className="profile-hero__cover" aria-hidden="true" />
    <div className="profile-hero__body">
      <div className="profile-hero__avatar"><UserAvatar name={name || 'U'} size="xl" /></div>
      <div className="profile-hero__info">
        <h1>
          {name || 'নামহীন ব্যবহারকারী'}
          {isVerified && <VerifiedBadge />}
        </h1>
        {verifiedName && <p className="profile-hero__legal">আইনগত নাম (NID অনুযায়ী): <strong>{verifiedName}</strong></p>}
        <div className="profile-hero__meta">
          <span><Star size={15} fill="currentColor" className="profile-hero__star" /> {totalReviews > 0 ? `${averageRating.toFixed(1)} (${totalReviews} রিভিউ)` : 'এখনো রিভিউ নেই'}</span>
          <span><CalendarDays size={15} /> সদস্য: {formatDate(createdAt)}</span>
          {extra}
        </div>
      </div>
      {actions && <div className="profile-hero__actions">{actions}</div>}
    </div>
  </section>
);
