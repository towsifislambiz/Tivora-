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
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/FirebaseConfig';

const CallContext = createContext(null);

export function CallProvider({ children }) {
  const { currentUser, userDoc } = useAuth();
  const webRTC = useWebRTC();

  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callState, setCallState] = useState('idle');
  const [callDuration, setCallDuration] = useState(0);

  const activeCallRef = useRef(null);
  const callStateRef = useRef('idle');
  const incomingCallRef = useRef(null);
  const timerRef = useRef(null);
  const callingTimeoutRef = useRef(null);
  const unsubCallDocRef = useRef(null);
  const unsubIceCandidatesRef = useRef(null);

  activeCallRef.current = activeCall;
  incomingCallRef.current = incomingCall;
  callStateRef.current = callState;

  // ─── 1. Incoming Call Subscription (WhatsApp Multi-Device) ────────────────
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = subscribeToIncomingCalls(currentUser.uid, async (callData) => {
      const friendConfirmed = await areFriends(currentUser.uid, callData.callerId);
      if (!friendConfirmed) return;

      // STALE CALL PROTECTION (Messenger/WhatsApp Style):
      // If call was created > 35 seconds ago, it is an expired missed call!
      const nowMs = Date.now();
      const createdMs = callData.createdAt?.toMillis ? callData.createdAt.toMillis() : (callData.createdAt || nowMs);
      const ageSeconds = Math.max(0, (nowMs - createdMs) / 1000);

      if (ageSeconds > 35) {
        // Mark stale call as missed in Firestore and record single call history log
        await updateCallStatus(callData.callId, 'missed');
        await recordCallHistory({ ...callData, status: 'missed' });
        return; // DO NOT show popup for expired calls
      }

      // Ignore if already ringing or active for this exact call
      if (
        activeCallRef.current?.callId === callData.callId ||
        incomingCallRef.current?.callId === callData.callId
      ) return;

      // Only mark busy if engaged in a DIFFERENT active call
      if (
        activeCallRef.current &&
        activeCallRef.current.callId !== callData.callId &&
        (callStateRef.current === 'connected' || callStateRef.current === 'calling')
      ) {
        await updateCallStatus(callData.callId, 'busy');
        await recordCallHistory({ ...callData, status: 'busy' });
        return;
      }

      setIncomingCall(callData);
      setCallState('ringing');
    });

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // ULTRA-FAST ANSWER OPTIMIZATION: Pre-warm microphone & camera while call is ringing
  useEffect(() => {
    if (incomingCall?.type && callState === 'ringing') {
      webRTC.initLocalMedia(incomingCall.type, 'user').catch(() => {});
    }
  }, [incomingCall?.callId, incomingCall?.type, callState, webRTC]);

  // ─── 1b. Auto-dismiss when answered/cancelled on another device (WhatsApp Multi-Device Sync) ───────────
  useEffect(() => {
    if (!incomingCall?.callId || callState !== 'ringing') return;

    const callId = incomingCall.callId;
    const unsub = subscribeToCallDoc(callId, (updatedCall) => {
      if (!updatedCall) {
        setIncomingCall(null);
        setCallState('idle');
        return;
      }
      // If call status updated away from 'calling' (answered on another device as 'connecting'/'connected', or rejected/cancelled/missed/ended/busy)
      if (['connecting', 'connected', 'rejected', 'cancelled', 'missed', 'ended', 'busy'].includes(updatedCall.status)) {
        setIncomingCall(null);
        if (callStateRef.current === 'ringing') setCallState('idle');
      }
    });

    return () => unsub();
  }, [incomingCall?.callId, callState]);

  // ─── Call Duration Timer ──────────────────────────────────────────────────
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => setCallDuration(p => p + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [callState]);

  // ─── Reset / Cleanup ──────────────────────────────────────────────────────
  const resetCallState = useCallback(() => {
    if (unsubCallDocRef.current) { unsubCallDocRef.current(); unsubCallDocRef.current = null; }
    if (unsubIceCandidatesRef.current) { unsubIceCandidatesRef.current(); unsubIceCandidatesRef.current = null; }
    if (callingTimeoutRef.current) { clearTimeout(callingTimeoutRef.current); callingTimeoutRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    webRTC.cleanupMedia();
    setActiveCall(null);
    setIncomingCall(null);
    setCallState('idle');
    setCallDuration(0);
  }, [webRTC]);

  // ─── 2. Start Outgoing Call ───────────────────────────────────────────────
  const startCall = useCallback(async (receiver, type = 'voice') => {
    const receiverUid = receiver?.uid || receiver?.id || receiver?.partner?.uid || receiver?.partner?.id;
    if (!currentUser?.uid || !receiverUid) throw new Error("Could not find valid recipient UID.");
    if (callState !== 'idle') return;

    const isFriend = await areFriends(currentUser.uid, receiverUid);
    if (!isFriend) throw new Error("You can only call users who are on your friends list.");

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
      // 1. Create Firestore call doc first to get callId
      const newCallData = await createCallDoc(callerData, receiverData, type);
      const callId = newCallData.callId;
      setActiveCall(newCallData);

      // 2. Get microphone/camera
      await webRTC.initLocalMedia(type, 'user');

      // 3. Create PeerConnection (auto-attaches tracks from step 2)
      const pc = webRTC.createPeerConnection((candidate) => {
        addIceCandidate(callId, true, candidate);
      });

      // 4. Create SDP offer and store in Firestore
      const offer = await webRTC.createOffer();
      await sendCallOffer(callId, offer);

      // 5. Listen for receiver's ICE candidates
      unsubIceCandidatesRef.current = subscribeToIceCandidates(callId, true, (candidate) => {
        webRTC.addRemoteIceCandidate(candidate);
      });

      // 6. Listen for answer / status changes
      unsubCallDocRef.current = subscribeToCallDoc(callId, async (updatedCall) => {
        if (!updatedCall) return;

        if (
          (updatedCall.status === 'connecting' || updatedCall.status === 'connected') &&
          updatedCall.answer
        ) {
          if (pc.signalingState !== 'stable') {
            await webRTC.handleAnswer(updatedCall.answer);
          }
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
        } else if (updatedCall.status === 'cancelled' || updatedCall.status === 'missed') {
          resetCallState();
        }
      });

      // 7. 30-second no-answer timeout
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

  // ─── 3. Accept Incoming Call ──────────────────────────────────────────────
  const acceptCall = useCallback(async () => {
    if (!incomingCall?.callId) return;

    const callId = incomingCall.callId;
    const type = incomingCall.type;
    const callSnapshot = { ...incomingCall };

    setActiveCall(callSnapshot);
    setIncomingCall(null);
    setCallState('connecting');

    try {
      // 1. Get microphone/camera FIRST
      await webRTC.initLocalMedia(type, 'user');

      // 2. Create PeerConnection AFTER media (tracks auto-attach)
      webRTC.createPeerConnection((candidate) => {
        addIceCandidate(callId, false, candidate);
      });

      // 3. Get the SDP offer — try snapshot, then fresh Firestore fetch, then wait
      let offer = callSnapshot.offer || null;

      if (!offer) {
        const callDocSnap = await getDoc(doc(db, 'calls', callId));
        if (callDocSnap.exists()) offer = callDocSnap.data()?.offer || null;
      }

      if (!offer) {
        // Wait up to 8s for offer to arrive in Firestore
        offer = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Offer timeout')), 8000);
          const unsub = subscribeToCallDoc(callId, (updated) => {
            if (updated?.offer) {
              clearTimeout(timeout); unsub(); resolve(updated.offer);
            }
            if (['cancelled', 'ended', 'missed'].includes(updated?.status)) {
              clearTimeout(timeout); unsub(); reject(new Error('Call ended'));
            }
          });
        });
      }

      // 4. Subscribe to caller's ICE candidates
      unsubIceCandidatesRef.current = subscribeToIceCandidates(callId, false, (candidate) => {
        webRTC.addRemoteIceCandidate(candidate);
      });

      // 5. Process offer → create answer → send back
      const answer = await webRTC.handleOfferAndCreateAnswer(offer);
      await sendCallAnswer(callId, answer);
      setCallState('connected');

      // 6. Subscribe to call doc for 'ended' status
      unsubCallDocRef.current = subscribeToCallDoc(callId, (updatedCall) => {
        if (!updatedCall) return;
        if (updatedCall.status === 'ended') {
          setCallState('ended');
          setTimeout(() => resetCallState(), 1500);
        }
      });

    } catch (err) {
      console.error("acceptCall error:", err);
      if (!['Call ended', 'Offer timeout'].includes(err.message)) {
        await updateCallStatus(callId, 'failed').catch(() => {});
      }
      resetCallState();
    }
  }, [incomingCall, webRTC, resetCallState]);

  // ─── 4. Decline Incoming Call ─────────────────────────────────────────────
  const declineCall = useCallback(async () => {
    if (!incomingCall?.callId) return;
    const targetCall = { ...incomingCall, status: 'rejected' };
    setIncomingCall(null);
    setCallState('idle');
    await updateCallStatus(targetCall.callId, 'rejected');
    await recordCallHistory(targetCall);
  }, [incomingCall]);

  // ─── 5. Cancel Outgoing Call ──────────────────────────────────────────────
  const cancelCall = useCallback(async () => {
    if (!activeCall?.callId) { resetCallState(); return; }
    const callId = activeCall.callId;
    setCallState('cancelled');
    await updateCallStatus(callId, 'cancelled');
    await recordCallHistory({ ...activeCall, status: 'cancelled' });
    resetCallState();
  }, [activeCall, resetCallState]);

  // ─── 6. End Active Call ───────────────────────────────────────────────────
  const endActiveCall = useCallback(async () => {
    if (!activeCall?.callId) { resetCallState(); return; }
    const callId = activeCall.callId;
    const duration = callDuration;
    setCallState('ended');
    await updateCallStatus(callId, 'ended', { endedBy: currentUser?.uid, duration });
    await recordCallHistory({ ...activeCall, status: 'ended', duration });
    setTimeout(() => resetCallState(), 1500);
  }, [activeCall, callDuration, currentUser, resetCallState]);

  return (
    <CallContext.Provider value={{
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
      resetCallState,
    }}>
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error('useCall must be used within a CallProvider');
  return ctx;
}
