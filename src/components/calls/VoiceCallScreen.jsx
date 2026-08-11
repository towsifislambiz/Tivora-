import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, PhoneOff, ShieldCheck, Loader2, WifiOff } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { useCall } from '../../context/CallContext';
import { useAuth } from '../../hooks/useAuth';

export default function VoiceCallScreen() {
  const { activeCall, callState, callDuration, webRTC, endActiveCall } = useCall();
  const { currentUser } = useAuth();
  const remoteAudioRef = useRef(null);

  const { isMuted, toggleMute, remoteStream, connectionState } = webRTC;

  // Guaranteed High-Fidelity Remote Audio Playback with Autoplay Policy Unlock
  useEffect(() => {
    const audioEl = remoteAudioRef.current;
    if (!audioEl || !remoteStream) return;

    // Attach stream directly to audio element (unmuted, full volume)
    if (audioEl.srcObject !== remoteStream) {
      audioEl.srcObject = remoteStream;
    }
    audioEl.muted = false;
    audioEl.volume = 1.0;

    const playAudio = async () => {
      try {
        await audioEl.play();
      } catch (err) {
        console.warn("Audio autoplay blocked by browser policy, attaching unlock listener:", err);
        const unlock = () => {
          if (audioEl) {
            audioEl.play().catch(() => {});
          }
          document.removeEventListener('click', unlock);
          document.removeEventListener('touchstart', unlock);
        };
        document.addEventListener('click', unlock);
        document.addEventListener('touchstart', unlock);
      }
    };

    playAudio();
  }, [remoteStream]);

  // 'ended' is included so the call resolves visibly instead of the whole screen
  // vanishing the instant someone hangs up. CallContext holds that state ~1.5s.
  const visibleStates = ['connecting', 'connected', 'reconnecting', 'ended'];
  if (!activeCall || activeCall.type !== 'voice' || !visibleStates.includes(callState)) {
    return null;
  }

  // The partner is whichever side of the call we are NOT. Falling back to the
  // receiver fields unconditionally showed the receiver their own name and avatar.
  const isCaller = currentUser?.uid === activeCall.callerId;
  const partnerName = (isCaller ? activeCall.receiverDisplayName : activeCall.callerDisplayName) || 'Tivora User';
  const partnerUsername = (isCaller ? activeCall.receiverUsername : activeCall.callerUsername) || 'user';
  const partnerAvatar = isCaller ? activeCall.receiverPhotoURL : activeCall.callerPhotoURL;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Derive the real transport status. The old UI hardcoded "Voice Connected"
  // even while the peer connection was still negotiating or had dropped out.
  const isEnded = callState === 'ended';
  const isReconnecting = !isEnded && (callState === 'reconnecting' || connectionState === 'reconnecting');
  const isNegotiating = !isEnded && !isReconnecting && (callState === 'connecting' || !remoteStream);

  let status = { label: 'Voice Connected', tone: 'live', Icon: null };
  if (isEnded) status = { label: 'Call Ended', tone: 'over', Icon: PhoneOff };
  else if (isReconnecting) status = { label: 'Reconnecting…', tone: 'warn', Icon: WifiOff };
  else if (isNegotiating) status = { label: 'Connecting…', tone: 'warn', Icon: Loader2 };

  const toneStyles = {
    live: 'bg-brand-success/15 text-brand-success border-brand-success/35',
    warn: 'bg-amber-500/15 text-amber-500 border-amber-500/35',
    over: 'bg-red-500/15 text-red-500 border-red-500/35',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-bg/80 backdrop-blur-xl animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label={`Voice call with ${partnerName}`}
    >
      <div className="bg-brand-surface rounded-3xl border border-brand-border/80 shadow-glass w-full max-w-sm overflow-hidden p-8 text-center relative space-y-6 animate-scaleUp">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${toneStyles[status.tone]}`}>
            {status.Icon
              ? <status.Icon className={`w-3.5 h-3.5 ${status.Icon === Loader2 ? 'animate-spin' : ''}`} />
              : <span className="w-2 h-2 rounded-full bg-brand-success animate-pulse" />}
            <span>{status.label}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-brand-mutedText font-semibold">
            <ShieldCheck className="w-4 h-4 text-brand-success" />
            <span>End-to-End</span>
          </div>
        </div>

        {/* Big User Avatar — the halo only breathes while the call is actually live */}
        <div className="flex justify-center my-4">
          <div className="relative inline-flex items-center justify-center">
            {!isEnded && (
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-brand-purple/25 animate-callPulse"
              />
            )}
            <UserAvatar
              src={partnerAvatar}
              name={partnerName}
              size="w-28 h-28"
              className={`relative border-4 border-brand-surface shadow-soft-lg transition-opacity ${isEnded ? 'opacity-60' : ''}`}
            />
          </div>
        </div>

        {/* User Info & Live Call Timer */}
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-brand-mainText">{partnerName}</h3>
          <p className="text-xs text-brand-purple font-semibold">@{partnerUsername}</p>
          <p
            className="text-lg font-mono font-bold text-brand-mainText pt-2 tabular-nums"
            aria-live="polite"
          >
            {isNegotiating && callDuration === 0 ? '--:--' : formatDuration(callDuration)}
          </p>
        </div>

        {/* Control Toolbar (Mute, Audio, End Call) */}
        <div className={`flex items-center justify-center gap-5 pt-4 transition-opacity ${isEnded ? 'opacity-40 pointer-events-none' : ''}`}>
          {/* Mute Microphone */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={toggleMute}
              aria-pressed={isMuted}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-soft-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-purple focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface ${
                isMuted
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-brand-lavender text-brand-purple hover:bg-brand-purple hover:text-white'
              }`}
              title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            <span className="text-[0.7rem] font-semibold text-brand-mutedText">{isMuted ? 'Muted' : 'Mute'}</span>
          </div>

          {/* End Call Button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={endActiveCall}
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-soft-lg hover:scale-105 active:scale-95 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-surface"
              aria-label="End Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <span className="text-[0.7rem] font-semibold text-brand-mutedText">End Call</span>
          </div>

          {/* Speaker / Volume Indicator */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-12 h-12 rounded-full bg-brand-lavender text-brand-purple flex items-center justify-center shadow-soft-md">
              <Volume2 className="w-5 h-5" />
            </div>
            <span className="text-[0.7rem] font-semibold text-brand-mutedText">Audio</span>
          </div>
        </div>
        {/* Hidden Zero-Latency Remote Voice Audio Element */}
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
      </div>
    </div>
  );
}
