const PLAN_META={
 general:{label:'Rendimiento',emoji:'⚡',description:'Full body equilibrado para fuerza, movilidad y rendimiento general.',accent:'#91e358'},
 softball:{label:'Softbol + definición',emoji:'🥎',description:'3 rutinas full body para casa con barra, paralelas y mochila. Definir manteniéndote entre 85 y 90 kg, con trabajo específico para el softbol.',accent:'#e63b64'},
 skate:{label:'Skate',emoji:'🛹',description:'Full body con equilibrio, tobillo, cadera, fuerza unilateral y aterrizajes.',accent:'#4ea0ef'},
 fixie:{label:'Fixie',emoji:'🚲',description:'Full body complementario al ciclismo: cadena posterior, core y movilidad.',accent:'#f1b541'}
};
const ROUTINE_KEYS=['A','B','C'];
const WEEKLY_TARGET=3;
// tipo: qué esfuerzo de TRAINING_TYPES (data/life.js) suma calorías ese día.
// am, pm y main son las sesiones del formato viejo que siguen en el historial.
const SLOT_META={
 A:{icon:'⚡',tipo:'strength'},B:{icon:'⚡',tipo:'strength'},C:{icon:'⚡',tipo:'strength'},
 velocidad:{icon:'🏃',tipo:'cardio'},zona2:{icon:'🚴',tipo:'cardio'},recuperacion:{icon:'🧘',tipo:'light'},partido:{icon:'🥎',tipo:'sport'},
 abs:{icon:'🔥',tipo:'none'},
 am:{tipo:'strength'},pm:{tipo:'strength'},main:{tipo:'strength'}
};

const ex=(name,sets,reps,rest,datasetQuery,note,mediaDisabled=false)=>({name,sets,reps,rest,datasetQuery,note,mediaDisabled});
const session=(label,title,duration,intensity,goal,exercises,extra={})=>({label,title,duration,intensity,goal,exercises,...extra});

