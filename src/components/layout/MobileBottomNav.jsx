import React, { useEffect, useState } from 'react';
import { Home, Compass, Plus, MessageSquare, Bell, User } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { subscribeToUserNotifications } from '../../firebase/notificationService';
import { subscribeToUserConversations } from '../../firebase/messageService';

export default function MobileBottomNav({ activeScreen, setActiveScreen, onOpenCreateModal }) {
  const { currentUser } = useAuth();
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);

  // Subscriptions for real-time badges
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubNotifs = subscribeToUserNotifications(currentUser.uid, ({ unreadCount }) => {
      setUnreadNotifCount(unreadCount || 0);
    });

    const unsubMsgs = subscribeToUserConversations(currentUser.uid, ({ totalUnread }) => {
      setUnreadMsgCount(totalUnread || 0);
    });

    return () => {
      unsubNotifs();
      unsubMsgs();
    };
  }, [currentUser?.uid]);

  // Native Mobile UX: Hide bottom nav dock when inside an active chat window
  if (activeScreen === 'messages' && typeof window !== 'undefined' && (window.location.hash.includes('?user=') || window.location.hash.includes('?conversation='))) {
    return null;
  }

  const items = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'fab_create', label: 'Create', isFab: true },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMsgCount },
    { id: 'notifications', label: 'Notifs', icon: Bell, badge: unreadNotifCount },
  ];

  return (
    <div className="fixed bottom-3 left-3 right-3 z-40 lg:hidden pointer-events-none mb-safe mobile-bottom-dock">
      <nav
        className="pointer-events-auto bg-white/85 backdrop-blur-xl border border-white/60 shadow-2xl rounded-3xl px-2 py-1.5 flex items-center justify-around relative transition-all"
        role="navigation"
        aria-label="Mobile bottom navigation"
      >
        {items.map((item) => {
          if (item.isFab) {
            return (
              <button
                key="fab"
                onClick={() => onOpenCreateModal && onOpenCreateModal()}
                className="w-12 h-12 rounded-full bg-primary-gradient text-white flex items-center justify-center shadow-gradient-glow hover:scale-110 active:scale-95 transition-transform shrink-0 -mt-5 border-4 border-white"
                aria-label="Create Post"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
            );
          }

          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          const badgeCount = item.badge || 0;

          return (
            <button
              key={item.id}
              onClick={() => setActiveScreen(item.id)}
              className={`flex flex-col items-center justify-center gap-0.5 min-w-[52px] min-h-[48px] rounded-2xl relative transition-all touch-manipulation ${
                isActive ? 'text-brand-purple font-extrabold' : 'text-brand-mutedText hover:text-brand-mainText'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active Sliding Background Pill */}
              {isActive && (
                <span className="absolute inset-0 bg-brand-lavender/70 rounded-2xl -z-10 animate-fadeIn" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-brand-pink text-white text-[0.6rem] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <span className="text-[0.65rem] leading-none font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
