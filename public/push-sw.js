// public/push-sw.js
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const title = data.title || "sg-system";
  const options = {
    body: data.body || "",
    data: data.data || {},
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/teacher/portal";
  event.waitUntil(clients.openWindow(url));
});