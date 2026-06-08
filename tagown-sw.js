/**
 * Tagown Service Worker — tagown-sw.js
 * Firebase Hosting root mein upload karna hai
 * Web Push notifications receive karta hai background mein
 */

const CACHE_NAME = "tagown-v1";

// ============================================================
// 📥 INSTALL — Service Worker install hone pe
// ============================================================
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

// ============================================================
// 🔄 ACTIVATE — Purana cache saaf karo
// ============================================================
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ============================================================
// 🔔 PUSH — Notification receive hone pe
// ============================================================
self.addEventListener("push", (event) => {
  let data = {
    title  : "🚨 Tagown Alert",
    body   : "Someone scanned your vehicle QR code.",
    icon   : "https://tagown.online/favicon2.png",
    badge  : "https://tagown.online/favicon2.png",
    tag    : "tagown-alert",
    vibrate: [200, 100, 200, 100, 200],
    data   : { url: "https://tagown.online" }
  };

  // Agar Worker ne proper data bheja hai
  if (event.data) {
    try {
      const received = event.data.json();
      data = { ...data, ...received };
    } catch(_) {
      try {
        data.body = event.data.text();
      } catch(__) {}
    }
  }

  const options = {
    body        : data.body,
    icon        : data.icon   || "https://tagown.online/favicon2.png",
    badge       : data.badge  || "https://tagown.online/favicon2.png",
    tag         : data.tag    || "tagown-alert",
    vibrate     : data.vibrate || [200, 100, 200],
    renotify    : true,
    requireInteraction: true, // Notification tab tak rahe jab tak user dismiss kare
    data        : data.data   || { url: "https://tagown.online" },
    actions     : [
      { action: "open", title: "Open Tagown" },
      { action: "dismiss", title: "Dismiss" }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// ============================================================
// 👆 NOTIFICATION CLICK — User ne notification tap kiya
// ============================================================
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const urlToOpen = event.notification.data?.url || "https://tagown.online";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Agar already tab khuli hai to focus karo
      for (const client of clientList) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      // Nahi to nayi tab kholo
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// ============================================================
// ❌ PUSH SUBSCRIPTION CHANGE — Agar subscription expire ho
// ============================================================
self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      // Note: VAPID key yahan nahi chahiye kyunki ye auto-renew hai
    }).catch(() => {})
  );
});
