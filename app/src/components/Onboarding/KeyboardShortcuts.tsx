'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, CommandLineIcon } from '@heroicons/react/24/outline';

export default function KeyboardShortcuts() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Command/Ctrl + K to open shortcuts
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(!isOpen);
      }

      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleCustomEvent = () => {
      setIsOpen(true);
    };

    window.addEventListener('keydown', handleKeyPress);
    window.addEventListener('open-shortcuts', handleCustomEvent);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      window.removeEventListener('open-shortcuts', handleCustomEvent);
    };
  }, [isOpen]);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-3 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 transition z-40 hover:scale-110"
        title="Keyboard Shortcuts (⌘K)"
      >
        <CommandLineIcon className="w-6 h-6" />
      </button>
    );
  }

  const shortcuts = [
    { category: 'General', items: [
      { key: '⌘/Ctrl + K', action: 'Open keyboard shortcuts' },
      { key: '⌘/Ctrl + /', action: 'Quick search' },
      { key: '?', action: 'Show help' },
      { key: 'Esc', action: 'Close modal/dialog' },
    ]},
    { category: 'Navigation', items: [
      { key: 'G then D', action: 'Go to Dashboard' },
      { key: 'G then S', action: 'Go to Search' },
      { key: 'G then L', action: 'Go to Library' },
      { key: 'G then C', action: 'Go to Chat' },
      { key: 'G then A', action: 'Go to Analytics' },
      { key: 'G then U', action: 'Go to Upload' },
      { key: 'G then O', action: 'Go to Collections' },
    ]},
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center">
                <CommandLineIcon className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Keyboard Shortcuts</h2>
                <p className="text-sm text-gray-600">Work faster with shortcuts</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {shortcuts.map((section, idx) => (
            <div key={idx} className={idx > 0 ? 'mt-6' : ''}>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((shortcut, sidx) => (
                  <div
                    key={sidx}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition"
                  >
                    <span className="text-sm text-gray-700">{shortcut.action}</span>
                    <kbd className="px-3 py-1.5 text-xs font-mono bg-gray-100 border border-gray-300 rounded shadow-sm">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <p className="text-xs text-gray-600 text-center">
            Press <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">⌘K</kbd> or{' '}
            <kbd className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono">Ctrl+K</kbd> anytime to toggle this menu
          </p>
        </div>
      </div>
    </div>
  );
}