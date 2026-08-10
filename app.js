/* TodoCommunity Main Application Controller */

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  // 1. Initial Render of Feed & Widgets
  renderStories('stories_carousel');
  renderPosts('feed_posts_container');
  renderUpcomingEvents('upcoming_events_container');
  renderSuggestedFriends('suggested_friends_container');

  // 2. Render Secondary Views
  renderProfileView('view_profile');
  renderExploreView('view_explore');
  renderMessagesView('view_messages');
  renderNotificationsView('view_notifications');
  renderDesignSystemView('view_design_system');

  // 3. Setup Navigation & View Listeners
  setupDevSwitcher();
  setupSidebarNavigation();
}

// Dev Screen Switcher Router
function setupDevSwitcher() {
  const devButtons = document.querySelectorAll('.dev-nav-btn');
  devButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      devButtons.forEach(b => b.classList.remove('active'));
      const targetScreen = btn.dataset.screen;
      btn.classList.add('active');
      switchScreenView(targetScreen);
    });
  });
}

// Sidebar Links Navigation
function setupSidebarNavigation() {
  const navLinks = document.querySelectorAll('.nav-item-link');
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      
      const targetScreen = link.dataset.screen;
      if (targetScreen) {
        switchScreenView(targetScreen);
        
        // Synchronize Dev Bar active state
        const devBtn = document.querySelector(`.dev-nav-btn[data-screen="${targetScreen}"]`);
        if (devBtn) {
          document.querySelectorAll('.dev-nav-btn').forEach(b => b.classList.remove('active'));
          devBtn.classList.add('active');
        }
      }
    });
  });
}