const PLANS={
 general:{
  A:session('Full Body A','Fuerza + estabilidad','35-45 min','Media','Construir una base fuerte sin agotarte.',[ex('Sentadilla con mochila',3,'10-15',60,'bodyweight full squat','Piernas y glúteos.'),ex('Flexiones',3,'8-15',60,'push-up body weight','Empuje de tren superior.'),ex('Remo con mochila',3,'10-15',60,'dumbbell bent over row','Espalda y escápulas.'),ex('Zancada hacia atrás',3,'8-10 por pierna',60,'bodyweight rear lunge','Fuerza unilateral.'),ex('Dead bug',3,'10 por lado',30,'dead bug body weight','Core estable.'),ex('Elevación de talones',3,'15-20',30,'standing calf raise body weight','Tobillos y gemelos.')]),
  B:session('Full Body B','Unilateral + rotación','35-45 min','Media','Mejorar control corporal, cadena posterior y rotación.',[ex('Peso muerto con mochila',3,'10-12',60,'dumbbell romanian deadlift','Cadena posterior.'),ex('Pike push up',3,'8-12',60,'pike push-up','Hombros.'),ex('Puente de glúteo a una pierna',3,'8-10 por pierna',45,'single leg glute bridge','Cadera y estabilidad.'),ex('Woodchopper',3,'10 por lado',45,'cable wood chop','Rotación controlada.'),ex('Plancha lateral',3,'25-35s por lado',30,'side plank body weight','Core lateral.'),ex('Wall slides',2,'10-12',30,'scapular wall slide','Movilidad escapular.')]),
  C:session('Full Body C','Potencia controlada + prevención','30-40 min','Media/baja','Estimular todo el cuerpo dejando reserva para el domingo.',[ex('Sentadilla tempo',3,'10',60,'bodyweight full squat','Bajá en 3 segundos.'),ex('Remo con mochila',3,'12',60,'dumbbell bent over row','Espalda.'),ex('Flexiones',3,'8-12',60,'push-up body weight','Empuje.'),ex('Skaters laterales controlados',2,'8 por lado',45,'skater hops','Potencia lateral sin máximo esfuerzo.'),ex('Bird dog',3,'10 por lado',30,'bird dog body weight','Core y lumbar.'),ex('Rotación externa con banda',2,'12 por lado',30,'band shoulder external rotation','Cuidado del hombro.')])
 },
 skate:{
  A:session('Full Body A','Piernas + aterrizajes','35-45 min','Media','Fuerza y control para recepciones y cambios de dirección.',[ex('Sentadilla con mochila',3,'10-12',60,'bodyweight full squat','Piernas.'),ex('Flexiones',3,'8-15',60,'push-up body weight','Empuje y protección en caídas.'),ex('Zancada hacia atrás',3,'8 por pierna',60,'bodyweight rear lunge','Unilateral.'),ex('Remo con mochila',3,'12',60,'dumbbell bent over row','Espalda.'),ex('Elevación de talones',3,'15-20',30,'standing calf raise body weight','Tobillos.'),ex('Balance a una pierna',3,'30s por lado',30,'single leg balance','Propiocepción.')]),
  B:session('Full Body B','Unilateral + equilibrio','35-45 min','Media','Control de cadera, core y estabilidad lateral.',[ex('Peso muerto con mochila',3,'10-12',60,'dumbbell romanian deadlift','Cadena posterior.'),ex('Puente de glúteo a una pierna',3,'10 por pierna',45,'single leg glute bridge','Cadera.'),ex('Pike push up',3,'8-10',60,'pike push-up','Hombros.'),ex('Skaters laterales controlados',3,'8 por lado',45,'skater hops','Potencia lateral.'),ex('Plancha lateral',3,'30s por lado',30,'side plank body weight','Core.'),ex('Movilidad de tobillo',2,'10 por lado',20,'ankle dorsiflexion stretch','Dorsiflexión.')]),
  C:session('Full Body C','Preparación para street/park','25-35 min','Baja/media','Activar sin robarte piernas para patinar o jugar softbol.',[ex('Sentadilla tempo',2,'10',45,'bodyweight full squat','Control.'),ex('Remo con mochila',2,'12',45,'dumbbell bent over row','Espalda.'),ex('Flexiones',2,'10',45,'push-up body weight','Empuje.'),ex('Balance a una pierna',2,'30s por lado',30,'single leg balance','Estabilidad.'),ex('Bird dog',2,'10 por lado',30,'bird dog body weight','Core.'),ex('90/90 de cadera',2,'6 por lado',20,'90 90 hip stretch','Movilidad.')])
 },
 fixie:{
  A:session('Full Body A','Fuerza complementaria','35-45 min','Media','Fortalecer lo que la bici no trabaja suficiente.',[ex('Sentadilla con mochila',3,'10-12',60,'bodyweight full squat','Piernas.'),ex('Remo con mochila',3,'12',60,'dumbbell bent over row','Espalda.'),ex('Peso muerto con mochila',3,'10-12',60,'dumbbell romanian deadlift','Cadena posterior.'),ex('Flexiones',3,'8-15',60,'push-up body weight','Tren superior.'),ex('Elevación de talones',3,'15-20',30,'standing calf raise body weight','Gemelos.'),ex('Dead bug',3,'10 por lado',30,'dead bug body weight','Core.')]),
  B:session('Full Body B','Unilateral + postura','35-45 min','Media','Equilibrar cadera, espalda y core para pedalear mejor.',[ex('Zancada hacia atrás',3,'8-10 por pierna',60,'bodyweight rear lunge','Unilateral.'),ex('Puente de glúteo a una pierna',3,'10 por pierna',45,'single leg glute bridge','Glúteos.'),ex('Pike push up',3,'8-10',60,'pike push-up','Hombros.'),ex('Remo con mochila',3,'12',60,'dumbbell bent over row','Postura.'),ex('Plancha lateral',3,'30s por lado',30,'side plank body weight','Core.'),ex('90/90 de cadera',2,'6 por lado',20,'90 90 hip stretch','Movilidad.')]),
  C:session('Full Body C','Activación + movilidad','25-35 min','Baja/media','Mantener fuerza sin fatigar piernas antes del domingo.',[ex('Sentadilla tempo',2,'10',45,'bodyweight full squat','Control.'),ex('Flexiones',2,'10',45,'push-up body weight','Empuje.'),ex('Remo con mochila',2,'12',45,'dumbbell bent over row','Espalda.'),ex('Bird dog',2,'10 por lado',30,'bird dog body weight','Core.'),ex('Movilidad de tobillo',2,'10 por lado',20,'ankle dorsiflexion stretch','Tobillo.'),ex('Flexor de cadera',2,'30s por lado',20,'kneeling hip flexor stretch','Cadera.')])
 }
};

/* ============ SOFTBOL + DEFINICIÓN · 3 rutinas full body en casa ============
   Equipo: barra de dominadas, paralelas y mochila con peso.
   Sin abdominales dedicados: el reto va como sesión aparte. */
