import React from 'react';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  UserPlus, 
  UserCheck, 
  Bell,
  MessageSquare 
} from 'lucide-react';
import { formatPostTime } from '../feed/PostCard';
import UserAvatar from '../common/UserAvatar';

export default function NotificationItem({ notification, onClick, onSelectProfileUsername, onShowToast }) {
  if (!notification) return null;

  const {
    actorDisplayName,
    actorUsername,
    actorPhotoURL,
    type,
    message,
    isRead,
    createdAt,
    postId
  } = notification;

  const timeFormatted = formatPostTime(createdAt);

  const getTypeIcon = () => {
    switch (type) {
      case 'post_like':
        return <Heart class="w-3.5 h-3.5 fill-brand-pink text-brand-pink" />;
      case 'post_comment':
      case 'comment_reply':
        return <MessageCircle class="w-3.5 h-3.5 text-brand-purple fill-brand-purple" />;
      case 'post_share':
        return <Share2 class="w-3.5 h-3.5 text-brand-blue" />;
      case 'friend_request':
        return <UserPlus class="w-3.5 h-3.5 text-brand-pink" />;
      case 'friend_accepted':
        return <UserCheck class="w-3.5 h-3.5 text-emerald-500" />;
      case 'message':
        return <MessageSquare class="w-3.5 h-3.5 text-brand-purple fill-brand-purple" />;
      default:
        return <Bell class="w-3.5 h-3.5 text-brand-purple" />;
    }
  };

  return (
    <div
      onClick={onClick}
      class={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative ${
        isRead 
          ? 'bg-brand-surface border-brand-border hover:bg-brand-lavender/50' 
          : 'bg-brand-purple/5 border-brand-purple/20 hover:bg-brand-purple/10'
      }`}
    >
      {/* Unread Badge Indicator Dot */}
      {!isRead && (
        <span class="w-2.5 h-2.5 rounded-full bg-brand-pink absolute top-4 right-4 shadow-soft-xs" />
      )}

      {/* Actor Avatar with Type Overlay */}
      <div class="relative shrink-0">
        <UserAvatar
          src={actorPhotoURL}
          name={actorDisplayName}
          size="w-10 h-10"
        />
        <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border border-brand-border flex items-center justify-center shadow-soft-xs">
          {getTypeIcon()}
        </div>
      </div>

      {/* Notification Text Content */}
      <div class="min-w-0 flex-1 pr-4">
        <p class="text-xs text-brand-mainText leading-snug">
          <span class="font-bold hover:underline" onClick={(e) => {
            e.stopPropagation();
            if (onSelectProfileUsername && actorUsername) onSelectProfileUsername(actorUsername);
          }}>
            {actorDisplayName || 'Tivora User'}
          </span>{' '}
          <span class="text-brand-mutedText">{message}</span>
        </p>
        <span class="text-[0.68rem] text-brand-purple font-semibold mt-1 inline-block">
          {timeFormatted}
        </span>
      </div>
    </div>
  );
}
