import { useState, useEffect, useRef, useCallback } from 'react';

// Environment variable overrides with fallback TURN Relay
const TURN_USERNAME = import.meta.env.VITE_TURN_USERNAME || 'openrelay';
const TURN_CREDENTIAL = import.meta.env.VITE_TURN_CREDENTIAL || 'openrelay';
const TURN_URL = import.meta.env.VITE_TURN_URL || 'openrelay.metered.ca';

/**
 * Single Production-Ready RTC Configuration
 */
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },

    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:stun.cloudflare.com:3478' },

    {
      urls: `turn:${TURN_URL}:80`,
      username: TURN_USERNAME,
      credential: TURN_CREDENTIAL
    },
    {
      urls: `turn:${TURN_URL}:443`,
      username: TURN_USERNAME,
      credential: TURN_CREDENTIAL
    },
    {
      urls: `turns:${TURN_URL}:443?transport=tcp`,
      username: TURN_USERNAME,
      credential: TURN_CREDENTIAL
    }
  ],

  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require'
};

export function useWebRTC() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [connectionState, setConnectionState] = useState('idle');
  const [permissionError, setPermissionError] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const iceCandidatesQueueRef = useRef([]);
  const hasRemoteDescriptionRef = useRef(false);
  const processedCandidatesRef = useRef(new Set());
  const processedRemoteSdpRef = useRef(null);

  /**
   * Drain queued remote ICE candidates after setRemoteDescription()
   */
  const processQueuedIceCandidates = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc || !hasRemoteDescriptionRef.current) {
      return;
    }

    const queuedCandidates = [...iceCandidatesQueueRef.current];
    iceCandidatesQueueRef.current = [];

    for (const candidateData of queuedCandidates) {
      try {
        const candidate = candidateData instanceof RTCIceCandidate
          ? candidateData
          : new RTCIceCandidate(candidateData);
        await pc.addIceCandidate(candidate);
      } catch (error) {
        console.warn('[WebRTC] Failed to add queued ICE candidate:', error);
      }
    }
  }, []);

  /**
   * Initialize RTCPeerConnection using the single rtcConfig
   */
  const createPeerConnection = useCallback((onIceCandidate) => {
    if (pcRef.current) return pcRef.current;

    // Reset state for new call
    iceCandidatesQueueRef.current = [];
    hasRemoteDescriptionRef.current = false;

    const pc = new RTCPeerConnection(rtcConfig);

    // Attach existing local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        try {
          pc.addTrack(track, localStreamRef.current);
        } catch (e) {
          console.warn('[WebRTC] Track attach error:', e);
        }
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && onIceCandidate) {
        onIceCandidate(event.candidate);
      }
    };

    pc.ontrack = (event) => {
      console.log('[WebRTC] Track received:', event.track?.kind, event.track?.id);

      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }

      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          track.enabled = true;
          const exists = remoteStreamRef.current.getTracks().some((t) => t.id === track.id);
          if (!exists) remoteStreamRef.current.addTrack(track);
        });
      }

      if (event.track) {
        event.track.enabled = true;
        const exists = remoteStreamRef.current.getTracks().some((t) => t.id === event.track.id);
        if (!exists) remoteStreamRef.current.addTrack(event.track);
      }

      const updatedStream = new MediaStream(remoteStreamRef.current.getTracks());
      remoteStreamRef.current = updatedStream;
      setRemoteStream(updatedStream);
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      if (pc.connectionState) {
        setConnectionState(pc.connectionState);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setConnectionState('reconnecting');
        if (pc.iceConnectionState === 'failed') {
          try {
            pc.restartIce();
          } catch (err) {
            console.warn('[WebRTC] ICE restart attempt error:', err);
          }
        }
      } else if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionState('connected');
      }
    };

    pc.onsignalingstatechange = () => {
      console.log('[WebRTC] Signaling state:', pc.signalingState);
    };

    pcRef.current = pc;
    return pc;
  }, []);

  /**
   * Acquire local media stream (microphone / camera)
   */
  const initLocalMedia = useCallback(async (callType, customFacing = 'user') => {
    setPermissionError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const msg = "WebRTC media is not supported on this browser or device.";
      setPermissionError(msg);
      throw new Error(msg);
    }

    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: callType === 'video' ? {
        facingMode: customFacing,
        width: { ideal: 1280, max: 1280 },
        height: { ideal: 720, max: 720 },
        frameRate: { ideal: 30 }
      } : false
    };

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (constraintErr) {
        console.warn("[WebRTC] Primary media constraint notice, falling back:", constraintErr);
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video' ? { facingMode: customFacing } : false
        });
      }

      localStreamRef.current = stream;
      setLocalStream(stream);

      if (pcRef.current) {
        const senders = pcRef.current.getSenders();
        stream.getTracks().forEach((track) => {
          track.enabled = true;
          const sender = senders.find((s) => (s.track ? s.track.kind === track.kind : s.kind === track.kind));
          if (sender) {
            sender.replaceTrack(track).catch((e) => console.warn('[WebRTC] replaceTrack error:', e));
          } else {
            pcRef.current.addTrack(track, stream);
          }
        });
      }

      return stream;
    } catch (err) {
      console.error("[WebRTC] getUserMedia error:", err);
      let friendlyMsg = "Could not access camera or microphone.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        friendlyMsg = `${callType === 'video' ? 'Camera and Microphone' : 'Microphone'} access permission was denied. Please allow permissions in settings.`;
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        friendlyMsg = `No ${callType === 'video' ? 'camera/microphone' : 'microphone'} device found.`;
      }
      setPermissionError(friendlyMsg);
      throw new Error(friendlyMsg);
    }
  }, []);

  /**
   * Create SDP Offer (Caller)
   */
  const createOffer = useCallback(async () => {
    if (!pcRef.current) throw new Error("[WebRTC] PeerConnection not initialized");

    try {
      if (localStreamRef.current) {
        const senders = pcRef.current.getSenders();
        localStreamRef.current.getTracks().forEach((track) => {
          track.enabled = true;
          const sender = senders.find((s) => (s.track ? s.track.kind === track.kind : s.kind === track.kind));
          if (sender) {
            sender.replaceTrack(track).catch(() => {});
          } else {
            pcRef.current.addTrack(track, localStreamRef.current);
          }
        });
      }

      const offer = await pcRef.current.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await pcRef.current.setLocalDescription(offer);
      return { type: offer.type, sdp: offer.sdp };
    } catch (err) {
      console.error("[WebRTC] createOffer error:", err);
      throw err;
    }
  }, []);

  /**
   * Handle Remote Offer and Create SDP Answer (Receiver)
   */
  const handleOfferAndCreateAnswer = useCallback(async (offerSdp) => {
    if (!pcRef.current) throw new Error("[WebRTC] PeerConnection not initialized");

    try {
      const sdpString = typeof offerSdp === 'string' ? offerSdp : offerSdp?.sdp;
      const typeString = typeof offerSdp === 'object' && offerSdp?.type ? offerSdp.type : 'offer';

      await pcRef.current.setRemoteDescription(new RTCSessionDescription({ type: typeString, sdp: sdpString }));
      hasRemoteDescriptionRef.current = true;
      await processQueuedIceCandidates();

      if (localStreamRef.current) {
        const senders = pcRef.current.getSenders();
        localStreamRef.current.getTracks().forEach((track) => {
          track.enabled = true;
          const sender = senders.find((s) => (s.track ? s.track.kind === track.kind : s.kind === track.kind));
          if (sender) {
            sender.replaceTrack(track).catch(() => {});
          } else {
            pcRef.current.addTrack(track, localStreamRef.current);
          }
        });
      }

      const answer = await pcRef.current.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });

      await pcRef.current.setLocalDescription(answer);
      return { type: answer.type, sdp: answer.sdp };
    } catch (err) {
      console.error("[WebRTC] handleOfferAndCreateAnswer error:", err);
      throw err;
    }
  }, [processQueuedIceCandidates]);

  /**
   * Handle Remote Answer SDP (Caller)
   */
  const handleAnswer = useCallback(async (answerSdp) => {
    if (!pcRef.current) return;
    try {
      if (pcRef.current.signalingState !== 'stable') {
        const sdpString = typeof answerSdp === 'string' ? answerSdp : answerSdp?.sdp;
        const typeString = typeof answerSdp === 'object' && answerSdp?.type ? answerSdp.type : 'answer';

        await pcRef.current.setRemoteDescription(new RTCSessionDescription({ type: typeString, sdp: sdpString }));
        hasRemoteDescriptionRef.current = true;
        await processQueuedIceCandidates();
      }
    } catch (err) {
      console.error("[WebRTC] handleAnswer error:", err);
      throw err;
    }
  }, [processQueuedIceCandidates]);

  /**
   * Add Remote ICE Candidate with safe queueing
   */
  const addRemoteIceCandidate = useCallback(async (candidateData) => {
    if (!pcRef.current || !candidateData) return;

    const candStr = candidateData.candidate || JSON.stringify(candidateData);
    if (processedCandidatesRef.current.has(candStr)) return;
    processedCandidatesRef.current.add(candStr);

    if (!hasRemoteDescriptionRef.current) {
      iceCandidatesQueueRef.current.push(candidateData);
      return;
    }

    try {
      const candidate = candidateData instanceof RTCIceCandidate
        ? candidateData
        : new RTCIceCandidate(candidateData);
      await pcRef.current.addIceCandidate(candidate);
    } catch (error) {
      console.warn('[WebRTC] Failed to add remote ICE candidate:', error);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        const nextState = !audioTracks[0].enabled;
        audioTracks.forEach((t) => (t.enabled = nextState));
        setIsMuted(!nextState);
      }
    }
  }, []);

  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextState = !videoTracks[0].enabled;
        videoTracks.forEach((t) => (t.enabled = nextState));
        setIsVideoOff(!nextState);
      }
    }
  }, []);

  const switchCamera = useCallback(async (callType) => {
    if (callType !== 'video' || !localStreamRef.current) return;
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);

    const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
    if (oldVideoTrack) oldVideoTrack.stop();

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      const newTrack = newStream.getVideoTracks()[0];

      if (pcRef.current && oldVideoTrack) {
        const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(newTrack);
      }

      localStreamRef.current.removeTrack(oldVideoTrack);
      localStreamRef.current.addTrack(newTrack);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    } catch (err) {
      console.warn("[WebRTC] switchCamera error:", err);
    }
  }, [facingMode]);

  /**
   * Full cleanup when call ends
   */
  const cleanupMedia = useCallback(() => {
    console.log('[WebRTC] Performing full media & peer connection cleanup');
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach((track) => track.stop());
      remoteStreamRef.current = null;
      setRemoteStream(null);
    }

    if (pcRef.current) {
      pcRef.current.ontrack = null;
      pcRef.current.onicecandidate = null;
      pcRef.current.onconnectionstatechange = null;
      pcRef.current.oniceconnectionstatechange = null;
      pcRef.current.onsignalingstatechange = null;
      pcRef.current.close();
      pcRef.current = null;
    }

    setIsMuted(false);
    setIsVideoOff(false);
    setConnectionState('closed');
    setPermissionError(null);
    iceCandidatesQueueRef.current = [];
    hasRemoteDescriptionRef.current = false;
    processedCandidatesRef.current.clear();
    processedRemoteSdpRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      cleanupMedia();
    };
  }, [cleanupMedia]);

  return {
    localStream,
    remoteStream,
    isMuted,
    isVideoOff,
    facingMode,
    connectionState,
    permissionError,
    createPeerConnection,
    initLocalMedia,
    createOffer,
    handleOfferAndCreateAnswer,
    handleAnswer,
    addRemoteIceCandidate,
    toggleMute,
    toggleVideo,
    switchCamera,
    cleanupMedia
  };
}
