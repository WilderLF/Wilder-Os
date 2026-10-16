const PLAN_META={
 general:{label:'Rendimiento',emoji:'⚡',description:'Full body equilibrado para fuerza, movilidad y rendimiento general.',accent:'#91e358'},
 softball:{label:'Softbol + definición',emoji:'🥎',description:'Full body dividido en dos bloques cortos: tren superior + abdominales en el parque a la mañana, piernas + potencia + hombro en casa a la tarde (lunes, miércoles y viernes). Martes, jueves y sábado: cardio útil para el softbol. Domingo: partido.',accent:'#e63b64',split:true},
 skate:{label:'Skate',emoji:'🛹',description:'Full body con equilibrio, tobillo, cadera, fuerza unilateral y aterrizajes.',accent:'#4ea0ef'},
 fixie:{label:'Fixie',emoji:'🚲',description:'Full body complementario al ciclismo: cadena posterior, core y movilidad.',accent:'#f1b541'}
};
const DAY_ORDER=['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS={monday:'Lunes',tuesday:'Martes',wednesday:'Miércoles',thursday:'Jueves',friday:'Viernes',saturday:'Sábado',sunday:'Domingo'};
// Tipo de día: lo usa también el módulo de nutrición para ajustar carbohidratos.
const DAY_TYPES={monday:'strength',tuesday:'cardio',wednesday:'strength',thursday:'cardio',friday:'strength',saturday:'recovery',sunday:'game'};
const DAY_TYPE_LABELS={strength:'Día de fuerza',cardio:'Día de cardio',recovery:'Recuperación',game:'Día de partido'};
const SLOT_META={am:{label:'Mañana',icon:'🌅'},pm:{label:'Tarde',icon:'🌇'},main:{label:'Sesión',icon:'⚡'},abs:{label:'Reto abdominal',icon:'🔥'}};

const ex=(name,sets,reps,rest,datasetQuery,note,mediaDisabled=false)=>({name,sets,reps,rest,datasetQuery,note,mediaDisabled});
const session=(label,title,duration,intensity,goal,exercises,extra={})=>({label,title,duration,intensity,goal,exercises,...extra});

const REST=session('Descanso','Recuperación / fixie opcional','20-40 min','Baja','Recuperar sin sumar fatiga.',[ex('Fixie suave o caminata',1,'30-45 min',0,'','Ritmo cómodo; deberías poder conversar.',true),ex('Movilidad de cadera 90/90',2,'6 por lado',20,'90 90 hip stretch','Soltar cadera.'),ex('Movilidad de tobillo contra pared',2,'10 por lado',20,'ankle dorsiflexion stretch','Mantener dorsiflexión.')]);

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

/* ============ SOFTBOL: full body dividido mañana (parque) + tarde (casa) ============ */
const am=(title,duration,goal,exercises)=>session('Mañana · Parque',title,duration,'',goal,exercises,{slot:'am',place:'Parque (barras)'});
const pm=(title,duration,goal,exercises)=>session('Tarde · Casa',title,duration,'',goal,exercises,{slot:'pm',place:'Casa'});

const SCAP=ex('Activación de escápulas en barra',2,'8-10',30,'scapular pull-up','Colgado con brazos estirados: bajá y subí los hombros sin doblar los codos. Prepara el hombro para las dominadas.');

const SOFTBALL_STRENGTH={
 monday:{
  title:'Día A — Fuerza',intensity:'Media',joinedDuration:'50-55 min',
  goal:'Recuperar del partido y construir fuerza base. Todas las series con 1-2 repeticiones en reserva.',
  am:am('Empuje + tirón + abdominales','25-30 min','Pecho, espalda, brazos y core en las barras del parque.',[
   SCAP,
   ex('Dominadas',4,'4-8',90,'pull-up','Si todavía no llegás a 4, hacé negativas: subí con un salto y bajá en 4-5 segundos. Espalda y agarre para el bate.'),
   ex('Fondos en paralelas',4,'6-12',90,'chest dip','Bajá hasta ~90° de codo con el torso apenas inclinado. Si molesta el hombro, acortá el recorrido.'),
   ex('Remo australiano (barra baja)',3,'8-12',60,'inverted row','Cuerpo recto como tabla, llevá el pecho a la barra. Más horizontal = más difícil.'),
   ex('Flexiones',3,'10-15',60,'push-up','Pecho, tríceps y core. Codos a ~45° del cuerpo.'),
   ex('Elevación de rodillas colgado',3,'8-12',45,'hanging knee raise','Sin balanceo: rodillas al pecho y bajada lenta. Abdominales + agarre.')
  ]),
  pm:pm('Piernas + hombro','20-25 min','Fuerza de piernas y cuidado del brazo de lanzar.',[
   ex('Sentadilla con mochila',4,'10-15',60,'bodyweight full squat','Cargá la mochila (libros, botellas) cuando 15 reps te resulten fáciles.'),
   ex('Peso muerto rumano con mochila',3,'10-12',60,'dumbbell romanian deadlift','Cadera atrás, espalda neutra, rodillas apenas flexionadas. Isquios y glúteos.'),
   ex('Zancada hacia atrás',3,'8-10 por pierna',60,'bodyweight rear lunge','Fuerza unilateral con bajo impacto para la rodilla.'),
   ex('Elevación de talones a una pierna',3,'10-15 por pierna',30,'single leg calf raise','Apoyate en la pared. Tobillos fuertes para arrancar y frenar.'),
   ex('Rotación externa con banda',2,'15 por lado',30,'band shoulder external rotation','Codo pegado al cuerpo. Protege el manguito rotador del brazo de lanzar.'),
   ex('Dead bug',2,'10 por lado',30,'dead bug body weight','Zona lumbar pegada al piso todo el tiempo.')
  ])
 },
 wednesday:{
  title:'Día B — Potencia + rotación',intensity:'Media/alta',joinedDuration:'55-60 min',
  goal:'La sesión más específica para softbol: velocidad de brazo, saltos, rotación de cadera y torso.',
  am:am('Tirón + empuje explosivo + oblicuos','25-30 min','Potencia de tren superior y core rotacional para batear y lanzar.',[
   SCAP,
   ex('Dominadas supinas (chin-ups)',4,'4-8',90,'chin-up','Palmas hacia vos. Más bíceps y dorsales. Mismas negativas si hace falta.'),
   ex('Fondos en paralelas',3,'8-12',75,'chest dip','Controlá la bajada (2 s) y subí firme.'),
   ex('Flexiones explosivas',3,'5-8',60,'clap push up','Empujá rápido hasta despegar las manos (con o sin palmada). Calidad antes que cantidad: si se vuelven lentas, cortá.'),
   ex('Remo australiano (barra baja)',3,'10-12',60,'inverted row','Pausa de 1 s arriba apretando escápulas.'),
   ex('Elevación de rodillas con giro',3,'6-8 por lado',45,'hanging oblique knee raise','Colgado, llevá las rodillas hacia un costado y al otro. Oblicuos para el swing.')
  ]),
  pm:pm('Saltos + unilateral + rotación','25-30 min','Potencia de piernas y transferencia cadera-torso.',[
   ex('Sentadilla con salto',4,'5',60,'jump squat','Hacelo primero, estando fresco. Saltá fuerte, aterrizá suave y pausá antes de la siguiente.'),
   ex('Sentadilla búlgara',3,'8-10 por pierna',60,'bulgarian split squat','Pie de atrás en una silla. Fuerza y estabilidad de cadera.'),
   ex('Skater bounds',3,'6 por lado',45,'skater hops','Saltos laterales: aterrizá sobre un pie y sostené 1 s. Desplazamiento lateral para defensa.'),
   ex('Puente de glúteo a una pierna',3,'10 por pierna',45,'single leg glute bridge','Extensión de cadera: el motor del bateo y la carrera.'),
   ex('Woodchopper con banda',3,'10 por lado',45,'cable wood chop','Girá desde la cadera, no solo con los brazos. Mismo patrón que el swing.',true),
   ex('Pallof press con banda',3,'10 por lado',40,'band horizontal pallof press','Antirrotación: el torso no gira. Core que transfiere fuerza.'),
   ex('Wall slides',2,'12',30,'scapular wall slide','Espalda contra la pared, deslizá los brazos arriba sin despegarlos. Movilidad de hombro.',true)
  ])
 },
 friday:{
  title:'Día C — Fuerza-resistencia',intensity:'Media',joinedDuration:'45-50 min',
  goal:'Más densidad (descansos cortos) pero dejando reserva: el domingo hay partido.',
  am:am('Densidad tren superior + core','25 min','Descansos más cortos para quemar más, sin llegar al fallo.',[
   ex('Dominadas',3,'5-8',90,'pull-up','Dejá 2 repeticiones en reserva.'),
   ex('Fondos en paralelas',3,'8-12',75,'chest dip','Ritmo constante, sin rebotar abajo.'),
   ex('Flexiones con pies elevados',3,'8-12',60,'decline push-up','Pies en un banco del parque. Más trabajo de pecho alto y hombro.'),
   ex('Remo australiano (barra baja)',3,'10-12',60,'inverted row','Espalda y postura.'),
   ex('Mountain climbers',3,'30s',30,'mountain climber','Rápido pero con cadera estable.'),
   ex('Plancha lateral',2,'30s por lado',30,'side plank body weight','Core lateral.')
  ]),
  pm:pm('Piernas moderado + movilidad','20-25 min','Estimular piernas sin llegar cansado al domingo.',[
   ex('Sentadilla con mochila',3,'12',60,'bodyweight full squat','Dejá 2-3 repeticiones en reserva.'),
   ex('Zancada lateral',3,'8 por lado',45,'side lunge body weight','Plano lateral para defensa y desplazamientos.'),
   ex('Peso muerto a una pierna',3,'8 por pierna',45,'dumbbell single leg deadlift','Mochila en la mano contraria a la pierna de apoyo. Equilibrio + isquios.'),
   ex('Elevación de talones',3,'15-20',30,'standing calf raise body weight','Tobillos y gemelos.'),
   ex('Rotación externa con banda',2,'15 por lado',30,'band shoulder external rotation','Hombro listo para el domingo.'),
   ex('Movilidad de cadera 90/90',2,'6 por lado',20,'90 90 hip stretch','Cerrá la semana de fuerza soltando la cadera.',true)
  ])
 }
};

const SOFTBALL_CARDIO={
 tuesday:session('Cardio','Velocidad + cardio','40-45 min','Media/alta','Aceleración para correr bases (hay ~18 m entre bases) y base aeróbica para quemar grasa. Si molesta rodilla o tobillo, cambiá los sprints por 8 × 20 s fuertes en bici.',[
  ex('Trote suave de entrada en calor',1,'8-10 min',0,'','Ritmo muy cómodo.',true),
  ex('Movilidad dinámica',1,'5 min',0,'','Skips, rodillas arriba, talones a la cola, balanceos de pierna.',true),
  ex('Sprints de 20 m',6,'1 × 20 m al 85-90%',75,'','Volvé caminando. Alterná salidas de frente y de costado, como saliendo de base.',true),
  ex('Bici o trote en zona 2',1,'20 min',0,'','Ritmo en el que podés hablar en frases cortas.',true),
  ex('Vuelta a la calma',1,'5 min',0,'full body stretch','Caminar y estirar suave.')
 ]),
 thursday:session('Cardio','Cardio zona 2 + movilidad','45-60 min','Baja/media','Cardio largo y suave: ayuda a mantener el peso sin robarte recuperación para el viernes.',[
  ex('Bici (fixie) o trote suave',1,'40-50 min',0,'','Zona 2: respiración controlada, podés conversar. Si vas en bici, terreno llano.',true),
  ex('Movilidad de tobillo contra pared',2,'10 por lado',20,'ankle dorsiflexion stretch','Rodilla hacia la pared sin levantar el talón.',true),
  ex('Estiramiento de flexor de cadera',2,'30s por lado',20,'kneeling hip flexor stretch','Contrarresta horas sentado y en la bici.',true),
  ex('Rotación torácica en cuadrupedia',2,'8 por lado',20,'','Mano en la nuca, abrí el codo hacia el techo. Movilidad para el swing.',true)
 ]),
 saturday:session('Recuperación','Recuperación activa pre-partido','25-35 min','Baja','Nada intenso: la idea es llegar fresco y suelto al domingo.',[
  ex('Bici o caminata suave',1,'20-30 min',0,'','Muy cómodo. Si estás cargado, solo caminá.',true),
  ex('Movilidad de cadera 90/90',2,'6 por lado',20,'90 90 hip stretch','Soltar cadera.',true),
  ex('Rotación torácica en cuadrupedia',2,'8 por lado',20,'','Movilidad de torso para el swing.',true),
  ex('Rotación externa con banda (suave)',1,'15 por lado',20,'band shoulder external rotation','Solo activación, sin cansar el hombro.')
 ])
};

const SOFTBALL_DAY=session('Domingo','Softbol — partido/práctica','Partido','Alta','Día deportivo principal. Calentá progresivamente y registrá la carga al terminar.',[ex('Calentamiento dinámico',1,'10 min',0,'dynamic full body warm up','Subir temperatura y movilidad.'),ex('Progresión de lanzamientos',1,'8-12 min',0,'','De suave a moderado.',true),ex('Softbol',1,'Juego',0,'','Partido o práctica.',true),ex('Vuelta a la calma',1,'8-10 min',0,'full body stretch','Caminar, hidratar y recuperar.')]);

function makeDay(key,title,goal,intensity,sessions){
 const duration=sessions.map(s=>s.duration).join(' + ');
 return {key,label:DAY_LABELS[key],title,goal,intensity,duration,type:DAY_TYPES[key],sessions};
}
const single=(key,s)=>makeDay(key,s.title,s.goal,s.intensity,[{...s,slot:'main'}]);
function joinSessions(d){
 return session('Sesión completa',d.title,d.joinedDuration,d.intensity,d.goal,[...d.am.exercises,...d.pm.exercises],{slot:'main',place:'Parque + casa'});
}

// format: 'split' (mañana + tarde) o 'joined' (todo en una sesión)
function buildWeek(planKey,format='split'){
 if(planKey==='softball'){
  const w={};
  ['monday','wednesday','friday'].forEach(k=>{const d=SOFTBALL_STRENGTH[k];w[k]=makeDay(k,d.title,d.goal,d.intensity,format==='joined'?[joinSessions(d)]:[d.am,d.pm]);});
  ['tuesday','thursday','saturday'].forEach(k=>{w[k]=single(k,SOFTBALL_CARDIO[k]);});
  w.sunday=single('sunday',SOFTBALL_DAY);
  return w;
 }
 const p=PLANS[planKey]||PLANS.general;
 return {
  monday:single('monday',p.A),tuesday:single('tuesday',REST),wednesday:single('wednesday',p.B),thursday:single('thursday',REST),
  friday:single('friday',p.C),saturday:single('saturday',{...REST,title:'Descanso + movilidad',goal:'Mantené el sábado liviano para llegar recuperado al domingo.'}),
  sunday:single('sunday',SOFTBALL_DAY)
 };
}
