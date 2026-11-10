// Minimal service worker: makes OurWorld installable (PWA) without caching
// private data. Requests always go to the network.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', () => {
  // network only: content is private and must never be served from a shared cache
});
