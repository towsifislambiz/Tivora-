import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserCheck, 
  UserPlus, 
  UserX, 
  Send, 
  CheckCircle2, 
  Loader2, 
  ArrowLeft,
  MessageSquare,
  X
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import UserAvatar from '../components/common/UserAvatar';
import { 
  getFriends, 
  getIncomingFriendRequests, 
  getOutgoingFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest
} from '../firebase/friendService';
import RemoveFriendModal from '../components/profile/RemoveFriendModal';

export default function Friends({ onSelectProfileUsername, onShowToast }) {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('my_friends'); // 'my_friends' | 'incoming_requests' | 'sent_requests'

  // Tab 1: My Friends
  const [friendsList, setFriendsList] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(true);

  // Tab 2: Incoming Requests
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [loadingIncoming, setLoadingIncoming] = useState(true);

  // Tab 3: Outgoing Sent Requests
  const [sentRequests, setSentRequests] = useState([]);
  const [loadingSent, setLoadingSent] = useState(true);

  // Action Pending State
  const [actionPendingId, setActionPendingId] = useState(null);

  // Remove Friend Modal State
  const [selectedRemoveFriend, setSelectedRemoveFriend] = useState(null);

  // Load Data based on active tab
  useEffect(() => {
    if (!currentUser?.uid) return;

    async function loadData() {
      if (activeTab === 'my_friends') {
        setLoadingFriends(true);
        const { friends } = await getFriends(currentUser.uid, 20);
        setFriendsList(friends);
        setLoadingFriends(false);
      } else if (activeTab === 'incoming_requests') {
        setLoadingIncoming(true);
        const { requests } = await getIncomingFriendRequests(currentUser.uid, 20);
        setIncomingRequests(requests);
        setLoadingIncoming(false);
      } else if (activeTab === 'sent_requests') {
        setLoadingSent(true);
        const { requests } = await getOutgoingFriendRequests(currentUser.uid, 20);
        setSentRequests(requests);
        setLoadingSent(false);
      }
    }

    loadData();
  }, [currentUser?.uid, activeTab]);

  // Handle Accept Incoming Request
  const handleAcceptRequest = async (req) => {
    if (!currentUser?.uid || actionPendingId) return;
    setActionPendingId(req.friendshipId);

    try {
      await acceptFriendRequest(req.friendshipId, currentUser.uid, {
        displayName: currentUser.displayName || 'Tivora User',
        username: currentUser.email?.split('@')[0] || 'user',
        photoURL: currentUser.photoURL || ''
      });

      setIncomingRequests(prev => prev.filter(r => r.friendshipId !== req.friendshipId));
      if (onShowToast) onShowToast(`Accepted friend request from ${req.displayName}! 🎉`);
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to accept request.');
    } finally {
      setActionPendingId(null);
    }
  };

  // Handle Decline Incoming Request
  const handleDeclineRequest = async (req) => {
    if (!currentUser?.uid || actionPendingId) return;
    setActionPendingId(req.friendshipId);

    try {
      await declineFriendRequest(req.friendshipId, currentUser.uid);
      setIncomingRequests(prev => prev.filter(r => r.friendshipId !== req.friendshipId));
      if (onShowToast) onShowToast(`Declined friend request.`);
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to decline request.');
    } finally {
      setActionPendingId(null);
    }
  };

  // Handle Cancel Outgoing Request
  const handleCancelSentRequest = async (req) => {
    if (!currentUser?.uid || actionPendingId) return;
    setActionPendingId(req.friendshipId);

    try {
      await cancelFriendRequest(req.friendshipId, currentUser.uid);
      setSentRequests(prev => prev.filter(r => r.friendshipId !== req.friendshipId));
      if (onShowToast) onShowToast(`Friend request cancelled.`);
    } catch (err) {
      if (onShowToast) onShowToast(err.message || 'Failed to cancel request.');
    } finally {
      setActionPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Tabs Navigation Banner */}
      <div className="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-soft-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-gradient text-white flex items-center justify-center shadow-gradient-glow shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-mainText">Friends & Network</h2>
            <p className="text-xs text-brand-mutedText mt-0.5">Manage your Tivora friendships and incoming connections</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-t border-brand-border pt-4">
          <button
            onClick={() => setActiveTab('my_friends')}
            className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'my_friends'
                ? 'bg-primary-gradient text-white shadow-gradient-glow'
                : 'bg-brand-lavender text-brand-mutedText hover:text-brand-purple'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>My Friends</span>
            {friendsList.length > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[0.68rem] ${activeTab === 'my_friends' ? 'bg-white text-brand-purple' : 'bg-brand-purple text-white'}`}>
                {friendsList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('incoming_requests')}
            className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'incoming_requests'
                ? 'bg-primary-gradient text-white shadow-gradient-glow'
                : 'bg-brand-lavender text-brand-mutedText hover:text-brand-purple'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Friend Requests</span>
            {incomingRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[0.68rem] bg-brand-pink text-white">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sent_requests')}
            className={`px-5 py-2.5 rounded-full font-bold text-xs transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'sent_requests'
                ? 'bg-primary-gradient text-white shadow-gradient-glow'
                : 'bg-brand-lavender text-brand-mutedText hover:text-brand-purple'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>Sent Requests</span>
            {sentRequests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[0.68rem] bg-brand-purple/20 text-brand-purple font-bold">
                {sentRequests.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab 1: My Friends */}
      {activeTab === 'my_friends' && (
        <div className="space-y-4">
          {loadingFriends ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(n => (
                <div key={n} className="bg-brand-surface rounded-2xl p-5 border border-brand-border shadow-soft-sm animate-pulse flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-lavender rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="w-28 h-4 bg-brand-lavender rounded" />
                    <div className="w-20 h-3 bg-brand-lavender rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : friendsList.length === 0 ? (
            <div className="bg-brand-surface rounded-3xl p-12 border border-brand-border shadow-soft-sm text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-brand-lavender text-brand-purple flex items-center justify-center mb-1">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg text-brand-mainText">No friends yet</h3>
              <p className="text-xs text-brand-mutedText max-w-xs">
                Start connecting with people on Tivora by searching users or visiting profiles.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {friendsList.map(friend => (
                <div key={friend.uid} className="bg-brand-surface rounded-2xl p-4 border border-brand-border shadow-soft-sm hover:shadow-soft-md transition-shadow flex flex-col justify-between space-y-3">
                  {/* Card Header: Avatar + User Details + Remove Friend Option */}
                  <div className="flex items-start justify-between gap-3">
                    <div 
                      className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
                      onClick={() => onSelectProfileUsername && onSelectProfileUsername(friend.username || friend.profileId || friend.uid)}
                    >
                      <UserAvatar
                        src={friend.photoURL}
                        name={friend.displayName}
                        size="w-12 h-12"
                        className="group-hover:scale-105 transition-transform shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-brand-mainText truncate group-hover:text-brand-purple transition-colors flex items-center gap-1">
                          <span className="truncate">{friend.displayName}</span>
                          <CheckCircle2 className="w-3.5 h-3.5 text-brand-blue fill-brand-blue shrink-0" />
                        </h4>
                        <p className="text-xs text-brand-purple font-semibold truncate mt-0.5">@{friend.username || friend.profileId || friend.uid || 'user'}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedRemoveFriend(friend)}
                      className="p-1.5 rounded-full text-brand-mutedText hover:bg-red-50 hover:text-red-500 transition-colors shrink-0"
                      title="Remove Friend"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Action Buttons Row: Full width & clean spacing */}
                  <div className="flex items-center gap-2 pt-2 border-t border-brand-border/60">
                    <button
                      onClick={() => {
                        window.location.hash = `#messages?user=${friend.username || friend.profileId || friend.uid}`;
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-primary-gradient text-white font-bold text-xs shadow-soft-xs hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Message</span>
                    </button>
                    <button
                      onClick={() => onSelectProfileUsername && onSelectProfileUsername(friend.username || friend.profileId || friend.uid)}
                      className="py-2 px-3.5 rounded-xl bg-brand-lavender text-brand-purple font-semibold text-xs hover:bg-brand-purple hover:text-white transition-all text-center"
                    >
                      Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Incoming Friend Requests */}
      {activeTab === 'incoming_requests' && (
        <div className="space-y-4">
          {loadingIncoming ? (
            <div className="space-y-3">
              {[1, 2].map(n => (
                <div key={n} className="bg-brand-surface rounded-2xl p-5 border border-brand-border shadow-soft-sm animate-pulse flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-lavender rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="w-28 h-4 bg-brand-lavender rounded" />
                    <div className="w-20 h-3 bg-brand-lavender rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : incomingRequests.length === 0 ? (
            <div className="bg-brand-surface rounded-3xl p-12 border border-brand-border shadow-soft-sm text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-brand-lavender text-brand-purple flex items-center justify-center mb-1">
                <UserPlus className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg text-brand-mainText">No pending friend requests</h3>
              <p className="text-xs text-brand-mutedText max-w-xs">
                When someone sends you a friend request, it will show up here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {incomingRequests.map(req => (
                <div key={req.friendshipId} className="bg-brand-surface rounded-2xl p-5 border border-brand-border shadow-soft-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div 
                    className="flex items-center gap-3.5 cursor-pointer group min-w-0"
                    onClick={() => onSelectProfileUsername && onSelectProfileUsername(req.username)}
                  >
                    <UserAvatar
                      src={req.photoURL}
                      name={req.displayName}
                      size="w-12 h-12"
                      className="group-hover:scale-105 transition-transform shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-brand-mainText group-hover:text-brand-purple transition-colors truncate">{req.displayName}</h4>
                      <p className="text-xs text-brand-purple font-semibold truncate">@{req.username}</p>
                      <p className="text-[0.68rem] text-brand-mutedText mt-0.5">Sent you a friend request</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => handleAcceptRequest(req)}
                      disabled={actionPendingId === req.friendshipId}
                      className="px-5 py-2 rounded-full bg-emerald-500 text-white font-bold text-xs shadow-soft-xs hover:bg-emerald-600 transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {actionPendingId === req.friendshipId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                      <span>Accept</span>
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(req)}
                      disabled={actionPendingId === req.friendshipId}
                      className="px-4 py-2 rounded-full border border-brand-border text-brand-mainText font-semibold text-xs hover:bg-brand-lavender transition-all disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Outgoing Sent Requests */}
      {activeTab === 'sent_requests' && (
        <div className="space-y-4">
          {loadingSent ? (
            <div className="space-y-3">
              {[1, 2].map(n => (
                <div key={n} className="bg-brand-surface rounded-2xl p-5 border border-brand-border shadow-soft-sm animate-pulse flex items-center gap-4">
                  <div className="w-12 h-12 bg-brand-lavender rounded-full shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="w-28 h-4 bg-brand-lavender rounded" />
                    <div className="w-20 h-3 bg-brand-lavender rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : sentRequests.length === 0 ? (
            <div className="bg-brand-surface rounded-3xl p-12 border border-brand-border shadow-soft-sm text-center flex flex-col items-center justify-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-brand-lavender text-brand-purple flex items-center justify-center mb-1">
                <Send className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-lg text-brand-mainText">No sent requests</h3>
              <p className="text-xs text-brand-mutedText max-w-xs">
                Friend requests you send to others will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sentRequests.map(req => (
                <div key={req.friendshipId} className="bg-brand-surface rounded-2xl p-5 border border-brand-border shadow-soft-sm flex items-center justify-between gap-4">
                  <div 
                    className="flex items-center gap-3.5 cursor-pointer group min-w-0"
                    onClick={() => onSelectProfileUsername && onSelectProfileUsername(req.username)}
                  >
                    <UserAvatar
                      src={req.photoURL}
                      name={req.displayName}
                      size="w-12 h-12"
                      className="group-hover:scale-105 transition-transform shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 className="font-bold text-sm text-brand-mainText group-hover:text-brand-purple transition-colors truncate">{req.displayName}</h4>
                      <p className="text-xs text-brand-purple font-semibold truncate">@{req.username}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCancelSentRequest(req)}
                    disabled={actionPendingId === req.friendshipId}
                    className="px-4 py-2 rounded-full border border-red-200 text-red-600 font-semibold text-xs hover:bg-red-50 transition-all flex items-center gap-1.5 disabled:opacity-50 shrink-0"
                  >
                    {actionPendingId === req.friendshipId ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <X className="w-3.5 h-3.5" />
                    )}
                    <span>Cancel Request</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Remove Friend Confirmation Modal */}
      {selectedRemoveFriend && (
        <RemoveFriendModal
          isOpen={Boolean(selectedRemoveFriend)}
          friendshipId={selectedRemoveFriend.friendshipId}
          currentUid={currentUser?.uid}
          friendName={selectedRemoveFriend.displayName}
          onClose={() => setSelectedRemoveFriend(null)}
          onFriendRemoved={() => {
            setFriendsList(prev => prev.filter(f => f.uid !== selectedRemoveFriend.uid));
            setSelectedRemoveFriend(null);
          }}
          onShowToast={onShowToast}
        />
      )}
    </div>
  );
}
