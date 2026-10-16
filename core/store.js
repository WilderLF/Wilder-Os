/* ============================================================
   Wildev OS · Capa de datos
   Funciona siempre contra el navegador (rápido, sin conexión) y,
   si Supabase está configurado, sincroniza en segundo plano.
   Nada se bloquea esperando a la nube: si no hay internet, la app
   anda igual y lo pendiente se sube cuando vuelve la señal.

   Modelo: documentos JSON por clave.
     habits, routines, tasks, focus, clients, content,
     money, goals, journal, reading, body, settings
   ============================================================ */

const STORE_PREFIX = "wildev-os:";
const CONFIG_KEY = "wildev-os:supabase-config";
const QUEUE_KEY = "wildev-os:sync-queue";

const Store = (() => {
  let supabase = null;           // cliente, si está configurado
  let config = null;             // { url, anonKey, email, password }
  let userId = null;
  let online = navigator.onLine;
  let syncing = false;
  const listeners = new Set();
  const cache = new Map();

  /* ---------- utilidades locales ---------- */

  const localGet = (key, fallback) => {
    try {
      const raw = localStorage.getItem(STORE_PREFIX + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  };
  const localSet = (key, value) => {
    try { localStorage.setItem(STORE_PREFIX + key, JSON.stringify(value)); return true; }
    catch { return false; }  // sin espacio o en modo privado
  };

  const queue = {
    all: () => localGet("__queue", []),
    add: key => {
      const q = new Set(queue.all());
      q.add(key);
      localSet("__queue", [...q]);
    },
    clear: key => localSet("__queue", queue.all().filter(k => k !== key)),
    reset: () => localSet("__queue", [])
  };

  const notify = (key, value) => listeners.forEach(fn => { try { fn(key, value); } catch {} });

  /* ---------- API pública de lectura y escritura ---------- */

  function get(key, fallback = null) {
    if (cache.has(key)) return cache.get(key);
    const doc = localGet(key, null);
    const value = doc && typeof doc === "object" && "value" in doc ? doc.value : (doc ?? fallback);
    cache.set(key, value);
    return value;
  }

  function set(key, value) {
    const doc = { value, updatedAt: new Date().toISOString() };
    cache.set(key, value);
    const ok = localSet(key, doc);
    notify(key, value);
    if (supabase && userId) push(key, doc);
    else if (config) queue.add(key);   // configurado pero sin sesión todavía
    return ok;
  }

  // Modifica una parte del documento sin pisar el resto.
  function update(key, fn, fallback = {}) {
    const actual = get(key, fallback);
    const nuevo = fn(structuredClone(actual ?? fallback));
    set(key, nuevo);
    return nuevo;
  }

  const subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };

  /* ---------- Supabase ---------- */

  function getConfig() {
    try { return JSON.parse(localStorage.getItem(CONFIG_KEY)); } catch { return null; }
  }
  function saveConfig(c) {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(c));
    config = c;
  }
  function clearConfig() {
    localStorage.removeItem(CONFIG_KEY);
    config = null; supabase = null; userId = null;
    notify("__status", status());
  }

  async function loadSdk() {
    if (window.supabase?.createClient) return window.supabase;
    await new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.min.js";
      s.onload = res; s.onerror = () => rej(new Error("No se pudo cargar el SDK de Supabase"));
      document.head.appendChild(s);
    });
    return window.supabase;
  }

  // Conecta y sincroniza. Devuelve { ok, error }.
  async function connect(c = config) {
    if (!c?.url || !c?.anonKey || !c?.email || !c?.password) {
      return { ok: false, error: "Faltan datos de conexión." };
    }
    try {
      const sdk = await loadSdk();
      const client = sdk.createClient(c.url.trim().replace(/\/$/, ""), c.anonKey.trim(), {
        auth: { persistSession: true, storageKey: "wildev-os-auth" }
      });

      // Primero intenta entrar; si la cuenta no existe, la crea.
      let { data, error } = await client.auth.signInWithPassword({ email: c.email.trim(), password: c.password });
      if (error) {
        const alta = await client.auth.signUp({ email: c.email.trim(), password: c.password });
        if (alta.error) return { ok: false, error: traducirError(alta.error.message) };
        if (!alta.data.session) {
          return { ok: false, error: "Cuenta creada. Confirmá el mail que te llegó de Supabase y volvé a conectar. (O desactivá 'Confirm email' en Supabase → Authentication → Providers.)" };
        }
        data = alta.data;
      }

      supabase = client;
      userId = data.user.id;
      saveConfig(c);
      notify("__status", status());
      await sync();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message || "No se pudo conectar." };
    }
  }

  function traducirError(msg = "") {
    const m = msg.toLowerCase();
    if (m.includes("invalid login")) return "Email o contraseña incorrectos.";
    if (m.includes("password") && m.includes("6")) return "La contraseña necesita al menos 6 caracteres.";
    if (m.includes("already registered")) return "Ese email ya existe: revisá la contraseña.";
    if (m.includes("failed to fetch")) return "No se pudo contactar a Supabase. Revisá la URL del proyecto.";
    if (m.includes("invalid api key")) return "La clave anon no es válida.";
    return msg;
  }

  async function push(key, doc) {
    if (!supabase || !userId) { queue.add(key); return; }
    try {
      const { error } = await supabase.from("app_data").upsert({
        user_id: userId, key, value: doc.value, updated_at: doc.updatedAt
      }, { onConflict: "user_id,key" });
      if (error) throw error;
      queue.clear(key);
    } catch {
      queue.add(key);   // se reintenta en la próxima sincronización
    }
  }

  /* Sincronización: gana la versión más nueva de cada clave.
     Es deliberadamente simple — una sola persona usa esta app,
     así que no hay conflictos reales que resolver. */
  async function sync() {
    if (!supabase || !userId || syncing || !online) return { ok: false };
    syncing = true;
    notify("__status", status());
    try {
      const { data: remotos, error } = await supabase
        .from("app_data").select("key, value, updated_at").eq("user_id", userId);
      if (error) throw error;

      const remotoPorClave = new Map((remotos || []).map(r => [r.key, r]));
      const clavesLocales = Object.keys(localStorage)
        .filter(k => k.startsWith(STORE_PREFIX) && !k.endsWith("__queue"))
        .map(k => k.slice(STORE_PREFIX.length));

      // Lo remoto más nuevo baja
      for (const r of remotoPorClave.values()) {
        const local = localGet(r.key, null);
        const localFecha = local?.updatedAt || "";
        if (!local || r.updated_at > localFecha) {
          localSet(r.key, { value: r.value, updatedAt: r.updated_at });
          cache.set(r.key, r.value);
          notify(r.key, r.value);
        }
      }
      // Lo local más nuevo (o lo que nunca subió) sube
      for (const key of clavesLocales) {
        const local = localGet(key, null);
        if (!local?.updatedAt) continue;
        const r = remotoPorClave.get(key);
        if (!r || local.updatedAt > r.updated_at) await push(key, local);
      }
      // Reintenta lo que había quedado pendiente
      for (const key of queue.all()) {
        const local = localGet(key, null);
        if (local) await push(key, local);
      }

      localSet("__lastSync", new Date().toISOString());
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    } finally {
      syncing = false;
      notify("__status", status());
    }
  }

  function status() {
    return {
      configurado: !!config,
      conectado: !!(supabase && userId),
      sincronizando: syncing,
      online,
      pendientes: queue.all().length,
      ultimaSync: localGet("__lastSync", null),
      email: config?.email || null
    };
  }

  /* ---------- Suscripciones para notificaciones push ---------- */

  async function guardarSuscripcion(sub) {
    if (!supabase || !userId) return { ok: false, error: "Conectá Supabase primero." };
    try {
      const { error } = await supabase.from("push_subscriptions").upsert({
        user_id: userId,
        endpoint: sub.endpoint,
        p256dh: sub.keys.p256dh,
        auth: sub.keys.auth,
        tz: Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Argentina/Buenos_Aires",
        updated_at: new Date().toISOString()
      }, { onConflict: "endpoint" });
      if (error) throw error;
      return { ok: true };
    } catch (e) {
      const m = String(e.message || e);
      if (m.includes("push_subscriptions") && m.includes("does not exist")) {
        return { ok: false, error: "Falta la tabla push_subscriptions: volvé a correr el archivo schema.sql en Supabase." };
      }
      return { ok: false, error: m };
    }
  }

  async function borrarSuscripcion(endpoint) {
    if (!supabase || !userId) return { ok: false };
    try { await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint); return { ok: true }; }
    catch { return { ok: false }; }
  }

  /* ---------- Respaldo manual ---------- */

  function exportAll() {
    const out = { app: "Wildev OS", exportado: new Date().toISOString(), datos: {} };
    Object.keys(localStorage)
      .filter(k => k.startsWith(STORE_PREFIX) && !k.includes("__queue") && k !== CONFIG_KEY)
      .forEach(k => { out.datos[k.slice(STORE_PREFIX.length)] = localGet(k.slice(STORE_PREFIX.length), null); });
    return out;
  }

  async function importAll(json) {
    if (!json?.datos) throw new Error("El archivo no tiene el formato esperado.");
    Object.entries(json.datos).forEach(([key, doc]) => {
      if (!doc) return;
      localSet(key, doc);
      cache.delete(key);
      notify(key, doc.value ?? doc);
    });
    if (supabase) await sync();
  }

  /* ---------- Arranque ---------- */

  async function init() {
    config = getConfig();
    window.addEventListener("online", () => { online = true; notify("__status", status()); sync(); });
    window.addEventListener("offline", () => { online = false; notify("__status", status()); });
    if (config) {
      const r = await connect(config);
      if (!r.ok) console.warn("Wildev OS · Supabase:", r.error);
    }
    // Sincroniza al volver a la app (cambió de pestaña, bloqueó el teléfono)
    document.addEventListener("visibilitychange", () => { if (!document.hidden) sync(); });
    setInterval(() => sync(), 5 * 60 * 1000);
  }

  return {
    init, get, set, update, subscribe, connect, sync, status, getConfig, clearConfig,
    exportAll, importAll, guardarSuscripcion, borrarSuscripcion
  };
})();
