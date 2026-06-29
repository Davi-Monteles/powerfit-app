const CACHE_NAME = 'powerfit-pwa-v5';
const EXERCISE_MEDIA_CACHE = 'powerfit-exercise-media-v1';
const EXERCISE_MEDIA_LIMIT = 60;
const exerciseImageUrls = new Set();
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.svg',
  '/pwa-icon.svg',
  '/powerfit/landing/hero-trainer.jpg',
  '/powerfit/landing/panel-boxjump.jpg',
  '/powerfit/landing/panel-coaching.jpg',
  '/powerfit/landing/panel-deadlift-1.jpg',
  '/powerfit/landing/panel-deadlift-2.jpg',
  '/powerfit/landing/panel-grip.jpg',
  '/powerfit/landing/panel-kettlebell.jpg',
  '/powerfit/landing/panel-press.jpg',
  '/powerfit/landing/panel-pullup.jpg',
  '/powerfit/landing/panel-review.jpg',
  '/powerfit/landing/panel-ropes.jpg',
  '/powerfit/landing/panel-sprint.jpg'
];

function normalizeExerciseImageUrl(value) {
  try {
    const url = new URL(String(value || '').trim(), self.location.origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    return url.href;
  } catch {
    return '';
  }
}

function getExerciseImageUrls(values) {
  if (!Array.isArray(values)) return [];
  const flattenedValues = values.flatMap(value => (Array.isArray(value) ? value : [value]));
  return [...new Set(flattenedValues.map(normalizeExerciseImageUrl).filter(Boolean))];
}

function createExerciseImageRequest(url) {
  const parsed = new URL(url);
  if (parsed.origin === self.location.origin) return new Request(parsed.href);
  return new Request(parsed.href, { mode: 'no-cors', credentials: 'omit' });
}

function canCacheExerciseImage(response) {
  return response && (response.ok || response.type === 'opaque');
}

async function findCachedExerciseImageRequest(cache, url) {
  const keys = await cache.keys();
  return keys.find(request => request.url === url);
}

async function touchCachedExerciseImage(cache, request, response) {
  await cache.delete(request);
  await cache.put(request, response.clone());
  return response;
}

async function trimExerciseImageCache(cache) {
  const keys = await cache.keys();
  if (keys.length <= EXERCISE_MEDIA_LIMIT) return;

  await Promise.all(keys.slice(0, keys.length - EXERCISE_MEDIA_LIMIT).map(request => cache.delete(request)));
}

async function putExerciseImage(cache, request, response) {
  await cache.put(request, response.clone());
  await trimExerciseImageCache(cache);
}

async function cacheExerciseImageRequest(request) {
  const cache = await caches.open(EXERCISE_MEDIA_CACHE);
  const cachedRequest = await findCachedExerciseImageRequest(cache, request.url);

  if (cachedRequest) {
    const cachedResponse = await cache.match(cachedRequest);
    if (cachedResponse) return touchCachedExerciseImage(cache, cachedRequest, cachedResponse);
  }

  if (!exerciseImageUrls.has(request.url)) {
    try {
      return await fetch(request);
    } catch {
      const url = new URL(request.url);
      const cachedStatic = await caches.match(request, { ignoreVary: true }) || await caches.match(url.pathname, { ignoreVary: true });
      if (cachedStatic) return cachedStatic;
      return new Response('Offline', {
        status: 503,
        statusText: 'Offline',
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  }

  try {
    const response = await fetch(request);
    if (canCacheExerciseImage(response)) await putExerciseImage(cache, request, response);
    return response;
  } catch {
    return new Response('Offline', {
      status: 503,
      statusText: 'Offline',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
}

async function prefetchExerciseImages(urls) {
  const cache = await caches.open(EXERCISE_MEDIA_CACHE);

  for (const url of urls.slice(0, EXERCISE_MEDIA_LIMIT)) {
    const cachedRequest = await findCachedExerciseImageRequest(cache, url);
    if (cachedRequest) {
      const cachedResponse = await cache.match(cachedRequest);
      if (cachedResponse) await touchCachedExerciseImage(cache, cachedRequest, cachedResponse);
      continue;
    }

    try {
      const request = createExerciseImageRequest(url);
      const response = await fetch(request);
      if (canCacheExerciseImage(response)) await putExerciseImage(cache, request, response);
    } catch (err) {
      console.log('Failed to cache exercise image', url, err);
    }
  }

  await trimExerciseImageCache(cache);
}

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
      const cachesToKeep = new Set([CACHE_NAME, EXERCISE_MEDIA_CACHE]);
      return Promise.all(
        cacheNames.filter(name => !cachesToKeep.has(name)).map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type !== 'CACHE_EXERCISE_IMAGES') return;

  const urls = getExerciseImageUrls(event.data.urls);
  urls.forEach(url => exerciseImageUrls.add(url));
  event.waitUntil(prefetchExerciseImages(urls));
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

  const isSensitiveRequest =
    event.request.url.includes('supabase.co') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.includes('ai-chat');
  const isStaticAsset =
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/assets/') || ASSETS_TO_CACHE.includes(url.pathname));

  if (!isHttpRequest || isViteDevServer || isViteDevTraffic) return;

  if (event.request.destination === 'image') {
    event.respondWith(cacheExerciseImageRequest(event.request));
    return;
  }

  if (isSensitiveRequest) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (event.request.mode === 'navigate') {
          return response;
        }

        if (isStaticAsset && response && response.status === 200 && response.type === 'basic') {
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

        if (isStaticAsset) {
          const cachedResponse = await caches.match(event.request, { ignoreVary: true }) || await caches.match(url.pathname, { ignoreVary: true });
          if (cachedResponse) return cachedResponse;
        }

        return new Response('Offline', {
          status: 503,
          statusText: 'Offline',
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      })
  );
});
