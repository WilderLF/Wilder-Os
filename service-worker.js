const CACHE = "wildev-os-v3";
const ASSETS = [
  "./", "./index.html", "./styles.css", "./manifest.json",
  "./core/store.js", "./core/app.js", "./core/notify.js",
  "./data/life.js", "./data/routines.js", "./data/foods.js",
  "./data/abs-challenge.js", "./data/exercise-dataset.js",
  "./modules/today.js", "./modules/focus.js", "./modules/work.js",
  "./modules/money.js", "./modules/body.js", "./modules/mind.js",
  "./modules/reminders.js", "./modules/settings.js",
  "./assets/wildev-mark.svg", "./icons/icon-192.png", "./icons/icon-512.png"
];

self.addEventListener("install", e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
});
self.addEventListener("activate", e => {
  e.waitUntil(Promise.all([
    self.clients.claim(),
    caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
  ]));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  // Supabase siempre va a la red: nunca se cachea.
  if (url.hostname.includes("supabase")) return;
  // SDK y fuentes: red primero con copia de respaldo.
  if (url.hostname.includes("jsdelivr") || url.hostname.includes("fonts.")) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(e.request);
      try { const r = await fetch(e.request); if (r.ok) c.put(e.request, r.clone()); return r; }
      catch { return hit || Response.error(); }
    }));
    return;
  }
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    const copy = r.clone();
    caches.open(CACHE).then(c => c.put(e.request, copy));
    return r;
  }).catch(() => caches.match("./index.html"))));
});

/* ---------- Notificaciones push ---------- */
self.addEventListener("push", event => {
  let data = { title: "Wildev OS", body: "", vista: "today" };
  try { if (event.data) data = { ...data, ...event.data.json() }; }
  catch { if (event.data) data.body = event.data.text(); }

  // iOS cancela la suscripción si un push no muestra nada, así que
  // siempre se muestra algo.
  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: "./icons/icon-192.png",
    badge: "./icons/icon-192.png",
    tag: data.tag || "wildev",
    renotify: true,
    vibrate: [180, 80, 180],
    data: { vista: data.vista || "today" }
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const vista = event.notification.data?.vista || "today";
  event.waitUntil((async () => {
    const clientes = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of clientes) {
      if (c.url.includes(self.registration.scope)) {
        await c.focus();
        c.postMessage({ tipo: "abrir-vista", vista });
        return;
      }
    }
    await self.clients.openWindow("./?vista=" + vista);
  })());
});
