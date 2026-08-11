import React, { useState } from 'react';
import { X, Globe, Lock, Loader2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { createGroup, normalizeGroupSlug } from '../../firebase/groupService';
import { compressAndResizeImage } from '../../utils/imageOptimizer';

export default function CreateGroupModal({ isOpen, onClose, onGroupCreated, onShowToast }) {
  const { currentUser } = useAuth();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState('public'); // 'public' | 'private'
  const [groupPhotoURL, setGroupPhotoURL] = useState('');
  const [coverPhotoURL, setCoverPhotoURL] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleNameChange = (e) => {
    const val = e.target.value;
    setName(val);
    if (!slug || slug === normalizeGroupSlug(name)) {
      setSlug(normalizeGroupSlug(val));
    }
  };

  const handleImageUpload = async (e, setImageState) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressAndResizeImage(file, 800, 800, 0.8);
      setImageState(compressed);
    } catch (err) {
      if (onShowToast) onShowToast("Failed to process image.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim() || loading || !currentUser?.uid) return;

    setLoading(true);
    try {
      const newGroup = await createGroup(currentUser.uid, {
        name,
        slug,
        description,
        privacy,
        groupPhotoURL,
        coverPhotoURL
      });

      if (onShowToast) onShowToast(`Group "${newGroup.name}" created successfully! 🎉`);
      if (onGroupCreated) onGroupCreated(newGroup);
      onClose();
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Failed to create group.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-brand-surface border border-brand-border rounded-3xl max-w-lg w-full p-6 shadow-soft-lg space-y-5 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-brand-border pb-3">
          <h3 className="font-bold text-lg text-brand-mainText">Create New Community Group</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-brand-lavender text-brand-mutedText transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group Name */}
          <div>
            <label className="block text-xs font-bold text-brand-mainText mb-1">Group Name *</label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              placeholder="e.g. React Summit 2024"
              required
              className="w-full bg-brand-lavender border border-transparent focus:border-brand-purple focus:bg-brand-surface rounded-xl px-4 py-2.5 text-xs text-brand-mainText outline-none"
            />
          </div>

          {/* Group Slug */}
          <div>
            <label className="block text-xs font-bold text-brand-mainText mb-1">Permanent URL Slug *</label>
            <div className="flex items-center bg-brand-lavender border border-transparent focus-within:border-brand-purple focus-within:bg-brand-surface rounded-xl px-3 text-xs text-brand-mutedText">
              <span>/groups/</span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(normalizeGroupSlug(e.target.value))}
                placeholder="react-summit-2024"
                required
                className="flex-1 bg-transparent py-2.5 outline-none text-brand-mainText font-bold"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-brand-mainText mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this community about?"
              rows={3}
              className="w-full bg-brand-lavender border border-transparent focus:border-brand-purple focus:bg-brand-surface rounded-xl px-4 py-2.5 text-xs text-brand-mainText outline-none resize-none"
            />
          </div>

          {/* Privacy Selector */}
          <div>
            <label className="block text-xs font-bold text-brand-mainText mb-2">Privacy Settings</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPrivacy('public')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                  privacy === 'public'
                    ? 'bg-brand-purple/10 border-brand-purple text-brand-purple'
                    : 'bg-brand-surface border-brand-border text-brand-mutedText hover:bg-brand-lavender'
                }`}
              >
                <Globe className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-xs">Public Group</p>
                  <p className="text-[0.68rem] text-brand-mutedText">Anyone can see feed & join</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPrivacy('private')}
                className={`p-3 rounded-2xl border text-left flex items-start gap-2.5 transition-all ${
                  privacy === 'private'
                    ? 'bg-brand-purple/10 border-brand-purple text-brand-purple'
                    : 'bg-brand-surface border-brand-border text-brand-mutedText hover:bg-brand-lavender'
                }`}
              >
                <Lock className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-xs">Private Group</p>
                  <p className="text-[0.68rem] text-brand-mutedText">Requires admin approval to join</p>
                </div>
              </button>
            </div>
          </div>

          {/* Photo Upload Helpers */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <label className="p-3 border border-dashed border-brand-purple/40 rounded-2xl text-center cursor-pointer hover:bg-brand-lavender transition-all block">
              <ImageIcon className="w-5 h-5 text-brand-purple mx-auto mb-1" />
              <span className="text-xs font-semibold text-brand-purple">Group Photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setGroupPhotoURL)} />
            </label>

            <label className="p-3 border border-dashed border-brand-purple/40 rounded-2xl text-center cursor-pointer hover:bg-brand-lavender transition-all block">
              <ImageIcon className="w-5 h-5 text-brand-purple mx-auto mb-1" />
              <span className="text-xs font-semibold text-brand-purple">Cover Banner</span>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, setCoverPhotoURL)} />
            </label>
          </div>

          <div className="pt-3 flex items-center justify-end gap-3 border-t border-brand-border">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full font-semibold text-xs text-brand-mutedText hover:underline"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !slug.trim()}
              className="px-6 py-2.5 bg-primary-gradient text-white font-bold text-xs rounded-full shadow-gradient-glow hover:scale-105 transition-transform disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Create Group</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
