// App: red primero (con límite de 2,5 s) para recibir siempre la última versión; si no hay red, caché.
// Firebase SDK y Google Fonts: caché primero (sus URLs llevan versión y no cambian).
const V = "impostor-v2";
const ASSETS = [
  "./", "./index.html", "./styles.css", "./app.js", "./players.js", "./config.js",
  "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png",
];
const CDN = ["www.gstatic.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(V).then((c) => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))));
  self.clients.claim();
});

const put = (req, res) => { if (res && (res.ok || res.type === "opaque")) caches.open(V).then((c) => c.put(req, res)); };

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (CDN.includes(url.hostname)) {
    // No tocar las llamadas a Firebase que no sean el SDK.
    if (url.hostname === "www.gstatic.com" && !url.pathname.startsWith("/firebasejs/")) return;
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => { put(req, res.clone()); return res; })));
    return;
  }
  if (url.origin !== location.origin) return;

  e.respondWith((async () => {
    const net = fetch(req).then((res) => { put(req, res.clone()); return res; });
    net.catch(() => {});
    const timeout = new Promise((r) => setTimeout(r, 2500));
    try {
      const res = await Promise.race([net, timeout]);
      if (res) return res;
      const hit = await caches.match(req, { ignoreSearch: true });
      return hit || await net;
    } catch {
      const hit = await caches.match(req, { ignoreSearch: true });
      return hit || Response.error();
    }
  })());
});
