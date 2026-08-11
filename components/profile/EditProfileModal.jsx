import React, { useState } from 'react';
import { X, User, MapPin, AlignLeft, Lock, AlertCircle, Plus, Camera, Image, Loader2, Zap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { compressAndResizeImage } from '../../utils/imageOptimizer';
import { uploadProfileImage, uploadCoverImage } from '../../firebase/storageService';

export default function EditProfileModal({ isOpen, onClose, onShowToast }) {
  const { currentUser, userDoc, updateProfileData } = useAuth();

  const [displayName, setDisplayName] = useState(userDoc?.displayName || '');
  const [photoURL, setPhotoURL] = useState(userDoc?.photoURL || '');
  const [coverPhotoURL, setCoverPhotoURL] = useState(userDoc?.coverPhotoURL || userDoc?.coverURL || '');
  const [bio, setBio] = useState(userDoc?.bio || '');
  const [location, setLocation] = useState(userDoc?.location || '');
  const [hobbies, setHobbies] = useState(userDoc?.hobbies || ['Coding', 'Gaming']);
  const [newHobbyInput, setNewHobbyInput] = useState('');

  const [optimizingProfile, setOptimizingProfile] = useState(false);
  const [optimizingCover, setOptimizingCover] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const permanentUsername = userDoc?.username || userDoc?.profileId || 'user';

  const handleAddHobby = (e) => {
    e?.preventDefault();
    const trimmed = newHobbyInput.trim();
    if (!trimmed) return;
    if (hobbies.some(h => h.toLowerCase() === trimmed.toLowerCase())) {
      setError(`"${trimmed}" is already in your hobbies list.`);
      return;
    }
    if (hobbies.length >= 12) {
      setError("You can add a maximum of 12 hobbies.");
      return;
    }
    setError('');
    setHobbies([...hobbies, trimmed]);
    setNewHobbyInput('');
  };

  const handleRemoveHobby = (indexToRemove) => {
    setHobbies(hobbies.filter((_, idx) => idx !== indexToRemove));
  };

  // Instant Client-Side Image Resizing & Compression (Profile Picture)
  const handleProfileImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setOptimizingProfile(true);

    try {
      // 1. Instant Canvas Resize & Smart Compress (Max 400x400, Target ~50-70KB)
      const compressedDataUrl = await compressAndResizeImage(file, 400, 400, 70);
      setPhotoURL(compressedDataUrl);

      if (onShowToast) {
        onShowToast('Profile picture optimized & updated! ⚡');
      }

      // 2. Optional background upload to Firebase Storage
      if (currentUser?.uid) {
        uploadProfileImage(currentUser.uid, file)
          .then(url => { if (url) setPhotoURL(url); })
          .catch(err => console.warn('Background Storage upload notice:', err.message));
      }
    } catch (err) {
      setError(err.message || 'Failed to process image.');
    } finally {
      setOptimizingProfile(false);
    }
  };

  // Instant Client-Side Image Resizing & Compression (Cover Photo)
  const handleCoverImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setOptimizingCover(true);

    try {
      // 1. Instant Canvas Resize & Smart Compress (Max 1200x500, Target ~120-150KB)
      const compressedDataUrl = await compressAndResizeImage(file, 1200, 500, 150);
      setCoverPhotoURL(compressedDataUrl);

      if (onShowToast) {
        onShowToast('Cover photo optimized & updated! ⚡');
      }

      // 2. Optional background upload to Firebase Storage
      if (currentUser?.uid) {
        uploadCoverImage(currentUser.uid, file)
          .then(url => { if (url) setCoverPhotoURL(url); })
          .catch(err => console.warn('Background Storage upload notice:', err.message));
      }
    } catch (err) {
      setError(err.message || 'Failed to process image.');
    } finally {
      setOptimizingCover(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim()) {
      setError('Display Name is required.');
      return;
    }

    setSaving(true);
    try {
      await updateProfileData({
        displayName: displayName.trim(),
        photoURL,
        coverPhotoURL,
        bio: bio.trim(),
        location: location.trim(),
        hobbies
      });

      if (onShowToast) onShowToast('Profile updated successfully! 🎉');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-brand-mainText/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-brand-surface rounded-3xl w-full max-w-lg shadow-soft-lg border border-brand-border overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
          <h3 className="font-bold text-lg text-brand-mainText">Edit Tivora Profile</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-brand-lavender text-brand-mutedText hover:text-brand-mainText flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* 1. Permanent Username (Read-Only) */}
          <div className="space-y-1.5 bg-brand-lavender/60 p-3.5 rounded-2xl border border-brand-border">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-brand-mainText flex items-center gap-1.5">
                <span>Unique Tivora Profile ID</span>
                <Lock className="w-3.5 h-3.5 text-brand-purple" />
              </label>
              <span className="text-[0.65rem] font-bold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded-full">
                PERMANENT
              </span>
            </div>
            <p className="text-xs font-bold text-brand-purple">@{permanentUsername}</p>
            <p className="text-[0.68rem] text-brand-mutedText">
              This unique profile ID is permanent and cannot be changed.
            </p>
          </div>

          {/* 2. Display Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-brand-mainText block">Display Name</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-mutedText pointer-events-none" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Towsif Islam"
                className="w-full h-11 bg-brand-lavender border border-transparent focus:border-brand-purple focus:bg-brand-surface rounded-full pl-11 pr-4 text-xs sm:text-sm text-brand-mainText outline-none transition-all"
              />
            </div>
          </div>

          {/* 3. Profile Picture Upload with Instant Optimizer */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-brand-mainText block">Profile Picture</label>
            <div className="flex items-center gap-4">
              {photoURL ? (
                <img src={photoURL} alt="Profile" className="w-14 h-14 rounded-full object-cover border-2 border-brand-purple shadow-soft-sm" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary-gradient text-white flex items-center justify-center font-bold text-lg shadow-soft-sm">
                  {displayName ? displayName.slice(0, 2).toUpperCase() : 'TV'}
                </div>
              )}
              <div className="flex-1 space-y-1">
                <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-gradient text-white font-bold text-xs cursor-pointer shadow-gradient-glow hover:scale-105 transition-all">
                  {optimizingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Optimizing image...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                      <span>Instant Upload Photo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleProfileImageUpload}
                    disabled={optimizingProfile}
                    className="hidden"
                  />
                </label>
                <p className="text-[0.68rem] text-brand-mutedText">Auto-compressed & scaled to 400x400 for super-fast loading.</p>
              </div>
            </div>
          </div>

          {/* 4. Cover Photo Upload with Instant Optimizer */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-brand-mainText block">Cover Photo</label>
            <div className="space-y-2">
              <div className="h-28 rounded-2xl bg-cover-gradient overflow-hidden relative border border-brand-border shadow-soft-sm">
                {coverPhotoURL ? (
                  <img src={coverPhotoURL} alt="Cover" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-cover-gradient opacity-90 flex items-center justify-center text-xs text-white/80 font-medium">
                    Gradient Cover Fallback
                  </div>
                )}
              </div>
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-lavender text-brand-purple hover:bg-brand-purple/10 font-bold text-xs cursor-pointer transition-all border border-brand-purple/30">
                {optimizingCover ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Optimizing cover...</span>
                  </>
                ) : (
                  <>
                    <Image className="w-4 h-4" />
                    <span>Instant Upload Cover Photo</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverImageUpload}
                  disabled={optimizingCover}
                  className="hidden"
                />
              </label>
              <p className="text-[0.68rem] text-brand-mutedText">Auto-compressed to 1200x500 for lightning fast page loads.</p>
            </div>
          </div>

          {/* 5. Bio */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-brand-mainText block">Bio</label>
            <div className="relative">
              <AlignLeft className="absolute left-4 top-3 w-4 h-4 text-brand-mutedText pointer-events-none" />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell people about yourself..."
                className="w-full min-h-[90px] bg-brand-lavender border border-transparent focus:border-brand-purple focus:bg-brand-surface rounded-2xl pl-11 pr-4 py-2.5 text-xs sm:text-sm text-brand-mainText outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* 6. Location */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-brand-mainText block">Location</label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-mutedText pointer-events-none" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Dhaka, Bangladesh"
                className="w-full h-11 bg-brand-lavender border border-transparent focus:border-brand-purple focus:bg-brand-surface rounded-full pl-11 pr-4 text-xs sm:text-sm text-brand-mainText outline-none transition-all"
              />
            </div>
          </div>

          {/* 7. Hobbies Dynamic Tag System */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-brand-mainText block">Hobbies & Interests</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {hobbies.map((hobby, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-lavender text-brand-purple text-xs font-semibold border border-brand-purple/20"
                >
                  <span>{hobby}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveHobby(idx)}
                    className="w-3.5 h-3.5 rounded-full hover:bg-brand-purple/20 flex items-center justify-center text-brand-purple"
                  >
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newHobbyInput}
                onChange={(e) => setNewHobbyInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleAddHobby(e); }}
                placeholder="Add hobby (e.g. Coding, Gaming)..."
                className="flex-1 h-9 bg-brand-lavender border border-transparent focus:border-brand-purple focus:bg-brand-surface rounded-full px-4 text-xs text-brand-mainText outline-none"
              />
              <button
                type="button"
                onClick={handleAddHobby}
                className="h-9 px-4 rounded-full bg-brand-purple text-white font-bold text-xs hover:bg-brand-purple/90 flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Actions */}
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
              disabled={saving || optimizingProfile || optimizingCover}
              className="px-6 py-2 rounded-full bg-primary-gradient text-white font-semibold text-xs shadow-gradient-glow hover:scale-105 transition-transform disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
