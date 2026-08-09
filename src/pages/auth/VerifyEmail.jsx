import React, { useState } from 'react';
import { Mail, CheckCircle2, RefreshCw, LogOut, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getFriendlyAuthErrorMessage } from '../../utils/authErrors';

export default function VerifyEmail() {
  const { currentUser, resendVerification, refreshUser, logout } = useAuth();

  const [checking, setChecking] = useState(false);
  const [resending, setResending] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleCheckVerification = async () => {
    setChecking(true);
    setError('');
    setMessage('');

    try {
      const refreshedUser = await refreshUser();
      if (refreshedUser && refreshedUser.emailVerified) {
        setMessage('Email verified successfully! Loading Tivora...');
      } else {
        setError('Your email is not verified yet. Please click the link in your inbox.');
      }
    } catch (err) {
      setError(getFriendlyAuthErrorMessage(err.code, 'Failed to verify email status.'));
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError('');
    setMessage('');

    try {
      await resendVerification();
      setMessage('A new verification email has been sent to your inbox!');
    } catch (err) {
      setError(getFriendlyAuthErrorMessage(err.code, 'Failed to resend verification email.'));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-brand-surface rounded-3xl p-8 border border-brand-border shadow-soft-lg space-y-6 text-center">
        {/* Email Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-brand-lavender text-brand-purple shadow-soft-sm">
          <Mail className="w-8 h-8" />
        </div>

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-brand-mainText tracking-tight">Check Your Email</h1>
          <p className="text-xs text-brand-mutedText">We've sent a verification link to:</p>
          <p className="text-sm font-bold text-brand-purple mt-1 break-all">
            {currentUser?.email || 'user@example.com'}
          </p>
        </div>

        {/* Info Box */}
        <div className="bg-brand-lavender/60 p-4 rounded-2xl text-xs text-brand-mainText space-y-1 text-left border border-brand-border">
          <p className="font-bold">Next steps:</p>
          <ol className="list-decimal list-inside space-y-1 text-brand-mutedText">
            <li>Open your email inbox.</li>
            <li>Click the verification link provided.</li>
            <li>Return here and click "I've Verified My Email".</li>
          </ol>
        </div>

        {/* Status Messages */}
        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="bg-brand-pink/10 border border-brand-pink/30 text-brand-pink px-4 py-3 rounded-2xl text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleCheckVerification}
            disabled={checking}
            className="w-full h-11 rounded-lg bg-primary-gradient text-white font-semibold text-sm shadow-gradient-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {checking ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking status...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>I've Verified My Email</span>
              </>
            )}
          </button>

          <button
            onClick={handleResend}
            disabled={resending}
            className="w-full h-10 rounded-lg border border-brand-border text-brand-mainText font-semibold text-xs hover:bg-brand-lavender transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {resending ? 'Sending email...' : 'Resend Verification Email'}
          </button>
        </div>

        {/* Logout Button */}
        <div className="pt-4 border-t border-brand-border">
          <button
            onClick={logout}
            className="text-xs text-brand-mutedText hover:text-red-500 font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Back to Sign In (Logout)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