const PREP=ex('Entrada en calor',1,'4-5 min',0,'','Círculos de brazos, sentadillas sin peso, zancadas con giro de torso y 10 rotaciones de hombro por lado. Subí la temperatura antes de cargar.',true);
const SCAP=ex('Activación de escápulas en barra',2,'8-10',30,'scapular pull-up','Colgado con brazos estirados: bajá y subí los hombros sin doblar los codos. Prepara el hombro para las dominadas.');

PLANS.softball={
 A:session('Rutina A','Fuerza con mochila','45-50 min','Media/alta','La sesión pesada: tirón, empuje y piernas con carga para sostener el músculo mientras definís. Dejá 1-2 repeticiones en reserva.',[
  PREP,
  SCAP,
  ex('Dominadas con mochila',4,'5-8',105,'pull-up','Mochila bien ajustada a la espalda. Sin peso hasta hacer 8 limpias; si no llegás a 5, hacé negativas: subí con un salto y bajá en 4-5 segundos.'),
  ex('Fondos con mochila',4,'6-10',90,'chest dip','Bajá hasta ~90° de codo con el torso apenas inclinado. Sin peso hasta hacer 10 limpias. Si molesta el hombro, acortá el recorrido.'),
  ex('Sentadilla búlgara con mochila',4,'8-10 por pierna',75,'bulgarian split squat','Pie de atrás en una silla firme y mochila puesta. Fuerza de pierna y estabilidad de cadera para arrancar y frenar.'),
  ex('Peso muerto rumano con mochila',3,'10-12',60,'dumbbell romanian deadlift','Mochila abrazada al pecho o en las manos. Cadera atrás, espalda neutra, rodillas apenas flexionadas.'),
  ex('Remo con mochila',3,'10-12',60,'dumbbell bent over row','Torso inclinado y mochila colgando de las manos. Llevala hacia el ombligo apretando las escápulas.'),
  ex('Rotación externa acostado con botella',2,'15 por lado',30,'dumbbell lying external shoulder rotation','De costado, codo pegado al cuerpo y botella de 0,5-1 litro. Protege el manguito rotador del brazo de lanzar.')
 ]),
 B:session('Rutina B','Potencia + rotación','45-50 min','Alta','La más específica para softbol: saltos, velocidad de brazo y giro de cadera y torso. Mejor no elegirla el día antes de un partido.',[
  PREP,
  ex('Sentadilla con salto',4,'5',75,'jump squat','Sin mochila. Saltá fuerte, aterrizá suave y pausá antes de la siguiente. Si perdés altura, cortá la serie.'),
  ex('Flexiones explosivas',4,'5-8',75,'clap push up','Empujá rápido hasta despegar las manos, con o sin palmada. Calidad antes que cantidad.'),
  ex('Skater bounds',3,'6 por lado',45,'skater hops','Saltos laterales: aterrizá sobre un pie y sostené 1 s. Desplazamiento lateral para defensa.'),
  ex('Dominadas supinas con mochila',4,'6-8',90,'chin-up','Palmas hacia vos. Más bíceps y agarre para el bate. Sin peso hasta hacer 8 limpias.'),
  ex('Giro de swing con mochila',3,'10 por lado',45,'','Parado de costado, mochila en ambas manos: llevala de la cadera de atrás hacia arriba del hombro contrario, pivoteando el pie de atrás. Arranca la cadera, no los brazos. Hacé los dos lados.',true),
  ex('Puente de glúteo a una pierna con mochila',3,'10 por pierna',45,'single leg glute bridge','Mochila apoyada sobre la cadera. Extensión de cadera: el motor del bateo y la carrera.'),
  ex('Y-T-W boca abajo',2,'8 de cada letra',30,'','Boca abajo, levantá los brazos formando una Y, una T y una W, apretando las escápulas y sin peso. Hombro sano para lanzar.',true)
 ]),
 C:session('Rutina C','Densidad para definir','45-55 min','Media/alta','Más volumen con descansos cortos: gastás más y mantenés el músculo. Suma el plano lateral que usás en defensa.',[
  PREP,
  ex('Dominadas',4,'6-10',75,'pull-up','Sin mochila y con descanso corto. Dejá 2 repeticiones en reserva.'),
  ex('Fondos',4,'8-15',60,'chest dip','Ritmo constante, sin rebotar abajo.'),
  ex('Zancada lateral con mochila',3,'10 por lado',45,'barbell lateral lunge','Paso largo al costado, cadera atrás y pierna contraria estirada. Desplazamientos laterales para defensa.'),
  ex('Peso muerto a una pierna con mochila',3,'8-10 por pierna',45,'dumbbell single leg deadlift','Mochila en la mano contraria a la pierna de apoyo. Equilibrio e isquios.'),
  ex('Flexiones con pies elevados',3,'10-15',45,'decline push-up','Pies en una silla. Si te sobran repeticiones, sumá la mochila.'),
  ex('Remo a una mano con mochila',3,'12 por lado',45,'dumbbell one arm bent over row','Mano libre apoyada en una silla. Sin girar el torso.'),
  ex('Elevación de talones a una pierna',3,'12-15 por pierna',30,'single leg calf raise','Apoyate en la pared. Tobillos fuertes para arrancar y frenar.'),
  ex('Burpees',3,'10',45,'burpee','Cierre metabólico: ritmo sostenido y aterrizando suave.')
 ])
};

