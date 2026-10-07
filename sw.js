// Service worker App Kontraktor (v1.46) — supaya app tetap bisa dibuka tanpa sinyal.
// Network-first: ambil versi terbaru dari internet; kalau gagal atau > 4 detik, pakai simpanan terakhir.
// Hanya file app sendiri (index.html, huruf, ikon). Panggilan ke Apps Script / CDN tidak disentuh.
// SETIAP RILIS: naikkan CACHE (sama dengan APP_VERSION di index.html).
const CACHE = 'ab-v1.51';
const ASSETS = [
  './', 'index.html',
  'fonts/plus-jakarta-sans-latin-400-normal.woff2', 'fonts/plus-jakarta-sans-latin-500-normal.woff2',
  'fonts/plus-jakarta-sans-latin-600-normal.woff2', 'fonts/plus-jakarta-sans-latin-700-normal.woff2',
  'fonts/plus-jakarta-sans-latin-800-normal.woff2', 'fonts/fraunces-latin-600-normal.woff2', 'fonts/fraunces-latin-700-normal.woff2',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('ab-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const r = e.request;
  if (r.method !== 'GET' || new URL(r.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE);
    const net = fetch(r).then(res => { if (res && res.ok) c.put(r, res.clone()); return res; });
    const first = await Promise.race([net.catch(() => null), new Promise(ok => setTimeout(ok, 4000, null))]);
    if (first) return first;
    const hit = await c.match(r, { ignoreSearch: true }) || (r.mode === 'navigate' ? await c.match('index.html') : null);
    return hit || net;
  })());
});
