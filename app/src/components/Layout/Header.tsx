'use client';

import { MagnifyingGlassIcon, BellIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface HeaderProps {
  title?: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function Header({ title, description, actions }: HeaderProps) {
  const [showSearch, setShowSearch] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="flex-1">
        {title && (
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            {description && (
              <p className="text-sm text-gray-500 mt-0.5">{description}</p>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* Quick Search */}
        <button
          onClick={() => setShowSearch(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <MagnifyingGlassIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Quick search</span>
          <kbd className="hidden sm:inline px-2 py-0.5 text-xs bg-white border border-gray-300 rounded">
            ⌘K
          </kbd>
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
          <BellIcon className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-brand-600 rounded-full"></span>
        </button>

        {/* Actions */}
        {actions}
      </div>
    </header>
  );
}