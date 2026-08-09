import React, { useState, useRef, useEffect } from 'react';
import { Smile, Heart, ThumbsUp, Zap, Sparkles, X } from 'lucide-react';

const EMOJI_CATEGORIES = [
  {
    id: 'popular',
    name: 'Popular',
    icon: Sparkles,
    emojis: ['❤️', '😂', '🔥', '👍', '😍', '😊', '🥰', '🎉', '🙏', '💯', '✨', '🙌', '😎', '🤣', '😭', '👏']
  },
  {
    id: 'smileys',
    name: 'Smileys',
    icon: Smile,
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '📁']
  },
  {
    id: 'hearts',
    name: 'Love & Reactions',
    icon: Heart,
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '💋', '💌', '💖', '💐', '🌹', '🥀', '🌺', '🌸', '🌷', '✨', '⚡️']
  },
  {
    id: 'gestures',
    name: 'Hands & Gestures',
    icon: ThumbsUp,
    emojis: ['👍', '👎', '👊', '✊', '🤛', '🤜', '🤞', '✌️', '🤟', '🤘', '👌', '🤌', '🤏', '👈', '👉', '👆', '👇', '☝️', '✋', '🤚', '🖐', '🖖', '👋', '🤙', '💪', '🦾', '🖕', '✍️', '🙏', '🦶', '🦵']
  },
  {
    id: 'activity',
    name: 'Symbols & Party',
    icon: Zap,
    emojis: ['🎉', '🎊', '🎈', '🎂', '🎁', '🏆', '🏅', '🥇', '⭐', '🌟', '💥', '🔥', '✨', '💯', '🚀', '🎯', '🎰', '🎲', '🎨', '🎬', '🎤', '🎧', '🎼', '🎵', '🎶', '🎮', '💡', '💰', '💵', '💎']
  }
];

export default function EmojiPicker({ onSelectEmoji, isOpen, onClose }) {
  const [activeCategory, setActiveCategory] = useState('popular');
  const pickerRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentCategoryObj = EMOJI_CATEGORIES.find(c => c.id === activeCategory) || EMOJI_CATEGORIES[0];

  return (
    <div
      ref={pickerRef}
      class="absolute bottom-14 right-4 z-50 w-72 sm:w-80 bg-brand-surface border border-brand-border rounded-3xl shadow-2xl p-3 flex flex-col space-y-2 animate-in fade-in slide-in-from-bottom-3 duration-200"
    >
      {/* Picker Header */}
      <div class="flex items-center justify-between px-2 pt-1 pb-2 border-b border-brand-border">
        <span class="text-xs font-bold text-brand-mainText flex items-center gap-1.5">
          <span>Choose Emoji</span>
          <span class="text-[0.68rem] font-normal text-brand-mutedText">({currentCategoryObj.name})</span>
        </span>
        <button
          onClick={onClose}
          type="button"
          class="w-6 h-6 rounded-full hover:bg-brand-lavender text-brand-mutedText hover:text-brand-mainText flex items-center justify-center transition-colors"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Category Tabs */}
      <div class="flex items-center justify-around bg-brand-lavender/50 p-1 rounded-2xl">
        {EMOJI_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = cat.id === activeCategory;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              class={`p-1.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-primary-gradient text-white shadow-soft-xs scale-105'
                  : 'text-brand-mutedText hover:text-brand-purple hover:bg-brand-surface'
              }`}
              title={cat.name}
            >
              <Icon class="w-4 h-4" />
            </button>
          );
        })}
      </div>

      {/* Emoji Grid */}
      <div class="h-48 overflow-y-auto grid grid-cols-7 gap-1 p-1 scrollbar-thin">
        {currentCategoryObj.emojis.map((emoji, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              onSelectEmoji(emoji);
            }}
            class="w-9 h-9 text-xl flex items-center justify-center rounded-xl hover:bg-brand-lavender hover:scale-125 transition-all active:scale-95"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
