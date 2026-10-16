/* ============================================================
   Wildev OS · Recordatorios y notificaciones
   Dos capas:
   1. Locales: mientras la app esté instalada y el navegador vivo,
      se programan con temporizadores. No necesitan servidor.
   2. Push reales: llegan aunque la app esté cerrada. Necesitan
      Supabase con la Edge Function configurada.
   ============================================================ */

const Notify = (() => {
  let timers = [];

  /* ---------- recordatorios configurados ---------- */
  const todos = () => Store.get("reminders", null) || DEFAULT_REMINDERS;
  const activos = () => todos().filter(r => r.activo);

  function guardar(lista) {
    Store.set("reminders", lista);
    programarLocales();
  }

  function toggle(id) {
    const lista = structuredClone(todos());
    const r = lista.find(x => x.id === id);
    if (r) { r.activo = !r.activo; guardar(lista); }
  }

  function cambiarHora(id, hora) {
    const lista = structuredClone(todos());
    const r = lista.find(x => x.id === id);
    if (r) { r.hora = hora; guardar(lista); }
  }

  function agregar({ titulo, cuerpo, hora, dias }) {
    guardar([...todos(), { id: uid(), titulo, cuerpo: cuerpo || "", hora, dias: dias || [1, 2, 3, 4, 5, 6, 0], activo: true, propio: true }]);
  }

  function borrar(id) { guardar(todos().filter(r => r.id !== id)); }

  /* ---------- permiso ---------- */
  const permiso = () => ("Notification" in window) ? Notification.permission : "unsupported";

  // Tiene que llamarse desde un click: iOS rechaza el pedido automático.
  async function pedirPermiso() {
    if (!("Notification" in window)) return { ok: false, error: "Este navegador no soporta notificaciones." };
    if (Notification.permission === "granted") return { ok: true };
    if (Notification.permission === "denied") {
      return { ok: false, error: "Las notificaciones están bloqueadas. Activalas desde los ajustes del navegador para este sitio." };
    }
    const r = await Notification.requestPermission();
    if (r !== "granted") return { ok: false, error: "No diste permiso." };
    programarLocales();
    return { ok: true };
  }

  /* ---------- notificaciones locales ---------- */
  function limpiarTimers() { timers.forEach(t => clearTimeout(t)); timers = []; }

  // Programa lo que falta del día. Se reprograma al volver a la app.
  function programarLocales() {
    limpiarTimers();
    if (permiso() !== "granted") return;
    const ahora = new Date();
    const hoyDia = ahora.getDay();

    activos().forEach(r => {
      if (!r.dias.includes(hoyDia)) return;
      const [h, m] = r.hora.split(":").map(Number);
      const cuando = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), h, m, 0);
      const falta = cuando - ahora;
      // Solo lo que todavía no pasó y entra dentro de las próximas 12 horas.
      if (falta <= 0 || falta > 12 * 3600 * 1000) return;
      timers.push(setTimeout(() => mostrar(r), falta));
    });
  }

  // El service worker es el camino preferido (funciona en Android e iOS),
  // pero getRegistration() puede no resolver nunca si el SW no está listo,
  // así que no se espera más de un segundo antes de usar el camino directo.
  async function registroConTimeout(ms = 1000) {
    if (!("serviceWorker" in navigator)) return null;
    try {
      return await Promise.race([
        navigator.serviceWorker.getRegistration(),
        new Promise(res => setTimeout(() => res(null), ms))
      ]);
    } catch { return null; }
  }

  async function mostrar(r) {
    if (permiso() !== "granted") return;
    const body = r.cuerpo || "";
    const reg = await registroConTimeout();
    if (reg?.showNotification) {
      try { await reg.showNotification(r.titulo, opcionesDe(r, body)); return; } catch {}
    }
    try { new Notification(r.titulo, { body, icon: "icons/icon-192.png" }); } catch {}
  }

  const opcionesDe = (r, body) => ({
    body,
    icon: "icons/icon-192.png",
    badge: "icons/icon-192.png",
    tag: "wildev-" + r.id,
    renotify: true,
    data: { url: "./", vista: r.vista || "today" },
    vibrate: [180, 80, 180]
  });

  async function probar() {
    const p = await pedirPermiso();
    if (!p.ok) return p;
    await mostrar({ id: "test", titulo: "Wildev OS", cuerpo: "Las notificaciones están andando. Así te van a llegar los recordatorios.", vista: "today" });
    return { ok: true };
  }

  /* ---------- push real (requiere Supabase) ---------- */

  function urlB64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
  }

  const vapidKey = () => Store.get("vapid-public", null);
  const setVapidKey = k => Store.set("vapid-public", k.trim());

  async function estadoPush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return { soportado: false };
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    return { soportado: true, suscrito: !!sub, tieneClave: !!vapidKey() };
  }

  async function suscribir() {
    const clave = vapidKey();
    if (!clave) return { ok: false, error: "Falta la clave pública VAPID." };
    const st = Store.status();
    if (!st.conectado) return { ok: false, error: "Primero conectá Supabase: los push se envían desde ahí." };

    const p = await pedirPermiso();
    if (!p.ok) return p;

    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(clave)
        });
      }
      const r = await Store.guardarSuscripcion(sub.toJSON());
      if (!r.ok) return r;
      return { ok: true };
    } catch (e) {
      const msg = String(e.message || e);
      if (msg.includes("applicationServerKey")) return { ok: false, error: "La clave VAPID no es válida. Revisá que sea la pública completa." };
      return { ok: false, error: msg };
    }
  }

  async function desuscribir() {
    const reg = await navigator.serviceWorker.getRegistration();
    const sub = await reg?.pushManager.getSubscription();
    if (sub) { await Store.borrarSuscripcion(sub.endpoint); await sub.unsubscribe(); }
    return { ok: true };
  }

  /* ---------- diagnóstico para la pantalla de ajustes ---------- */
  function diagnostico() {
    const esPWA = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    const esIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    return {
      soportado: "Notification" in window,
      permiso: permiso(),
      esPWA, esIOS,
      // En iOS las notificaciones solo existen si la app está en la pantalla de inicio.
      necesitaInstalar: esIOS && !esPWA,
      https: location.protocol === "https:" || location.hostname === "localhost"
    };
  }

  function init() {
    programarLocales();
    document.addEventListener("visibilitychange", () => { if (!document.hidden) programarLocales(); });
  }

  return {
    init, todos, activos, guardar, toggle, cambiarHora, agregar, borrar,
    permiso, pedirPermiso, probar, programarLocales,
    estadoPush, suscribir, desuscribir, vapidKey, setVapidKey, diagnostico
  };
})();
