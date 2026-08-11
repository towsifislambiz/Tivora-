import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X } from 'lucide-react';

export default function MobileInstallBanner({ onOpenInstallModal }) {
  const [dismissed, setDismissed] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsStandalone(true);
    }
  }, []);

  if (dismissed || isStandalone) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-brand-purple text-white px-4 py-2.5 flex items-center justify-between shadow-md relative z-40 animate-fadeIn">
      <div className="flex items-center gap-2.5 min-w-0 cursor-pointer" onClick={onOpenInstallModal}>
        <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white shrink-0">
          <Smartphone className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h5 className="font-bold text-xs leading-tight truncate">Get Tivora Mobile App</h5>
          <p className="text-[0.68rem] text-white/80 leading-none mt-0.5">Faster & full-screen experience</p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onOpenInstallModal}
          className="px-3.5 py-1 rounded-full bg-white text-brand-purple font-bold text-xs shadow-soft-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-full hover:bg-white/20 text-white/80 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
