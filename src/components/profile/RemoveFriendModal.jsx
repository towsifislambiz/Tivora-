import React, { useState } from 'react';
import { UserX, Loader2 } from 'lucide-react';
import { removeFriend } from '../../firebase/friendService';

export default function RemoveFriendModal({ isOpen, friendshipId, currentUid, friendName, onClose, onFriendRemoved, onShowToast }) {
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleRemove = async () => {
    if (!friendshipId || !currentUid) return;
    setError('');
    setRemoving(true);

    try {
      await removeFriend(friendshipId, currentUid);
      if (onShowToast) onShowToast(`Removed ${friendName || 'user'} from your friends.`);
      if (onFriendRemoved) onFriendRemoved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to remove friend.');
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div class="fixed inset-0 z-50 bg-brand-mainText/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div class="bg-brand-surface rounded-3xl w-full max-w-sm shadow-soft-lg border border-brand-border p-6 space-y-4 animate-in fade-in zoom-in duration-200 text-center">
        <div class="w-14 h-14 rounded-full bg-red-50 text-red-500 inline-flex items-center justify-center">
          <UserX class="w-7 h-7" />
        </div>

        <h3 class="font-bold text-lg text-brand-mainText">Remove {friendName || 'Friend'}?</h3>
        <p class="text-xs text-brand-mutedText max-w-xs mx-auto leading-relaxed">
          Are you sure you want to remove {friendName || 'this user'} from your friends? You can send a new friend request later.
        </p>

        {error && (
          <p class="text-xs text-red-500 font-semibold">{error}</p>
        )}

        <div class="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={removing}
            class="px-5 py-2.5 rounded-full border border-brand-border text-brand-mainText font-semibold text-xs hover:bg-brand-lavender"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={removing}
            class="px-6 py-2.5 rounded-full bg-red-500 text-white font-bold text-xs shadow-soft-sm hover:bg-red-600 transition-colors inline-flex items-center gap-2"
          >
            {removing ? (
              <>
                <Loader2 class="w-4 h-4 animate-spin" />
                <span>Removing...</span>
              </>
            ) : (
              <span>Remove Friend</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
