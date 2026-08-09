import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Bell, 
  UserX, 
  User, 
  AlertTriangle, 
  Check, 
  Loader2, 
  Lock 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getUserSettings, updateUserSettings } from '../firebase/settingsService';
import { getBlockedUsers, unblockUser } from '../firebase/blockService';

export default function Settings({ onShowToast }) {
  const { currentUser, userDoc } = useAuth();

  const [activeTab, setActiveTab] = useState('privacy'); // 'privacy' | 'notifications' | 'blocked' | 'account'
  const [privacy, setPrivacy] = useState({
    profileVisibility: 'public',
    searchVisibility: 'everyone',
    friendRequestPermission: 'everyone'
  });
  const [notifSettings, setNotifSettings] = useState({
    friendRequests: true,
    friendAccepted: true,
    likes: true,
    comments: true,
    shares: true,
    messages: true
  });
  const [blockedUsers, setBlockedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      if (!currentUser?.uid) return;
      setLoading(true);

      const [sData, bList] = await Promise.all([
        getUserSettings(currentUser.uid),
        getBlockedUsers(currentUser.uid)
      ]);

      setPrivacy(sData.privacy);
      setNotifSettings(sData.notificationSettings);
      setBlockedUsers(bList);
      setLoading(false);
    }

    loadSettings();
  }, [currentUser?.uid]);

  const handleSavePrivacy = async () => {
    if (!currentUser?.uid || saving) return;
    setSaving(true);

    try {
      await updateUserSettings(currentUser.uid, { privacy });
      if (onShowToast) onShowToast("Privacy settings updated! 🔒");
    } catch (err) {
      if (onShowToast) onShowToast("Failed to save privacy settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    if (!currentUser?.uid || saving) return;
    setSaving(true);

    try {
      await updateUserSettings(currentUser.uid, { notificationSettings: notifSettings });
      if (onShowToast) onShowToast("Notification preferences updated! 🔔");
    } catch (err) {
      if (onShowToast) onShowToast("Failed to save notification preferences.");
    } finally {
      setSaving(false);
    }
  };

  const handleUnblock = async (targetUid, name) => {
    if (!currentUser?.uid) return;
    try {
      await unblockUser(currentUser.uid, targetUid);
      setBlockedUsers(prev => prev.filter(u => u.uid !== targetUid));
      if (onShowToast) onShowToast(`Unblocked ${name}.`);
    } catch (err) {
      if (onShowToast) onShowToast("Failed to unblock user.");
    }
  };

  const handleDeactivateAccount = async () => {
    if (!currentUser?.uid || deactivating) return;
    setDeactivating(true);

    try {
      await updateUserSettings(currentUser.uid, { accountStatus: "deactivated" });
      if (onShowToast) onShowToast("Account deactivated.");
      setShowDeactivateConfirm(false);
      window.location.reload();
    } catch (err) {
      if (onShowToast) onShowToast("Failed to deactivate account.");
    } finally {
      setDeactivating(false);
    }
  };

  return (
    <div class="space-y-6">
      {/* Header Banner */}
      <div class="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-soft-sm space-y-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 rounded-2xl bg-primary-gradient text-white flex items-center justify-center shadow-gradient-glow shrink-0">
            <Shield class="w-6 h-6" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-brand-mainText">Account & Privacy Settings</h2>
            <p class="text-xs text-brand-mutedText mt-0.5">Manage profile visibility, notifications, safety & blocked accounts</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div class="flex items-center gap-2 pt-2 border-t border-brand-border flex-wrap">
          {[
            { id: 'privacy', label: 'Privacy', icon: Lock },
            { id: 'notifications', label: 'Notifications', icon: Bell },
            { id: 'blocked', label: 'Blocked Users', icon: UserX },
            { id: 'account', label: 'Account Safety', icon: Shield }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                class={`px-5 py-2 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'bg-primary-gradient text-white shadow-gradient-glow'
                    : 'bg-brand-lavender text-brand-mutedText hover:text-brand-purple'
                }`}
              >
                <Icon class="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Settings Content */}
      {loading ? (
        <div class="flex justify-center py-16">
          <Loader2 class="w-7 h-7 text-brand-purple animate-spin" />
        </div>
      ) : activeTab === 'privacy' ? (
        <div class="bg-brand-surface rounded-3xl border border-brand-border p-6 shadow-soft-sm space-y-5">
          <h3 class="font-bold text-sm text-brand-mainText">Profile & Discovery Privacy</h3>

          <div class="space-y-4 text-xs">
            <div>
              <label class="block font-bold text-brand-mainText mb-1">Profile Visibility</label>
              <select
                value={privacy.profileVisibility}
                onChange={(e) => setPrivacy(p => ({ ...p, profileVisibility: e.target.value }))}
                class="w-full bg-brand-lavender border border-brand-border rounded-xl p-2.5 text-xs text-brand-mainText outline-none"
              >
                <option value="public">Public (Anyone on Tivora can view profile)</option>
                <option value="friends">Friends Only (Only confirmed friends can view profile)</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-brand-mainText mb-1">Search Visibility</label>
              <select
                value={privacy.searchVisibility}
                onChange={(e) => setPrivacy(p => ({ ...p, searchVisibility: e.target.value }))}
                class="w-full bg-brand-lavender border border-brand-border rounded-xl p-2.5 text-xs text-brand-mainText outline-none"
              >
                <option value="everyone">Everyone can find me in search</option>
                <option value="friends">Friends only</option>
              </select>
            </div>

            <div>
              <label class="block font-bold text-brand-mainText mb-1">Who can send you Friend Requests?</label>
              <select
                value={privacy.friendRequestPermission}
                onChange={(e) => setPrivacy(p => ({ ...p, friendRequestPermission: e.target.value }))}
                class="w-full bg-brand-lavender border border-brand-border rounded-xl p-2.5 text-xs text-brand-mainText outline-none"
              >
                <option value="everyone">Everyone</option>
                <option value="friendsOfFriends">Friends of Friends</option>
              </select>
            </div>
          </div>

          <div class="pt-3 border-t border-brand-border flex justify-end">
            <button
              onClick={handleSavePrivacy}
              disabled={saving}
              class="px-6 py-2.5 bg-primary-gradient text-white font-bold text-xs rounded-full shadow-gradient-glow hover:scale-105 transition-transform flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 class="w-4 h-4 animate-spin" /> : <Check class="w-4 h-4" />}
              <span>Save Privacy Settings</span>
            </button>
          </div>
        </div>
      ) : activeTab === 'notifications' ? (
        <div class="bg-brand-surface rounded-3xl border border-brand-border p-6 shadow-soft-sm space-y-5">
          <h3 class="font-bold text-sm text-brand-mainText">Notification Preferences</h3>

          <div class="space-y-3 text-xs">
            {[
              { id: 'friendRequests', label: 'Friend Requests' },
              { id: 'friendAccepted', label: 'Friend Request Accepted' },
              { id: 'likes', label: 'Post Likes' },
              { id: 'comments', label: 'Comments & Replies' },
              { id: 'shares', label: 'Post Shares' },
              { id: 'messages', label: 'Private Messages' }
            ].map((item) => (
              <label key={item.id} class="flex items-center justify-between p-3 rounded-2xl border border-brand-border hover:bg-brand-lavender/40 cursor-pointer">
                <span class="font-semibold text-brand-mainText">{item.label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(notifSettings[item.id])}
                  onChange={(e) => setNotifSettings(n => ({ ...n, [item.id]: e.target.checked }))}
                  class="w-4 h-4 accent-brand-purple rounded"
                />
              </label>
            ))}
          </div>

          <div class="pt-3 border-t border-brand-border flex justify-end">
            <button
              onClick={handleSaveNotifications}
              disabled={saving}
              class="px-6 py-2.5 bg-primary-gradient text-white font-bold text-xs rounded-full shadow-gradient-glow hover:scale-105 transition-transform flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 class="w-4 h-4 animate-spin" /> : <Check class="w-4 h-4" />}
              <span>Save Notification Preferences</span>
            </button>
          </div>
        </div>
      ) : activeTab === 'blocked' ? (
        <div class="bg-brand-surface rounded-3xl border border-brand-border p-6 shadow-soft-sm space-y-4">
          <h3 class="font-bold text-sm text-brand-mainText">Blocked Accounts ({blockedUsers.length})</h3>

          {blockedUsers.length === 0 ? (
            <p class="text-xs text-brand-mutedText py-6 text-center italic">You haven't blocked any users.</p>
          ) : (
            <div class="space-y-3">
              {blockedUsers.map((u) => (
                <div key={u.uid} class="flex items-center justify-between p-3 rounded-2xl border border-brand-border bg-brand-surface">
                  <div class="flex items-center gap-3">
                    {u.photoURL ? (
                      <img src={u.photoURL} alt={u.displayName} class="w-10 h-10 rounded-full object-cover border border-brand-border" />
                    ) : (
                      <div class="w-10 h-10 rounded-full bg-primary-gradient text-white flex items-center justify-center font-bold text-xs">
                        {u.displayName ? u.displayName[0].toUpperCase() : 'U'}
                      </div>
                    )}
                    <div>
                      <h4 class="font-bold text-xs sm:text-sm text-brand-mainText">{u.displayName}</h4>
                      <p class="text-[0.7rem] text-brand-mutedText">@{u.username}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnblock(u.uid, u.displayName)}
                    class="px-4 py-1.5 rounded-full border border-brand-border text-brand-purple font-semibold text-xs hover:bg-brand-lavender transition-all"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Account Safety & Deactivation */
        <div class="bg-brand-surface rounded-3xl border border-brand-border p-6 shadow-soft-sm space-y-5">
          <h3 class="font-bold text-sm text-brand-mainText">Account Security & Safety</h3>

          <div class="space-y-3 text-xs text-brand-mutedText leading-relaxed">
            <p><span class="font-bold text-brand-mainText">Permanent Username:</span> @{userDoc?.username || 'user'} (Locked)</p>
            <p><span class="font-bold text-brand-mainText">Primary Email:</span> {currentUser?.email}</p>
          </div>

          <div class="pt-4 border-t border-brand-border space-y-3">
            <h4 class="font-bold text-xs text-red-600">Danger Zone</h4>
            <div class="p-4 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-between gap-4">
              <div>
                <p class="font-bold text-xs text-red-700">Deactivate Tivora Account</p>
                <p class="text-[0.68rem] text-red-600">Temporarily deactivate your profile and activity.</p>
              </div>

              <button
                onClick={() => setShowDeactivateConfirm(true)}
                class="px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-full hover:bg-red-700 shadow-soft-xs shrink-0"
              >
                Deactivate
              </button>
            </div>
          </div>

          {/* Deactivation Confirmation Modal */}
          {showDeactivateConfirm && (
            <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div class="bg-brand-surface border border-brand-border rounded-3xl max-w-sm w-full p-6 shadow-soft-lg space-y-4 text-center">
                <AlertTriangle class="w-10 h-10 text-red-500 mx-auto" />
                <h3 class="font-bold text-base text-brand-mainText">Deactivate Account?</h3>
                <p class="text-xs text-brand-mutedText">
                  Your profile and social presence will be marked inactive. You can reactivate anytime by logging back in.
                </p>

                <div class="flex items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => setShowDeactivateConfirm(false)}
                    class="px-4 py-2 font-semibold text-xs text-brand-mutedText hover:underline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeactivateAccount}
                    disabled={deactivating}
                    class="px-5 py-2.5 bg-red-600 text-white font-bold text-xs rounded-full shadow-soft-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {deactivating && <Loader2 class="w-4 h-4 animate-spin" />}
                    <span>Confirm Deactivate</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
