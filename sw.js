/* Organize It — service worker
   - HTML: rede primeiro (atualizações chegam na hora), cache como reserva offline
   - Ícones, manifest, Chart.js e fontes: cache primeiro, atualiza em segundo plano
   Para forçar atualização em todos os aparelhos, mude a VERSION. */
const VERSION = 'organizeit-v1';
const APP_SHELL = ['./', './index.html', './organizeit.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];
const RUNTIME_HOSTS = ['cdn.jsdelivr.net', 'fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  const isRuntime = RUNTIME_HOSTS.includes(url.hostname);
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin && !isRuntime) return;

  if (isHTML) {
    e.respondWith(fetch(req).then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); return res; })
      .catch(() => caches.match(req).then((r) => r || caches.match('./organizeit.html'))));
    return;
  }
  e.respondWith(caches.match(req).then((cached) => {
    const network = fetch(req).then((res) => { if (res && res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return res; }).catch(() => cached);
    return cached || network;
  }));
});
