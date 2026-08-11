import React, { useState, useEffect } from 'react';
import { 
  Globe, 
  Lock, 
  Users, 
  MessageSquare, 
  UserPlus, 
  UserCheck, 
  LogOut, 
  Pin, 
  Loader2, 
  ArrowLeft, 
  Plus, 
  Image as ImageIcon, 
  Send 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getGroupBySlug, getGroupById } from '../firebase/groupService';
import { 
  getMembershipStatus, 
  joinPublicGroup, 
  requestToJoinPrivateGroup, 
  cancelJoinRequest, 
  leaveGroup 
} from '../firebase/groupMembershipService';
import { 
  createGroupPost, 
  subscribeToGroupPosts, 
  togglePinGroupPost, 
  deleteGroupPost 
} from '../firebase/groupPostService';
import GroupMembers from '../components/groups/GroupMembers';
import PostCard from '../components/feed/PostCard';
import { compressAndResizeImage } from '../utils/imageOptimizer';

export default function GroupDetails({ groupSlug, groupId: propGroupId, onBack, onSelectProfileUsername, onShowToast }) {
  const { currentUser, userDoc } = useAuth();

  const [group, setGroup] = useState(null);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [myRole, setMyRole] = useState('none'); // 'owner' | 'admin' | 'moderator' | 'member' | 'pending' | 'none'
  const [activeTab, setActiveTab] = useState('posts'); // 'posts' | 'about' | 'members'
  const [pendingAction, setPendingAction] = useState(false);

  // Group Feed State
  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState('');
  const [creatingPost, setCreatingPost] = useState(false);

  // 1. Fetch group profile document
  useEffect(() => {
    async function loadGroupDoc() {
      setLoadingGroup(true);
      let gDoc = null;
      if (groupSlug) {
        gDoc = await getGroupBySlug(groupSlug);
      } else if (propGroupId) {
        gDoc = await getGroupById(propGroupId);
      }

      setGroup(gDoc);
      setLoadingGroup(false);
    }

    loadGroupDoc();
  }, [groupSlug, propGroupId]);

  // 2. Fetch membership status
  useEffect(() => {
    async function loadMembership() {
      if (!group?.id || !currentUser?.uid) return;
      const status = await getMembershipStatus(group.id, currentUser.uid);
      setMyRole(status);
    }

    loadMembership();
  }, [group?.id, currentUser?.uid]);

  // 3. Subscribe to real-time group posts
  useEffect(() => {
    if (!group?.id) return;
    const isMemberOrPublic = group.privacy === 'public' || ['owner', 'admin', 'moderator', 'member'].includes(myRole);
    if (!isMemberOrPublic) return;

    const unsubscribe = subscribeToGroupPosts(group.id, (fetchedPosts) => {
      setPosts(fetchedPosts);
    });

    return () => unsubscribe();
  }, [group?.id, group?.privacy, myRole]);

  const isMember = ['owner', 'admin', 'moderator', 'member'].includes(myRole);
  const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';

  // Action: Join Public Group
  const handleJoinClick = async () => {
    if (!group?.id || !currentUser?.uid || pendingAction) return;
    setPendingAction(true);
    setMyRole('member');

    try {
      await joinPublicGroup(group.id, currentUser.uid);
      setGroup(prev => ({ ...prev, memberCount: (prev.memberCount || 0) + 1 }));
      if (onShowToast) onShowToast(`Joined ${group.name}! 🎉`);
    } catch (err) {
      setMyRole('none');
      if (onShowToast) onShowToast(err.message || "Failed to join group.");
    } finally {
      setPendingAction(false);
    }
  };

  // Action: Request Private Group
  const handleRequestClick = async () => {
    if (!group?.id || !currentUser?.uid || pendingAction) return;
    setPendingAction(true);
    setMyRole('pending');

    try {
      const actorData = {
        displayName: userDoc?.displayName || currentUser.displayName || 'Tivora User',
        username: userDoc?.username || 'user',
        photoURL: userDoc?.photoURL || ''
      };
      await requestToJoinPrivateGroup(group.id, currentUser.uid, actorData);
      if (onShowToast) onShowToast("Join request sent to group admins! ⏳");
    } catch (err) {
      setMyRole('none');
      if (onShowToast) onShowToast(err.message || "Failed to send request.");
    } finally {
      setPendingAction(false);
    }
  };

  // Action: Cancel Request
  const handleCancelRequestClick = async () => {
    if (!group?.id || !currentUser?.uid || pendingAction) return;
    setPendingAction(true);
    setMyRole('none');

    try {
      await cancelJoinRequest(group.id, currentUser.uid);
      if (onShowToast) onShowToast("Join request cancelled.");
    } catch (err) {
      setMyRole('pending');
      if (onShowToast) onShowToast(err.message || "Failed to cancel request.");
    } finally {
      setPendingAction(false);
    }
  };

  // Action: Leave Group
  const handleLeaveGroupClick = async () => {
    if (!group?.id || !currentUser?.uid || pendingAction) return;
    if (myRole === 'owner') {
      if (onShowToast) onShowToast("Group owner cannot leave without transferring ownership.");
      return;
    }

    setPendingAction(true);
    setMyRole('none');

    try {
      await leaveGroup(group.id, currentUser.uid);
      setGroup(prev => ({ ...prev, memberCount: Math.max(1, (prev.memberCount || 1) - 1) }));
      if (onShowToast) onShowToast(`Left ${group.name}.`);
    } catch (err) {
      setMyRole('member');
      if (onShowToast) onShowToast(err.message || "Failed to leave group.");
    } finally {
      setPendingAction(false);
    }
  };

  // Handle Post Creation inside Group
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const compressed = await compressAndResizeImage(file, 1000, 1000, 0.85);
      setPostImage(compressed);
    } catch (err) {
      if (onShowToast) onShowToast("Failed to process post image.");
    }
  };

  const handleCreatePostSubmit = async (e) => {
    e.preventDefault();
    if ((!postText.trim() && !postImage) || creatingPost || !currentUser?.uid || !group?.id) return;

    setCreatingPost(true);
    try {
      const author = {
        uid: currentUser.uid,
        username: userDoc?.username || 'user',
        displayName: userDoc?.displayName || currentUser.displayName || 'Tivora User',
        photoURL: userDoc?.photoURL || currentUser.photoURL || ''
      };

      await createGroupPost(group.id, author, { content: postText.trim(), imageURL: postImage });
      setPostText('');
      setPostImage('');
      if (onShowToast) onShowToast("Posted to group feed! 🚀");
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Failed to publish post.");
    } finally {
      setCreatingPost(false);
    }
  };

  if (loadingGroup) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
        <p className="text-xs text-brand-mutedText font-semibold">Loading community group...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="bg-brand-surface rounded-3xl p-12 border border-brand-border text-center space-y-3">
        <h3 className="font-bold text-lg text-brand-mainText">Group Not Found</h3>
        <p className="text-xs text-brand-mutedText">The group you're looking for doesn't exist or may have been removed.</p>
        {onBack && (
          <button onClick={onBack} className="px-5 py-2 rounded-full bg-brand-lavender text-brand-purple font-bold text-xs">
            Back to Groups
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Toolbar */}
      {onBack && (
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-brand-purple hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Groups</span>
        </button>
      )}

      {/* Group Header Banner */}
      <div className="bg-brand-surface rounded-3xl border border-brand-border shadow-soft-sm overflow-hidden">
        <div className="h-44 sm:h-56 relative bg-cover-gradient">
          {group.coverPhotoURL ? (
            <img src={group.coverPhotoURL} alt={group.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-cover-gradient opacity-90" />
          )}
        </div>

        <div className="px-6 sm:px-8 pb-6 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-14 sm:-mt-16 mb-4 gap-4">
            <div className="relative">
              {group.groupPhotoURL ? (
                <img src={group.groupPhotoURL} alt={group.name} className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-brand-surface object-cover shadow-soft-md" />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-4 border-brand-surface bg-primary-gradient text-white flex items-center justify-center font-bold text-2xl shadow-soft-md">
                  {group.name[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Dynamic Membership Action Buttons */}
            <div className="flex items-center gap-3">
              {myRole === 'none' && group.privacy === 'public' && (
                <button
                  onClick={handleJoinClick}
                  disabled={pendingAction}
                  className="px-6 py-2.5 rounded-full bg-primary-gradient text-white font-bold text-sm shadow-gradient-glow hover:scale-105 transition-transform flex items-center gap-1.5"
                >
                  {pendingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>Join Group</span>
                </button>
              )}

              {myRole === 'none' && group.privacy === 'private' && (
                <button
                  onClick={handleRequestClick}
                  disabled={pendingAction}
                  className="px-6 py-2.5 rounded-full bg-primary-gradient text-white font-bold text-sm shadow-gradient-glow hover:scale-105 transition-transform flex items-center gap-1.5"
                >
                  {pendingAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  <span>Request to Join</span>
                </button>
              )}

              {myRole === 'pending' && (
                <div className="flex items-center gap-2">
                  <span className="px-4 py-2 rounded-full bg-brand-lavender text-brand-purple font-semibold text-xs border border-brand-purple/20">
                    Request Sent
                  </span>
                  <button
                    onClick={handleCancelRequestClick}
                    disabled={pendingAction}
                    className="px-4 py-2 rounded-full border border-red-200 text-red-600 font-semibold text-xs hover:bg-red-50"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {isMember && (
                <div className="flex items-center gap-2">
                  <span className="px-4 py-2 rounded-full bg-emerald-50 text-emerald-600 font-bold text-xs border border-emerald-200 flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Joined ({myRole})</span>
                  </span>

                  {myRole !== 'owner' && (
                    <button
                      onClick={handleLeaveGroupClick}
                      disabled={pendingAction}
                      className="px-4 py-2 rounded-full border border-brand-border text-brand-mutedText hover:text-red-600 hover:border-red-200 font-semibold text-xs transition-all"
                    >
                      Leave
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Group Identity Info */}
          <div className="space-y-2">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-brand-mainText">{group.name}</h1>
              <span className={`px-3 py-1 rounded-full text-[0.7rem] font-bold flex items-center gap-1 ${
                group.privacy === 'private' ? 'bg-amber-100 text-amber-700' : 'bg-brand-purple/10 text-brand-purple'
              }`}>
                {group.privacy === 'private' ? <Lock className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                <span>{group.privacy === 'private' ? 'Private Group' : 'Public Group'}</span>
              </span>
            </div>

            <p className="text-xs font-bold text-brand-purple">/groups/{group.slug}</p>
            <p className="text-sm text-brand-mainText max-w-2xl leading-relaxed">{group.description}</p>
            
            <div className="flex items-center gap-4 text-xs text-brand-mutedText pt-1">
              <div className="flex items-center gap-1 font-semibold">
                <Users className="w-4 h-4 text-brand-purple" />
                <span>{group.memberCount || 1} Members</span>
              </div>
              <div className="flex items-center gap-1 font-semibold">
                <MessageSquare className="w-4 h-4 text-brand-pink" />
                <span>{group.postCount || 0} Posts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Group Tabs */}
        <div className="flex items-center gap-2 px-6 border-t border-brand-border pt-3 pb-3 bg-brand-surface">
          <button
            onClick={() => setActiveTab('posts')}
            className={`px-5 py-2 rounded-full font-bold text-xs transition-all ${
              activeTab === 'posts'
                ? 'bg-primary-gradient text-white shadow-gradient-glow'
                : 'bg-brand-lavender text-brand-mutedText hover:text-brand-purple'
            }`}
          >
            Feed
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-5 py-2 rounded-full font-bold text-xs transition-all ${
              activeTab === 'members'
                ? 'bg-primary-gradient text-white shadow-gradient-glow'
                : 'bg-brand-lavender text-brand-mutedText hover:text-brand-purple'
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`px-5 py-2 rounded-full font-bold text-xs transition-all ${
              activeTab === 'about'
                ? 'bg-primary-gradient text-white shadow-gradient-glow'
                : 'bg-brand-lavender text-brand-mutedText hover:text-brand-purple'
            }`}
          >
            About
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'posts' ? (
        group.privacy === 'private' && !isMember ? (
          <div className="bg-brand-surface rounded-3xl p-12 border border-brand-border shadow-soft-sm text-center space-y-3">
            <Lock className="w-10 h-10 text-amber-500 mx-auto" />
            <h3 className="font-bold text-base text-brand-mainText">This Group is Private</h3>
            <p className="text-xs text-brand-mutedText max-w-xs mx-auto">
              Join this group to view its feed, posts, and participate in discussions.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Create Post Composer for Members */}
            {isMember && (
              <div className="bg-brand-surface rounded-3xl border border-brand-border p-5 shadow-soft-sm space-y-3">
                <form onSubmit={handleCreatePostSubmit} className="space-y-3">
                  <textarea
                    value={postText}
                    onChange={(e) => setPostText(e.target.value)}
                    placeholder={`What's on your mind, ${userDoc?.displayName || 'Tivora User'}?`}
                    rows={3}
                    className="w-full bg-brand-lavender border border-transparent focus:border-brand-purple focus:bg-brand-surface rounded-2xl p-3 text-xs sm:text-sm text-brand-mainText outline-none resize-none transition-all placeholder:text-brand-mutedText/70"
                  />

                  {postImage && (
                    <div className="relative max-h-44 rounded-2xl overflow-hidden border border-brand-border">
                      <img src={postImage} alt="Post preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPostImage('')}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black"
                      >
                        ✕
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <label className="px-3 py-1.5 rounded-full bg-brand-lavender text-brand-purple font-semibold text-xs cursor-pointer hover:bg-brand-purple/10 transition-colors inline-flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4" />
                      <span>Photo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>

                    <button
                      type="submit"
                      disabled={creatingPost || (!postText.trim() && !postImage)}
                      className="px-5 py-2 rounded-full bg-primary-gradient text-white font-bold text-xs shadow-gradient-glow hover:scale-105 transition-transform disabled:opacity-40 flex items-center gap-1.5"
                    >
                      {creatingPost ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      <span>Post</span>
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Group Feed Posts List */}
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="bg-brand-surface rounded-3xl p-8 border border-brand-border text-center">
                  <p className="text-xs text-brand-mutedText">No posts yet in this group feed. Be the first to post!</p>
                </div>
              ) : (
                posts.map((p) => (
                  <div key={p.id} className="relative">
                    {p.isPinned && (
                      <div className="bg-amber-50 text-amber-700 text-[0.68rem] font-bold px-4 py-1 rounded-t-2xl border-t border-x border-amber-200 inline-flex items-center gap-1 shadow-soft-xs">
                        <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                        <span>Pinned Post</span>
                      </div>
                    )}
                    <PostCard
                      post={p}
                      onSelectProfileUsername={onSelectProfileUsername}
                      onShowToast={onShowToast}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )
      ) : activeTab === 'members' ? (
        <GroupMembers
          group={group}
          myRole={myRole}
          onSelectProfileUsername={onSelectProfileUsername}
          onShowToast={onShowToast}
        />
      ) : (
        /* About Tab */
        <div className="bg-brand-surface rounded-3xl border border-brand-border p-6 shadow-soft-sm space-y-4 text-xs leading-relaxed text-brand-mainText">
          <h3 className="font-bold text-sm text-brand-mainText">About {group.name}</h3>
          <p>{group.description || "No detailed description provided."}</p>
          <div className="pt-3 border-t border-brand-border space-y-2">
            <p><span className="font-bold">Privacy:</span> {group.privacy === 'private' ? 'Private Group' : 'Public Group'}</p>
            <p><span className="font-bold">Permanent URL:</span> /groups/{group.slug}</p>
            <p><span className="font-bold">Members:</span> {group.memberCount || 1}</p>
          </div>
        </div>
      )}
    </div>
  );
}
