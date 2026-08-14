import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { subscribeToUserNotifications } from '../firebase/notificationService';
import { subscribeToUserConversations } from '../firebase/messageService';
import { getFriends, subscribeToIncomingFriendRequests } from '../firebase/friendService';

export const RealtimeContext = createContext(null);

/**
 * Single source of truth for the app's live badge data.
 *
 * Sidebar, Topbar, GlassDock and MobileBottomNav all render the same unread
 * counts. Previously each opened its own onSnapshot pair, so one signed-in
 * session held eight streaming Firestore channels for two distinct queries —
 * every write fanned out to four listeners and re-rendered four subtrees.
 * Subscribing once here and fanning out through context collapses that to two.
 */
export function RealtimeProvider({ children }) {
  const { currentUser } = useAuth();
  const uid = currentUser?.uid;

  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [conversations, setConversations] = useState([]);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  const [friends, setFriends] = useState([]);
  const [pendingFriendRequestsCount, setPendingFriendRequestsCount] = useState(0);

  useEffect(() => {
    if (!uid) {
      setNotifications([]);
      setUnreadNotifCount(0);
      setConversations([]);
      setUnreadMsgCount(0);
      setFriends([]);
      setPendingFriendRequestsCount(0);
      return undefined;
    }

    let isMounted = true;

    const unsubNotifs = subscribeToUserNotifications(uid, ({ notifications: list, unreadCount }) => {
      if (!isMounted) return;
      setNotifications(list || []);
      setUnreadNotifCount(unreadCount || 0);
    });

    const unsubMsgs = subscribeToUserConversations(uid, ({ conversations: list, totalUnread }) => {
      if (!isMounted) return;
      setConversations(list || []);
      setUnreadMsgCount(totalUnread || 0);
    });

    const unsubFriendReqs = subscribeToIncomingFriendRequests(uid, (count) => {
      if (!isMounted) return;
      setPendingFriendRequestsCount(count || 0);
    });

    // Friends are fetched once rather than per-consumer; Topbar merges them
    // into its conversation list so you can start a chat with someone you
    // have never messaged.
    getFriends(uid, 50)
      .then(({ friends: list }) => {
        if (isMounted) setFriends(list || []);
      })
      .catch(() => {
        if (isMounted) setFriends([]);
      });

    return () => {
      isMounted = false;
      unsubNotifs();
      unsubMsgs();
      unsubFriendReqs();
    };
  }, [uid]);

  /** Optimistic local read-marking so badges respond instantly. */
  const markNotificationRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId && !n.isRead ? { ...n, isRead: true } : n))
    );
    setUnreadNotifCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadNotifCount(0);
  }, []);

  // Conversations plus any friend you haven't messaged yet, so the Messenger
  // dropdown always has someone to talk to.
  const recentConversations = useMemo(() => {
    const existing = new Set(conversations.map((c) => c.partner?.uid).filter(Boolean));
    const synthetic = friends
      .filter((f) => f.uid !== uid && !existing.has(f.uid))
      .map((f) => ({
        id: `friend_${f.uid}`,
        partner: f,
        lastMessage: 'Start a conversation 👋',
        lastMessageAt: f.acceptedAt || null,
        isUnread: false,
        isSynthetic: true,
      }));
    return [...conversations, ...synthetic];
  }, [conversations, friends, uid]);

  const value = useMemo(
    () => ({
      notifications,
      unreadNotifCount,
      conversations,
      recentConversations,
      unreadMsgCount,
      friends,
      pendingFriendRequestsCount,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [
      notifications,
      unreadNotifCount,
      conversations,
      recentConversations,
      unreadMsgCount,
      friends,
      pendingFriendRequestsCount,
      markNotificationRead,
      markAllNotificationsRead,
    ]
  );

  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
}
