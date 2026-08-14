import React, { useState, useEffect } from 'react';
import { Compass, Users, Sparkles, UserPlus, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { getPublicGroups } from '../firebase/groupService';
import { getHomeFeedPosts } from '../firebase/postService';
import { searchUsers } from '../firebase/searchService';
import PostCard from '../components/feed/PostCard';
import UserSearchResult from '../components/search/UserSearchResult';
import { FastCache } from '../utils/fastCache';

export default function Explore({ onSelectProfileUsername, onSelectPostId, setActiveScreen, onShowToast }) {
  const { currentUser } = useAuth();

  const cachedExplore = FastCache.get('explore_data');

  const [suggestedPeople, setSuggestedPeople] = useState(cachedExplore?.people || []);
  const [popularGroups, setPopularGroups] = useState(cachedExplore?.groups || []);
  const [trendingPosts, setTrendingPosts] = useState(cachedExplore?.posts || []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let timer = null;

    async function loadExploreData() {
      if (!cachedExplore) {
        timer = setTimeout(() => setLoading(true), 250);
      }

      const [people, groups, { posts }] = await Promise.all([
        searchUsers('a', 6),
        getPublicGroups(6),
        getHomeFeedPosts(6)
      ]);

      if (timer) clearTimeout(timer);
      const filteredPeople = people.filter(u => u.uid !== currentUser?.uid);

      setSuggestedPeople(filteredPeople);
      setPopularGroups(groups);
      setTrendingPosts(posts);
      setLoading(false);

      FastCache.set('explore_data', {
        people: filteredPeople,
        groups,
        posts
      });
    }

    loadExploreData();
  }, [currentUser?.uid]);

  const handleGroupClick = (slug) => {
    window.location.hash = `#group/${slug}`;
    if (setActiveScreen) setActiveScreen('group_details');
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-brand-surface rounded-3xl p-6 border border-brand-border shadow-soft-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary-gradient text-white flex items-center justify-center shadow-gradient-glow shrink-0">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-mainText">Explore & Discover</h2>
            <p className="text-xs text-brand-mutedText mt-0.5">Find new friends, trending communities, and inspiring posts</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-brand-purple animate-spin" />
        </div>
      ) : (
        <>
          {/* Suggested People Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-brand-mainText flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-brand-purple" />
                <span>Suggested Friends</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {suggestedPeople.map((userObj) => (
                <UserSearchResult
                  key={userObj.uid}
                  userObj={userObj}
                  onSelectProfileUsername={onSelectProfileUsername}
                  onShowToast={onShowToast}
                />
              ))}
            </div>
          </div>

          {/* Popular Groups Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-brand-mainText flex items-center gap-2">
                <Users className="w-5 h-5 text-brand-purple" />
                <span>Trending Communities</span>
              </h3>
              <button
                onClick={() => setActiveScreen && setActiveScreen('groups')}
                className="text-xs font-bold text-brand-purple hover:underline inline-flex items-center gap-1"
              >
                <span>View All</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {popularGroups.map((grp) => (
                <div
                  key={grp.id}
                  onClick={() => handleGroupClick(grp.slug)}
                  className="bg-brand-surface rounded-2xl p-4 border border-brand-border hover:border-brand-purple shadow-soft-xs hover:shadow-soft-sm transition-all cursor-pointer space-y-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-brand-lavender text-brand-purple flex items-center justify-center font-bold text-lg group-hover:scale-105 transition-transform shrink-0">
                      {grp.name[0]}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-brand-mainText truncate group-hover:text-brand-purple transition-colors">
                        {grp.name}
                      </h4>
                      <p className="text-[0.7rem] text-brand-mutedText">{grp.membersCount || 1} members</p>
                    </div>
                  </div>
                  <p className="text-xs text-brand-mutedText line-clamp-2">{grp.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Posts Feed */}
          <div className="space-y-4">
            <h3 className="font-bold text-base text-brand-mainText flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-purple" />
              <span>Trending Posts</span>
            </h3>

            <div className="space-y-4">
              {trendingPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onSelectProfileUsername={onSelectProfileUsername}
                  onShowToast={onShowToast}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
