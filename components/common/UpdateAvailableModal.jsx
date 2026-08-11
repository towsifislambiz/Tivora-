import React from 'react';
import { Download, X, Sparkles, ExternalLink } from 'lucide-react';

/**
 * UpdateAvailableModal — shown when a new Tivora version is available.
 * Triggered by useAppUpdateChecker hook.
 */
export default function UpdateAvailableModal({
  isOpen,
  onClose,
  latestVersion,
  currentVersion,
  downloadUrl,
}) {
  if (!isOpen) return null;

  const handleUpdate = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank', 'noopener,noreferrer');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 max-w-sm w-full shadow-2xl relative space-y-5">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-brand-lavender text-brand-mutedText transition-colors"
          aria-label="Dismiss update"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 text-white flex items-center justify-center mx-auto shadow-lg">
            <Sparkles className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-brand-mainText">
              New Tivora Update Available
            </h3>
            <p className="text-sm text-brand-mutedText mt-1">
              Version <span className="font-semibold text-violet-400">{latestVersion}</span> is ready to install.
              {currentVersion && (
                <span className="text-xs block mt-0.5 opacity-70">Current: {currentVersion}</span>
              )}
            </p>
          </div>
        </div>

        {/* What's new (generic) */}
        <div className="bg-violet-950/40 border border-violet-800/40 rounded-2xl p-3 text-xs text-violet-300 space-y-1">
          <p className="font-semibold text-violet-200">How to update:</p>
          <ol className="list-decimal list-inside space-y-1 text-violet-300/80">
            <li>Download the new APK below</li>
            <li>Open the downloaded file from your Downloads</li>
            <li>Tap <strong>Install</strong> — your account stays safe ✅</li>
          </ol>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleUpdate}
            className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Tivora {latestVersion}
            <ExternalLink className="w-3 h-3 opacity-70" />
          </button>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-5 rounded-2xl text-brand-mutedText hover:text-brand-mainText hover:bg-brand-lavender font-medium text-sm transition-all"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
