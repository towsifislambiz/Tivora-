import React, { useState, useEffect } from 'react';
import { Loader2, MessageSquarePlus } from 'lucide-react';
import CreatePostCard from '../components/feed/CreatePostCard';
import FeedTabs from '../components/feed/FeedTabs';
import PostCard from '../components/feed/PostCard';
import { getHomeFeedPosts, subscribeToHomeFeed } from '../firebase/postService';
import { FastCache } from '../utils/fastCache';
import { useAuth } from '../hooks/useAuth';

export default function Home({ onOpenCreateModal, onSelectProfileUsername, onShowToast, createdPostSignal }) {
  const { currentUser, isDemoUser } = useAuth();
  const cacheKey = isDemoUser ? 'home_feed_demo' : `home_feed_${currentUser?.uid || 'guest'}`;
  const cachedFeed = FastCache.get(cacheKey);

  const [posts, setPosts] = useState(cachedFeed?.posts || []);
  const [lastDocSnap, setLastDocSnap] = useState(cachedFeed?.lastDocSnap || null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(cachedFeed ? cachedFeed.hasMore : true);

  const userContext = { currentUid: currentUser?.uid, isDemoUser };

  // Real-time Live Feed Subscription (Instant 0ms render for fast net, skeleton only on slow net >250ms)
  useEffect(() => {
    let networkDelayTimer = null;

    if (!posts || posts.length === 0) {
      networkDelayTimer = setTimeout(() => {
        setLoading(true);
      }, 250);
    }

    const unsubscribe = subscribeToHomeFeed(8, ({ posts: fetchedPosts, lastDocSnap: newLastDoc }) => {
      if (networkDelayTimer) clearTimeout(networkDelayTimer);
      setPosts(fetchedPosts);
      setLastDocSnap(newLastDoc);
      const moreAvailable = Boolean(fetchedPosts.length >= 8);
      setHasMore(moreAvailable);
      setLoading(false);

      FastCache.set(cacheKey, {
        posts: fetchedPosts,
        lastDocSnap: newLastDoc,
        hasMore: moreAvailable
      });
    }, userContext);

    return () => {
      if (networkDelayTimer) clearTimeout(networkDelayTimer);
      unsubscribe();
    };
  }, [currentUser?.uid, isDemoUser, cacheKey]);

  // Sync newly created post when created via modal or card
  useEffect(() => {
    if (createdPostSignal) {
      setPosts((prev) => {
        const updated = [createdPostSignal, ...prev.filter(p => p.id !== createdPostSignal.id)];
        FastCache.set(cacheKey, { posts: updated, lastDocSnap, hasMore });
        return updated;
      });
    }
  }, [createdPostSignal, cacheKey]);

  const handleLoadMore = async () => {
    if (!lastDocSnap || loadingMore) return;
    setLoadingMore(true);

    const { posts: newPosts, lastDocSnap: nextLastDoc } = await getHomeFeedPosts(8, lastDocSnap, userContext);
    if (newPosts.length > 0) {
      setPosts((prev) => {
        const updated = [...prev, ...newPosts];
        const moreAvailable = newPosts.length >= 8;
        setHasMore(moreAvailable);
        FastCache.set(cacheKey, { posts: updated, lastDocSnap: nextLastDoc, hasMore: moreAvailable });
        return updated;
      });
      setLastDocSnap(nextLastDoc);
    } else {
      setHasMore(false);
    }
    setLoadingMore(false);
  };

  const handlePostUpdated = (updatedPost) => {
    setPosts((prev) => {
      const updated = prev.map(p => p.id === updatedPost.id ? updatedPost : p);
      FastCache.set('home_feed', { posts: updated, lastDocSnap, hasMore });
      return updated;
    });
  };

  const handlePostDeleted = (deletedPostId) => {
    setPosts((prev) => {
      const updated = prev.filter(p => p.id !== deletedPostId);
      FastCache.set('home_feed', { posts: updated, lastDocSnap, hasMore });
      return updated;
    });
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-24 lg:pb-8">
      {/* Create Post Prompt Banner */}
      <CreatePostCard
        onOpenCreateModal={onOpenCreateModal}
        onPostCreated={(newPost) => {
          setPosts((prev) => {
            const updated = [newPost, ...prev];
            FastCache.set('home_feed', { posts: updated, lastDocSnap, hasMore });
            return updated;
          });
        }}
      />

      {/* Feed Filters Header */}
      <FeedTabs />

      {/* Feed Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-brand-surface rounded-3xl p-6 border border-brand-border animate-pulse space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-brand-lavender rounded-full" />
                <div className="space-y-2 flex-1">
                  <div className="w-32 h-3.5 bg-brand-lavender rounded-full" />
                  <div className="w-20 h-2.5 bg-brand-lavender rounded-full" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="w-full h-3 bg-brand-lavender rounded-full" />
                <div className="w-4/5 h-3 bg-brand-lavender rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-brand-surface rounded-3xl p-12 border border-brand-border text-center space-y-4 shadow-soft-sm">
          <div className="w-16 h-16 rounded-full bg-brand-lavender text-brand-purple flex items-center justify-center mx-auto">
            <MessageSquarePlus className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-brand-mainText">No posts yet</h3>
            <p className="text-xs text-brand-mutedText max-w-sm mx-auto">
              Be the first to share something with the Tivora community!
            </p>
          </div>
          <button
            onClick={onOpenCreateModal}
            className="px-6 py-2.5 rounded-full bg-primary-gradient text-white font-bold text-xs shadow-gradient-glow hover:scale-105 transition-transform"
          >
            Create First Post
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onSelectProfileUsername={onSelectProfileUsername}
              onShowToast={onShowToast}
              onPostUpdated={handlePostUpdated}
              onPostDeleted={handlePostDeleted}
            />
          ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4 pb-2">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 py-3 rounded-full bg-brand-surface border border-brand-border text-brand-mainText font-bold text-xs hover:bg-brand-lavender hover:text-brand-purple transition-all shadow-soft-xs disabled:opacity-50 inline-flex items-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-brand-purple" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>Load More Posts</span>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
