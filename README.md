# Wildev OS

Tu sistema personal: rutinas, foco, trabajo, dinero, cuerpo y mente en una sola app. PWA, se instala en el celular y funciona sin conexión. Los datos se guardan en tu propia base de datos y sincronizan entre el teléfono y la computadora.

## Los seis módulos

### ☀️ Hoy
- **Las 3 del día**: las tres cosas que si las hacés, el día ya valió. Máximo tres, a propósito.
- **Rutina de la mañana**: levantarte 6:00, agua, estirar, leer unos párrafos, ducha, elegir las 3 del día (31 minutos en total).
- **Rutina de la noche**: cerrar el trabajo, soltar pantallas, leer, repaso del día, dormir 22:30.
- **Hábitos** con racha. Tres se marcan solos: *Entrenar* cuando registrás una sesión, *Leer* cuando registrás lectura y *Foco* cuando completás un bloque.
- **Los 5 pilares**: cuerpo, mente, trabajo, familia y disciplina, con el motivo de cada uno escrito. Para leer los días que no tenés ganas.
- **Anillo del día** con el porcentaje cumplido y la tira de los últimos 7 días.

### 🎯 Foco
- Bloques de **25, 50 o 90 minutos** con cronómetro. Podés cerrar la app: el reloj sigue corriendo porque se guarda la hora de inicio, no un contador.
- Si cortás un bloque a la mitad, igual guarda los minutos que hiciste.
- **Tareas** del día, con botón para arrancar un bloque de foco sobre una tarea concreta.
- Gráfico de minutos de foco por día.
- Tarjeta **"cuando no arrancás"** con las cuatro cosas que mejor funcionan contra la procrastinación.

### 🚀 Trabajo
- **Prospectos y clientes** por etapa: contacto → conversando → propuesta → cerrado → en desarrollo → entregado.
- Monto estimado de cada uno: ves cuánto tenés **en juego** ahora mismo.
- **De dónde salen tus clientes** (Instagram, recomendación, WhatsApp…): con unos meses de datos sabés dónde conviene poner la energía.
- **Contenido**: ideas → guionando → grabado → editado → publicado, con conteo por mes.
- **Idea del día**: diez arranques de contenido pensados para desarrollo web, rotando por día.

### 💰 Dinero
- Ingresos y gastos del mes, con el balance arriba.
- **Metas**: auto, casa, viaje en familia y mudanza. Ponés cuánto necesitás y cuánto podés guardar por mes, y la app te dice **en qué mes llegás**.
- Promedio de ingresos de los últimos 3 meses.
- Gráfico de ingresos contra gastos por mes.

### 💪 Cuerpo
- **Reproductor completo**, igual que en Wildev Training: animación del ejercicio, series una por una, cronómetro de descanso que arranca solo al completar cada serie, y el botón de cambiar animación si la del catálogo no es la correcta.
- La sesión se guarda a medida que avanzás: si cerrás la app a mitad, al volver te ofrece continuar donde ibas.
- Lista lateral con todos los ejercicios para saltar al que quieras.
- **"¿Cómo llegás hoy?"**: cansado baja las series a 2, con energía suma una.
- **Reto abdominal de 28 días** (Athlean-X) con los tres niveles. Al activarlo saca los abdominales de las rutinas y aparece como sesión aparte, con los bloques por tiempo encadenados.
- **Comida**: objetivo de calorías que sube si entrenaste y baja si no, registro por gramos y barras de proteína, carbohidratos y grasas.

### 🧠 Mente
- **Lectura** con racha de días seguidos. Viene cargado *Meditaciones* de Marco Aurelio; podés sumar los libros que quieras.
- Notas de lo que te va quedando de cada lectura.
- **Repaso del día**: qué salió bien, qué harías distinto, lo primero de mañana.
- **Buscar lo que me apasiona**: lista de curiosidades y una cosa concreta para probar cada mes.
- **Cómo me siento conmigo**: cuatro marcas diarias (cumplí mi palabra, me moví y comí bien, estuve presente, aprendí o creé algo).

