import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Loader2, Filter } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../firebase/notificationService';
import NotificationItem from '../components/notifications/NotificationItem';

export default function Notifications({ onSelectProfileUsername, onSelectPostId, setActiveScreen, onShowToast }) {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastDocSnap, setLastDocSnap] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      if (!currentUser?.uid) return;
      setLoading(true);
      const isUnreadFilter = activeTab === 'unread';

      const { notifications: fetched, lastDocSnap: newLastDoc } = await getUserNotifications(
        currentUser.uid, 
        20, 
        null, 
        isUnreadFilter
      );

      setNotifications(fetched);
      setLastDocSnap(newLastDoc);
      setHasMore(Boolean(fetched.length >= 20));
      setLoading(false);
    }

    loadNotifications();
  }, [currentUser?.uid, activeTab]);

  const handleLoadMore = async () => {
    if (!lastDocSnap || loadingMore || !currentUser?.uid) return;
    setLoadingMore(true);
    const isUnreadFilter = activeTab === 'unread';

    const { notifications: newNotifs, lastDocSnap: nextLastDoc } = await getUserNotifications(
      currentUser.uid, 
      20, 
      lastDocSnap, 
      isUnreadFilter
    );

    if (newNotifs.length > 0) {
      setNotifications(prev => [...prev, ...newNotifs]);
      setLastDocSnap(nextLastDoc);
      if (newNotifs.length < 20) setHasMore(false);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  const handleNotificationClick = async (notif) => {
    if (!currentUser?.uid) return;

    if (!notif.isRead) {
      markNotificationAsRead(notif.id, currentUser.uid);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
    }

    // Navigate to target URL or profile/post/chat
    if (notif.type === 'message' || notif.type === 'chat') {
      window.location.hash = `#messages?user=${notif.actorUsername}`;
      if (setActiveScreen) setActiveScreen('messages');
    } else if (notif.postId) {
      if (onSelectPostId) onSelectPostId(notif.postId);
      if (setActiveScreen) setActiveScreen('post_detail');
      window.location.hash = `#post/${notif.postId}`;
    } else if (notif.actorUsername) {
      if (onSelectProfileUsername) onSelectProfileUsername(notif.actorUsername);
      if (setActiveScreen) setActiveScreen('profile');
      window.location.hash = `#profile/${notif.actorUsername}`;
    }
  };

  const handleMarkAllAsReadClick = async () => {
    if (!currentUser?.uid || markingAll) return;
    setMarkingAll(true);

    try {
      await markAllNotificationsAsRead(currentUser.uid);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      if (onShowToast) onShowToast("All notifications marked as read! 🔔");
    } catch (err) {
      if (onShowToast) onShowToast("Failed to mark all as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div class="space-y-6">
      {/* Header Banner */}
      <div class="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-soft-sm space-y-4">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-2xl bg-primary-gradient text-white flex items-center justify-center shadow-gradient-glow shrink-0">
              <Bell class="w-6 h-6" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-brand-mainText">Notifications</h2>
              <p class="text-xs text-brand-mutedText mt-0.5">Stay updated with activity around your posts & account</p>
            </div>
          </div>

          <button
            onClick={handleMarkAllAsReadClick}
            disabled={markingAll}
            class="px-4 py-2 rounded-full border border-brand-border text-brand-purple hover:bg-brand-lavender font-semibold text-xs transition-all flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
          >
            {markingAll ? <Loader2 class="w-3.5 h-3.5 animate-spin" /> : <CheckCheck class="w-3.5 h-3.5" />}
            <span>Mark all as read</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div class="flex items-center gap-2 pt-2 border-t border-brand-border">
          <button
            onClick={() => setActiveTab('all')}
            class={`px-5 py-2 rounded-full font-bold text-xs transition-all ${
              activeTab === 'all'
                ? 'bg-primary-gradient text-white shadow-gradient-glow'
                : 'bg-brand-lavender text-brand-mutedText hover:text-brand-purple'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            class={`px-5 py-2 rounded-full font-bold text-xs transition-all ${
              activeTab === 'unread'
                ? 'bg-primary-gradient text-white shadow-gradient-glow'
                : 'bg-brand-lavender text-brand-mutedText hover:text-brand-purple'
            }`}
          >
            Unread
          </button>
        </div>
      </div>

      {/* Notifications List Body */}
      {loading ? (
        <div class="space-y-3">
          {[1, 2, 3].map(n => (
            <div key={n} class="bg-brand-surface rounded-2xl p-4 border border-brand-border shadow-soft-sm animate-pulse flex items-center gap-3">
              <div class="w-10 h-10 bg-brand-lavender rounded-full shrink-0" />
              <div class="space-y-2 flex-1">
                <div class="w-48 h-4 bg-brand-lavender rounded" />
                <div class="w-20 h-3 bg-brand-lavender rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div class="bg-brand-surface rounded-3xl p-12 border border-brand-border shadow-soft-sm text-center flex flex-col items-center justify-center space-y-3">
          <div class="w-14 h-14 rounded-full bg-brand-lavender text-brand-purple flex items-center justify-center mb-1">
            <Bell class="w-7 h-7" />
          </div>
          <h3 class="font-bold text-lg text-brand-mainText">You're all caught up</h3>
          <p class="text-xs text-brand-mutedText max-w-xs">
            {activeTab === 'unread' ? 'No unread notifications right now.' : 'New activity will appear here when people interact with you.'}
          </p>
        </div>
      ) : (
        <div class="space-y-3">
          {notifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onClick={() => handleNotificationClick(notif)}
              onSelectProfileUsername={onSelectProfileUsername}
              onShowToast={onShowToast}
            />
          ))}

          {hasMore && (
            <div class="text-center pt-3 pb-6">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                class="px-6 py-2.5 rounded-full bg-brand-surface border border-brand-border text-brand-purple font-semibold text-xs hover:bg-brand-lavender transition-all shadow-soft-xs inline-flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <Loader2 class="w-4 h-4 animate-spin" />
                    <span>Loading notifications...</span>
                  </>
                ) : (
                  <span>Load More Notifications</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
