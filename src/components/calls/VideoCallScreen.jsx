import React, { useEffect, useRef, useState } from 'react';
import { 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  RefreshCw, 
  Maximize, 
  Minimize, 
  PhoneOff
} from 'lucide-react';
import { useCall } from '../../context/CallContext';

export default function VideoCallScreen() {
  const { activeCall, callState, callDuration, webRTC, endActiveCall } = useCall();

  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceNodeRef = useRef(null);

  const { localStream, remoteStream, isMuted, isVideoOff, facingMode, toggleMute, toggleVideo, switchCamera } = webRTC;

  // Bind Local Video Stream (always muted — no echo from own mic)
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.muted = true;
      localVideoRef.current.play().catch(() => {});
    }
  }, [localStream, callState]);

  // Bind Remote Video & Audio with Autoplay Policy Unlock
  useEffect(() => {
    const videoEl = remoteVideoRef.current;
    if (!videoEl || !remoteStream) return;

    if (videoEl.srcObject !== remoteStream) {
      videoEl.srcObject = remoteStream;
    }
    videoEl.muted = false;
    videoEl.volume = 1.0;

    const playVideo = async () => {
      try {
        await videoEl.play();
      } catch (err) {
        console.warn("Video/Audio autoplay blocked by browser policy, attaching unlock listener:", err);
        const unlock = () => {
          if (videoEl) {
            videoEl.play().catch(() => {});
          }
          document.removeEventListener('click', unlock);
          document.removeEventListener('touchstart', unlock);
        };
        document.addEventListener('click', unlock);
        document.addEventListener('touchstart', unlock);
      }
    };

    playVideo();
  }, [remoteStream]);

  // Sync fullscreen state & auto-resume video playback when returning from background app switch
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (remoteVideoRef.current) remoteVideoRef.current.play().catch(() => {});
        if (localVideoRef.current) localVideoRef.current.play().catch(() => {});
      }
    };

    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  if (!activeCall || activeCall.type !== 'video' || (callState !== 'connected' && callState !== 'connecting' && callState !== 'reconnecting')) {
    return null;
  }

  const partnerName = activeCall.receiverDisplayName || activeCall.callerDisplayName || 'Tivora User';

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between overflow-hidden animate-fadeIn"
    >
      {/* ── Main Remote Video View ── */}
      <div className="absolute inset-0 w-full h-full bg-slate-900 flex items-center justify-center">
        {/* Always keep video in DOM so ref binding is stable */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${!remoteStream ? 'hidden' : ''}`}
        />
        {!remoteStream && (
          <div className="flex flex-col items-center justify-center text-white/70 space-y-3">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center animate-pulse">
              <VideoIcon className="w-8 h-8 text-brand-purple" />
            </div>
            <p className="text-sm font-semibold">Connecting video...</p>
          </div>
        )}
      </div>

      {/* ── Top Header Controls Overlay ── */}
      <div className="relative z-10 w-full p-4 flex items-center justify-between bg-gradient-to-b from-black/70 via-black/30 to-transparent text-white">
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-emerald-500/20 backdrop-blur-md border border-emerald-400/40 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>{callState === 'reconnecting' ? 'Reconnecting...' : 'Live'}</span>
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">{partnerName}</h3>
            <p className="text-xs font-mono opacity-80">{formatDuration(callDuration)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-full bg-white/15 hover:bg-white/30 backdrop-blur-md text-white transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ── Floating Local Video Preview ── */}
      <div className="absolute top-20 right-4 z-20 w-28 sm:w-36 h-40 sm:h-48 rounded-2xl overflow-hidden border-2 border-white/40 shadow-2xl bg-black">
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-full object-cover ${facingMode === 'user' ? 'transform -scale-x-100' : ''} ${isVideoOff ? 'hidden' : ''}`}
        />
        {isVideoOff && (
          <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center text-white/50 text-xs">
            <VideoOff className="w-6 h-6 mb-1" />
            <span>Camera Off</span>
          </div>
        )}
      </div>

      {/* ── Floating Bottom Toolbar Overlay ── */}
      <div className="relative z-10 w-full pb-8 pt-4 px-4 flex justify-center bg-gradient-to-t from-black/80 via-black/40 to-transparent pb-safe">
        <div className="flex items-center gap-4 bg-white/20 backdrop-blur-2xl px-6 py-3.5 rounded-full border border-white/30 shadow-2xl">
          {/* Mute Microphone */}
          <button
            onClick={toggleMute}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all touch-manipulation ${
              isMuted ? 'bg-red-500 text-white shadow-soft-lg' : 'bg-white/20 hover:bg-white/40 text-white'
            }`}
            title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Camera On / Off */}
          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all touch-manipulation ${
              isVideoOff ? 'bg-red-500 text-white shadow-soft-lg' : 'bg-white/20 hover:bg-white/40 text-white'
            }`}
            title={isVideoOff ? "Turn Camera On" : "Turn Camera Off"}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
          </button>

          {/* Switch Camera Mobile */}
          <button
            onClick={() => switchCamera('video')}
            className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all touch-manipulation"
            title="Switch Camera"
          >
            <RefreshCw className="w-6 h-6" />
          </button>

          {/* End Call Button */}
          <button
            onClick={endActiveCall}
            className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-soft-lg hover:scale-110 active:scale-95 transition-all touch-manipulation"
            title="End Video Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
