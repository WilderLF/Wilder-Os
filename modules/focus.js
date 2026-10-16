/* ============================================================
   FOCO · bloques de concentración y tareas
   El cronómetro sigue andando aunque cambies de pestaña: se
   guarda el momento de inicio y se recalcula, no se cuenta a mano.
   ============================================================ */

const Focus = {
  id: "focus",
  timer: null,

  sesion() { return Store.get("focus-session", null); },
  bloques() { return Store.get("focus-blocks", []); },
  bloquesDe(k = today()) { return this.bloques().filter(b => b.fecha === k); },
  tareas() { return Store.get("tasks", []); },

  minutosDe(k = today()) { return this.bloquesDe(k).reduce((a, b) => a + b.minutos, 0); },

  /* ---------- cronómetro ---------- */
  restante() {
    const s = this.sesion();
    if (!s) return 0;
    const fin = new Date(s.inicio).getTime() + s.minutos * 60000;
    return Math.max(0, Math.round((fin - Date.now()) / 1000));
  },

  iniciar(minutos, tareaId = null) {
    Store.set("focus-session", { inicio: new Date().toISOString(), minutos, tareaId, tipo: "foco" });
    refresh("focus");
  },

  cancelar() {
    const s = this.sesion();
    if (!s) return;
    // Si pasó más de un minuto, se guarda lo que hizo: no se tira el trabajo real.
    const hechos = Math.floor((Date.now() - new Date(s.inicio).getTime()) / 60000);
    if (hechos >= 1) this.guardarBloque(hechos, s.tareaId, true);
    Store.set("focus-session", null);
    refresh("focus");
    if (hechos >= 1) toast(`Guardé ${plural(hechos, "minuto", "minutos")} de foco.`);
  },

  completar() {
    const s = this.sesion();
    if (!s) return;
    this.guardarBloque(s.minutos, s.tareaId, false);
    Store.set("focus-session", null);
    navigator.vibrate?.([200, 100, 200]);
    refresh("focus");
    toast(`Bloque de ${s.minutos} minutos terminado. Tomate ${BREAK_MIN[s.minutos] || 5} de descanso.`);
  },

  guardarBloque(minutos, tareaId, cortado) {
    Store.update("focus-blocks", arr => {
      arr.push({ id: uid(), fecha: today(), minutos, tareaId, cortado, hora: new Date().toISOString() });
      return arr.slice(-400);
    }, []);
  },

  /* ---------- tareas ---------- */
  agregarTarea(texto, area = "trabajo") {
    Store.update("tasks", arr => {
      arr.push({ id: uid(), texto, area, hecha: false, creada: today(), minutos: 0 });
      return arr;
    }, []);
  },
  toggleTarea(id) {
    Store.update("tasks", arr => {
      const t = arr.find(x => x.id === id);
      if (t) { t.hecha = !t.hecha; t.cerrada = t.hecha ? today() : null; }
      return arr;
    }, []);
  },
  borrarTarea(id) { Store.update("tasks", arr => arr.filter(t => t.id !== id), []); },

  /* ---------- pantalla ---------- */
  render() {
    const s = this.sesion();
    const min = this.minutosDe();
    const bloques = this.bloquesDe();
    const tareas = this.tareas();
    const abiertas = tareas.filter(t => !t.hecha);
    const cerradasHoy = tareas.filter(t => t.hecha && t.cerrada === today());

    return `
      <div class="hero compact">
        <p class="eyebrow">Foco</p>
        <h1>${min > 0 ? `${min} minutos hoy` : "Sin foco todavía"}</h1>
        <p class="muted">${bloques.length ? `${plural(bloques.length, "bloque", "bloques")} · el más largo de ${Math.max(...bloques.map(b => b.minutos))} min` : "Un bloque de 50 minutos rinde más que tres horas picoteando."}</p>
      </div>

      ${s ? this.cardCorriendo(s) : this.cardArrancar(abiertas)}

      <section class="card">
        <div class="card-head"><h2>Tareas</h2><span class="chip">${abiertas.length} pendientes</span></div>
        <div class="inline-form">
          <input id="task-input" type="text" placeholder="¿Qué hay que hacer?" maxlength="120" />
          <button id="task-add" class="btn primary">Sumar</button>
        </div>
        <div class="task-list">
          ${abiertas.length ? abiertas.map(t => `
            <div class="task">
              <button class="check" data-task="${t.id}" aria-label="Marcar"></button>
              <div class="task-body">
                <span>${esc(t.texto)}</span>
                ${t.minutos ? `<small>${t.minutos} min de foco</small>` : ""}
              </div>
              <button class="btn ghost tiny" data-focus-task="${t.id}">Foco</button>
              <button class="icon-btn" data-del-task="${t.id}" aria-label="Borrar">✕</button>
            </div>`).join("")
            : '<p class="muted">Nada pendiente. Si hay algo dando vueltas en la cabeza, anotalo acá y sacátelo de encima.</p>'}
        </div>
        ${cerradasHoy.length ? `
          <details class="sub-details">
            <summary>${plural(cerradasHoy.length, "terminada hoy", "terminadas hoy")}</summary>
            ${cerradasHoy.map(t => `<div class="task done">
              <button class="check done" data-task="${t.id}">✓</button>
              <div class="task-body"><span>${esc(t.texto)}</span></div>
              <button class="icon-btn" data-del-task="${t.id}">✕</button>
            </div>`).join("")}
          </details>` : ""}
      </section>

      ${this.cardSemana()}

      <section class="card accent-pink">
        <div class="card-head"><h2>Cuando no arrancás</h2></div>
        <ul class="tips">
          <li><strong>Empezá por 25 minutos.</strong> Casi siempre lo difícil es arrancar, no seguir.</li>
          <li><strong>El celular en otra habitación</strong>, no boca abajo en el escritorio. Si está cerca, tu cabeza lo sabe.</li>
          <li><strong>Dejá la tarea cortada a la mitad</strong> cuando terminás el día. Volver es mucho más fácil que empezar.</li>
          <li><strong>Si no sabés por dónde empezar</strong>, el problema no es la pereza: es que la tarea está mal definida. Partila en una más chica.</li>
        </ul>
      </section>
    `;
  },

  cardCorriendo(s) {
    const resto = this.restante();
    const total = s.minutos * 60;
    const pct = Math.round(((total - resto) / total) * 100);
    const tarea = this.tareas().find(t => t.id === s.tareaId);
    return `<section class="card focus-live">
      <p class="eyebrow">${resto > 0 ? "En foco" : "Terminado"}</p>
      <div class="timer-big ${resto === 0 ? "done" : ""}">${hhmm(resto)}</div>
      ${tarea ? `<p class="focus-task">${esc(tarea.texto)}</p>` : `<p class="muted">Bloque de ${s.minutos} minutos</p>`}
      <div class="focus-bar"><i style="width:${pct}%"></i></div>
      <div class="btn-row">
        ${resto > 0
          ? `<button id="focus-cancel" class="btn ghost">Cortar</button>`
          : `<button id="focus-done" class="btn primary">Listo, guardar</button>`}
      </div>
      ${resto > 0 ? '<p class="dataset-note">Podés cerrar la app: el reloj sigue corriendo igual.</p>' : ""}
    </section>`;
  },

  cardArrancar(abiertas) {
    return `<section class="card">
      <div class="card-head"><h2>Arrancar un bloque</h2></div>
      <div class="preset-row">
        ${FOCUS_PRESETS.map(p => `
          <button class="preset" data-preset="${p.min}">
            <strong>${p.label}</strong><small>${esc(p.detail)}</small>
          </button>`).join("")}
      </div>
      ${abiertas.length ? `
        <label class="label" for="focus-task-select">¿En qué vas a trabajar?</label>
        <select id="focus-task-select">
          <option value="">Sin tarea puntual</option>
          ${abiertas.map(t => `<option value="${t.id}">${esc(t.texto)}</option>`).join("")}
        </select>` : ""}
    </section>`;
  },

  cardSemana() {
    const dias = last7();
    const max = Math.max(60, ...dias.map(k => this.minutosDe(k)));
    const total = dias.reduce((a, k) => a + this.minutosDe(k), 0);
    return `<section class="card">
      <div class="card-head"><h2>Esta semana</h2><span class="chip">${Math.round(total / 60 * 10) / 10} h</span></div>
      <div class="week-strip">
        ${dias.map(k => {
          const m = this.minutosDe(k);
          return `<div class="ws-day ${k === today() ? "today" : ""}">
            <span class="ws-letter">${new Intl.DateTimeFormat("es-AR", { weekday: "narrow" }).format(parseKey(k))}</span>
            <div class="ws-bar"><i class="gold" style="height:${Math.max(4, (m / max) * 100)}%"></i></div>
            <span class="ws-pct">${m || ""}</span>
          </div>`;
        }).join("")}
      </div>
      <p class="dataset-note">Minutos de foco por día. Tres bloques de 50 minutos por día ya es una jornada muy productiva.</p>
    </section>`;
  },

  /* ---------- interacción ---------- */
  setup() {
    const host = $("view-host");

    host.addEventListener("click", e => {
      const p = e.target.closest("[data-preset]");
      if (p) { this.iniciar(Number(p.dataset.preset), $("focus-task-select")?.value || null); return; }
      const ft = e.target.closest("[data-focus-task]");
      if (ft) { this.iniciar(50, ft.dataset.focusTask); return; }
      const t = e.target.closest("[data-task]");
      if (t) { this.toggleTarea(t.dataset.task); refresh("focus"); return; }
      const d = e.target.closest("[data-del-task]");
      if (d) { this.borrarTarea(d.dataset.delTask); refresh("focus"); return; }
    });

    $("focus-cancel")?.addEventListener("click", () => this.cancelar());
    $("focus-done")?.addEventListener("click", () => this.completar());

    const add = () => {
      const i = $("task-input");
      if (!i?.value.trim()) return;
      this.agregarTarea(i.value.trim());
      refresh("focus");
    };
    $("task-add")?.addEventListener("click", add);
    $("task-input")?.addEventListener("keydown", e => { if (e.key === "Enter") add(); });

    // Refresca el reloj mientras hay sesión activa.
    clearInterval(this.timer);
    if (this.sesion()) {
      this.timer = setInterval(() => {
        if (currentView !== "focus" || !this.sesion()) { clearInterval(this.timer); return; }
        const resto = this.restante();
        const el = document.querySelector(".timer-big");
        if (!el) { clearInterval(this.timer); return; }
        el.textContent = hhmm(resto);
        const s = this.sesion();
        const pct = Math.round(((s.minutos * 60 - resto) / (s.minutos * 60)) * 100);
        const barra = document.querySelector(".focus-bar i");
        if (barra) barra.style.width = pct + "%";
        if (resto === 0) { clearInterval(this.timer); navigator.vibrate?.([300, 150, 300]); refresh("focus"); }
      }, 1000);
    }
  }
};

registerModule(Focus);
