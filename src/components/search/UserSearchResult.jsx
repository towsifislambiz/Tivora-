import React, { useState, useEffect } from 'react';
import { ArrowRight, UserPlus, UserCheck, CheckCircle2, Loader2, MessageSquare } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getFriendshipStatus, sendFriendRequest } from '../../firebase/friendService';
import UserAvatar from '../common/UserAvatar';

export default function UserSearchResult({ user, onSelectUser, onClose, onShowToast }) {
  const { currentUser } = useAuth();

  const [status, setStatus] = useState('none');
  const [loadingAction, setLoadingAction] = useState(false);

  const displayName = user?.displayName || 'Tivora User';
  const usernameClean = user?.username || user?.profileId || user?.uid || 'user';
  const username = `@${usernameClean}`;
  const bio = user?.bio || 'Tivora community member';
  const avatarUrl = user?.photoURL || null;
  const targetUid = user?.uid;

  useEffect(() => {
    async function checkStatus() {
      if (!currentUser?.uid || !targetUid) return;
      if (currentUser.uid === targetUid) {
        setStatus('self');
        return;
      }
      const currentStatus = await getFriendshipStatus(currentUser.uid, targetUid);
      setStatus(currentStatus);
    }

    checkStatus();
  }, [currentUser?.uid, targetUid]);

  if (!user) return null;

  const handleAddFriendClick = async (e) => {
    e.stopPropagation();
    if (!currentUser?.uid || !targetUid || loadingAction) return;
    setLoadingAction(true);
    setStatus('pending_sent');

    try {
      await sendFriendRequest(currentUser.uid, targetUid);
      if (onShowToast) onShowToast(`Friend request sent to ${displayName}! 🤝`);
    } catch (err) {
      setStatus('none');
      if (onShowToast) onShowToast(err.message || 'Failed to send request.');
    } finally {
      setLoadingAction(false);
    }
  };

  const handleMessageClick = (e) => {
    e.stopPropagation();
    if (onClose) onClose();
    window.location.hash = `#messages?user=${usernameClean}`;
  };

  const handleProfileClick = () => {
    if (onSelectUser) onSelectUser(user?.username || user?.profileId || user?.uid);
    if (onClose) onClose();
  };

  return (
    <div class="bg-brand-surface border border-brand-border rounded-2xl p-4 shadow-soft-lg animate-in fade-in zoom-in-95 duration-150 space-y-3">
      <div class="flex items-center gap-3">
        <UserAvatar
          src={avatarUrl}
          name={displayName}
          size="w-12 h-12"
          className="border-2 border-brand-purple"
        />

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5">
            <h4 class="font-bold text-xs sm:text-sm text-brand-mainText truncate">{displayName}</h4>
            <CheckCircle2 class="w-3.5 h-3.5 text-brand-blue fill-brand-blue shrink-0" />
          </div>
          <p class="text-xs font-semibold text-brand-purple truncate">{username}</p>
        </div>
      </div>

      <p class="text-xs text-brand-mutedText line-clamp-2 leading-relaxed">{bio}</p>

      <div class="flex items-center gap-2 pt-1">
        <button
          onClick={handleProfileClick}
          class="flex-1 py-2 px-3 rounded-full bg-brand-lavender text-brand-purple font-semibold text-xs hover:bg-primary-gradient hover:text-white transition-all flex items-center justify-center gap-1.5"
        >
          <span>Profile</span>
          <ArrowRight class="w-3.5 h-3.5" />
        </button>

        {status === 'none' && (
          <button
            onClick={handleAddFriendClick}
            disabled={loadingAction}
            class="px-3.5 py-2 rounded-full bg-primary-gradient text-white font-bold text-xs shadow-soft-xs hover:scale-105 transition-transform flex items-center gap-1 shrink-0 disabled:opacity-50"
          >
            {loadingAction ? <Loader2 class="w-3.5 h-3.5 animate-spin" /> : <UserPlus class="w-3.5 h-3.5" />}
            <span>Add</span>
          </button>
        )}

        {status === 'pending_sent' && (
          <span class="px-3 py-1.5 rounded-full bg-brand-lavender text-brand-purple font-semibold text-xs border border-brand-purple/20 flex items-center gap-1 shrink-0">
            <UserCheck class="w-3.5 h-3.5" />
            <span>Requested</span>
          </span>
        )}

        {status === 'friends' && (
          <button
            onClick={handleMessageClick}
            class="px-3.5 py-2 rounded-full bg-primary-gradient text-white font-bold text-xs shadow-soft-xs hover:scale-105 transition-transform flex items-center gap-1 shrink-0"
          >
            <MessageSquare class="w-3.5 h-3.5" />
            <span>Message</span>
          </button>
        )}
      </div>
    </div>
  );
}
