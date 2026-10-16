# Wildev OS · Qué te falta hacer

Tres bloques, en orden. El primero es obligatorio, los otros dos son opcionales pero recomendados.

| # | Qué | Cuánto tarda | ¿Hace falta? |
|---|---|---|---|
| 1 | Subir la app a Vercel | 5 min | Sí |
| 2 | Conectar Supabase (base de datos) | 10 min | Sí, si querés que sincronice entre celular y compu |
| 3 | Notificaciones con la app cerrada | 20 min | Solo si querés que los recordatorios lleguen sin abrir la app |

---

## Hostinger o Vercel: no compiten

No son lo mismo, así que no hay que elegir:

- **Vercel / Hostinger** = *hosting*. Sirven los archivos de la app (HTML, CSS, JS). Para esto ya tenés Vercel conectado a GitHub, y es la mejor opción: cada vez que hacés push, se publica solo.
- **Supabase** = *base de datos + usuarios*. Guarda tus datos y los sincroniza entre dispositivos.

**Hostinger podría reemplazar a Vercel** como hosting, pero no te conviene: perderías el despliegue automático desde GitHub que ya tenés andando.

**Hostinger no puede reemplazar a Supabase** sin trabajo extra. Sus planes traen MySQL, pero para usarlo desde el navegador habría que escribir un backend en PHP con login, permisos y una API. Eso es varios días de trabajo y algo más que mantener. Supabase te da todo eso hecho y gratis.

Dejá Hostinger para lo que ya uses (correo, otros sitios, webs de clientes).

---

## 1. Subir la app a Vercel

La app está hecha con rutas relativas, así que no hay nada que configurar.

1. Copiá la carpeta `wildev-os` dentro de tu repositorio. **El `index.html` tiene que quedar en la raíz** de lo que Vercel publica.
   - Si el repo es solo para esta app, copiá el *contenido* de la carpeta, no la carpeta.
   - Si compartís repo, en Vercel poné `wildev-os` en **Root Directory**.
2. `git add . && git commit -m "Wildev OS" && git push`
3. En Vercel, Framework Preset: **Other**. Sin build command, sin output directory.

Listo: la app ya funciona con todos los módulos. Los datos quedan en ese navegador hasta que hagas el paso 2.

**Instalá la app en el celular.** Es necesario para las notificaciones y hace que se vea como app nativa:
- **Android (Chrome):** menú ⋮ → *Instalar aplicación*.
- **iPhone (Safari, no Chrome):** botón Compartir → *Agregar a inicio*.

---

## 2. Supabase: la base de datos

Esto hace que cargues algo en el celular y aparezca en la computadora, y que no pierdas nada si cambiás de teléfono.

### 2.1 Crear la cuenta y el proyecto

1. Entrá a **supabase.com** → *Start your project*. Podés entrar con GitHub.
2. *New project*:
   - **Name:** `wildev-os`
   - **Database Password:** generá una y guardala (no la vas a necesitar en la app, pero sí si algún día entrás por SQL).
   - **Region:** `South America (São Paulo)` — la más cercana a Argentina.
3. Esperá 2 minutos a que termine de crearse.

### 2.2 Crear las tablas

1. Menú lateral → **SQL Editor** → *New query*.
2. Abrí el archivo `supabase/schema.sql` de la app, copiá **todo** y pegalo.
3. Tocá **Run** (o Ctrl+Enter). Tiene que decir *Success*.

Esto crea tres tablas y les pone seguridad por filas: aunque alguien vea el código de tu app, no puede leer tus datos.

### 2.3 Sacar las dos claves

1. **Project Settings** (el engranaje abajo a la izquierda) → **API**.
2. Copiá:
   - **Project URL** → algo como `https://abcdefgh.supabase.co`
   - **anon public** → una clave larga que empieza con `eyJ...`

### 2.4 Conectar desde la app

1. Abrí Wildev OS → engranaje ⚙ arriba a la derecha.
2. Pegá la URL y la clave anon.
3. Poné un email y una contraseña **que inventás vos** (son para entrar a tu app, no tienen que ser los de Supabase). Mínimo 6 caracteres.
4. **Conectar**.

Si te dice que confirmes el mail: andá a **Authentication → Providers → Email** en Supabase y desactivá *Confirm email*. Después volvé a tocar Conectar.

