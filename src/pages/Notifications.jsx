import React, { useState } from 'react';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useRealtime } from '../hooks/useRealtime';
import { 
  markNotificationAsRead, 
  markAllNotificationsAsRead 
} from '../firebase/notificationService';
import NotificationItem from '../components/notifications/NotificationItem';

export default function Notifications({ onSelectProfileUsername, onSelectPostId, setActiveScreen, onShowToast }) {
  const { currentUser } = useAuth();
  const { 
    notifications: liveNotifications, 
    markNotificationRead, 
    markAllNotificationsRead 
  } = useRealtime();

  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const [markingAll, setMarkingAll] = useState(false);

  // Filter notifications based on active tab ('all' vs 'unread') & exclude chat messages
  const displayNotifications = (liveNotifications || [])
    .filter(n => n.type !== 'message' && n.type !== 'chat')
    .filter(n => activeTab === 'all' || !n.isRead);

  const handleNotificationClick = async (notif) => {
    if (!currentUser?.uid) return;

    if (!notif.isRead) {
      markNotificationAsRead(notif.id, currentUser.uid);
      markNotificationRead(notif.id);
    }

    // Navigate to target URL or profile/post
    if (notif.postId) {
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
      markAllNotificationsRead();
      if (onShowToast) onShowToast("All notifications marked as read! 🔔");
    } catch (err) {
      if (onShowToast) onShowToast("Failed to mark all as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-soft-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-gradient text-white flex items-center justify-center shadow-gradient-glow shrink-0">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-mainText">Notifications</h2>
              <p className="text-xs text-brand-mutedText mt-0.5">Stay updated with activity around your posts & account</p>
            </div>
          </div>

          <button
            onClick={handleMarkAllAsReadClick}
            disabled={markingAll}
            className="px-4 py-2 rounded-full border border-brand-border text-brand-purple hover:bg-brand-lavender font-semibold text-xs transition-all flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50"
          >
            {markingAll ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
            <span>Mark all as read</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-brand-border">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-5 py-2 rounded-full font-bold text-xs transition-all ${
              activeTab === 'all'
                ? 'bg-primary-gradient text-white shadow-gradient-glow'
                : 'bg-brand-lavender text-brand-mutedText hover:text-brand-purple'
            }`}
          >
            All ({liveNotifications.filter(n => n.type !== 'message' && n.type !== 'chat').length})
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={`px-5 py-2 rounded-full font-bold text-xs transition-all ${
              activeTab === 'unread'
                ? 'bg-primary-gradient text-white shadow-gradient-glow'
                : 'bg-brand-lavender text-brand-mutedText hover:text-brand-purple'
            }`}
          >
            Unread ({liveNotifications.filter(n => n.type !== 'message' && n.type !== 'chat' && !n.isRead).length})
          </button>
        </div>
      </div>

      {/* Notifications List Body */}
      {displayNotifications.length === 0 ? (
        <div className="bg-brand-surface rounded-3xl p-12 border border-brand-border shadow-soft-sm text-center flex flex-col items-center justify-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-brand-lavender text-brand-purple flex items-center justify-center mb-1">
            <Bell className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-lg text-brand-mainText">You're all caught up</h3>
          <p className="text-xs text-brand-mutedText max-w-xs">
            {activeTab === 'unread' ? 'No unread notifications right now.' : 'New activity will appear here when people interact with you.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayNotifications.map((notif) => (
            <NotificationItem
              key={notif.id}
              notification={notif}
              onClick={() => handleNotificationClick(notif)}
              onSelectProfileUsername={onSelectProfileUsername}
              onShowToast={onShowToast}
            />
          ))}
        </div>
      )}
    </div>
  );
}
