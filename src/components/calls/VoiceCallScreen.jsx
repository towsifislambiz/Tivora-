import React, { useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, PhoneOff, ShieldCheck } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { useCall } from '../../context/CallContext';

export default function VoiceCallScreen() {
  const { activeCall, callState, callDuration, webRTC, endActiveCall } = useCall();
  const remoteAudioRef = useRef(null);

  const { isMuted, toggleMute, remoteStream } = webRTC;

  // Bind Remote Audio Stream Stable & Play
  useEffect(() => {
    const audioEl = remoteAudioRef.current;
    if (!audioEl || !remoteStream) return;

    if (audioEl.srcObject !== remoteStream) {
      audioEl.srcObject = remoteStream;
      audioEl.muted = false;
      audioEl.volume = 1.0;

      const playAudio = async () => {
        try {
          await audioEl.play();
        } catch (err) {
          console.warn("Audio autoplay policy notice, attaching user interaction listener:", err);
          const unlock = () => {
            if (audioEl) audioEl.play().catch(() => {});
            document.removeEventListener('click', unlock);
            document.removeEventListener('touchstart', unlock);
          };
          document.addEventListener('click', unlock);
          document.addEventListener('touchstart', unlock);
        }
      };

      playAudio();
    }
  }, [remoteStream]);

  if (!activeCall || activeCall.type !== 'voice' || (callState !== 'connected' && callState !== 'connecting' && callState !== 'reconnecting')) {
    return null;
  }

  const partnerName = activeCall.receiverDisplayName || activeCall.callerDisplayName || 'Tivora User';
  const partnerUsername = activeCall.receiverUsername || activeCall.callerUsername || 'user';
  const partnerAvatar = activeCall.receiverPhotoURL || activeCall.callerPhotoURL;

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-mainText/75 backdrop-blur-lg animate-fadeIn">
      <div className="bg-brand-surface rounded-3xl border border-brand-border/80 shadow-2xl w-full max-w-sm overflow-hidden p-8 text-center relative space-y-6 animate-scaleUp">
        {/* Top Header Badge */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-xs font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>{callState === 'reconnecting' ? 'Reconnecting...' : 'Voice Connected'}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-brand-mutedText font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>End-to-End</span>
          </div>
        </div>

        {/* Big User Avatar */}
        <div className="relative inline-block my-4">
          <div className="absolute -inset-3 rounded-full bg-primary-gradient/10 animate-pulse" />
          <UserAvatar
            src={partnerAvatar}
            name={partnerName}
            size="w-28 h-28"
            className="relative border-4 border-brand-surface shadow-soft-lg"
          />
        </div>

        {/* User Info & Live Call Timer */}
        <div className="space-y-1">
          <h3 className="text-xl font-extrabold text-brand-mainText">{partnerName}</h3>
          <p className="text-xs text-brand-purple font-semibold">@{partnerUsername}</p>
          <p className="text-lg font-mono font-bold text-brand-mainText pt-2">
            {formatDuration(callDuration)}
          </p>
        </div>

        {/* Control Toolbar (Mute, Audio, End Call) */}
        <div className="flex items-center justify-center gap-5 pt-4">
          {/* Mute Microphone */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={toggleMute}
              className={`w-12 h-12 rounded-full flex items-center justify-center shadow-soft-md transition-all ${
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
              className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-soft-lg hover:scale-105 active:scale-95 transition-all"
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

        {/* Hidden Remote Voice Audio Element */}
        <audio ref={remoteAudioRef} autoPlay playsInline className="hidden" />
      </div>
    </div>
  );
}