Cuando el cartel de arriba diga **"Guardado en la nube"**, está andando. Repetí este paso en cada dispositivo con el mismo email y contraseña.

---

## 3. Notificaciones con la app cerrada

**Antes de empezar:** abrí Recordatorios (la campanita 🔔) y tocá **Activar**. Con eso ya te llegan los avisos mientras la app esté abierta o reciente en segundo plano. Para muchos casos alcanza.

Lo de abajo es para que lleguen **siempre**, aunque tengas el teléfono guardado hace horas.

### 3.1 Generar las claves VAPID

Son el par de claves que firma las notificaciones. En tu computadora:

```bash
npx web-push generate-vapid-keys
```

Te devuelve dos: **Public Key** y **Private Key**. Guardalas.

### 3.2 Instalar el CLI de Supabase y subir la función

```bash
npm install -g supabase
supabase login
cd wildev-os
supabase link --project-ref TU-PROJECT-REF
```

El `project-ref` es la parte del medio de tu URL: en `https://abcdefgh.supabase.co` es `abcdefgh`.

Cargá las claves como secretos de la función:

```bash
supabase secrets set VAPID_PUBLIC_KEY="pegá-la-pública"
supabase secrets set VAPID_PRIVATE_KEY="pegá-la-privada"
supabase secrets set VAPID_SUBJECT="mailto:tu@email.com"
```

Y subí la función:

```bash
supabase functions deploy send-reminders
```

> Si preferís no instalar nada: en Supabase, **Edge Functions → Deploy a new function**, pegá el contenido de `supabase/functions/send-reminders/index.ts`, y cargá los tres secretos en **Edge Functions → Secrets**.

### 3.3 Programar el envío

1. **SQL Editor** → *New query*.
2. Abrí `supabase/cron.sql`, reemplazá `TU-PROYECTO` por tu project-ref y `TU-ANON-KEY` por la clave anon.
3. **Run**.

Esto hace que Supabase revise cada minuto si toca mandarte algún recordatorio.

Para verificar que quedó andando:

```sql
select * from cron.job;
select * from cron.job_run_details order by start_time desc limit 10;
```

### 3.4 Suscribir el teléfono

1. En la app → campanita 🔔 → sección **"Que lleguen con la app cerrada"**.
2. Pegá la clave **pública** VAPID.
3. **Suscribir**.

Repetilo en cada dispositivo donde quieras recibirlas.

---

## Cosas que conviene saber

**En iPhone las notificaciones solo funcionan con la app agregada a la pantalla de inicio**, y desde Safari (no Chrome). Es una regla de Apple. En Android funcionan igual instalada o no, pero instalada anda mejor.

**El plan gratis de Supabase se pausa** si no entra nadie por una semana. Si usás la app todos los días no pasa nunca; y si llegara a pasar, se reactiva con un clic desde el panel.

**La clave anon no es un secreto.** Está hecha para ir en el navegador. Lo que protege tus datos es la seguridad por filas del archivo SQL. La que sí es secreta es la **privada de VAPID**: esa solo va en los secretos de Supabase, nunca en el código.

**Si no hacés el paso 2**, la app funciona igual, pero los datos viven solo en ese navegador. Descargá el respaldo de vez en cuando desde Ajustes.

---

## Si algo no anda

| Problema | Qué mirar |
|---|---|
| "No se pudo contactar a Supabase" | La Project URL tiene que terminar en `.supabase.co`, sin barra al final. |
| "Email o contraseña incorrectos" | La primera vez crea la cuenta sola. Si ya la creaste, revisá la contraseña. |
| Dice "Cuenta creada, confirmá el mail" | Authentication → Providers → Email → desactivá *Confirm email*. |
| Falta la tabla `push_subscriptions` | Volvé a correr `schema.sql` completo: la parte de push está al final. |
| Las notificaciones no llegan en iPhone | ¿Está agregada a la pantalla de inicio? ¿La abriste desde ese ícono y no desde Safari? |
| Los push no llegan nunca | Mirá `select * from cron.job_run_details order by start_time desc limit 5;` y los logs de la función en Supabase. |
| El cron corre pero no llega nada | Revisá que los secretos VAPID estén cargados y que la clave pública de la app sea la misma del par. |
