'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  FolderIcon,
  CloudArrowUpIcon,
  ShareIcon,
  ChatBubbleBottomCenterTextIcon,
  ChatBubbleLeftIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  SparklesIcon,
  TrophyIcon,
  FireIcon,
  BellIcon,
  UserCircleIcon,
  RssIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  useEffect(() => {
    loadUnreadCount();
    loadUnreadMessages();
    
    const interval = setInterval(() => {
      loadUnreadCount();
      loadUnreadMessages();
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, []);

  const loadUnreadCount = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/notifications');
      const data = await response.json();
      const unread = data.notifications?.filter((n: any) => !n.is_read).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Failed to load notification count:', error);
    }
  };

  const loadUnreadMessages = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/messages/unread-count');
      const data = await response.json();
      setUnreadMessages(data.count || 0);
    } catch (error) {
      console.error('Failed to load message count:', error);
    }
  };

  const navigation = [
    // Main Navigation
    { 
      name: 'Dashboard', 
      href: '/', 
      icon: HomeIcon,
      section: 'main'
    },
    { 
      name: 'Search', 
      href: '/search', 
      icon: MagnifyingGlassIcon,
      section: 'main'
    },
    { 
      name: 'Library', 
      href: '/library', 
      icon: BookOpenIcon,
      section: 'main'
    },
    { 
      name: 'Collections', 
      href: '/collections', 
      icon: FolderIcon,
      section: 'main'
    },
    { 
      name: 'Upload Files', 
      href: '/upload', 
      icon: CloudArrowUpIcon, 
      badge: 'New',
      section: 'main'
    },

    // Social & Discovery
    { 
      name: 'Discover', 
      href: '/feed', 
      icon: RssIcon,
      section: 'social'
    },
    { 
      name: 'Workspaces', 
      href: '/workspaces', 
      icon: UsersIcon,
      section: 'social'
    },
    { 
      name: 'Leaderboard', 
      href: '/leaderboard', 
      icon: TrophyIcon,
      section: 'social'
    },
    { 
    name: 'Daily Digest', 
    href: '/digest', 
    icon: SparklesIcon,
    badge: 'New',
    section: 'social'
  },
  { 
    name: 'Challenges', 
    href: '/challenges', 
    icon: FireIcon,
    badge: 'New',
    section: 'progress'
  },

    // AI & Analytics
    { 
      name: 'Concept Graph', 
      href: '/graph', 
      icon: ShareIcon,
      section: 'ai'
    },
    { 
      name: 'AI Chat', 
      href: '/chat', 
      icon: ChatBubbleBottomCenterTextIcon,
      section: 'ai'
    },
    { 
      name: 'Analytics', 
      href: '/analytics', 
      icon: ChartBarIcon,
      section: 'ai'
    },

    // Goals & Progress
    { 
      name: 'Learning Goals', 
      href: '/goals', 
      icon: FireIcon,
      badge: 'New',
      section: 'progress'
    },
    { 
      name: 'Achievements', 
      href: '/achievements', 
      icon: TrophyIcon,
      badge: 'New',
      section: 'progress'
    },

    // User
    { 
      name: 'Profile', 
      href: '/profile', 
      icon: UserCircleIcon,
      section: 'user'
    },
    { 
      name: 'Messages', 
      href: '/messages', 
      icon: ChatBubbleLeftIcon,
      count: unreadMessages,
      section: 'user'
    },
    { 
      name: 'Notifications', 
      href: '/notifications', 
      icon: BellIcon,
      count: unreadCount,
      section: 'user'
    },
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: Cog6ToothIcon,
      section: 'user'
    },
  ];

  const sections = {
    main: 'Main',
    social: 'Social',
    ai: 'AI & Knowledge',
    progress: 'Progress',
    user: 'Account',
  };

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-purple-500 rounded-xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
            📚
          </div>
          <div>
            <div className="font-bold text-xl text-gray-900">Open Context</div>
            <div className="text-xs text-gray-500">Your AI Knowledge Base</div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-6 px-3">
        {Object.entries(sections).map(([key, label]) => {
          const sectionItems = navigation.filter(item => item.section === key);
          if (sectionItems.length === 0) return null;

          return (
            <div key={key} className="mb-6">
              <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {label}
              </div>
              <div className="space-y-1">
                {sectionItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative ${
                        isActive
                          ? 'bg-brand-50 text-brand-700 font-medium'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <item.icon
                        className={`w-5 h-5 ${
                          isActive ? 'text-brand-600' : 'text-gray-400 group-hover:text-gray-600'
                        }`}
                      />
                      <span className="flex-1">{item.name}</span>
                      
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-700 rounded-full">
                          {item.badge}
                        </span>
                      )}

                      {item.count !== undefined && item.count > 0 && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full min-w-[20px] text-center">
                          {item.count > 99 ? '99+' : item.count}
                        </span>
                      )}

                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-600 rounded-r"></div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Preview */}
      <div className="p-4 border-t border-gray-200">
        <Link
          href="/profile"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
            A
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">Anonymous User</div>
            <div className="text-xs text-gray-500">Level 1 • 0 XP</div>
          </div>
          <SparklesIcon className="w-5 h-5 text-gray-400" />
        </Link>
      </div>
    </aside>
  );
}