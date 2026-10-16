/* ============================================================
   Wildev OS · Núcleo
   Navegación, utilidades de fecha y arranque. Cada módulo se
   registra solo y expone render() y setup().
   ============================================================ */

const $ = id => document.getElementById(id);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* ---------- Fechas (siempre en hora local) ---------- */
const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parseKey = k => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
const today = () => dateKey();
const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return dateKey(d); };
const shortDate = k => new Intl.DateTimeFormat("es-AR", { weekday: "short", day: "numeric", month: "short" }).format(parseKey(k));
const longDate = k => new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(parseKey(k));
const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
const monthName = mk => {
  const [y, m] = mk.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(new Date(y, m - 1, 1));
};
const weekStart = (d = new Date()) => {
  const g = d.getDay();
  return dateKey(new Date(d.getFullYear(), d.getMonth(), d.getDate() + (g === 0 ? -6 : 1 - g)));
};
const last7 = () => Array.from({ length: 7 }, (_, i) => addDays(today(), -6 + i));

/* ---------- Formato ---------- */
const esc = (v = "") => String(v).replace(/[&<>'"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c]));
const fmt1 = v => (Math.round(v * 10) / 10).toLocaleString("es-AR");
const money = v => "$" + Math.round(v || 0).toLocaleString("es-AR");
const uid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now() + Math.random().toString(16).slice(2));
const hhmm = secs => `${String(Math.floor(Math.max(0, secs) / 60)).padStart(2, "0")}:${String(Math.max(0, secs) % 60).padStart(2, "0")}`;
const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

/* ---------- Avisos ---------- */
let toastTimer = null;
function toast(msg, tipo = "ok") {
  const el = $("toast");
  if (!el) return;
  el.textContent = msg;
  el.className = `toast ${tipo} visible`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("visible"), 3200);
}

/* ---------- Registro de módulos ---------- */
const Modules = {};
let currentView = "today";

function registerModule(mod) { Modules[mod.id] = mod; }

function renderCurrent() {
  const mod = Modules[currentView];
  if (!mod) return;
  // El host se reemplaza por un nodo limpio: así los listeners que cada
  // módulo engancha en su setup() no se acumulan entre redibujados.
  const viejo = $("view-host");
  const host = viejo.cloneNode(false);
  viejo.replaceWith(host);
  // Si un módulo falla, la pantalla nunca queda en blanco: se muestra
  // qué pasó y cómo salir del paso.
  try {
    host.innerHTML = mod.render();
    mod.setup?.();
  } catch (e) {
    console.error("Wildev OS · falló el módulo", currentView, e);
    host.innerHTML = `
      <section class="card accent-pink">
        <div class="card-head"><h2>Algo falló en esta sección</h2></div>
        <p class="muted sub">Podés seguir usando el resto de la app desde la barra de abajo.</p>
        <p class="dataset-note">${esc(e.message || String(e))}</p>
        <div class="btn-row">
          <button class="btn primary" onclick="location.reload()">Recargar</button>
          <button class="btn ghost" data-goto="settings">Ir a Ajustes</button>
        </div>
      </section>`;
  }
  window.scrollTo({ top: 0 });
}

function navigate(id) {
  if (!Modules[id]) return;
  currentView = id;
  $$(".bottom-nav button").forEach(b => b.classList.toggle("active", b.dataset.nav === id));
  renderCurrent();
  try { localStorage.setItem("wildev-os:last-view", id); } catch {}
}

// Un módulo pide redibujarse (p. ej. después de guardar algo).
function refresh(id) { if (!id || id === currentView) renderCurrent(); }

/* ---------- Encabezado ---------- */
function renderHeader() {
  const st = Store.status();
  const chip = $("sync-chip");
  if (!chip) return;
  let txt, cls;
  if (!st.configurado) { txt = "Solo en este equipo"; cls = "local"; }
  else if (!st.online) { txt = "Sin conexión"; cls = "offline"; }
  else if (st.sincronizando) { txt = "Sincronizando…"; cls = "syncing"; }
  else if (!st.conectado) { txt = "Sin conectar"; cls = "offline"; }
  else if (st.pendientes) { txt = `${st.pendientes} por subir`; cls = "syncing"; }
  else { txt = "Guardado en la nube"; cls = "ok"; }
  chip.textContent = txt;
  chip.className = `sync-chip ${cls}`;
  $("header-date").textContent = longDate(today());
}

/* ---------- Saludo según la hora ---------- */
function saludo() {
  const h = new Date().getHours();
  if (h < 6) return "Todavía es de madrugada";
  if (h < 12) return "Buen día";
  if (h < 20) return "Buenas tardes";
  return "Buenas noches";
}

/* ---------- Arranque ---------- */
async function initApp() {
  await Store.init();

  $$(".bottom-nav button").forEach(b => b.addEventListener("click", () => navigate(b.dataset.nav)));
  document.body.addEventListener("click", e => {
    const nav = e.target.closest("[data-goto]");
    if (nav) { navigate(nav.dataset.goto); return; }
  });

  // Una sincronización baja muchas claves de golpe: se redibuja una sola
  // vez al final en lugar de una por clave.
  let redibujo = null;
  Store.subscribe((key) => {
    if (key === "__status") { renderHeader(); return; }
    clearTimeout(redibujo);
    redibujo = setTimeout(() => renderCurrent(), 60);
  });

  // Si cambió el día mientras la app estaba abierta, redibuja.
  let diaActual = today();
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    if (today() !== diaActual) { diaActual = today(); }
    renderHeader();
    renderCurrent();
  });

  // Si vino desde una notificación, abre la sección que corresponde.
  const pedida = new URLSearchParams(location.search).get("vista");
  let last = "today";
  try { last = localStorage.getItem("wildev-os:last-view") || "today"; } catch {}
  // Ajustes y recordatorios son pantallas de paso: la app no arranca ahí.
  if (last === "settings" || last === "reminders") last = "today";
  navigate(Modules[pedida] ? pedida : (Modules[last] ? last : "today"));
  renderHeader();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
    navigator.serviceWorker.addEventListener("message", e => {
      if (e.data?.tipo === "abrir-vista" && Modules[e.data.vista]) navigate(e.data.vista);
    });
  }
  Notify.init();
}
