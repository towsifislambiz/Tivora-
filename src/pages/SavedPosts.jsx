import React, { useState, useEffect } from 'react';
import { Bookmark, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getSavedPosts } from '../firebase/interactionService';
import PostCard from '../components/feed/PostCard';

export default function SavedPosts({ onBackToHome, onSelectProfileUsername, onShowToast }) {
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastDocSnap, setLastDocSnap] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    async function loadInitialSavedPosts() {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { posts: fetchedPosts, lastDocSnap: newLastDoc } = await getSavedPosts(currentUser.uid, 10);
      setPosts(fetchedPosts);
      setLastDocSnap(newLastDoc);
      setHasMore(Boolean(fetchedPosts.length >= 10));
      setLoading(false);
    }

    loadInitialSavedPosts();
  }, [currentUser?.uid]);

  const handleLoadMore = async () => {
    if (!lastDocSnap || loadingMore || !currentUser?.uid) return;
    setLoadingMore(true);

    const { posts: newPosts, lastDocSnap: nextLastDoc } = await getSavedPosts(currentUser.uid, 10, lastDocSnap);
    if (newPosts.length > 0) {
      setPosts((prev) => [...prev, ...newPosts]);
      setLastDocSnap(nextLastDoc);
      if (newPosts.length < 10) setHasMore(false);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  const handlePostUnsaved = (postId) => {
    setPosts((prev) => prev.filter(p => p.id !== postId));
  };

  return (
    <div class="space-y-6">
      {/* Header */}
      <div class="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-soft-sm flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button
            onClick={onBackToHome}
            class="p-2 rounded-full hover:bg-brand-lavender text-brand-mainText transition-colors"
          >
            <ArrowLeft class="w-5 h-5" />
          </button>
          <div>
            <h2 class="text-xl font-bold text-brand-mainText flex items-center gap-2">
              <Bookmark class="w-5 h-5 text-brand-purple fill-brand-purple" />
              <span>Saved Posts</span>
            </h2>
            <p class="text-xs text-brand-mutedText mt-0.5">Posts you've bookmarked for later</p>
          </div>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div class="space-y-6">
          {[1, 2].map((n) => (
            <div key={n} class="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-soft-sm animate-pulse space-y-4">
              <div class="flex items-center gap-3">
                <div class="w-11 h-11 bg-brand-lavender rounded-full" />
                <div class="space-y-2 flex-1">
                  <div class="w-32 h-4 bg-brand-lavender rounded" />
                  <div class="w-20 h-3 bg-brand-lavender rounded" />
                </div>
              </div>
              <div class="h-16 bg-brand-lavender rounded-2xl" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div class="bg-brand-surface rounded-3xl p-12 border border-brand-border shadow-soft-sm text-center flex flex-col items-center justify-center space-y-3">
          <div class="w-14 h-14 rounded-full bg-brand-lavender text-brand-purple flex items-center justify-center mb-1">
            <Bookmark class="w-7 h-7" />
          </div>
          <h3 class="font-bold text-lg text-brand-mainText">No saved posts yet</h3>
          <p class="text-xs text-brand-mutedText max-w-xs">
            Save posts by clicking the bookmark icon on any post to easily find them here later.
          </p>
          <div class="pt-2">
            <button
              onClick={onBackToHome}
              class="px-6 py-2.5 rounded-full bg-primary-gradient text-white font-bold text-xs shadow-gradient-glow hover:scale-105 transition-transform"
            >
              Explore Feed
            </button>
          </div>
        </div>
      ) : (
        <div class="space-y-6">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onSelectProfileUsername={onSelectProfileUsername}
              onShowToast={onShowToast}
              onPostDeleted={handlePostUnsaved}
            />
          ))}

          {hasMore && (
            <div class="text-center pt-2 pb-6">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                class="px-6 py-2.5 rounded-full bg-brand-surface border border-brand-border text-brand-purple font-semibold text-xs hover:bg-brand-lavender transition-all shadow-soft-xs inline-flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <Loader2 class="w-4 h-4 animate-spin" />
                    <span>Loading saved posts...</span>
                  </>
                ) : (
                  <span>Load More Saved Posts</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
