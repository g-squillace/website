create table if not exists public.prospect (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  azienda text not null,
  dominio text not null,
  citta text,
  email text,
  url_modulo text,
  stato text not null default 'segnalato'
    check (stato in ('segnalato', 'da_contattare', 'contattato', 'follow_up', 'risposto', 'stallo', 'chiuso')),
  punteggio integer not null default 0,
  tornata integer,
  contattato_il date,
  follow_up_il date,
  risposto_il date,
  nota text,
  https boolean not null default false,
  wordpress text,
  php text,
  anni_fermo integer,
  peso_mb numeric(6, 2),
  peso_dopo_mb numeric(6, 2),
  ttfb_ms integer,
  caricamento_s numeric(6, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, dominio)
);

alter table public.prospect enable row level security;

create policy "prospect leggibili dal proprietario"
  on public.prospect for select
  using (auth.uid() = user_id);

create policy "prospect inseribili dal proprietario"
  on public.prospect for insert
  with check (auth.uid() = user_id);

create policy "prospect modificabili dal proprietario"
  on public.prospect for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "prospect eliminabili dal proprietario"
  on public.prospect for delete
  using (auth.uid() = user_id);

create index if not exists prospect_coda_idx
  on public.prospect (user_id, stato, punteggio desc);
