/* ============================================================
   CUERPO · entrenamiento y comida
   Trae el reproductor completo de Wildev Training: animación del
   ejercicio, series una por una y cronómetro de descanso.
   ============================================================ */

const Body = {
  id: "body",
  tab: "entreno",
  modo: "lista",        // lista | workout | picker
  timer: null,
  mediaToken: 0,

  /* ---------- configuración y semana ---------- */
  cfg() { return Store.get("body-config", { plan: "softball", formato: "split", nivelAbs: "beginner", absActivo: false }); },
  setCfg(p) { Store.set("body-config", { ...this.cfg(), ...p }); },

  semana() {
    const c = this.cfg();
    const w = buildWeek(c.plan, c.formato);
    if (!c.absActivo) return w;
    // Con el reto activo se sacan los abdominales de las rutinas y se
    // agrega el reto como sesión aparte, igual que en Wildev Training.
    const abs = buildAbsSession(c.nivelAbs);
    Object.values(w).forEach(d => {
      d.sessions = d.sessions
        .map(s => ({ ...s, exercises: s.exercises.filter(e => !ABS_REPLACES.includes(e.name)) }))
        .filter(s => s.exercises.length);
      d.sessions.push(abs);
      d.duration = d.sessions.map(s => s.duration).join(" + ");
    });
    return w;
  },

  diaKey() { return DAY_ORDER[(new Date().getDay() + 6) % 7]; },
  diaHoy() { return this.semana()[this.diaKey()]; },
  sesionPorSlot(slot) {
    const d = this.diaHoy();
    return d.sessions.find(s => (s.slot ?? "") === slot) || d.sessions[Number(slot)] || d.sessions[0];
  },

  /* ---------- registro ---------- */
  sesiones(k = today()) { return Store.get("body-sessions", {})[k] || {}; },
  entrenoHecho(k = today()) { return Object.values(this.sesiones(k)).some(v => v === true); },

  marcarSesion(slot, k = today()) {
    Store.update("body-sessions", obj => {
      obj[k] = { ...(obj[k] || {}) };
      obj[k][slot] = !obj[k][slot];
      const claves = Object.keys(obj).sort();
      while (claves.length > 120) delete obj[claves.shift()];
      return obj;
    }, {});
  },

  seriesHechas(slot, i, k = today()) { return Store.get("body-sets", {})[`${k}:${slot}:${i}`] || 0; },
  setSeries(slot, i, n, k = today()) {
    Store.update("body-sets", o => {
      const key = `${k}:${slot}:${i}`;
      if (n <= 0) delete o[key]; else o[key] = n;
      return o;
    }, {});
  },

  /* ---------- reto abdominal ---------- */
  absDias() { return Store.get("abs-days", []); },
  marcarAbs(k = today()) {
    const d = this.absDias();
    if (!d.includes(k)) Store.set("abs-days", [...d, k].sort().slice(-60));
  },

  /* ---------- estado del reproductor ---------- */
  workout() { return Store.get("body-workout", null); },
  setWorkout(w) { Store.set("body-workout", w); },

  empezar(slot) {
    const s = this.sesionPorSlot(slot);
    // Retoma donde quedó: salta a la primera serie que falta.
    let idx = 0, serie = 1;
    for (let i = 0; i < s.exercises.length; i++) {
      const hechas = this.seriesHechas(slot, i);
      if (hechas < this.seriesDe(s.exercises[i])) { idx = i; serie = hechas + 1; break; }
      if (i === s.exercises.length - 1) { idx = i; serie = this.seriesDe(s.exercises[i]); }
    }
    this.setWorkout({ slot, idx, serie, rest: null });
    this.modo = "workout";
    refresh("body");
  },

  salir() { this.pararTimer(); this.modo = "lista"; refresh("body"); },

  seriesDe(ex) {
    const r = Store.get("readiness", "normal");
    if (r === "cansado") return Math.min(2, ex.sets);
    if (r === "energia" && ex.sets === 3) return 4;
    return ex.sets;
  },

  /* ---------- cronómetro de descanso ---------- */
  restante() {
    const w = this.workout();
    if (!w?.rest) return 0;
    const fin = new Date(w.rest.inicio).getTime() + w.rest.segundos * 1000;
    return Math.max(0, Math.round((fin - Date.now()) / 1000));
  },

  arrancarDescanso(segundos, tipo = "rest") {
    if (!segundos) return;
    const w = this.workout();
    this.setWorkout({ ...w, rest: { inicio: new Date().toISOString(), segundos, tipo } });
  },

  pararDescanso() {
    const w = this.workout();
    if (w) this.setWorkout({ ...w, rest: null });
  },

  pararTimer() { clearInterval(this.timer); this.timer = null; },

  /* ---------- avance ---------- */
  completarSerie() {
    const w = this.workout();
    const s = this.sesionPorSlot(w.slot);
    const ex = s.exercises[w.idx];
    const total = this.seriesDe(ex);

    // Ejercicios por tiempo (reto abdominal): el botón arranca el bloque.
    if (ex.workSeconds) {
      if (w.rest?.tipo === "work") return;
      this.arrancarDescanso(ex.workSeconds, "work");
      refresh("body");
      return;
    }

    this.setSeries(w.slot, w.idx, w.serie);
    if (w.serie < total) {
      this.setWorkout({ ...w, serie: w.serie + 1 });
      this.arrancarDescanso(ex.rest || 0);
      refresh("body");
    } else {
      this.siguienteEjercicio();
    }
  },

  siguienteEjercicio(conDescanso = false) {
    const w = this.workout();
    const s = this.sesionPorSlot(w.slot);
    if (w.idx < s.exercises.length - 1) {
      const ex = s.exercises[w.idx];
      this.setWorkout({ ...w, idx: w.idx + 1, serie: 1, rest: null });
      if (conDescanso && ex.rest) this.arrancarDescanso(ex.rest);
      refresh("body");
    } else {
      this.terminarSesion();
    }
  },

  terminarSesion() {
    const w = this.workout();
    const s = this.sesionPorSlot(w.slot);
    this.pararTimer();
    if (!this.sesiones()[w.slot]) this.marcarSesion(w.slot);
    if (s.isAbs) this.marcarAbs();
    this.setWorkout(null);
    this.modo = "lista";
    refresh("body");
    toast(s.isAbs ? `Reto abdominal: ${plural(this.absDias().length, "día", "días")} de ${ABS_CHALLENGE_DAYS} 🔥` : "Sesión terminada 💪");
  },

  /* ---------- comida ---------- */
  perfil() { return Store.get("body-profile", { peso: 85, altura: 175, edad: 34, actividad: 1.3, objetivo: "mantener", proteinaPorKg: 2.0 }); },
  comidasDe(k = today()) { return Store.get("meals", {})[k] || []; },
  entrenoTipoDe(k = today()) {
    return Store.get("training-type", {})[k] || (this.entrenoHecho(k) ? "strength" : "none");
  },
  setEntrenoTipo(id, k = today()) {
    Store.update("training-type", o => { o[k] = id; return o; }, {});
    refresh("body");
  },

  objetivoKcal(k = today()) {
    const p = this.perfil();
    const bmr = 10 * p.peso + 6.25 * p.altura - 5 * p.edad + 5;
    const base = bmr * p.actividad;
    const extra = (TRAINING_TYPES.find(t => t.id === this.entrenoTipoDe(k)) || TRAINING_TYPES[0]).kcal;
    const ajuste = p.objetivo === "definir" ? -350 : p.objetivo === "subir" ? 250 : 0;
    const kcal = Math.max(1600, Math.round((base + extra + ajuste) / 10) * 10);
    const prot = Math.round((p.proteinaPorKg * p.peso) / 5) * 5;
    const gras = Math.round((kcal * 0.28 / 9) / 5) * 5;
    const carb = Math.max(0, Math.round((kcal - prot * 4 - gras * 9) / 4 / 5) * 5);
    return { kcal, prot, gras, carb, extra };
  },

  totales(k = today()) {
    return this.comidasDe(k).reduce((a, c) => ({ p: a.p + c.p, c: a.c + c.c, f: a.f + c.f, kcal: a.kcal + c.kcal }),
      { p: 0, c: 0, f: 0, kcal: 0 });
  },

  /* ============ PANTALLA ============ */
  render() {
    if (this.modo === "workout" && this.workout()) return this.vistaWorkout();
    if (this.modo === "picker") return this.vistaPicker();
    return `
      <div class="tabs">
        <button class="tab ${this.tab === "entreno" ? "active" : ""}" data-btab="entreno">Entreno</button>
        <button class="tab ${this.tab === "comida" ? "active" : ""}" data-btab="comida">Comida</button>
      </div>
      ${this.tab === "entreno" ? this.vistaEntreno() : this.vistaComida()}
    `;
  },

  /* ---------- lista de sesiones ---------- */
  vistaEntreno() {
    const d = this.diaHoy();
    const hechas = this.sesiones();
    const cfg = this.cfg();
    const readiness = Store.get("readiness", "normal");

    const enCurso = this.workout();
    const sesionEnCurso = enCurso ? this.sesionPorSlot(enCurso.slot) : null;

    return `
      <div class="hero compact">
        <p class="eyebrow">${PLAN_META[cfg.plan].emoji} ${esc(d.label)}</p>
        <h1>${this.entrenoHecho() ? "Entrenaste ✓" : esc(d.title)}</h1>
        <p class="muted">${esc(d.goal)}</p>
        <div class="hero-meta"><span>${esc(d.duration)}</span><span>${esc(d.intensity)}</span></div>
      </div>

      ${sesionEnCurso ? `
        <section class="card accent-green">
          <div class="card-head"><h2>▶ Sesión en curso</h2></div>
          <p class="muted sub">${esc(sesionEnCurso.title)} · ibas por ${esc(sesionEnCurso.exercises[enCurso.idx]?.name || "")}.</p>
          <div class="btn-row">
            <button class="btn primary" data-retomar>Continuar</button>
            <button class="btn ghost" data-descartar>Descartar</button>
          </div>
        </section>` : ""}

      <section class="card">
        <label class="label no-gap">¿Cómo llegás hoy?</label>
        <div class="seg-row tri">
          <button class="seg ${readiness === "cansado" ? "active" : ""}" data-ready="cansado">😴 Cansado</button>
          <button class="seg ${readiness === "normal" ? "active" : ""}" data-ready="normal">🙂 Normal</button>
          <button class="seg ${readiness === "energia" ? "active" : ""}" data-ready="energia">🔥 Con energía</button>
        </div>
        <p class="dataset-note">Cansado baja las series a 2; con energía suma una. Entrenar cansado con menos volumen le gana a no entrenar.</p>
      </section>

      ${d.sessions.map((s, idx) => {
        const slot = s.slot ?? String(idx);
        const done = !!hechas[slot];
        const total = s.exercises.reduce((a, e) => a + this.seriesDe(e), 0);
        const hechasN = s.exercises.reduce((a, e, i) => a + Math.min(this.seriesHechas(slot, i), this.seriesDe(e)), 0);
        const pct = total ? Math.round((hechasN / total) * 100) : 0;
        return `<section class="card ${done ? "done-card" : ""}">
          <div class="card-head">
            <h2>${SLOT_META[s.slot]?.icon || "⚡"} ${esc(s.title)}</h2>
            <span class="chip ${done ? "ok" : ""}">${done ? "hecha ✓" : s.duration}</span>
          </div>
          <p class="muted sub">${plural(s.exercises.length, "ejercicio", "ejercicios")}${s.place ? " · " + esc(s.place) : ""}</p>
          ${hechasN > 0 && !done ? `<div class="focus-bar mini"><i style="width:${pct}%"></i></div><p class="dataset-note">${hechasN} de ${total} series</p>` : ""}
          <div class="btn-row">
            <button class="btn primary" data-empezar="${slot}">${hechasN > 0 && !done ? "Seguir" : "Empezar"}</button>
            <button class="btn ghost" data-session="${slot}">${done ? "Desmarcar" : "Marcar hecha"}</button>
          </div>
        </section>`;
      }).join("")}

      ${this.cardAbs()}

      <details class="card">
        <summary class="card-head"><h2>Plan y ajustes</h2></summary>
        <label class="label" for="plan-select">Plan activo</label>
        <select id="plan-select">
          ${Object.entries(PLAN_META).map(([k, m]) => `<option value="${k}" ${k === cfg.plan ? "selected" : ""}>${m.emoji} ${m.label}</option>`).join("")}
        </select>
        <label class="label" for="formato-select">Lunes, miércoles y viernes</label>
        <select id="formato-select">
          <option value="split" ${cfg.formato === "split" ? "selected" : ""}>Mañana + tarde</option>
          <option value="joined" ${cfg.formato === "joined" ? "selected" : ""}>Todo junto</option>
        </select>
      </details>

      ${this.cardSemanaEntreno()}
    `;
  },

  cardAbs() {
    const cfg = this.cfg();
    const dias = this.absDias().length;
    const hoy = this.absDias().includes(today());
    const lvl = ABS_LEVELS[cfg.nivelAbs] || ABS_LEVELS.beginner;
    return `<section class="card accent-gold">
      <div class="card-head">
        <h2>🔥 Reto abdominal · 28 días</h2>
        <button class="switch ${cfg.absActivo ? "on" : ""}" data-abs-toggle role="switch" aria-checked="${cfg.absActivo}" aria-label="Activar reto"><span></span></button>
      </div>
      ${cfg.absActivo ? `
        <label class="label" for="abs-level">Nivel</label>
        <select id="abs-level">
          ${Object.values(ABS_LEVELS).map(l => `<option value="${l.key}" ${l.key === cfg.nivelAbs ? "selected" : ""}>${l.label} · ${l.work}s trabajo / ${l.rest}s descanso</option>`).join("")}
        </select>
        <div class="abs-track"><i style="width:${Math.min(100, (dias / ABS_CHALLENGE_DAYS) * 100)}%"></i></div>
        <p class="dataset-note"><strong>Día ${Math.min(dias + (hoy ? 0 : 1), ABS_CHALLENGE_DAYS)} de ${ABS_CHALLENGE_DAYS}</strong> · ${dias} completados · ${lvl.work}s / ${lvl.rest}s${hoy ? " · hoy ya lo hiciste ✓" : ""}</p>`
        : '<p class="dataset-note">Al activarlo aparece todos los días como sesión aparte y se sacan los abdominales de las rutinas para no duplicar trabajo.</p>'}
    </section>`;
  },

  cardSemanaEntreno() {
    const dias = last7();
    return `<section class="card">
      <div class="card-head"><h2>Últimos 7 días</h2>
        <span class="chip">${dias.filter(k => this.entrenoHecho(k)).length}/7</span></div>
      <div class="week-strip">
        ${dias.map(k => `<div class="ws-day ${k === today() ? "today" : ""}">
          <span class="ws-letter">${new Intl.DateTimeFormat("es-AR", { weekday: "narrow" }).format(parseKey(k))}</span>
          <div class="ws-dot ${this.entrenoHecho(k) ? "on" : ""}">${this.entrenoHecho(k) ? "💪" : ""}</div>
        </div>`).join("")}
      </div>
    </section>`;
  },

  /* ---------- reproductor ---------- */
  vistaWorkout() {
    const w = this.workout();
    const s = this.sesionPorSlot(w.slot);
    const ex = s.exercises[w.idx];
    const total = this.seriesDe(ex);
    const resto = this.restante();
    const esTrabajo = w.rest?.tipo === "work";
    const ultimo = w.idx === s.exercises.length - 1;

    let textoBtn;
    if (ex.workSeconds) textoBtn = esTrabajo ? "En curso…" : `Iniciar ${ex.workSeconds} s`;
    else textoBtn = w.serie >= total ? (ultimo ? "Terminar sesión" : "Completar ejercicio") : "Completar serie";

    return `
      <div class="wk-top">
        <button class="btn ghost tiny" id="wk-salir">Salir</button>
        <span class="muted wk-prog">${SLOT_META[s.slot]?.icon || "⚡"} ${esc(s.title)} · ${w.idx + 1} de ${s.exercises.length}</span>
      </div>

      <section class="card wk-card">
        <div class="demo-frame" id="demo-frame">
          <img id="exercise-gif" alt="" />
          <div id="demo-fallback" class="demo-fallback">
            <img src="assets/wildev-mark.svg" alt="" class="fallback-logo" />
            <span id="demo-status">Buscando animación…</span>
          </div>
        </div>

        <h2 class="wk-name">${esc(ex.name)}</h2>
        <p class="muted wk-note">${esc(ex.note)}</p>

        <details id="wk-steps" class="instructions-box hidden">
          <summary>Cómo hacerlo</summary>
          <ol id="wk-steps-list"></ol>
        </details>

        <div class="media-tools">
          <button class="btn ghost tiny ${ex.mediaDisabled ? "hidden" : ""}" id="wk-cambiar">Cambiar animación</button>
          <a id="wk-credito" class="attribution hidden" href="https://gymvisual.com/" target="_blank" rel="noopener">© Gym visual</a>
        </div>

        <div class="wk-meta">
          <div><span>${ex.workSeconds ? "1" : w.serie} / ${ex.workSeconds ? 1 : total}</span><p>Series</p></div>
          <div><span>${esc(ex.reps)}</span><p>Reps / tiempo</p></div>
          <div><span>${ex.rest ? ex.rest + "s" : "—"}</span><p>Descanso</p></div>
        </div>

        ${w.rest ? `
          <div class="timer-box ${esTrabajo ? "working" : ""}">
            <p>${esTrabajo ? "¡A trabajar!" : "Descanso"}</p>
            <strong id="wk-timer">${hhmm(resto)}</strong>
            <div class="btn-row">
              <button class="btn secondary" id="wk-skip">${esTrabajo ? "Cortar" : "Omitir"}</button>
              <button class="btn ghost" id="wk-mas">+30 s</button>
            </div>
          </div>` : ""}

        <div class="btn-row">
          <button class="btn primary" id="wk-completar" ${esTrabajo ? "disabled" : ""}>${textoBtn}</button>
          <button class="btn ghost" id="wk-saltar">Saltar</button>
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h2>Ejercicios</h2></div>
        <div class="wk-list">
          ${s.exercises.map((e, i) => {
            const hechas = this.seriesHechas(w.slot, i);
            const tot = this.seriesDe(e);
            const completo = hechas >= tot;
            return `<button class="wk-item ${i === w.idx ? "actual" : ""} ${completo ? "done" : ""}" data-ir="${i}">
              <span class="wk-num">${completo ? "✓" : i + 1}</span>
              <span class="wk-item-body"><strong>${esc(e.name)}</strong>
                <small>${hechas}/${tot} series · ${esc(e.reps)}</small></span>
            </button>`;
          }).join("")}
        </div>
      </section>
    `;
  },

  vistaPicker() {
    const w = this.workout();
    const ex = this.sesionPorSlot(w.slot).exercises[w.idx];
    return `
      <div class="wk-top">
        <button class="btn ghost tiny" id="pk-volver">Volver</button>
        <span class="muted wk-prog">Cambiar animación</span>
      </div>
      <section class="card">
        <label class="label" for="pk-buscar">Buscar ejercicio</label>
        <div class="inline-form">
          <input id="pk-buscar" type="search" value="${esc(ex.datasetQuery || ex.name)}" />
          <button id="pk-go" class="btn primary">Buscar</button>
        </div>
        <p class="dataset-note">El catálogo está en inglés. Solo mostramos coincidencias confiables.</p>
      </section>
      <div id="pk-resultados" class="pk-list"></div>
    `;
  },

  /* ---------- comida ---------- */
  vistaComida() {
    const t = this.objetivoKcal();
    const tot = this.totales();
    const restan = Math.round(t.kcal - tot.kcal);
    const pct = Math.min(100, Math.round((tot.kcal / t.kcal) * 100));
    const tipo = this.entrenoTipoDe();
    const comidas = this.comidasDe();

    return `
      <div class="hero compact">
        <p class="eyebrow">Comida de hoy</p>
        <h1>${restan >= 0 ? `${restan} kcal libres` : `${Math.abs(restan)} de más`}</h1>
        <div class="kcal-bar"><i class="${restan < 0 ? "over" : ""}" style="width:${pct}%"></i></div>
        <p class="muted">${Math.round(tot.kcal)} de ${t.kcal} kcal${t.extra ? ` · incluye +${t.extra} por entrenar` : ""}</p>
      </div>

      <section class="card">
        <div class="card-head"><h2>Macros</h2></div>
        ${this.barra("Proteína", tot.p, t.prot, "p")}
        ${this.barra("Carbohidratos", tot.c, t.carb, "c")}
        ${this.barra("Grasas", tot.f, t.gras, "f")}
        <label class="label top-gap">¿Qué hiciste hoy?</label>
        <div class="train-chips">
          ${TRAINING_TYPES.map(tt => `<button class="train-chip ${tt.id === tipo ? "active" : ""}" data-btrain="${tt.id}">
            <span>${tt.icon}</span><small>${esc(tt.short)}</small><em>${tt.kcal ? "+" + tt.kcal : "base"}</em>
          </button>`).join("")}
        </div>
      </section>

      <section class="card">
        <div class="card-head"><h2>Agregar comida</h2></div>
        <select id="food-select"></select>
        <label class="label" for="food-qty">Cantidad</label>
        <div class="qty-row">
          <button class="btn ghost qty-btn" data-qty="-1">−</button>
          <input id="food-qty" type="number" inputmode="decimal" min="0" step="1" value="100" />
          <button class="btn ghost qty-btn" data-qty="1">+</button>
          <select id="food-measure"></select>
        </div>
        <select id="meal-select">${MEALS.map(m => `<option>${m}</option>`).join("")}</select>
        <p id="food-preview" class="food-preview"></p>
        <button id="food-add" class="btn primary full">Agregar</button>
      </section>

      <section class="card">
        <div class="card-head"><h2>Lo que comiste</h2><span class="chip">${Math.round(tot.kcal)} kcal</span></div>
        ${comidas.length ? MEALS.filter(m => comidas.some(c => c.meal === m)).map(m => {
          const items = comidas.filter(c => c.meal === m);
          return `<div class="meal-group">
            <div class="meal-head"><p class="eyebrow">${m}</p><span>${items.reduce((a, c) => a + c.kcal, 0)} kcal</span></div>
            ${items.map(c => `<div class="food-item">
              <div><strong>${esc(c.name)}</strong><small>${esc(c.qtyText)} · P ${fmt1(c.p)} · C ${fmt1(c.c)} · G ${fmt1(c.f)}</small></div>
              <span class="food-kcal">${c.kcal}</span>
              <button class="icon-btn" data-del-food="${c.id}" aria-label="Borrar">✕</button>
            </div>`).join("")}
          </div>`;
        }).join("") : '<p class="muted">Todavía no registraste nada hoy.</p>'}
      </section>

      <details class="card">
        <summary class="card-head"><h2>Mi perfil</h2></summary>
        ${this.formPerfil()}
      </details>
    `;
  },

  barra(label, valor, meta, cls) {
    const pct = meta ? Math.min(100, Math.round((valor / meta) * 100)) : 0;
    const falta = Math.round(meta - valor);
    return `<div class="macro-row m-${cls}">
      <div class="macro-head"><strong>${label}</strong><span>${Math.round(valor)} / ${meta} g · ${falta >= 0 ? `faltan ${falta}` : `+${Math.abs(falta)}`}</span></div>
      <div class="macro-track"><i style="width:${pct}%"></i></div>
    </div>`;
  },

  formPerfil() {
    const p = this.perfil();
    return `<div class="form-grid">
      <label class="label-mini">Peso (kg)<input type="number" step="0.1" data-perfil="peso" value="${p.peso}" /></label>
      <label class="label-mini">Altura (cm)<input type="number" data-perfil="altura" value="${p.altura}" /></label>
      <label class="label-mini">Edad<input type="number" data-perfil="edad" value="${p.edad}" /></label>
      <label class="label-mini">Proteína g/kg<input type="number" step="0.1" data-perfil="proteinaPorKg" value="${p.proteinaPorKg}" /></label>
    </div>
    <label class="label" for="obj-select">Objetivo</label>
    <select id="obj-select" data-perfil="objetivo">
      <option value="mantener" ${p.objetivo === "mantener" ? "selected" : ""}>Mantener el peso y definir</option>
      <option value="definir" ${p.objetivo === "definir" ? "selected" : ""}>Bajar grasa (−350 kcal)</option>
      <option value="subir" ${p.objetivo === "subir" ? "selected" : ""}>Ganar músculo (+250 kcal)</option>
    </select>
    <p class="dataset-note">El nivel de actividad base es tu vida diaria; el entrenamiento se suma por día según lo que marques arriba.</p>`;
  },

  /* ============ INTERACCIÓN ============ */
  setup() {
    const host = $("view-host");
    this.pararTimer();

    if (this.modo === "workout" && this.workout()) { this.setupWorkout(host); return; }
    if (this.modo === "picker") { this.setupPicker(host); return; }

    host.addEventListener("click", e => {
      const t = e.target.closest("[data-btab]");
      if (t) { this.tab = t.dataset.btab; refresh("body"); return; }
      const emp = e.target.closest("[data-empezar]");
      if (emp) { this.empezar(emp.dataset.empezar); return; }
      if (e.target.closest("[data-retomar]")) { this.modo = "workout"; refresh("body"); return; }
      if (e.target.closest("[data-descartar]")) { this.setWorkout(null); refresh("body"); return; }
      const s = e.target.closest("[data-session]");
      if (s) { this.marcarSesion(s.dataset.session); refresh("body"); return; }
      const r = e.target.closest("[data-ready]");
      if (r) { Store.set("readiness", r.dataset.ready); refresh("body"); return; }
      if (e.target.closest("[data-abs-toggle]")) { this.setCfg({ absActivo: !this.cfg().absActivo }); refresh("body"); return; }
      const tr = e.target.closest("[data-btrain]");
      if (tr) { this.setEntrenoTipo(tr.dataset.btrain); return; }
      const df = e.target.closest("[data-del-food]");
      if (df) {
        Store.update("meals", o => { o[today()] = (o[today()] || []).filter(c => c.id !== df.dataset.delFood); return o; }, {});
        refresh("body");
        return;
      }
      const q = e.target.closest("[data-qty]");
      if (q) {
        const m = this.medidaSel();
        const porPeso = m.label === "g" || m.label === "ml";
        const paso = (porPeso ? 10 : 0.5) * Number(q.dataset.qty);
        $("food-qty").value = Math.max(porPeso ? 5 : 0.25, Math.round(((parseFloat($("food-qty").value) || 0) + paso) * 100) / 100);
        this.preview();
      }
    });

    host.addEventListener("change", e => {
      const p = e.target.closest("[data-perfil]");
      if (p) {
        const campo = p.dataset.perfil;
        Store.set("body-profile", { ...this.perfil(), [campo]: campo === "objetivo" ? p.value : (parseFloat(p.value) || 0) });
        refresh("body");
        return;
      }
      if (e.target.id === "plan-select" || e.target.id === "formato-select") {
        this.setCfg({ plan: $("plan-select").value, formato: $("formato-select").value });
        refresh("body");
        return;
      }
      if (e.target.id === "abs-level") { this.setCfg({ nivelAbs: e.target.value }); refresh("body"); }
    });

    if (this.tab === "comida") this.setupComida();
  },

  setupWorkout(host) {
    const w = this.workout();
    const s = this.sesionPorSlot(w.slot);
    const ex = s.exercises[w.idx];

    $("wk-salir").addEventListener("click", () => this.salir());
    $("wk-completar").addEventListener("click", () => this.completarSerie());
    $("wk-saltar").addEventListener("click", () => { this.pararDescanso(); this.siguienteEjercicio(); });
    $("wk-cambiar")?.addEventListener("click", () => { this.modo = "picker"; refresh("body"); });

    $("wk-skip")?.addEventListener("click", () => {
      const esTrabajo = this.workout()?.rest?.tipo === "work";
      this.pararDescanso();
      if (esTrabajo) this.finBloqueTrabajo(); else refresh("body");
    });
    $("wk-mas")?.addEventListener("click", () => {
      const cur = this.workout();
      if (!cur?.rest) return;
      this.setWorkout({ ...cur, rest: { ...cur.rest, segundos: cur.rest.segundos + 30 } });
      refresh("body");
    });

    host.addEventListener("click", e => {
      const ir = e.target.closest("[data-ir]");
      if (ir) {
        const i = Number(ir.dataset.ir);
        this.setWorkout({ ...this.workout(), idx: i, serie: Math.min(this.seriesHechas(w.slot, i) + 1, this.seriesDe(s.exercises[i])), rest: null });
        refresh("body");
      }
    });

    this.cargarMedia(ex);

    // Reloj del descanso o del bloque de trabajo.
    if (w.rest) {
      this.timer = setInterval(() => {
        if (currentView !== "body" || this.modo !== "workout") { this.pararTimer(); return; }
        const resto = this.restante();
        const el = $("wk-timer");
        if (!el) { this.pararTimer(); return; }
        el.textContent = hhmm(resto);
        if (resto <= 0) {
          this.pararTimer();
          navigator.vibrate?.(w.rest.tipo === "work" ? [200, 100, 200] : 200);
          const eraTrabajo = w.rest.tipo === "work";
          this.pararDescanso();
          if (eraTrabajo) this.finBloqueTrabajo(); else refresh("body");
        }
      }, 1000);
    }
  },

  // Al terminar un bloque por tiempo: descansa y encadena el siguiente.
  finBloqueTrabajo() {
    const w = this.workout();
    const s = this.sesionPorSlot(w.slot);
    const ex = s.exercises[w.idx];
    this.setSeries(w.slot, w.idx, 1);
    if (w.idx === s.exercises.length - 1) { this.terminarSesion(); return; }
    this.setWorkout({ ...w, idx: w.idx + 1, serie: 1, rest: null });
    this.arrancarDescanso(ex.rest || 0);
    refresh("body");
  },

  /* ---------- animaciones ---------- */
  overrideKey(slot, idx) { return `${this.cfg().plan}:${slot}:${idx}`; },

  async cargarMedia(ex) {
    const token = ++this.mediaToken;
    const gif = $("exercise-gif"), fb = $("demo-fallback"), st = $("demo-status");
    if (!gif) return;
    gif.style.display = "none";
    gif.removeAttribute("src");
    fb.classList.remove("hidden");

    if (ex.mediaDisabled) { st.textContent = "Seguí la indicación escrita"; return; }
    st.textContent = "Buscando animación…";

    try {
      const w = this.workout();
      const over = Store.get("media-overrides", {})[this.overrideKey(w.slot, w.idx)];
      const ds = await getExerciseDataset();
      let match = over ? ds.find(i => i.id === over) : null;
      if (!match) match = (await findDatasetExercises(ex.datasetQuery || ex.name, 1, 30))[0];
      if (token !== this.mediaToken) return;   // ya pasó a otro ejercicio
      if (!match) { st.textContent = "Sin animación exacta · seguí la indicación escrita"; return; }

      gif.onload = () => { if (token === this.mediaToken) { fb.classList.add("hidden"); gif.style.display = "block"; } };
      gif.onerror = () => { gif.style.display = "none"; fb.classList.remove("hidden"); st.textContent = "No se pudo cargar la animación"; };
      gif.src = datasetMediaUrl(match.gif_url);
      gif.alt = `Animación: ${match.name}`;
      $("wk-credito")?.classList.remove("hidden");

      const pasos = match.instruction_steps?.es || (match.instructions?.es || "").split(/(?<=[.!?])\s+/).filter(Boolean);
      const lista = $("wk-steps-list");
      if (lista && pasos.length) {
        lista.innerHTML = "";
        pasos.slice(0, 8).forEach(t => { const li = document.createElement("li"); li.textContent = t; lista.appendChild(li); });
        $("wk-steps").classList.remove("hidden");
      }
    } catch {
      if (token === this.mediaToken) st.textContent = navigator.onLine ? "Animación no encontrada" : "Conectate a internet para ver la animación";
    }
  },

  setupPicker(host) {
    const buscar = async () => {
      const cont = $("pk-resultados");
      cont.innerHTML = '<div class="card"><p class="muted">Buscando…</p></div>';
      try {
        const res = await findDatasetExercises($("pk-buscar").value.trim(), 15);
        cont.innerHTML = res.length
          ? res.map(i => `<div class="pk-item">
              <img src="${datasetMediaUrl(i.gif_url)}" alt="${esc(i.name)}" loading="lazy" />
              <div><strong>${esc(i.name)}</strong><small>${esc(i.equipment)} · ${esc(i.target)}</small>
              <button class="btn primary tiny" data-usar="${i.id}">Usar esta</button></div>
            </div>`).join("")
          : '<div class="card"><p class="muted">Sin coincidencias. Probá el nombre en inglés.</p></div>';
      } catch { cont.innerHTML = '<div class="card"><p class="muted">No pude cargar el catálogo. Revisá la conexión.</p></div>'; }
    };

    $("pk-volver").addEventListener("click", () => { this.modo = "workout"; refresh("body"); });
    $("pk-go").addEventListener("click", buscar);
    $("pk-buscar").addEventListener("keydown", e => { if (e.key === "Enter") buscar(); });

    host.addEventListener("click", e => {
      const u = e.target.closest("[data-usar]");
      if (!u) return;
      const w = this.workout();
      Store.update("media-overrides", o => { o[this.overrideKey(w.slot, w.idx)] = u.dataset.usar; return o; }, {});
      this.modo = "workout";
      refresh("body");
      toast("Animación cambiada.");
    });

    buscar();
  },

  /* ---------- comida: formulario ---------- */
  foods() { return [...FOOD_DB, ...(Store.get("custom-foods", []) || [])]; },
  foodSel() { return this.foods().find(f => f.id === $("food-select")?.value); },
  medidaSel() {
    const f = this.foodSel();
    const i = Number($("food-measure")?.value || 0);
    return (f?.measures || [{ label: "porción", g: 1 }])[i] || f.measures[0];
  },

  preview() {
    const f = this.foodSel();
    const qty = parseFloat($("food-qty").value) || 0;
    if (!f) { $("food-preview").textContent = ""; return; }
    const m = this.medidaSel();
    const mac = foodMacros(f, qty, m);
    const porPeso = m.label === "g" || m.label === "ml";
    $("food-preview").innerHTML = `<strong>${macrosKcal(mac)} kcal</strong> · P ${fmt1(mac.p)} · C ${fmt1(mac.c)} · G ${fmt1(mac.f)}
      <span class="preview-sub">${porPeso ? `valores por ${f.gBase} ${m.label}` : `≈ ${fmt1(qty * m.g)} g`}</span>`;
  },

  syncMedidas(reset = true) {
    const f = this.foodSel();
    const sel = $("food-measure");
    if (!f || !sel) return;
    sel.innerHTML = (f.measures || []).map((m, i) => `<option value="${i}">${esc(m.label)}</option>`).join("");
    sel.value = "0";
    if (reset) $("food-qty").value = f.defaultQty ?? 1;
    this.preview();
  },

  setupComida() {
    const sel = $("food-select");
    if (!sel) return;
    const grupos = {};
    this.foods().forEach(f => { (grupos[f.group || "Mis alimentos"] ||= []).push(f); });
    sel.innerHTML = Object.entries(grupos).map(([g, items]) =>
      `<optgroup label="${esc(g)}">${items.map(f => `<option value="${esc(f.id)}">${esc(f.name)}</option>`).join("")}</optgroup>`).join("");
    this.syncMedidas(true);

    const h = new Date().getHours();
    $("meal-select").value = h < 11 ? "Desayuno" : h < 15 ? "Almuerzo" : h < 19 ? "Merienda" : "Cena";

    sel.addEventListener("change", () => this.syncMedidas(true));
    $("food-measure").addEventListener("change", () => {
      const f = this.foodSel(), m = this.medidaSel();
      const qty = parseFloat($("food-qty").value) || 1;
      if (m.label === "g" || m.label === "ml") $("food-qty").value = Math.round(qty * (f.measures[0]?.g || 1)) || f.gBase;
      else $("food-qty").value = 1;
      this.preview();
    });
    $("food-qty").addEventListener("input", () => this.preview());

    $("food-add").addEventListener("click", () => {
      const f = this.foodSel();
      const qty = parseFloat($("food-qty").value);
      if (!f || !(qty > 0)) return;
      const m = this.medidaSel();
      const mac = foodMacros(f, qty, m);
      const porPeso = m.label === "g" || m.label === "ml";
      const entry = {
        id: uid(), name: f.name, meal: $("meal-select").value,
        qtyText: porPeso ? `${fmt1(qty)} ${m.label}` : `${fmt1(qty)} × ${m.label}`,
        p: Math.round(mac.p * 10) / 10, c: Math.round(mac.c * 10) / 10, f: Math.round(mac.f * 10) / 10
      };
      entry.kcal = Math.round(entry.p * 4 + entry.c * 4 + entry.f * 9);
      Store.update("meals", o => {
        o[today()] = [...(o[today()] || []), entry];
        const claves = Object.keys(o).sort();
        while (claves.length > 90) delete o[claves.shift()];
        return o;
      }, {});
      const t = this.objetivoKcal(), tot = this.totales();
      toast(`${entry.name}: ${entry.kcal} kcal. Quedan ${Math.max(0, Math.round(t.kcal - tot.kcal))}.`);
      refresh("body");
    });
  }
};

registerModule(Body);
