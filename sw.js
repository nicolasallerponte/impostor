// App: red primero (con límite de 2,5 s) para recibir siempre la última versión; si no hay red, caché.
// Firebase SDK y fuente: caché primero (sus URLs llevan versión y no cambian).
const V = "impostor-v8";
const ASSETS = [
  "./", "./index.html", "./styles.css?v=8", "./app.js?v=8", "./players.js?v=8", "./config.js?v=8",
  "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png",
];
const CDN = ["www.gstatic.com", "fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", (e) => {
  // cache: "reload" evita que la instalación copie archivos viejos de la caché HTTP del navegador.
  e.waitUntil(caches.open(V).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: "reload" })))));
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
    // "no-cache": revalida siempre con el servidor en vez de fiarse de la caché HTTP (GitHub Pages cachea 10 min).
    const net = fetch(req.url, { cache: "no-cache", credentials: "same-origin" }).then((res) => { put(req, res.clone()); return res; });
    net.catch(() => {});
    const timeout = new Promise((r) => setTimeout(r, 2500));
    try {
      const res = await Promise.race([net, timeout]);
      if (res) return res;
      const hit = await caches.match(req) || await caches.match(req, { ignoreSearch: true });
      return hit || await net;
    } catch {
      const hit = await caches.match(req, { ignoreSearch: true });
      return hit || Response.error();
    }
  })());
});
