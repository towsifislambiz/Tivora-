import React from 'react';
import { storiesData } from '../../data/mockData';
import { Plus } from 'lucide-react';

export default function Stories({ onShowToast }) {
  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
      {storiesData.map((story) => (
        <div
          key={story.id}
          onClick={() => onShowToast(`Viewing ${story.name}'s story`)}
          className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
        >
          <div className={`w-14 h-14 rounded-full p-0.5 transition-transform group-hover:scale-105 ${
            story.isUser 
              ? 'bg-brand-lavender border-2 border-dashed border-brand-purple relative'
              : 'bg-story-gradient'
          }`}>
            <img
              src={story.avatar}
              alt={story.name}
              className="w-full h-full rounded-full object-cover border-2 border-brand-surface"
            />
            {story.isUser && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary-gradient text-white flex items-center justify-center border-2 border-brand-surface shadow-soft-sm">
                <Plus className="w-3 h-3" />
              </div>
            )}
          </div>
          <span className="text-xs font-semibold text-brand-mainText truncate max-w-[60px] text-center">
            {story.name}
          </span>
        </div>
      ))}
    </div>
  );
}
