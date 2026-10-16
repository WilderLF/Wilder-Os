/* ============================================================
   RECORDATORIOS · horarios, permisos y push
   ============================================================ */

const Reminders = {
  id: "reminders",

  render() {
    const d = Notify.diagnostico();
    const lista = Notify.todos();
    const st = Store.status();

    return `
      <div class="hero compact">
        <p class="eyebrow">Recordatorios</p>
        <h1>${d.permiso === "granted" ? "Activados" : "Sin activar"}</h1>
        <p class="muted">${d.permiso === "granted"
          ? `${plural(Notify.activos().length, "recordatorio activo", "recordatorios activos")}.`
          : "Avisos para no depender de la memoria ni de las ganas."}</p>
      </div>

      ${this.cardEstado(d, st)}

      <section class="card">
        <div class="card-head"><h2>Mis horarios</h2>
          <span class="chip">${Notify.activos().length}/${lista.length}</span></div>
        <div class="rem-list">
          ${lista.map(r => `
            <div class="rem ${r.activo ? "on" : ""}">
              <div class="rem-top">
                <input type="time" value="${r.hora}" data-rem-hora="${r.id}" class="rem-time" />
                <div class="rem-txt">
                  <strong>${esc(r.titulo)}</strong>
                  ${r.cuerpo ? `<small>${esc(r.cuerpo)}</small>` : ""}
                </div>
                <button class="switch ${r.activo ? "on" : ""}" data-rem-toggle="${r.id}" role="switch" aria-checked="${r.activo}" aria-label="Activar"><span></span></button>
              </div>
              <div class="rem-days">
                ${DIAS_CORTOS.map((letra, i) => `
                  <button class="day ${r.dias.includes(i) ? "on" : ""}" data-rem-dia="${r.id}:${i}">${letra}</button>`).join("")}
                ${r.propio ? `<button class="icon-btn rem-del" data-rem-del="${r.id}" aria-label="Borrar">✕</button>` : ""}
              </div>
            </div>`).join("")}
        </div>

        <details class="sub-details">
          <summary>Agregar uno mío</summary>
          <input id="rem-titulo" type="text" placeholder="Ej: Llamar a mamá" maxlength="60" />
          <div class="form-grid">
            <input id="rem-hora" type="time" value="08:00" />
            <button id="rem-add" class="btn primary">Agregar</button>
          </div>
        </details>
      </section>

      ${this.cardPush(d, st)}
    `;
  },

  cardEstado(d, st) {
    if (!d.soportado) {
      return `<section class="card accent-pink">
        <div class="card-head"><h2>Este navegador no puede</h2></div>
        <p class="muted">No soporta notificaciones. Probá con Chrome en Android o Safari en iPhone con la app instalada.</p>
      </section>`;
    }
    if (d.necesitaInstalar) {
      return `<section class="card accent-gold">
        <div class="card-head"><h2>📱 Instalá la app primero</h2></div>
        <p class="muted sub">En iPhone las notificaciones solo funcionan con la app agregada a la pantalla de inicio. Es una regla de Apple, no algo que pueda saltear.</p>
        <ol class="steps">
          <li>Abrí la app en <strong>Safari</strong> (no sirve Chrome en iPhone).</li>
          <li>Tocá el botón <strong>Compartir</strong> (el cuadrado con la flecha).</li>
          <li>Elegí <strong>Agregar a inicio</strong>.</li>
          <li>Abrila desde el ícono nuevo y volvé acá.</li>
        </ol>
      </section>`;
    }
    if (d.permiso === "denied") {
      return `<section class="card accent-pink">
        <div class="card-head"><h2>Notificaciones bloqueadas</h2></div>
        <p class="muted">Las bloqueaste alguna vez. Para volver a activarlas entrá a los ajustes del navegador para este sitio y permitilas; desde acá no se puede.</p>
      </section>`;
    }
    if (d.permiso !== "granted") {
      return `<section class="card accent-green">
        <div class="card-head"><h2>Activar notificaciones</h2></div>
        <p class="muted sub">Un toque y listo. Siempre podés apagarlas después.</p>
        <button id="pedir-permiso" class="btn primary full">Activar</button>
      </section>`;
    }
    return `<section class="card accent-green">
      <div class="card-head"><h2>✅ Activadas</h2></div>
      <p class="muted sub">Mientras tengas la app abierta o reciente, los avisos llegan solos.${!st.conectado ? " Para que lleguen con la app cerrada, configurá los push más abajo." : ""}</p>
      <button id="probar-notif" class="btn ghost full">Probar ahora</button>
    </section>`;
  },

  cardPush(d, st) {
    if (!d.soportado || d.permiso !== "granted") return "";
    const clave = Notify.vapidKey();
    return `<details class="card" ${clave ? "open" : ""}>
      <summary class="card-head"><h2>🔔 Que lleguen con la app cerrada</h2>
        <span id="push-chip" class="chip">${clave ? "configurado" : "opcional"}</span></summary>
      <p class="muted sub">Lo de arriba funciona mientras el navegador esté vivo. Para que te lleguen siempre, aunque tengas el teléfono guardado, hace falta configurar los push una vez.</p>

      ${!st.conectado ? `<p class="warn-note">Primero conectá Supabase en Ajustes: los push se envían desde ahí.</p>` : ""}

      <details class="guide">
        <summary><strong>Cómo se configura (está todo en el README)</strong></summary>
        <ol class="steps">
          <li>Generá las claves VAPID con <code>npx web-push generate-vapid-keys</code>.</li>
          <li>Subí la Edge Function <code>send-reminders</code> a Supabase.</li>
          <li>Programá el cron con el SQL de <code>supabase/cron.sql</code>.</li>
          <li>Pegá acá abajo la clave <strong>pública</strong> y tocá Suscribir.</li>
        </ol>
      </details>

      <label class="label" for="vapid-pub">Clave pública VAPID</label>
      <input id="vapid-pub" type="text" placeholder="BN4GvZtE..." value="${esc(clave || "")}" />
      <p id="push-error" class="warn-note hidden"></p>
      <div class="btn-row">
        <button id="push-sub" class="btn primary">Suscribir</button>
        <button id="push-unsub" class="btn ghost">Quitar</button>
      </div>
    </details>`;
  },

  setup() {
    const host = $("view-host");

    host.addEventListener("click", async e => {
      const t = e.target.closest("[data-rem-toggle]");
      if (t) { Notify.toggle(t.dataset.remToggle); refresh("reminders"); return; }

      const dia = e.target.closest("[data-rem-dia]");
      if (dia) {
        const [id, i] = dia.dataset.remDia.split(":");
        const lista = structuredClone(Notify.todos());
        const r = lista.find(x => x.id === id);
        if (r) {
          const n = Number(i);
          r.dias = r.dias.includes(n) ? r.dias.filter(x => x !== n) : [...r.dias, n].sort();
          Notify.guardar(lista);
          refresh("reminders");
        }
        return;
      }

      const del = e.target.closest("[data-rem-del]");
      if (del) { Notify.borrar(del.dataset.remDel); refresh("reminders"); return; }
    });

    host.addEventListener("change", e => {
      const h = e.target.closest("[data-rem-hora]");
      if (h) { Notify.cambiarHora(h.dataset.remHora, h.value); toast("Horario actualizado."); }
    });

    $("pedir-permiso")?.addEventListener("click", async () => {
      const r = await Notify.pedirPermiso();
      if (r.ok) { toast("Notificaciones activadas ✓"); refresh("reminders"); }
      else toast(r.error, "warn");
    });

    $("probar-notif")?.addEventListener("click", async () => {
      const r = await Notify.probar();
      if (!r.ok) toast(r.error, "warn");
    });

    $("rem-add")?.addEventListener("click", () => {
      const titulo = $("rem-titulo").value.trim();
      if (!titulo) { toast("Escribí de qué se trata.", "warn"); return; }
      Notify.agregar({ titulo, hora: $("rem-hora").value || "08:00" });
      refresh("reminders");
      toast("Recordatorio agregado.");
    });

    $("push-sub")?.addEventListener("click", async () => {
      const err = $("push-error");
      err.classList.add("hidden");
      const clave = $("vapid-pub").value.trim();
      if (!clave) { err.textContent = "Pegá la clave pública."; err.classList.remove("hidden"); return; }
      Notify.setVapidKey(clave);
      const btn = $("push-sub");
      btn.disabled = true; btn.textContent = "Suscribiendo…";
      const r = await Notify.suscribir();
      btn.disabled = false; btn.textContent = "Suscribir";
      if (r.ok) { toast("Listo: los recordatorios te van a llegar aunque cierres la app."); refresh("reminders"); }
      else { err.textContent = r.error; err.classList.remove("hidden"); }
    });

    $("push-unsub")?.addEventListener("click", async () => {
      await Notify.desuscribir();
      toast("Push desactivados.");
      refresh("reminders");
    });
  }
};

registerModule(Reminders);
