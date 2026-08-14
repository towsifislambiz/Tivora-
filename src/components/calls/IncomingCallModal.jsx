import React from 'react';
import { Phone, Video, PhoneOff, Check, Sparkles } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { useCall } from '../../context/CallContext';

export default function IncomingCallModal() {
  const { incomingCall, acceptCall, declineCall } = useCall();

  if (!incomingCall) return null;

  const isVideo = incomingCall.type === 'video';
  const callerName = incomingCall.callerDisplayName || 'Tivora User';
  const callerUsername = incomingCall.callerUsername || 'user';
  const callerAvatar = incomingCall.callerPhotoURL;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-mainText/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-brand-surface rounded-3xl border border-brand-border/80 shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center relative space-y-6 animate-scaleUp">
        {/* Top Floating Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-lavender text-brand-purple text-xs font-bold shadow-soft-xs">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>Incoming {isVideo ? 'Video' : 'Voice'} Call</span>
        </div>

        {/* Pulsating Caller Avatar */}
        <div className="relative inline-block my-2">
          <div className="absolute inset-0 rounded-full bg-brand-purple/20 animate-ping" />
          <div className="absolute -inset-3 rounded-full bg-primary-gradient/10 animate-pulse" />
          <UserAvatar
            src={callerAvatar}
            name={callerName}
            size="w-24 h-24"
            className="relative border-4 border-brand-surface shadow-soft-lg"
          />
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
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-soft-lg hover:scale-110 active:scale-95 transition-all"
              aria-label="Decline Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <span className="text-xs font-semibold text-brand-mutedText">Decline</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={acceptCall}
              className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-soft-lg hover:scale-110 active:scale-95 transition-all animate-bounce"
              aria-label="Accept Call"
            >
              {isVideo ? <Video className="w-6 h-6" /> : <Phone className="w-6 h-6" />}
            </button>
            <span className="text-xs font-semibold text-emerald-600">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
}
