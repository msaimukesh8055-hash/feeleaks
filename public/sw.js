// public/sw.js
// Service worker: shows FeeLeaks push notifications for followed institutions.

self.addEventListener("push", function handlePush(event) {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || "FeeLeaks", {
      body: data.body || "",
      icon: "/icon",
      badge: "/icon",
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", function handleNotificationClick(event) {
  event.notification.close();
  const url = new URL(event.notification.data.url, self.location.origin).href;
  event.waitUntil(self.clients.openWindow(url));
});
