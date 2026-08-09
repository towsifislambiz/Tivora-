import React, { useState, useEffect, useRef } from 'react';
import UserAvatar from '../common/UserAvatar';
import { 
  Heart, 
  MessageCircle, 
  Share2, 
  Bookmark, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Link as LinkIcon, 
  Check, 
  Send,
  Loader2,
  X,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { 
  likePost, 
  unlikePost, 
  checkUserLiked, 
  addComment, 
  subscribeToComments, 
  updateComment, 
  deleteComment, 
  savePost, 
  unsavePost, 
  checkUserSaved, 
  sharePost 
} from '../../firebase/interactionService';
import { subscribeToPostDoc } from '../../firebase/postService';
import EditPostModal from './EditPostModal';
import DeletePostModal from './DeletePostModal';
import PostLikersModal from './PostLikersModal';

export function formatPostTime(timestamp) {
  if (!timestamp) return 'Just now';
  let date;
  try {
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'object' && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return 'Just now';
    }

    if (!date || isNaN(date.getTime())) return 'Just now';

    const seconds = Math.floor((new Date() - date) / 1000);
    if (isNaN(seconds) || seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return days === 1 ? 'Yesterday' : `${days}d`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch (e) {
    return 'Just now';
  }
}

export function formatMessageTime(timestamp) {
  if (!timestamp) return 'Just now';
  let date;
  try {
    if (timestamp.toDate && typeof timestamp.toDate === 'function') {
      date = timestamp.toDate();
    } else if (typeof timestamp === 'object' && timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      date = new Date(timestamp);
    } else {
      return 'Just now';
    }

    if (!date || isNaN(date.getTime())) return 'Just now';

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (isToday) return timeStr;
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${timeStr}`;
  } catch (e) {
    return 'Just now';
  }
}

export default function PostCard({ post, onSelectProfileUsername, onShowToast, onPostUpdated, onPostDeleted }) {
  const { currentUser, userDoc } = useAuth();

  // Interaction States
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post?.likesCount || post?.likeCount || 0);
  const [isSaved, setIsSaved] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [commentCount, setCommentCount] = useState(post?.commentCount || post?.commentsCount || 0);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [actionPending, setActionPending] = useState(false);

  // Modals & Popups
  const [showMenu, setShowMenu] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLikersModalOpen, setIsLikersModalOpen] = useState(false);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showHeartOverlay, setShowHeartOverlay] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [shareCount, setShareCount] = useState(post?.shareCount || 0);

  const lastTapRef = useRef(0);
  const menuRef = useRef(null);

  const isOwner = Boolean(
    currentUser && post && (currentUser.uid === post.authorId || currentUser.uid === post.author?.uid)
  );

  const authorName = post.authorDisplayName || post.author?.name || 'Tivora User';
  const authorUsername = (post.authorUsername && post.authorUsername !== 'user') 
    ? post.authorUsername 
    : (post.authorId || post.author?.uid || 'user');
  const authorAvatar = post.authorPhotoURL || post.author?.avatar;
  const timeFormatted = formatPostTime(post.createdAt || post.timeAgo);

  // 1. Initial User Reaction & Save Status Checks
  useEffect(() => {
    if (currentUser?.uid && post?.id) {
      checkUserLiked(post.id, currentUser.uid).then(liked => setIsLiked(liked));
      checkUserSaved(currentUser.uid, post.id).then(saved => setIsSaved(saved));
    }
  }, [currentUser?.uid, post?.id]);

  // 2. Real-time Live Post Subscription
  useEffect(() => {
    if (!post?.id) return;
    const unsubscribe = subscribeToPostDoc(post.id, (livePostData) => {
      if (livePostData) {
        if (livePostData.likeCount !== undefined) setLikeCount(livePostData.likeCount);
        if (livePostData.commentCount !== undefined) setCommentCount(livePostData.commentCount);
        if (livePostData.shareCount !== undefined) setShareCount(livePostData.shareCount);
      }
    });
    return () => unsubscribe();
  }, [post?.id]);

  // 3. Real-time Live Comments Subscription
  useEffect(() => {
    if (!post?.id) return;
    const unsubscribe = subscribeToComments(post.id, (realtimeComments) => {
      setComments(realtimeComments);
      setCommentCount(realtimeComments.length);
    });
    return () => unsubscribe();
  }, [post?.id]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggleLike = async () => {
    if (!currentUser?.uid || !post?.id || actionPending) return;

    const prevLiked = isLiked;
    const prevCount = likeCount;

    setIsLiked(!prevLiked);
    setLikeCount(prevLiked ? Math.max(0, prevCount - 1) : prevCount + 1);
    setActionPending(true);

    try {
      if (prevLiked) {
        await unlikePost(post.id, currentUser.uid);
      } else {
        await likePost(post.id, currentUser.uid);
      }
    } catch (err) {
      setIsLiked(prevLiked);
      setLikeCount(prevCount);
      if (onShowToast) onShowToast("Failed to update like. Please try again.");
    } finally {
      setActionPending(false);
    }
  };

  const handleImageClick = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (!isLiked) {
        handleToggleLike();
      }
      setShowHeartOverlay(true);
      setTimeout(() => setShowHeartOverlay(false), 800);
    } else {
      setTimeout(() => {
        if (Date.now() - lastTapRef.current >= DOUBLE_TAP_DELAY) {
          setIsLightboxOpen(true);
        }
      }, DOUBLE_TAP_DELAY);
    }
    lastTapRef.current = now;
  };

  const handleToggleSave = async () => {
    if (!currentUser?.uid || !post?.id || actionPending) return;

    const prevSaved = isSaved;
    setIsSaved(!prevSaved);
    setActionPending(true);

    try {
      if (prevSaved) {
        await unsavePost(currentUser.uid, post.id);
        if (onShowToast) onShowToast("Removed from Saved Posts.");
      } else {
        await savePost(currentUser.uid, post.id);
        if (onShowToast) onShowToast("Saved to Bookmarks 🔖");
      }
    } catch (err) {
      setIsSaved(prevSaved);
      if (onShowToast) onShowToast("Failed to update saved status.");
    } finally {
      setActionPending(false);
    }
  };

  const handleAddCommentSubmit = async (e) => {
    e?.preventDefault();
    if (!commentText.trim() || !currentUser?.uid || submittingComment) return;

    setSubmittingComment(true);
    try {
      const authorInfo = {
        uid: currentUser.uid,
        username: userDoc?.username || 'user',
        displayName: userDoc?.displayName || currentUser.displayName || 'Tivora User',
        photoURL: userDoc?.photoURL || currentUser.photoURL || ''
      };

      await addComment(post.id, authorInfo, commentText.trim());
      setCommentText('');
      if (onShowToast) onShowToast("Comment added! 💬");
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Failed to post comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpdateCommentSubmit = async (commentId) => {
    if (!editCommentText.trim() || !currentUser?.uid) return;
    try {
      await updateComment(post.id, commentId, currentUser.uid, editCommentText.trim());
      setEditingCommentId(null);
      setEditCommentText('');
      if (onShowToast) onShowToast("Comment updated!");
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Failed to update comment.");
    }
  };

  const handleDeleteCommentClick = async (commentId) => {
    if (!currentUser?.uid) return;
    try {
      await deleteComment(post.id, commentId, currentUser.uid);
      if (onShowToast) onShowToast("Comment deleted.");
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Failed to delete comment.");
    }
  };

  const handleShareClick = async () => {
    if (!post?.id) return;
    const postUrl = await sharePost(post.id, currentUser?.uid);
    setShareCount(prev => prev + 1);

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Tivora Post",
          text: post.content ? post.content.slice(0, 80) : "Check out this post on Tivora",
          url: postUrl
        });
        if (onShowToast) onShowToast("Post shared! 🚀");
        return;
      } catch (e) {}
    }

    navigator.clipboard.writeText(postUrl);
    setCopiedLink(true);
    if (onShowToast) onShowToast(`Post link copied! 📋`);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleAuthorClick = () => {
    const target = (post.authorUsername && post.authorUsername !== 'user') 
      ? post.authorUsername 
      : (post.authorId || post.author?.uid);
    if (onSelectProfileUsername && target) {
      onSelectProfileUsername(target);
    }
  };

  return (
    <div className="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-soft-sm space-y-4 relative">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3.5 cursor-pointer group" onClick={handleAuthorClick}>
          <UserAvatar
            src={authorAvatar}
            name={authorName}
            size="w-11 h-11"
            className="group-hover:scale-105 transition-transform"
          />
          <div>
            <h4 className="font-bold text-sm text-brand-mainText leading-tight group-hover:text-brand-purple transition-colors">
              {authorName}
            </h4>
            <div className="text-xs text-brand-mutedText mt-0.5">
              @{authorUsername} · {timeFormatted}
            </div>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-full hover:bg-brand-lavender text-brand-mutedText transition-colors"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 z-30 w-48 bg-brand-surface rounded-2xl border border-brand-border shadow-soft-lg py-2">
              {isOwner && (
                <>
                  <button
                    onClick={() => { setShowMenu(false); setIsEditModalOpen(true); }}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-brand-mainText hover:bg-brand-lavender flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4 text-brand-purple" /> Edit Post
                  </button>
                  <button
                    onClick={() => { setShowMenu(false); setIsDeleteModalOpen(true); }}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete Post
                  </button>
                  <div className="border-t border-brand-border my-1" />
                </>
              )}
              <button
                onClick={() => { setShowMenu(false); handleShareClick(); }}
                className="w-full px-4 py-2 text-left text-xs font-semibold text-brand-mainText hover:bg-brand-lavender flex items-center gap-2"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <LinkIcon className="w-4 h-4 text-brand-purple" />}
                Copy Link
              </button>
            </div>
          )}
        </div>
      </div>

      {post.content && (
        <p className="text-sm sm:text-base text-brand-mainText leading-relaxed whitespace-pre-line">{post.content}</p>
      )}

      {(post.imageURL || post.image) && (
        <div 
          onClick={handleImageClick}
          className="rounded-2xl overflow-hidden max-h-96 border border-brand-border shadow-soft-xs bg-black/5 relative cursor-pointer group select-none touch-manipulation"
        >
          <img
            src={post.imageURL || post.image}
            alt={`Post by ${authorName}`}
            className="w-full h-full object-cover max-h-96 group-hover:scale-[1.01] transition-transform duration-300"
            loading="lazy"
          />
          {showHeartOverlay && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
              <Heart className="w-24 h-24 fill-brand-pink text-white animate-heartPop drop-shadow-2xl" />
            </div>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-brand-mutedText py-2 border-b border-brand-border">
        <div className="cursor-pointer hover:underline" onClick={() => setIsLikersModalOpen(true)}>
          <span className="font-bold text-brand-mainText">{likeCount}</span> Likes
        </div>
        <div className="flex items-center gap-3">
          <span className="cursor-pointer hover:underline" onClick={() => setShowComments(!showComments)}>{commentCount} Comments</span>
          <span>·</span>
          <span>{shareCount} Shares</span>
        </div>
      </div>

      <div className="flex items-center justify-around pt-1">
        <button
          onClick={handleToggleLike}
          disabled={actionPending}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[48px] touch-manipulation ${
            isLiked ? 'text-brand-pink bg-brand-pink/10' : 'text-brand-mutedText hover:bg-brand-lavender hover:text-brand-purple'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-brand-pink text-brand-pink' : ''}`} />
          <span>{isLiked ? 'Liked' : 'Like'}</span>
        </button>

        <button
          onClick={() => setShowComments(!showComments)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[48px] touch-manipulation ${
            showComments ? 'text-brand-purple bg-brand-purple/10' : 'text-brand-mutedText hover:bg-brand-lavender hover:text-brand-purple'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Comment</span>
        </button>

        <button
          onClick={handleShareClick}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-brand-mutedText hover:bg-brand-lavender hover:text-brand-purple transition-all min-h-[48px] touch-manipulation"
        >
          <Share2 className="w-4 h-4" />
          <span>Share</span>
        </button>

        <button
          onClick={handleToggleSave}
          disabled={actionPending}
          className={`flex items-center justify-center p-3 rounded-xl text-xs sm:text-sm font-semibold transition-all min-h-[48px] min-w-[48px] touch-manipulation ${
            isSaved ? 'text-brand-purple bg-brand-purple/10' : 'text-brand-mutedText hover:bg-brand-lavender hover:text-brand-purple'
          }`}
        >
          <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-brand-purple text-brand-purple' : ''}`} />
        </button>
      </div>

      {showComments && (
        <div className="space-y-4 pt-3 border-t border-dashed border-brand-border">
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {comments.length === 0 ? (
              <p className="text-xs text-brand-mutedText italic text-center py-2">No comments yet.</p>
            ) : (
              comments.map((comment) => {
                const commentIsOwner = currentUser?.uid === comment.authorId;
                const commentTime = formatPostTime(comment.createdAt);
                return (
                  <div key={comment.id} className="flex items-start gap-2.5 group">
                    <UserAvatar src={comment.authorPhotoURL} name={comment.authorDisplayName} size="w-8 h-8" />
                    <div className="bg-brand-lavender p-3.5 rounded-2xl flex-1 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-brand-mainText">{comment.authorDisplayName}</span>
                        {commentIsOwner && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => { setEditingCommentId(comment.id); setEditCommentText(comment.text); }} className="text-brand-purple">Edit</button>
                            <button onClick={() => handleDeleteCommentClick(comment.id)} className="text-red-500">Delete</button>
                          </div>
                        )}
                      </div>
                      {editingCommentId === comment.id ? (
                        <div className="flex items-center gap-2 pt-1">
                          <input type="text" value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} className="flex-1 bg-brand-surface border border-brand-purple rounded-full px-3 py-1 text-xs" />
                          <button onClick={() => handleUpdateCommentSubmit(comment.id)} className="text-brand-purple font-bold">Save</button>
                        </div>
                      ) : (
                        <p className="text-brand-mainText leading-relaxed whitespace-pre-line">{comment.text}</p>
                      )}
                      <div className="text-[0.65rem] text-brand-mutedText">{commentTime}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <form onSubmit={handleAddCommentSubmit} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              disabled={submittingComment}
              className="flex-1 h-9 bg-brand-lavender rounded-full px-4 text-xs text-brand-mainText outline-none"
            />
            <button type="submit" disabled={submittingComment} className="w-9 h-9 rounded-full bg-brand-purple text-white flex items-center justify-center">
              {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      )}

      {isEditModalOpen && (
        <EditPostModal
          isOpen={isEditModalOpen}
          post={post}
          onClose={() => setIsEditModalOpen(false)}
          onPostUpdated={onPostUpdated}
          onShowToast={onShowToast}
        />
      )}

      {isDeleteModalOpen && (
        <DeletePostModal
          isOpen={isDeleteModalOpen}
          post={post}
          onClose={() => setIsDeleteModalOpen(false)}
          onPostDeleted={onPostDeleted}
          onShowToast={onShowToast}
        />
      )}

      {/* Likers Modal Popup */}
      {isLikersModalOpen && (
        <PostLikersModal
          postId={post.id}
          onClose={() => setIsLikersModalOpen(false)}
          onSelectProfileUsername={onSelectProfileUsername}
          onShowToast={onShowToast}
        />
      )}

      {/* Full-Screen Image Lightbox Modal */}
      {isLightboxOpen && (post.imageURL || post.image) && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 p-3 rounded-full bg-white/20 hover:bg-white/40 text-white transition-colors z-50"
            aria-label="Close photo view"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={post.imageURL || post.image}
            alt={`Full size post image`}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
}