// Global View Switcher
function switchScreenView(screenName) {
  const screens = document.querySelectorAll('.view-screen');
  const desktopColumns = document.querySelectorAll('.sidebar-left, .sidebar-right');
  const mobileSim = document.getElementById('mobile_simulator_container');

  // Hide all screens
  screens.forEach(s => s.classList.remove('active'));
  if (mobileSim) mobileSim.style.display = 'none';

  if (screenName === 'mobile_preview') {
    desktopColumns.forEach(col => col.style.display = 'none');
    if (mobileSim) mobileSim.style.display = 'flex';
    document.getElementById('view_home').classList.add('active');
  } else {
    // Restore layout
    desktopColumns.forEach(col => col.style.display = '');
    const targetEl = document.getElementById(`view_${screenName}`);
    if (targetEl) {
      targetEl.classList.add('active');
    } else {
      document.getElementById('view_home').classList.add('active');
    }
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* ==========================================================================
   Interactive Social Actions
   ========================================================================== */

// Toggle Like on Post
function toggleLikePost(postId) {
  const post = feedPosts.find(p => p.id === postId);
  if (!post) return;

  post.isLiked = !post.isLiked;
  post.likesCount += post.isLiked ? 1 : -1;
  renderPosts('feed_posts_container');
  showToast(post.isLiked ? 'Liked post ❤️' : 'Unliked post');
}

// Toggle Save Post
function toggleSavePost(postId) {
  const post = feedPosts.find(p => p.id === postId);
  if (!post) return;

  post.isSaved = !post.isSaved;
  renderPosts('feed_posts_container');
  showToast(post.isSaved ? 'Saved to Bookmarks 🔖' : 'Removed from Bookmarks');
}

// Toggle Comments Section
function toggleCommentsSection(postId) {
  const commentsEl = document.getElementById(`comments_${postId}`);
  if (commentsEl) {
    commentsEl.style.display = commentsEl.style.display === 'none' ? 'flex' : 'none';
  }
}

// Handle Comment Submission
function handleCommentSubmit(event, postId) {
  if (event.key === 'Enter') {
    const inputVal = event.target.value.trim();
    if (!inputVal) return;

    const post = feedPosts.find(p => p.id === postId);
    if (post) {
      post.comments = post.comments || [];
      post.comments.push({
        author: currentUser.name,
        text: inputVal,
        time: 'Just now'
      });
      post.commentsCount += 1;
      renderPosts('feed_posts_container');
      showToast('Comment added!');
    }
  }
}

// Toggle Add Friend
function toggleAddFriend(friendId) {
  const friend = suggestedFriends.find(f => f.id === friendId);
  if (friend) {
    friend.isAdded = !friend.isAdded;
    renderSuggestedFriends('suggested_friends_container');
    showToast(friend.isAdded ? `Friend request sent to ${friend.name}!` : `Request cancelled`);
  }
}

// Toggle Join Group
function toggleJoinGroup(groupId) {
  const grp = groupsList.find(g => g.id === groupId);
  if (grp) {
    grp.isJoined = !grp.isJoined;
    renderExploreView('view_explore');
    showToast(grp.isJoined ? `Joined group ${grp.name}! 🎉` : `Left group ${grp.name}`);
  }
}

// Modal Handlers
function openCreatePostModal() {
  document.getElementById('create_post_modal').classList.add('active');
}

function closeCreatePostModal() {
  document.getElementById('create_post_modal').classList.remove('active');
}

function submitNewPost() {
  const textInput = document.getElementById('modal_post_textarea').value.trim();
  if (!textInput) {
    showToast('Please type something to post!');
    return;
  }

  const newPost = {
    id: `post_${Date.now()}`,
    author: {
      name: currentUser.name,
      avatar: currentUser.avatar,
      group: 'Web Developers'
    },
    timeAgo: 'Just now',
    text: textInput,
    likesCount: 0,
    commentsCount: 0,
    isLiked: false,
    isSaved: false,
    comments: []
  };

  feedPosts.unshift(newPost);
  renderPosts('feed_posts_container');
  document.getElementById('modal_post_textarea').value = '';
  closeCreatePostModal();
  showToast('Your post has been published! 🚀');
}

// Story Viewer Lightbox
function openStoryViewer(storyId) {
  const story = storiesData.find(s => s.id === storyId);
  if (story) {
    showToast(`Viewing ${story.name}'s story ✨`);
  }
}

// Toast Notifications System
function showToast(message) {
  let toastContainer = document.getElementById('toast_container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast_container';
    toastContainer.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 3000;
      display: flex;
      flex-direction: column;
      gap: 10px;
    `;
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.style.cssText = `
    background: #17172A;
    color: #FFFFFF;
    padding: 12px 20px;
    border-radius: 30px;
    font-size: 0.875rem;
    font-weight: 500;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    border: 1px solid rgba(255,255,255,0.1);
    animation: fadeIn 0.3s ease;
  `;
  toast.innerText = message;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// Messenger Chat Interactivity
function sendMessageAction() {
  const input = document.getElementById('chat_msg_input');
  if (!input) return;
  const val = input.value.trim();
  if (!val) return;

  const scrollBox = document.getElementById('chat_messages_scroll');
  if (scrollBox) {
    const bubble = document.createElement('div');
    bubble.className = 'message-bubble-row outgoing';
    bubble.innerHTML = `<div class="chat-bubble">${val}</div>`;
    scrollBox.appendChild(bubble);
    scrollBox.scrollTop = scrollBox.scrollHeight;
  }

  input.value = '';

  // Auto Reply simulation
  setTimeout(() => {
    if (scrollBox) {
      const reply = document.createElement('div');
      reply.className = 'message-bubble-row incoming';
      reply.innerHTML = `<div class="chat-bubble">Sounds good! Thanks for the update! 🙌</div>`;
      scrollBox.appendChild(reply);
      scrollBox.scrollTop = scrollBox.scrollHeight;
    }
  }, 1000);
}

function handleSendMessage(event) {
  if (event.key === 'Enter') {
    sendMessageAction();
  }
}

function markAllNotificationsRead() {
  notificationsData.forEach(n => n.isUnread = false);
  renderNotificationsView('view_notifications');
  showToast('All notifications marked as read');
}
