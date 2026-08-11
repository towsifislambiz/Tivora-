import React, { useEffect } from 'react';
import { Phone, Video, PhoneOff, Sparkles } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { useCall } from '../../context/CallContext';

export default function IncomingCallModal() {
  const { incomingCall, acceptCall, declineCall } = useCall();
  const callId = incomingCall?.callId;

  // Haptic ring on mobile — the visual-only modal was easy to miss when the
  // screen was in a pocket. Silently unsupported on desktop Safari/Firefox.
  useEffect(() => {
    if (!callId || typeof navigator === 'undefined' || !navigator.vibrate) return;
    const pattern = [400, 200, 400, 1000];
    navigator.vibrate(pattern);
    const interval = setInterval(() => navigator.vibrate(pattern), 2000);
    return () => {
      clearInterval(interval);
      navigator.vibrate(0);
    };
  }, [callId]);

  // Escape declines, matching every other dismissible surface in the app.
  useEffect(() => {
    if (!callId) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') declineCall();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [callId, declineCall]);

  if (!incomingCall) return null;

  const isVideo = incomingCall.type === 'video';
  const callerName = incomingCall.callerDisplayName || 'Tivora User';
  const callerUsername = incomingCall.callerUsername || 'user';
  const callerAvatar = incomingCall.callerPhotoURL;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-bg/80 backdrop-blur-xl animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={`Incoming ${isVideo ? 'video' : 'voice'} call from ${callerName}`}
    >
      <div className="bg-brand-surface rounded-3xl border border-brand-border/80 shadow-glass w-full max-w-sm overflow-hidden p-8 text-center relative space-y-6 animate-scaleUp">
        {/* Top Floating Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-lavender text-brand-purple text-xs font-bold shadow-soft-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Incoming {isVideo ? 'Video' : 'Voice'} Call</span>
        </div>

        {/* Caller avatar with a staggered double halo that reads as a ring cadence.
            The outer flex row is required: an inline-level wrapper sits on the same
            line as the status badge above it, since space-y cannot break inlines. */}
        <div className="flex justify-center my-2">
          <div className="relative inline-flex items-center justify-center">
            <span aria-hidden="true" className="absolute inset-0 rounded-full bg-brand-purple/30 animate-callPulse" />
            <span
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-brand-purple/20 animate-callPulse"
              style={{ animationDelay: '0.9s' }}
            />
            <UserAvatar
              src={callerAvatar}
              name={callerName}
              size="w-24 h-24"
              className="relative border-4 border-brand-surface shadow-soft-lg"
            />
          </div>
        </div>

        {/* Caller Info */}
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-brand-mainText">{callerName}</h3>
          <p className="text-xs text-brand-purple font-semibold">@{callerUsername}</p>
          <p className="text-xs text-brand-mutedText font-medium pt-1 animate-pulse">
            Tivora {isVideo ? 'Video' : 'Voice'} Call...
          </p>
        </div>

        {/* Accept / Decline Action Buttons */}
        <div className="flex items-center justify-center gap-6 pt-4">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={declineCall}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-soft-lg hover:scale-110 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface"
              aria-label="Decline Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <span className="text-xs font-semibold text-brand-mutedText">Decline</span>
          </div>

          {/* Accept Button — autofocused so Enter answers straight away */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={acceptCall}
              autoFocus
              className="w-14 h-14 rounded-full bg-brand-success hover:brightness-110 text-white flex items-center justify-center shadow-soft-lg hover:scale-110 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-success focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface"
              aria-label="Accept Call"
            >
              {isVideo ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
            </button>
            <span className="text-xs font-semibold text-brand-success">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
}
