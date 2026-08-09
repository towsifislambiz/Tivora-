import React, { useState } from 'react';
import { X, Image, Smile, Activity, BarChart2, Globe, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { compressAndResizeImage } from '../../utils/imageOptimizer';
import { createPost } from '../../firebase/postService';

export default function CreatePostModal({ isOpen, onClose, onPostCreated, onShowToast }) {
  const { currentUser, userDoc } = useAuth();

  const [text, setText] = useState('');
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);

  const [posting, setPosting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const displayName = userDoc?.displayName || currentUser?.displayName || 'Tivora User';
  const username = userDoc?.username || userDoc?.profileId || currentUser?.uid || 'user';
  const firstName = displayName.trim().split(' ')[0];
  const avatarUrl = userDoc?.photoURL || currentUser?.photoURL || '';

  const getInitials = (name) => {
    if (!name) return 'TV';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    try {
      // Facebook-grade instant smart image compression (Target ~100-150KB)
      const compressedDataUrl = await compressAndResizeImage(file, 1080, 1080, 150);
      setSelectedImageFile(file);
      setImagePreviewUrl(compressedDataUrl);
    } catch (err) {
      setError(err.message || 'Failed to process image preview.');
    }
  };

  const handleRemoveSelectedImage = () => {
    setSelectedImageFile(null);
    setImagePreviewUrl(null);
  };

  const handleSubmit = async () => {
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

      const newPost = await createPost(authorInfo, trimmedText, imagePreviewUrl || selectedImageFile);

      if (onShowToast) onShowToast('Your post has been published! 🚀');
      if (onPostCreated) onPostCreated(newPost);

      // Reset Form State
      setText('');
      setSelectedImageFile(null);
      setImagePreviewUrl(null);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to publish post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-brand-mainText/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-brand-surface rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl border border-brand-border overflow-hidden animate-slideUp sm:animate-none pb-safe">
        {/* Mobile Drag Handle */}
        <div className="bottom-sheet-drag-handle sm:hidden" />
        {/* Header */}
        <div class="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h3 class="font-bold text-lg text-brand-mainText">Create Post</h3>
          <button
            onClick={onClose}
            class="w-8 h-8 rounded-full hover:bg-brand-lavender text-brand-mutedText hover:text-brand-mainText flex items-center justify-center transition-colors"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div class="mx-6 mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Body */}
        <div class="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div class="flex items-center gap-3">
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} class="w-11 h-11 rounded-full object-cover shrink-0" />
            ) : (
              <div class="w-11 h-11 rounded-full bg-primary-gradient text-white flex items-center justify-center font-bold text-sm shrink-0">
                {getInitials(displayName)}
              </div>
            )}
            <div>
              <h4 class="font-bold text-sm text-brand-mainText">{displayName}</h4>
              <div class="flex items-center gap-1 text-xs text-brand-mutedText bg-brand-lavender px-2 py-0.5 rounded-full mt-0.5 w-max">
                <Globe class="w-3 h-3" />
                <span>Public</span>
              </div>
            </div>
          </div>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={`What's on your mind, ${firstName}?`}
            class="w-full min-h-[120px] text-base text-brand-mainText outline-none resize-none placeholder:text-brand-mutedText/70"
            autoFocus
          />

          {/* Selected Image Preview Container */}
          {imagePreviewUrl && (
            <div class="relative rounded-2xl overflow-hidden max-h-64 border border-brand-border group">
              <img src={imagePreviewUrl} alt="Preview Attachment" class="w-full h-full object-cover max-h-64" />
              <button
                type="button"
                onClick={handleRemoveSelectedImage}
                class="absolute top-2 right-2 p-2 rounded-full bg-brand-mainText/70 hover:bg-red-500 text-white transition-colors shadow-soft-sm"
                title="Remove image"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Footer Toolbar */}
        <div class="px-6 py-4 bg-brand-bg border-t border-brand-border flex items-center justify-between">
          <div class="flex items-center gap-2">
            <label class="p-2 rounded-xl text-brand-purple hover:bg-brand-lavender transition-colors cursor-pointer" title="Add Image">
              <Image class="w-5 h-5" />
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                class="hidden"
              />
            </label>
            <button 
              onClick={() => onShowToast('Emoji picker')} 
              class="p-2 rounded-xl text-amber-500 hover:bg-brand-lavender transition-colors"
              title="Add Feeling"
            >
              <Smile class="w-5 h-5" />
            </button>
            <button 
              onClick={() => onShowToast('Activity selector')} 
              class="p-2 rounded-xl text-brand-blue hover:bg-brand-lavender transition-colors"
              title="Add Activity"
            >
              <Activity class="w-5 h-5" />
            </button>
            <button 
              onClick={() => onShowToast('Poll builder')} 
              class="p-2 rounded-xl text-brand-pink hover:bg-brand-lavender transition-colors"
              title="Create Poll"
            >
              <BarChart2 class="w-5 h-5" />
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={posting}
            class="px-6 py-2 rounded-full bg-primary-gradient text-white font-semibold text-sm shadow-gradient-glow hover:scale-105 transition-transform disabled:opacity-50 inline-flex items-center gap-2"
          >
            {posting ? (
              <>
                <Loader2 class="w-4 h-4 animate-spin" />
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
