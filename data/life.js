/* ============================================================
   Wildev OS · Datos de base
   Todo esto es editable desde la app: son los valores con los
   que arranca, no una camisa de fuerza.
   ============================================================ */

/* ---------- Rutina de la mañana ---------- */
const MORNING_ROUTINE = [
  { id: "despertar", icon: "⏰", label: "Levantarme 6:00", detail: "Sin snooze. El celular lejos de la cama.", min: 0 },
  { id: "agua", icon: "💧", label: "Tomar agua", detail: "Dos vasos apenas te levantás: venís de 7-8 horas sin tomar nada.", min: 1 },
  { id: "estirar", icon: "🤸", label: "Estirar", detail: "5 minutos: cuello, hombros, cadera, isquiotibiales.", min: 5 },
  { id: "leer-am", icon: "📖", label: "Leer unos párrafos", detail: "Meditaciones, de Marco Aurelio. Un pasaje alcanza.", min: 10 },
  { id: "ducha", icon: "🚿", label: "Ducharme", detail: "Terminá con 30 segundos de agua fría si te animás.", min: 10 },
  { id: "plan", icon: "🎯", label: "Elegir las 3 del día", detail: "Las tres cosas que si las hacés, el día ya fue bueno.", min: 5 }
];

/* ---------- Rutina de la noche ---------- */
const EVENING_ROUTINE = [
  { id: "cierre", icon: "✅", label: "Cerrar el trabajo", detail: "Dejá anotado por dónde seguís mañana. La cabeza descansa mejor.", min: 5 },
  { id: "pantallas", icon: "📵", label: "Soltar las pantallas", detail: "Una hora antes de dormir. Es lo que más mejora el sueño.", min: 0 },
  { id: "leer-pm", icon: "📖", label: "Leer antes de dormir", detail: "Meditaciones u otro libro. Papel mejor que pantalla.", min: 15 },
  { id: "reflexion", icon: "🌙", label: "Repaso del día", detail: "Qué salió bien, qué mejorar mañana. Dos líneas.", min: 3 },
  { id: "dormir", icon: "😴", label: "A dormir 22:30", detail: "Dormir bien es lo que sostiene todo lo demás.", min: 0 }
];

/* ---------- Hábitos que se miden todos los días ---------- */
const DEFAULT_HABITS = [
  { id: "despertar6", icon: "⏰", label: "Levantarme 6:00", pilar: "disciplina", activo: true },
  { id: "agua", icon: "💧", label: "2 litros de agua", pilar: "cuerpo", activo: true },
  { id: "ejercicio", icon: "💪", label: "Entrenar", pilar: "cuerpo", activo: true, auto: "body" },
  { id: "lectura", icon: "📖", label: "Leer", pilar: "mente", activo: true, auto: "reading" },
  { id: "foco", icon: "🎯", label: "Un bloque de foco sin distracciones", pilar: "trabajo", activo: true, auto: "focus" },
  { id: "contenido", icon: "📱", label: "Crear contenido", pilar: "trabajo", activo: true },
  { id: "familia", icon: "👨‍👩‍👧", label: "Tiempo real con la familia", pilar: "familia", activo: true,
    detalle: "Sin celular en la mano. Que te vean presente, no al lado." },
  { id: "sinredes", icon: "🚫", label: "Nada de scroll sin sentido", pilar: "disciplina", activo: true }
];

/* ---------- Los pilares: para qué es todo esto ---------- */
const PILARES = [
  { id: "cuerpo", icon: "💪", label: "Cuerpo", color: "#91e358",
    porque: "Mantenerme sano y fuerte. No es vanidad: es energía para trabajar y para jugar con mi familia." },
  { id: "mente", icon: "🧠", label: "Mente", color: "#4ea0ef",
    porque: "Leer, pensar claro y sostener la seguridad en mí mismo. Sentirme bien conmigo." },
  { id: "trabajo", icon: "🚀", label: "Trabajo", color: "#f1b541",
    porque: "Terminar lo que empiezo, crear contenido, conseguir clientes y encontrar eso que me apasione." },
  { id: "familia", icon: "❤️", label: "Familia", color: "#e63b64",
    porque: "Ser el mejor padre y esposo. Todo lo demás existe para esto." },
  { id: "disciplina", icon: "⚡", label: "Disciplina", color: "#b06ef0",
    porque: "Hacer lo que dije que iba a hacer, tenga ganas o no. Es de donde sale la confianza." }
];

