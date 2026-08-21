import { useState } from 'react';
import { X, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import { submitReport } from '../../services/report.service';

import './ReportModal.css';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'listing' | 'user';
  targetId: string;
}

const REPORT_REASONS = [
  'প্রতারণা (Scam)',
  'হয়রানি (Harassment)',
  'ভুল তথ্য (Misrepresentation)',
  'অনুপযুক্ত (Inappropriate)',
  'অন্যান্য (Other)'
];

export const ReportModal = ({ isOpen, onClose, targetType, targetId }: ReportModalProps) => {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      toast.error('অনুগ্রহ করে একটি কারণ নির্বাচন করুন');
      return;
    }
    if (!description.trim()) {
      toast.error('অনুগ্রহ করে বিস্তারিত বর্ণনা করুন');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReport({ targetType, targetId, reason, description });
      toast.success('রিপোর্ট সফলভাবে জমা দেওয়া হয়েছে!');
      onClose();
    } catch (error: any) {
      const msg = error.response?.data?.message || 'রিপোর্ট জমা দিতে সমস্যা হয়েছে';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal-container" onClick={e => e.stopPropagation()}>
        <div className="report-modal-header">
          <h2><Flag size={20} /> রিপোর্ট করুন</h2>
          <button className="btn-close" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="report-modal-body">
            <p className="text-secondary mb-4">
              {targetType === 'listing' ? 'এই বিজ্ঞাপনটি' : 'এই ব্যবহারকারীকে'} কেন রিপোর্ট করতে চান তা আমাদের জানান। আপনার রিপোর্ট গোপন রাখা হবে।
            </p>

            <div className="report-reasons-group">
              <label className="form-label mb-2 block">রিপোর্টের কারণ *</label>
              {REPORT_REASONS.map((r) => (
                <div 
                  key={r} 
                  className={`report-reason-option ${reason === r ? 'selected' : ''}`}
                  onClick={() => setReason(r)}
                >
                  <input
                    type="radio"
                    name="reportReason"
                    value={r}
                    checked={reason === r}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <label>{r}</label>
                </div>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label">বিস্তারিত বর্ণনা করুন *</label>
              <textarea
                className="form-control"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                placeholder="সমস্যাটি সম্পর্কে বিস্তারিত লিখুন..."
                required
              />
              <div className="text-right text-xs text-muted mt-1">
                {description.length}/1000
              </div>
            </div>
          </div>

          <div className="report-modal-footer">
            <button 
              type="button" 
              className="btn btn-outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              বাতিল
            </button>
            <button 
              type="submit" 
              className="btn"
              style={{ backgroundColor: '#dc2626', color: 'white' }}
              disabled={isSubmitting || !reason || !description.trim()}
            >
              {isSubmitting ? 'জমা দেওয়া হচ্ছে...' : 'রিপোর্ট জমা দিন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
