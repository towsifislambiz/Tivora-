import React, { useState, useEffect } from 'react';
import { X, Heart, Loader2, MessageSquare, CheckCircle2 } from 'lucide-react';
import UserAvatar from '../common/UserAvatar';
import { getPostLikers } from '../../firebase/interactionService';

export default function PostLikersModal({ isOpen, onClose, postId, onSelectProfileUsername }) {
  const [likers, setLikers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLikers() {
      if (isOpen && postId) {
        setLoading(true);
        const data = await getPostLikers(postId);
        setLikers(data);
        setLoading(false);
      }
    }

    fetchLikers();
  }, [isOpen, postId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-mainText/40 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-brand-surface rounded-3xl border border-brand-border shadow-soft-lg w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-brand-border flex items-center justify-between bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-transparent">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-red-50 text-red-500 flex items-center justify-center shadow-soft-xs">
              <Heart className="w-5 h-5 fill-red-500 text-red-500" />
            </div>
            <div>
              <h3 className="font-bold text-brand-mainText text-base">Liked by</h3>
              <p className="text-xs text-brand-mutedText font-medium">{likers.length} {likers.length === 1 ? 'person' : 'people'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-brand-mutedText hover:bg-brand-lavender hover:text-brand-mainText transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Likers List */}
        <div className="p-5 overflow-y-auto space-y-3 min-h-[220px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-brand-mutedText space-y-3">
              <Loader2 className="w-7 h-7 animate-spin text-brand-purple" />
              <p className="text-xs font-semibold">Loading people who liked this...</p>
            </div>
          ) : likers.length === 0 ? (
            <div className="text-center py-10 space-y-2">
              <p className="text-3xl">❤️</p>
              <p className="text-sm font-bold text-brand-mainText">No likes yet</p>
              <p className="text-xs text-brand-mutedText">Be the first one to like this post!</p>
            </div>
          ) : (
            likers.map((user) => {
              const uname = user.username || user.profileId || user.uid || 'user';
              return (
                <div
                  key={user.uid || user.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-brand-border/60 hover:bg-brand-lavender/50 transition-all group"
                >
                  {/* Left: Avatar & Name */}
                  <div
                    className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                    onClick={() => {
                      if (onSelectProfileUsername) onSelectProfileUsername(uname);
                      onClose();
                    }}
                  >
                    <UserAvatar
                      src={user.photoURL}
                      name={user.displayName}
                      size="w-11 h-11"
                      className="group-hover:scale-105 transition-transform shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-brand-mainText truncate group-hover:text-brand-purple transition-colors flex items-center gap-1">
                        <span className="truncate">{user.displayName || 'Tivora User'}</span>
                        <CheckCircle2 className="w-3.5 h-3.5 text-brand-blue fill-brand-blue shrink-0" />
                      </h4>
                      <p className="text-xs text-brand-purple font-semibold truncate mt-0.5">@{uname}</p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    <button
                      onClick={() => {
                        window.location.hash = `#messages?user=${uname}`;
                        onClose();
                      }}
                      className="p-2 rounded-xl bg-brand-lavender text-brand-purple hover:bg-brand-purple hover:text-white transition-all"
                      title="Send Message"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (onSelectProfileUsername) onSelectProfileUsername(uname);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-primary-gradient text-white font-bold text-xs shadow-soft-xs hover:scale-105 active:scale-95 transition-all"
                    >
                      Profile
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
