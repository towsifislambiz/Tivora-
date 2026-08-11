import React, { useState, useRef, useEffect } from 'react';
import UserAvatar from '../common/UserAvatar';
import { Search, Plus, MessageSquare, Bell, LogOut, User, Settings, RefreshCw, AlertCircle, CheckCheck, ExternalLink, ShieldCheck, Smartphone } from 'lucide-react';
import { isMobileBrowser, isAppInstalledOrStandalone } from '../common/MobileInstallBanner';
import { useAuth } from '../../hooks/useAuth';
import { getUserByUsername } from '../../firebase/profileService';
import { normalizeUsername } from '../../utils/usernameValidator';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead
} from '../../firebase/notificationService';
import { useRealtime } from '../../hooks/useRealtime';
import UserSearchResult from '../search/UserSearchResult';
import NotificationItem from '../notifications/NotificationItem';
import ThemeToggle from '../ui/ThemeToggle';
import { formatPostTime } from '../feed/PostCard';

export default function Topbar({ setActiveScreen, onOpenCreateModal, onSelectProfileUsername, onSelectPostId, onShowToast, onOpenInstallModal }) {
  const { currentUser, userDoc, logout } = useAuth();

  const [showMenu, setShowMenu] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [showMsgDropdown, setShowMsgDropdown] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [searchStatus, setSearchStatus] = useState('');
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Live badge data comes from the shared RealtimeProvider — see
  // src/context/RealtimeContext.jsx. Subscribing here as well would reopen
  // the duplicate Firestore channels this was consolidated to remove.
  const {
    notifications,
    unreadNotifCount,
    unreadMsgCount,
    recentConversations,
    markNotificationRead,
    markAllNotificationsRead,
  } = useRealtime();

  const menuRef = useRef(null);
  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const msgRef = useRef(null);

  const displayName = currentUser?.displayName || userDoc?.displayName || 'Tivora User';
  const email = currentUser?.email || userDoc?.email || 'user@example.com';
  const avatar = currentUser?.photoURL || userDoc?.photoURL || null;
  const isAdmin = userDoc?.role === 'admin' || userDoc?.role === 'owner' || userDoc?.email === 'demo@tivora.app';

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResult(null);
        setSearchStatus('');
      }
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifDropdown(false);
      }
      if (msgRef.current && !msgRef.current.contains(event.target)) {
        setShowMsgDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Exact Username Search
  useEffect(() => {
    const normalized = normalizeUsername(searchQuery);
    if (!normalized) {
      setSearchResult(null);
      setSearchStatus('');
      setSearching(false);
      return;
    }

    setSearching(true);
    setSearchStatus('');

    const timer = setTimeout(async () => {
      try {
        const found = await getUserByUsername(normalized);
        if (found) {
          setSearchResult(found);
          setSearchStatus('found');
        } else {
          setSearchResult(null);
          setSearchStatus('not_found');
        }
      } catch (err) {
        setSearchResult(null);
        setSearchStatus('error');
      } finally {
        setSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    window.location.hash = `#search?q=${encodeURIComponent(searchQuery.trim())}`;
    if (setActiveScreen) setActiveScreen('search_results');
    setSearchResult(null);
    setSearchStatus('');
  };

  const handleSelectSearchResult = (username) => {
    if (onSelectProfileUsername) onSelectProfileUsername(username);
    setSearchResult(null);
    setSearchQuery('');
  };

  const handleNotificationClick = (notif) => {
    setShowNotifDropdown(false);

    if (!notif.isRead && currentUser?.uid) {
      markNotificationAsRead(notif.id, currentUser.uid);
      markNotificationRead(notif.id);
    }

    if (notif.type === 'message' || notif.type === 'chat') {
      window.location.hash = `#messages?user=${notif.actorUsername}`;
      if (setActiveScreen) setActiveScreen('messages');
    } else if (notif.postId) {
      if (onSelectPostId) onSelectPostId(notif.postId);
      if (setActiveScreen) setActiveScreen('post_detail');
    } else if (notif.actorUsername) {
      if (onSelectProfileUsername) onSelectProfileUsername(notif.actorUsername);
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUser?.uid) return;
    try {
      await markAllNotificationsAsRead(currentUser.uid);
      markAllNotificationsRead();
      if (onShowToast) onShowToast("All notifications marked as read! 🔔");
    } catch (err) {
      if (onShowToast) onShowToast("Failed to mark notifications read.");
    }
  };

  const isMobileChatActive = typeof window !== 'undefined' && (
    window.location.hash.includes('?user=') || 
    window.location.hash.includes('?conversation=') ||
    (typeof document !== 'undefined' && !!document.querySelector('.chat-window-active'))
  );

  if (isMobileChatActive) {
    // Hide topbar on mobile during active chat for 100% full bleed Messenger experience
    return (
      <header className="hidden sm:flex h-16 glass-bar sticky top-0 z-40 px-4 lg:px-8 items-center justify-between shadow-soft-xs" role="banner">
        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-72 md:w-96" ref={searchRef}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-mutedText pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search people, groups, posts..."
            className="w-full h-10 bg-brand-lavender border border-transparent focus:border-brand-purple focus:bg-brand-surface rounded-full pl-11 pr-10 text-xs sm:text-sm text-brand-mainText outline-none transition-all placeholder:text-brand-mutedText/70"
          />
          {searching && (
            <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-purple animate-spin" />
          )}
        </form>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenCreateModal}
            className="w-10 h-10 rounded-full bg-primary-gradient text-white flex items-center justify-center shadow-gradient-glow hover:scale-105 transition-transform"
            title="Create Post"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="h-16 glass-bar sticky top-0 z-40 px-4 lg:px-8 flex items-center justify-between shadow-soft-xs pt-safe" role="banner">
      {/* Mobile Search Trigger Button (sm:hidden) */}
      <button
        onClick={() => setIsMobileSearchOpen(true)}
        className="w-10 h-10 rounded-full bg-brand-lavender text-brand-mainText flex items-center justify-center sm:hidden hover:bg-brand-purple/10 transition-colors"
        aria-label="Open mobile search"
      >
        <Search className="w-5 h-5" />
      </button>

      {/* Desktop Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative hidden sm:block w-72 md:w-96" ref={searchRef}>
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-mutedText pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search people, groups, posts (press Enter)..."
          className="w-full h-10 bg-brand-lavender border border-transparent focus:border-brand-purple focus:bg-brand-surface rounded-full pl-11 pr-10 text-xs sm:text-sm text-brand-mainText outline-none transition-all placeholder:text-brand-mutedText/70"
        />
        {searching && (
          <RefreshCw className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-purple animate-spin" />
        )}

        {/* Search Results Dropdown */}
        {searchQuery.trim() && (
          <div className="absolute left-0 right-0 top-12 z-50">
            {searchResult ? (
              <UserSearchResult
                user={searchResult}
                onSelectUser={handleSelectSearchResult}
                onClose={() => { setSearchResult(null); setSearchQuery(''); }}
                onShowToast={onShowToast}
              />
            ) : searchStatus === 'not_found' && !searching ? (
              <div className="bg-brand-surface border border-brand-border rounded-2xl p-4 shadow-soft-lg text-center space-y-2 animate-in fade-in zoom-in-95 duration-150">
                <p className="font-bold text-xs text-brand-mainText">No direct username match</p>
                <button
                  type="button"
                  onClick={() => {
                    window.location.hash = `#search?q=${encodeURIComponent(searchQuery.trim())}`;
                    if (setActiveScreen) setActiveScreen('search_results');
                    setSearchResult(null);
                    setSearchStatus('');
                  }}
                  className="w-full py-1.5 rounded-full bg-primary-gradient text-white font-bold text-xs shadow-soft-xs"
                >
                  Search all People, Groups & Posts
                </button>
              </div>
            ) : null}
          </div>
        )}
      </form>

      {/* Topbar Actions Toolbar */}
      <div className="flex items-center gap-3">
        {/* Light / System / Dark */}
        <ThemeToggle variant="icon" />

        {/* Create Post Button */}
        <button
          onClick={onOpenCreateModal}
          className="w-10 h-10 rounded-full bg-primary-gradient text-white flex items-center justify-center shadow-gradient-glow hover:scale-105 transition-transform"
          title="Create Post"
        >
          <Plus className="w-5 h-5" />
        </button>

        {/* Facebook Messenger Popover Dropdown & Badge */}
        <div className="relative" ref={msgRef}>
          <button
            onClick={() => setShowMsgDropdown(!showMsgDropdown)}
            className="w-10 h-10 rounded-full bg-brand-lavender text-brand-mainText hover:text-brand-purple hover:bg-brand-purple/10 flex items-center justify-center relative transition-colors"
            title="Messenger Chats"
            aria-label="View messages"
          >
            <MessageSquare className="w-4 h-4" />
            {unreadMsgCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-pink text-white text-[0.65rem] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-brand-surface animate-pulse">
                {unreadMsgCount > 9 ? '9+' : unreadMsgCount}
              </span>
            )}
          </button>

          {/* Interactive Messenger Popover Dropdown */}
          {showMsgDropdown && (
            <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-w-[calc(100vw-24px)] bg-brand-surface rounded-3xl border border-brand-border shadow-soft-lg p-4 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-brand-border pb-3">
                <h4 className="font-bold text-sm text-brand-mainText flex items-center gap-2">
                  <span>Messenger</span>
                  {unreadMsgCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-brand-pink text-white text-[0.68rem] font-bold">
                      {unreadMsgCount} unread
                    </span>
                  )}
                </h4>
                <button
                  onClick={() => {
                    setShowMsgDropdown(false);
                    if (setActiveScreen) setActiveScreen('messages');
                  }}
                  className="text-[0.72rem] font-bold text-brand-purple hover:underline flex items-center gap-1"
                >
                  <span>Open Messenger</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Conversations List inside Dropdown */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {recentConversations.length === 0 ? (
                  <div className="text-center py-6 space-y-2">
                    <p className="text-xs text-brand-mutedText italic">No recent messages</p>
                    <button
                      onClick={() => {
                        setShowMsgDropdown(false);
                        if (setActiveScreen) setActiveScreen('friends');
                      }}
                      className="px-4 py-1.5 rounded-full bg-brand-lavender text-brand-purple text-xs font-semibold hover:bg-brand-purple hover:text-white transition-all"
                    >
                      Find Friends to Chat
                    </button>
                  </div>
                ) : (
                  recentConversations.slice(0, 6).map((conv) => (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setShowMsgDropdown(false);
                        window.location.hash = `#messages?user=${conv.partner?.username || 'user'}`;
                        if (setActiveScreen) setActiveScreen('messages');
                      }}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                        conv.isUnread ? 'bg-brand-purple/10 border-brand-purple/30' : 'bg-brand-surface border-brand-border hover:bg-brand-lavender/50'
                      }`}
                    >
                      <UserAvatar
                        src={conv.partner?.photoURL}
                        name={conv.partner?.displayName}
                        size="w-10 h-10"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-xs text-brand-mainText truncate">{conv.partner?.displayName || 'Tivora User'}</h5>
                          <span className="text-[0.65rem] text-brand-mutedText">{formatPostTime(conv.lastMessageAt)}</span>
                        </div>
                        <p className="text-xs text-brand-mutedText truncate mt-0.5">{conv.lastMessage || 'Start a conversation'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-brand-border text-center">
                <button
                  onClick={() => {
                    setShowMsgDropdown(false);
                    if (setActiveScreen) setActiveScreen('messages');
                  }}
                  className="w-full py-2 rounded-full bg-primary-gradient text-white font-bold text-xs shadow-soft-xs hover:scale-105 transition-transform"
                >
                  See all in Messenger
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Mobile App Install Button — Only on mobile browser & when not installed */}
        {isMobileBrowser() && !isAppInstalledOrStandalone() && (
          <button
            onClick={() => onOpenInstallModal && onOpenInstallModal()}
            className="w-10 h-10 rounded-full bg-primary-gradient text-white flex items-center justify-center relative shadow-gradient-glow hover:scale-105 active:scale-95 transition-transform shrink-0"
            title="Get Tivora Mobile App"
            aria-label="Get Tivora Mobile App"
          >
            <Smartphone className="w-4 h-4" />
          </button>
        )}

        {/* Real-time Notifications Dropdown & Badge */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="w-10 h-10 rounded-full bg-brand-lavender text-brand-mainText hover:text-brand-purple hover:bg-brand-purple/10 flex items-center justify-center relative transition-colors"
            title="Notifications"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-brand-pink text-white text-[0.65rem] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center border-2 border-brand-surface animate-pulse">
                {unreadNotifCount > 9 ? '9+' : unreadNotifCount}
              </span>
            )}
          </button>

          {/* Interactive Notifications Dropdown */}
          {showNotifDropdown && (
            <div className="fixed left-3 right-3 top-16 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-w-[calc(100vw-24px)] bg-brand-surface rounded-3xl border border-brand-border shadow-soft-lg p-4 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-brand-border pb-3">
                <h4 className="font-bold text-sm text-brand-mainText flex items-center gap-2">
                  <span>Notifications</span>
                  {unreadNotifCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-brand-pink text-white text-[0.68rem] font-bold">
                      {unreadNotifCount} new
                    </span>
                  )}
                </h4>
                {unreadNotifCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-[0.72rem] font-bold text-brand-purple hover:underline flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-brand-mutedText text-center py-6 italic">No notifications yet</p>
                ) : (
                  notifications.slice(0, 5).map((notif) => (
                    <NotificationItem
                      key={notif.id}
                      notification={notif}
                      onClick={() => handleNotificationClick(notif)}
                      onSelectProfileUsername={onSelectProfileUsername}
                      onShowToast={onShowToast}
                    />
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-brand-border text-center">
                <button
                  onClick={() => {
                    setShowNotifDropdown(false);
                    if (setActiveScreen) setActiveScreen('notifications');
                  }}
                  className="w-full py-2 text-xs font-bold text-brand-purple hover:underline flex items-center justify-center gap-1"
                >
                  <span>View All Notifications</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu & Avatar */}
        <div className="relative" ref={menuRef}>
          <UserAvatar
            src={avatar}
            name={displayName}
            size="w-10 h-10"
            className="border-2 border-brand-purple cursor-pointer hover:scale-105 transition-transform"
            onClick={() => setShowMenu(!showMenu)}
          />

          {/* User Dropdown Menu */}
          {showMenu && (
            <div className="fixed right-3 top-16 sm:absolute sm:right-0 sm:top-full sm:mt-2 w-56 max-w-[calc(100vw-24px)] bg-brand-surface rounded-2xl border border-brand-border shadow-soft-lg py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-2.5 border-b border-brand-border">
                <p className="font-bold text-xs text-brand-mainText truncate">{displayName}</p>
                <p className="text-[0.7rem] text-brand-mutedText truncate">{email}</p>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { 
                    setShowMenu(false); 
                    if (onSelectProfileUsername) onSelectProfileUsername(userDoc?.username);
                    setActiveScreen('profile'); 
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-brand-mainText hover:bg-brand-lavender flex items-center gap-2.5 transition-colors"
                >
                  <User className="w-4 h-4 text-brand-purple" />
                  <span>View Profile</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenu(false);
                    setActiveScreen('settings');
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-brand-mainText hover:bg-brand-lavender flex items-center gap-2.5 transition-colors"
                >
                  <Settings className="w-4 h-4 text-brand-mutedText" />
                  <span>Account Settings</span>
                </button>

                {isAdmin && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      setActiveScreen('admin_moderation');
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span>Admin Moderation</span>
                  </button>
                )}

                {isMobileBrowser() && !isAppInstalledOrStandalone() && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (onOpenInstallModal) onOpenInstallModal();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-brand-purple hover:bg-brand-purple/10 flex items-center gap-2.5 transition-colors"
                  >
                    <Smartphone className="w-4 h-4 text-brand-purple" />
                    <span>Get Mobile App 📱</span>
                  </button>
                )}

                <div className="border-t border-brand-border my-1" />

                <button
                  onClick={() => { setShowMenu(false); logout(); }}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Full-Screen Mobile Search Overlay */}
      {isMobileSearchOpen && (
        <div className="fixed inset-0 z-50 bg-brand-bg flex flex-col p-4 space-y-4 animate-fadeIn sm:hidden pt-safe">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="p-2 rounded-full hover:bg-brand-lavender text-brand-mainText transition-colors"
              aria-label="Close search"
            >
              <Search className="w-5 h-5" />
            </button>

            <form onSubmit={handleSearchSubmit} className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Tivora..."
                className="w-full h-11 bg-brand-surface border border-brand-purple rounded-full pl-4 pr-10 text-sm outline-none shadow-soft-xs"
                autoFocus
              />
              {searching && (
                <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-purple animate-spin" />
              )}
            </form>

            <button
              onClick={() => setIsMobileSearchOpen(false)}
              className="text-xs font-bold text-brand-purple"
            >
              Cancel
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {searchResult ? (
              <UserSearchResult
                user={searchResult}
                onSelectUser={(uname) => {
                  setIsMobileSearchOpen(false);
                  handleSelectSearchResult(uname);
                }}
                onClose={() => { setSearchResult(null); setSearchQuery(''); }}
                onShowToast={onShowToast}
              />
            ) : searchQuery.trim() ? (
              <button
                type="button"
                onClick={() => {
                  setIsMobileSearchOpen(false);
                  window.location.hash = `#search?q=${encodeURIComponent(searchQuery.trim())}`;
                  if (setActiveScreen) setActiveScreen('search_results');
                }}
                className="w-full p-4 rounded-2xl bg-brand-surface border border-brand-border font-bold text-xs text-brand-purple flex items-center justify-between shadow-soft-xs"
              >
                <span>Search all results for "{searchQuery}"</span>
                <Search className="w-4 h-4" />
              </button>
            ) : (
              <div className="text-center py-12 text-brand-mutedText text-xs">
                <p>Type a username or query to start searching Tivora</p>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
