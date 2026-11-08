/* Uni Duni TV: guarda o app no celular para abrir rápido.
   Ao mudar qualquer arquivo do app, aumente a versão abaixo. */
const VERSION = "udtv-1.5.3";
const SHELL = [
  "./", "index.html", "css/style.css", "manifest.webmanifest",
  "js/data.js", "js/store.js", "js/tmdb.js", "js/engine.js", "js/app.js",
  "fonts/outfit.woff2", "icons/logo-tv.webp", "icons/icon-192.png", "icons/icon-512.png"
];
const IMG_CACHE = "udtv-img";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== IMG_CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET") return;
  // pôsteres: usa a cópia guardada e atualiza por trás
  if (url.hostname === "image.tmdb.org") {
    e.respondWith(caches.open(IMG_CACHE).then(async c => {
      const hit = await c.match(e.request);
      const net = fetch(e.request).then(r => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  // dados do TMDB: sempre da internet
  if (url.hostname.endsWith("themoviedb.org")) return;
  // arquivos do app: internet primeiro (pega atualização), cópia guardada se estiver sem sinal
  if (url.origin === location.origin) {
    e.respondWith(fetch(e.request).then(r => {
      const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
  }
});
