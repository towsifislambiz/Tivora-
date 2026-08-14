import React from 'react';
import { Bell, Bookmark, Compass, Home, MessageSquare, Plus, Users, UserPlus } from 'lucide-react';
import { useRealtime } from '../../hooks/useRealtime';
import GlassSurface from '../ui/GlassSurface';

/**
 * Floating desktop dock.
 *
 * This is the one piece of chrome that is a natural fit for
 * liquid-glass-react: it is a small, free-floating, centred island over the
 * ambient background, so the displacement has real colour variation to bend
 * and the filter only ever runs on a ~440x64 region.
 */
export default function GlassDock({ activeScreen, setActiveScreen, onOpenCreateModal }) {
  const { unreadNotifCount, unreadMsgCount, pendingFriendRequestsCount } = useRealtime();

  const items = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'friends', label: 'Friends', icon: UserPlus, badge: pendingFriendRequestsCount },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'fab_create', label: 'Create', isFab: true },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMsgCount },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifCount },
    { id: 'saved', label: 'Saved', icon: Bookmark },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 hidden lg:block pointer-events-none">
      <GlassSurface
        className="pointer-events-auto"
        cornerRadius={32}
        padding="8px 12px"
        displacementScale={72}
        blurAmount={0.45}
        saturation={170}
        aberrationIntensity={2.4}
        elasticity={0.22}
        mode="standard"
      >
      <nav className="flex items-center gap-1.5" role="navigation" aria-label="Quick dock">
        {items.map((item) => {
          if (item.isFab) {
            return (
              <button
                key="fab"
                onClick={() => onOpenCreateModal && onOpenCreateModal()}
                className="group w-12 h-12 mx-1 rounded-2xl bg-primary-gradient text-white flex items-center justify-center shadow-gradient-glow hover:scale-110 active:scale-95 transition-transform shrink-0"
                aria-label="Create post"
              >
                <Plus className="w-6 h-6 stroke-[2.5] transition-transform group-hover:rotate-90 duration-300" />
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
              className={`group relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all hover:scale-110 ${
                isActive
                  ? 'text-brand-purple bg-brand-purple/15'
                  : 'text-brand-mainText/75 hover:text-brand-mainText hover:bg-brand-purple/10'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />

              {badgeCount > 0 && (
                <span className="absolute top-1 right-1 bg-brand-pink text-white text-[0.6rem] font-black h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center">
                  {badgeCount > 99 ? '99+' : badgeCount}
                </span>
              )}

              {/* Active indicator dot */}
              {isActive && (
                <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-purple" />
              )}

              {/* Hover label */}
              <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-brand-mainText px-2 py-1 text-[0.65rem] font-bold text-brand-bg opacity-0 transition-opacity group-hover:opacity-100">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </GlassSurface>
    </div>
  );
}
