import React, { useEffect, useState } from 'react';
import { Home, Compass, Plus, MessageSquare, Bell, User } from 'lucide-react';
import { useRealtime } from '../../hooks/useRealtime';
import GlassSurface from '../ui/GlassSurface';

function detectChatActive(activeScreen) {
  if (typeof window === 'undefined' || activeScreen !== 'messages') return false;
  const hash = window.location.hash;
  return (
    hash.includes('?user=') ||
    hash.includes('?conversation=') ||
    !!document.querySelector('.chat-window-active')
  );
}

export default function MobileBottomNav({ activeScreen, setActiveScreen, onOpenCreateModal }) {
  const { unreadNotifCount, unreadMsgCount } = useRealtime();

  const [isChatActive, setIsChatActive] = useState(() => detectChatActive(activeScreen));

  useEffect(() => {
    const check = () => setIsChatActive(detectChatActive(activeScreen));
    check();

    window.addEventListener('hashchange', check);

    // The chat window is mounted by another subtree, so there is no prop to
    // react to. This used to poll document.querySelector every 100ms for the
    // whole session; a MutationObserver scoped to child-list changes does the
    // same job and stays idle when nothing mounts.
    let observer;
    if (activeScreen === 'messages') {
      observer = new MutationObserver(check);
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      window.removeEventListener('hashchange', check);
      if (observer) observer.disconnect();
    };
  }, [activeScreen]);

  // Native Mobile UX: Hide bottom nav dock when inside an active chat window
  if (isChatActive) {
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
    <GlassSurface
      className="fixed bottom-4 inset-x-0 h-20 z-40 lg:hidden mb-safe mobile-bottom-dock"
      cornerRadius={30}
      padding="6px 10px"
      displacementScale={58}
      blurAmount={0.45}
      saturation={165}
      aberrationIntensity={2}
      elasticity={0.16}
    >
      <nav
        className="flex items-center justify-around gap-1 w-[min(92vw,420px)]"
        role="navigation"
        aria-label="Mobile bottom navigation"
      >
        {items.map((item) => {
          if (item.isFab) {
            return (
              <button
                key="fab"
                onClick={() => onOpenCreateModal && onOpenCreateModal()}
                className="w-12 h-12 rounded-full bg-primary-gradient text-white flex items-center justify-center shadow-gradient-glow hover:scale-110 active:scale-95 transition-transform shrink-0"
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
                <span className="absolute inset-0 bg-brand-purple/15 rounded-2xl -z-10 animate-fadeIn" />
              )}

              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {badgeCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-brand-pink text-white text-[0.6rem] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-brand-surface animate-pulse">
                    {badgeCount > 99 ? '99+' : badgeCount}
                  </span>
                )}
              </div>
              <span className="text-[0.65rem] leading-none font-semibold">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </GlassSurface>
  );
}
