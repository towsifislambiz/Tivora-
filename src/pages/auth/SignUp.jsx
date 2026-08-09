import React, { useState } from 'react';
import { MessageSquare, User, Mail, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getFriendlyAuthErrorMessage } from '../../utils/authErrors';

export default function SignUp({ onNavigateToLogin }) {
  const { signUp } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!displayName || !email || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify your password confirmation.');
      return;
    }

    setLoading(true);
    try {
      await signUp(email, password, displayName);
    } catch (err) {
      setError(getFriendlyAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-brand-surface rounded-3xl p-8 border border-brand-border shadow-soft-lg space-y-6">
        {/* Brand Header */}
        <div class="text-center space-y-2">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-gradient text-white shadow-gradient-glow mb-2">
            <MessageSquare class="w-6 h-6 fill-current" />
          </div>
          <h1 class="text-2xl font-bold text-brand-mainText tracking-tight">Create your Tivora account</h1>
          <p class="text-xs text-brand-mutedText">Join thousands of creators and developers today</p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSubmit} class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-brand-mainText block">Full Name</label>
            <div class="relative">
              <User class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-mutedText pointer-events-none" />
              <input
                type="text"
                autoComplete="name"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ethan Carter"
                class="w-full h-11 bg-brand-lavender border border-transparent focus:border-brand-purple focus:bg-white rounded-full pl-11 pr-4 text-xs sm:text-sm text-brand-mainText outline-none transition-all placeholder:text-brand-mutedText/60"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-brand-mainText block">Email Address</label>
            <div class="relative">
              <Mail class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-mutedText pointer-events-none" />
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ethan@example.com"
                class="w-full h-11 bg-brand-lavender border border-transparent focus:border-brand-purple focus:bg-white rounded-full pl-11 pr-4 text-xs sm:text-sm text-brand-mainText outline-none transition-all placeholder:text-brand-mutedText/60"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-brand-mainText block">Password</label>
            <div class="relative">
              <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-mutedText pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                class="w-full h-11 bg-brand-lavender border border-transparent focus:border-brand-purple focus:bg-white rounded-full pl-11 pr-11 text-xs sm:text-sm text-brand-mainText outline-none transition-all placeholder:text-brand-mutedText/60"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                class="absolute right-4 top-1/2 -translate-y-1/2 text-brand-mutedText hover:text-brand-purple transition-colors p-1"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff class="w-4 h-4" /> : <Eye class="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-brand-mainText block">Confirm Password</label>
            <div class="relative">
              <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-mutedText pointer-events-none" />
              <input
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your password"
                class="w-full h-11 bg-brand-lavender border border-transparent focus:border-brand-purple focus:bg-white rounded-full pl-11 pr-11 text-xs sm:text-sm text-brand-mainText outline-none transition-all placeholder:text-brand-mutedText/60"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                class="absolute right-4 top-1/2 -translate-y-1/2 text-brand-mutedText hover:text-brand-purple transition-colors p-1"
                title={showConfirmPassword ? "Hide password" : "Show password"}
              >
                {showConfirmPassword ? <EyeOff class="w-4 h-4" /> : <Eye class="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            class="w-full h-11 rounded-full bg-primary-gradient text-white font-semibold text-sm shadow-gradient-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <span>Creating account...</span>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight class="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Sign In */}
        <div class="text-center pt-2 border-t border-brand-border text-xs text-brand-mutedText">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onNavigateToLogin}
            class="font-bold text-brand-purple hover:underline"
          >
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
