import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Globe, 
  Lock, 
  Loader2, 
  ArrowRight 
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { 
  getPublicGroups, 
  getUserGroups, 
  searchGroups 
} from '../firebase/groupService';
import CreateGroupModal from '../components/groups/CreateGroupModal';

export default function Groups({ setActiveScreen, onSelectGroupSlug, onShowToast }) {
  const { currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState('my_groups'); // 'my_groups' | 'discover'
  const [myGroups, setMyGroups] = useState([]);
  const [discoverGroups, setDiscoverGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // 1. Fetch user & public groups
  useEffect(() => {
    async function loadGroups() {
      if (!currentUser?.uid) return;
      setLoading(true);

      const [userG, publicG] = await Promise.all([
        getUserGroups(currentUser.uid),
        getPublicGroups(12)
      ]);

      setMyGroups(userG);
      setDiscoverGroups(publicG);
      setLoading(false);
    }

    loadGroups();
  }, [currentUser?.uid]);

  // 2. Handle Debounced Group Search
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(async () => {
      const results = await searchGroups(trimmed, 12);
      setSearchResults(results);
      setSearching(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleOpenGroup = (slug) => {
    if (onSelectGroupSlug) onSelectGroupSlug(slug);
    if (setActiveScreen) setActiveScreen('group_details');
    window.location.hash = `#group/${slug}`;
  };

  const displayList = searchQuery.trim()
    ? searchResults
    : activeTab === 'my_groups'
    ? myGroups
    : discoverGroups;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-soft-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary-gradient text-white flex items-center justify-center shadow-gradient-glow shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-mainText">Communities & Groups</h2>
              <p className="text-xs text-brand-mutedText mt-0.5">Discover and connect with tech, design, and developer communities</p>
            </div>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 rounded-full bg-primary-gradient text-white font-bold text-xs shadow-gradient-glow hover:scale-105 transition-transform flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Group</span>
          </button>
        </div>

        {/* Group Search Bar */}
        <div className="relative max-w-xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-mutedText pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search groups by name or slug (e.g. web-developers)..."
            className="w-full h-10 bg-brand-lavender border border-transparent focus:border-brand-purple focus:bg-brand-surface rounded-full pl-11 pr-10 text-xs sm:text-sm text-brand-mainText outline-none transition-all placeholder:text-brand-mutedText/70"
          />
          {searching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-purple animate-spin" />
          )}
        </div>

        {/* Navigation Tabs */}
        {!searchQuery.trim() && (
          <div className="flex items-center gap-2 pt-2 border-t border-brand-border">
            <button
              onClick={() => setActiveTab('my_groups')}
              className={`px-5 py-2 rounded-full font-bold text-xs transition-all ${
                activeTab === 'my_groups'
                  ? 'bg-primary-gradient text-white shadow-gradient-glow'
                  : 'bg-brand-lavender text-brand-mutedText hover:text-brand-purple'
              }`}
            >
              My Groups ({myGroups.length})
            </button>
            <button
              onClick={() => setActiveTab('discover')}
              className={`px-5 py-2 rounded-full font-bold text-xs transition-all ${
                activeTab === 'discover'
                  ? 'bg-primary-gradient text-white shadow-gradient-glow'
                  : 'bg-brand-lavender text-brand-mutedText hover:text-brand-purple'
              }`}
            >
              Discover Public Groups
            </button>
          </div>
        )}
      </div>

      {/* Group Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-brand-surface rounded-3xl p-4 border border-brand-border animate-pulse space-y-3">
              <div className="h-28 bg-brand-lavender rounded-2xl" />
              <div className="w-36 h-4 bg-brand-lavender rounded" />
              <div className="w-24 h-3 bg-brand-lavender rounded" />
            </div>
          ))}
        </div>
      ) : displayList.length === 0 ? (
        <div className="bg-brand-surface rounded-3xl p-12 border border-brand-border text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-brand-lavender text-brand-purple flex items-center justify-center mx-auto mb-1">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-base text-brand-mainText">
            {searchQuery.trim() ? "No matching groups found" : "No groups found"}
          </h3>
          <p className="text-xs text-brand-mutedText max-w-xs mx-auto">
            {activeTab === 'my_groups' && !searchQuery.trim()
              ? "You haven't joined any groups yet. Switch to Discover or create one."
              : "Try searching with a different group name or slug."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayList.map((grp) => (
            <div
              key={grp.id}
              onClick={() => handleOpenGroup(grp.slug)}
              className="bg-brand-surface rounded-3xl border border-brand-border shadow-soft-sm overflow-hidden hover:border-brand-purple/40 hover:shadow-soft-md transition-all cursor-pointer flex flex-col group"
            >
              {/* Cover & Avatar */}
              <div className="h-28 relative bg-cover-gradient">
                {grp.coverPhotoURL ? (
                  <img src={grp.coverPhotoURL} alt={grp.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-cover-gradient opacity-90" />
                )}
                <div className="absolute -bottom-4 left-4">
                  {grp.groupPhotoURL ? (
                    <img src={grp.groupPhotoURL} alt={grp.name} className="w-12 h-12 rounded-xl border-2 border-brand-surface object-cover shadow-soft-xs" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl border-2 border-brand-surface bg-primary-gradient text-white flex items-center justify-center font-bold text-sm shadow-soft-xs">
                      {grp.name[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              {/* Group Metadata */}
              <div className="p-4 pt-6 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-bold text-sm text-brand-mainText group-hover:text-brand-purple transition-colors truncate">
                      {grp.name}
                    </h4>
                    <span className={`px-2 py-0.5 rounded-full text-[0.65rem] font-bold flex items-center gap-1 shrink-0 ${
                      grp.privacy === 'private' ? 'bg-amber-100 text-amber-700' : 'bg-brand-purple/10 text-brand-purple'
                    }`}>
                      {grp.privacy === 'private' ? <Lock className="w-2.5 h-2.5" /> : <Globe className="w-2.5 h-2.5" />}
                      <span>{grp.privacy === 'private' ? 'Private' : 'Public'}</span>
                    </span>
                  </div>

                  <p className="text-[0.7rem] font-bold text-brand-purple">/groups/{grp.slug}</p>
                  <p className="text-xs text-brand-mutedText line-clamp-2 leading-relaxed">{grp.description || "Community group"}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-brand-border text-xs text-brand-mutedText">
                  <span>{grp.memberCount || 1} members</span>
                  <span className="font-bold text-brand-purple flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>View</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onGroupCreated={(newGroup) => handleOpenGroup(newGroup.slug)}
        onShowToast={onShowToast}
      />
    </div>
  );
}
