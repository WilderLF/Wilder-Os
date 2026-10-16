/* ============================================================
   Wildev OS · Edge Function: send-reminders
   La llama pg_cron cada minuto. Mira qué recordatorios tocan a
   esta hora en la zona horaria del dispositivo y manda el push.
   ============================================================ */

import webpush from "npm:web-push@3.6.7";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") ?? "mailto:hola@wildev.app";

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

// Hora y día de la semana en la zona horaria pedida.
function horaLocal(tz: string) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hour: "2-digit", minute: "2-digit", weekday: "short",
    year: "numeric", month: "2-digit", day: "2-digit", hour12: false
  });
  const p: Record<string, string> = {};
  for (const x of f.formatToParts(new Date())) p[x.type] = x.value;
  const dias: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    hhmm: `${p.hour}:${p.minute}`,
    dia: dias[p.weekday] ?? 0,
    fecha: `${p.year}-${p.month}-${p.day}`,
    minutos: parseInt(p.hour) * 60 + parseInt(p.minute)
  };
}

Deno.serve(async () => {
  const enviados: string[] = [];
  const errores: string[] = [];

  // Una suscripción por dispositivo; los recordatorios viven en app_data.
  const { data: subs } = await admin.from("push_subscriptions").select("*");
  if (!subs?.length) return Response.json({ ok: true, sin_suscripciones: true });

  const { data: filas } = await admin.from("app_data").select("user_id, value").eq("key", "reminders");
  const porUsuario = new Map((filas ?? []).map(f => [f.user_id, f.value]));

  for (const sub of subs) {
    const recordatorios = porUsuario.get(sub.user_id);
    if (!Array.isArray(recordatorios)) continue;

    const tz = sub.tz || "America/Argentina/Buenos_Aires";
    const ahora = horaLocal(tz);

    for (const r of recordatorios) {
      if (!r.activo || !Array.isArray(r.dias) || !r.dias.includes(ahora.dia)) continue;

      // Ventana de 2 minutos: el cron puede correr con algo de retraso.
      const [h, m] = String(r.hora).split(":").map(Number);
      const desfase = ahora.minutos - (h * 60 + m);
      if (desfase < 0 || desfase > 2) continue;

      // Una sola vez por día y por dispositivo.
      const marca = `${sub.endpoint}|${r.id}|${ahora.fecha}`;
      const { error: dup } = await admin.from("push_log").insert({
        user_id: sub.user_id, marca, enviado_en: new Date().toISOString()
      });
      if (dup) continue;   // ya estaba: la clave única lo rechaza

      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ title: r.titulo, body: r.cuerpo ?? "", vista: r.vista ?? "today", tag: r.id })
        );
        enviados.push(r.id);
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        // 404 y 410 significan que el dispositivo ya no existe: se limpia.
        if (code === 404 || code === 410) {
          await admin.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
        }
        errores.push(`${r.id}: ${code ?? (e as Error).message}`);
      }
    }
  }

  return Response.json({ ok: true, enviados, errores });
});
