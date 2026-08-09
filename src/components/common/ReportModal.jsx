import React, { useState } from 'react';
import { X, Flag, Loader2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { createReport } from '../../firebase/reportService';

export default function ReportModal({ isOpen, targetType, targetId, targetName, onClose, onShowToast }) {
  const { currentUser } = useAuth();

  const [reason, setReason] = useState('Spam');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const reasons = [
    'Spam',
    'Harassment or Bullying',
    'Inappropriate Content',
    'Fake Account or Misinformation',
    'Other'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser?.uid || loading) return;

    setLoading(true);
    try {
      await createReport(currentUser.uid, targetType, targetId, reason, description);
      if (onShowToast) onShowToast("Report submitted successfully. Thank you for keeping Tivora safe! 🛡️");
      onClose();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Failed to submit report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-brand-surface border border-brand-border rounded-3xl max-w-md w-full p-6 shadow-soft-lg space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-brand-border pb-3">
          <div className="flex items-center gap-2 text-brand-mainText">
            <Flag className="w-5 h-5 text-red-500" />
            <h3 className="font-bold text-base">Report {targetType ? targetType.toUpperCase() : 'Content'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-brand-lavender text-brand-mutedText">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-brand-mutedText">
          Help us understand what's wrong with <span className="font-bold text-brand-mainText">{targetName || 'this item'}</span>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs font-bold text-brand-mainText">Select Reason *</label>
            {reasons.map((r) => (
              <label key={r} className="flex items-center gap-3 p-2.5 rounded-xl border border-brand-border hover:bg-brand-lavender/50 cursor-pointer text-xs font-medium text-brand-mainText">
                <input
                  type="radio"
                  name="reportReason"
                  value={r}
                  checked={reason === r}
                  onChange={(e) => setReason(e.target.value)}
                  className="accent-brand-purple"
                />
                <span>{r}</span>
              </label>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-brand-mainText mb-1">Additional Details (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide any context that helps our moderation team..."
              rows={3}
              className="w-full bg-brand-lavender border border-transparent focus:border-brand-purple focus:bg-brand-surface rounded-xl p-2.5 text-xs text-brand-mainText outline-none resize-none"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-brand-border">
            <button type="button" onClick={onClose} className="px-4 py-2 font-semibold text-xs text-brand-mutedText hover:underline">
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-red-600 text-white font-bold text-xs rounded-full hover:bg-red-700 shadow-soft-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
              <span>Submit Report</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
