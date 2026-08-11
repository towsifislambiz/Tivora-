import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Share, PlusSquare, Check, Sparkles, AlertCircle } from 'lucide-react';

const GITHUB_APK_URL = 'https://github.com/towsifislambiz/Tivora-/releases/latest/download/Tivora.apk';

export default function InstallAppModal({ isOpen, onClose, onShowToast }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
      setIsStandalone(true);
    }

    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(userAgent));

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    localStorage.setItem('tivora_install_banner_dismissed', 'true');
    localStorage.setItem('tivora_app_installed', 'true');
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
        onShowToast?.('Tivora installed to your Home Screen! 🚀');
      }
      setDeferredPrompt(null);
    } else {
      onShowToast?.('Open Chrome menu (⋮) → "Install app" or "Add to Home screen" 📱');
    }
  };

  const handleApkDownload = () => {
    localStorage.setItem('tivora_install_banner_dismissed', 'true');
    localStorage.setItem('tivora_app_installed', 'true');
    onShowToast?.('Downloading Tivora.apk… Open it from Downloads to install 📥');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-brand-surface border border-brand-border rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-5">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-brand-lavender text-brand-mutedText transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 text-white flex items-center justify-center mx-auto shadow-lg">
            <Smartphone className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-brand-mainText">Get Tivora App</h3>
            <p className="text-sm text-brand-mutedText mt-1">
              Install Tivora on your phone — works just like Facebook or WhatsApp.
            </p>
          </div>
        </div>

        {/* Content based on platform */}
        {isStandalone || installed ? (
          // Already installed
          <div className="bg-emerald-950/30 border border-emerald-800 p-4 rounded-2xl text-center space-y-2">
            <Check className="w-8 h-8 text-emerald-400 mx-auto" />
            <p className="text-sm font-bold text-emerald-400">Tivora App is installed!</p>
            <p className="text-xs text-brand-mutedText">Running in full-screen app mode.</p>
          </div>

        ) : isIOS ? (
          // iOS Safari guide
          <div className="bg-violet-950/40 p-4 rounded-2xl space-y-3 text-sm">
            <p className="font-bold text-violet-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              Install on iPhone (Safari):
            </p>
            <div className="flex items-start gap-2.5 text-brand-mainText">
              <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">1</span>
              <p>Tap the <Share className="w-4 h-4 inline mx-0.5" /> <strong>Share</strong> button in Safari.</p>
            </div>
            <div className="flex items-start gap-2.5 text-brand-mainText">
              <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">2</span>
              <p>Tap <PlusSquare className="w-4 h-4 inline mx-0.5" /> <strong>"Add to Home Screen"</strong>.</p>
            </div>
            <div className="flex items-start gap-2.5 text-brand-mainText">
              <span className="w-5 h-5 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center shrink-0 text-xs">3</span>
              <p>Tap <strong>Add</strong> — Tivora appears on your home screen! 🎉</p>
            </div>
          </div>

        ) : (
          // Android — dual options
          <div className="space-y-3">

            {/* Option 1: PWA install (if prompt available) */}
            {deferredPrompt && (
              <button
                onClick={handleInstallClick}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-5 h-5" />
                Install to Home Screen (1-tap)
              </button>
            )}

            {/* Option 2: Download real APK */}
            <a
              href={GITHUB_APK_URL}
              download="Tivora.apk"
              onClick={handleApkDownload}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-700 text-white font-bold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 text-center"
            >
              <Download className="w-5 h-5" />
              Download Tivora.apk
            </a>

            {/* Instructions */}
            <div className="bg-violet-950/30 border border-violet-800/30 p-3.5 rounded-2xl text-left space-y-2">
              <p className="font-bold text-violet-300 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                After download:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-xs text-brand-mutedText">
                <li>Open your phone's <span className="text-brand-mainText font-medium">Downloads</span> folder</li>
                <li>Tap <span className="text-brand-mainText font-medium">Tivora.apk</span></li>
                <li>Allow <span className="text-brand-mainText font-medium">"Install unknown apps"</span> if asked</li>
                <li>Tap <span className="text-violet-300 font-medium">Install</span> — done! 🎉</li>
              </ol>
            </div>

            {/* Chrome PWA guide (if no prompt) */}
            {!deferredPrompt && (
              <div className="border-t border-brand-border/40 pt-3 text-xs text-brand-mutedText text-center">
                Or open Chrome menu <span className="font-medium text-brand-mainText">(⋮)</span> → <span className="font-medium text-brand-mainText">"Install app"</span>
              </div>
            )}
          </div>
        )}

        <div className="text-center">
          <button onClick={onClose} className="text-xs text-brand-mutedText hover:text-brand-mainText transition-colors">
            Continue in Browser
          </button>
        </div>
      </div>
    </div>
  );
}
