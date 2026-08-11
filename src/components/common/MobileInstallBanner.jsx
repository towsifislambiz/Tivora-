import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X } from 'lucide-react';

const STORAGE_DISMISSED_KEY = 'tivora_install_banner_dismissed';
const STORAGE_INSTALLED_KEY = 'tivora_app_installed';

/**
 * Utility to check if user is on mobile browser
 */
export function isMobileBrowser() {
  if (typeof window === 'undefined') return false;
  const userAgent = (navigator.userAgent || navigator.vendor || window.opera || '').toLowerCase();
  const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isSmallScreen = window.innerWidth <= 768;
  return isMobileUA || isSmallScreen;
}

/**
 * Utility to check if user is already inside Android App or has installed
 */
export function isAppInstalledOrStandalone() {
  if (typeof window === 'undefined') return false;
  const isCapacitor = Boolean(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  const isStandalone = Boolean(window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true);
  const isMarkedInstalled = localStorage.getItem(STORAGE_INSTALLED_KEY) === 'true';
  return isCapacitor || isStandalone || isMarkedInstalled;
}

export default function MobileInstallBanner({ onOpenInstallModal }) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // 1. Never show inside installed Android app
    if (isAppInstalledOrStandalone()) {
      setShouldShow(false);
      return;
    }

    // 2. Never show on PC / Desktop browser — ONLY on mobile browsers
    if (!isMobileBrowser()) {
      setShouldShow(false);
      return;
    }

    // 3. Never show if user has already dismissed or downloaded before
    const isDismissed = localStorage.getItem(STORAGE_DISMISSED_KEY) === 'true';
    if (isDismissed) {
      setShouldShow(false);
      return;
    }

    setShouldShow(true);
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(STORAGE_DISMISSED_KEY, 'true');
    setShouldShow(false);
  };

  const handleOpenModal = () => {
    localStorage.setItem(STORAGE_DISMISSED_KEY, 'true');
    setShouldShow(false);
    if (onOpenInstallModal) onOpenInstallModal();
  };

  if (!shouldShow) return null;

  return (
    <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-brand-purple text-white px-4 py-2.5 flex items-center justify-between shadow-md relative z-40 animate-fadeIn">
      <div className="flex items-center gap-2.5 min-w-0 cursor-pointer" onClick={handleOpenModal}>
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
          onClick={handleOpenModal}
          className="px-3.5 py-1 rounded-full bg-white text-brand-purple font-bold text-xs shadow-soft-xs hover:scale-105 active:scale-95 transition-all flex items-center gap-1"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-full hover:bg-white/20 text-white/80 transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
