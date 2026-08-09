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
  }, [localStream]);

  // Bind Remote Video + AudioContext Anti-Echo Pipeline
  useEffect(() => {
    if (!remoteStream) return;

    // Bind video element (muted — AudioContext handles audio output)
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.muted = true;
      remoteVideoRef.current.play().catch(() => {});
    }

    let animationFrameId = null;

    // Build AudioContext anti-echo & Noise Gate processing pipeline for remote audio
    const setupAudio = async () => {
      try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') await audioCtx.resume();

        const sourceNode = audioCtx.createMediaStreamSource(remoteStream);

        // DynamicsCompressor — kills echo bursts & sudden loudness spikes
        const compressor = audioCtx.createDynamicsCompressor();
        compressor.threshold.setValueAtTime(-24, audioCtx.currentTime);
        compressor.knee.setValueAtTime(30, audioCtx.currentTime);
        compressor.ratio.setValueAtTime(12, audioCtx.currentTime);
        compressor.attack.setValueAtTime(0.003, audioCtx.currentTime);
        compressor.release.setValueAtTime(0.25, audioCtx.currentTime);

        // AnalyserNode for Real-Time Noise Gate Threshold Detection
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        const pcmData = new Float32Array(analyser.fftSize);

        // Gain — Noise Gate output
        const gainNode = audioCtx.createGain();
        gainNode.gain.setValueAtTime(1.0, audioCtx.currentTime);

        // Chain: remote stream → compressor → analyser → gain → speakers
        sourceNode.connect(compressor);
        compressor.connect(analyser);
        analyser.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // Noise Gate Loop: mutes audio during silence/ambient hiss, unmutes during human speech
        const NOISE_THRESHOLD = 0.012; // RMS Threshold for voice vs background room hiss
        const checkNoiseGate = () => {
          analyser.getFloatTimeDomainData(pcmData);
          let sumSquares = 0;
          for (let i = 0; i < pcmData.length; i++) {
            sumSquares += pcmData[i] * pcmData[i];
          }
          const rms = Math.sqrt(sumSquares / pcmData.length);
          const targetGain = rms > NOISE_THRESHOLD ? 1.0 : 0.0;
          gainNode.gain.setTargetAtTime(targetGain, audioCtx.currentTime, 0.05);

          animationFrameId = requestAnimationFrame(checkNoiseGate);
        };

        checkNoiseGate();

        audioCtxRef.current = audioCtx;
        sourceNodeRef.current = sourceNode;
      } catch (err) {
        // Fallback: let video element handle audio directly
        console.warn('VideoCall AudioContext fallback:', err);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.muted = false;
          remoteVideoRef.current.volume = 1.0;
          const tryPlay = () => {
            remoteVideoRef.current?.play().catch(() => {});
            document.removeEventListener('click', tryPlay);
            document.removeEventListener('touchstart', tryPlay);
          };
          remoteVideoRef.current.play().catch(() => {
            document.addEventListener('click', tryPlay);
            document.addEventListener('touchstart', tryPlay);
          });
        }
      }
    };

    setupAudio();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (sourceNodeRef.current) { sourceNodeRef.current.disconnect(); sourceNodeRef.current = null; }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [remoteStream]);

  // Sync fullscreen state with browser fullscreen API
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
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
          muted
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
