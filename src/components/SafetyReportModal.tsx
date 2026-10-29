import React, { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { api } from '../services/api.ts';
import { useToast } from '../contexts/ToastContext.tsx';

interface SafetyReportModalProps {
  entityType: 'listing' | 'provider' | 'ngo' | 'volunteer';
  entityId: string;
  entityTitle: string;
  onClose: () => void;
}

export const SafetyReportModal: React.FC<SafetyReportModalProps> = ({
  entityType,
  entityId,
  entityTitle,
  onClose,
}) => {
  const [issueType, setIssueType] = useState('food_safety');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      showToast('Please provide details regarding the safety concern', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.submitSafetyReport({
        reportedEntityType: entityType,
        reportedEntityId: entityId,
        reportedEntityTitle: entityTitle,
        issueType,
        description,
      });
      showToast('Food safety report submitted. Administrators have been notified.', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to submit report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-left relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 text-amber-600 mb-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <h3 className="text-base font-bold text-slate-900">Report Food Safety Concern</h3>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Reporting: <span className="font-semibold text-slate-700">{entityTitle}</span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Issue Category</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#183B28]"
            >
              <option value="food_safety">Food Safety / Spoilage Concern</option>
              <option value="temperature_abuse">Temperature Inadequacy (Cold/Hot chain broken)</option>
              <option value="hygiene">Improper Packaging or Hygiene Defect</option>
              <option value="misleading_quantity">Inaccurate Quantity or Servings</option>
              <option value="no_show">Handover No-Show or Unresponsive Partner</option>
              <option value="other">Other Concern</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Description & Evidence</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what occurred, temperature observed, smell/appearance, packaging state..."
              className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#183B28]"
              required
            />
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-800 leading-relaxed">
            SharePlate takes food safety seriously. Reports are flagged immediately to platform moderators for prompt review.
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : 'Submit Safety Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
