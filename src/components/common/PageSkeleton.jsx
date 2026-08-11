import React from 'react';

export default function PageSkeleton() {
  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-24 lg:pb-8 animate-fadeIn">
      {/* Header Bar Skeleton */}
      <div className="bg-brand-surface rounded-3xl p-6 border border-brand-border animate-pulse space-y-4 shadow-soft-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-lavender rounded-full shrink-0" />
          <div className="space-y-2 flex-1 min-w-0">
            <div className="w-36 h-4 bg-brand-lavender rounded-full" />
            <div className="w-24 h-3 bg-brand-lavender rounded-full" />
          </div>
        </div>
      </div>

      {/* Content Block Skeletons */}
      <div className="space-y-4">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-brand-surface rounded-3xl p-6 border border-brand-border animate-pulse space-y-4 shadow-soft-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-lavender rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <div className="w-32 h-3.5 bg-brand-lavender rounded-full" />
                <div className="w-20 h-2.5 bg-brand-lavender rounded-full" />
              </div>
            </div>
            <div className="space-y-2.5 pt-2">
              <div className="w-full h-3 bg-brand-lavender rounded-full" />
              <div className="w-4/5 h-3 bg-brand-lavender rounded-full" />
              <div className="w-3/5 h-3 bg-brand-lavender rounded-full" />
            </div>
            <div className="w-full h-48 bg-brand-lavender/60 rounded-2xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
