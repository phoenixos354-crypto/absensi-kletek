/* Service worker MasjidKu — caching shell sederhana.
   Data absensi (fetch POST ke Apps Script) SELALU langsung ke jaringan,
   tidak pernah di-cache, jadi data tetap fresh. */
const CACHE = 'masjidku-v1';
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon-180.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;                 // request data (POST) selalu network
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;  // Apps Script & CDN tidak di-cache

  // Halaman: network first, offline pakai shell dari cache
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put('./', copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match('./').then(r => r || caches.match('./index.html')))
    );
    return;
  }

  // Aset statis: cache first
  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req))
  );
});
