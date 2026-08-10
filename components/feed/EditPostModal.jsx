import React, { useState } from 'react';
import { X, Image, Trash2, AlertCircle, Loader2, Zap } from 'lucide-react';
import { compressAndResizeImage } from '../../utils/imageOptimizer';
import { updatePost } from '../../firebase/postService';

export default function EditPostModal({ isOpen, post, onClose, onPostUpdated, onShowToast }) {
  const [content, setContent] = useState(post?.content || '');
  const [currentImageURL, setCurrentImageURL] = useState(post?.imageURL || null);
  const [newImageFile, setNewImageFile] = useState(null);
  const [newImagePreview, setNewImagePreview] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !post) return null;

  const handleImageSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');

    try {
      const compressedDataUrl = await compressAndResizeImage(file, 1200, 1200, 0.85);
      setNewImageFile(file);
      setNewImagePreview(compressedDataUrl);
      setRemoveImage(false);
    } catch (err) {
      setError(err.message || 'Failed to process image.');
    }
  };

  const handleRemoveCurrentImage = () => {
    setCurrentImageURL(null);
    setNewImageFile(null);
    setNewImagePreview(null);
    setRemoveImage(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedContent = content.trim();
    const finalImagePresent = (!removeImage && currentImageURL) || newImagePreview;

    if (!trimmedContent && !finalImagePresent) {
      setError('A post must contain either text content or an image.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updatePost(
        post.id,
        post.authorId,
        trimmedContent,
        newImagePreview || newImageFile,
        removeImage
      );

      if (onShowToast) onShowToast('Post updated successfully! ✨');
      if (onPostUpdated) onPostUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update post.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-brand-mainText/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-brand-surface rounded-3xl w-full max-w-lg shadow-soft-lg border border-brand-border overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h3 className="font-bold text-lg text-brand-mainText">Edit Post</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-brand-lavender text-brand-mutedText hover:text-brand-mainText flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Edit your post content..."
            className="w-full min-h-[120px] text-sm text-brand-mainText outline-none resize-none bg-brand-lavender/50 focus:bg-brand-surface border border-transparent focus:border-brand-purple rounded-2xl p-4 transition-all"
          />

          {/* Image Preview Container */}
          {(newImagePreview || (currentImageURL && !removeImage)) && (
            <div className="relative rounded-2xl overflow-hidden max-h-80 border border-brand-border bg-slate-950/90 flex items-center justify-center group">
              <div 
                className="absolute inset-0 bg-cover bg-center blur-xl opacity-30 pointer-events-none"
                style={{ backgroundImage: `url(${newImagePreview || currentImageURL})` }}
              />
              <img
                src={newImagePreview || currentImageURL}
                alt="Post Attachment Preview"
                className="relative z-10 w-full h-auto max-h-80 object-contain mx-auto"
              />
              <button
                type="button"
                onClick={handleRemoveCurrentImage}
                className="absolute top-2 right-2 z-20 p-2 rounded-full bg-red-500 text-white shadow-soft-md hover:bg-red-600 transition-colors"
                title="Remove Image"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Replace Image Button */}
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-lavender text-brand-purple hover:bg-brand-purple/10 font-bold text-xs cursor-pointer transition-all border border-brand-purple/20">
              <Image className="w-4 h-4" />
              <span>{(newImagePreview || (currentImageURL && !removeImage)) ? 'Replace Image' : 'Add Image'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-brand-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full border border-brand-border text-brand-mainText font-semibold text-xs hover:bg-brand-lavender"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-full bg-primary-gradient text-white font-semibold text-xs shadow-gradient-glow hover:scale-105 transition-transform disabled:opacity-50 inline-flex items-center gap-2"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Changes</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
