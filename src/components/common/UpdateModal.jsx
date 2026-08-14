import React, { useState, useEffect } from 'react';
import { Sparkles, RefreshCw, X } from 'lucide-react';
import { APP_VERSION } from '../../config/appVersion';
import { isStandaloneApp } from '../../utils/pwaHelper';

export default function UpdateModal() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let currentETag = null;

    async function checkForUpdate() {
      try {
        // Fetch index.html with no-cache header to inspect ETag / Last-Modified
        const res = await fetch(`/?_t=${Date.now()}`, {
          method: 'HEAD',
          cache: 'no-cache'
        });
        const newETag = res.headers.get('etag') || res.headers.get('last-modified');

        if (currentETag && newETag && currentETag !== newETag) {
          if (isStandaloneApp()) {
            // Auto silent background update for installed app users!
            window.location.reload();
          } else {
            setUpdateAvailable(true);
          }
        } else if (newETag) {
          currentETag = newETag;
        }
      } catch (err) {
        // Ignore network check errors
      }
    }

    // Check for updates on mount and every 3 minutes
    checkForUpdate();
    const interval = setInterval(checkForUpdate, 180000);

    // Also check on Service Worker update if present
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (isStandaloneApp()) {
          window.location.reload();
        } else {
          setUpdateAvailable(true);
        }
      });
    }

    return () => clearInterval(interval);
  }, []);

  const handleApplyUpdate = () => {
    window.location.reload();
  };

  if (!updateAvailable || dismissed) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-bounceIn max-w-sm w-full px-4">
      <div className="bg-brand-surface border-2 border-brand-purple/40 rounded-3xl p-5 shadow-2xl backdrop-blur-xl relative overflow-hidden space-y-4">
        {/* Ambient Top Glow */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-brand-purple/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-gradient text-white flex items-center justify-center shadow-gradient-glow shrink-0">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="text-[0.68rem] font-bold text-brand-purple">
                Update Available (v{APP_VERSION})
              </div>
              <h4 className="font-bold text-sm text-brand-mainText leading-tight mt-0.5">
                New Tivora Build Live! 🚀
              </h4>
            </div>
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-full hover:bg-brand-lavender text-brand-mutedText transition-colors shrink-0"
            aria-label="Close update alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2.5 pt-1 relative z-10">
          <button
            onClick={handleApplyUpdate}
            className="flex-1 py-2.5 px-4 rounded-full bg-primary-gradient text-white font-bold text-xs shadow-gradient-glow hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Update Now</span>
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="px-4 py-2.5 rounded-full border border-brand-border text-brand-mainText font-semibold text-xs hover:bg-brand-lavender transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
