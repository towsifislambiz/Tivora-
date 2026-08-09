import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  MoreHorizontal, 
  Edit3, 
  Link as LinkIcon, 
  Check, 
  UserPlus, 
  UserCheck, 
  UserX, 
  Loader2, 
  X,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import UserAvatar from '../common/UserAvatar';
import { 
  getFriendshipStatus, 
  sendFriendRequest, 
  acceptFriendRequest, 
  declineFriendRequest, 
  cancelFriendRequest, 
  getCanonicalFriendshipId 
} from '../../firebase/friendService';
import RemoveFriendModal from './RemoveFriendModal';

export default function ProfileHeader({ profile, isOwner, onOpenEditModal, onShowToast }) {
  const { currentUser } = useAuth();

  const [copied, setCopied] = useState(false);
  const [relationshipStatus, setRelationshipStatus] = useState('none'); // 'self' | 'none' | 'pending_sent' | 'pending_received' | 'friends'
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [pendingAction, setPendingAction] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);

  const displayName = profile?.displayName || 'Tivora User';
  const usernameClean = profile?.username || profile?.profileId || 'user';
  const username = `@${usernameClean}`;
  const bio = profile?.bio || 'Building cool digital experiences with Tivora 🚀';
  const location = profile?.location || 'Dhaka, Bangladesh';
  const avatarUrl = profile?.photoURL;
  const coverUrl = profile?.coverPhotoURL || profile?.coverURL;
  const targetUid = profile?.uid;

  const friendshipId = (currentUser?.uid && targetUid && currentUser.uid !== targetUid)
    ? getCanonicalFriendshipId(currentUser.uid, targetUid)
    : null;

  const getInitials = (name) => {
    if (!name) return 'TV';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Fetch live relationship status
  useEffect(() => {
    async function checkStatus() {
      if (!currentUser?.uid || !targetUid) return;
      if (currentUser.uid === targetUid || isOwner) {
        setRelationshipStatus('self');
        return;
      }
      setLoadingStatus(true);
      const status = await getFriendshipStatus(currentUser.uid, targetUid);
      setRelationshipStatus(status);
      setLoadingStatus(false);
    }

    checkStatus();
  }, [currentUser?.uid, targetUid, isOwner]);

  const handleCopyProfileLink = () => {
    const profileUrl = `${window.location.origin}/#profile/${usernameClean}`;
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    if (onShowToast) onShowToast(`Profile link copied! 📋 (${profileUrl})`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenMessage = () => {
    window.location.hash = `#messages?user=${usernameClean}`;
  };

  // Action: Add Friend
  const handleAddFriendClick = async () => {
    if (!currentUser?.uid || !targetUid || pendingAction) return;
    setPendingAction(true);
    setRelationshipStatus('pending_sent');

    try {
      await sendFriendRequest(currentUser.uid, targetUid, {
        displayName: currentUser.displayName || 'Tivora User',
        username: usernameClean,
        photoURL: currentUser.photoURL || ''
      });
      if (onShowToast) onShowToast(`Friend request sent to ${displayName}! 🤝`);
    } catch (err) {
      setRelationshipStatus('none');
      if (onShowToast) onShowToast(err.message || 'Failed to send request.');
    } finally {
      setPendingAction(false);
    }
  };

  // Action: Accept Request
  const handleAcceptClick = async () => {
    if (!currentUser?.uid || !friendshipId || pendingAction) return;
    setPendingAction(true);
    setRelationshipStatus('friends');

    try {
      await acceptFriendRequest(friendshipId, currentUser.uid, {
        displayName: currentUser.displayName || 'Tivora User',
        username: usernameClean,
        photoURL: currentUser.photoURL || ''
      });
      if (onShowToast) onShowToast(`You and ${displayName} are now friends! 🎉`);
    } catch (err) {
      setRelationshipStatus('pending_received');
      if (onShowToast) onShowToast(err.message || 'Failed to accept request.');
    } finally {
      setPendingAction(false);
    }
  };

  // Action: Decline Request
  const handleDeclineClick = async () => {
    if (!currentUser?.uid || !friendshipId || pendingAction) return;
    setPendingAction(true);
    setRelationshipStatus('none');

    try {
      await declineFriendRequest(friendshipId, currentUser.uid);
      if (onShowToast) onShowToast(`Declined friend request.`);
    } catch (err) {
      setRelationshipStatus('pending_received');
      if (onShowToast) onShowToast(err.message || 'Failed to decline request.');
    } finally {
      setPendingAction(false);
    }
  };

  // Action: Cancel Request
  const handleCancelRequestClick = async () => {
    if (!currentUser?.uid || !friendshipId || pendingAction) return;
    setPendingAction(true);
    setRelationshipStatus('none');

    try {
      await cancelFriendRequest(friendshipId, currentUser.uid);
      if (onShowToast) onShowToast(`Friend request cancelled.`);
    } catch (err) {
      setRelationshipStatus('pending_sent');
      if (onShowToast) onShowToast(err.message || 'Failed to cancel request.');
    } finally {
      setPendingAction(false);
    }
  };

  return (
    <div class="bg-brand-surface rounded-3xl border border-brand-border shadow-soft-sm overflow-hidden">
      {/* Cover Banner */}
      <div class="h-48 sm:h-64 relative bg-cover-gradient">
        {coverUrl ? (
          <img src={coverUrl} alt="Cover" class="w-full h-full object-cover" />
        ) : (
          <div class="w-full h-full bg-cover-gradient opacity-90" />
        )}
      </div>

      {/* Profile Header Content */}
      <div class="px-6 sm:px-8 pb-6 relative">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 mb-6 gap-4">
          <div class="relative">
            <UserAvatar
              src={avatarUrl}
              name={displayName}
              size="w-28 h-28 sm:w-32 sm:h-32"
              className="border-4 border-white shadow-soft-md"
            />
            <div class="absolute bottom-2 right-2 w-4 h-4 rounded-full bg-brand-success border-2 border-white" />
          </div>

          <div class="flex items-center gap-3 flex-wrap relative">
            {/* Shareable Profile Link Button */}
            <button
              onClick={handleCopyProfileLink}
              class="px-4 py-2.5 rounded-full border border-brand-border bg-white text-brand-purple font-semibold text-xs hover:bg-brand-lavender transition-all flex items-center gap-1.5 shadow-soft-sm"
              title="Copy Permanent Profile Link"
            >
              {copied ? (
                <>
                  <Check class="w-3.5 h-3.5 text-emerald-500" />
                  <span class="text-emerald-600 font-bold">Link Copied!</span>
                </>
              ) : (
                <>
                  <LinkIcon class="w-3.5 h-3.5" />
                  <span>Copy Profile Link</span>
                </>
              )}
            </button>

            {/* Relationship Action Buttons */}
            {isOwner || relationshipStatus === 'self' ? (
              <button
                onClick={onOpenEditModal}
                class="px-6 py-2.5 rounded-full bg-primary-gradient text-white font-semibold text-sm shadow-gradient-glow hover:scale-105 transition-transform flex items-center gap-2"
              >
                <Edit3 class="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            ) : relationshipStatus === 'none' ? (
              <button
                onClick={handleAddFriendClick}
                disabled={pendingAction}
                class="px-6 py-2.5 rounded-full bg-primary-gradient text-white font-semibold text-sm shadow-gradient-glow hover:scale-105 transition-transform flex items-center gap-2 disabled:opacity-50"
              >
                {pendingAction ? (
                  <>
                    <Loader2 class="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <UserPlus class="w-4 h-4" />
                    <span>Add Friend</span>
                  </>
                )}
              </button>
            ) : relationshipStatus === 'pending_sent' ? (
              <div class="flex items-center gap-2">
                <button
                  class="px-5 py-2.5 rounded-full bg-brand-lavender text-brand-purple border border-brand-purple/20 font-semibold text-sm transition-all flex items-center gap-2"
                >
                  <UserCheck class="w-4 h-4 text-brand-purple" />
                  <span>Requested</span>
                </button>
                <button
                  onClick={handleCancelRequestClick}
                  disabled={pendingAction}
                  class="px-4 py-2.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 font-semibold text-xs transition-all flex items-center gap-1.5"
                  title="Cancel Request"
                >
                  <X class="w-3.5 h-3.5" />
                  <span>Cancel Request</span>
                </button>
              </div>
            ) : relationshipStatus === 'pending_received' ? (
              <div class="flex items-center gap-2">
                <button
                  onClick={handleAcceptClick}
                  disabled={pendingAction}
                  class="px-5 py-2.5 rounded-full bg-emerald-500 text-white font-bold text-sm shadow-soft-sm hover:bg-emerald-600 transition-all flex items-center gap-1.5"
                >
                  {pendingAction ? <Loader2 class="w-4 h-4 animate-spin" /> : <UserCheck class="w-4 h-4" />}
                  <span>Accept</span>
                </button>
                <button
                  onClick={handleDeclineClick}
                  disabled={pendingAction}
                  class="px-4 py-2.5 rounded-full border border-brand-border text-brand-mainText font-semibold text-xs hover:bg-brand-lavender transition-all"
                >
                  Decline
                </button>
              </div>
            ) : relationshipStatus === 'friends' ? (
              <div class="flex items-center gap-2">
                <button
                  onClick={() => setIsRemoveModalOpen(true)}
                  class="px-5 py-2.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 font-semibold text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all flex items-center gap-2 group"
                >
                  <UserCheck class="w-4 h-4 group-hover:hidden" />
                  <UserX class="w-4 h-4 hidden group-hover:block" />
                  <span class="group-hover:hidden">Friends</span>
                  <span class="hidden group-hover:inline">Remove Friend</span>
                </button>

                <button
                  onClick={handleOpenMessage}
                  class="px-5 py-2.5 rounded-full bg-primary-gradient text-white font-bold text-sm shadow-gradient-glow hover:scale-105 transition-transform flex items-center gap-1.5"
                >
                  <MessageSquare class="w-4 h-4" />
                  <span>Message</span>
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Identity & Bio */}
        <div class="space-y-3 mb-6">
          <div class="flex items-center gap-2">
            <h1 class="text-2xl font-bold text-brand-mainText">{displayName}</h1>
            <CheckCircle2 class="w-5 h-5 text-brand-blue fill-brand-blue" />
          </div>
          <p class="text-xs font-bold text-brand-purple">{username}</p>
          <p class="text-sm text-brand-mainText max-w-2xl leading-relaxed">{bio}</p>
          <div class="flex items-center gap-6 text-xs text-brand-mutedText pt-1">
            <div class="flex items-center gap-1.5">
              <MapPin class="w-4 h-4" />
              <span>{location}</span>
            </div>
            <div class="flex items-center gap-1.5">
              <Calendar class="w-4 h-4" />
              <span>Joined Tivora</span>
            </div>
          </div>
        </div>
      </div>

      {/* Remove Friend Confirmation Modal */}
      {isRemoveModalOpen && (
        <RemoveFriendModal
          isOpen={isRemoveModalOpen}
          friendshipId={friendshipId}
          currentUid={currentUser?.uid}
          friendName={displayName}
          onClose={() => setIsRemoveModalOpen(false)}
          onFriendRemoved={() => setRelationshipStatus('none')}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}
