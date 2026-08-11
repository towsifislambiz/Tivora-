import React from 'react';
import { PhoneOff, Loader2 } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { useCall } from '../../context/CallContext';

export default function OutgoingCallScreen() {
  const { activeCall, callState, cancelCall } = useCall();

  if (!activeCall || (callState !== 'calling' && callState !== 'rejected' && callState !== 'busy' && callState !== 'missed')) {
    return null;
  }

  const isVideo = activeCall.type === 'video';
  const receiverName = activeCall.receiverDisplayName || 'Tivora User';
  const receiverUsername = activeCall.receiverUsername || 'user';
  const receiverAvatar = activeCall.receiverPhotoURL;

  // Terminal outcomes freeze the ring animation and switch the accent to red,
  // so a declined call doesn't keep looking like it's still dialling.
  const isResolved = ['rejected', 'busy', 'missed'].includes(callState);

  let statusText = `Calling ${receiverName}…`;
  if (callState === 'rejected') statusText = "Call Declined";
  if (callState === 'busy') statusText = "User is Busy";
  if (callState === 'missed') statusText = "No Answer";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-bg/80 backdrop-blur-xl animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={`Calling ${receiverName}`}
    >
      <div className="bg-brand-surface rounded-3xl border border-brand-border/80 shadow-glass w-full max-w-sm overflow-hidden p-8 text-center relative space-y-6 animate-scaleUp">
        {/* Calling Header */}
        <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border ${
          isResolved
            ? 'bg-red-500/15 text-red-500 border-red-500/35'
            : 'bg-brand-lavender text-brand-purple border-transparent'
        }`}>
          {!isResolved && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{isVideo ? 'Video' : 'Voice'} Call</span>
        </div>

        {/* Avatar with an outward ring pulse while the far end is still ringing.
            The outer flex row is required: an inline-level wrapper sits on the same
            line as the status badge above it, since space-y cannot break inlines. */}
        <div className="flex justify-center my-2">
          <div className="relative inline-flex items-center justify-center">
            {!isResolved && (
              <span aria-hidden="true" className="absolute inset-0 rounded-full bg-brand-purple/25 animate-callPulse" />
            )}
            <UserAvatar
              src={receiverAvatar}
              name={receiverName}
              size="w-24 h-24"
              className={`relative border-4 border-brand-surface shadow-soft-lg transition-opacity ${isResolved ? 'opacity-60' : ''}`}
            />
          </div>
        </div>

        {/* User Info & Dynamic Status */}
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-brand-mainText">{receiverName}</h3>
          <p className="text-xs text-brand-purple font-semibold">@{receiverUsername}</p>
          <p
            className={`text-sm font-bold pt-2 ${isResolved ? 'text-red-500' : 'text-brand-purple animate-pulse'}`}
            aria-live="polite"
          >
            {statusText}
          </p>
        </div>

        {/* Cancel Call Button */}
        <div className={`pt-4 flex justify-center transition-opacity ${isResolved ? 'opacity-40 pointer-events-none' : ''}`}>
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={cancelCall}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-soft-lg hover:scale-105 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface"
              aria-label="Cancel Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <span className="text-xs font-semibold text-brand-mutedText">Cancel</span>
          </div>
        </div>
      </div>
    </div>
  );
}
