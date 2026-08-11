/* NX Gest — service worker mínimo (PLAN 5.4 / fatia de instalação PWA).
 * Torna o site instalável como PWA no Android (o atalho passa a usar o manifest
 * em vez do favicon). Estratégia leve: network-first p/ navegação (sempre atual),
 * cache-first p/ assets estáticos e ícones. Sem cache de API (dados sensíveis).
 *
 * IMPORTANTE: bump do CACHE a cada deploy de assets estáticos (invalida o cache
 * antigo do browser). Registro ocorre só em produção (main.tsx: import.meta.env.PROD). */
const CACHE = "nxgest-v2"

self.addEventListener("install", () => {
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  )
})

self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  const isNavigation = request.mode === "navigate"
  const isStatic = /\.(js|css|png|svg|ico|woff2?|webmanifest)$/.test(url.pathname)

  // Navegação: network-first (app sempre atual; offline cai no cache).
  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone()
          caches.open(CACHE).then((c) => c.put(request, copy))
          return res
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/index.html"))),
    )
    return
  }

  // Assets estáticos/ícones: cache-first.
  if (isStatic) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone()
            caches.open(CACHE).then((c) => c.put(request, copy))
            return res
          }),
      ),
    )
  }
})
