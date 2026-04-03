self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || "Namaste Guntur", {
      body: data.body || "Your order is ready!",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || "order",
      renotify: true,
    })
  );
});

self.addEventListener("notificationclick", () => {
  self.clients.openWindow("/customer");
});