## 🔔 Recordatorios

La campanita del encabezado abre la configuración. Vienen ocho cargados según tu rutina: 6:00 arrancar, 7:00 elegir las 3 del día, 9:00 primer bloque de foco, 12:00 contenido, 18:00 entrenar, 20:00 guardar el celular, 21:30 cerrar el día, 22:00 leer. Cada uno tiene su horario y sus días editables, y podés sumar los tuyos.

Funcionan en dos capas:

1. **Locales** — andan apenas tocás "Activar". Llegan mientras el navegador esté vivo (app abierta o reciente en segundo plano). No necesitan servidor.
2. **Push reales** — llegan aunque la app esté cerrada hace horas. Necesitan Supabase con la Edge Function configurada (está en `INSTALACION.md`, paso 3).

En iPhone las notificaciones solo existen si la app está agregada a la pantalla de inicio desde Safari. Es una regla de Apple.

## Dónde se guardan los datos

Todo se guarda primero en el navegador, así que la app es instantánea y anda sin internet. Si conectás Supabase, además sube a tu base de datos y baja en cualquier otro dispositivo.

### Conectar Supabase (una sola vez, ~10 minutos)

1. Entrá a **supabase.com** y creá una cuenta gratis.
2. Creá un proyecto nuevo. Elegí la región más cercana y guardá la contraseña que te pide.
3. En el menú lateral, **SQL Editor → New query**. Pegá todo el contenido de `supabase/schema.sql` y tocá **Run**.
4. Andá a **Project Settings → API** y copiá la **Project URL** y la clave **anon public**.
5. En la app, tocá el engranaje arriba a la derecha, pegá las dos cosas, poné un email y una contraseña (los inventás vos) y tocá **Conectar**.

Si Supabase te pide confirmar el mail, confirmalo y volvé a tocar Conectar. También podés desactivar esa confirmación en **Authentication → Providers → Email**.

**Sobre la seguridad:** la clave *anon* está hecha para ir en el navegador, no es un secreto. Lo que protege tus datos es la seguridad por filas (RLS) que crea el archivo SQL: hace que cada fila solo sea legible por su dueño. Nadie que vea el código puede leer lo tuyo.

**Límites del plan gratis:** 500 MB de base de datos y 50.000 usuarios activos por mes. Para una app personal no vas a acercarte ni de lejos: tus datos de un año entero pesan menos de 1 MB. Los proyectos gratis se pausan tras una semana sin uso y se reactivan desde el panel; si la abrís seguido, no pasa.

### Respaldo manual

En Ajustes podés descargar un archivo JSON con todo y restaurarlo en otro equipo. Funciona uses o no uses Supabase.

## Publicar

Rutas relativas: funciona en Vercel, Netlify o GitHub Pages sin tocar nada. El `index.html` tiene que quedar en la raíz de lo que se publica.

Necesita **HTTPS** para el modo sin conexión, el botón de instalar y las notificaciones. Vercel ya lo da.

**Los pasos concretos están en `INSTALACION.md`.**

## Técnico

- HTML, CSS y JavaScript sin dependencias ni compilación. El SDK de Supabase se carga solo si configurás la nube.
- `core/store.js` es la capa de datos: guarda local, encola lo que no pudo subir y sincroniza por fecha de modificación.
- `data/life.js` tiene tus rutinas, hábitos, pilares y metas: editá ese archivo para cambiar lo que viene por defecto.
- Cada módulo es un archivo en `modules/` que expone `render()` y `setup()`. Para sumar uno nuevo, se crea el archivo, se registra con `registerModule` y se agrega el botón en la barra.

## Aviso

La app organiza, no diagnostica. La parte de cuerpo y comida son estimaciones; si vas a hacer un cambio grande de alimentación o entrenamiento, consultalo con un profesional.
