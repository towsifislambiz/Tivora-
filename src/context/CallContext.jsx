import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useWebRTC } from '../hooks/useWebRTC';
import { 
  createCallDoc, 
  subscribeToIncomingCalls, 
  subscribeToCallDoc, 
  sendCallOffer, 
  sendCallAnswer, 
  addIceCandidate, 
  subscribeToIceCandidates, 
  updateCallStatus, 
  recordCallHistory 
} from '../firebase/callService';
import { areFriends } from '../firebase/messageService';
import { getFriendshipStatus } from '../firebase/friendService';

const CallContext = createContext(null);

export function CallProvider({ children }) {
  const { currentUser, userDoc } = useAuth();
  const webRTC = useWebRTC();

  const [activeCall, setActiveCall] = useState(null); // Active call document data
  const [incomingCall, setIncomingCall] = useState(null); // Incoming call document data
  const [callState, setCallState] = useState('idle'); // 'idle' | 'calling' | 'ringing' | 'connecting' | 'connected' | 'reconnecting' | 'rejected' | 'cancelled' | 'missed' | 'busy' | 'failed' | 'ended'
  const [callDuration, setCallDuration] = useState(0);

  const activeCallRef = useRef(null);
  const callStateRef = useRef('idle');
  const timerRef = useRef(null);
  const callingTimeoutRef = useRef(null);

  activeCallRef.current = activeCall;
  callStateRef.current = callState;

  // Unsubscribe refs
  const unsubCallDocRef = useRef(null);
  const unsubIceCandidatesRef = useRef(null);

  // 1. Listen for global incoming calls across the entire app
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = subscribeToIncomingCalls(currentUser.uid, async (callData) => {
      // Security & Eligibility Check: Are they friends and not blocked?
      const friendConfirmed = await areFriends(currentUser.uid, callData.callerId);
      if (!friendConfirmed) return; // Ignore call if not friends

      // Busy Protection: If already on another call, reject with 'busy'
      if (callStateRef.current !== 'idle' || activeCallRef.current) {
        await updateCallStatus(callData.callId, 'busy');
        await recordCallHistory({ ...callData, status: 'busy' });
        return;
      }

      setIncomingCall(callData);
      setCallState('ringing');
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Call Duration Timer
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Clean up all signaling listeners and timers
  const resetCallState = useCallback(() => {
    if (unsubCallDocRef.current) {
      unsubCallDocRef.current();
      unsubCallDocRef.current = null;
    }
    if (unsubIceCandidatesRef.current) {
      unsubIceCandidatesRef.current();
      unsubIceCandidatesRef.current = null;
    }
    if (callingTimeoutRef.current) {
      clearTimeout(callingTimeoutRef.current);
      callingTimeoutRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    webRTC.cleanupMedia();
    setActiveCall(null);
    setIncomingCall(null);
    setCallState('idle');
    setCallDuration(0);
  }, [webRTC]);

  // 2. Start Outgoing Call (Caller Flow)
  const startCall = useCallback(async (receiver, type = 'voice') => {
    const receiverUid = receiver?.uid || receiver?.id || receiver?.partner?.uid || receiver?.partner?.id;

    if (!currentUser?.uid || !receiverUid) {
      throw new Error("Could not find valid recipient UID to start call.");
    }
    if (callState !== 'idle') return;

    // Check friendship & block status
    const isFriend = await areFriends(currentUser.uid, receiverUid);
    if (!isFriend) {
      throw new Error("You can only call users who are on your friends list.");
    }

    const callerData = {
      uid: currentUser.uid,
      displayName: userDoc?.displayName || currentUser.displayName || 'Tivora User',
      username: userDoc?.username || userDoc?.profileId || 'user',
      photoURL: userDoc?.photoURL || currentUser.photoURL || ''
    };

    const receiverData = {
      uid: receiverUid,
      displayName: receiver.displayName || receiver.name || receiver.partner?.displayName || 'Tivora User',
      username: receiver.username || receiver.profileId || receiver.partner?.username || 'user',
      photoURL: receiver.photoURL || receiver.avatar || receiver.partner?.photoURL || ''
    };

    setCallState('calling');

    try {
      // 1. Get User Media Tracks
      await webRTC.initLocalMedia(type, 'user');

      // 2. Create Call Document in Firestore
      const newCallData = await createCallDoc(callerData, receiverData, type);
      const callId = newCallData.callId;
      setActiveCall(newCallData);

      // 3. Create WebRTC PeerConnection & Offer
      const pc = webRTC.createPeerConnection((candidate) => {
        addIceCandidate(callId, true, candidate);
      });

      const offer = await webRTC.createOffer();
      await sendCallOffer(callId, offer);

      // 4. Subscribe to Receiver's ICE Candidates
      unsubIceCandidatesRef.current = subscribeToIceCandidates(callId, true, (candidate) => {
        webRTC.addRemoteIceCandidate(candidate);
      });

      // 5. Subscribe to Call Doc for Answer or Status changes (rejected, busy, ended)
      unsubCallDocRef.current = subscribeToCallDoc(callId, async (updatedCall) => {
        if (!updatedCall) return;

        if (updatedCall.status === 'connecting' && updatedCall.answer && pc.signalingState !== 'stable') {
          await webRTC.handleAnswer(updatedCall.answer);
          setCallState('connected');
          if (callingTimeoutRef.current) clearTimeout(callingTimeoutRef.current);
        } else if (updatedCall.status === 'rejected') {
          setCallState('rejected');
          await recordCallHistory(updatedCall);
          setTimeout(() => resetCallState(), 2500);
        } else if (updatedCall.status === 'busy') {
          setCallState('busy');
          await recordCallHistory(updatedCall);
          setTimeout(() => resetCallState(), 2500);
        } else if (updatedCall.status === 'ended') {
          setCallState('ended');
          setTimeout(() => resetCallState(), 1500);
        }
      });

      // 6. 30-Second Timeout for No Answer
      callingTimeoutRef.current = setTimeout(async () => {
        if (callStateRef.current === 'calling') {
          setCallState('missed');
          await updateCallStatus(callId, 'missed');
          await recordCallHistory({ ...newCallData, status: 'missed' });
          setTimeout(() => resetCallState(), 2500);
        }
      }, 30000);

    } catch (err) {
      console.error("startCall error:", err);
      resetCallState();
      throw err;
    }
  }, [currentUser, userDoc, callState, webRTC, resetCallState]);

  // 3. Accept Incoming Call (Receiver Flow)
  const acceptCall = useCallback(async () => {
    if (!incomingCall?.callId) return;

    const callId = incomingCall.callId;
    const type = incomingCall.type;
    setActiveCall(incomingCall);
    setIncomingCall(null);
    setCallState('connecting');

    try {
      // 1. Get Local Media
      await webRTC.initLocalMedia(type, 'user');

      // 2. Create Peer Connection
      const pc = webRTC.createPeerConnection((candidate) => {
        addIceCandidate(callId, false, candidate);
      });

      // 3. Subscribe to Caller's ICE Candidates
      unsubIceCandidatesRef.current = subscribeToIceCandidates(callId, false, (candidate) => {
        webRTC.addRemoteIceCandidate(candidate);
      });

      // 4. Read Offer & Generate Answer
      if (incomingCall.offer) {
        const answer = await webRTC.handleOfferAndCreateAnswer(incomingCall.offer);
        await sendCallAnswer(callId, answer);
        setCallState('connected');
      }

      // 5. Subscribe to Call Doc for status updates (ended)
      unsubCallDocRef.current = subscribeToCallDoc(callId, (updatedCall) => {
        if (!updatedCall) return;
        if (updatedCall.status === 'ended') {
          setCallState('ended');
          setTimeout(() => resetCallState(), 1500);
        }
      });

    } catch (err) {
      console.error("acceptCall error:", err);
      await updateCallStatus(callId, 'failed');
      resetCallState();
    }
  }, [incomingCall, webRTC, resetCallState]);

  // 4. Decline Incoming Call
  const declineCall = useCallback(async () => {
    if (!incomingCall?.callId) return;
    const targetCall = { ...incomingCall, status: 'rejected' };
    setIncomingCall(null);
    setCallState('idle');
    await updateCallStatus(targetCall.callId, 'rejected');
    await recordCallHistory(targetCall);
  }, [incomingCall]);

  // 5. Cancel Outgoing Call (Caller)
  const cancelCall = useCallback(async () => {
    if (!activeCall?.callId) {
      resetCallState();
      return;
    }
    const callId = activeCall.callId;
    setCallState('cancelled');
    await updateCallStatus(callId, 'cancelled');
    await recordCallHistory({ ...activeCall, status: 'cancelled' });
    resetCallState();
  }, [activeCall, resetCallState]);

  // 6. End Active Call
  const endActiveCall = useCallback(async () => {
    if (!activeCall?.callId) {
      resetCallState();
      return;
    }
    const callId = activeCall.callId;
    const duration = callDuration;

    setCallState('ended');
    await updateCallStatus(callId, 'ended', { duration });
    await recordCallHistory({ ...activeCall, status: 'ended', duration });
    resetCallState();
  }, [activeCall, callDuration, resetCallState]);

  return (
    <CallContext.Provider
      value={{
        activeCall,
        incomingCall,
        callState,
        callDuration,
        webRTC,
        startCall,
        acceptCall,
        declineCall,
        cancelCall,
        endActiveCall,
        resetCallState
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error("useCall must be used within a CallProvider");
  }
  return context;
}
