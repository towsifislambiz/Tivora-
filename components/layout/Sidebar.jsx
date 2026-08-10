import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Compass, 
  Users, 
  UserPlus, 
  MessageSquare, 
  Bell, 
  BookmarkCheck, 
  Shield,
  Settings,
  Plus,
  Smartphone
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useRealtime } from '../../hooks/useRealtime';

export default function Sidebar({ activeScreen, setActiveScreen, onShowToast, onOpenInstallModal }) {
  const { userDoc } = useAuth();
  const { unreadNotifCount, unreadMsgCount } = useRealtime();

  const isAdmin = userDoc?.role === 'admin' || userDoc?.role === 'owner' || userDoc?.email === 'demo@tivora.app';

  const mainNav = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'explore', label: 'Explore', icon: Compass },
    { id: 'groups', label: 'Groups', icon: Users },
    { id: 'friends', label: 'Friends', icon: UserPlus },
    { id: 'messages', label: 'Messages', icon: MessageSquare, badge: unreadMsgCount },
    { id: 'notifications', label: 'Notifications', icon: Bell, badge: unreadNotifCount },
    { id: 'saved', label: 'Saved Posts', icon: BookmarkCheck },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (isAdmin) {
    mainNav.push({ id: 'admin_moderation', label: 'Moderation', icon: Shield });
  }

  const handleNavClick = (item) => {
    if (item.toastMsg) {
      onShowToast(item.toastMsg);
    } else {
      setActiveScreen(item.id);
    }
  };

  return (
    <aside 
      className="bg-brand-surface rounded-3xl p-5 border border-brand-border shadow-soft-sm sticky top-28 max-h-[calc(100vh-140px)] overflow-y-auto hidden lg:block"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Brand Header */}
      <div className="flex flex-col pb-5 mb-4 border-b border-brand-border px-2">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary-gradient flex items-center justify-center text-white shadow-gradient-glow" aria-hidden="true">
            <MessageSquare className="w-5 h-5 fill-current" />
          </div>
          <span className="text-xl font-bold text-brand-mainText tracking-tight">Tivora</span>
        </div>
        <span className="text-[0.72rem] text-brand-mutedText font-medium mt-1">Connect · Share · Grow Together</span>
      </div>

      {/* Main Navigation */}
      <nav className="space-y-1" aria-label="Primary navigation">
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeScreen === item.id;
          const badgeCount = item.badge || 0;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 ${
                isActive
                  ? 'bg-primary-gradient text-white shadow-gradient-glow font-semibold'
                  : 'text-brand-mutedText hover:bg-brand-lavender hover:text-brand-purple'
              }`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={item.label}
            >
              <div className="flex items-center gap-3.5">
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : ''}`} aria-hidden="true" />
                <span>{item.label}</span>
              </div>
              {badgeCount > 0 && (
                <span 
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-brand-purple' : 'bg-brand-pink text-white animate-pulse'}`}
                  aria-label={`${badgeCount} unread`}
                >
                  {badgeCount > 9 ? '9+' : badgeCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Groups Quick Access */}
      <div className="mt-6 pt-4 border-t border-brand-border">
        <div className="text-[0.75rem] font-bold text-brand-mutedText/70 uppercase tracking-wider px-3 mb-2">
          Communities
        </div>
        <button
          onClick={() => setActiveScreen('groups')}
          className="w-full mt-1 py-2 px-3 border border-dashed border-brand-purple/40 hover:border-solid hover:bg-brand-lavender text-brand-purple rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all"
          aria-label="Browse and create groups"
        >
          <Plus className="w-4 h-4" aria-hidden="true" />
          <span>Browse Groups</span>
        </button>
      </div>

      {/* Get Mobile App Button */}
      <div className="mt-4 pt-4 border-t border-brand-border">
        <button
          onClick={onOpenInstallModal}
          className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-soft-sm transition-all hover:scale-[1.02]"
        >
          <Smartphone className="w-4 h-4" />
          <span>Get Tivora App 📱</span>
        </button>
      </div>
    </aside>
  );
}
