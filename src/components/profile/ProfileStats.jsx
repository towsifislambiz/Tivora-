import React from 'react';

export default function ProfileStats({ stats }) {
  const defaultStats = {
    posts: stats?.posts || 128,
    followers: stats?.followers || '2.4K',
    following: stats?.following || '1.1K',
    groups: stats?.groups || 89
  };

  return (
    <div className="flex items-center gap-8 py-4 border-y border-brand-border px-6 sm:px-8 bg-brand-surface border-x rounded-b-3xl -mt-6 mb-6">
      <div>
        <span className="text-lg font-bold text-brand-mainText block">{defaultStats.posts}</span>
        <span className="text-xs text-brand-mutedText font-medium">Posts</span>
      </div>
      <div>
        <span className="text-lg font-bold text-brand-mainText block">{defaultStats.followers}</span>
        <span className="text-xs text-brand-mutedText font-medium">Followers</span>
      </div>
      <div>
        <span className="text-lg font-bold text-brand-mainText block">{defaultStats.following}</span>
        <span className="text-xs text-brand-mutedText font-medium">Following</span>
      </div>
      <div>
        <span className="text-lg font-bold text-brand-mainText block">{defaultStats.groups}</span>
        <span className="text-xs text-brand-mutedText font-medium">Groups</span>
      </div>
    </div>
  );
}
