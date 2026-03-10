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

self.addEventListener("install", event => {
 console.log("Service Worker installed");
 self.skipWaiting();
});
self.addEventListener("activate", event => {
 console.log("Service Worker active");
});
self.addEventListener("push", event => {
 const data = event.data?.json() || {
   title: "BuyMind",
   body: "近くに登録した店舗があります"
 };
 self.registration.showNotification(data.title, {
   body: data.body,
   icon: "/icon-192.png",
   badge: "/icon-192.png",
   vibrate: [200,100,200]
 });
});