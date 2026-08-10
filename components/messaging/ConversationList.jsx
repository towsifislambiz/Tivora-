import React, { useState, useEffect } from 'react';
import { MessageSquare } from 'lucide-react';
import { formatPostTime } from '../feed/PostCard';
import UserAvatar from '../common/UserAvatar';
import { subscribeToUserPresence } from '../../firebase/presenceService';

function ConversationItem({ conv, isSelected, onSelectConversation }) {
  const [presence, setPresence] = useState({ isOnline: false, lastSeen: null });
  const partnerUid = conv.partner?.uid || conv.partner?.id;

  useEffect(() => {
    if (!partnerUid || conv.isSynthetic) return;
    const unsub = subscribeToUserPresence(partnerUid, (presenceData) => {
      setPresence(presenceData);
    });
    return () => unsub();
  }, [partnerUid, conv.isSynthetic]);

  const partnerName = conv.partner?.displayName || "Tivora User";
  const partnerAvatar = conv.partner?.photoURL;
  const timeFormatted = formatPostTime(conv.lastMessageAt);

  return (
    <div
      onClick={() => onSelectConversation(conv)}
      className={`px-3 py-3 rounded-2xl transition-all cursor-pointer flex items-center gap-3 relative group ${
        isSelected
          ? 'bg-primary-gradient text-white shadow-gradient-glow'
          : 'hover:bg-brand-lavender/60 text-brand-mainText'
      }`}
    >
      {/* Avatar with real-time online/offline dot */}
      <div className="relative shrink-0">
        <UserAvatar
          src={partnerAvatar}
          name={partnerName}
          size="w-12 h-12"
          className={isSelected ? 'border-2 border-white/50' : 'border border-brand-border'}
          showStatus={!conv.isSynthetic}
          isOnline={presence.isOnline}
        />
      </div>

      {/* Main Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <h4 className={`font-bold text-sm truncate ${isSelected ? 'text-white' : 'text-brand-mainText'}`}>
            {partnerName}
          </h4>
          <span className={`text-[0.65rem] shrink-0 ${isSelected ? 'text-white/70' : 'text-brand-mutedText'}`}>
            {timeFormatted}
          </span>
        </div>

        <div className="flex items-center justify-between gap-1">
          <p className={`text-xs truncate ${
            isSelected 
              ? 'text-white/80' 
              : conv.isUnread 
              ? 'font-bold text-brand-purple' 
              : 'text-brand-mutedText'
          }`}>
            {conv.lastMessage || "Start a conversation 👋"}
          </p>
          {conv.isUnread && !isSelected && (
            <span className="w-2.5 h-2.5 rounded-full bg-brand-pink shrink-0 shadow-soft-xs" />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConversationList({ conversations, selectedId, onSelectConversation, loading }) {
  if (loading) {
    return (
      <div className="space-y-2 p-2">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="p-3 rounded-2xl border border-brand-border animate-pulse flex items-center gap-3 bg-brand-surface">
            <div className="w-12 h-12 bg-brand-lavender rounded-full shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="w-28 h-3.5 bg-brand-lavender rounded-full" />
              <div className="w-40 h-2.5 bg-brand-lavender rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-brand-lavender text-brand-purple flex items-center justify-center">
          <MessageSquare className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-sm text-brand-mainText">No conversations yet</h4>
        <p className="text-xs text-brand-mutedText max-w-xs">
          Add friends and start chatting with them!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 px-1">
      {conversations.map((conv) => {
        const isSelected = selectedId === conv.id || 
          (selectedId && selectedId.startsWith('friend_') && conv.id === selectedId);

        return (
          <ConversationItem
            key={conv.id}
            conv={conv}
            isSelected={isSelected}
            onSelectConversation={onSelectConversation}
          />
        );
      })}
    </div>
  );
}
