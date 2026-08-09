import React from 'react';
import { storiesData } from '../../data/mockData';
import { Plus } from 'lucide-react';

export default function Stories({ onShowToast }) {
  return (
    <div class="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
      {storiesData.map((story) => (
        <div
          key={story.id}
          onClick={() => onShowToast(`Viewing ${story.name}'s story`)}
          class="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 group"
        >
          <div class={`w-14 h-14 rounded-full p-0.5 transition-transform group-hover:scale-105 ${
            story.isUser 
              ? 'bg-brand-lavender border-2 border-dashed border-brand-purple relative'
              : 'bg-gradient-to-tr from-brand-purple via-brand-violet to-brand-pink'
          }`}>
            <img
              src={story.avatar}
              alt={story.name}
              class="w-full h-full rounded-full object-cover border-2 border-white"
            />
            {story.isUser && (
              <div class="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary-gradient text-white flex items-center justify-center border-2 border-white shadow-soft-sm">
                <Plus class="w-3 h-3" />
              </div>
            )}
          </div>
          <span class="text-xs font-semibold text-brand-mainText truncate max-w-[60px] text-center">
            {story.name}
          </span>
        </div>
      ))}
    </div>
  );
}
