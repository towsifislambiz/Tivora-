import React, { useState } from 'react';
import { MessageSquare, Mail, AlertCircle, CheckCircle2, ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getFriendlyAuthErrorMessage } from '../../utils/authErrors';

export default function ForgotPassword({ onNavigateToLogin }) {
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      setError(getFriendlyAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-brand-surface rounded-3xl p-8 border border-brand-border shadow-soft-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-gradient text-white shadow-gradient-glow mb-2">
            <MessageSquare className="w-6 h-6 fill-current" />
          </div>
          <h1 className="text-2xl font-bold text-brand-mainText tracking-tight">Reset your password</h1>
          <p className="text-xs text-brand-mutedText">Enter your email and we'll send a recovery link</p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="bg-brand-pink/10 border border-brand-pink/30 text-brand-pink px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert Box */}
        {success ? (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-2xl text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Password Reset Email Sent</span>
            </div>
            <p>We've sent instructions to <strong>{email}</strong>. Check your inbox to set a new password.</p>
            <button
              onClick={onNavigateToLogin}
              className="w-full mt-2 h-9 rounded-lg bg-brand-purple text-white font-semibold text-xs shadow-soft-sm"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-mainText block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-mutedText pointer-events-none" />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full h-11 bg-brand-lavender border border-transparent focus:border-brand-purple focus:bg-brand-surface rounded-lg pl-11 pr-4 text-xs sm:text-sm text-brand-mainText outline-none transition-all placeholder:text-brand-mutedText/60"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-primary-gradient text-white font-semibold text-sm shadow-gradient-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading ? (
                <span>Sending email...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Reset Link</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Link to Sign In */}
        <div className="text-center pt-2 border-t border-brand-border text-xs">
          <button
            type="button"
            onClick={onNavigateToLogin}
            className="font-bold text-brand-purple hover:underline inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>
        </div>
      </div>
    </div>
  );
}
