-- Event-management expos and fairs the studio tracks (found on Google, Instagram and elsewhere).
-- Only the server (secret key) reads and writes this table, so RLS is on with no public policy.
create table if not exists public.expos (
  id               text primary key,
  name             text not null,
  organiser        text,
  start_date       date,
  end_date         date,
  city             text,
  venue            text,
  source           text not null default 'GOOGLE',
  source_url       text,
  contact_name     text,
  contact_phone    text,
  contact_email    text,
  booth_cost       numeric,
  status           text not null default 'DISCOVERED',
  leads_collected  integer,
  notes            text,
  created_at       timestamptz not null default now()
);

alter table public.expos enable row level security;

create index if not exists expos_start_date_idx on public.expos (start_date);
