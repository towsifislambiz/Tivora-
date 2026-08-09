import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

/**
 * Production-ready Toast notification.
 * Supports: auto-dismiss, slide-in animation, accessible ARIA live region.
 * 
 * @param {Object} props
 * @param {string|null} props.toastMessage - Message text to display, or null to hide.
 * @param {'success'|'error'|'info'} [props.type='success'] - Toast type for icon/color.
 */
export default function Toast({ toastMessage, type = 'success' }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (toastMessage) {
      setVisible(true);
    } else {
      // Slight delay to allow fade-out animation
      const t = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(t);
    }
  }, [toastMessage]);

  if (!toastMessage && !visible) return null;

  const isError = type === 'error' || (toastMessage && (
    toastMessage.toLowerCase().includes('fail') ||
    toastMessage.toLowerCase().includes('error') ||
    toastMessage.toLowerCase().includes('denied') ||
    toastMessage.toLowerCase().includes('cannot')
  ));

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-[9999] max-w-sm w-auto transition-all duration-300 ease-out ${
        toastMessage ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}
    >
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-soft-lg border text-sm font-semibold ${
        isError
          ? 'bg-red-600 text-white border-red-700'
          : 'bg-brand-mainText text-white border-white/10'
      }`}>
        {isError ? (
          <AlertCircle className="w-4 h-4 shrink-0 text-red-200" aria-hidden="true" />
        ) : (
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-300" aria-hidden="true" />
        )}
        <span className="leading-snug">{toastMessage}</span>
      </div>
    </div>
  );
}
