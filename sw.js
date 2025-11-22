
const CACHE_NAME = 'ventas-mcbanda-cache-v23-gh-pages'; // Bump version
const APP_SHELL_URLS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon.svg',
  './metadata.json',
  './src/index.jsx',
  './src/App.jsx',
  './src/types.js',
  './src/hooks/useLocalStorage.js',
  './src/services/geminiService.js',
  './src/services/commissionService.js',
  './src/components/Dashboard.jsx',
  './src/components/Team.jsx',
  './src/components/Sales.jsx',
  './src/components/Insights.jsx',
  './src/components/Settings.jsx',
  './src/components/Informes.jsx',
  './src/components/MyGoals.jsx',
  './src/components/Commissions.jsx',
  './src/components/MyCommissions.jsx',
  './src/components/CommissionCalculator.jsx',
  './src/components/Intro.jsx',
  './src/components/Modal.jsx',
  './src/components/Sidebar.jsx',
  './src/components/icons.jsx',
  './src/components/FormInputs.jsx',
  './src/components/QrCodeModal.jsx',
  './src/components/PwaInstall.jsx',
  './src/components/History.jsx',
  './src/context/AppContext.jsx',
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
            return networkResponse;
        });
        return cachedResponse || fetchPromise;
      })
  );
});