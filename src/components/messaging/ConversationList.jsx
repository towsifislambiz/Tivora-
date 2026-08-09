import React from 'react';
import { MessageSquare } from 'lucide-react';
import { formatPostTime } from '../feed/PostCard';
import UserAvatar from '../common/UserAvatar';

export default function ConversationList({ conversations, selectedId, onSelectConversation, loading }) {
  if (loading) {
    return (
      <div class="space-y-2 p-2">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} class="p-3 rounded-2xl border border-brand-border animate-pulse flex items-center gap-3 bg-brand-surface">
            <div class="w-12 h-12 bg-brand-lavender rounded-full shrink-0" />
            <div class="space-y-2 flex-1">
              <div class="w-28 h-3.5 bg-brand-lavender rounded-full" />
              <div class="w-40 h-2.5 bg-brand-lavender rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div class="p-8 text-center flex flex-col items-center justify-center space-y-3">
        <div class="w-12 h-12 rounded-full bg-brand-lavender text-brand-purple flex items-center justify-center">
          <MessageSquare class="w-6 h-6" />
        </div>
        <h4 class="font-bold text-sm text-brand-mainText">No conversations yet</h4>
        <p class="text-xs text-brand-mutedText max-w-xs">
          Add friends and start chatting with them!
        </p>
      </div>
    );
  }

  return (
    <div class="space-y-0.5 px-1">
      {conversations.map((conv) => {
        const isSelected = selectedId === conv.id || 
          (selectedId && selectedId.startsWith('friend_') && conv.id === selectedId);
        const partnerName = conv.partner?.displayName || "Tivora User";
        const partnerUsername = conv.partner?.username || "user";
        const partnerAvatar = conv.partner?.photoURL;
        const timeFormatted = formatPostTime(conv.lastMessageAt);
        const isSynthetic = conv.isSynthetic;

        return (
          <div
            key={conv.id}
            onClick={() => onSelectConversation(conv)}
            class={`px-3 py-3 rounded-2xl transition-all cursor-pointer flex items-center gap-3 relative group ${
              isSelected
                ? 'bg-primary-gradient text-white shadow-gradient-glow'
                : 'hover:bg-brand-lavender/60 text-brand-mainText'
            }`}
          >
            {/* Avatar with online dot */}
            <div class="relative shrink-0">
              <UserAvatar
                src={partnerAvatar}
                name={partnerName}
                size="w-12 h-12"
                className={isSelected ? 'border-2 border-white/50' : 'border border-brand-border'}
              />
              {!isSynthetic && (
                <span class={`absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 ${
                  isSelected ? 'border-brand-purple bg-white' : 'border-white bg-emerald-400'
                } shadow-sm`} />
              )}
            </div>

            {/* Main Info */}
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-1 mb-0.5">
                <h4 class={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-brand-mainText'}`}>
                  {partnerName}
                </h4>
                <span class={`text-[0.65rem] shrink-0 ${isSelected ? 'text-white/70' : 'text-brand-mutedText'}`}>
                  {timeFormatted}
                </span>
              </div>

              <div class="flex items-center justify-between gap-1">
                <p class={`text-xs truncate ${
                  isSelected 
                    ? 'text-white/80' 
                    : conv.isUnread 
                    ? 'font-bold text-brand-purple' 
                    : 'text-brand-mutedText'
                }`}>
                  {conv.lastMessage || "Start a conversation 👋"}
                </p>
                {conv.isUnread && !isSelected && (
                  <span class="w-2.5 h-2.5 rounded-full bg-brand-pink shrink-0 shadow-soft-xs" />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
