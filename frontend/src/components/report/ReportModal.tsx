import { useState, type FormEvent } from 'react';
import { X, Flag } from 'lucide-react';
import toast from 'react-hot-toast';
import { submitReport } from '../../services/report.service';
import { REPORT_REASONS } from '../../utils/constants';
import { getErrorMessage } from '../../utils/formatters';
import type { ReportReason } from '../../types';
import './ReportModal.css';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'Listing' | 'User';
  targetId: string;
}

export const ReportModal = ({ isOpen, onClose, targetType, targetId }: ReportModalProps) => {
  const [reason, setReason] = useState<ReportReason>('scam');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error('অনুগ্রহ করে সংক্ষেপে সমস্যাটি লিখুন');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReport({ targetType, targetId, reason, description: description.trim() });
      toast.success('রিপোর্ট জমা হয়েছে। আমাদের টিম ২৪ ঘণ্টার মধ্যে দেখবে।');
      setDescription('');
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error, 'রিপোর্ট জমা দিতে সমস্যা হয়েছে'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal-container" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="report-title">
        <div className="report-modal-header">
          <h2 id="report-title"><Flag size={20} /> রিপোর্ট করুন</h2>
          <button className="btn-close" onClick={onClose} aria-label="বন্ধ করুন">
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="report-modal-body">
            <p className="text-secondary mb-4">
              {targetType === 'Listing' ? 'এই বিজ্ঞাপনটি' : 'এই ব্যবহারকারীকে'} কেন রিপোর্ট করছেন? আপনার পরিচয় গোপন রাখা হবে।
            </p>

            <div className="report-reasons-group">
              {REPORT_REASONS.map((r) => (
                <label key={r.value} className={`report-reason-option ${reason === r.value ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="reportReason"
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="report-desc">বিস্তারিত লিখুন *</label>
              <textarea
                id="report-desc"
                className="form-control"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={1000}
                placeholder="কী ঘটেছে সংক্ষেপে লিখুন…"
                required
              />
              <div className="text-right text-xs text-muted">{description.length}/1000</div>
            </div>
            <p className="text-xs text-muted" style={{ margin: 0 }}>মিথ্যা রিপোর্ট করলে আপনার অ্যাকাউন্টের বিরুদ্ধে ব্যবস্থা নেওয়া হতে পারে।</p>
          </div>

          <div className="report-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>বাতিল</button>
            <button type="submit" className="btn btn-danger" disabled={isSubmitting || !description.trim()}>
              {isSubmitting ? 'জমা দেওয়া হচ্ছে…' : 'রিপোর্ট জমা দিন'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
