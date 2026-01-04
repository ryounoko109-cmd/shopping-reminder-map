self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", event => {
  const data = event.data?.json() || {};

  event.waitUntil(
    self.registration.showNotification(
      data.title || "🛒 買い物忘れ防止",
      {
        body: data.body || "近くに店舗があります",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
      }
    )
  );
});
