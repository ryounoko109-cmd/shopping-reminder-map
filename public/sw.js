self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(self.clients.claim());
});

self.addEventListener("push", e => {
  const data = e.data?.json() || {};
  self.registration.showNotification(
    data.title || "買い物忘れ防止",
    {
      body: data.body || "近くに店舗があります",
      icon: "/icon-192.png",
    }
  );
});
