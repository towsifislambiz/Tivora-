import React, { useCallback, useEffect, useRef, useState } from 'react';
import { X, Image, Smile, Activity, BarChart2, Globe, Loader2, AlertCircle, ChevronDown, Users, Check } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { compressAndResizeImage } from '../../utils/imageOptimizer';
import { createPost } from '../../firebase/postService';
import EmojiPicker from './EmojiPicker';

/** Instagram's caption ceiling — the counter only appears as you approach it. */
const MAX_CHARS = 2200;
const COUNTER_VISIBLE_FROM = MAX_CHARS - 300;

export default function CreatePostModal({ isOpen, onClose, onPostCreated, onShowToast }) {
  const { currentUser, userDoc, isDemoUser } = useAuth();

  const [text, setText] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [privacy, setPrivacy] = useState('public'); // 'public' | 'friends'
  const [showPrivacyDropdown, setShowPrivacyDropdown] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  const textareaRef = useRef(null);
  const privacyRef = useRef(null);

  const displayName = userDoc?.displayName || currentUser?.displayName || 'Tivora User';
  const username = userDoc?.username || userDoc?.profileId || currentUser?.uid || 'user';
  const firstName = displayName.trim().split(' ')[0];
  const avatarUrl = userDoc?.photoURL || currentUser?.photoURL || '';

  const isOverLimit = text.length > MAX_CHARS;
  const canPost = (text.trim().length > 0 || !!imagePreviewUrl) && !isOverLimit && !posting;

  useEffect(() => {
    function handleClickOutside(e) {
      if (privacyRef.current && !privacyRef.current.contains(e.target)) {
        setShowPrivacyDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setError('');
    try {
      const compressedDataUrl = await compressAndResizeImage(file, 1080, 1080, 150);
      setSelectedImageFile(file);
      setImagePreviewUrl(compressedDataUrl);
    } catch (err) {
      setError(err.message || 'Failed to process image preview.');
    }
  }, []);

  // Esc to dismiss
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (showEmojiPicker) setShowEmojiPicker(false);
        else if (showPrivacyDropdown) setShowPrivacyDropdown(false);
        else onClose();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose, showEmojiPicker, showPrivacyDropdown]);

  // Paste an image
  useEffect(() => {
    if (!isOpen) return undefined;
    const onPaste = (e) => {
      const item = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith('image/'));
      if (item) processFile(item.getAsFile());
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [isOpen, processFile]);

  if (!isOpen) return null;

  const getInitials = (name) => {
    if (!name) return 'TV';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleImageSelect = (e) => processFile(e.target.files?.[0]);

  const handleRemoveSelectedImage = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
  };

  const handleSelectEmoji = (emoji) => {
    const el = textareaRef.current;
    if (!el) {
      setText((prev) => prev + emoji);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? text.length;
    const next = text.slice(0, start) + emoji + text.slice(end);
    setText(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + emoji.length, start + emoji.length);
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDraggingFile(false);
    processFile(e.dataTransfer?.files?.[0]);
  };

  const handleSubmit = async () => {
    if (isDemoUser || currentUser?.email?.toLowerCase() === 'demo@tivora.app') {
      if (onShowToast) onShowToast("Demo Bot Account is read-only. Sign up for a free account to publish posts! 🔒");
      return;
    }
    setError('');
    const trimmedText = text.trim();

    if (!trimmedText && !imagePreviewUrl) {
      setError('Please enter text or select an image to post.');
      return;
    }

    setPosting(true);
    try {
      const authorInfo = {
        uid: currentUser?.uid || 'guest_uid',
        username,
        displayName,
        photoURL: avatarUrl
      };

      const newPost = await createPost(authorInfo, trimmedText, imagePreviewUrl || selectedImageFile, privacy);

      if (onShowToast) onShowToast('Your post has been published! 🚀');
      if (onPostCreated) onPostCreated(newPost);

      setText('');
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      setPrivacy('public');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to publish post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const tools = [
    { id: 'emoji', Icon: Smile, label: 'Feeling', onClick: () => setShowEmojiPicker((v) => !v) },
    { id: 'activity', Icon: Activity, label: 'Activity', onClick: () => onShowToast('Activity selector') },
    { id: 'poll', Icon: BarChart2, label: 'Poll', onClick: () => onShowToast('Poll builder') },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label="Create post"
    >
      <div className="relative bg-brand-surface rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl border border-brand-border animate-slideUp sm:animate-none pb-safe">
        {/* Mobile Drag Handle */}
        <div className="bottom-sheet-drag-handle sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h3 className="font-bold text-lg text-brand-mainText">Create Post</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-brand-lavender text-brand-mutedText hover:text-brand-mainText flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 bg-brand-pink/10 border border-brand-pink/30 text-brand-pink px-4 py-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Body */}
        <div
          className="p-6 space-y-4 max-h-[70vh] overflow-y-auto"
          onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={handleDrop}
        >
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-11 h-11 rounded-full object-cover shrink-0" />
            ) : (
              <div className="w-11 h-11 rounded-full bg-primary-gradient text-white flex items-center justify-center font-bold text-sm shrink-0">
                {getInitials(displayName)}
              </div>
            )}
            <div>
              <h4 className="font-bold text-sm text-brand-mainText">{displayName}</h4>
              
              {/* Audience Privacy Selector */}
              <div className="relative mt-1" ref={privacyRef}>
                <button
                  type="button"
                  onClick={() => setShowPrivacyDropdown(!showPrivacyDropdown)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-brand-purple bg-brand-purple/10 hover:bg-brand-purple/20 px-2.5 py-1 rounded-lg border border-brand-purple/20 transition-all cursor-pointer"
                >
                  {privacy === 'public' ? (
                    <>
                      <Globe className="w-3.5 h-3.5" />
                      <span>Public</span>
                    </>
                  ) : (
                    <>
                      <Users className="w-3.5 h-3.5" />
                      <span>Friends</span>
                    </>
                  )}
                  <ChevronDown className="w-3 h-3 text-brand-purple" />
                </button>

                {/* Privacy Dropdown Menu */}
                {showPrivacyDropdown && (
                  <div className="absolute left-0 top-8 z-40 w-56 bg-brand-surface rounded-2xl border border-brand-border shadow-soft-lg py-1.5 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => { setPrivacy('public'); setShowPrivacyDropdown(false); }}
                      className={`w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                        privacy === 'public' ? 'bg-brand-lavender text-brand-purple' : 'text-brand-mainText hover:bg-brand-lavender/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Globe className="w-4 h-4 text-brand-purple shrink-0" />
                        <div>
                          <div className="font-bold">Public</div>
                          <div className="text-[0.65rem] text-brand-mutedText font-normal">Anyone on Tivora can view</div>
                        </div>
                      </div>
                      {privacy === 'public' && <Check className="w-4 h-4 text-brand-purple shrink-0" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => { setPrivacy('friends'); setShowPrivacyDropdown(false); }}
                      className={`w-full px-3.5 py-2.5 text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                        privacy === 'friends' ? 'bg-brand-lavender text-brand-purple' : 'text-brand-mainText hover:bg-brand-lavender/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-brand-purple shrink-0" />
                        <div>
                          <div className="font-bold">Friends</div>
                          <div className="text-[0.65rem] text-brand-mutedText font-normal">Only accepted friends on Tivora</div>
                        </div>
                      </div>
                      {privacy === 'friends' && <Check className="w-4 h-4 text-brand-purple shrink-0" />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* The composer previously had no background of its own, so it fell
              through to the browser's default field rendering — a grey slab
              that matched neither theme. */}
          <div
            className={`relative rounded-xl border transition-colors ${
              isDraggingFile
                ? 'border-brand-purple border-dashed bg-brand-purple/10'
                : 'border-brand-border bg-brand-lavender focus-within:border-brand-purple'
            }`}
          >
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`What's on your mind, ${firstName}?`}
              className="w-full min-h-[140px] bg-transparent px-4 py-3 text-base text-brand-mainText outline-none resize-none placeholder:text-brand-mutedText/70"
              autoFocus
            />

            {isDraggingFile && (
              <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-brand-surface/80 text-sm font-bold text-brand-purple pointer-events-none">
                Drop image to attach
              </div>
            )}

            {text.length >= COUNTER_VISIBLE_FROM && (
              <span
                className={`absolute bottom-2 right-3 text-[0.7rem] font-semibold tabular-nums ${
                  isOverLimit ? 'text-brand-pink' : 'text-brand-mutedText'
                }`}
              >
                {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
              </span>
            )}
          </div>

          {/* Selected Image Preview Container */}
          {imagePreviewUrl && (
            <div className="relative rounded-xl overflow-hidden max-h-80 border border-brand-border bg-slate-950/90 flex items-center justify-center">
              <div 
                className="absolute inset-0 bg-cover bg-center blur-xl opacity-30 pointer-events-none"
                style={{ backgroundImage: `url(${imagePreviewUrl})` }}
              />
              <img src={imagePreviewUrl} alt="Preview Attachment" className="relative z-10 w-full h-auto max-h-80 object-contain mx-auto" />
              <button
                type="button"
                onClick={handleRemoveSelectedImage}
                className="absolute top-2 right-2 z-20 p-2 rounded-full bg-black/60 hover:bg-brand-pink text-white transition-colors"
                title="Remove image"
                aria-label="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Toolbar */}
        <div className="relative px-6 py-4 bg-brand-bg border-t border-brand-border sm:rounded-b-3xl flex items-center justify-between gap-3">
          {/* Rendered as a direct child: EmojiPicker carries its own
              `absolute bottom-14 right-4`, so it must anchor to this footer
              rather than to a wrapper of its own. */}
          <EmojiPicker
            isOpen={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            onSelectEmoji={handleSelectEmoji}
          />

          {/* One muted colour for every tool: four competing accent colours
              read as clutter at this size and fought the blue Post button
              for attention. */}
          <div className="flex items-center gap-1">
            <label
              className="flex items-center gap-1.5 p-2 rounded-lg text-brand-mutedText hover:text-brand-purple hover:bg-brand-lavender transition-colors cursor-pointer"
              title="Add image — or drag one in, or paste from clipboard"
            >
              <Image className="w-5 h-5" />
              <span className="hidden sm:inline text-xs font-semibold">Photo</span>
              <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            </label>

            {tools.map(({ id, Icon, label, onClick }) => (
              <button
                key={id}
                onClick={onClick}
                className={`flex items-center gap-1.5 p-2 rounded-lg transition-colors hover:bg-brand-lavender ${
                  id === 'emoji' && showEmojiPicker
                    ? 'text-brand-purple bg-brand-lavender'
                    : 'text-brand-mutedText hover:text-brand-purple'
                }`}
                title={label}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline text-xs font-semibold">{label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canPost}
            className="px-6 py-2 rounded-lg bg-primary-gradient text-white font-bold text-sm shadow-gradient-glow hover:opacity-90 transition-opacity disabled:opacity-40 disabled:pointer-events-none inline-flex items-center gap-2 shrink-0"
          >
            {posting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <span>Post</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
