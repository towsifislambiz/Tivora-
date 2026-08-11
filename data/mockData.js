export const currentUser = {
  id: 'user_ethan',
  name: 'Ethan Carter',
  username: '@ethancarter',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  cover: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80',
  title: 'Full Stack Developer | Tech Enthusiast | Building cool things and sharing knowledge 🚀',
  location: 'Los Angeles, CA',
  joined: 'Joined March 2023',
  isVerified: true,
  stats: {
    posts: 128,
    followers: '2.4K',
    following: '1.1K',
    groups: 89
  }
};

export const storiesData = [
  { id: 'story_you', name: 'You', avatar: currentUser.avatar, isUser: true },
  { id: 'story_1', name: 'Olivia', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', hasUnseen: true },
  { id: 'story_2', name: 'Noah', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', hasUnseen: true },
  { id: 'story_3', name: 'Emma', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80', hasUnseen: false },
  { id: 'story_4', name: 'Liam', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80', hasUnseen: false }
];

export const initialFeedPosts = [
  {
    id: 'post_1',
    author: {
      name: 'Olivia Bennett',
      username: '@oliviabennett',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      group: 'Web Developers'
    },
    timeAgo: '2h ago',
    text: 'Just completed a beautiful portfolio website for a client! 🚀 What do you guys think?',
    images: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80'
    ],
    overlayCount: 3,
    likesCount: 128,
    commentsCount: 45,
    isLiked: false,
    isSaved: false,
    comments: [
      { id: 'c1', author: 'Ethan Carter', avatar: currentUser.avatar, text: 'This looks super crisp and clean! Love the typography.', time: '1h ago' },
      { id: 'c2', author: 'Noah Wilson', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', text: 'Amazing work Olivia! The gradients match the brand perfectly.', time: '30m ago' }
    ]
  },
  {
    id: 'post_2',
    author: {
      name: 'Noah Wilson',
      username: '@noahwilson',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      group: 'UI/UX Designers'
    },
    timeAgo: '5h ago',
    text: 'Sharing some productivity tips that helped me a lot this year.',
    isBannerPost: true,
    bannerData: {
      steps: [
        { num: 1, text: 'Plan Your Day' },
        { num: 2, text: 'Prioritize Tasks' }
      ]
    },
    likesCount: 94,
    commentsCount: 18,
    isLiked: true,
    isSaved: true,
    comments: [
      { id: 'c3', author: 'Mia Anderson', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', text: 'Number 2 is key! Time blocking changed my daily workflow.', time: '4h ago' }
    ]
  }
];

export const upcomingEventsData = [
  { id: 'event_1', title: 'React Summit 2024', date: 'MAY 25', sub: 'May 25, 2024 · Online', badgeBg: 'from-brand-purple to-brand-violet' },
  { id: 'event_2', title: 'UI/UX Design Workshop', date: 'MAY 28', sub: 'May 28, 2024 · New York', badgeBg: 'from-brand-purple to-brand-blue' },
  { id: 'event_3', title: 'JavaScript Conference', date: 'JUN 02', sub: 'June 2, 2024 · San Francisco', badgeBg: 'from-brand-pink to-amber-500' }
];

export const initialSuggestedFriends = [
  { id: 'friend_1', name: 'Mia Anderson', username: '@miaanderson', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', mutual: '12 mutual friends', isAdded: false, isOnline: true },
  { id: 'friend_2', name: 'James Carter', username: '@jamescarter', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80', mutual: '8 mutual friends', isAdded: false, isOnline: true },
  { id: 'friend_3', name: 'Sophia Martinez', username: '@sophiamartinez', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80', mutual: '15 mutual friends', isAdded: false, isOnline: false }
];

export const initialGroups = [
  { id: 'grp_1', name: 'Web Developers', icon: '💻', members: '12.5K members', category: 'Technology', badgeColor: 'bg-brand-purple', isJoined: true, cover: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=800&q=80' },
  { id: 'grp_2', name: 'UI/UX Designers', icon: '🎨', members: '8.2K members', category: 'Design', badgeColor: 'bg-brand-pink', isJoined: true, cover: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=800&q=80' },
  { id: 'grp_3', name: 'Freelancers Hub', icon: '🚀', members: '15.1K members', category: 'Business', badgeColor: 'bg-brand-blue', isJoined: false, cover: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80' },
  { id: 'grp_4', name: 'Study Together', icon: '📚', members: '5.8K members', category: 'Education', badgeColor: 'bg-brand-cyan', isJoined: false, cover: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80' },
  { id: 'grp_5', name: 'Photography Lovers', icon: '📷', members: '7.3K members', category: 'Creative', badgeColor: 'bg-amber-500', isJoined: false, cover: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?auto=format&fit=crop&w=800&q=80' }
];

export const initialNotifications = [
  { id: 'notif_1', user: 'Olivia Bennett', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80', action: 'liked your post.', time: '2 minutes ago', type: 'like', isUnread: true },
  { id: 'notif_2', user: 'Noah Wilson', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80', action: 'commented on your post.', time: '15 minutes ago', type: 'comment', isUnread: true },
  { id: 'notif_3', user: 'Mia Anderson', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80', action: 'sent you a friend request.', time: '1 hour ago', type: 'friend', isUnread: false },
  { id: 'notif_4', user: 'James Carter', avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80', action: 'mentioned you in a comment.', time: '2 hours ago', type: 'mention', isUnread: false }
];

export const initialMessages = [
  {
    id: 'chat_olivia',
    user: 'Olivia Bennett',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    lastMsg: 'Hey! How are you? - 12:30 PM',
    time: '12:30 PM',
    unreadCount: 2,
    isOnline: true,
    messages: [
      { id: 'm1', text: 'Hi Ethan, did you see the new design system update?', isOutgoing: false, time: '12:28 PM' },
      { id: 'm2', text: 'Yes, it looks amazing! Love the purple and lavender gradients.', isOutgoing: true, time: '12:29 PM' },
      { id: 'm3', text: 'Hey! How are you? Can you review the design specs?', isOutgoing: false, time: '12:30 PM' }
    ]
  },
  {
    id: 'chat_noah',
    user: 'Noah Wilson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    lastMsg: 'Thanks for sharing! - 11:45 AM',
    time: '11:45 AM',
    unreadCount: 0,
    isOnline: true,
    messages: [
      { id: 'm4', text: 'Hey Ethan, great productivity tips post!', isOutgoing: false, time: '11:40 AM' },
      { id: 'm5', text: 'Thanks Noah! Glad you liked it.', isOutgoing: true, time: '11:45 AM' }
    ]
  },
  {
    id: 'chat_mia',
    user: 'Mia Anderson',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    lastMsg: "Let's connect tomorrow - 10:30 AM",
    time: '10:30 AM',
    unreadCount: 0,
    isOnline: false,
    messages: [
      { id: 'm6', text: "Let's connect tomorrow for the group project review.", isOutgoing: false, time: '10:30 AM' }
    ]
  }
];
