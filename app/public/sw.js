const CACHE_NAME = 'open-context-v1';
const OFFLINE_URL = '/offline.html';

const CACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
];

// Install service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy: Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone and cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }

          // Return offline page for navigations
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }

          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Background sync for offline captures
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-captures') {
    event.waitUntil(syncCaptures());
  }
});

async function syncCaptures() {
  // Sync offline captures when back online
  const cache = await caches.open('offline-captures');
  const requests = await cache.keys();

  for (const request of requests) {
    try {
      await fetch(request.clone());
      await cache.delete(request);
    } catch (error) {
      console.error('Failed to sync:', error);
    }
  }
}