import React, { useState, useRef, useEffect } from 'react';
import { MoreHorizontal, Edit3, Trash2, Copy, Check, Phone, Video, Play, Pause } from 'lucide-react';
import { formatMessageTime } from '../feed/PostCard';
import UserAvatar from '../common/UserAvatar';

export default function MessageBubble({ 
  message, 
  isOwn, 
  onEdit, 
  onDelete, 
  onShowToast, 
  isLastSeenByPartner, 
  partner 
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message?.text || '');
  const [copied, setCopied] = useState(false);

  const menuRef = useRef(null);
  const longPressTimerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  if (!message) return null;

  const timeFormatted = formatMessageTime(message.createdAt);

  // Messenger-Style Call History Item Render
  if (message.type === 'call') {
    const isMissed = message.callStatus === 'missed' || (message.text && message.text.includes('Missed'));
    const isVideo = message.callType === 'video' || (message.text && message.text.includes('Video'));
    return (
      <div className="flex justify-center my-3 w-full animate-fadeIn">
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-brand-surface border border-brand-border/80 shadow-soft-xs text-xs font-semibold">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isMissed ? 'bg-red-50 text-red-500' : 'bg-brand-lavender text-brand-purple'
          }`}>
            {isVideo ? <Video className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
          </div>
          <div className="flex flex-col text-left">
            <span className={isMissed ? 'text-red-500 font-bold' : 'text-brand-mainText font-bold'}>
              {message.text || (isVideo ? 'Video Call' : 'Voice Call')}
            </span>
            <span className="text-[0.65rem] text-brand-mutedText font-medium">{timeFormatted}</span>
          </div>
        </div>
      </div>
    );
  }

  const handleCopyText = () => {
    setShowMenu(false);
    if (!message.text) return;
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    if (onShowToast) onShowToast("Message copied! 📋");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveEdit = () => {
    if (!editText.trim()) return;
    if (onEdit) onEdit(message.id, editText.trim());
    setIsEditing(false);
  };

  // Mobile Long Press Handlers
  const handleTouchStart = () => {
    longPressTimerRef.current = setTimeout(() => {
      setShowMenu(true);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  };

  return (
    <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} my-1.5 group relative`}>
      <div className="flex items-center gap-2 max-w-[82%] sm:max-w-[70%] relative">
        {/* Desktop Hover Action Menu Trigger for Own Messages */}
        {isOwn && !message.isDeleted && !isEditing && (
          <div className="relative hidden md:group-hover:block transition-opacity" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-full hover:bg-brand-lavender text-brand-mutedText transition-colors"
              aria-label="Message options"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Dropdown Action Menu (Shown on Desktop Hover Trigger or Mobile Long Press) */}
        {showMenu && !message.isDeleted && (
          <div 
            ref={menuRef}
            className={`absolute ${isOwn ? 'right-0' : 'left-0'} top-8 z-30 w-36 bg-white rounded-2xl border border-brand-border shadow-soft-lg py-1.5 text-xs animate-in fade-in zoom-in-95 duration-150`}
          >
            {isOwn && (
              <button
                onClick={() => { setShowMenu(false); setIsEditing(true); setEditText(message.text); }}
                className="w-full px-3 py-2 text-left font-semibold text-brand-mainText hover:bg-brand-lavender flex items-center gap-2 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-brand-purple" />
                <span>Edit</span>
              </button>
            )}
            <button
              onClick={handleCopyText}
              className="w-full px-3 py-2 text-left font-semibold text-brand-mainText hover:bg-brand-lavender flex items-center gap-2 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-brand-blue" />
              <span>Copy</span>
            </button>
            {isOwn && (
              <button
                onClick={() => { setShowMenu(false); if (onDelete) onDelete(message.id); }}
                className="w-full px-3 py-2 text-left font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}

        {/* Message Bubble Content */}
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-soft-xs whitespace-pre-line break-words select-text ${
            message.isDeleted
              ? 'bg-brand-lavender/50 text-brand-mutedText italic border border-brand-border'
              : isOwn
              ? 'bg-primary-gradient text-white rounded-br-xs font-medium'
              : 'bg-white border border-brand-border/80 text-brand-mainText rounded-bl-xs'
          }`}
        >
          {isEditing ? (
            <div className="space-y-2 text-brand-mainText min-w-[200px]">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="w-full bg-white border border-brand-purple rounded-xl px-3 py-1.5 text-xs outline-none"
                autoFocus
              />
              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 text-[0.68rem] font-semibold text-brand-mutedText hover:underline"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-brand-purple text-white font-bold text-[0.68rem] rounded-full shadow-soft-xs"
                >
                  Save
                </button>
              </div>
            </div>
          ) : message.isDeleted ? (
            <span>This message was deleted.</span>
          ) : message.type === 'voice' || message.audioUrl ? (
            <VoiceNotePlayer audioUrl={message.audioUrl} duration={message.duration} isOwn={isOwn} />
          ) : (
            <span>{message.text}</span>
          )}
        </div>
      </div>

      {/* Metadata Timestamp & Messenger Read Receipt Avatar / Checkmark */}
      <div className={`flex items-center gap-1 text-[0.65rem] text-brand-mutedText px-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'}`}>
        <span>{timeFormatted}</span>
        {message.isEdited && !message.isDeleted && <span>· (edited)</span>}

        {/* Messenger Read Receipt Avatar Icon */}
        {isOwn && !message.isDeleted && (
          <div className="inline-flex items-center ml-0.5">
            {isLastSeenByPartner ? (
              <div 
                title={`Seen by ${partner?.displayName || 'user'}`}
                className="animate-in fade-in zoom-in duration-300 transform scale-100"
              >
                <UserAvatar
                  src={partner?.photoURL}
                  name={partner?.displayName}
                  size="w-3.5 h-3.5"
                  className="border border-white shadow-soft-xs ring-1 ring-brand-purple/30"
                />
              </div>
            ) : (
              <span className="text-brand-purple/70 font-bold text-[0.65rem]" title="Sent">
                ✓
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function VoiceNotePlayer({ audioUrl, duration: initialDuration, isOwn }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(initialDuration || 0);
  const audioRef = useRef(null);

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      if (audio.duration && isFinite(audio.duration) && !isNaN(audio.duration)) {
        setDuration(Math.round(audio.duration));
      } else if (initialDuration && isFinite(initialDuration)) {
        setDuration(initialDuration);
      }
    };

    audio.ontimeupdate = () => {
      if (audio.currentTime && isFinite(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    audio.onended = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, [audioUrl, initialDuration]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch(console.warn);
      setIsPlaying(true);
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const newTime = parseFloat(e.target.value);
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${String(s).padStart(2, '0')}`;
  };

  const validDuration = (duration && isFinite(duration)) ? duration : ((initialDuration && isFinite(initialDuration)) ? initialDuration : 0);

  return (
    <div className={`flex items-center gap-3 p-1 min-w-[200px] max-w-[260px] ${isOwn ? 'text-white' : 'text-brand-mainText'}`}>
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-soft-xs transition-transform active:scale-95 ${
          isOwn ? 'bg-white text-brand-purple hover:bg-white/90' : 'bg-primary-gradient text-white hover:opacity-90'
        }`}
        aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
      >
        {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
      </button>

      <div className="flex-1 flex flex-col justify-center gap-1">
        <div className="relative w-full flex items-center">
          <input
            type="range"
            min="0"
            max={validDuration || 1}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-brand-purple bg-black/20"
          />
        </div>

        <div className="flex items-center justify-between text-[0.65rem] font-mono opacity-80">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(validDuration)}</span>
        </div>
      </div>
    </div>
  );
}