/* ---------- Metas grandes ---------- */
const DEFAULT_GOALS = [
  { id: "g-auto", icon: "🚗", nombre: "Auto", objetivo: 0, ahorrado: 0, fecha: "", nota: "Poné el monto que calculás que necesitás." },
  { id: "g-casa", icon: "🏠", nombre: "Casa", objetivo: 0, ahorrado: 0, fecha: "", nota: "Anticipo o total, como lo estés pensando." },
  { id: "g-viaje", icon: "✈️", nombre: "Viaje en familia", objetivo: 0, ahorrado: 0, fecha: "", nota: "" },
  { id: "g-mudanza", icon: "🌎", nombre: "Mudarnos de país", objetivo: 0, ahorrado: 0, fecha: "", nota: "Pasajes, papeles y unos meses de colchón." }
];

/* ---------- Tipos de ingreso ---------- */
const INCOME_TYPES = [
  { id: "sueldo", label: "Sueldo", icon: "🏢", fijo: true },
  { id: "freelance", label: "Proyecto freelance", icon: "💻", fijo: false },
  { id: "recurrente", label: "Mantenimiento mensual", icon: "🔁", fijo: true },
  { id: "otro", label: "Otro", icon: "✨", fijo: false }
];

/* ---------- Estados de un cliente / prospecto ---------- */
const CLIENT_STAGES = [
  { id: "contacto", label: "Contacto", color: "#8a8a8a", orden: 0 },
  { id: "conversando", label: "Conversando", color: "#4ea0ef", orden: 1 },
  { id: "propuesta", label: "Propuesta enviada", color: "#f1b541", orden: 2 },
  { id: "ganado", label: "Cerrado", color: "#91e358", orden: 3 },
  { id: "activo", label: "En desarrollo", color: "#b06ef0", orden: 4 },
  { id: "entregado", label: "Entregado", color: "#6fbf3f", orden: 5 },
  { id: "perdido", label: "No salió", color: "#e63b64", orden: 6 }
];

const CLIENT_SOURCES = ["Instagram", "Recomendación", "WhatsApp", "LinkedIn", "Conocido", "Web", "Otro"];

/* ---------- Contenido para redes ---------- */
const CONTENT_STATES = [
  { id: "idea", label: "Idea", color: "#8a8a8a" },
  { id: "guion", label: "Guionando", color: "#4ea0ef" },
  { id: "grabado", label: "Grabado", color: "#f1b541" },
  { id: "editado", label: "Editado", color: "#b06ef0" },
  { id: "publicado", label: "Publicado", color: "#91e358" }
];

const CONTENT_FORMATS = ["Reel", "Carrusel", "Historia", "Post", "Video largo", "Artículo"];

// Arranques de idea para cuando no se te ocurre qué publicar.
const CONTENT_PROMPTS = [
  "Un antes y después de una web que hiciste (sin nombrar al cliente si no te dio permiso).",
  "El error más común que ves en las webs de negocios chicos.",
  "Cuánto tarda realmente una web y por qué.",
  "Mostrá cómo armás algo en vivo: 60 segundos de pantalla.",
  "Respondé una pregunta que te hizo un cliente esta semana.",
  "Por qué una web propia le gana a vivir solo de Instagram.",
  "Tu setup y cómo trabajás.",
  "Una herramienta que usás todos los días y por qué.",
  "Un problema que resolviste esta semana y cómo.",
  "Qué mirar antes de contratar a alguien para que te haga la web."
];

/* ---------- Lectura ---------- */
const DEFAULT_BOOKS = [
  { id: "meditaciones", titulo: "Meditaciones", autor: "Marco Aurelio", activo: true,
    nota: "Mañana y noche. No es para leerlo rápido: un pasaje por vez." }
];

