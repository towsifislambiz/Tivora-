import { useState, useEffect, useRef, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    {
      urls: 'turn:openrelay.metered.ca:80',
      username: 'openrelay',
      credential: 'openrelay'
    },
    {
      urls: 'turn:openrelay.metered.ca:443',
      username: 'openrelay',
      credential: 'openrelay'
    },
    {
      urls: 'turns:openrelay.metered.ca:443?transport=tcp',
      username: 'openrelay',
      credential: 'openrelay'
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

  const processQueuedIceCandidates = useCallback(async () => {
    if (!pcRef.current || iceCandidatesQueueRef.current.length === 0) return;
    const queued = [...iceCandidatesQueueRef.current];
    iceCandidatesQueueRef.current = [];
    for (const candidateData of queued) {
      try {
        await pcRef.current.addIceCandidate(new RTCIceCandidate(candidateData));
      } catch (e) {
        console.warn('Queued ICE candidate notice:', e);
      }
    }
  }, []);

  const createPeerConnection = useCallback((onIceCandidate) => {
    if (pcRef.current) return pcRef.current;

    const pc = new RTCPeerConnection(ICE_SERVERS);

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
      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }

      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          track.enabled = true;
          const exists = remoteStreamRef.current.getTracks().some((t) => t.id === track.id);
          if (!exists) {
            remoteStreamRef.current.addTrack(track);
          }
        });
      }

      if (event.track) {
        event.track.enabled = true;
        const exists = remoteStreamRef.current.getTracks().some((t) => t.id === event.track.id);
        if (!exists) {
          remoteStreamRef.current.addTrack(event.track);
        }
      }

      const updatedStream = new MediaStream(remoteStreamRef.current.getTracks());
      remoteStreamRef.current = updatedStream;
      setRemoteStream(updatedStream);
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
        console.warn("Primary media constraint notice, falling back to basic media request:", constraintErr);
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
            sender.replaceTrack(track).catch(() => {});
          } else {
            pcRef.current.addTrack(track, stream);
          }
        });
      }

      return stream;
    } catch (err) {
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

  const createOffer = useCallback(async () => {
    if (!pcRef.current) throw new Error("PeerConnection not initialized");

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

    pcRef.current.getTransceivers().forEach((t) => {
      if (t.direction !== 'sendrecv') {
        try { t.direction = 'sendrecv'; } catch (e) {}
      }
    });

    const offer = await pcRef.current.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });

    await pcRef.current.setLocalDescription(offer);
    return { type: offer.type, sdp: offer.sdp };
  }, []);

  const handleOfferAndCreateAnswer = useCallback(async (offerSdp) => {
    if (!pcRef.current) throw new Error("PeerConnection not initialized");

    const sdpString = typeof offerSdp === 'string' ? offerSdp : offerSdp.sdp;
    const typeString = typeof offerSdp === 'object' && offerSdp.type ? offerSdp.type : 'offer';

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

    pcRef.current.getTransceivers().forEach((t) => {
      if (t.direction !== 'sendrecv') {
        try { t.direction = 'sendrecv'; } catch (e) {}
      }
    });

    const answer = await pcRef.current.createAnswer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true
    });

    await pcRef.current.setLocalDescription(answer);
    return { type: answer.type, sdp: answer.sdp };
  }, [processQueuedIceCandidates]);

  const handleAnswer = useCallback(async (answerSdp) => {
    if (!pcRef.current) return;
    if (pcRef.current.signalingState !== 'stable') {
      const sdpString = typeof answerSdp === 'string' ? answerSdp : answerSdp.sdp;
      const typeString = typeof answerSdp === 'object' && answerSdp.type ? answerSdp.type : 'answer';

      await pcRef.current.setRemoteDescription(new RTCSessionDescription({ type: typeString, sdp: sdpString }));
      hasRemoteDescriptionRef.current = true;
      await processQueuedIceCandidates();

      pcRef.current.getTransceivers().forEach((t) => {
        if (t.direction !== 'sendrecv') {
          try { t.direction = 'sendrecv'; } catch (e) {}
        }
      });
    }
  }, [processQueuedIceCandidates]);

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
      console.warn("addRemoteIceCandidate notice:", err);
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
      console.warn("switchCamera notice:", err);
    }
  }, [facingMode]);

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
