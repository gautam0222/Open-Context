'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useKeyboardNavigation() {
  const router = useRouter();

  useEffect(() => {
    let lastKey = '';

    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Quick search (Cmd/Ctrl + /)
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        router.push('/search');
        return;
      }

      // G key navigation
      if (lastKey === 'g') {
        e.preventDefault();
        switch (e.key) {
          case 'd':
            router.push('/');
            break;
          case 's':
            router.push('/search');
            break;
          case 'l':
            router.push('/library');
            break;
          case 'c':
            router.push('/chat');
            break;
          case 'a':
            router.push('/analytics');
            break;
        }
        lastKey = '';
      } else if (e.key === 'g') {
        lastKey = 'g';
        setTimeout(() => {
          lastKey = '';
        }, 1000);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [router]);
}