/* ---------- Preguntas del repaso diario ---------- */
const REFLECTION_PROMPTS = [
  { id: "bien", label: "¿Qué salió bien hoy?", placeholder: "Aunque sea una sola cosa." },
  { id: "mejorar", label: "¿Qué haría distinto?", placeholder: "Sin castigarte: solo qué cambiarías." },
  { id: "manana", label: "¿Lo primero de mañana?", placeholder: "Una sola cosa, la más importante." }
];

/* ---------- Recordatorios ----------
   dias: 0 = domingo … 6 = sábado. vista = a dónde lleva al tocarla. */
const DEFAULT_REMINDERS = [
  { id: "r-despertar", titulo: "6:00 · Arranca el día", cuerpo: "Agua, estirar y unos párrafos. Veinte minutos y ya ganaste la mañana.", hora: "06:00", dias: [1, 2, 3, 4, 5], activo: true, vista: "today" },
  { id: "r-tres", titulo: "Elegí las 3 del día", cuerpo: "Tres cosas. Si las hacés, el día ya valió.", hora: "07:00", dias: [1, 2, 3, 4, 5], activo: true, vista: "today" },
  { id: "r-foco", titulo: "Primer bloque de foco", cuerpo: "50 minutos sin celular. Lo difícil es arrancar, no seguir.", hora: "09:00", dias: [1, 2, 3, 4, 5], activo: true, vista: "focus" },
  { id: "r-contenido", titulo: "Contenido para redes", cuerpo: "Una pieza hoy son clientes en seis meses.", hora: "12:00", dias: [1, 3, 5], activo: true, vista: "work" },
  { id: "r-entrenar", titulo: "Hora de entrenar", cuerpo: "Dejá el escritorio. El cuerpo sostiene todo lo demás.", hora: "18:00", dias: [1, 3, 5], activo: true, vista: "body" },
  { id: "r-familia", titulo: "Guardá el celular", cuerpo: "Tiempo con tu familia. Presente de verdad, no al lado.", hora: "20:00", dias: [0, 1, 2, 3, 4, 5, 6], activo: true, vista: "today" },
  { id: "r-cierre", titulo: "Cerrá el día", cuerpo: "Anotá por dónde seguís mañana y hacé el repaso.", hora: "21:30", dias: [1, 2, 3, 4, 5], activo: true, vista: "mind" },
  { id: "r-leer", titulo: "Leer antes de dormir", cuerpo: "Meditaciones. Un pasaje alcanza.", hora: "22:00", dias: [0, 1, 2, 3, 4, 5, 6], activo: true, vista: "mind" }
];

const DIAS_CORTOS = ["D", "L", "M", "M", "J", "V", "S"];

/* ---------- Esfuerzo del día (suma calorías en Cuerpo) ----------
   El nivel de actividad del perfil cuenta solo la vida diaria;
   el entrenamiento se suma el día que lo hacés, así un día sin
   entrenar come menos y nada se cuenta dos veces. */
const TRAINING_TYPES = [
  { id: "none", short: "Sin entrenar", label: "No entrené", kcal: 0, icon: "🛋️" },
  { id: "light", short: "Suave", label: "Movimiento suave", kcal: 120, icon: "🚶" },
  { id: "cardio", short: "Cardio", label: "Cardio o bici", kcal: 250, icon: "🚴" },
  { id: "strength", short: "Fuerza", label: "Entrenamiento de fuerza", kcal: 320, icon: "💪" },
  { id: "sport", short: "Partido", label: "Softbol o deporte", kcal: 480, icon: "🥎" }
];

/* ---------- Duraciones de foco ---------- */
const FOCUS_PRESETS = [
  { min: 25, label: "25 min", detail: "Pomodoro clásico. Bueno para arrancar cuando no tenés ganas." },
  { min: 50, label: "50 min", detail: "Trabajo profundo. El que más rinde para programar." },
  { min: 90, label: "90 min", detail: "Bloque largo. Solo con el celular en otra habitación." }
];

const BREAK_MIN = { 25: 5, 50: 10, 90: 20 };
