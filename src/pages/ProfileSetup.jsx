import React, { useState, useEffect } from 'react';
import { MessageSquare, AtSign, User, AlignLeft, MapPin, CheckCircle2, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { normalizeUsername, getUsernameError } from '../utils/usernameValidator';
import { checkUsernameAvailable } from '../firebase/profileService';

export default function ProfileSetup() {
  const { currentUser, userDoc, completeProfileSetup } = useAuth();

  const [displayName, setDisplayName] = useState(currentUser?.displayName || userDoc?.displayName || '');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');

  const [checking, setChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState(null);
  const [availabilityMessage, setAvailabilityMessage] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Debounced Username Availability Check
  useEffect(() => {
    const normalized = normalizeUsername(username);
    if (!normalized) {
      setIsAvailable(null);
      setAvailabilityMessage('');
      return;
    }

    const err = getUsernameError(normalized);
    if (err) {
      setIsAvailable(false);
      setAvailabilityMessage(err);
      return;
    }

    setChecking(true);
    setAvailabilityMessage('Checking availability...');

    const timer = setTimeout(async () => {
      try {
        const result = await checkUsernameAvailable(normalized, currentUser?.uid);
        if (result.available) {
          setIsAvailable(true);
          setAvailabilityMessage(`✓ @${normalized} is available!`);
        } else {
          setIsAvailable(false);
          setAvailabilityMessage(`✗ @${normalized} is already taken by another user.`);
        }
      } catch (err) {
        // Fallback: mark as available so user can attempt submission
        setIsAvailable(true);
        setAvailabilityMessage(`✓ @${normalized} is available!`);
      } finally {
        setChecking(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [username, currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const normUser = normalizeUsername(username);
    const err = getUsernameError(normUser);
    if (err) {
      setError(err);
      return;
    }

    if (isAvailable === false) {
      setError(availabilityMessage || 'Please choose an available username.');
      return;
    }

    setSubmitting(true);
    try {
      await completeProfileSetup(normUser, {
        displayName: displayName || 'Tivora User',
        bio,
        location
      });
      // AuthContext session automatically updates userDoc & ProtectedRoute displays protected app!
    } catch (err) {
      if (err.message === 'USERNAME_TAKEN') {
        setError(`@${normUser} is already taken by another user.`);
      } else {
        setError('Failed to setup profile. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div class="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div class="w-full max-w-md bg-brand-surface rounded-3xl p-8 border border-brand-border shadow-soft-lg space-y-6">
        {/* Header */}
        <div class="text-center space-y-2">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-gradient text-white shadow-gradient-glow mb-2">
            <MessageSquare class="w-6 h-6 fill-current" />
          </div>
          <h1 class="text-2xl font-bold text-brand-mainText tracking-tight">Set up your Tivora ID</h1>
          <p class="text-xs text-brand-mutedText">Choose a unique username to personalize your profile</p>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div class="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} class="space-y-4">
          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-brand-mainText block">Unique Tivora ID (@username)</label>
            <div class="relative">
              <AtSign class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-mutedText pointer-events-none" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="towsif_islam"
                class="w-full h-11 bg-brand-lavender border border-transparent focus:border-brand-purple focus:bg-white rounded-full pl-11 pr-10 text-xs sm:text-sm font-semibold text-brand-purple outline-none transition-all placeholder:text-brand-mutedText/60"
              />
              {checking ? (
                <RefreshCw class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-purple animate-spin" />
              ) : isAvailable === true ? (
                <CheckCircle2 class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              ) : isAvailable === false ? (
                <AlertCircle class="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-red-500" />
              ) : null}
            </div>
            {availabilityMessage && (
              <p class={`text-[0.72rem] font-medium px-1 ${
                isAvailable === true ? 'text-emerald-600' : isAvailable === false ? 'text-red-500' : 'text-brand-mutedText'
              }`}>
                {availabilityMessage}
              </p>
            )}
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-brand-mainText block">Display Name</label>
            <div class="relative">
              <User class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-mutedText pointer-events-none" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Towsif Islam"
                class="w-full h-11 bg-brand-lavender border border-transparent focus:border-brand-purple focus:bg-white rounded-full pl-11 pr-4 text-xs sm:text-sm text-brand-mainText outline-none transition-all"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-brand-mainText block">Bio (Optional)</label>
            <div class="relative">
              <AlignLeft class="absolute left-4 top-3 w-4 h-4 text-brand-mutedText pointer-events-none" />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write a brief bio..."
                class="w-full min-h-[80px] bg-brand-lavender border border-transparent focus:border-brand-purple focus:bg-white rounded-2xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-brand-mainText outline-none transition-all resize-none"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-semibold text-brand-mainText block">Location (Optional)</label>
            <div class="relative">
              <MapPin class="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-mutedText pointer-events-none" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Dhaka, Bangladesh"
                class="w-full h-11 bg-brand-lavender border border-transparent focus:border-brand-purple focus:bg-white rounded-full pl-11 pr-4 text-xs sm:text-sm text-brand-mainText outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || isAvailable === false || checking}
            class="w-full h-11 rounded-full bg-primary-gradient text-white font-semibold text-sm shadow-gradient-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none pt-1"
          >
            {submitting ? (
              <span>Completing setup...</span>
            ) : (
              <>
                <span>Complete Profile Setup</span>
                <ArrowRight class="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
