import React, { useState, useEffect } from 'react';
import Stories from '../feed/Stories';
import { upcomingEventsData } from '../../data/mockData';
import UserAvatar from '../common/UserAvatar';
import { useAuth } from '../../hooks/useAuth';
import { getSuggestedUsers, sendFriendRequest } from '../../firebase/friendService';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';

export default function RightSidebar({ onSelectProfileUsername, setActiveScreen, onShowToast }) {
  const { currentUser, userDoc } = useAuth();

  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sentRequests, setSentRequests] = useState({}); // { [targetUid]: boolean }
  const [actionLoading, setActionLoading] = useState({}); // { [targetUid]: boolean }

  useEffect(() => {
    async function loadSuggested() {
      if (currentUser?.uid) {
        setLoading(true);
        const users = await getSuggestedUsers(currentUser.uid, 5);
        setSuggestedUsers(users);
        setLoading(false);
      }
    }

    loadSuggested();
  }, [currentUser?.uid]);

  const handleAddFriend = async (targetUser) => {
    const targetUid = targetUser.uid || targetUser.id;
    if (!currentUser?.uid || !targetUid || actionLoading[targetUid]) return;

    setActionLoading(prev => ({ ...prev, [targetUid]: true }));

    try {
      await sendFriendRequest(currentUser.uid, targetUid, {
        displayName: userDoc?.displayName || currentUser.displayName || 'Tivora User',
        username: userDoc?.username || 'user',
        photoURL: userDoc?.photoURL || currentUser.photoURL || ''
      });

      setSentRequests(prev => ({ ...prev, [targetUid]: true }));
      if (onShowToast) onShowToast(`Friend request sent to ${targetUser.displayName || 'user'}! 🤝`);
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to send friend request.');
    } finally {
      setActionLoading(prev => ({ ...prev, [targetUid]: false }));
    }
  };

  return (
    <aside class="space-y-6 sticky top-28 hidden xl:block">
      {/* Stories Widget Card */}
      <div class="bg-brand-surface rounded-3xl p-5 border border-brand-border shadow-soft-sm">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-brand-mainText text-base">Stories</h3>
          <button 
            onClick={() => onShowToast && onShowToast('Opening Stories lightbox')} 
            class="text-xs font-semibold text-brand-purple hover:underline"
          >
            See All
          </button>
        </div>
        <Stories onShowToast={onShowToast} />
      </div>

      {/* Upcoming Events Card */}
      <div class="bg-brand-surface rounded-3xl p-5 border border-brand-border shadow-soft-sm">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-brand-mainText text-base">Upcoming Events</h3>
          <button 
            onClick={() => onShowToast && onShowToast('Viewing event calendar')} 
            class="text-xs font-semibold text-brand-purple hover:underline"
          >
            See All
          </button>
        </div>
        <div class="space-y-3">
          {upcomingEventsData.map((ev) => (
            <div key={ev.id} class="flex items-center gap-3 p-2 rounded-xl hover:bg-brand-lavender transition-colors cursor-pointer">
              <div class={`w-11 h-11 rounded-xl bg-gradient-to-br ${ev.badgeBg} text-white flex flex-col items-center justify-center font-bold leading-none shadow-soft-sm shrink-0`}>
                <span class="text-sm">{ev.date.split(' ')[1]}</span>
                <span class="text-[0.65rem] uppercase">{ev.date.split(' ')[0]}</span>
              </div>
              <div class="min-w-0 flex-1">
                <h4 class="text-sm font-bold text-brand-mainText truncate">{ev.title}</h4>
                <p class="text-xs text-brand-mutedText truncate mt-0.5">{ev.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Suggested Friends Card */}
      <div class="bg-brand-surface rounded-3xl p-5 border border-brand-border shadow-soft-sm">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-bold text-brand-mainText text-base">Suggested Friends</h3>
          <button 
            onClick={() => setActiveScreen && setActiveScreen('friends')} 
            class="text-xs font-semibold text-brand-purple hover:underline"
          >
            See All
          </button>
        </div>

        {loading ? (
          <div class="py-6 flex items-center justify-center text-brand-purple">
            <Loader2 class="w-5 h-5 animate-spin" />
          </div>
        ) : suggestedUsers.length === 0 ? (
          <div class="py-5 text-center space-y-1">
            <p class="text-xs text-brand-mutedText leading-relaxed">No new friend suggestions right now. Encourage your friends to join Tivora! ✨</p>
          </div>
        ) : (
          <div class="space-y-3">
            {suggestedUsers.map((user) => {
              const uUid = user.uid || user.id;
              const handle = user.username || user.profileId || uUid;
              const isSent = Boolean(sentRequests[uUid]);
              const isBusy = Boolean(actionLoading[uUid]);

              return (
                <div key={uUid} class="flex items-center justify-between gap-2">
                  <div 
                    class="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
                    onClick={() => onSelectProfileUsername && onSelectProfileUsername(handle)}
                  >
                    <UserAvatar
                      src={user.photoURL}
                      name={user.displayName}
                      size="w-10 h-10"
                      className="group-hover:scale-105 transition-transform shrink-0"
                    />
                    <div class="min-w-0 flex-1">
                      <h4 class="text-sm font-bold text-brand-mainText truncate group-hover:text-brand-purple transition-colors">
                        {user.displayName || 'Tivora User'}
                      </h4>
                      <p class="text-xs text-brand-purple font-semibold truncate">@{handle}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => !isSent && handleAddFriend(user)}
                    disabled={isSent || isBusy}
                    class={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                      isSent
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-default'
                        : 'bg-brand-lavender text-brand-purple hover:bg-primary-gradient hover:text-white shadow-soft-xs active:scale-95'
                    }`}
                  >
                    {isBusy ? (
                      <Loader2 class="w-3.5 h-3.5 animate-spin" />
                    ) : isSent ? (
                      <>
                        <UserCheck class="w-3.5 h-3.5" />
                        <span>Sent</span>
                      </>
                    ) : (
                      <>
                        <UserPlus class="w-3.5 h-3.5" />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
