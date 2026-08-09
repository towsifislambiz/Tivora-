import React, { useState, useEffect } from 'react';
import { User, MapPin, Mail, Info, Heart, MessageSquare, Loader2 } from 'lucide-react';
import { getUserPosts, subscribeToUserPosts } from '../../firebase/postService';
import PostCard from '../feed/PostCard';

export default function ProfileTabs({ profile, isOwner, onSelectProfileUsername, onShowToast }) {
  const [activeTab, setActiveTab] = useState('about');
  const [userPosts, setUserPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  const tabs = [
    { id: 'about', label: 'About' },
    { id: 'posts', label: 'Posts' },
    { id: 'friends', label: 'Friends' },
    { id: 'photos', label: 'Photos' },
    { id: 'groups', label: 'Groups' }
  ];

  const hobbies = profile?.hobbies || ['Coding', 'Gaming', 'UI Design'];

  useEffect(() => {
    let unsubscribe = null;

    async function fetchUserPosts() {
      const targetId = profile?.uid || profile?.username || profile?.profileId;
      if (activeTab === 'posts' && targetId) {
        setLoadingPosts(true);
        const { posts } = await getUserPosts(targetId, 20);
        setUserPosts(posts);
        setLoadingPosts(false);

        unsubscribe = subscribeToUserPosts(targetId, (livePosts) => {
          if (livePosts) {
            setUserPosts(livePosts);
          }
        });
      }
    }

    fetchUserPosts();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [activeTab, profile?.uid, profile?.username, profile?.profileId]);

  const handlePostUpdated = (updatedPost) => {
    setUserPosts((prev) => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const handlePostDeleted = (deletedPostId) => {
    setUserPosts((prev) => prev.filter(p => p.id !== deletedPostId));
  };

  return (
    <div class="space-y-6">
      {/* Tabs Header Bar */}
      <div class="bg-brand-surface rounded-2xl px-6 border border-brand-border shadow-soft-sm">
        <div class="flex items-center gap-6 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              class={`py-3.5 text-xs sm:text-sm font-semibold relative transition-colors whitespace-nowrap ${
                activeTab === tab.id ? 'text-brand-purple' : 'text-brand-mutedText hover:text-brand-mainText'
              }`}
            >
              {tab.label}
              {activeTab === tab.id && (
                <span class="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-gradient rounded-t-full" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content: About */}
      {activeTab === 'about' && (
        <div class="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-soft-sm space-y-6">
          {/* User Details */}
          <div class="space-y-3">
            <h3 class="font-bold text-base text-brand-mainText border-b border-brand-border pb-3">About User</h3>
            <div class="space-y-3 text-xs sm:text-sm text-brand-mainText">
              <div class="flex items-center gap-3">
                <User class="w-4 h-4 text-brand-purple shrink-0" />
                <span><strong>Full Name:</strong> {profile?.displayName || 'Tivora User'}</span>
              </div>
              <div class="flex items-center gap-3">
                <Mail class="w-4 h-4 text-brand-purple shrink-0" />
                <span>
                  <strong>Email:</strong>{' '}
                  {isOwner ? (
                    <span class="text-brand-purple font-medium">{profile?.email} <span class="text-brand-mutedText text-xs font-normal">(Only visible to you 🔒)</span></span>
                  ) : (
                    <span class="text-brand-mutedText font-medium">Private 🔒</span>
                  )}
                </span>
              </div>
              <div class="flex items-center gap-3">
                <MapPin class="w-4 h-4 text-brand-purple shrink-0" />
                <span><strong>Location:</strong> {profile?.location || 'Dhaka, Bangladesh'}</span>
              </div>
              <div class="flex items-start gap-3">
                <Info class="w-4 h-4 text-brand-purple shrink-0 mt-0.5" />
                <span><strong>Bio:</strong> {profile?.bio || 'Building cool digital experiences with Tivora 🚀'}</span>
              </div>
            </div>
          </div>

          {/* Hobbies Section */}
          <div class="space-y-3 pt-2 border-t border-brand-border">
            <h4 class="font-bold text-sm text-brand-mainText flex items-center gap-2">
              <Heart class="w-4 h-4 text-brand-pink fill-brand-pink" />
              <span>Hobbies & Interests</span>
            </h4>
            {hobbies && hobbies.length > 0 ? (
              <div class="flex flex-wrap gap-2">
                {hobbies.map((hobby, idx) => (
                  <span
                    key={idx}
                    class="px-3.5 py-1.5 rounded-full bg-brand-lavender text-brand-purple text-xs font-semibold border border-brand-purple/20 shadow-soft-xs hover:bg-brand-purple hover:text-white transition-colors cursor-default"
                  >
                    {hobby}
                  </span>
                ))}
              </div>
            ) : (
              <p class="text-xs text-brand-mutedText italic">No hobbies added yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: Posts */}
      {activeTab === 'posts' && (
        <div class="space-y-6">
          {loadingPosts ? (
            <div class="bg-brand-surface rounded-3xl p-12 border border-brand-border shadow-soft-sm text-center animate-pulse space-y-3">
              <Loader2 class="w-8 h-8 text-brand-purple animate-spin mx-auto" />
              <p class="text-xs text-brand-mutedText">Loading user posts...</p>
            </div>
          ) : userPosts.length === 0 ? (
            <div class="bg-brand-surface rounded-3xl p-12 border border-brand-border shadow-soft-sm text-center flex flex-col items-center justify-center space-y-2">
              <div class="w-12 h-12 rounded-full bg-brand-lavender text-brand-purple flex items-center justify-center mb-1">
                <MessageSquare class="w-6 h-6" />
              </div>
              <h4 class="font-bold text-base text-brand-mainText">No posts yet</h4>
              <p class="text-xs text-brand-mutedText max-w-xs">
                This user hasn't shared any posts yet.
              </p>
            </div>
          ) : (
            userPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                onSelectProfileUsername={onSelectProfileUsername}
                onShowToast={onShowToast}
                onPostUpdated={handlePostUpdated}
                onPostDeleted={handlePostDeleted}
              />
            ))
          )}
        </div>
      )}

      {/* Other Tabs Placeholder */}
      {activeTab !== 'about' && activeTab !== 'posts' && (
        <div class="bg-brand-surface rounded-3xl p-12 border border-brand-border shadow-soft-sm text-center flex flex-col items-center justify-center">
          <div class="w-12 h-12 rounded-full bg-brand-lavender text-brand-purple flex items-center justify-center mb-3">
            <Info class="w-6 h-6" />
          </div>
          <h4 class="font-bold text-base text-brand-mainText">No {activeTab} yet</h4>
          <p class="text-xs text-brand-mutedText max-w-xs mt-1">
            This section will display user {activeTab} when social feed features are unlocked in future phases.
          </p>
        </div>
      )}
    </div>
  );
}
