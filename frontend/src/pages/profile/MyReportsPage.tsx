import { useQuery } from '@tanstack/react-query';
import { Flag, Package, User } from 'lucide-react';
import { getMyReports } from '../../services/report.service';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { formatDate } from '../../utils/formatters';

import './MyReportsPage.css';

export const MyReportsPage = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-reports'],
    queryFn: () => getMyReports(1)
  });

  if (isLoading) return <LoadingSpinner fullScreen />;

  if (error || !data || data.data.items.length === 0) {
    return (
      <div className="my-reports-container">
        <div className="my-reports-header">
          <h1><Flag size={24} /> আমার রিপোর্টসমূহ</h1>
        </div>
        <div className="empty-reports-state">
          <Flag size={48} />
          <h3>কোনো রিপোর্ট পাওয়া যায়নি</h3>
          <p>আপনি এখনও কোনো বিজ্ঞাপন বা ব্যবহারকারীর বিরুদ্ধে রিপোর্ট করেননি।</p>
        </div>
      </div>
    );
  }

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'resolved': return 'মীমাংসিত';
      case 'dismissed': return 'বাতিল';
      case 'pending': 
      default: return 'অপেক্ষমাণ';
    }
  };

  return (
    <div className="my-reports-container">
      <div className="my-reports-header">
        <h1><Flag size={24} /> আমার রিপোর্টসমূহ</h1>
      </div>

      <div className="reports-list">
        {data.data.items.map((report) => (
          <div key={report.id} className="report-card">
            <div className="report-card-header">
              <div className="report-target-info">
                <span className="report-target-type">
                  {report.targetType === 'listing' ? <Package size={16} /> : <User size={16} />}
                  {report.targetType === 'listing' ? 'বিজ্ঞাপন' : 'ব্যবহারকারী'}
                </span>
                <span className="report-target-id">ID: {report.targetId}</span>
              </div>
              <div className={`report-status-badge ${report.status || 'pending'}`}>
                {getStatusLabel(report.status || 'pending')}
              </div>
            </div>

            <div className="report-reason-title">
              কারণ: {report.reason}
            </div>
            
            <div className="report-description">
              {report.description}
            </div>

            <div className="report-footer">
              <span className="report-date">
                জমাদানের তারিখ: {formatDate(report.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
