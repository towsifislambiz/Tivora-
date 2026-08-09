import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Layers, Smartphone, X } from 'lucide-react';

/** How long the bar stays open before it slides away on its own. */
const AUTO_HIDE_MS = 6000;

export default function DevBar({ activeScreen, setActiveScreen, isMobileSim, setIsMobileSim }) {
  const [isVisible, setIsVisible] = useState(true);
  // A manual close is final for the session; an auto-hide leaves the handle
  // available so the bar can be pulled back down.
  const [isDismissed, setIsDismissed] = useState(false);
  const timerRef = useRef(null);

  const screens = [
    { id: 'home', label: 'Home Feed' },
    { id: 'profile', label: 'Profile' },
    { id: 'explore', label: 'Explore' },
    { id: 'groups', label: 'Groups' },
    { id: 'group_details', label: 'Group Detail' },
    { id: 'friends', label: 'Friends' },
    { id: 'messages', label: 'Messages' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'search_results', label: 'Search' },
    { id: 'settings', label: 'Settings' },
    { id: 'admin_moderation', label: 'Admin' },
    { id: 'design_system', label: 'Design System' },
  ];

  // Auto-hide countdown. Restarted by interaction so the bar never disappears
  // mid-use, and paused entirely while the pointer is over it.
  const startTimer = () => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsVisible(false), AUTO_HIDE_MS);
  };

  useEffect(() => {
    if (isDismissed) return undefined;
    startTimer();
    return () => clearTimeout(timerRef.current);
  }, [isDismissed]);

  const handleReopen = () => {
    setIsVisible(true);
    startTimer();
  };

  if (isDismissed) return null;

  return (
    <>
      {/* Pull-down handle, shown once the bar has auto-hidden. */}
      {!isVisible && (
        <button
          onClick={handleReopen}
          className="fixed top-0 left-1/2 -translate-x-1/2 z-50 flex items-center gap-1.5 rounded-b-lg bg-[#121212] px-3 py-1 text-[0.65rem] font-bold tracking-wider text-white/70 shadow-md transition-colors hover:text-white"
          aria-label="Show developer preview bar"
        >
          <Layers className="w-3 h-3" aria-hidden="true" />
          <span className="font-mono">DEV</span>
          <ChevronDown className="w-3 h-3" aria-hidden="true" />
        </button>
      )}

      <div
        className={`bg-[#121212] text-white h-11 px-4 flex items-center justify-between sticky top-0 z-50 text-xs shadow-md border-b border-white/10 transition-all duration-300 ${
          isVisible ? 'opacity-100 translate-y-0' : 'pointer-events-none h-0 -translate-y-full overflow-hidden opacity-0 border-b-0'
        }`}
        role="banner"
        aria-label="Developer Preview Bar"
        aria-hidden={!isVisible}
        onMouseEnter={() => clearTimeout(timerRef.current)}
        onMouseLeave={startTimer}
      >
        {/* Brand + development phase badge */}
        <div className="flex items-center gap-2 shrink-0 mr-2">
          <Layers className="w-4 h-4 text-brand-purple" aria-hidden="true" />
          <span className="hidden sm:inline font-mono text-[0.7rem] font-bold tracking-wider text-brand-purple">
            TIVORA DEV
          </span>
          <span className="hidden md:inline rounded-full bg-amber-400/15 px-2 py-0.5 font-mono text-[0.62rem] font-bold uppercase tracking-wider text-amber-300 ring-1 ring-amber-400/30">
            Development Phase · Theme Update
          </span>
        </div>

        {/* Horizontally Scrollable Screens List */}
        <div className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1 mx-2 no-scrollbar min-w-0">
          {screens.map((sc) => (
            <button
              key={sc.id}
              onClick={() => {
                setIsMobileSim(false);
                setActiveScreen(sc.id);
                startTimer();
              }}
              className={`px-3 py-1 rounded-full whitespace-nowrap transition-all text-[0.72rem] shrink-0 ${
                !isMobileSim && activeScreen === sc.id
                  ? 'bg-primary-gradient text-white font-bold shadow-soft-xs'
                  : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
              }`}
              aria-current={!isMobileSim && activeScreen === sc.id ? 'page' : undefined}
            >
              {sc.label}
            </button>
          ))}
        </div>

        {/* Mobile Simulator Toggle Button */}
        <button
          onClick={() => {
            setIsMobileSim(!isMobileSim);
            startTimer();
          }}
          className={`px-3 py-1 rounded-full flex items-center gap-1.5 font-bold text-[0.72rem] transition-all shrink-0 ml-2 ${
            isMobileSim ? 'bg-primary-gradient text-white shadow-soft-xs' : 'bg-white/15 text-gray-200 hover:bg-white/25'
          }`}
          aria-label="Toggle mobile view simulator"
          aria-pressed={isMobileSim}
        >
          <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Mobile View</span>
        </button>

        {/* Dismiss for the rest of the session */}
        <button
          onClick={() => setIsDismissed(true)}
          className="ml-2 shrink-0 rounded-full p-1.5 text-gray-400 transition-colors hover:bg-white/15 hover:text-white"
          aria-label="Close developer preview bar"
          title="Close dev bar (hidden until reload)"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </>
  );
}
