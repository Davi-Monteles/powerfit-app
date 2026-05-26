const CACHE_NAME = 'powerfit-pwa-v2';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg'
];

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.allSettled(
    ASSETS_TO_CACHE.map(url => cache.add(url).catch(err => console.log('Failed to cache', url, err)))
  );

  let indexResponse;
  try {
    indexResponse = await fetch('/index.html', { cache: 'reload' });
  } catch (err) {
    console.log('Failed to fetch app shell assets', err);
    return;
  }

  if (!indexResponse.ok) return;

  const html = await indexResponse.clone().text();
  await cache.put('/index.html', indexResponse);

  const assetUrls = [...html.matchAll(/(?:src|href)="(\/assets\/[^"]+)"/g)].map(match => match[1]);
  await Promise.allSettled(
    assetUrls.map(url => cache.add(url).catch(err => console.log('Failed to cache app asset', url, err)))
  );
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(cacheAppShell());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isHttpRequest = url.protocol === 'http:' || url.protocol === 'https:';
  const isViteDevServer =
    ['localhost', '127.0.0.1'].includes(url.hostname) && url.port === '5173';
  const isViteDevTraffic =
    url.pathname.startsWith('/@vite') ||
    url.pathname.startsWith('/@react-refresh') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.includes('__vite');

  if (!isHttpRequest || isViteDevServer || isViteDevTraffic || event.request.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (event.request.mode === 'navigate') {
          return response;
        }

        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(async () => {
        if (event.request.mode === 'navigate') {
          const cachedShell = await caches.match('/index.html', { ignoreVary: true }) || await caches.match('/', { ignoreVary: true });
          if (cachedShell) return cachedShell;

          try {
            return await fetch('/index.html');
          } catch {
            return new Response('Offline', {
              status: 503,
              statusText: 'Offline',
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            });
          }
        }

        const cachedResponse = await caches.match(event.request, { ignoreVary: true }) || await caches.match(url.pathname, { ignoreVary: true });
        if (cachedResponse) return cachedResponse;

        return new Response('Offline', {
          status: 503,
          statusText: 'Offline',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
  );
});
