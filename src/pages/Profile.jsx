import React, { useState, useEffect } from 'react';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getUserByUsername } from '../firebase/profileService';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileStats from '../components/profile/ProfileStats';
import ProfileTabs from '../components/profile/ProfileTabs';
import ProfileSkeleton from '../components/profile/ProfileSkeleton';
import EditProfileModal from '../components/profile/EditProfileModal';
import { FastCache } from '../utils/fastCache';

export default function Profile({ targetUsername, onBackToHome, onSelectProfileUsername, onShowToast }) {
  const { currentUser, userDoc } = useAuth();

  // Instant calculation if loading own profile or cached profile
  const isOwnRequest = !targetUsername || (userDoc?.username && targetUsername.toLowerCase() === userDoc.username.toLowerCase());
  const cachedProfile = targetUsername ? FastCache.get(`profile_${targetUsername.toLowerCase()}`) : null;
  const initialData = isOwnRequest ? (userDoc || null) : cachedProfile;

  const [profileData, setProfileData] = useState(initialData);
  const [loadingProfile, setLoadingProfile] = useState(!initialData);
  const [notFound, setNotFound] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    // If we already have initialData (e.g. own profile or cached profile), don't show skeleton!
    if (!initialData) {
      setProfileData(null);
      setNotFound(false);
      setLoadingProfile(true);
    } else {
      setProfileData(initialData);
      setLoadingProfile(false);
    }

    async function loadTargetProfile() {
      try {
        // Case 1: No targetUsername or matches own username → show OWN profile
        if (!targetUsername || (userDoc?.username && targetUsername.toLowerCase() === userDoc.username.toLowerCase())) {
          if (userDoc) {
            setProfileData(userDoc);
            setLoadingProfile(false);
          }
          return;
        }

        // Case 2: Fetch from Firestore
        const fetched = await getUserByUsername(targetUsername);
        if (fetched) {
          setProfileData(fetched);
          FastCache.set(`profile_${targetUsername.toLowerCase()}`, fetched);
        } else {
          setProfileData(null);
          setNotFound(true);
        }
      } catch (err) {
        console.error("Error loading target profile:", err);
        setNotFound(true);
      } finally {
        setLoadingProfile(false);
      }
    }

    loadTargetProfile();
  }, [targetUsername, userDoc?.username, currentUser?.uid]);

  // Determine if this profile belongs to the currently logged-in user
  const isOwner = Boolean(
    (profileData && currentUser && profileData.uid === currentUser.uid) ||
    (!targetUsername && currentUser)
  );

  if (loadingProfile && !profileData) {
    return <ProfileSkeleton />;
  }

  if (notFound || (!profileData && !loadingProfile)) {
    return (
      <div class="bg-brand-surface rounded-3xl p-12 border border-brand-border shadow-soft-sm text-center space-y-4">
        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500">
          <AlertCircle class="w-8 h-8" />
        </div>
        <h2 class="text-2xl font-bold text-brand-mainText">Profile Not Found</h2>
        <p class="text-xs text-brand-mutedText max-w-sm mx-auto">
          We couldn't find a Tivora user with username <strong>@{targetUsername || 'user'}</strong>.
        </p>
        <div class="pt-2">
          <button
            onClick={onBackToHome}
            class="px-6 py-2.5 rounded-full bg-primary-gradient text-white font-bold text-xs shadow-gradient-glow hover:scale-105 transition-transform inline-flex items-center gap-2"
          >
            <ArrowLeft class="w-4 h-4" />
            <span>Back to Home</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div class="space-y-6">
      {/* Profile Header */}
      <ProfileHeader
        profile={profileData}
        isOwner={isOwner}
        onOpenEditModal={() => setIsEditModalOpen(true)}
        onShowToast={onShowToast}
      />

      {/* Profile Stats */}
      <ProfileStats stats={profileData.stats} />

      {/* Profile Navigation Tabs & Content */}
      <ProfileTabs
        profile={profileData}
        isOwner={isOwner}
        onSelectProfileUsername={onSelectProfileUsername}
        onShowToast={onShowToast}
      />

      {/* Edit Profile Modal — only for owner */}
      {isOwner && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}
