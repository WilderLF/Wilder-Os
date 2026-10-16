/* ============================================================
   DINERO · ingresos, gastos y las metas grandes
   No es una app de contabilidad: es para ver si el mes cierra
   y cuánto falta para el auto, la casa y la mudanza.
   ============================================================ */

const Money = {
  id: "money",

  movimientos() { return Store.get("money-moves", []); },
  metas() { return Store.get("goals", null) || DEFAULT_GOALS; },

  delMes(mk = monthKey()) { return this.movimientos().filter(m => (m.fecha || "").startsWith(mk)); },
  ingresosMes(mk) { return this.delMes(mk).filter(m => m.tipo !== "gasto").reduce((a, m) => a + m.monto, 0); },
  gastosMes(mk) { return this.delMes(mk).filter(m => m.tipo === "gasto").reduce((a, m) => a + m.monto, 0); },

  mesesConDatos() {
    const s = new Set(this.movimientos().map(m => (m.fecha || "").slice(0, 7)).filter(Boolean));
    return [...s].sort().reverse();
  },

  promedioIngresos(n = 3) {
    const meses = this.mesesConDatos().slice(0, n);
    if (!meses.length) return 0;
    return meses.reduce((a, mk) => a + this.ingresosMes(mk), 0) / meses.length;
  },

  totalAhorrado() { return this.metas().reduce((a, g) => a + (g.ahorrado || 0), 0); },

  /* ---------- pantalla ---------- */
  render() {
    const mk = monthKey();
    const ing = this.ingresosMes(mk);
    const gas = this.gastosMes(mk);
    const balance = ing - gas;
    const prom = this.promedioIngresos();

    return `
      <div class="hero compact">
        <p class="eyebrow">${monthName(mk)}</p>
        <h1>${money(balance)}</h1>
        <p class="muted">${balance >= 0 ? "de diferencia este mes" : "en rojo este mes"}${prom > 0 ? ` · promedio de ingresos: ${money(prom)}` : ""}</p>
        <div class="stat-row">
          <div class="mini-stat"><strong class="verde">${money(ing)}</strong><span>entró</span></div>
          <div class="mini-stat"><strong class="rojo">${money(gas)}</strong><span>salió</span></div>
          <div class="mini-stat"><strong>${money(this.totalAhorrado())}</strong><span>ahorrado</span></div>
        </div>
      </div>

      ${this.cardMetas()}
      ${this.cardCargar()}
      ${this.cardMes(mk)}
      ${this.cardHistorial()}
    `;
  },

  cardMetas() {
    const metas = this.metas();
    const prom = this.promedioIngresos();
    return `<section class="card accent-green">
      <div class="card-head"><h2>🎯 Metas</h2></div>
      ${metas.map(g => {
        const pct = g.objetivo > 0 ? Math.min(100, Math.round((g.ahorrado / g.objetivo) * 100)) : 0;
        const falta = Math.max(0, (g.objetivo || 0) - (g.ahorrado || 0));
        // Con cuánto guarda por mes, cuántos meses faltan
        let eta = "";
        if (g.objetivo > 0 && g.porMes > 0 && falta > 0) {
          const meses = Math.ceil(falta / g.porMes);
          const d = new Date(); d.setMonth(d.getMonth() + meses);
          eta = `A ${money(g.porMes)} por mes llegás en ${plural(meses, "mes", "meses")} (${monthName(monthKey(d))}).`;
        } else if (g.objetivo > 0 && falta === 0) {
          eta = "¡Llegaste! 🎉";
        }
        return `<div class="goal">
          <div class="goal-head">
            <span class="goal-icon">${g.icon}</span>
            <div class="goal-title"><strong>${esc(g.nombre)}</strong>
              <small>${g.objetivo > 0 ? `${money(g.ahorrado)} de ${money(g.objetivo)}` : "Sin monto definido"}</small></div>
            <span class="goal-pct">${g.objetivo > 0 ? pct + "%" : ""}</span>
          </div>
          <div class="goal-track"><i style="width:${pct}%"></i></div>
          ${eta ? `<p class="goal-eta">${esc(eta)}</p>` : `<p class="goal-eta muted">${esc(g.nota || "Definí el monto para ver cuánto falta.")}</p>`}
          <details class="sub-details">
            <summary>Editar</summary>
            <div class="form-grid">
              <label class="label-mini">Objetivo<input type="number" inputmode="numeric" data-goal-field="objetivo" data-goal="${g.id}" value="${g.objetivo || ""}" /></label>
              <label class="label-mini">Ahorrado<input type="number" inputmode="numeric" data-goal-field="ahorrado" data-goal="${g.id}" value="${g.ahorrado || ""}" /></label>
            </div>
            <label class="label-mini">Cuánto podés guardar por mes<input type="number" inputmode="numeric" data-goal-field="porMes" data-goal="${g.id}" value="${g.porMes || ""}" /></label>
          </details>
        </div>`;
      }).join("")}
      ${prom > 0 ? `<p class="dataset-note">Guardando el 20% de ${money(prom)} serían ${money(prom * 0.2)} por mes.</p>` : ""}
    </section>`;
  },

  cardCargar() {
    return `<section class="card">
      <div class="card-head"><h2>Cargar movimiento</h2></div>
      <div class="seg-row">
        <button class="seg active" data-mov-tipo="ingreso">Entró</button>
        <button class="seg" data-mov-tipo="gasto">Salió</button>
      </div>
      <div class="form-grid">
        <input id="mv-monto" type="number" inputmode="decimal" placeholder="Monto" />
        <input id="mv-fecha" type="date" value="${today()}" />
      </div>
      <input id="mv-detalle" type="text" placeholder="Detalle (ej: web panadería, alquiler)" maxlength="80" />
      <select id="mv-cat">${INCOME_TYPES.map(t => `<option value="${t.id}">${t.icon} ${t.label}</option>`).join("")}</select>
      <button id="mv-add" class="btn primary full">Guardar</button>
    </section>`;
  },

  cardMes(mk) {
    const movs = this.delMes(mk).sort((a, b) => b.fecha.localeCompare(a.fecha));
    if (!movs.length) return `<section class="card"><p class="muted">Sin movimientos este mes. Cargá el sueldo y los proyectos a medida que cobres: con tres meses ya se ve el patrón.</p></section>`;
    return `<section class="card">
      <div class="card-head"><h2>Movimientos del mes</h2><span class="chip">${movs.length}</span></div>
      ${movs.map(m => `<div class="mov ${m.tipo === "gasto" ? "gasto" : "ingreso"}">
        <div class="mov-main"><strong>${esc(m.detalle || "Sin detalle")}</strong><small>${shortDate(m.fecha)}</small></div>
        <span class="mov-monto">${m.tipo === "gasto" ? "−" : "+"}${money(m.monto)}</span>
        <button class="icon-btn" data-del-mov="${m.id}" aria-label="Borrar">✕</button>
      </div>`).join("")}
    </section>`;
  },

  cardHistorial() {
    const meses = this.mesesConDatos().slice(0, 6).reverse();
    if (meses.length < 2) return "";
    const max = Math.max(...meses.map(mk => this.ingresosMes(mk)), 1);
    return `<section class="card">
      <div class="card-head"><h2>Ingresos por mes</h2></div>
      <div class="bars">
        ${meses.map(mk => {
          const i = this.ingresosMes(mk), g = this.gastosMes(mk);
          return `<div class="bar-col">
            <div class="bar-stack">
              <i class="b-ing" style="height:${(i / max) * 100}%" title="${money(i)}"></i>
              <i class="b-gas" style="height:${(g / max) * 100}%" title="${money(g)}"></i>
            </div>
            <span>${mk.slice(5)}</span>
          </div>`;
        }).join("")}
      </div>
      <p class="chart-legend"><span class="lg-ing"></span>Entró<span class="lg-gas"></span>Salió</p>
    </section>`;
  },

  /* ---------- interacción ---------- */
  setup() {
    const host = $("view-host");
    let tipo = "ingreso";

    host.addEventListener("click", e => {
      const seg = e.target.closest("[data-mov-tipo]");
      if (seg) {
        tipo = seg.dataset.movTipo;
        $$(".seg").forEach(s => s.classList.toggle("active", s === seg));
        return;
      }
      const d = e.target.closest("[data-del-mov]");
      if (d) { Store.set("money-moves", this.movimientos().filter(m => m.id !== d.dataset.delMov)); refresh("money"); return; }
    });

    host.addEventListener("change", e => {
      const g = e.target.closest("[data-goal]");
      if (!g) return;
      const valor = parseFloat(g.value) || 0;
      const metas = structuredClone(this.metas());
      const meta = metas.find(x => x.id === g.dataset.goal);
      if (meta) { meta[g.dataset.goalField] = valor; Store.set("goals", metas); refresh("money"); }
    });

    $("mv-add")?.addEventListener("click", () => {
      const monto = parseFloat($("mv-monto").value);
      if (!(monto > 0)) { toast("Poné un monto.", "warn"); return; }
      Store.update("money-moves", arr => {
        arr.push({
          id: uid(), monto, tipo,
          fecha: $("mv-fecha").value || today(),
          detalle: $("mv-detalle").value.trim(),
          cat: $("mv-cat").value
        });
        return arr.slice(-600);
      }, []);
      refresh("money");
      toast(tipo === "gasto" ? "Gasto cargado." : "Ingreso cargado 💪");
    });
  }
};

registerModule(Money);
