self.addEventListener('install', e => {
  e.waitUntil(caches.open('sgf-v1').then(c => c.addAll([
    './','./index.html','./css/style.css',
    './js/storage.js','./js/gamification.js','./js/ui.js','./js/data.js'
  ])));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
