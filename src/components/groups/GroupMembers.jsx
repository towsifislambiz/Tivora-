import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  User, 
  UserX, 
  Check, 
  X, 
  Loader2 
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { 
  getGroupMembers, 
  getJoinRequests, 
  approveJoinRequest, 
  rejectJoinRequest, 
  removeMember, 
  changeMemberRole 
} from '../../firebase/groupMembershipService';

export default function GroupMembers({ group, myRole, onSelectProfileUsername, onShowToast }) {
  const { currentUser, userDoc } = useAuth();

  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members'); // 'members' | 'requests'
  const [processingId, setProcessingId] = useState(null);

  const isAdminOrOwner = myRole === 'owner' || myRole === 'admin';

  useEffect(() => {
    async function loadData() {
      if (!group?.id) return;
      setLoading(true);

      const fetchedMembers = await getGroupMembers(group.id, 50);
      setMembers(fetchedMembers);

      if (isAdminOrOwner) {
        const fetchedReqs = await getJoinRequests(group.id);
        setRequests(fetchedReqs);
      }
      setLoading(false);
    }

    loadData();
  }, [group?.id, isAdminOrOwner]);

  const handleApprove = async (targetUid) => {
    if (!group?.id || !currentUser?.uid || processingId) return;
    setProcessingId(targetUid);

    try {
      const adminData = {
        displayName: userDoc?.displayName || currentUser.displayName || 'Group Admin',
        username: userDoc?.username || 'admin',
        photoURL: userDoc?.photoURL || ''
      };

      await approveJoinRequest(group.id, targetUid, currentUser.uid, adminData);
      setRequests(prev => prev.filter(r => r.uid !== targetUid));
      if (onShowToast) onShowToast("Join request approved! 🎉");
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Failed to approve request.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (targetUid) => {
    if (!group?.id || processingId) return;
    setProcessingId(targetUid);

    try {
      await rejectJoinRequest(group.id, targetUid);
      setRequests(prev => prev.filter(r => r.uid !== targetUid));
      if (onShowToast) onShowToast("Join request rejected.");
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Failed to reject request.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemove = async (targetUid, name) => {
    if (!group?.id || !currentUser?.uid || processingId) return;
    setProcessingId(targetUid);

    try {
      await removeMember(group.id, targetUid, currentUser.uid);
      setMembers(prev => prev.filter(m => m.uid !== targetUid));
      if (onShowToast) onShowToast(`Removed ${name} from group.`);
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Failed to remove member.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleChangeRole = async (targetUid, newRole) => {
    if (!group?.id || !currentUser?.uid || processingId) return;
    setProcessingId(targetUid);

    try {
      await changeMemberRole(group.id, targetUid, currentUser.uid, newRole);
      setMembers(prev => prev.map(m => m.uid === targetUid ? { ...m, role: newRole } : m));
      if (onShowToast) onShowToast(`Updated member role to ${newRole}.`);
    } catch (err) {
      if (onShowToast) onShowToast(err.message || "Failed to change role.");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div class="bg-brand-surface rounded-3xl border border-brand-border p-6 shadow-soft-sm space-y-4">
      {/* Header Tabs if Admin */}
      {isAdminOrOwner && (
        <div class="flex items-center gap-2 border-b border-brand-border pb-3">
          <button
            onClick={() => setActiveTab('members')}
            class={`px-4 py-1.5 rounded-full font-bold text-xs transition-all ${
              activeTab === 'members'
                ? 'bg-primary-gradient text-white shadow-gradient-glow'
                : 'bg-brand-lavender text-brand-mutedText hover:text-brand-purple'
            }`}
          >
            Members ({members.length})
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            class={`px-4 py-1.5 rounded-full font-bold text-xs transition-all flex items-center gap-1.5 ${
              activeTab === 'requests'
                ? 'bg-primary-gradient text-white shadow-gradient-glow'
                : 'bg-brand-lavender text-brand-mutedText hover:text-brand-purple'
            }`}
          >
            <span>Join Requests</span>
            {requests.length > 0 && (
              <span class="px-2 py-0.2 rounded-full bg-brand-pink text-white text-[0.65rem] font-bold">
                {requests.length}
              </span>
            )}
          </button>
        </div>
      )}

      {loading ? (
        <div class="flex justify-center py-8">
          <Loader2 class="w-6 h-6 text-brand-purple animate-spin" />
        </div>
      ) : activeTab === 'members' ? (
        <div class="space-y-3">
          {members.map((m) => (
            <div key={m.uid} class="flex items-center justify-between p-3 rounded-2xl border border-brand-border bg-brand-surface hover:bg-brand-lavender/40 transition-colors">
              <div 
                class="flex items-center gap-3 cursor-pointer group"
                onClick={() => onSelectProfileUsername && m.username && onSelectProfileUsername(m.username)}
              >
                {m.photoURL ? (
                  <img src={m.photoURL} alt={m.displayName} class="w-10 h-10 rounded-full object-cover border border-brand-border" />
                ) : (
                  <div class="w-10 h-10 rounded-full bg-primary-gradient text-white flex items-center justify-center font-bold text-xs">
                    {m.displayName ? m.displayName[0].toUpperCase() : 'U'}
                  </div>
                )}

                <div>
                  <h4 class="font-bold text-xs sm:text-sm text-brand-mainText group-hover:text-brand-purple transition-colors flex items-center gap-1.5">
                    <span>{m.displayName}</span>
                    {m.role === 'owner' && <span class="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[0.65rem] font-bold">Owner</span>}
                    {m.role === 'admin' && <span class="px-2 py-0.5 rounded-full bg-brand-purple/10 text-brand-purple text-[0.65rem] font-bold">Admin</span>}
                    {m.role === 'moderator' && <span class="px-2 py-0.5 rounded-full bg-brand-blue/10 text-brand-blue text-[0.65rem] font-bold">Moderator</span>}
                  </h4>
                  <p class="text-[0.7rem] text-brand-mutedText">@{m.username}</p>
                </div>
              </div>

              {/* Administrative Actions */}
              {myRole === 'owner' && m.uid !== currentUser?.uid && (
                <div class="flex items-center gap-2">
                  <select
                    value={m.role || 'member'}
                    onChange={(e) => handleChangeRole(m.uid, e.target.value)}
                    disabled={processingId === m.uid}
                    class="bg-brand-lavender border border-brand-border rounded-xl px-2 py-1 text-xs text-brand-mainText outline-none font-semibold"
                  >
                    <option value="member">Member</option>
                    <option value="moderator">Moderator</option>
                    <option value="admin">Admin</option>
                  </select>

                  <button
                    onClick={() => handleRemove(m.uid, m.displayName)}
                    disabled={processingId === m.uid}
                    class="p-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove Member"
                  >
                    <UserX class="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Join Requests Tab */
        <div class="space-y-3">
          {requests.length === 0 ? (
            <p class="text-xs text-brand-mutedText text-center py-6 italic">No pending join requests</p>
          ) : (
            requests.map((r) => (
              <div key={r.uid} class="flex items-center justify-between p-3 rounded-2xl border border-brand-border bg-brand-surface">
                <div class="flex items-center gap-3">
                  {r.photoURL ? (
                    <img src={r.photoURL} alt={r.displayName} class="w-10 h-10 rounded-full object-cover border border-brand-border" />
                  ) : (
                    <div class="w-10 h-10 rounded-full bg-primary-gradient text-white flex items-center justify-center font-bold text-xs">
                      {r.displayName ? r.displayName[0].toUpperCase() : 'U'}
                    </div>
                  )}
                  <div>
                    <h4 class="font-bold text-xs sm:text-sm text-brand-mainText">{r.displayName}</h4>
                    <p class="text-[0.7rem] text-brand-mutedText">@{r.username}</p>
                  </div>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    onClick={() => handleApprove(r.uid)}
                    disabled={processingId === r.uid}
                    class="px-3 py-1.5 rounded-full bg-emerald-500 text-white font-bold text-xs hover:bg-emerald-600 transition-all flex items-center gap-1 shadow-soft-xs"
                  >
                    <Check class="w-3.5 h-3.5" />
                    <span>Approve</span>
                  </button>

                  <button
                    onClick={() => handleReject(r.uid)}
                    disabled={processingId === r.uid}
                    class="px-3 py-1.5 rounded-full border border-brand-border text-brand-mutedText font-semibold text-xs hover:bg-brand-lavender transition-all"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
