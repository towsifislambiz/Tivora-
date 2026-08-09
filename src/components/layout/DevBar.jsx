import React from 'react';
import { Layers, Smartphone } from 'lucide-react';

export default function DevBar({ activeScreen, setActiveScreen, isMobileSim, setIsMobileSim }) {
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

  return (
    <div className="bg-[#17172A] text-white h-11 px-4 flex items-center justify-between sticky top-0 z-50 text-xs shadow-md border-b border-white/10" role="banner" aria-label="Developer Preview Bar">
      {/* Brand Badge */}
      <div className="flex items-center gap-2 font-bold text-brand-purple shrink-0 mr-2">
        <Layers className="w-4 h-4 text-brand-purple" aria-hidden="true" />
        <span className="hidden sm:inline tracking-wider font-mono text-[0.7rem]">TIVORA DEV</span>
      </div>

      {/* Horizontally Scrollable Screens List */}
      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto py-1 mx-2 no-scrollbar min-w-0">
        {screens.map((sc) => (
          <button
            key={sc.id}
            onClick={() => {
              setIsMobileSim(false);
              setActiveScreen(sc.id);
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
        onClick={() => setIsMobileSim(!isMobileSim)}
        className={`px-3 py-1 rounded-full flex items-center gap-1.5 font-bold text-[0.72rem] transition-all shrink-0 ml-2 ${
          isMobileSim ? 'bg-primary-gradient text-white shadow-soft-xs' : 'bg-white/15 text-gray-200 hover:bg-white/25'
        }`}
        aria-label="Toggle mobile view simulator"
        aria-pressed={isMobileSim}
      >
        <Smartphone className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Mobile View</span>
      </button>
    </div>
  );
}