/* Sesiones opcionales: cardio y softbol. Se eligen igual que las rutinas. */
const EXTRA_SESSIONS=[
 session('Cardio','Velocidad + cardio','40-45 min','Media/alta','Aceleración para correr bases (hay ~18 m entre bases) y base aeróbica. Se hace afuera. Si molesta rodilla o tobillo, cambiá los sprints por 8 × 20 s fuertes en bici.',[
  ex('Trote suave de entrada en calor',1,'8-10 min',0,'','Ritmo muy cómodo.',true),
  ex('Movilidad dinámica',1,'5 min',0,'','Skips, rodillas arriba, talones a la cola, balanceos de pierna.',true),
  ex('Sprints de 20 m',6,'1 × 20 m al 85-90%',75,'','Volvé caminando. Alterná salidas de frente y de costado, como saliendo de base.',true),
  ex('Bici o trote en zona 2',1,'20 min',0,'','Ritmo en el que podés hablar en frases cortas.',true),
  ex('Vuelta a la calma',1,'5 min',0,'full body stretch','Caminar y estirar suave.')
 ],{slot:'velocidad',place:'Afuera'}),
 session('Cardio','Cardio zona 2 + movilidad','45-60 min','Baja/media','Cardio largo y suave: ayuda a mantener el peso sin robarle recuperación a las rutinas.',[
  ex('Bici (fixie) o trote suave',1,'40-50 min',0,'','Zona 2: respiración controlada, podés conversar. Si vas en bici, terreno llano.',true),
  ex('Movilidad de tobillo contra pared',2,'10 por lado',20,'ankle dorsiflexion stretch','Rodilla hacia la pared sin levantar el talón.',true),
  ex('Estiramiento de flexor de cadera',2,'30s por lado',20,'kneeling hip flexor stretch','Contrarresta horas sentado y en la bici.',true),
  ex('Rotación torácica en cuadrupedia',2,'8 por lado',20,'','Mano en la nuca, abrí el codo hacia el techo. Movilidad para el swing.',true)
 ],{slot:'zona2',place:'Afuera'}),
 session('Recuperación','Recuperación activa','25-35 min','Baja','Nada intenso: ideal para el día antes de un partido o después de una semana cargada.',[
  ex('Bici o caminata suave',1,'20-30 min',0,'','Muy cómodo. Si estás cargado, solo caminá.',true),
  ex('Movilidad de cadera 90/90',2,'6 por lado',20,'90 90 hip stretch','Soltar cadera.',true),
  ex('Rotación torácica en cuadrupedia',2,'8 por lado',20,'','Movilidad de torso para el swing.',true),
  ex('Rotación externa acostado con botella',1,'15 por lado',20,'dumbbell lying external shoulder rotation','Solo activación, sin cansar el hombro.')
 ],{slot:'recuperacion',place:'Casa o afuera'}),
 session('Softbol','Softbol — partido/práctica','Partido','Alta','Calentá progresivamente y registrá la carga al terminar.',[ex('Calentamiento dinámico',1,'10 min',0,'dynamic full body warm up','Subir temperatura y movilidad.'),ex('Progresión de lanzamientos',1,'8-12 min',0,'','De suave a moderado.',true),ex('Softbol',1,'Juego',0,'','Partido o práctica.',true),ex('Vuelta a la calma',1,'8-10 min',0,'full body stretch','Caminar, hidratar y recuperar.')],{slot:'partido',place:'Cancha'})
];

function buildRoutines(planKey){
 const p=PLANS[planKey]||PLANS.softball;
 return ROUTINE_KEYS.map(k=>({...p[k],slot:k}));
}
