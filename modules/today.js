/* ============================================================
   HOY · rutina de mañana y noche, hábitos, las 3 del día
   ============================================================ */

const Today = {
  id: "today",

  /* ---------- lectura de datos ---------- */
  dia(k = today()) {
    return Store.get("days", {})[k] || { rutinaAM: {}, rutinaPM: {}, habitos: {}, tres: [], reflexion: {} };
  },
  setDia(k, fn) {
    Store.update("days", d => {
      d[k] = fn(d[k] || { rutinaAM: {}, rutinaPM: {}, habitos: {}, tres: [], reflexion: {} });
      // 120 días de historial alcanza y sobra
      const claves = Object.keys(d).sort();
      while (claves.length > 120) delete d[claves.shift()];
      return d;
    }, {});
  },

  habitosActivos() {
    return Store.get("habits", DEFAULT_HABITS);
  },

  // Hábitos que se marcan solos desde otros módulos.
  autoHecho(habito, k) {
    if (habito.auto === "body") return Body.entrenoHecho(k);
    if (habito.auto === "reading") return Mind.leyoHoy(k);
    if (habito.auto === "focus") return Focus.bloquesDe(k).length > 0;
    return null;
  },

  habitoHecho(habito, k = today()) {
    const auto = this.autoHecho(habito, k);
    if (auto !== null) return auto || !!this.dia(k).habitos[habito.id];
    return !!this.dia(k).habitos[habito.id];
  },

  racha(habito) {
    let n = 0;
    for (let i = 0; i < 90; i++) {
      const k = addDays(today(), -i);
      if (this.habitoHecho(habito, k)) n++;
      else if (i === 0) continue;   // hoy todavía puede cumplirse
      else break;
    }
    return n;
  },

  progresoDia(k = today()) {
    const d = this.dia(k);
    const hab = this.habitosActivos().filter(h => h.activo);
    const hechos = hab.filter(h => this.habitoHecho(h, k)).length;
    const am = MORNING_ROUTINE.filter(r => d.rutinaAM[r.id]).length;
    const pm = EVENING_ROUTINE.filter(r => d.rutinaPM[r.id]).length;
    const tres = (d.tres || []).filter(t => t.hecho).length;
    const total = hab.length + MORNING_ROUTINE.length + EVENING_ROUTINE.length + Math.max(1, (d.tres || []).length);
    const suma = hechos + am + pm + tres;
    return { pct: Math.round((suma / total) * 100), hechos, hab: hab.length, am, pm, tres, tresTotal: (d.tres || []).length };
  },

  /* ---------- pantalla ---------- */
  render() {
    const k = today();
    const d = this.dia(k);
    const p = this.progresoDia();
    const hora = new Date().getHours();
    const esNoche = hora >= 19;

    return `
      <div class="hero">
        <p class="eyebrow">${saludo()}, Wilder</p>
        <h1>${p.pct >= 80 ? "Día redondo" : p.pct >= 50 ? "Vas bien" : p.pct > 0 ? "Arrancaste" : "Arrancá el día"}</h1>
        <div class="ring-row">
          ${this.anillo(p.pct)}
          <div class="ring-side">
            <div class="mini-stat"><strong>${p.hechos}/${p.hab}</strong><span>hábitos</span></div>
            <div class="mini-stat"><strong>${p.tres}/${p.tresTotal || 3}</strong><span>las 3 del día</span></div>
          </div>
        </div>
      </div>

      ${this.cardTres(d)}
      ${this.cardRutina("am", "🌅 Rutina de la mañana", MORNING_ROUTINE, d.rutinaAM, !esNoche)}
      ${this.cardHabitos(k)}
      ${this.cardRutina("pm", "🌙 Rutina de la noche", EVENING_ROUTINE, d.rutinaPM, esNoche)}
      ${this.cardPilares()}
      ${this.cardSemana()}
    `;
  },

  anillo(pct) {
    const R = 46, C = 2 * Math.PI * R;
    return `<svg viewBox="0 0 110 110" class="day-ring" role="img" aria-label="${pct}% del día cumplido">
      <circle cx="55" cy="55" r="${R}" class="dr-bg"/>
      <circle cx="55" cy="55" r="${R}" class="dr-fill" stroke-dasharray="${(C * pct / 100).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 55 55)"/>
      <text x="55" y="62" class="dr-num">${pct}%</text>
    </svg>`;
  },

  cardTres(d) {
    const tres = d.tres || [];
    return `<section class="card accent-gold">
      <div class="card-head">
        <h2>🎯 Las 3 del día</h2>
        <span class="chip">${tres.filter(t => t.hecho).length}/${tres.length || 3}</span>
      </div>
      <p class="muted sub">Si hacés estas tres, el día ya valió. No más de tres.</p>
      <div class="tres-list">
        ${tres.map((t, i) => `
          <div class="tres-item ${t.hecho ? "done" : ""}">
            <button class="check" data-tres="${i}" aria-label="Marcar">${t.hecho ? "✓" : ""}</button>
            <span>${esc(t.texto)}</span>
            <button class="icon-btn" data-del-tres="${i}" aria-label="Borrar">✕</button>
          </div>`).join("")}
      </div>
      ${tres.length < 3 ? `
        <div class="inline-form">
          <input id="tres-input" type="text" placeholder="${tres.length === 0 ? "Lo más importante de hoy…" : "Otra más…"}" maxlength="90" />
          <button id="tres-add" class="btn primary">Sumar</button>
        </div>` : '<p class="dataset-note">Tres y listo. Lo demás que venga es ganancia.</p>'}
    </section>`;
  },

  cardRutina(slot, titulo, lista, estado, abierta) {
    const hechos = lista.filter(r => estado[r.id]).length;
    const min = lista.reduce((a, r) => a + r.min, 0);
    return `<details class="card" ${abierta ? "open" : ""}>
      <summary class="card-head">
        <h2>${titulo}</h2>
        <span class="chip ${hechos === lista.length ? "ok" : ""}">${hechos}/${lista.length}</span>
      </summary>
      <p class="muted sub">${min} minutos en total.</p>
      <div class="routine-list">
        ${lista.map(r => `
          <button class="routine-item ${estado[r.id] ? "done" : ""}" data-rutina="${slot}" data-step="${r.id}">
            <span class="ri-icon">${r.icon}</span>
            <span class="ri-body"><strong>${esc(r.label)}</strong><small>${esc(r.detail)}</small></span>
            <span class="check">${estado[r.id] ? "✓" : ""}</span>
          </button>`).join("")}
      </div>
    </section></details>`;
  },

  cardHabitos(k) {
    const hab = this.habitosActivos().filter(h => h.activo);
    return `<section class="card">
      <div class="card-head"><h2>⚡ Hábitos</h2>
        <span class="chip">${hab.filter(h => this.habitoHecho(h, k)).length}/${hab.length}</span></div>
      <div class="habit-grid">
        ${hab.map(h => {
          const hecho = this.habitoHecho(h, k);
          const auto = this.autoHecho(h, k);
          const r = this.racha(h);
          return `<button class="habit ${hecho ? "done" : ""} ${auto ? "auto" : ""}" data-habito="${h.id}" ${auto ? "disabled" : ""}>
            <span class="h-icon">${h.icon}</span>
            <span class="h-label">${esc(h.label)}</span>
            <span class="h-streak">${r > 0 ? `🔥 ${r}` : auto !== null ? "automático" : "—"}</span>
          </button>`;
        }).join("")}
      </div>
      <p class="dataset-note">Los que dicen "automático" se marcan solos cuando entrenás, leés o hacés un bloque de foco.</p>
    </section>`;
  },

  cardPilares() {
    const k = today();
    return `<details class="card">
      <summary class="card-head"><h2>🧭 Para qué es todo esto</h2><span class="chip">5 pilares</span></summary>
      <p class="muted sub">Cuando no tengas ganas, leé esto. Es el motivo, no la obligación.</p>
      <div class="pilares">
        ${PILARES.map(p => {
          const hab = this.habitosActivos().filter(h => h.activo && h.pilar === p.id);
          const ok = hab.filter(h => this.habitoHecho(h, k)).length;
          return `<div class="pilar" style="--pc:${p.color}">
            <div class="pilar-head"><span>${p.icon}</span><strong>${esc(p.label)}</strong>
              ${hab.length ? `<span class="chip small">${ok}/${hab.length}</span>` : ""}</div>
            <p>${esc(p.porque)}</p>
          </div>`;
        }).join("")}
      </div>
    </details>`;
  },

  cardSemana() {
    const dias = last7();
    return `<section class="card">
      <div class="card-head"><h2>Últimos 7 días</h2></div>
      <div class="week-strip">
        ${dias.map(k => {
          const p = this.progresoDia(k);
          const esHoy = k === today();
          const letra = new Intl.DateTimeFormat("es-AR", { weekday: "narrow" }).format(parseKey(k));
          return `<div class="ws-day ${esHoy ? "today" : ""}">
            <span class="ws-letter">${letra}</span>
            <div class="ws-bar"><i style="height:${Math.max(4, p.pct)}%"></i></div>
            <span class="ws-pct">${p.pct}</span>
          </div>`;
        }).join("")}
      </div>
      <p class="dataset-note">Porcentaje del día cumplido: rutinas, hábitos y las 3 del día.</p>
    </section>`;
  },

  /* ---------- interacción ---------- */
  setup() {
    const k = today();
    const host = $("view-host");

    host.addEventListener("click", e => {
      const paso = e.target.closest("[data-rutina]");
      if (paso) {
        const campo = paso.dataset.rutina === "am" ? "rutinaAM" : "rutinaPM";
        this.setDia(k, d => { d[campo] = { ...d[campo], [paso.dataset.step]: !d[campo][paso.dataset.step] }; return d; });
        refresh("today");
        return;
      }
      const hab = e.target.closest("[data-habito]");
      if (hab) {
        this.setDia(k, d => { d.habitos = { ...d.habitos, [hab.dataset.habito]: !d.habitos[hab.dataset.habito] }; return d; });
        refresh("today");
        return;
      }
      const tres = e.target.closest("[data-tres]");
      if (tres) {
        const i = Number(tres.dataset.tres);
        this.setDia(k, d => { d.tres[i].hecho = !d.tres[i].hecho; return d; });
        refresh("today");
        return;
      }
      const del = e.target.closest("[data-del-tres]");
      if (del) {
        const i = Number(del.dataset.delTres);
        this.setDia(k, d => { d.tres.splice(i, 1); return d; });
        refresh("today");
        return;
      }
    });

    const add = () => {
      const input = $("tres-input");
      const texto = input?.value.trim();
      if (!texto) return;
      this.setDia(k, d => { d.tres = [...(d.tres || []), { texto, hecho: false }]; return d; });
      refresh("today");
    };
    $("tres-add")?.addEventListener("click", add);
    $("tres-input")?.addEventListener("keydown", e => { if (e.key === "Enter") add(); });
  }
};

registerModule(Today);
