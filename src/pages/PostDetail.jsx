import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { getPostById } from '../firebase/postService';
import PostCard from '../components/feed/PostCard';

export default function PostDetail({ postId, onBackToHome, onSelectProfileUsername, onShowToast }) {
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function loadPost() {
      if (!postId) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setNotFound(false);

      try {
        const fetched = await getPostById(postId);
        if (fetched) {
          setPost(fetched);
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error("Error loading post:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    loadPost();
  }, [postId]);

  if (loading) {
    return (
      <div class="bg-brand-surface rounded-3xl p-12 border border-brand-border shadow-soft-sm text-center animate-pulse space-y-4">
        <div class="w-12 h-12 bg-brand-lavender rounded-full mx-auto" />
        <div class="h-4 bg-brand-lavender rounded max-w-xs mx-auto" />
        <div class="h-32 bg-brand-lavender rounded-2xl" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div class="bg-brand-surface rounded-3xl p-12 border border-brand-border shadow-soft-sm text-center space-y-4">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500">
          <AlertCircle class="w-8 h-8" />
        </div>
        <h2 class="text-2xl font-bold text-brand-mainText">Post Not Found</h2>
        <p class="text-xs text-brand-mutedText max-w-sm mx-auto">
          The post you are looking for does not exist or has been removed.
        </p>
        <div class="pt-2">
          <button
            onClick={onBackToHome}
            class="px-6 py-2.5 rounded-full bg-primary-gradient text-white font-bold text-xs shadow-gradient-glow hover:scale-105 transition-transform inline-flex items-center gap-2"
          >
            <ArrowLeft class="w-4 h-4" />
            <span>Back to Feed</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div class="space-y-4">
      <div class="flex items-center justify-between">
        <button
          onClick={onBackToHome}
          class="px-4 py-2 rounded-full bg-brand-surface border border-brand-border text-brand-mainText font-semibold text-xs hover:bg-brand-lavender transition-all inline-flex items-center gap-2 shadow-soft-xs"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Back to Feed</span>
        </button>
      </div>

      <PostCard
        post={post}
        onSelectProfileUsername={onSelectProfileUsername}
        onShowToast={onShowToast}
        onPostUpdated={(updated) => setPost(updated)}
        onPostDeleted={() => onBackToHome()}
      />
    </div>
  );
}
