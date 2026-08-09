import React from 'react';
import { Home, AlertTriangle } from 'lucide-react';

export default function NotFound({ onGoHome }) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="bg-brand-surface rounded-3xl border border-brand-border shadow-soft-lg max-w-sm w-full p-10 text-center space-y-5">
        <div className="text-6xl">🔍</div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-brand-mainText">Page not found</h2>
          <p className="text-sm text-brand-mutedText leading-relaxed">
            The page you're looking for doesn't exist or may have been moved.
          </p>
        </div>
        <button
          onClick={onGoHome}
          className="px-6 py-2.5 bg-primary-gradient text-white font-bold text-sm rounded-full shadow-gradient-glow hover:scale-105 transition-transform inline-flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          <span>Back to Home</span>
        </button>
      </div>
    </div>
  );
}
