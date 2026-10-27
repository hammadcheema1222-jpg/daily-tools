// Daily Tools offline shell. Change VERSION with each release.
const VERSION = 'fc-daily-v6-order-and-seven-day-pdf';
const SHELL = ['./', './index.html', './art.js', './app.js', './styles.css', './reports.js', './pdf-lib.min.js', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(VERSION).then(async (cache) => {
    // Bypass the HTTP cache when installing a new release.
    await cache.addAll(SHELL.map((url) => new Request(new URL(url, self.location.href), { cache: 'reload' })));
    await self.skipWaiting();
  }));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((key) => key.startsWith('fc-daily-') && key !== VERSION).map((key) => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isFont = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !isFont) return;

  // Prefer fresh application files online; keep the saved shell for offline use.
  // Cache writes are included in the response promise to keep the worker alive.
  event.respondWith((async () => {
    const cache = await caches.open(VERSION);
    try {
      const response = await fetch(req, { cache: 'no-cache' });
      if (response.ok || response.type === 'opaque') {
        try { await cache.put(req, response.clone()); } catch {}
        return response;
      }
      const cached = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
      return cached || response;
    } catch {
      const cached = await cache.match(req, { ignoreSearch: req.mode === 'navigate' });
      if (cached) return cached;
      if (req.mode === 'navigate') {
        const shell = await cache.match('./index.html');
        if (shell) return shell;
      }
      return new Response('Unavailable offline', { status: 504 });
    }
  })());
});
