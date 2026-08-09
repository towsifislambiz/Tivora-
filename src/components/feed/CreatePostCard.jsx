import React from 'react';
import { Image, Smile, Activity, BarChart2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import UserAvatar from '../common/UserAvatar';

export default function CreatePostCard({ onOpenCreateModal }) {
  const { currentUser, userDoc } = useAuth();

  const displayName = userDoc?.displayName || currentUser?.displayName || 'Tivora User';
  const firstName = displayName.trim().split(' ')[0];
  const avatarUrl = userDoc?.photoURL || currentUser?.photoURL || null;

  return (
    <div class="bg-brand-surface rounded-3xl p-5 border border-brand-border shadow-soft-sm">
      <div class="flex items-center gap-4 pb-4 border-b border-brand-border">
        <UserAvatar
          src={avatarUrl}
          name={displayName}
          size="w-11 h-11"
        />
        <div
          onClick={onOpenCreateModal}
          class="flex-1 bg-brand-lavender hover:bg-brand-purple/10 border border-transparent rounded-full px-5 py-2.5 text-sm text-brand-mutedText cursor-pointer transition-colors"
        >
          What's on your mind, {firstName}?
        </div>
      </div>

      <div class="flex items-center justify-between pt-3 text-xs font-medium text-brand-mutedText flex-wrap gap-2">
        <button onClick={onOpenCreateModal} class="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-brand-lavender hover:text-brand-purple transition-colors">
          <Image class="w-4 h-4 text-brand-purple" />
          <span>Photo/Video</span>
        </button>
        <button onClick={onOpenCreateModal} class="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-brand-lavender hover:text-brand-purple transition-colors">
          <Smile class="w-4 h-4 text-amber-500" />
          <span>Feelings</span>
        </button>
        <button onClick={onOpenCreateModal} class="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-brand-lavender hover:text-brand-purple transition-colors">
          <Activity class="w-4 h-4 text-brand-blue" />
          <span>Activity</span>
        </button>
        <button onClick={onOpenCreateModal} class="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-brand-lavender hover:text-brand-purple transition-colors">
          <BarChart2 class="w-4 h-4 text-brand-pink" />
          <span>Poll</span>
        </button>
      </div>
    </div>
  );
}
