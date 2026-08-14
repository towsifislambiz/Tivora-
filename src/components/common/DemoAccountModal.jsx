import React from 'react';
import ReactDOM from 'react-dom';
import { UserPlus, X, Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export default function DemoAccountModal({ isOpen, onClose, actionName = "add friends" }) {
  const { logout } = useAuth();

  if (!isOpen) return null;

  const handleCreateAccountClick = async () => {
    onClose();
    try {
      await logout();
    } catch (err) {
      console.warn("Logout error:", err);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Create Account Required"
    >
      <div className="bg-brand-surface rounded-3xl p-6 sm:p-8 max-w-md w-full border border-brand-border shadow-2xl text-center space-y-5 relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-brand-lavender text-brand-mutedText hover:text-brand-mainText transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon */}
        <div className="w-16 h-16 rounded-full bg-brand-lavender text-brand-purple flex items-center justify-center mx-auto shadow-soft-sm">
          <UserPlus className="w-8 h-8 text-brand-purple" />
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h3 className="font-bold text-xl text-brand-mainText flex items-center justify-center gap-2">
            <span>Create Account First</span>
            <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
          </h3>
          <p className="text-xs sm:text-sm text-brand-mutedText leading-relaxed max-w-xs mx-auto">
            You are currently using the <strong>Tivora Demo Account</strong> 🤖. To {actionName} and connect with real members, please create a free real account!
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 space-y-2.5">
          <button
            onClick={handleCreateAccountClick}
            className="w-full py-3.5 rounded-2xl bg-primary-gradient text-white font-bold text-sm shadow-gradient-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>Create Free Account</span>
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-brand-lavender text-brand-mainText font-semibold text-xs hover:bg-brand-border transition-colors"
          >
            Stay in Demo Mode
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
