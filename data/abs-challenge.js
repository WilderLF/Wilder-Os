/* ============================================================
   Reto abdominal de 10 minutos · 28 días
   Rutina original de Athlean-X (Jeff Cavaliere).
   10 ejercicios seguidos. Según el nivel:
     Principiante  30 s de trabajo / 30 s de descanso
     Intermedio    40 s / 20 s
     Avanzado      50 s / 10 s
   Las animaciones del catálogo son aproximaciones: el movimiento
   exacto conviene verlo en el video original.
   ============================================================ */

const ABS_LEVELS = {
  beginner: { key: "beginner", label: "Principiante", work: 30, rest: 30 },
  intermediate: { key: "intermediate", label: "Intermedio", work: 40, rest: 20 },
  advanced: { key: "advanced", label: "Avanzado", work: 50, rest: 10 }
};

const ABS_CHALLENGE_DAYS = 28;

// zona: qué parte del abdomen trabaja preferentemente
const ABS_EXERCISES = [
  {
    name: "Flexiones de péndulo", zona: "Abdomen inferior",
    query: "reverse crunch",
    note: "Boca arriba, piernas levantadas. Llevá la pelvis hacia el pecho despegando la cola del piso y bajá controlado, como un péndulo. El movimiento viene del abdomen, no del impulso de las piernas."
  },
  {
    name: "Grapevines (izquierda)", zona: "Oblicuos",
    query: "oblique crunches floor",
    note: "Trabajo de oblicuos del lado izquierdo: llevá el tronco y la pierna a cruzarse con rotación, sin tirar del cuello."
  },
  {
    name: "Grapevines (derecha)", zona: "Oblicuos",
    query: "oblique crunches floor",
    note: "Mismo movimiento hacia el lado derecho. Mantené el mismo ritmo que del otro lado."
  },
  {
    name: "Crunch canoa", zona: "Oblicuos y abdomen superior",
    query: "alternate heel touchers",
    note: "Hombros despegados del piso: llevá las manos hacia un talón y al otro, como remando una canoa. No apoyes la cabeza entre repeticiones."
  },
  {
    name: "Crunches de arquero (izquierda)", zona: "Abdomen superior y oblicuos",
    query: "cross body crunch",
    note: "Un brazo se estira como tensando un arco mientras el tronco sube en diagonal hacia la izquierda."
  },
  {
    name: "Crunches de arquero (derecha)", zona: "Abdomen superior y oblicuos",
    query: "cross body crunch",
    note: "Mismo movimiento hacia la derecha."
  },
  {
    name: "Cruce elevado", zona: "Abdomen completo",
    query: "russian twist",
    note: "Tronco elevado y piernas sin apoyar: cruzá de un lado al otro manteniendo la tensión todo el tiempo. Si te cuesta, apoyá los talones."
  },
  {
    name: "Plancha oscilando en 4 puntos", zona: "Core completo",
    query: "", mediaDisabled: true,
    note: "En plancha sobre antebrazos y puntas de pie: mecé el cuerpo adelante y atrás como un bloque, sin que la cadera suba ni se hunda."
  },
  {
    name: "Plancha con toque", zona: "Core y antirrotación",
    query: "shoulder tap",
    note: "En plancha alta, tocá el hombro contrario con una mano alternando. La cadera no debe girar: abrí un poco los pies para estar más estable."
  },
  {
    name: "Elevaciones Superman", zona: "Espalda baja y glúteos",
    query: "", mediaDisabled: true,
    note: "Boca abajo, brazos estirados adelante: levantá brazos, pecho y piernas a la vez y sostené un segundo arriba. Equilibra todo el trabajo de abdomen anterior."
  }
];

// Ejercicios de abdomen de las rutinas normales que el reto reemplaza.
const ABS_REPLACES = [
  "Elevación de rodillas colgado",
  "Elevación de rodillas con giro",
  "Dead bug",
  "Mountain climbers",
  "Plancha lateral"
];

// Devuelve la sesión del reto para el nivel indicado.
function buildAbsSession(levelKey = "beginner") {
  const lvl = ABS_LEVELS[levelKey] || ABS_LEVELS.beginner;
  return {
    label: "Reto abdominal",
    title: "Reto abdominal · 10 minutos",
    duration: "10 min",
    intensity: "Alta",
    goal: `Los 10 ejercicios seguidos: ${lvl.work} segundos de trabajo y ${lvl.rest} de descanso (nivel ${lvl.label.toLowerCase()}). La app te cronometra cada bloque.`,
    slot: "abs",
    place: "Donde estés",
    isAbs: true,
    exercises: ABS_EXERCISES.map(e => ({
      name: e.name,
      sets: 1,
      reps: `${lvl.work} s`,
      rest: lvl.rest,
      workSeconds: lvl.work,
      datasetQuery: e.query,
      mediaDisabled: !!e.mediaDisabled,
      note: `${e.zona}. ${e.note}`
    }))
  };
}
