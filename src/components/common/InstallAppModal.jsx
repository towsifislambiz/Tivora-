import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare, Check, Sparkles, AlertCircle } from 'lucide-react';

export default function InstallAppModal({ isOpen, onClose, onShowToast }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Check if already running as installed app
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsStandalone(true);
    }

    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const iosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iosDevice);

    // Listen for PWA install prompt from Chrome / Android
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        if (onShowToast) onShowToast('Tivora App installed to your Home Screen! 🚀');
      }
      setDeferredPrompt(null);
    } else {
      // Guide user on Chrome Android
      if (onShowToast) {
        onShowToast('Tap Chrome menu (⋮) -> Select "Install App" or "Add to Home screen" 📱');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-brand-lavender text-brand-mutedText transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Tivora App Brand Logo */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-primary-gradient text-white flex items-center justify-center mx-auto shadow-gradient-glow animate-bounce">
            <Smartphone className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-brand-mainText">Install Tivora App</h3>
          <p className="text-xs sm:text-sm text-brand-mutedText max-w-xs mx-auto leading-relaxed">
            Install Tivora directly on your phone home screen with official logo & full-screen app experience.
          </p>
        </div>

        {/* Status / Instructions */}
        {isStandalone || installed ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl text-center space-y-2">
            <Check className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Tivora App is installed!</p>
            <p className="text-xs text-brand-mutedText">Running in full-screen native mobile app mode.</p>
          </div>
        ) : isIOS ? (
          /* iPhone / iOS 2-step Instructions */
          <div className="bg-brand-lavender/60 p-4 rounded-2xl space-y-3 text-xs text-brand-mainText">
            <div className="font-bold text-brand-purple flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Easy Install on iPhone (Safari):</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-brand-purple text-white font-bold flex items-center justify-center shrink-0 text-[0.7rem]">1</span>
              <p>Tap Safari <span className="font-bold underline flex-inline items-center gap-1">Share button <Share className="w-3 h-3 inline" /></span>.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-brand-purple text-white font-bold flex items-center justify-center shrink-0 text-[0.7rem]">2</span>
              <p>Tap <span className="font-bold underline flex-inline items-center gap-1">"Add to Home Screen" <PlusSquare className="w-3 h-3 inline" /></span>.</p>
            </div>
          </div>
        ) : (
          /* Android / Chrome Installation Guide */
          <div className="space-y-4">
            
            {/* Primary Action Button */}
            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 px-6 rounded-2xl bg-primary-gradient text-white font-bold text-sm shadow-gradient-glow hover:scale-[1.02] active:scale-98 transition-transform flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span>{deferredPrompt ? 'Install App to Home Screen' : 'Install Tivora App'}</span>
            </button>

            {/* Android Direct Guide Box */}
            <div className="bg-brand-lavender/70 p-3.5 rounded-2xl text-left space-y-2 text-xs text-brand-mainText border border-brand-border/60">
              <div className="font-bold text-brand-purple flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Android Chrome-এ যেভাবে হোম স্ক্রিনে যোগ করবেন:</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-brand-mutedText pl-1">
                <li>ক্রোম ব্রাউজারের ওপরে <span className="font-bold text-brand-mainText">তিনটি ডট (⋮)</span> চাপুন।</li>
                <li><span className="font-bold text-brand-mainText">"Install app"</span> অথবা <span className="font-bold text-brand-mainText">"Add to Home screen"</span> নির্বাচন করুন।</li>
                <li>ফোনের হোম স্ক্রিনে <span className="font-bold text-brand-purple">Tivora Logo & Name</span> সহ অফিশিয়াল অ্যাপ হিসেবে যোগ হয়ে যাবে!</li>
              </ol>
            </div>

          </div>
        )}

        <div className="pt-1 text-center">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-brand-mutedText hover:text-brand-mainText transition-colors"
          >
            Continue in Browser
          </button>
        </div>

      </div>
    </div>
  );
}
