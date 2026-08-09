import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CallProvider } from './context/CallContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import SEO from './components/common/SEO';

// Auth Pages
import Login from './pages/auth/Login';
import SignUp from './pages/auth/SignUp';
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyEmail from './pages/auth/VerifyEmail';

// Layout Components
import DevBar from './components/layout/DevBar';
import Topbar from './components/layout/Topbar';
import Sidebar from './components/layout/Sidebar';
import RightSidebar from './components/layout/RightSidebar';
import MobileBottomNav from './components/layout/MobileBottomNav';
import Toast from './components/common/Toast';
import CreatePostModal from './components/common/CreatePostModal';

// Call System Components (Phase 12)
import IncomingCallModal from './components/calls/IncomingCallModal';
import OutgoingCallScreen from './components/calls/OutgoingCallScreen';
import VoiceCallScreen from './components/calls/VoiceCallScreen';
import VideoCallScreen from './components/calls/VideoCallScreen';

// Main Application Pages
import Home from './pages/Home';
import Profile from './pages/Profile';
import PostDetail from './pages/PostDetail';
import SavedPosts from './pages/SavedPosts';
import Explore from './pages/Explore';
import Groups from './pages/Groups';
import GroupDetails from './pages/GroupDetails';
import Friends from './pages/Friends';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import SearchResults from './pages/SearchResults';
import Settings from './pages/Settings';
import AdminModeration from './pages/AdminModeration';
import NotFound from './pages/NotFound';
import DesignSystem from './pages/DesignSystem';

// Data
import { initialSuggestedFriends } from './data/mockData';

