-- ============================================================
-- Wildev OS · Programar el envío de recordatorios
-- Corré esto DESPUÉS de haber subido la Edge Function send-reminders.
-- Reemplazá TU-PROYECTO y TU-ANON-KEY por los tuyos.
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Si ya lo habías programado, lo saca antes de volver a crearlo.
select cron.unschedule('wildev-recordatorios')
where exists (select 1 from cron.job where jobname = 'wildev-recordatorios');

select cron.schedule(
  'wildev-recordatorios',
  '* * * * *',                     -- cada minuto
  $$
  select net.http_post(
    url := 'https://TU-PROYECTO.supabase.co/functions/v1/send-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer TU-ANON-KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- Para ver que esté corriendo:
--   select * from cron.job;
--   select * from cron.job_run_details order by start_time desc limit 10;
