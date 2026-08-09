import React, { useState } from 'react';
import { MessageSquare, Mail, Lock, AlertCircle, ArrowRight, Zap, Key, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getFriendlyAuthErrorMessage } from '../../utils/authErrors';

export default function Login({ onNavigateToSignUp, onNavigateToForgotPassword }) {
  const { signIn, demoSignIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(getFriendlyAuthErrorMessage(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('demo@tivora.app');
    setPassword('DemoUser123!');
    setError('');
  };

  const handleQuickDemoLogin = async () => {
    setError('');
    setDemoLoading(true);
    try {
      await demoSignIn();
    } catch (err) {
      setError(getFriendlyAuthErrorMessage(err.code, 'Failed to sign in with demo account.'));
    } finally {
      setDemoLoading(false);
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
          <h1 class="text-2xl font-bold text-brand-mainText tracking-tight">Welcome back to Tivora</h1>
          <p class="text-xs text-brand-mutedText">Connect · Share · Grow Together</p>
        </div>

        {/* Recommended Demo User Box */}
        <div class="bg-banner-gradient border border-brand-purple/25 p-5 rounded-2xl space-y-3 shadow-soft-sm">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 font-bold text-sm text-brand-purple">
              <Zap class="w-4 h-4 text-brand-pink fill-brand-pink" />
              <span>Try Tivora</span>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              class="text-xs font-semibold text-brand-purple hover:underline flex items-center gap-1"
            >
              <Key class="w-3.5 h-3.5" />
              <span>Fill Credentials</span>
            </button>
          </div>
          <p class="text-xs text-brand-mutedText leading-relaxed">
            Explore the full Tivora social platform instantly without creating a new account.
          </p>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            disabled={demoLoading || loading}
            class="w-full h-10 rounded-full bg-primary-gradient text-white font-bold text-xs shadow-gradient-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {demoLoading ? (
              <span>Signing in demo user...</span>
            ) : (
              <>
                <span>Continue as Demo</span>
                <ArrowRight class="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} class="space-y-4">
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
                placeholder="name@example.com"
                class="w-full h-11 bg-brand-lavender border border-transparent focus:border-brand-purple focus:bg-white rounded-full pl-11 pr-4 text-xs sm:text-sm text-brand-mainText outline-none transition-all placeholder:text-brand-mutedText/60"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="text-xs font-semibold text-brand-mainText block">Password</label>
              <button
                type="button"
                onClick={onNavigateToForgotPassword}
                class="text-xs font-semibold text-brand-purple hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div class="relative">
              <Lock class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-mutedText pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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

          <button
            type="submit"
            disabled={loading || demoLoading}
            class="w-full h-11 rounded-full bg-white border border-brand-border text-brand-mainText font-semibold text-sm shadow-soft-sm hover:bg-brand-lavender hover:text-brand-purple transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
          >
            {loading ? (
              <span>Signing in...</span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight class="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer Link to Sign Up */}
        <div class="text-center pt-2 border-t border-brand-border text-xs text-brand-mutedText">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onNavigateToSignUp}
            class="font-bold text-brand-purple hover:underline"
          >
            Create an Account
          </button>
        </div>
      </div>
    </div>
  );
}
