
const CACHE_NAME = 'ventas-mcbanda-cache-v19'; // Bump version
const APP_SHELL_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon.svg',
  '../src/index.tsx',
  '../src/App.tsx',
  '../src/types.ts',
  './metadata.json',
  '../src/hooks/useLocalStorage.ts',
  '../src/services/geminiService.ts',
  '../src/services/commissionService.ts',
  '../src/components/Dashboard.tsx',
  '../src/components/Products.tsx',
  '../src/components/Sales.tsx',
  '../src/components/Insights.tsx',
  '../src/components/Settings.tsx',
  '../src/components/Informes.tsx',
  '../src/components/MyGoals.tsx',
  '../src/components/Commissions.tsx',
  '../src/components/MyCommissions.tsx',
  '../src/components/CommissionCalculator.tsx',
  '../src/components/Intro.tsx',
  '../src/components/Modal.tsx',
  '../src/components/Sidebar.tsx',
  '../src/components/icons.tsx',
  '../src/components/FormInputs.tsx',
  '../src/components/QrCodeModal.tsx',
  '../src/components/PwaInstall.tsx',
  '../src/components/History.tsx',
  '../src/context/AppContext.tsx',
  // External Dependencies for Offline Functionality
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'https://aistudiocdn.com/react@^19.2.0',
  'https://aistudiocdn.com/react-dom@^19.2.0/',
  'https://aistudiocdn.com/react-router-dom@^6.25.1',
  'https://aistudiocdn.com/@google/genai@^1.26.0',
  'https://aistudiocdn.com/recharts@^3.3.0',
  'https://aistudiocdn.com/html2canvas@^1.4.1',
  'https://aistudiocdn.com/qrcode@^1.5.3',
  'https://aistudiocdn.com/jszip@^3.10.1'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching app shell and dependencies');
        // Use individual requests to avoid all-or-nothing failure of addAll
        const promises = APP_SHELL_URLS.map((url) => {
          const request = new Request(url, {cache: 'reload'});
          return fetch(request) 
            .then(response => {
              if (response.ok) {
                return cache.put(url, response);
              }
              console.warn(`Failed to cache ${url}: Response not OK`);
              return Promise.resolve();
            })
            .catch(err => console.warn(`Failed to cache ${url}:`, err));
        });
        return Promise.all(promises);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
            // Do not cache responses from the network on fetch to ensure freshness,
            // rely on the install step for caching the app shell.
            return networkResponse;
        });

        // Return from cache if found, otherwise fetch from network.
        return cachedResponse || fetchPromise;
      })
  );
});