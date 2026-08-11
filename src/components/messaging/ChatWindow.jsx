import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  Loader2, 
  ArrowLeft, 
  AlertCircle, 
  Smile, 
  Phone, 
  Video, 
  CheckCheck,
  Mic,
  Trash2,
  Square,
  ArrowDown
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { 
  sendMessage, 
  subscribeToMessages, 
  subscribeToConversationDoc,
  editMessage, 
  deleteMessage, 
  markConversationAsRead,
  areFriends,
  getCanonicalConversationId,
  sendVoiceMessage,
  setTypingStatus
} from '../../firebase/messageService';
import MessageBubble from './MessageBubble';
import UserAvatar from '../common/UserAvatar';
import EmojiPicker from '../common/EmojiPicker';
import { useCall } from '../../context/CallContext';
import { subscribeToUserPresence, formatLastSeen } from '../../firebase/presenceService';

export default function ChatWindow({ conversation, onBack, onSelectProfileUsername, onShowToast }) {
  const { currentUser, userDoc, isDemoUser } = useAuth();
  const { startCall } = useCall();

  const [messages, setMessages] = useState([]);
  const [convDocData, setConvDocData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [isFriend, setIsFriend] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [partnerPresence, setPartnerPresence] = useState({ isOnline: false, lastSeen: null });

  // Messenger Scroll Engine States & Dynamic Composer Height Measurement
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [hasUnreadBelow, setHasUnreadBelow] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(null);
  const [composerHeight, setComposerHeight] = useState(76);

  const isNearBottomRef = useRef(true);
  const prevMessagesLengthRef = useRef(0);
  const isFirstLoadRef = useRef(true);
  const typingTimeoutRef = useRef(null);

  // Voice Note Recording States
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingStreamRef = useRef(null);
  const recordingTimerRef = useRef(null);

  const scrollContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const composerRef = useRef(null);
  const inputRef = useRef(null);

  const partner = conversation?.partner || {};
  const partnerUid = partner.uid || partner.id;
  const isPartnerTyping = convDocData?.typing?.[partnerUid] === true;

  // Real-Time Messenger Presence Listener for Partner
  useEffect(() => {
    if (!partnerUid) return;
    const unsub = subscribeToUserPresence(partnerUid, (presenceData) => {
      setPartnerPresence(presenceData);
    });
    return () => unsub();
  }, [partnerUid]);

  // 1. Measure Dynamic Composer Height via ResizeObserver
  useEffect(() => {
    if (!composerRef.current || typeof ResizeObserver === 'undefined') return;

    const updateHeight = () => {
      if (composerRef.current) {
        const h = composerRef.current.offsetHeight;
        if (h > 0) setComposerHeight(h);
      }
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(composerRef.current);
    return () => observer.disconnect();
  }, [isRecording, showEmojiPicker]);

  // 2. Check Friendship Eligibility
  useEffect(() => {
    async function checkEligibility() {
      if (!currentUser?.uid || !partnerUid) return;
      try {
        const eligible = await areFriends(currentUser.uid, partnerUid);
        setIsFriend(eligible);
      } catch (err) {
        setIsFriend(true);
      }
    }
    checkEligibility();
  }, [currentUser?.uid, partnerUid]);

  // 3. Subscribe to Messages & Conversation Doc
  useEffect(() => {
    if (!currentUser?.uid || !partnerUid) return;

    setLoading(true);
    const canonicalConvId = (conversation?.id && !conversation.id.startsWith('friend_')) 
      ? conversation.id 
      : getCanonicalConversationId(currentUser.uid, partnerUid);

    markConversationAsRead(canonicalConvId, currentUser.uid);

    const unsubscribeMsgs = subscribeToMessages(canonicalConvId, (fetchedMsgs) => {
      setMessages(fetchedMsgs);
      setLoading(false);
      markConversationAsRead(canonicalConvId, currentUser.uid);
    });

    const unsubscribeConvDoc = subscribeToConversationDoc(canonicalConvId, (liveDoc) => {
      setConvDocData(liveDoc);
    });

    return () => {
      unsubscribeMsgs();
      unsubscribeConvDoc();
      // Clear the typing flag on close — otherwise leaving mid-sentence leaves the
      // partner staring at a permanent "is typing..." indicator.
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      setTypingStatus(canonicalConvId, currentUser.uid, false);
    };
  }, [currentUser?.uid, partnerUid]);

  // 3b. Release the recorder microphone if the chat unmounts mid-recording
  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
        recordingStreamRef.current = null;
      }
    };
  }, []);

  // 4. Messenger Scroll Helper & Handle Scroll Events
  const scrollToBottom = useCallback((smooth = true) => {
    requestAnimationFrame(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({
          behavior: smooth ? 'smooth' : 'auto',
          block: 'end'
        });
      }
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
      setHasUnreadBelow(false);
      setIsScrolledUp(false);
      isNearBottomRef.current = true;
    });
  }, []);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);
    const isNear = distanceFromBottom <= 100;

    isNearBottomRef.current = isNear;
    setIsScrolledUp(!isNear);

    if (isNear) {
      setHasUnreadBelow(false);
    }
  };

  // Smart Messenger Scroll Behavior on Messages Update or Partner Typing
  useEffect(() => {
    if (messages.length === 0) return;

    const prevLen = prevMessagesLengthRef.current;
    const isNewMsgAdded = messages.length > prevLen;
    prevMessagesLengthRef.current = messages.length;

    // Case 1: Initial conversation open -> Scroll to bottom instantly
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      setTimeout(() => scrollToBottom(false), 50);
      return;
    }

    // Case 2: New message arrives
    if (isNewMsgAdded) {
      const latestMsg = messages[messages.length - 1];
      const isSentByMe = latestMsg.senderId === currentUser?.uid;

      if (isSentByMe || isNearBottomRef.current) {
        scrollToBottom(true);
      } else {
        setHasUnreadBelow(true);
      }
    }
  }, [messages, currentUser?.uid, scrollToBottom]);

  // Auto-scroll when partner starts typing if near bottom
  useEffect(() => {
    if (isPartnerTyping && isNearBottomRef.current) {
      scrollToBottom(true);
    }
  }, [isPartnerTyping]);

  // Reset scroll flags on conversation/partner change
  useEffect(() => {
    isFirstLoadRef.current = true;
    setHasUnreadBelow(false);
    setIsScrolledUp(false);
    isNearBottomRef.current = true;
    if (inputRef.current) inputRef.current.focus();
  }, [partnerUid]);

  // 5. Software Keyboard visualViewport Listener for Mobile
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const handleViewportResize = () => {
      if (window.visualViewport.height < window.innerHeight - 100) {
        setViewportHeight(`${window.visualViewport.height}px`);
      } else {
        setViewportHeight(null);
      }
      if (isNearBottomRef.current) {
        scrollToBottom(false);
      }
    };

    window.visualViewport.addEventListener('resize', handleViewportResize);
    return () => {
      window.visualViewport.removeEventListener('resize', handleViewportResize);
    };
  }, []);

  // 6. Calculate Partner Read Receipt Message ID
  const getReadReceiptMessageId = () => {
    if (!currentUser?.uid || !partnerUid || messages.length === 0) return null;
    const partnerReadIso = convDocData?.lastMessageReadBy?.[partnerUid];
    if (!partnerReadIso) return null;

    const partnerReadMs = new Date(partnerReadIso).getTime();
    const ownMsgs = messages.filter(m => m.senderId === currentUser.uid && !m.isDeleted);

    if (ownMsgs.length === 0) return null;

    for (let i = ownMsgs.length - 1; i >= 0; i--) {
      const msg = ownMsgs[i];
      const msgMs = msg.createdAt?.toDate ? msg.createdAt.toDate().getTime() : new Date(msg.createdAt || 0).getTime();
      if (partnerReadMs >= msgMs) {
        return msg.id;
      }
    }
    return null;
  };

  const lastSeenMessageId = getReadReceiptMessageId();

  const handleSelectEmoji = (emoji) => {
    setText((prev) => prev + emoji);
    if (inputRef.current) inputRef.current.focus();
  };

  // Handle Send Message (Instant Zero-Latency Dispatch)
  const handleSendSubmit = async (e) => {
    e?.preventDefault();
    if (isDemoUser || currentUser?.email?.toLowerCase() === 'demo@tivora.app') {
      if (onShowToast) onShowToast("Demo Bot Account is read-only. Sign up for a free account to message users! 🔒");
      return;
    }
    const trimmed = text.trim();
    if (!trimmed || !currentUser?.uid || sending) return;

    if (!partnerUid) {
      if (onShowToast) onShowToast("Recipient not found.");
      return;
    }

    const targetText = trimmed;
    setText('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    setShowEmojiPicker(false);
    isNearBottomRef.current = true;
    scrollToBottom(true);

    try {
      const actorData = {
        displayName: userDoc?.displayName || currentUser.displayName || 'Tivora User',
        username: userDoc?.username || 'user',
        photoURL: userDoc?.photoURL || currentUser.photoURL || ''
      };

      const targetId = (conversation?.id && !conversation.id.startsWith('friend_')) 
        ? conversation.id 
        : getCanonicalConversationId(currentUser.uid, partnerUid);

      // Clear typing status on send
      setTypingStatus(targetId, currentUser.uid, false);

      await sendMessage(targetId, currentUser.uid, partnerUid, targetText, actorData);
      scrollToBottom(true);
    } catch (err) {
      console.warn("sendMessage error:", err);
      if (onShowToast) onShowToast(err.message || "Failed to send message.");
    }
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }

    if (currentUser?.uid && partnerUid) {
      const canonicalConvId = (conversation?.id && !conversation.id.startsWith('friend_')) 
        ? conversation.id 
        : getCanonicalConversationId(currentUser.uid, partnerUid);

      setTypingStatus(canonicalConvId, currentUser.uid, true);

      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setTypingStatus(canonicalConvId, currentUser.uid, false);
      }, 2500);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendSubmit();
    }
  };

  // Handle Edit Message
  const handleEditMessage = async (messageId, newText) => {
    if (!currentUser?.uid || !partnerUid) return;
    try {
      const canonicalConvId = getCanonicalConversationId(currentUser.uid, partnerUid);
      await editMessage(canonicalConvId, messageId, currentUser.uid, newText);
      if (onShowToast) onShowToast("Message updated.");
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Failed to edit message.");
    }
  };

  // Handle Delete Message
  const handleDeleteMessage = async (messageId) => {
    if (!currentUser?.uid || !partnerUid) return;
    try {
      const canonicalConvId = getCanonicalConversationId(currentUser.uid, partnerUid);
      await deleteMessage(canonicalConvId, messageId, currentUser.uid);
      if (onShowToast) onShowToast("Message deleted.");
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Failed to delete message.");
    }
  };

  // Start Voice Note Recording with High-Clarity Audio & Noise Suppression
  const handleStartRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (onShowToast) onShowToast("Voice recording is not supported on this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000
        }
      });
      recordingStreamRef.current = stream;
      audioChunksRef.current = [];

      // Determine best supported clear audio MIME type
      let options = {};
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus', audioBitsPerSecond: 128000 };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4', audioBitsPerSecond: 128000 };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm', audioBitsPerSecond: 128000 };
        }
      }

      const mediaRecorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

    } catch (err) {
      console.warn("handleStartRecording error:", err);
      if (onShowToast) onShowToast("Microphone access is required to send voice notes.");
    }
  };

  // Cancel Voice Note Recording
  const handleCancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (recordingStreamRef.current) {
      recordingStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setIsRecording(false);
    setRecordingDuration(0);
    audioChunksRef.current = [];
  };

  // Send Voice Note Recording
  const handleSendVoiceNote = async () => {
    if (isDemoUser || currentUser?.email?.toLowerCase() === 'demo@tivora.app') {
      if (onShowToast) onShowToast("Demo Bot Account is read-only. Sign up for a free account to send voice notes! 🔒");
      return;
    }
    if (!mediaRecorderRef.current || sending) return;

    setSending(true);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }

    const duration = Math.max(1, recordingDuration);

    mediaRecorderRef.current.onstop = async () => {
      if (recordingStreamRef.current) {
        recordingStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      audioChunksRef.current = [];
      setIsRecording(false);
      setRecordingDuration(0);

      try {
        const actorData = {
          displayName: userDoc?.displayName || currentUser.displayName || 'Tivora User',
          username: userDoc?.username || 'user',
          photoURL: userDoc?.photoURL || currentUser.photoURL || ''
        };

        const targetId = (conversation?.id && !conversation.id.startsWith('friend_')) 
          ? conversation.id 
          : getCanonicalConversationId(currentUser.uid, partnerUid);

        await sendVoiceMessage(targetId, currentUser.uid, partnerUid, audioBlob, duration, actorData);
        if (onShowToast) onShowToast("Voice note sent! 🎤");
        scrollToBottom(true);
      } catch (err) {
        console.error("sendVoiceMessage error:", err);
        if (onShowToast) onShowToast(err.message || "Failed to send voice note.");
      } finally {
        setSending(false);
      }
    };

    mediaRecorderRef.current.stop();
  };

  return (
    <div 
      className="chat-window-active flex flex-col flex-1 min-h-0 h-full w-full overflow-hidden bg-brand-surface relative"
      style={viewportHeight ? { height: viewportHeight } : {}}
    >
      {/* ── 1. FIXED CHAT HEADER ── */}
      <div className="px-4 py-3 border-b border-brand-border bg-brand-surface flex items-center justify-between shrink-0 gap-3 min-w-0 shadow-soft-xs z-20">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-full hover:bg-brand-lavender text-brand-mainText transition-colors md:hidden shrink-0"
              aria-label="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <div 
            className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
            onClick={() => onSelectProfileUsername && partner.username && onSelectProfileUsername(partner.username)}
          >
            <div className="relative shrink-0">
              <UserAvatar
                src={partner.photoURL}
                name={partner.displayName}
                size="w-10 h-10"
                className="border-2 border-brand-lavender group-hover:scale-105 transition-transform"
                showStatus={true}
                isOnline={partnerPresence.isOnline}
              />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-brand-mainText group-hover:text-brand-purple transition-colors leading-tight truncate">
                {partner.displayName}
              </h4>
              <p className="text-[0.7rem] font-medium truncate flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${partnerPresence.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                <span className={partnerPresence.isOnline ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-brand-mutedText'}>
                  @{partner.username} · {formatLastSeen(partnerPresence.isOnline, partnerPresence.lastSeen)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Call Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={async () => {
              try {
                await startCall(partner, 'voice');
              } catch (err) {
                if (onShowToast) onShowToast(err.message || 'Failed to start voice call.');
              }
            }}
            className="w-9 h-9 rounded-full bg-brand-lavender/60 hover:bg-brand-purple hover:text-white text-brand-purple flex items-center justify-center transition-all"
            title="Start Voice Call"
          >
            <Phone className="w-4 h-4" />
          </button>

          <button
            onClick={async () => {
              try {
                await startCall(partner, 'video');
              } catch (err) {
                if (onShowToast) onShowToast(err.message || 'Failed to start video call.');
              }
            }}
            className="w-9 h-9 rounded-full bg-brand-lavender/60 hover:bg-brand-purple hover:text-white text-brand-purple flex items-center justify-center transition-all"
            title="Start Video Call"
          >
            <Video className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── 2. INDEPENDENT CHAT SCROLL CONTAINER ── */}
      <div 
        ref={scrollContainerRef} 
        onScroll={handleScroll}
        className="flex-1 min-h-0 px-3 sm:px-5 pt-4 overflow-y-auto space-y-1 bg-gradient-to-b from-brand-bg/50 to-brand-lavender/10 chat-scroll-container"
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full space-y-3">
            <Loader2 className="w-7 h-7 text-brand-purple animate-spin" />
            <p className="text-xs text-brand-mutedText">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-12">
            <div className="w-16 h-16 rounded-2xl bg-primary-gradient text-white flex items-center justify-center mb-1 shadow-gradient-glow">
              <Smile className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-base text-brand-mainText">Say hello to {partner.displayName}! 👋</h4>
              <p className="text-xs text-brand-mutedText max-w-xs">This is the beginning of your private conversation.</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.senderId === currentUser?.uid}
              onEdit={handleEditMessage}
              onDelete={handleDeleteMessage}
              onShowToast={onShowToast}
              isLastSeenByPartner={msg.id === lastSeenMessageId}
              partner={partner}
            />
          ))
        )}

        {/* Messenger Real-Time Typing Indicator Bubble */}
        {isPartnerTyping && (
          <div className="flex items-center gap-2 my-2 animate-slideUp">
            <UserAvatar
              src={partner.photoURL}
              name={partner.displayName}
              size="w-7 h-7"
              className="border border-brand-surface shadow-soft-xs shrink-0"
            />
            <div className="bg-brand-surface border border-brand-border/80 rounded-2xl rounded-bl-xs px-3.5 py-2 shadow-soft-xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-brand-purple animate-bounce" />
            </div>
            <span className="text-[0.68rem] text-brand-mutedText font-medium italic">
              {partner.displayName?.split(' ')[0]} is typing...
            </span>
          </div>
        )}

        {/* 💬 Messenger Bottom Padding Spacer */}
        <div className="h-4 shrink-0" aria-hidden="true" />
        <div ref={messagesEndRef} />
      </div>

      {/* ── Floating Messenger "New Message / Scroll to Bottom" Button ── */}
      {isScrolledUp && (
        <div 
          className="absolute right-5 z-40 animate-fadeIn"
          style={{ bottom: `${composerHeight + 16}px` }}
        >
          <button
            onClick={() => scrollToBottom(true)}
            className={`px-3.5 py-2 rounded-full text-xs font-bold shadow-soft-lg flex items-center gap-1.5 border transition-all ${
              hasUnreadBelow
                ? 'bg-primary-gradient text-white border-white/40 animate-pulse scale-105'
                : 'bg-white/95 backdrop-blur-md text-brand-purple border-brand-purple/30 hover:bg-brand-purple hover:text-white'
            }`}
            aria-label="Scroll to bottom"
          >
            <span>{hasUnreadBelow ? 'New message 💬' : 'Latest'}</span>
            <ArrowDown className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── Non-Friend Warning ── */}
      {!isFriend && (
        <div className="px-5 py-2.5 bg-amber-50 border-t border-amber-200 text-amber-700 text-xs flex items-center gap-2 font-medium shrink-0">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>You need to be friends with {partner.displayName} to send messages.</span>
        </div>
      )}

      {/* ── Emoji Picker Popover ── */}
      <EmojiPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelectEmoji={handleSelectEmoji}
      />

      {/* ── 3. FIXED FLOATING COMPOSER ── */}
      <div 
        ref={composerRef}
        className="px-3 py-3.5 bg-brand-surface shrink-0 z-40 pb-safe w-full min-w-0 border-t border-brand-border/40"
      >
        {isRecording ? (
          /* Voice Note Recording Bar */
          <div className="flex items-center justify-between gap-4 bg-brand-lavender/80 border border-brand-purple/40 px-5 py-2.5 rounded-full animate-fadeIn shadow-soft-sm">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-ping" />
              <span className="text-xs font-bold text-brand-purple">Recording Voice Note...</span>
              <span className="font-mono text-xs font-extrabold text-brand-mainText">
                {String(Math.floor(recordingDuration / 60)).padStart(2, '0')}:{String(recordingDuration % 60).padStart(2, '0')}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancelRecording}
                className="p-2 rounded-full hover:bg-red-100 text-red-500 transition-colors"
                title="Cancel Recording"
              >
                <Trash2 className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={handleSendVoiceNote}
                disabled={sending}
                className="w-10 h-10 rounded-full bg-primary-gradient text-white flex items-center justify-center shadow-gradient-glow hover:scale-105 active:scale-95 transition-all"
                title="Send Voice Note"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        ) : (
          /* Floating White Rounded Capsule Card */
          <div className="bg-brand-surface rounded-[28px] p-2 sm:p-2.5 border border-brand-border/70 shadow-soft-md flex items-center gap-2 min-w-0 w-full">
            {/* Emoji Trigger Button on Left */}
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              disabled={!isFriend}
              className={`p-2 rounded-full transition-colors shrink-0 ${
                showEmojiPicker
                  ? 'bg-brand-purple text-white'
                  : 'text-brand-mutedText hover:text-brand-purple hover:bg-brand-lavender'
              }`}
              title="Add Emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {/* Input Pill Container with Auto-Expanding Multi-line Textarea */}
            <form onSubmit={handleSendSubmit} className="flex-1 flex items-center bg-brand-lavender/50 border border-brand-purple/30 focus-within:border-brand-purple focus-within:bg-brand-surface rounded-2xl sm:rounded-3xl transition-all px-3.5 gap-2 min-h-[40px] sm:min-h-[44px] max-h-36 min-w-0 overflow-hidden">
              <textarea
                ref={inputRef}
                value={text}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder={isFriend ? "Message..." : "Friends only messaging"}
                disabled={sending || !isFriend}
                rows={1}
                maxLength={5000}
                className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-brand-mainText outline-none placeholder:text-brand-mutedText/60 disabled:opacity-50 resize-none max-h-28 py-2.5 leading-relaxed no-scrollbar"
              />

              {/* Voice Note Mic Button inside Pill */}
              <button
                type="button"
                onClick={handleStartRecording}
                disabled={!isFriend || sending}
                className="p-1.5 rounded-full text-brand-mutedText hover:text-brand-purple hover:bg-brand-lavender transition-colors shrink-0 disabled:opacity-50 my-auto"
                title="Record Voice Note"
              >
                <Mic className="w-5 h-5" />
              </button>
            </form>

            {/* Send Button on Right */}
            <button
              type="button"
              onClick={handleSendSubmit}
              disabled={sending || !text.trim() || !isFriend}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-primary-gradient text-white flex items-center justify-center shadow-gradient-glow hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:scale-100 shrink-0"
              aria-label="Send message"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
