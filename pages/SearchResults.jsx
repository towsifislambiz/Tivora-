import React, { useState, useEffect } from 'react';
import { Search, Users, MessageSquare, User, ArrowRight, Loader2 } from 'lucide-react';
import { globalSearch } from '../firebase/searchService';
import UserSearchResult from '../components/search/UserSearchResult';
import PostCard from '../components/feed/PostCard';

export default function SearchResults({ queryTerm, onSelectProfileUsername, onSelectPostId, setActiveScreen, onShowToast }) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'people' | 'groups' | 'posts'
  const [results, setResults] = useState({ users: [], groups: [], posts: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function executeSearch() {
      if (!queryTerm) {
        setResults({ users: [], groups: [], posts: [] });
        setLoading(false);
        return;
      }

      setLoading(true);
      const res = await globalSearch(queryTerm, 15);
      setResults(res);
      setLoading(false);
    }

    executeSearch();
  }, [queryTerm]);

  const handleGroupClick = (slug) => {
    window.location.hash = `#group/${slug}`;
    if (setActiveScreen) setActiveScreen('group_details');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-soft-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-gradient text-white flex items-center justify-center shadow-gradient-glow shrink-0">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-mainText">
              Search Results for <span className="text-brand-purple">"{queryTerm}"</span>
            </h2>
            <p className="text-xs text-brand-mutedText mt-0.5">Explore matching people, communities, and posts on Tivora</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 pt-2 border-t border-brand-border">
          {['all', 'people', 'groups', 'posts'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-full font-bold text-xs capitalize transition-all ${
                activeTab === tab
                  ? 'bg-primary-gradient text-white shadow-gradient-glow'
                  : 'bg-brand-lavender text-brand-mutedText hover:text-brand-purple'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Results Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-7 h-7 text-brand-purple animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. People Section */}
          {(activeTab === 'all' || activeTab === 'people') && results.users.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-brand-mainText flex items-center gap-2">
                <User className="w-4 h-4 text-brand-purple" />
                <span>People ({results.users.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.users.map((u) => (
                  <UserSearchResult
                    key={u.uid}
                    user={u}
                    onSelectUser={(uname) => {
                      if (onSelectProfileUsername) onSelectProfileUsername(uname);
                      if (setActiveScreen) setActiveScreen('profile');
                    }}
                    onShowToast={onShowToast}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 2. Groups Section */}
          {(activeTab === 'all' || activeTab === 'groups') && results.groups.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-brand-mainText flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-pink" />
                <span>Groups ({results.groups.length})</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.groups.map((g) => (
                  <div
                    key={g.id}
                    onClick={() => handleGroupClick(g.slug)}
                    className="bg-brand-surface rounded-2xl border border-brand-border p-4 shadow-soft-sm hover:border-brand-purple/40 transition-all cursor-pointer flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {g.groupPhotoURL ? (
                        <img src={g.groupPhotoURL} alt={g.name} className="w-10 h-10 rounded-xl object-cover border border-brand-border shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-primary-gradient text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {g.name[0].toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-brand-mainText truncate group-hover:text-brand-purple transition-colors">{g.name}</h4>
                        <p className="text-[0.7rem] text-brand-purple">/groups/{g.slug}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-brand-mutedText group-hover:text-brand-purple transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Posts Section */}
          {(activeTab === 'all' || activeTab === 'posts') && results.posts.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm text-brand-mainText flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-blue" />
                <span>Posts ({results.posts.length})</span>
              </h3>
              <div className="space-y-4">
                {results.posts.map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    onSelectProfileUsername={onSelectProfileUsername}
                    onShowToast={onShowToast}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {results.users.length === 0 && results.groups.length === 0 && results.posts.length === 0 && (
            <div className="bg-brand-surface rounded-3xl p-12 border border-brand-border text-center space-y-2">
              <h3 className="font-bold text-base text-brand-mainText">No results found</h3>
              <p className="text-xs text-brand-mutedText">We couldn't find anything matching "{queryTerm}". Try a different keyword.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
