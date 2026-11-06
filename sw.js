/* Agent Portal service worker — saves the app shell on the phone so the
   app opens fast and works offline. Version the cache name when files change. */
const CACHE = "agent-portal-v1";
const SHELL = [
  "index.html",
  "board.html",
  "my-leads.html",
  "handover.html",
  "about.html",
  "install.html",
  "styles.css",
  "app.js",
  "data.js",
  "manifest.json",
  "icon-192.png",
  "icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(hit => hit || fetch(event.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(event.request, copy));
      return res;
    }).catch(() => caches.match("index.html")))
  );
});
