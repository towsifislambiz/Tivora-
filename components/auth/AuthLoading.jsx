import React from 'react';
import { MessageSquare } from 'lucide-react';

export default function AuthLoading() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
        <div className="w-16 h-16 rounded-2xl bg-primary-gradient flex items-center justify-center text-white shadow-gradient-glow animate-pulse">
          <MessageSquare className="w-8 h-8 fill-current" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-brand-mainText tracking-tight">Tivora</h2>
          <p className="text-xs text-brand-mutedText mt-0.5">Connecting to your account...</p>
        </div>
        <div className="w-24 h-1 bg-brand-lavender rounded-full overflow-hidden mt-2">
          <div className="w-full h-full bg-primary-gradient animate-skeleton" />
        </div>
      </div>
    </div>
  );
}
