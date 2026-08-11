import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { deletePost } from '../../firebase/postService';

export default function DeletePostModal({ isOpen, post, onClose, onPostDeleted, onShowToast }) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !post) return null;

  const handleDelete = async () => {
    setError('');
    setDeleting(true);

    try {
      await deletePost(post.id, post.authorId, post.imageURL);
      if (onShowToast) onShowToast('Post deleted. 🗑️');
      if (onPostDeleted) onPostDeleted(post.id);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to delete post.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-brand-mainText/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-brand-surface rounded-3xl w-full max-w-sm shadow-soft-lg border border-brand-border p-6 space-y-4 animate-in fade-in zoom-in duration-200 text-center">
        <div className="w-14 h-14 rounded-full bg-red-50 text-red-500 inline-flex items-center justify-center">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <h3 className="font-bold text-lg text-brand-mainText">Delete Post?</h3>
        <p className="text-xs text-brand-mutedText max-w-xs mx-auto leading-relaxed">
          Are you sure you want to delete this post? This action cannot be undone.
        </p>

        {error && (
          <p className="text-xs text-red-500 font-semibold">{error}</p>
        )}

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="px-5 py-2.5 rounded-full border border-brand-border text-brand-mainText font-semibold text-xs hover:bg-brand-lavender"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-6 py-2.5 rounded-full bg-red-500 text-white font-bold text-xs shadow-soft-sm hover:bg-red-600 transition-colors inline-flex items-center gap-2"
          >
            {deleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
