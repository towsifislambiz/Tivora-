import React, { useState, useEffect } from 'react';
import { ShieldCheck, Flag, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getPendingReports, updateReportStatus } from '../firebase/reportService';
import { formatPostTime } from '../components/feed/PostCard';

export default function AdminModeration({ onShowToast }) {
  const { currentUser, userDoc } = useAuth();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  const isAdmin = userDoc?.role === 'admin' || userDoc?.role === 'owner' || userDoc?.email === 'demo@tivora.app';

  useEffect(() => {
    async function loadReports() {
      if (!currentUser?.uid || !isAdmin) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const fetched = await getPendingReports(40);
      setReports(fetched);
      setLoading(false);
    }

    loadReports();
  }, [currentUser?.uid, isAdmin]);

  const handleResolve = async (reportId) => {
    if (processingId) return;
    setProcessingId(reportId);

    try {
      await updateReportStatus(reportId, "resolved");
      setReports(prev => prev.filter(r => r.id !== reportId));
      if (onShowToast) onShowToast("Report marked as resolved.");
    } catch (err) {
      if (onShowToast) onShowToast("Failed to update report status.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleDismiss = async (reportId) => {
    if (processingId) return;
    setProcessingId(reportId);

    try {
      await updateReportStatus(reportId, "reviewed");
      setReports(prev => prev.filter(r => r.id !== reportId));
      if (onShowToast) onShowToast("Report dismissed.");
    } catch (err) {
      if (onShowToast) onShowToast("Failed to update report status.");
    } finally {
      setProcessingId(null);
    }
  };

  if (!isAdmin) {
    return (
      <div class="bg-brand-surface rounded-3xl p-12 border border-brand-border text-center space-y-3">
        <AlertCircle class="w-12 h-12 text-red-500 mx-auto" />
        <h3 class="font-bold text-lg text-brand-mainText">Access Denied</h3>
        <p class="text-xs text-brand-mutedText max-w-xs mx-auto">
          You do not have administrative permissions to view platform moderation.
        </p>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      {/* Header Banner */}
      <div class="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-soft-sm flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-primary-gradient text-white flex items-center justify-center shadow-gradient-glow shrink-0">
            <ShieldCheck class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-brand-mainText">Platform Admin Moderation</h2>
            <p class="text-xs text-brand-mutedText mt-0.5">Review reported content, users, and safety flags</p>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div class="flex justify-center py-16">
          <Loader2 class="w-7 h-7 text-brand-purple animate-spin" />
        </div>
      ) : reports.length === 0 ? (
        <div class="bg-brand-surface rounded-3xl p-12 border border-brand-border text-center space-y-2">
          <CheckCircle class="w-12 h-12 text-emerald-500 mx-auto" />
          <h3 class="font-bold text-base text-brand-mainText">All caught up!</h3>
          <p class="text-xs text-brand-mutedText">There are no pending reports requiring moderation right now.</p>
        </div>
      ) : (
        <div class="space-y-4">
          {reports.map((r) => (
            <div key={r.id} class="bg-brand-surface rounded-2xl border border-brand-border p-5 shadow-soft-sm space-y-3">
              <div class="flex items-center justify-between border-b border-brand-border pb-2">
                <div class="flex items-center gap-2">
                  <Flag class="w-4 h-4 text-red-500" />
                  <span class="font-bold text-xs capitalize text-brand-mainText">
                    Reported {r.targetType}: <span class="text-brand-purple">{r.targetId}</span>
                  </span>
                </div>
                <span class="text-[0.68rem] text-brand-mutedText">{formatPostTime(r.createdAt)}</span>
              </div>

              <div class="space-y-1 text-xs text-brand-mainText">
                <p><span class="font-bold">Reason:</span> <span class="text-red-600 font-semibold">{r.reason}</span></p>
                {r.description && <p><span class="font-bold">Details:</span> {r.description}</p>}
                <p class="text-brand-mutedText"><span class="font-bold text-brand-mainText">Reporter ID:</span> {r.reporterId}</p>
              </div>

              <div class="pt-2 border-t border-brand-border flex items-center justify-end gap-2">
                <button
                  onClick={() => handleDismiss(r.id)}
                  disabled={processingId === r.id}
                  class="px-4 py-1.5 rounded-full border border-brand-border text-brand-mutedText font-semibold text-xs hover:bg-brand-lavender transition-all"
                >
                  Dismiss
                </button>
                <button
                  onClick={() => handleResolve(r.id)}
                  disabled={processingId === r.id}
                  class="px-4 py-1.5 rounded-full bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 shadow-soft-xs transition-all flex items-center gap-1"
                >
                  <CheckCircle class="w-3.5 h-3.5" />
                  <span>Resolve</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
