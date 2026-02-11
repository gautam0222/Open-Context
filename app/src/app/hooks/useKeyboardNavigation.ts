'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useKeyboardNavigation() {
  const router = useRouter();

  useEffect(() => {
    let lastKey = '';
    let lastKeyTime = 0;

    const handleKeyPress = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const now = Date.now();

      // Quick search (Cmd/Ctrl + /)
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        router.push('/search');
        return;
      }

      // G key navigation (vim-style)
      if (e.key === 'g') {
        if (lastKey === 'g' && now - lastKeyTime < 1000) {
          // Double G pressed
          lastKey = '';
        } else {
          lastKey = 'g';
          lastKeyTime = now;
        }
        return;
      }

      if (lastKey === 'g' && now - lastKeyTime < 1000) {
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
          case 'u':
            router.push('/upload');
            break;
          case 'o':
            router.push('/collections');
            break;
        }
        lastKey = '';
      }

      // Question mark for help
      if (e.key === '?') {
        e.preventDefault();
        // Trigger keyboard shortcuts modal
        const event = new CustomEvent('open-shortcuts');
        window.dispatchEvent(event);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [router]);
}