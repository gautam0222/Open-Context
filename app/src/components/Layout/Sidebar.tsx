'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FolderIcon } from '@heroicons/react/24/outline';
import { 
  HomeIcon, 
  MagnifyingGlassIcon, 
  DocumentTextIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  SparklesIcon,
  Square3Stack3DIcon,
  CloudArrowUpIcon,
  BookOpenIcon,
  ShareIcon,
  ChatBubbleBottomCenterTextIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  { name: 'Search', href: '/search', icon: MagnifyingGlassIcon },
  { name: 'Library', href: '/library', icon: BookOpenIcon },
  { name: 'Collections', href: '/collections', icon: FolderIcon }, // ADD THIS
  { name: 'Upload Files', href: '/upload', icon: CloudArrowUpIcon, badge: 'New' },
  { name: 'Knowledge Graph', href: '/graph', icon: ShareIcon, badge: 'Pro' },
  { name: 'AI Chat', href: '/chat', icon: ChatBubbleBottomCenterTextIcon, badge: 'Pro' },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-600 to-brand-700 rounded-lg flex items-center justify-center shadow-sm">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="font-semibold text-gray-900 text-lg">Open Context</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={
                isActive
                  ? 'nav-item-active'
                  : 'nav-item'
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="flex-1">{item.name}</span>
              {item.badge && (
  <span className={`ml-auto px-2 py-0.5 text-xs font-semibold rounded-full ${
    item.badge === 'Pro' 
      ? 'bg-amber-100 text-amber-700'
      : 'bg-green-100 text-green-700'
  }`}>
    {item.badge}
  </span>
)}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
          <div className="w-8 h-8 bg-gradient-to-br from-brand-400 to-brand-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">Free Plan</p>
            <p className="text-xs text-gray-500 truncate">Upgrade to Pro</p>
          </div>
        </div>
      </div>
    </aside>
  );
}