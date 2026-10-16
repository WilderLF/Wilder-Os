-- ============================================================
-- Wildev OS · Base de datos
-- Pegá TODO este archivo en Supabase → SQL Editor → Run.
-- Crea una sola tabla con tus datos y la protege para que nadie
-- más que vos pueda leerlos.
-- ============================================================

create table if not exists public.app_data (
  user_id    uuid        not null references auth.users(id) on delete cascade,
  key        text        not null,
  value      jsonb       not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, key)
);

-- Row Level Security: cada fila es visible solo para su dueño.
alter table public.app_data enable row level security;

drop policy if exists "dueño lee" on public.app_data;
create policy "dueño lee" on public.app_data
  for select using (auth.uid() = user_id);

drop policy if exists "dueño inserta" on public.app_data;
create policy "dueño inserta" on public.app_data
  for insert with check (auth.uid() = user_id);

drop policy if exists "dueño actualiza" on public.app_data;
create policy "dueño actualiza" on public.app_data
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "dueño borra" on public.app_data;
create policy "dueño borra" on public.app_data
  for delete using (auth.uid() = user_id);

create index if not exists app_data_user_idx on public.app_data (user_id, updated_at desc);

-- ============================================================
-- Notificaciones push (solo si vas a usar recordatorios con la
-- app cerrada). Pegalo junto con lo de arriba.
-- ============================================================

create table if not exists public.push_subscriptions (
  endpoint   text        primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  p256dh     text        not null,
  auth       text        not null,
  tz         text        not null default 'America/Argentina/Buenos_Aires',
  updated_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;

drop policy if exists "dueño gestiona sus dispositivos" on public.push_subscriptions;
create policy "dueño gestiona sus dispositivos" on public.push_subscriptions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Evita que un recordatorio llegue dos veces el mismo día.
create table if not exists public.push_log (
  marca      text        primary key,
  user_id    uuid        not null references auth.users(id) on delete cascade,
  enviado_en timestamptz not null default now()
);

alter table public.push_log enable row level security;

drop policy if exists "dueño ve su log" on public.push_log;
create policy "dueño ve su log" on public.push_log
  for select using (auth.uid() = user_id);

-- Limpieza: borra las marcas de más de 7 días.
create or replace function public.limpiar_push_log() returns void
language sql security definer set search_path = public as $$
  delete from public.push_log where enviado_en < now() - interval '7 days';
$$;
