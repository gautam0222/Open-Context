'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Layout/Sidebar';
import KeyboardShortcuts from '@/components/Onboarding/KeyboardShortcuts';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { usePWA } from '@/hooks/usePWA';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  useKeyboardNavigation();
  usePWA();

  // Don't show sidebar on auth pages (future)
  const showSidebar = !pathname.startsWith('/auth');

  if (!showSidebar) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar - Fixed Width */}
      <Sidebar />

      {/* Main Content - Full Remaining Width */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>

      {/* Keyboard Shortcuts */}
      <KeyboardShortcuts />
    </div>
  );
}