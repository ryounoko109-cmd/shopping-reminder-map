self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.open("shopping-map-v1").then(cache =>
      cache.match(event.request).then(res => {
        return res || fetch(event.request).then(networkRes => {
          if (event.request.method === "GET") {
            cache.put(event.request, networkRes.clone());
          }
          return networkRes;
        });
      })
    )
  );
});
