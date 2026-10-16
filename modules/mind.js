/* ============================================================
   MENTE · lectura, repaso del día y búsqueda de la pasión
   ============================================================ */

const Mind = {
  id: "mind",

  libros() { return Store.get("books", DEFAULT_BOOKS); },
  lecturas() { return Store.get("reading-log", []); },
  leyoHoy(k = today()) { return this.lecturas().some(l => l.fecha === k); },
  diario() { return Store.get("journal", {}); },

  rachaLectura() {
    let n = 0;
    for (let i = 0; i < 365; i++) {
      const k = addDays(today(), -i);
      if (this.leyoHoy(k)) n++;
      else if (i === 0) continue;
      else break;
    }
    return n;
  },

  registrarLectura(libroId, paginas, nota) {
    Store.update("reading-log", arr => {
      arr.push({ id: uid(), fecha: today(), libroId, paginas: paginas || 0, nota: nota || "" });
      return arr.slice(-500);
    }, []);
  },

  guardarDiario(campo, valor) {
    Store.update("journal", o => {
      o[today()] = { ...(o[today()] || {}), [campo]: valor };
      const claves = Object.keys(o).sort();
      while (claves.length > 365) delete o[claves.shift()];
      return o;
    }, {});
  },

  /* ---------- pantalla ---------- */
  render() {
    const hoy = this.diario()[today()] || {};
    const racha = this.rachaLectura();
    const notas = this.lecturas().filter(l => l.nota).slice(-5).reverse();

    return `
      <div class="hero compact">
        <p class="eyebrow">Mente</p>
        <h1>${racha > 0 ? `${plural(racha, "día", "días")} leyendo` : "Leé algo hoy"}</h1>
        <p class="muted">${this.leyoHoy() ? "Ya leíste hoy ✓" : "Con unos párrafos alcanza. La constancia le gana a la cantidad."}</p>
      </div>

      <section class="card accent-blue">
        <div class="card-head"><h2>📖 Lectura</h2>
          ${this.leyoHoy() ? '<span class="chip ok">Hecho hoy</span>' : ""}</div>
        <label class="label" for="libro-select">Libro</label>
        <select id="libro-select">
          ${this.libros().map(l => `<option value="${l.id}">${esc(l.titulo)} — ${esc(l.autor)}</option>`).join("")}
        </select>
        <div class="form-grid">
          <input id="lec-paginas" type="number" inputmode="numeric" placeholder="Páginas (opcional)" />
          <button id="lec-add" class="btn primary">Marcar leído</button>
        </div>
        <label class="label" for="lec-nota">¿Te quedó algo? (opcional)</label>
        <textarea id="lec-nota" rows="2" placeholder="Una idea, una frase, algo que querés recordar…"></textarea>
        <details class="sub-details">
          <summary>Agregar otro libro</summary>
          <div class="form-grid">
            <input id="lib-titulo" type="text" placeholder="Título" />
            <input id="lib-autor" type="text" placeholder="Autor" />
          </div>
          <button id="lib-add" class="btn ghost full">Sumar libro</button>
        </details>
      </section>

      <section class="card">
        <div class="card-head"><h2>🌙 Repaso del día</h2></div>
        <p class="muted sub">Dos líneas alcanzan. Es para cerrar el día, no para escribir un ensayo.</p>
        ${REFLECTION_PROMPTS.map(p => `
          <label class="label" for="ref-${p.id}">${esc(p.label)}</label>
          <textarea id="ref-${p.id}" data-ref="${p.id}" rows="2" placeholder="${esc(p.placeholder)}">${esc(hoy[p.id] || "")}</textarea>
        `).join("")}
        <p id="ref-saved" class="ok-note hidden">Guardado ✓</p>
      </section>

      ${this.cardPasion()}
      ${this.cardSeguridad()}

      ${notas.length ? `
        <section class="card">
          <div class="card-head"><h2>Lo que fuiste anotando</h2></div>
          ${notas.map(l => `<div class="note-item">
            <small>${shortDate(l.fecha)}</small>
            <p>${esc(l.nota)}</p>
          </div>`).join("")}
        </section>` : ""}

      ${this.cardSemanaLectura()}
    `;
  },

  cardPasion() {
    const p = Store.get("passion", { intereses: [], prueba: "", nota: "" });
    return `<details class="card accent-purple">
      <summary class="card-head"><h2>🔍 Buscar lo que me apasiona</h2></summary>
      <p class="muted sub">La pasión no aparece pensando: aparece probando. En vez de preguntarte qué te apasiona, anotá qué te da curiosidad y probá una cosa por mes.</p>
      <label class="label" for="pas-nuevo">¿Qué te da curiosidad?</label>
      <div class="inline-form">
        <input id="pas-nuevo" type="text" placeholder="Algo que te llama la atención…" maxlength="80" />
        <button id="pas-add" class="btn primary">Sumar</button>
      </div>
      ${p.intereses.length ? `<div class="chips-wrap">
        ${p.intereses.map((i, idx) => `<span class="tag">${esc(i)}<button data-del-pasion="${idx}" aria-label="Quitar">✕</button></span>`).join("")}
      </div>` : ""}
      <label class="label" for="pas-prueba">¿Qué estás probando este mes?</label>
      <input id="pas-prueba" type="text" value="${esc(p.prueba)}" placeholder="Una sola cosa, chica y concreta" maxlength="120" />
      <p class="dataset-note">Tres señales de que vas bien: se te pasa el tiempo sin darte cuenta, lo harías aunque no te paguen, y querés mejorar aunque nadie te mire.</p>
    </details>`;
  },

  cardSeguridad() {
    const k = today();
    const hoy = this.diario()[k] || {};
    const items = [
      { id: "cumpli", label: "Hice lo que dije que iba a hacer" },
      { id: "cuerpo", label: "Me moví y comí bien" },
      { id: "presente", label: "Estuve presente con mi familia" },
      { id: "aprendi", label: "Aprendí o creé algo" }
    ];
    const ok = items.filter(i => hoy[i.id]).length;
    return `<details class="card">
      <summary class="card-head"><h2>💎 Cómo me siento conmigo</h2><span class="chip">${ok}/4</span></summary>
      <p class="muted sub">La seguridad no se consigue mirándose al espejo: se consigue acumulando días en los que cumpliste tu palabra. Esto es el registro de esos días.</p>
      ${items.map(i => `<button class="sec-item ${hoy[i.id] ? "done" : ""}" data-sec="${i.id}">
        <span class="check">${hoy[i.id] ? "✓" : ""}</span>${esc(i.label)}
      </button>`).join("")}
      ${ok === 4 ? '<p class="ok-note">Día completo. Así se construye.</p>' : ""}
    </details>`;
  },

  cardSemanaLectura() {
    const dias = last7();
    return `<section class="card">
      <div class="card-head"><h2>Lectura de la semana</h2>
        <span class="chip">${dias.filter(k => this.leyoHoy(k)).length}/7</span></div>
      <div class="week-strip">
        ${dias.map(k => `<div class="ws-day ${k === today() ? "today" : ""}">
          <span class="ws-letter">${new Intl.DateTimeFormat("es-AR", { weekday: "narrow" }).format(parseKey(k))}</span>
          <div class="ws-dot ${this.leyoHoy(k) ? "on blue" : ""}">${this.leyoHoy(k) ? "📖" : ""}</div>
        </div>`).join("")}
      </div>
    </section>`;
  },

  /* ---------- interacción ---------- */
  setup() {
    const host = $("view-host");

    $("lec-add")?.addEventListener("click", () => {
      this.registrarLectura($("libro-select").value, parseInt($("lec-paginas").value) || 0, $("lec-nota").value.trim());
      toast(`Lectura registrada. ${plural(this.rachaLectura(), "día seguido", "días seguidos")}.`);
      refresh("mind");
    });

    $("lib-add")?.addEventListener("click", () => {
      const titulo = $("lib-titulo").value.trim(), autor = $("lib-autor").value.trim();
      if (!titulo) { toast("Falta el título.", "warn"); return; }
      Store.set("books", [...this.libros(), { id: uid(), titulo, autor: autor || "—", activo: true }]);
      refresh("mind");
    });

    // El repaso se guarda solo al salir del campo.
    $$("[data-ref]").forEach(ta => {
      ta.addEventListener("blur", () => {
        this.guardarDiario(ta.dataset.ref, ta.value.trim());
        const aviso = $("ref-saved");
        if (aviso) { aviso.classList.remove("hidden"); setTimeout(() => aviso.classList.add("hidden"), 1600); }
      });
    });

    host.addEventListener("click", e => {
      const s = e.target.closest("[data-sec]");
      if (s) {
        const hoy = this.diario()[today()] || {};
        this.guardarDiario(s.dataset.sec, !hoy[s.dataset.sec]);
        refresh("mind");
        return;
      }
      const dp = e.target.closest("[data-del-pasion]");
      if (dp) {
        const p = structuredClone(Store.get("passion", { intereses: [], prueba: "" }));
        p.intereses.splice(Number(dp.dataset.delPasion), 1);
        Store.set("passion", p);
        refresh("mind");
      }
    });

    $("pas-add")?.addEventListener("click", () => {
      const v = $("pas-nuevo").value.trim();
      if (!v) return;
      const p = structuredClone(Store.get("passion", { intereses: [], prueba: "", nota: "" }));
      p.intereses = [...(p.intereses || []), v];
      Store.set("passion", p);
      refresh("mind");
    });

    $("pas-prueba")?.addEventListener("blur", e => {
      const p = structuredClone(Store.get("passion", { intereses: [], prueba: "", nota: "" }));
      p.prueba = e.target.value.trim();
      Store.set("passion", p);
    });
  }
};

registerModule(Mind);
