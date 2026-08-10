import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare, Check, Sparkles } from 'lucide-react';

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

    // Listen for PWA prompt
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
        if (onShowToast) onShowToast('Thank you for installing Tivora App! 🚀');
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      // Show iOS steps (already in modal)
    } else {
      if (onShowToast) onShowToast('Tap "Add to Home Screen" in your browser menu to install Tivora 📱');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl relative space-y-6">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-brand-lavender text-brand-mutedText transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-primary-gradient text-white flex items-center justify-center mx-auto shadow-gradient-glow animate-bounce">
            <Smartphone className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-brand-mainText">Get Tivora Mobile App</h3>
          <p className="text-xs sm:text-sm text-brand-mutedText max-w-xs mx-auto leading-relaxed">
            Install Tivora on your phone home screen for a faster, full-screen, native social experience.
          </p>
        </div>

        {/* Status / Instructions */}
        {isStandalone || installed ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-2xl text-center space-y-2">
            <Check className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Tivora App is already installed!</p>
            <p className="text-xs text-brand-mutedText">You are running the official app version.</p>
          </div>
        ) : isIOS ? (
          /* iPhone / iOS 2-step Instructions */
          <div className="bg-brand-lavender/60 p-4 rounded-2xl space-y-3 text-xs text-brand-mainText">
            <div className="font-bold text-brand-purple flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Easy 2-Step Install for iPhone (Safari):</span>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-brand-purple text-white font-bold flex items-center justify-center shrink-0 text-[0.7rem]">1</span>
              <p>Tap the <span className="font-bold underline flex-inline items-center gap-1">Share button <Share className="w-3 h-3 inline" /></span> at the bottom of Safari.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-brand-purple text-white font-bold flex items-center justify-center shrink-0 text-[0.7rem]">2</span>
              <p>Scroll down and tap <span className="font-bold underline flex-inline items-center gap-1">"Add to Home Screen" <PlusSquare className="w-3 h-3 inline" /></span>.</p>
            </div>
          </div>
        ) : (
          /* Android / Chrome One-click Install */
          <div className="space-y-3">
            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 px-6 rounded-2xl bg-primary-gradient text-white font-bold text-sm shadow-gradient-glow hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" />
              <span>{deferredPrompt ? 'Install Tivora App Now' : 'Add to Phone Home Screen'}</span>
            </button>
            <p className="text-[0.75rem] text-center text-brand-mutedText">
              No App Store needed. Instant installation with 0 MB download!
            </p>
          </div>
        )}

        <div className="pt-2 text-center">
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
