self.addEventListener("install", (event) => {
 console.log("Service Worker installed");
 self.skipWaiting();
});
self.addEventListener("activate", (event) => {
 console.log("Service Worker activated");
});
self.addEventListener("push", function (event) {
 const data = event.data ? event.data.json() : {};
 const title = data.title || "買い物リマインダー";
 const options = {
   body: data.body || "近くに登録した店舗があります",
   icon: "/icon-192.png",
   badge: "/icon-192.png",
 };
 event.waitUntil(
   self.registration.showNotification(title, options)
 );
});