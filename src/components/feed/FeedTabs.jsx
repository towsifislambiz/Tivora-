import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FeedTabs() {
  const [activeTab, setActiveTab] = useState('all');
  const tabs = [
    { id: 'all', label: 'All Posts' },
    { id: 'following', label: 'Following' },
    { id: 'friends', label: 'Friends' },
    { id: 'groups', label: 'Groups' },
  ];

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-primary-gradient text-white shadow-gradient-glow'
                : 'text-brand-mutedText hover:text-brand-purple hover:bg-brand-lavender'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="relative hidden sm:block shrink-0">
        <select className="bg-brand-surface border border-brand-border text-brand-mainText font-semibold text-xs rounded-full px-4 py-2 pr-8 outline-none appearance-none cursor-pointer shadow-soft-sm">
          <option>Latest</option>
          <option>Popular</option>
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-brand-mutedText absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );
}
