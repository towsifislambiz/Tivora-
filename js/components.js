/* TodoCommunity UI Component Renderers */

// SVG Icon Helper
function getIconSvg(name, size = 18, color = 'currentColor') {
  const icons = {
    home: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    explore: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
    groups: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    friends: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`,
    messages: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>`,
    notifications: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
    bookmarks: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
    events: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>`,
    files: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>`,
    heart: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
    comment: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
    share: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
    save: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
    plus: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
    search: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
    more: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>`,
    check: `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`
  };
  return icons[name] || '';
}

// Render Stories Row
function renderStories(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = storiesData.map(story => `
    <div class="story-item" onclick="openStoryViewer('${story.id}')">
      <div class="story-avatar-ring ${story.isUser ? 'user-create' : ''}">
        <img src="${story.avatar}" class="story-avatar-img" alt="${story.name}">
        ${story.isUser ? `<div style="position:absolute; bottom:-2px; right:-2px; background:var(--gradient-primary); width:20px; height:20px; border-radius:50%; border:2px solid #fff; color:#fff; display:flex; align-items:center; justify-content:center; font-size:0.7rem;">+</div>` : ''}
      </div>
      <span class="story-name">${story.name}</span>
    </div>
  `).join('');
}

// Render Feed Posts
function renderPosts(containerId, posts = feedPosts) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = posts.map(post => `
    <div class="post-card" id="${post.id}">
      <div class="post-header">
        <div class="post-author-info">
          <img src="${post.author.avatar}" class="avatar-md" alt="${post.author.name}">
          <div>
            <div class="author-name">${post.author.name}</div>
            <div class="post-meta">${post.timeAgo} · <span class="group-tag">${post.author.group}</span></div>
          </div>
        </div>
        <button class="post-more-btn">${getIconSvg('more', 18)}</button>
      </div>

      <div class="post-text">${post.text}</div>

      ${post.images && post.images.length > 0 ? `
        <div class="post-image-grid">
          ${post.images.slice(0, 4).map((imgUrl, index) => `
            <div class="post-image-item" onclick="viewImageLightbox('${imgUrl}')">
              <img src="${imgUrl}" alt="Post image ${index + 1}">
              ${index === 3 && post.overlayCount ? `<div class="image-overlay-badge">+${post.overlayCount}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${post.isBannerPost ? `
        <div class="productivity-banner-card">
          <div class="banner-step-list">
            ${post.bannerData.steps.map(step => `
              <div class="banner-step-item">
                <span class="banner-step-num">${step.num}</span>
                <span>${step.text}</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      <div class="post-stats-row">
        <div class="reaction-icons-group">
          <span class="reaction-badge reaction-like">${getIconSvg('heart', 12, '#fff')}</span>
          <span class="reaction-badge reaction-heart">❤️</span>
          <span style="margin-left:4px; font-weight:var(--fw-bold); color:var(--text-main);">${post.likesCount}</span>
        </div>
        <div>${post.commentsCount} Comments</div>
      </div>

      <div class="post-actions-toolbar">
        <button class="post-action-btn-main ${post.isLiked ? 'liked' : ''}" onclick="toggleLikePost('${post.id}')">
          ${getIconSvg('heart', 18)} Like
        </button>
        <button class="post-action-btn-main" onclick="toggleCommentsSection('${post.id}')">
          ${getIconSvg('comment', 18)} Comment
        </button>
        <button class="post-action-btn-main" onclick="sharePostModal('${post.id}')">
          ${getIconSvg('share', 18)} Share
        </button>
        <button class="post-action-btn-main ${post.isSaved ? 'saved' : ''}" onclick="toggleSavePost('${post.id}')">
          ${getIconSvg('save', 18)} Save
        </button>
      </div>

      <div class="comments-container" id="comments_${post.id}" style="display: ${post.comments && post.comments.length > 0 ? 'flex' : 'none'};">
        ${(post.comments || []).map(comment => `
          <div class="comment-item">
            <img src="${currentUser.avatar}" class="avatar-md" style="width:32px; height:32px;" alt="${comment.author}">
            <div class="comment-bubble">
              <div class="comment-author">${comment.author}</div>
              <div class="comment-text">${comment.text}</div>
              <div class="comment-time">${comment.time}</div>
            </div>
          </div>
        `).join('')}
        <div class="comment-input-row">
          <img src="${currentUser.avatar}" class="avatar-md" style="width:32px; height:32px;" alt="You">
          <input type="text" class="comment-input-field" placeholder="Write a comment..." onkeydown="handleCommentSubmit(event, '${post.id}')">
        </div>
      </div>
    </div>
  `).join('');
}

// Render Upcoming Events Widget
function renderUpcomingEvents(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = upcomingEvents.map(event => `
    <div class="event-item-card">
      <div class="event-date-badge ${event.badgeColor}">
        <span class="event-day">${event.date.split(' ')[1]}</span>
        <span class="event-month">${event.date.split(' ')[0]}</span>
      </div>
      <div class="event-details">
        <span class="event-title">${event.title}</span>
        <span class="event-sub">${event.sub}</span>
      </div>
    </div>
  `).join('');
}

// Render Suggested Friends Widget
function renderSuggestedFriends(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = suggestedFriends.map(friend => `
    <div class="friend-suggest-card">
      <div class="friend-info">
        <img src="${friend.avatar}" class="avatar-md" alt="${friend.name}">
        <div>
          <div class="friend-name">${friend.name}</div>
          <div class="friend-mutual">${friend.mutual}</div>
        </div>
      </div>
      <button class="btn-add-friend ${friend.isAdded ? 'added' : ''}" onclick="toggleAddFriend('${friend.id}')">
        ${friend.isAdded ? 'Added' : 'Add'}
      </button>
    </div>
  `).join('');
}

// Render Profile View (Ethan Carter)
function renderProfileView(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="profile-card">
      <div class="profile-cover">
        <img src="${currentUser.cover}" class="profile-cover-img" alt="Cover photo">
      </div>
      <div class="profile-header-content">
        <div class="profile-avatar-row">
          <div class="profile-avatar-box">
            <img src="${currentUser.avatar}" class="profile-avatar-img" alt="${currentUser.name}">
            <div class="profile-online-badge"></div>
          </div>
          <div class="profile-header-actions">
            <button class="btn btn-primary" onclick="showToast('Edit profile modal coming soon!')">Edit Profile</button>
            <button class="icon-btn-circle">${getIconSvg('more', 18)}</button>
          </div>
        </div>

        <div class="profile-identity">
          <div class="profile-name-row">
            <h1 class="profile-display-name">${currentUser.name}</h1>
            <span class="verified-icon" title="Verified Member">${getIconSvg('check', 18, 'var(--accent-blue)')}</span>
          </div>
          <div class="profile-username">${currentUser.username}</div>
          <p class="profile-bio">${currentUser.title}</p>
          <div class="profile-meta-row">
            <div class="profile-meta-item">📍 ${currentUser.location}</div>
            <div class="profile-meta-item">📅 ${currentUser.joined}</div>
          </div>
        </div>

        <div class="profile-stats-row">
          <div class="stat-box">
            <span class="stat-num">${currentUser.stats.posts}</span>
            <span class="stat-label">Posts</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">${currentUser.stats.followers}</span>
            <span class="stat-label">Followers</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">${currentUser.stats.following}</span>
            <span class="stat-label">Following</span>
          </div>
          <div class="stat-box">
            <span class="stat-num">${currentUser.stats.groups}</span>
            <span class="stat-label">Groups</span>
          </div>
        </div>

        <div class="profile-nav-tabs">
          <button class="p-tab-btn active">Posts</button>
          <button class="p-tab-btn">About</button>
          <button class="p-tab-btn">Friends</button>
          <button class="p-tab-btn">Photos</button>
          <button class="p-tab-btn">Groups</button>
        </div>
      </div>
    </div>
    <div id="profile_feed_container"></div>
  `;

  renderPosts('profile_feed_container', feedPosts.slice(0, 1));
}

// Render Explore Screen
function renderExploreView(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="explore-container">
      <div class="explore-filter-pills">
        <button class="filter-pill-btn active">All</button>
        <button class="filter-pill-btn">People</button>
        <button class="filter-pill-btn">Groups</button>
        <button class="filter-pill-btn">Posts</button>
        <button class="filter-pill-btn">Events</button>
      </div>

      <div class="card">
        <div class="card-header-row">
          <h3 class="card-title-sm">Popular Groups</h3>
          <a class="card-action-link">See All</a>
        </div>
        <div class="groups-card-grid">
          ${groupsList.map(grp => `
            <div class="group-card-item">
              <div class="group-card-banner"></div>
              <div class="group-card-content">
                <div class="group-avatar-lg">${grp.icon}</div>
                <div class="group-card-title">${grp.name}</div>
                <div class="group-card-members">${grp.members}</div>
                <button class="btn btn-secondary ${grp.isJoined ? 'btn-disabled' : ''}" style="width:100%;" onclick="toggleJoinGroup('${grp.id}')">
                  ${grp.isJoined ? 'Joined' : 'Join Group'}
                </button>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// Render Messages Messenger View
function renderMessagesView(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  const activeChat = messengerData[0];

  container.innerHTML = `
    <div class="messenger-container">
      <div class="chat-sidebar">
        <div class="chat-search-box">
          <input type="text" class="comment-input-field" placeholder="Search messages...">
        </div>
        <div class="chat-list">
          ${messengerData.map(chat => `
            <div class="chat-item ${chat.id === activeChat.id ? 'active' : ''}" onclick="selectActiveChat('${chat.id}')">
              <div class="chat-avatar-box">
                <img src="${chat.avatar}" class="avatar-md" alt="${chat.user}">
                ${chat.isOnline ? `<div class="online-indicator" style="position:absolute; bottom:0; right:0;"></div>` : ''}
              </div>
              <div class="chat-item-info">
                <div class="chat-item-top">
                  <span class="chat-item-name">${chat.user}</span>
                  <span class="chat-item-time">${chat.time}</span>
                </div>
                <div class="chat-item-msg">${chat.lastMsg}</div>
              </div>
              ${chat.unreadCount > 0 ? `<div class="nav-badge">${chat.unreadCount}</div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>

      <div class="chat-main-window">
        <div class="chat-window-header">
          <div style="display:flex; align-items:center; gap:12px;">
            <img src="${activeChat.avatar}" class="avatar-md" alt="${activeChat.user}">
            <div>
              <div style="font-weight:var(--fw-bold);">${activeChat.user}</div>
              <div style="font-size:0.75rem; color:var(--accent-success);">Online</div>
            </div>
          </div>
          <button class="icon-btn-circle">${getIconSvg('more', 18)}</button>
        </div>

        <div class="chat-messages-scroll" id="chat_messages_scroll">
          ${activeChat.messages.map(msg => `
            <div class="message-bubble-row ${msg.isOutgoing ? 'outgoing' : 'incoming'}">
              <div class="chat-bubble">${msg.text}</div>
            </div>
          `).join('')}
        </div>

        <div class="chat-input-bar">
          <input type="text" id="chat_msg_input" class="chat-input-field" placeholder="Write a message..." onkeydown="handleSendMessage(event)">
          <button class="btn btn-primary" onclick="sendMessageAction()">Send</button>
        </div>
      </div>
    </div>
  `;
}

// Render Notifications View
function renderNotificationsView(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="card">
      <div class="card-header-row">
        <h3 class="card-title-sm">Notifications</h3>
        <a class="card-action-link" onclick="markAllNotificationsRead()">Mark all as read</a>
      </div>
      <div class="notifications-list">
        ${notificationsData.map(notif => `
          <div class="notification-item ${notif.isUnread ? 'unread' : ''}">
            <div class="notif-left">
              <img src="${notif.avatar}" class="avatar-md" alt="${notif.user}">
              <div>
                <div class="notif-text"><strong>${notif.user}</strong> ${notif.action}</div>
                <div class="notif-time">${notif.time}</div>
              </div>
            </div>
            ${notif.isUnread ? `<div class="group-active-dot"></div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// Render Design System Showcase Screen
function renderDesignSystemView(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = `
    <div class="design-system-container">
      <div class="ds-header">
        <h1 class="ds-title">
          TodoCommunity
          <span class="ds-title-badge">DESIGN SYSTEM v1.0</span>
        </h1>
        <p class="ds-subtitle">Connect · Share · Grow Together — Centralized Token Specs & Components Showcase</p>
      </div>

      <div class="ds-grid-section">
        <!-- Colors Block -->
        <div class="ds-block">
          <h3 class="ds-block-title">Colors Palette</h3>
          <div class="swatch-grid">
            <div class="swatch-item" style="background:#6C5CE7;" title="Primary Purple #6C5CE7">Purple</div>
            <div class="swatch-item" style="background:#8B5CF6;" title="Violet #8B5CF6">Violet</div>
            <div class="swatch-item" style="background:#EC4899;" title="Pink #EC4899">Pink</div>
            <div class="swatch-item" style="background:#3B82F6;" title="Blue #3B82F6">Blue</div>
            <div class="swatch-item" style="background:#06B6D4;" title="Cyan #06B6D4">Cyan</div>
            <div class="swatch-item" style="background:#10B981;" title="Success #10B981">Green</div>
            <div class="swatch-item" style="background:#F0F3FF; color:#17172A;" title="Lavender #F0F3FF">Soft</div>
          </div>
        </div>

        <!-- Typography Block -->
        <div class="ds-block">
          <h3 class="ds-block-title">Typography (Poppins / Plus Jakarta Sans)</h3>
          <div class="typo-showcase">
            <div class="typo-item-row">
              <span class="typo-label">Bold 700</span>
              <span class="typo-val" style="font-weight:700; font-size:1.1rem;">Heading Title</span>
            </div>
            <div class="typo-item-row">
              <span class="typo-label">SemiBold 600</span>
              <span class="typo-val" style="font-weight:600; font-size:0.95rem;">Subheading Text</span>
            </div>
            <div class="typo-item-row">
              <span class="typo-label">Regular 400</span>
              <span class="typo-val" style="font-weight:400; font-size:0.875rem;">Body Paragraph</span>
            </div>
          </div>
        </div>

        <!-- Buttons Showcase -->
        <div class="ds-block">
          <h3 class="ds-block-title">Buttons</h3>
          <div style="display:flex; flex-wrap:wrap; gap:10px;">
            <button class="btn btn-primary">Primary Button</button>
            <button class="btn btn-secondary">Secondary Button</button>
            <button class="btn btn-outline">Outline</button>
            <button class="btn btn-ghost">Ghost</button>
          </div>
        </div>

        <!-- Badges Showcase -->
        <div class="ds-block">
          <h3 class="ds-block-title">Badges</h3>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            <span class="badge badge-admin">Admin</span>
            <span class="badge badge-moderator">Moderator</span>
            <span class="badge badge-member">Member</span>
            <span class="badge badge-online">Online</span>
            <span class="badge badge-new">New</span>
          </div>
        </div>
      </div>

      <!-- Breakpoint Showcase -->
      <div class="ds-block">
        <h3 class="ds-block-title">Responsive Breakpoints</h3>
        <div class="breakpoint-grid">
          <div class="bp-item"><div class="bp-icon">📱</div><span>Mobile<br>320 - 600px</span></div>
          <div class="bp-item"><div class="bp-icon">📱</div><span>Tablet<br>600 - 900px</span></div>
          <div class="bp-item"><div class="bp-icon">💻</div><span>Laptop<br>900 - 1280px</span></div>
          <div class="bp-item"><div class="bp-icon">🖥️</div><span>Desktop<br>1280px+</span></div>
        </div>
      </div>

      <!-- Vector Illustration Section -->
      <div class="ds-illustration-box">
        <div class="ds-illus-text">
          <h3>Community First Aesthetics</h3>
          <p>Designed with subtle lavender surfaces, crisp white cards, and vibrant purple-pink gradients.</p>
        </div>
        <div style="font-size:3rem;">✨ 🚀 🎨</div>
      </div>
    </div>
  `;
}
