// Rede primeiro (conteúdo sempre atual); se estiver offline, usa o cache.
const VERSAO = "guia-202611261529";
const BASE = ["index.html", "style.css", "manifest.webmanifest", "dados/data.js", "dados/data-extra.js", "dados/data-mecanismos.js", "dados/revisoes.js", "dados/aprovacoes.js", "js/core.js", "js/i18n.js", "js/app.js", "js/ads.js", "icons/icon-192.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSAO).then(c => Promise.all(BASE.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const alvo = new URL(e.notification.data?.url || "meus-protocolos.html", self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(lista => {
    const aberta = lista.find(c => c.url.startsWith(alvo.split("#")[0]));
    return aberta ? aberta.focus() : self.clients.openWindow(alvo);
  }));
});
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" || new URL(req.url).origin !== location.origin) return;
  if (req.mode !== "navigate") {
    e.respondWith(caches.open(VERSAO).then(async c => {
      const caminho = new URL(req.url).pathname;
      if (/\/(live-data\.json|historico\.js|revisao-pendente\.js|aprovacoes\.js)$/.test(caminho)) {
        try {
          const res = await fetch(req, { cache: "no-cache" });
          if (res.ok) await c.put(req, res.clone());
          return res;
        } catch (erro) {
          const emCache = await c.match(req);
          if (emCache) return emCache;
          throw erro;
        }
      }
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
