const CACHE_VERSION = 'v2.2.0';
const CACHE_NAME = `sandro-radio-tv-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  '/',
  '/app.html',
  '/manifest.json'
];

const STREAMING_DOMAINS = [
  'mediapolis.rai.it',
  'mediaset.net',
  'akamaized.net',
  'cloudfront.net',
  'msvdn.net',
  'streamlock.net',
  'xdevel.com',
  'hiway.media',
  'fluid.stream',
  'imgur.com',
  'cdn.jsdelivr.net',
  'icestreaming.rai.it',
  'mediahub.it',
  'radioradicale.it',
  'mariatvcdn.it',
  'lswcdn.net',
  'morescreens.com',
  'youtube.com',
  'twitch.tv',
  'vimeo.com',
  'dailymotion.com',
  'shoutcast.rtl.it',
  'ice02.fluidstream.net',
  'ice04.fluidstream.net',
  'ice12.fluidstream.net',
  'ice14.fluidstream.net'
];

self.addEventListener('install', (event) => {
  console.log('[SW] 📻 Installazione SANDRO RADIO TV in corso...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch((error) => console.error('[SW] ❌ Errore cache:', error))
  );
});

self.addEventListener('activate', (event) => {
  console.log('[SW] 🔄 Attivazione...');
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('sandro-radio-tv-') && name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET') return;
  if (isStreamingURL(url)) return;
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(cacheFirst(request));
  }
});

async function cacheFirst(request) {
  try {
    const cached = await caches.match(request);
    if (cached) {
      if (request.url.includes('.js') || request.url.includes('.css')) {
        fetch(request).then(response => {
          if (response.ok) caches.open(CACHE_NAME).then(cache => cache.put(request, response));
        }).catch(() => {});
      }
      return cached;
    }
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    return offlineResponse();
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    return offlineResponse();
  }
}

function isStreamingURL(url) {
  return STREAMING_DOMAINS.some(domain => url.hostname.includes(domain));
}

function offlineResponse() {
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Offline</title></head><body style="background:#000;color:#fff;font-family:sans-serif;text-align:center;padding:40px;"><h1>📻 SANDRO RADIO TV</h1><p>Sei offline.</p><button onclick="location.reload()">🔄 Riprova</button></body></html>`;
  return new Response(html, {
    status: 503,
    headers: { 'Content-Type': 'text/html', 'Cache-Control': 'no-cache' }
  });
}

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    caches.keys().then((names) => {
      names.forEach(name => {
        if (name.startsWith('sandro-radio-tv-')) caches.delete(name);
      });
    });
  }
});

console.log('[SW] 📻 SANDRO RADIO TV Service Worker - v' + CACHE_VERSION);