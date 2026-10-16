/* ============================================================
   AJUSTES · conexión a Supabase, respaldo y datos
   ============================================================ */

const Settings = {
  id: "settings",

  render() {
    const st = Store.status();
    const cfg = Store.getConfig() || {};

    return `
      <div class="hero compact">
        <p class="eyebrow">Ajustes</p>
        <h1>Tus datos</h1>
        <p class="muted">${st.conectado
          ? "Todo lo que cargás se guarda en tu base de datos y aparece en cualquier dispositivo."
          : "Ahora mismo tus datos viven solo en este navegador."}</p>
      </div>

      <section class="card ${st.conectado ? "accent-green" : "accent-gold"}">
        <div class="card-head">
          <h2>${st.conectado ? "✅ Conectado" : "☁️ Guardar en la nube"}</h2>
          <span class="sync-chip ${st.conectado ? "ok" : "local"}">${st.conectado ? esc(st.email || "") : "Sin conectar"}</span>
        </div>

        ${st.conectado ? `
          <p class="muted sub">${st.ultimaSync ? `Última sincronización: ${new Date(st.ultimaSync).toLocaleString("es-AR")}` : "Todavía sin sincronizar"}${st.pendientes ? ` · ${st.pendientes} cambios por subir` : ""}</p>
          <div class="btn-row">
            <button id="sync-now" class="btn primary">Sincronizar ahora</button>
            <button id="disconnect" class="btn ghost">Desconectar</button>
          </div>
        ` : `
          <details class="guide" open>
            <summary><strong>Cómo conectarlo (10 minutos, una sola vez)</strong></summary>
            <ol class="steps">
              <li>Entrá a <strong>supabase.com</strong> y creá una cuenta gratis.</li>
              <li>Creá un proyecto nuevo. Elegí la región más cercana y guardá la contraseña que te pide.</li>
              <li>En el menú lateral entrá a <strong>SQL Editor</strong> → <strong>New query</strong>, pegá todo el contenido del archivo <code>supabase/schema.sql</code> que viene con la app y tocá <strong>Run</strong>.</li>
              <li>Tocá el botón verde <strong>Connect</strong> de arriba de todo: ahí aparecen juntas la <strong>URL</strong> y la <strong>clave</strong>, listas para copiar. (También están por separado en <strong>Settings → API Keys</strong> y <strong>Settings → Data API</strong>.)</li>
              <li>Pegalas acá abajo, poné un email y una contraseña (los inventás vos, son para entrar a tu app) y tocá Conectar.</li>
            </ol>
            <p class="dataset-note">Si te pide confirmar el mail: confirmalo y volvé a tocar Conectar. Para no tener que hacerlo cada vez, en <strong>Authentication → Sign In / Providers → Email</strong> podés desactivar <em>Confirm email</em>, y en <strong>Authentication → URL Configuration</strong> poné esta misma dirección como <em>Site URL</em> para que el mail no te mande a localhost.</p>
            <p class="dataset-note">La clave <em>publishable</em> (o <em>anon</em>) está pensada para ir en el navegador: no es un secreto. Lo que protege tus datos es la seguridad por filas que crea el archivo SQL. La que nunca va acá es la que diga <strong>service_role</strong> o <strong>secret</strong>.</p>
          </details>

          <label class="label" for="sb-url">Project URL</label>
          <input id="sb-url" type="url" placeholder="https://xxxxx.supabase.co" value="${esc(cfg.url || "")}" />
          <label class="label" for="sb-key">Clave publishable (o anon)</label>
          <input id="sb-key" type="text" placeholder="sb_publishable_… o eyJ…" value="${esc(cfg.anonKey || "")}" />
          <div class="form-grid">
            <label class="label-mini">Email<input id="sb-email" type="email" placeholder="vos@email.com" value="${esc(cfg.email || "")}" /></label>
            <label class="label-mini">Contraseña<input id="sb-pass" type="password" placeholder="mínimo 6 caracteres" /></label>
          </div>
          <p id="sb-error" class="warn-note hidden"></p>
          <button id="sb-connect" class="btn primary full">Conectar</button>
          <p class="dataset-note">Si es la primera vez, te crea la cuenta sola. Si Supabase te pide confirmar el mail, confirmalo y volvé a tocar Conectar.</p>
        `}
      </section>

      <section class="card">
        <div class="card-head"><h2>Respaldo manual</h2></div>
        <p class="muted sub">Un archivo con todo lo tuyo. Sirve para pasarlo a otro equipo o para guardarlo por las dudas.</p>
        <div class="btn-row">
          <button id="export" class="btn ghost">Descargar respaldo</button>
          <button id="import-btn" class="btn ghost">Restaurar</button>
        </div>
        <input id="import-file" type="file" accept="application/json" class="hidden" />
      </section>

      <section class="card">
        <div class="card-head"><h2>Qué guarda la app</h2></div>
        <div class="data-list">
          ${[
            ["days", "Rutinas, hábitos y las 3 del día"],
            ["tasks", "Tareas"],
            ["focus-blocks", "Bloques de foco"],
            ["clients", "Clientes y prospectos"],
            ["content", "Contenido para redes"],
            ["money-moves", "Ingresos y gastos"],
            ["goals", "Metas"],
            ["meals", "Comidas"],
            ["body-sessions", "Entrenamientos"],
            ["reading-log", "Lecturas"],
            ["journal", "Repaso del día"]
          ].map(([k, label]) => {
            const v = Store.get(k, null);
            const n = Array.isArray(v) ? v.length : v && typeof v === "object" ? Object.keys(v).length : 0;
            return `<div class="data-row"><span>${esc(label)}</span><strong>${n || "—"}</strong></div>`;
          }).join("")}
        </div>
      </section>

      <section class="card accent-pink">
        <div class="card-head"><h2>Borrar todo</h2></div>
        <p class="muted sub">Borra los datos de este navegador. Si estás conectado a Supabase, los de la nube quedan y vuelven al reconectar.</p>
        <button id="wipe" class="btn ghost danger">Borrar datos locales</button>
      </section>
    `;
  },

  setup() {
    $("sb-connect")?.addEventListener("click", async () => {
      const btn = $("sb-connect");
      const err = $("sb-error");
      err.classList.add("hidden");
      btn.disabled = true; btn.textContent = "Conectando…";
      const r = await Store.connect({
        url: $("sb-url").value, anonKey: $("sb-key").value,
        email: $("sb-email").value, password: $("sb-pass").value
      });
      btn.disabled = false; btn.textContent = "Conectar";
      if (r.ok) { toast("Conectado. Tus datos ya se guardan en la nube."); refresh("settings"); renderHeader(); }
      else { err.textContent = r.error; err.classList.remove("hidden"); }
    });

    $("sync-now")?.addEventListener("click", async () => {
      toast("Sincronizando…");
      const r = await Store.sync();
      toast(r.ok ? "Todo al día ✓" : "No se pudo sincronizar: " + (r.error || ""), r.ok ? "ok" : "warn");
      refresh("settings");
    });

    $("disconnect")?.addEventListener("click", () => {
      if (!confirm("¿Desconectar? Tus datos siguen en este equipo y en la nube; solo dejan de sincronizarse.")) return;
      Store.clearConfig();
      refresh("settings"); renderHeader();
    });

    $("export")?.addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(Store.exportAll(), null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `wildev-os-${today()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast("Respaldo descargado.");
    });

    $("import-btn")?.addEventListener("click", () => $("import-file").click());
    $("import-file")?.addEventListener("change", async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        await Store.importAll(JSON.parse(await file.text()));
        toast("Datos restaurados ✓");
        refresh("settings");
      } catch (err) {
        toast("No pude leer ese archivo.", "warn");
      }
    });

    $("wipe")?.addEventListener("click", () => {
      if (!confirm("¿Seguro? Se borran los datos de este navegador.")) return;
      Object.keys(localStorage).filter(k => k.startsWith("wildev-os:") && k !== "wildev-os:supabase-config")
        .forEach(k => localStorage.removeItem(k));
      location.reload();
    });
  }
};

registerModule(Settings);