function MainAppContent() {
  const [activeScreen, setActiveScreen] = useState('home');
  const [authFormView, setAuthFormView] = useState('login'); // 'login' | 'signup' | 'forgot_password'
  const [selectedProfileUsername, setSelectedProfileUsername] = useState(null);
  const [selectedPostId, setSelectedPostId] = useState(null);
  const [selectedGroupSlug, setSelectedGroupSlug] = useState(null);
  const [searchQueryTerm, setSearchQueryTerm] = useState('');
  const [createdPostSignal, setCreatedPostSignal] = useState(null);

  const [isMobileSim, setIsMobileSim] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const [suggestedFriends, setSuggestedFriends] = useState(initialSuggestedFriends);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Hash route detection for direct URL links (#post/abc123 or #profile/username or #group/slug or #search?q=term or #saved)
  useEffect(() => {
    function handleHashChange() {
      const hash = window.location.hash;
      if (hash.startsWith('#post/')) {
        const pId = hash.replace('#post/', '');
        if (pId) {
          setSelectedPostId(pId);
          setActiveScreen('post_detail');
        }
      } else if (hash.startsWith('#profile/')) {
        const uname = hash.replace('#profile/', '');
        if (uname) {
          setSelectedProfileUsername(uname);
          setActiveScreen('profile');
        }
      } else if (hash.startsWith('#group/')) {
        const slug = hash.replace('#group/', '');
        if (slug) {
          setSelectedGroupSlug(slug);
          setActiveScreen('group_details');
        }
      } else if (hash.startsWith('#search')) {
        const queryPart = hash.includes('?q=') ? decodeURIComponent(hash.split('?q=')[1]) : '';
        setSearchQueryTerm(queryPart);
        setActiveScreen('search_results');
      } else if (hash === '#saved') {
        setActiveScreen('saved');
      } else if (hash === '#settings') {
        setActiveScreen('settings');
      } else if (hash.startsWith('#messages')) {
        setActiveScreen('messages');
      } else if (hash === '#friends') {
        setActiveScreen('friends');
      } else if (hash === '#notifications') {
        setActiveScreen('notifications');
      } else if (hash === '#explore') {
        setActiveScreen('explore');
      } else if (hash === '#groups') {
        setActiveScreen('groups');
      } else if (hash === '#admin/moderation') {
        setActiveScreen('admin_moderation');
      } else if (hash === '#profile') {
        setSelectedProfileUsername(null);
        setActiveScreen('profile');
      } else if (hash === '#home' || hash === '' || hash === '#') {
        setActiveScreen('home');
      }
    }

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Centralized Synchronized Navigation Handler (keeps activeScreen & URL address bar hash 100% in sync)
  const handleNavigateScreen = (screen, param = null) => {
    if (screen === 'profile') {
      setSelectedProfileUsername(param);
      setActiveScreen('profile');
      window.location.hash = param ? `#profile/${param}` : '#profile';
    } else if (screen === 'post_detail') {
      setSelectedPostId(param);
      setActiveScreen('post_detail');
      window.location.hash = param ? `#post/${param}` : '#home';
    } else if (screen === 'group_details') {
      setSelectedGroupSlug(param);
      setActiveScreen('group_details');
      window.location.hash = param ? `#group/${param}` : '#groups';
    } else if (screen === 'home') {
      setSelectedProfileUsername(null);
      setSelectedPostId(null);
      setSelectedGroupSlug(null);
      setActiveScreen('home');
      window.location.hash = '#home';
    } else {
      if (screen === 'profile') setSelectedProfileUsername(null);
      if (screen === 'group_details') setSelectedGroupSlug(null);
      setActiveScreen(screen);
      window.location.hash = `#${screen}`;
    }
  };

  const handleToggleAddFriend = (friendId) => {
    setSuggestedFriends(friends => friends.map(f => {
      if (f.id === friendId) {
        const added = !f.isAdded;
        showToast(added ? `Friend request sent to ${f.name}!` : 'Request cancelled');
        return { ...f, isAdded: added };
      }
      return f;
    }));
  };

  const handleSelectProfileUsername = (username) => {
    handleNavigateScreen('profile', username);
  };

  const handleSelectPostId = (postId) => {
    handleNavigateScreen('post_detail', postId);
  };

  const handleSelectGroupSlug = (slug) => {
    handleNavigateScreen('group_details', slug);
  };

  const handlePostCreated = (newPost) => {
    setCreatedPostSignal(newPost);
    if (activeScreen !== 'home') {
      handleNavigateScreen('home');
    }
  };

  const renderActiveScreen = () => {
    switch (activeScreen) {
      case 'home':
        return (
          <Home
            onOpenCreateModal={() => setIsCreateModalOpen(true)}
            onSelectProfileUsername={handleSelectProfileUsername}
            onShowToast={showToast}
            createdPostSignal={createdPostSignal}
          />
        );
      case 'profile':
        return (
          <Profile
            targetUsername={selectedProfileUsername}
            onBackToHome={() => handleNavigateScreen('home')}
            onSelectProfileUsername={handleSelectProfileUsername}
            onShowToast={showToast}
          />
        );
      case 'post_detail':
        return (
          <PostDetail
            postId={selectedPostId}
            onBackToHome={() => handleNavigateScreen('home')}
            onSelectProfileUsername={handleSelectProfileUsername}
            onShowToast={showToast}
          />
        );
      case 'saved':
        return (
          <SavedPosts
            onBackToHome={() => handleNavigateScreen('home')}
            onSelectProfileUsername={handleSelectProfileUsername}
            onShowToast={showToast}
          />
        );
      case 'explore':
        return (
          <Explore
            onSelectProfileUsername={handleSelectProfileUsername}
            onSelectPostId={handleSelectPostId}
            setActiveScreen={handleNavigateScreen}
            onShowToast={showToast}
          />
        );
      case 'groups':
        return (
          <Groups
            setActiveScreen={handleNavigateScreen}
            onSelectGroupSlug={handleSelectGroupSlug}
            onShowToast={showToast}
          />
        );
      case 'group_details':
        return (
          <GroupDetails
            groupSlug={selectedGroupSlug}
            onBack={() => handleNavigateScreen('groups')}
            onSelectProfileUsername={handleSelectProfileUsername}
            onShowToast={showToast}
          />
        );
      case 'friends':
        return (
          <Friends
            onSelectProfileUsername={handleSelectProfileUsername}
            onShowToast={showToast}
          />
        );
      case 'messages':
        return <Messages onSelectProfileUsername={handleSelectProfileUsername} onShowToast={showToast} />;
      case 'notifications':
        return (
          <Notifications
            onSelectProfileUsername={handleSelectProfileUsername}
            onSelectPostId={handleSelectPostId}
            setActiveScreen={handleNavigateScreen}
            onShowToast={showToast}
          />
        );
      case 'search_results':
        return (
          <SearchResults
            queryTerm={searchQueryTerm}
            onSelectProfileUsername={handleSelectProfileUsername}
            onSelectPostId={handleSelectPostId}
            setActiveScreen={handleNavigateScreen}
            onShowToast={showToast}
          />
        );
      case 'settings':
        return <Settings onShowToast={showToast} />;
      case 'admin_moderation':
        return <AdminModeration onShowToast={showToast} />;
      case 'design_system':
        return <DesignSystem />;
      default:
        return <NotFound onGoHome={() => handleNavigateScreen('home')} />;
    }
  };

  return (
    <ProtectedRoute>
      {(guardState) => {
        if (guardState === 'login') {
          if (authFormView === 'signup') {
            return <SignUp onNavigateToLogin={() => setAuthFormView('login')} />;
          }
          if (authFormView === 'forgot_password') {
            return <ForgotPassword onNavigateToLogin={() => setAuthFormView('login')} />;
          }
          return (
            <Login
              onNavigateToSignUp={() => setAuthFormView('signup')}
              onNavigateToForgotPassword={() => setAuthFormView('forgot_password')}
            />
          );
        }

        if (guardState === 'verify_email') {
          return <VerifyEmail />;
        }

        // Render Protected Application UI (Phase 1 preserved)
        return (
          <div className={`flex flex-col bg-brand-bg text-brand-mainText ${activeScreen === 'messages' ? 'h-[100dvh] max-h-[100dvh] overflow-hidden' : 'min-h-screen'}`}>
            {/* 1. Dev Switcher Header Bar */}
            <DevBar
              activeScreen={activeScreen}
              setActiveScreen={(screen) => handleNavigateScreen(screen)}
              isMobileSim={isMobileSim}
              setIsMobileSim={setIsMobileSim}
            />

            {/* 2. Main Topbar Header */}
            <Topbar
              setActiveScreen={(screen) => handleNavigateScreen(screen)}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
              onSelectProfileUsername={handleSelectProfileUsername}
              onSelectPostId={handleSelectPostId}
              onShowToast={showToast}
            />

            {/* 3. Main Body Container (Desktop 3 Columns or Mobile Simulator) */}
            {isMobileSim ? (
              <div className="flex-1 flex justify-center items-center py-2 min-h-0 overflow-hidden">
                <div className="w-[375px] h-[calc(100vh-140px)] max-h-[700px] min-h-[460px] bg-brand-bg border-[10px] border-brand-mainText rounded-[40px] shadow-2xl overflow-hidden relative flex flex-col">
                  <div className="w-32 h-5 bg-brand-mainText absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-50 pointer-events-none" />
                  <div className={`flex-1 min-h-0 h-full ${activeScreen === 'messages' ? 'flex flex-col pt-0 px-0 pb-0 overflow-hidden' : 'overflow-y-auto pt-10 px-4 pb-20 space-y-4'}`}>
                    {renderActiveScreen()}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`max-w-7xl w-full mx-auto flex-1 grid items-start ${
                activeScreen === 'messages' ? 'p-0 md:px-8 md:py-6 gap-0 md:gap-7 h-[calc(100dvh-44px)] md:h-auto overflow-hidden' : 'px-4 md:px-8 py-6 gap-7'
              } ${
                (['messages', 'notifications', 'friends', 'settings', 'search_results', 'saved', 'explore', 'admin_moderation'].includes(activeScreen))
                  ? 'grid-cols-1 lg:grid-cols-[260px_1fr]'
                  : 'grid-cols-1 lg:grid-cols-[260px_1fr] xl:grid-cols-[260px_1fr_320px]'
              }`}>
                <Sidebar
                  activeScreen={activeScreen}
                  setActiveScreen={(screen) => handleNavigateScreen(screen)}
                  onShowToast={showToast}
                />
                
                <main className={`min-w-0 ${activeScreen === 'messages' ? 'h-full min-h-0 flex flex-col flex-1 overflow-hidden' : ''}`}>
                  {renderActiveScreen()}
                </main>

                {!(['messages', 'notifications', 'friends', 'settings', 'search_results', 'saved', 'explore', 'admin_moderation'].includes(activeScreen)) && (
                  <RightSidebar
                    onSelectProfileUsername={handleSelectProfileUsername}
                    setActiveScreen={(screen) => handleNavigateScreen(screen)}
                    onShowToast={showToast}
                  />
                )}
              </div>
            )}

            {/* 4. Mobile Bottom Navigation */}
            <MobileBottomNav
              activeScreen={activeScreen}
              setActiveScreen={(screen) => handleNavigateScreen(screen)}
              onOpenCreateModal={() => setIsCreateModalOpen(true)}
            />

            {/* 5. Create Post Modal */}
            <CreatePostModal
              isOpen={isCreateModalOpen}
              onClose={() => setIsCreateModalOpen(false)}
              onPostCreated={handlePostCreated}
              onShowToast={showToast}
            />

            {/* 6. Toast Notification */}
            <Toast toastMessage={toastMessage} />

            {/* 7. Phase 12 — Global Call System Overlays */}
            <IncomingCallModal />
            <OutgoingCallScreen />
            <VoiceCallScreen />
            <VideoCallScreen />
          </div>
        );
      }}
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CallProvider>
        <MainAppContent />
      </CallProvider>
    </AuthProvider>
  );
}
