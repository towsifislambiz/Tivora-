import { useState, useEffect, useRef, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10
};

export function useWebRTC() {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [connectionState, setConnectionState] = useState('idle'); // 'idle' | 'new' | 'connecting' | 'connected' | 'reconnecting' | 'disconnected' | 'failed' | 'closed'
  const [permissionError, setPermissionError] = useState(null);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const iceCandidatesQueueRef = useRef([]); // Buffer for early ICE candidates
  const hasRemoteDescriptionRef = useRef(false);

  // Drain queued ICE candidates after remote description is set
  const processQueuedIceCandidates = useCallback(async () => {
    if (!pcRef.current || iceCandidatesQueueRef.current.length === 0) return;
    const queued = [...iceCandidatesQueueRef.current];
    iceCandidatesQueueRef.current = [];
    for (const candidateData of queued) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidateData));
      } catch (e) {
        console.warn('Queued ICE add error:', e);
      }
    }
  }, []);

  // Initialize RTCPeerConnection
  const createPeerConnection = useCallback((onIceCandidate) => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);

    // CRITICAL WEBRTC AUDIO FIX: Attach local media tracks if stream already initialized
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && onIceCandidate) {
        onIceCandidate(event.candidate);
      }
    };

    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        setRemoteStream(event.streams[0]);
      } else {
        if (!remoteStreamRef.current) {
          remoteStreamRef.current = new MediaStream();
        }
        remoteStreamRef.current.addTrack(event.track);
        setRemoteStream(new MediaStream(remoteStreamRef.current.getTracks()));
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
    };

    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'failed') {
        setConnectionState('reconnecting');
      } else if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
        setConnectionState('connected');
      }
    };

    pcRef.current = pc;
    return pc;
  }, []);

  // Request camera / microphone media with Zero-Latency High-Fidelity Constraints
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
      video: callType === 'video' ? { facingMode: customFacing } : false
    };

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (constraintErr) {
        console.warn("Primary audio/video constraints failed, falling back to basic media request:", constraintErr);
        // Fallback for hardware devices that reject specific audio constraint objects
        stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: callType === 'video' ? { facingMode: customFacing } : false
        });
      }

      localStreamRef.current = stream;
      setLocalStream(stream);

      // Add tracks to PeerConnection if already created
      if (pcRef.current) {
        const senders = pcRef.current.getSenders();
        stream.getTracks().forEach((track) => {
          const hasTrack = senders.some((s) => s.track && (s.track.id === track.id || s.track.kind === track.kind));
          if (!hasTrack) {
            pcRef.current.addTrack(track, stream);
          }
        });
      }

      return stream;
    } catch (err) {
      let friendlyMsg = "Could not access camera or microphone.";
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        friendlyMsg = `${callType === 'video' ? 'Camera and Microphone' : 'Microphone'} access permission was denied. Please allow permissions in browser settings.`;
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        friendlyMsg = `No ${callType === 'video' ? 'camera/microphone' : 'microphone'} device found.`;
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        friendlyMsg = "Camera or microphone is already in use by another application.";
      }
      setPermissionError(friendlyMsg);
      throw new Error(friendlyMsg);
    }
  }, []);

  // Generate SDP Offer
  const createOffer = useCallback(async () => {
    if (!pcRef.current) throw new Error("PeerConnection not initialized");
    const offer = await pcRef.current.createOffer();
    await pcRef.current.setLocalDescription(offer);
    return offer;
  }, []);

  // Receive Offer & Generate SDP Answer
  const handleOfferAndCreateAnswer = useCallback(async (offerSdp) => {
    if (!pcRef.current) throw new Error("PeerConnection not initialized");
    await pcRef.current.setRemoteDescription(new RTCSessionDescription(offerSdp));
    hasRemoteDescriptionRef.current = true;
    await processQueuedIceCandidates();
    const answer = await pcRef.current.createAnswer();
    await pcRef.current.setLocalDescription(answer);
    return answer;
  }, [processQueuedIceCandidates]);

  // Receive Answer
  const handleAnswer = useCallback(async (answerSdp) => {
    if (!pcRef.current) return;
    if (pcRef.current.signalingState !== 'stable') {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answerSdp));
      hasRemoteDescriptionRef.current = true;
      await processQueuedIceCandidates();
    }
  }, [processQueuedIceCandidates]);

  // Add Remote ICE Candidate (queue if remote description not yet set)
  const addRemoteIceCandidate = useCallback(async (candidateData) => {
    if (!pcRef.current || !candidateData) return;
    if (!hasRemoteDescriptionRef.current) {
      iceCandidatesQueueRef.current.push(candidateData);
      return;
    }
    try {
      const candidate = new RTCIceCandidate(candidateData);
      await pcRef.current.addIceCandidate(candidate);
    } catch (err) {
      console.warn("addRemoteIceCandidate error:", err);
    }
  }, []);

  // Toggle Microphone Mute
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

  // Toggle Camera On / Off
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

  // Switch Camera (Mobile)
  const switchCamera = useCallback(async (callType) => {
    if (callType !== 'video' || !localStreamRef.current) return;
    const nextFacing = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextFacing);

    // Stop current video track
    const oldVideoTrack = localStreamRef.current.getVideoTracks()[0];
    if (oldVideoTrack) oldVideoTrack.stop();

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing }
      });
      const newTrack = newStream.getVideoTracks()[0];

      if (pcRef.current && oldVideoTrack) {
        const sender = pcRef.current.getSenders().find((s) => s.track && s.track.kind === 'video');
        if (sender) sender.replaceTrack(newTrack);
      }

      // Replace in localStreamRef
      localStreamRef.current.removeTrack(oldVideoTrack);
      localStreamRef.current.addTrack(newTrack);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    } catch (err) {
      console.warn("switchCamera error:", err);
    }
  }, [facingMode]);

  // Complete Media & Connection Cleanup
  const cleanupMedia = useCallback(() => {
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
      pcRef.current.close();
      pcRef.current = null;
    }

    setIsMuted(false);
    setIsVideoOff(false);
    setConnectionState('closed');
    setPermissionError(null);
    iceCandidatesQueueRef.current = [];
    hasRemoteDescriptionRef.current = false;
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
