import React, { useState, useEffect } from 'react';
import { MessageSquare, Search, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { 
  subscribeToUserConversations, 
  getOrCreateConversation 
} from '../firebase/messageService';
import { getFriends } from '../firebase/friendService';
import { getUserByUsername } from '../firebase/profileService';
import ConversationList from '../components/messaging/ConversationList';
import ChatWindow from '../components/messaging/ChatWindow';

export default function Messages({ onSelectProfileUsername, onShowToast }) {
  const { currentUser } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState(null);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'chat'
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Subscribe + merge confirmed friends
  useEffect(() => {
    if (!currentUser?.uid) return;

    let isMounted = true;
    let unsubscribeConvs = () => {};

    async function initConversationsAndFriends() {
      setLoading(true);
      const { friends } = await getFriends(currentUser.uid, 50);

      unsubscribeConvs = subscribeToUserConversations(currentUser.uid, ({ conversations: fetchedConvs }) => {
        if (!isMounted) return;

        const existingPartnerUids = new Set(fetchedConvs.map(c => c.partner?.uid).filter(Boolean));

        const friendItems = (friends || [])
          .filter(f => f.uid !== currentUser.uid && !existingPartnerUids.has(f.uid))
          .map(f => ({
            id: `friend_${f.uid}`,
            partner: f,
            lastMessage: "Start a conversation 👋",
            lastMessageAt: f.acceptedAt || new Date().toISOString(),
            isUnread: false,
            isSynthetic: true
          }));

        setConversations([...fetchedConvs, ...friendItems]);
        setLoading(false);
      });
    }

    initConversationsAndFriends();
    return () => { isMounted = false; unsubscribeConvs(); };
  }, [currentUser?.uid]);

  // 2. Hash URL parser
  useEffect(() => {
    async function parseAndSetTarget() {
      if (!currentUser?.uid) return;
      const hash = window.location.hash;

      if (hash.includes('?user=')) {
        const username = hash.split('?user=')[1]?.split('&')[0];
        if (username) {
          try {
            const userObj = await getUserByUsername(username);
            if (userObj) {
              const convData = await getOrCreateConversation(currentUser.uid, userObj.uid);
              setActiveConversation({ ...convData, partner: userObj });
              setMobileView('chat');
              return;
            }
          } catch (err) {
            if (onShowToast) onShowToast(err.message || "Failed to start conversation.");
          }
        }
      } else if (hash.includes('?conversation=')) {
        const convId = hash.split('?conversation=')[1]?.split('&')[0];
        const match = conversations.find(c => c.id === convId);
        if (match) {
          if (match.isSynthetic && match.partner?.uid) {
            try {
              const convData = await getOrCreateConversation(currentUser.uid, match.partner.uid);
              setActiveConversation({ ...convData, partner: match.partner });
              setMobileView('chat');
              return;
            } catch (e) {}
          }
          setActiveConversation(match);
          setMobileView('chat');
          return;
        }
      }

      if (!activeConversation && conversations.length > 0) {
        const first = conversations[0];
        if (first.isSynthetic && first.partner?.uid) {
          getOrCreateConversation(currentUser.uid, first.partner.uid)
            .then(convData => setActiveConversation({ ...convData, partner: first.partner }))
            .catch(() => setActiveConversation(first));
        } else {
          setActiveConversation(first);
        }
      }
    }

    parseAndSetTarget();
    window.addEventListener('hashchange', parseAndSetTarget);
    return () => window.removeEventListener('hashchange', parseAndSetTarget);
  }, [currentUser?.uid, conversations, activeConversation]);

  const handleSelectConversation = async (conv) => {
    if (conv.isSynthetic && conv.partner?.uid) {
      try {
        const convData = await getOrCreateConversation(currentUser.uid, conv.partner.uid);
        setActiveConversation({ ...convData, partner: conv.partner });
        setMobileView('chat');
        window.location.hash = `#messages?user=${conv.partner.username}`;
        return;
      } catch (err) {
        if (onShowToast) onShowToast(err.message || "Failed to open conversation.");
        return;
      }
    }
    setActiveConversation(conv);
    setMobileView('chat');
    window.location.hash = `#messages?conversation=${conv.id}`;
  };

  const filteredConvs = searchQuery.trim()
    ? conversations.filter(c =>
        c.partner?.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.partner?.username?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  return (
    <div className="h-full min-h-0 md:h-[calc(100vh-140px)] w-full bg-brand-surface rounded-none md:rounded-3xl border-0 md:border border-brand-border shadow-none md:shadow-soft-sm overflow-hidden flex flex-col md:flex-row">
      
      {/* ── LEFT PANEL: Conversation List ── */}
      <div className={`flex flex-col border-r border-brand-border bg-brand-surface shrink-0 ${
        mobileView === 'chat' ? 'hidden md:flex' : 'flex'
      } w-full md:w-[300px] lg:w-[340px]`}>

        {/* Left Panel Header */}
        <div className="px-5 pt-5 pb-3 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-mainText flex items-center gap-2">
              <span>Messenger</span>
              {conversations.filter(c => c.isUnread).length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-brand-pink text-white text-[0.68rem] font-bold">
                  {conversations.filter(c => c.isUnread).length}
                </span>
              )}
            </h2>
          </div>

          {/* Search within chats */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-mutedText pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full h-9 bg-brand-lavender border border-transparent focus:border-brand-purple rounded-full pl-9 pr-4 text-xs text-brand-mainText outline-none transition-all placeholder:text-brand-mutedText/70"
            />
          </div>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto px-2 pb-3">
          <ConversationList
            conversations={filteredConvs}
            selectedId={activeConversation?.id}
            onSelectConversation={handleSelectConversation}
            loading={loading}
          />
        </div>
      </div>

      {/* ── RIGHT PANEL: Chat Window ── */}
      <div className={`flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
        {activeConversation ? (
          <ChatWindow
            conversation={activeConversation}
            onBack={() => setMobileView('list')}
            onSelectProfileUsername={onSelectProfileUsername}
            onShowToast={onShowToast}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-4 bg-gradient-to-br from-brand-bg via-brand-surface to-brand-lavender/20">
            <div className="w-24 h-24 rounded-3xl bg-primary-gradient text-white flex items-center justify-center shadow-gradient-glow mb-2">
              <MessageSquare className="w-12 h-12" />
            </div>
            <h3 className="text-2xl font-bold text-brand-mainText">Your Messages</h3>
            <p className="text-sm text-brand-mutedText max-w-xs leading-relaxed">
              Select a friend from the left panel to start a private real-time conversation.
            </p>
            {conversations.length === 0 && !loading && (
              <p className="text-xs text-brand-mutedText/70 bg-brand-lavender/60 px-4 py-2 rounded-full mt-2">
                Add friends to start messaging 🤝
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
