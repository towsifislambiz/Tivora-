import React from 'react';

export default function ProfileSkeleton() {
  return (
    <div class="bg-brand-surface rounded-3xl border border-brand-border shadow-soft-sm overflow-hidden animate-pulse">
      {/* Cover Skeleton */}
      <div class="h-48 sm:h-64 bg-brand-lavender animate-skeleton" />

      <div class="px-6 sm:px-8 pb-6 relative">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between -mt-16 sm:-mt-20 mb-6 gap-4">
          <div class="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white bg-brand-lavender animate-skeleton" />
          <div class="w-32 h-10 rounded-full bg-brand-lavender animate-skeleton" />
        </div>

        <div class="space-y-3 mb-6">
          <div class="w-48 h-6 bg-brand-lavender rounded-md animate-skeleton" />
          <div class="w-24 h-4 bg-brand-lavender rounded-md animate-skeleton" />
          <div class="w-full max-w-lg h-4 bg-brand-lavender rounded-md animate-skeleton" />
          <div class="w-36 h-4 bg-brand-lavender rounded-md animate-skeleton" />
        </div>

        <div class="flex gap-8 py-4 border-y border-brand-border mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} class="space-y-1">
              <div class="w-10 h-5 bg-brand-lavender rounded-md animate-skeleton" />
              <div class="w-14 h-3 bg-brand-lavender rounded-md animate-skeleton" />
            </div>
          ))}
        </div>

        <div class="flex gap-6 border-b border-brand-border pb-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} class="w-16 h-4 bg-brand-lavender rounded-md animate-skeleton" />
          ))}
        </div>
      </div>
    </div>
  );
}
