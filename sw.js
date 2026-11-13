// Rede primeiro (conteúdo sempre atual); se estiver offline, usa o cache.
const VERSAO = "guia-202611121535";
const BASE = ["index.html", "meus-protocolos.html", "style.css", "manifest.webmanifest", "data.js", "data-extra.js", "data-mecanismos.js", "revisoes.js", "aprovacoes.js", "revisao-pendente.js", "core.js", "i18n.js", "app.js", "ads.js", "icons/icon-192.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSAO).then(c => Promise.all(BASE.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode !== "navigate") {
    e.respondWith(caches.open(VERSAO).then(async c => {
      const emCache = await c.match(req);
      if (emCache) return emCache;
      const res = await fetch(req);
      if (res.ok) await c.put(req, res.clone());
      return res;
    }).catch(() => caches.match(req).then(r => r || caches.match("index.html"))));
    return;
  }
  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) { const copia = res.clone(); caches.open(VERSAO).then(c => c.put(req, copia)); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: req.mode === "navigate" }).then(r => r || caches.match("index.html")))
  );
});
