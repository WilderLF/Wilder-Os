/* ============================================================
   TRABAJO · clientes, propuestas y contenido para redes
   La idea: ver de dónde vienen los clientes y qué contenido
   todavía no publicaste.
   ============================================================ */

const Work = {
  id: "work",
  tab: "clientes",

  clientes() { return Store.get("clients", []); },
  contenido() { return Store.get("content", []); },

  etapa(id) { return CLIENT_STAGES.find(s => s.id === id) || CLIENT_STAGES[0]; },
  estadoC(id) { return CONTENT_STATES.find(s => s.id === id) || CONTENT_STATES[0]; },

  /* ---------- pantalla ---------- */
  render() {
    const cl = this.clientes();
    const activos = cl.filter(c => ["contacto", "conversando", "propuesta"].includes(c.etapa));
    const enCurso = cl.filter(c => ["ganado", "activo"].includes(c.etapa));
    const cerrados = cl.filter(c => c.etapa === "entregado");
    const valorPipeline = activos.reduce((a, c) => a + (c.monto || 0), 0);
    const facturado = cerrados.reduce((a, c) => a + (c.monto || 0), 0);

    const cont = this.contenido();
    const pendientes = cont.filter(c => c.estado !== "publicado");
    const publicadosMes = cont.filter(c => c.estado === "publicado" && (c.fechaPub || "").startsWith(monthKey()));

    return `
      <div class="hero compact">
        <p class="eyebrow">Trabajo</p>
        <h1>${activos.length ? `${plural(activos.length, "prospecto", "prospectos")} abiertos` : "Sin prospectos abiertos"}</h1>
        <div class="stat-row">
          <div class="mini-stat"><strong>${money(valorPipeline)}</strong><span>en juego</span></div>
          <div class="mini-stat"><strong>${enCurso.length}</strong><span>en desarrollo</span></div>
          <div class="mini-stat"><strong>${publicadosMes.length}</strong><span>posts este mes</span></div>
        </div>
      </div>

      <div class="tabs">
        <button class="tab ${this.tab === "clientes" ? "active" : ""}" data-tab="clientes">Clientes</button>
        <button class="tab ${this.tab === "contenido" ? "active" : ""}" data-tab="contenido">Contenido</button>
      </div>

      ${this.tab === "clientes" ? this.vistaClientes(cl, facturado) : this.vistaContenido(cont, pendientes)}
    `;
  },

  /* ---------- clientes ---------- */
  vistaClientes(cl, facturado) {
    const porEtapa = CLIENT_STAGES.map(s => ({ ...s, items: cl.filter(c => c.etapa === s.id) }))
      .filter(s => s.items.length);

    const fuentes = {};
    cl.filter(c => ["ganado", "activo", "entregado"].includes(c.etapa))
      .forEach(c => { fuentes[c.fuente || "Otro"] = (fuentes[c.fuente || "Otro"] || 0) + 1; });
    const topFuentes = Object.entries(fuentes).sort((a, b) => b[1] - a[1]);

    return `
      <section class="card">
        <div class="card-head"><h2>Nuevo prospecto</h2></div>
        <div class="form-grid">
          <input id="cl-nombre" type="text" placeholder="Nombre o negocio" maxlength="60" />
          <input id="cl-monto" type="number" inputmode="numeric" placeholder="Monto estimado" />
        </div>
        <div class="form-grid">
          <select id="cl-fuente">${CLIENT_SOURCES.map(f => `<option>${f}</option>`).join("")}</select>
          <select id="cl-etapa">${CLIENT_STAGES.filter(s => s.orden <= 2).map(s => `<option value="${s.id}">${s.label}</option>`).join("")}</select>
        </div>
        <input id="cl-nota" type="text" placeholder="Qué necesita (opcional)" maxlength="140" />
        <button id="cl-add" class="btn primary full">Agregar</button>
      </section>

      ${porEtapa.length ? porEtapa.map(s => `
        <section class="card">
          <div class="card-head">
            <h2><span class="dot" style="background:${s.color}"></span>${s.label}</h2>
            <span class="chip">${s.items.length}</span>
          </div>
          ${s.items.map(c => `
            <div class="client">
              <div class="client-main">
                <strong>${esc(c.nombre)}</strong>
                <small>${c.monto ? money(c.monto) + " · " : ""}${esc(c.fuente || "")}${c.nota ? " · " + esc(c.nota) : ""}</small>
              </div>
              <select class="stage-select" data-stage="${c.id}">
                ${CLIENT_STAGES.map(st => `<option value="${st.id}" ${st.id === c.etapa ? "selected" : ""}>${st.label}</option>`).join("")}
              </select>
              <button class="icon-btn" data-del-client="${c.id}" aria-label="Borrar">✕</button>
            </div>`).join("")}
        </section>`).join("")
        : '<section class="card"><p class="muted">Todavía no cargaste prospectos. Cada vez que alguien te pregunte por una web, anotalo acá aunque no esté decidido: ahí es donde se pierden los trabajos.</p></section>'}

      ${topFuentes.length ? `
        <section class="card">
          <div class="card-head"><h2>De dónde salen tus clientes</h2></div>
          ${topFuentes.map(([f, n]) => `
            <div class="source-row">
              <span>${esc(f)}</span>
              <div class="source-bar"><i style="width:${(n / topFuentes[0][1]) * 100}%"></i></div>
              <strong>${n}</strong>
            </div>`).join("")}
          <p class="dataset-note">Con unos meses de datos vas a ver dónde conviene poner la energía. Facturado hasta ahora: <strong>${money(facturado)}</strong>.</p>
        </section>` : ""}
    `;
  },

  /* ---------- contenido ---------- */
  vistaContenido(cont, pendientes) {
    const idea = CONTENT_PROMPTS[new Date().getDate() % CONTENT_PROMPTS.length];
    return `
      <section class="card accent-gold">
        <div class="card-head"><h2>💡 Idea de hoy</h2></div>
        <p class="idea-text">${esc(idea)}</p>
        <button id="usar-idea" class="btn ghost">Usar esta idea</button>
      </section>

      <section class="card">
        <div class="card-head"><h2>Nueva pieza</h2></div>
        <input id="ct-titulo" type="text" placeholder="De qué se trata" maxlength="120" />
        <div class="form-grid">
          <select id="ct-formato">${CONTENT_FORMATS.map(f => `<option>${f}</option>`).join("")}</select>
          <select id="ct-estado">${CONTENT_STATES.map(s => `<option value="${s.id}">${s.label}</option>`).join("")}</select>
        </div>
        <button id="ct-add" class="btn primary full">Agregar</button>
      </section>

      ${pendientes.length ? `
        <section class="card">
          <div class="card-head"><h2>En proceso</h2><span class="chip">${pendientes.length}</span></div>
          ${pendientes.map(c => `
            <div class="content-item">
              <div class="content-main">
                <strong>${esc(c.titulo)}</strong>
                <small><span class="dot" style="background:${this.estadoC(c.estado).color}"></span>${esc(c.formato)}</small>
              </div>
              <select class="stage-select" data-content-state="${c.id}">
                ${CONTENT_STATES.map(s => `<option value="${s.id}" ${s.id === c.estado ? "selected" : ""}>${s.label}</option>`).join("")}
              </select>
              <button class="icon-btn" data-del-content="${c.id}" aria-label="Borrar">✕</button>
            </div>`).join("")}
        </section>` : '<section class="card"><p class="muted">No tenés nada en proceso. Anotá tres ideas ahora aunque no las grabes hoy: tener la lista llena es lo que evita el bloqueo del lunes.</p></section>'}

      ${this.cardPublicados(cont)}
    `;
  },

  cardPublicados(cont) {
    const meses = {};
    cont.filter(c => c.estado === "publicado" && c.fechaPub)
      .forEach(c => { const mk = c.fechaPub.slice(0, 7); meses[mk] = (meses[mk] || 0) + 1; });
    const lista = Object.entries(meses).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 6);
    if (!lista.length) return "";
    return `<section class="card">
      <div class="card-head"><h2>Publicado</h2></div>
      ${lista.map(([mk, n]) => `<div class="source-row">
        <span>${monthName(mk)}</span>
        <div class="source-bar"><i class="gold" style="width:${(n / lista[0][1]) * 100}%"></i></div>
        <strong>${n}</strong>
      </div>`).join("")}
      <p class="dataset-note">Publicar seguido importa más que publicar perfecto. Dos por semana sostenidas le ganan a diez en un día y después un mes en blanco.</p>
    </section>`;
  },

  /* ---------- interacción ---------- */
  setup() {
    const host = $("view-host");

    host.addEventListener("click", e => {
      const t = e.target.closest("[data-tab]");
      if (t) { this.tab = t.dataset.tab; refresh("work"); return; }
      const dc = e.target.closest("[data-del-client]");
      if (dc) { Store.set("clients", this.clientes().filter(c => c.id !== dc.dataset.delClient)); refresh("work"); return; }
      const dct = e.target.closest("[data-del-content]");
      if (dct) { Store.set("content", this.contenido().filter(c => c.id !== dct.dataset.delContent)); refresh("work"); return; }
    });

    host.addEventListener("change", e => {
      const s = e.target.closest("[data-stage]");
      if (s) {
        Store.update("clients", arr => {
          const c = arr.find(x => x.id === s.dataset.stage);
          if (c) { c.etapa = s.value; if (s.value === "entregado") c.entregado = today(); }
          return arr;
        }, []);
        refresh("work");
        return;
      }
      const cs = e.target.closest("[data-content-state]");
      if (cs) {
        Store.update("content", arr => {
          const c = arr.find(x => x.id === cs.dataset.contentState);
          if (c) { c.estado = cs.value; if (cs.value === "publicado") c.fechaPub = today(); }
          return arr;
        }, []);
        if (cs.value === "publicado") toast("Publicado ✓ Una más para el mes.");
        refresh("work");
      }
    });

    $("cl-add")?.addEventListener("click", () => {
      const nombre = $("cl-nombre").value.trim();
      if (!nombre) { toast("Poné al menos el nombre.", "warn"); return; }
      Store.update("clients", arr => {
        arr.push({
          id: uid(), nombre, monto: parseFloat($("cl-monto").value) || 0,
          fuente: $("cl-fuente").value, etapa: $("cl-etapa").value,
          nota: $("cl-nota").value.trim(), creado: today()
        });
        return arr;
      }, []);
      refresh("work");
      toast("Prospecto agregado.");
    });

    $("ct-add")?.addEventListener("click", () => {
      const titulo = $("ct-titulo").value.trim();
      if (!titulo) { toast("Escribí de qué se trata.", "warn"); return; }
      Store.update("content", arr => {
        arr.push({
          id: uid(), titulo, formato: $("ct-formato").value,
          estado: $("ct-estado").value, creado: today(),
          fechaPub: $("ct-estado").value === "publicado" ? today() : null
        });
        return arr;
      }, []);
      refresh("work");
      toast("Idea guardada.");
    });

    $("usar-idea")?.addEventListener("click", () => {
      const idea = CONTENT_PROMPTS[new Date().getDate() % CONTENT_PROMPTS.length];
      $("ct-titulo").value = idea;
      $("ct-titulo").scrollIntoView({ behavior: "smooth", block: "center" });
      $("ct-titulo").focus();
    });
  }
};

registerModule(Work);
