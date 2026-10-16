/* ============================================================
   Base de alimentos
   Cada alimento guarda sus macros por una cantidad de referencia
   (gBase, casi siempre 100 g o 100 ml). Con eso la app calcula
   cualquier cantidad: si cargás 125 g, escala solo.
   measures = formas de medirlo; la primera es la que aparece por
   defecto. p = proteína, c = carbohidratos, f = grasas (gramos).
   Valores en cocido salvo que se aclare.
   ============================================================ */

const G = { label: "g", g: 1 };
const ML = { label: "ml", g: 1 };

const FOOD_DB = [
  // ---------- Proteínas ----------
  { id: "pollo", group: "Proteínas", name: "Pechuga de pollo (cocida)", gBase: 100, p: 31, c: 0, f: 3.6, measures: [G, { label: "porción (150 g)", g: 150 }], defaultQty: 150 },
  { id: "carne", group: "Proteínas", name: "Carne vacuna magra (cocida)", gBase: 100, p: 28, c: 0, f: 8, measures: [G, { label: "porción (150 g)", g: 150 }], defaultQty: 150 },
  { id: "picada", group: "Proteínas", name: "Carne picada especial (cocida)", gBase: 100, p: 26, c: 0, f: 12, measures: [G], defaultQty: 120 },
  { id: "cerdo", group: "Proteínas", name: "Lomo de cerdo (cocido)", gBase: 100, p: 26, c: 0, f: 5, measures: [G], defaultQty: 150 },
  { id: "merluza", group: "Proteínas", name: "Merluza (cocida)", gBase: 100, p: 22, c: 0, f: 1.5, measures: [G], defaultQty: 150 },
  { id: "atun", group: "Proteínas", name: "Atún al natural (escurrido)", gBase: 100, p: 25, c: 0, f: 1.2, measures: [{ label: "lata (120 g)", g: 120 }, G], defaultQty: 1 },
  { id: "huevo", group: "Proteínas", name: "Huevo entero", gBase: 100, p: 12.6, c: 0.8, f: 10, measures: [{ label: "unidad (50 g)", g: 50 }, G], defaultQty: 2 },
  { id: "clara", group: "Proteínas", name: "Clara de huevo", gBase: 100, p: 11, c: 0.7, f: 0.2, measures: [{ label: "clara (33 g)", g: 33 }, G], defaultQty: 2 },
  { id: "whey", group: "Proteínas", name: "Proteína whey", gBase: 100, p: 80, c: 10, f: 5, measures: [{ label: "scoop (30 g)", g: 30 }, G], defaultQty: 1 },

  // ---------- Lácteos ----------
  { id: "yogur", group: "Lácteos", name: "Yogur descremado", gBase: 100, p: 4, c: 6, f: 0.2, measures: [{ label: "pote (200 g)", g: 200 }, G], defaultQty: 1 },
  { id: "leche", group: "Lácteos", name: "Leche descremada", gBase: 100, p: 3.4, c: 5, f: 0.1, measures: [{ label: "vaso (250 ml)", g: 250 }, ML], defaultQty: 1 },
  { id: "queso", group: "Lácteos", name: "Queso magro (port salut light)", gBase: 100, p: 23, c: 1.7, f: 13, measures: [{ label: "feta (30 g)", g: 30 }, G], defaultQty: 1 },
  { id: "ricota", group: "Lácteos", name: "Ricota descremada", gBase: 100, p: 11, c: 4, f: 3, measures: [G, { label: "cda (25 g)", g: 25 }], defaultQty: 100 },

  // ---------- Carbohidratos ----------
  { id: "arroz", group: "Carbohidratos", name: "Arroz blanco (cocido)", gBase: 100, p: 2.7, c: 28, f: 0.3, measures: [G, { label: "taza (160 g)", g: 160 }], defaultQty: 150 },
  { id: "fideos", group: "Carbohidratos", name: "Fideos (cocidos)", gBase: 100, p: 5.8, c: 31, f: 0.9, measures: [G, { label: "plato (200 g)", g: 200 }], defaultQty: 150 },
  { id: "papa", group: "Carbohidratos", name: "Papa (hervida)", gBase: 100, p: 1.9, c: 20, f: 0.1, measures: [G, { label: "unidad mediana (150 g)", g: 150 }], defaultQty: 150 },
  { id: "batata", group: "Carbohidratos", name: "Batata (hervida)", gBase: 100, p: 1.4, c: 20, f: 0.1, measures: [G], defaultQty: 150 },
  { id: "polenta", group: "Carbohidratos", name: "Polenta (cocida)", gBase: 100, p: 1.6, c: 15, f: 0.3, measures: [G], defaultQty: 200 },
  { id: "avena", group: "Carbohidratos", name: "Avena (cruda)", gBase: 100, p: 13.2, c: 67.7, f: 6.5, measures: [G, { label: "cda (15 g)", g: 15 }], defaultQty: 40 },
  { id: "pan", group: "Carbohidratos", name: "Pan francés", gBase: 100, p: 8.5, c: 50, f: 1.5, measures: [{ label: "pan (60 g)", g: 60 }, G], defaultQty: 1 },
  { id: "panint", group: "Carbohidratos", name: "Pan integral", gBase: 100, p: 12, c: 44, f: 4, measures: [{ label: "rebanada (25 g)", g: 25 }, G], defaultQty: 2 },
  { id: "galletas", group: "Carbohidratos", name: "Galletas de arroz", gBase: 100, p: 8, c: 81, f: 3, measures: [{ label: "unidad (9 g)", g: 9 }, G], defaultQty: 3 },
  { id: "lentejas", group: "Carbohidratos", name: "Lentejas (cocidas)", gBase: 100, p: 9, c: 20, f: 0.4, measures: [G, { label: "taza (200 g)", g: 200 }], defaultQty: 150 },
  { id: "garbanzos", group: "Carbohidratos", name: "Garbanzos (cocidos)", gBase: 100, p: 8.9, c: 27, f: 2.6, measures: [G], defaultQty: 150 },
  { id: "banana", group: "Carbohidratos", name: "Banana", gBase: 100, p: 1.1, c: 23, f: 0.3, measures: [{ label: "unidad mediana (120 g)", g: 120 }, G], defaultQty: 1 },
  { id: "manzana", group: "Carbohidratos", name: "Manzana", gBase: 100, p: 0.3, c: 14, f: 0.2, measures: [{ label: "unidad (180 g)", g: 180 }, G], defaultQty: 1 },
  { id: "miel", group: "Carbohidratos", name: "Miel", gBase: 100, p: 0.3, c: 82, f: 0, measures: [{ label: "cda (21 g)", g: 21 }, G], defaultQty: 1 },
  { id: "verduras", group: "Carbohidratos", name: "Verduras / ensalada mixta", gBase: 100, p: 1.5, c: 6, f: 0.2, measures: [G], defaultQty: 200 },

  // ---------- Grasas ----------
  { id: "aceite", group: "Grasas", name: "Aceite de oliva", gBase: 100, p: 0, c: 0, f: 100, measures: [{ label: "cda (14 ml)", g: 14 }, ML], defaultQty: 1 },
  { id: "palta", group: "Grasas", name: "Palta", gBase: 100, p: 2, c: 8.5, f: 15, measures: [G, { label: "media palta (100 g)", g: 100 }], defaultQty: 50 },
  { id: "mani", group: "Grasas", name: "Maní tostado", gBase: 100, p: 25, c: 16, f: 50, measures: [G, { label: "puñado (30 g)", g: 30 }], defaultQty: 30 },
  { id: "pasta-mani", group: "Grasas", name: "Pasta de maní", gBase: 100, p: 25, c: 20, f: 50, measures: [{ label: "cda (16 g)", g: 16 }, G], defaultQty: 1 },
  { id: "nueces", group: "Grasas", name: "Nueces", gBase: 100, p: 15, c: 14, f: 65, measures: [G, { label: "puñado (30 g)", g: 30 }], defaultQty: 30 }
];

const MEALS = ["Desayuno", "Almuerzo", "Merienda", "Cena", "Pre/post entreno", "Snack"];

const ACTIVITY_LEVELS = [
  { value: 1.375, label: "Ligero (1-3 días de ejercicio)" },
  { value: 1.55, label: "Moderado (3-5 días) — tu semana actual" },
  { value: 1.725, label: "Alto (6-7 días intensos)" }
];

// Factor por el que se multiplican los macros de referencia.
function foodFactor(food, qty, measure) {
  const m = measure || (food.measures || [G])[0];
  return (qty * (m.g || 1)) / (food.gBase || 1);
}
function foodMacros(food, qty, measure) {
  const k = foodFactor(food, qty, measure);
  return { p: food.p * k, c: food.c * k, f: food.f * k };
}
const macrosKcal = ({ p, c, f }) => Math.round(p * 4 + c * 4 + f * 9);
const kcalOf = (food, qty, measure) => macrosKcal(foodMacros(food, qty, measure));
