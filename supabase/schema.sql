-- ZS Events CRM — Supabase schema
--
-- Design notes:
--   * Primary keys keep the app's existing human-readable IDs
--     ("LD-2026-00421", "PRJ-2026-089", "CUST-101") so no app logic changes.
--   * Sub-collections the app always reads/writes as part of their parent
--     (activities, milestones, tasks, daily logs, procurement, checklist,
--     line items) are JSONB. Top-level entities are real relational tables,
--     so they stay queryable with plain SQL.
--   * RLS Phase 1: any signed-in user has full access.
--     Phase 2 will narrow these per profiles.role.

-- ---------------------------------------------------------------
-- Profiles (extends Supabase auth.users)
-- ---------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  name        text not null,
  email       text not null unique,
  phone       text,
  role        text not null default 'SALES_COORDINATOR'
              check (role in ('ADMIN','LEAD_DESIGNER','OPERATIONS_MANAGER',
                              'SALES_COORDINATOR','FINANCE_LEAD')),
  title       text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- Auto-create a profile whenever a user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $func$
begin
  insert into public.profiles (id, name, email, phone, role, title)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'role', 'SALES_COORDINATOR'),
    new.raw_user_meta_data->>'title'
  )
  on conflict (id) do nothing;
  return new;
end;
$func$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------
-- Customers
-- ---------------------------------------------------------------
create table if not exists public.customers (
  id                text primary key,
  name              text not null,
  phone             text not null,
  whatsapp          text,
  email             text,
  location          text not null default '',
  city              text,
  company_name      text,
  gst_number        text,
  total_projects    integer not null default 0,
  total_revenue     numeric(14,2) not null default 0,
  total_outstanding numeric(14,2) not null default 0,
  notes             text,
  vip_status        boolean not null default false,
  lead_ids          jsonb not null default '[]'::jsonb,
  project_ids       jsonb not null default '[]'::jsonb,
  activities        jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now()
);
create index if not exists customers_phone_idx on public.customers (phone);
create index if not exists customers_name_idx  on public.customers (lower(name));

-- ---------------------------------------------------------------
-- Leads
-- ---------------------------------------------------------------
create table if not exists public.leads (
  id                       text primary key,
  customer_name            text not null,
  phone                    text not null,
  whatsapp                 text,
  email                    text,
  location                 text not null default '',
  city                     text,
  source                   text not null default 'OTHER',
  event_type               text not null,
  event_date               date,
  venue                    text,
  expected_guests          integer,
  service_required         text not null default '',
  selected_template_id     text,
  budget                   numeric(14,2) not null default 0,
  estimated_project_value  numeric(14,2),
  probability              integer check (probability between 0 and 100),
  lead_score               integer check (lead_score between 0 and 100),
  lead_health              text check (lead_health in ('HOT','WARM','COLD','AT_RISK')),
  message                  text,
  additional_requirements  text,
  status                   text not null default 'NEW'
                           check (status in ('NEW','CONTACTED','QUALIFIED','MEETING',
                                             'QUOTATION','NEGOTIATION','WON','LOST','ON_HOLD')),
  assigned_staff           text not null default '',
  priority                 text not null default 'MEDIUM'
                           check (priority in ('LOW','MEDIUM','HIGH','URGENT')),
  last_contacted           timestamptz,
  next_follow_up_date      date,
  next_follow_up_time      text,
  next_follow_up_type      text,
  next_follow_up_note      text,
  next_follow_up_status    text,
  activities               jsonb not null default '[]'::jsonb,
  customer_id              text references public.customers(id) on delete set null,
  converted_project_id     text,
  created_at               timestamptz not null default now()
);
create index if not exists leads_status_idx     on public.leads (status);
create index if not exists leads_event_date_idx on public.leads (event_date);
create index if not exists leads_phone_idx      on public.leads (phone);

-- ---------------------------------------------------------------
-- Projects
-- ---------------------------------------------------------------
create table if not exists public.projects (
  id                      text primary key,
  name                    text not null,
  customer_id             text references public.customers(id) on delete set null,
  customer_name           text not null,
  phone                   text not null default '',
  whatsapp                text,
  email                   text,
  lead_id                 text,
  event_type              text not null,
  venue                   text not null default '',
  event_date              date,
  setup_date              date,
  setup_time              text,
  dismantling_date        date,
  dismantling_time        text,
  project_value           numeric(14,2) not null default 0,
  assigned_staff          text not null default '',
  crew                    jsonb not null default '[]'::jsonb,
  transport               text,
  venue_contact           text,
  venue_phone             text,
  parking_notes           text,
  access_restrictions     text,
  start_date              date,
  end_date                date,
  status                  text not null default 'PLANNING'
                          check (status in ('PLANNING','IN_PROGRESS','EVENT_DAY',
                                            'COMPLETED','CANCELLED','ON_HOLD')),
  financial_health        text check (financial_health in ('PAID','HEALTHY','PAYMENT_DUE',
                                                           'OVERDUE','AT_RISK')),
  current_milestone_index integer not null default 0,
  milestones              jsonb not null default '[]'::jsonb,
  tasks                   jsonb not null default '[]'::jsonb,
  daily_logs              jsonb not null default '[]'::jsonb,
  procurement_items       jsonb not null default '[]'::jsonb,
  event_day_checklist     jsonb not null default '[]'::jsonb,
  internal_notes          jsonb not null default '[]'::jsonb,
  total_invoiced          numeric(14,2) not null default 0,
  total_received          numeric(14,2) not null default 0,
  outstanding_balance     numeric(14,2) not null default 0,
  service_description     text,
  selected_template_id    text,
  notes                   text,
  created_at              timestamptz not null default now()
);
create index if not exists projects_status_idx     on public.projects (status);
create index if not exists projects_event_date_idx on public.projects (event_date);

-- ---------------------------------------------------------------
-- Quotations
-- ---------------------------------------------------------------
create table if not exists public.quotations (
  id                    text primary key,
  quotation_number      text not null unique,
  lead_id               text,
  customer_id           text references public.customers(id) on delete set null,
  customer_name         text not null,
  customer_phone        text not null default '',
  customer_email        text,
  customer_address      text,
  event_type            text not null default '',
  event_date            date,
  venue                 text,
  template_id           text,
  template_name         text,
  quotation_date        date not null default current_date,
  valid_until           date,
  items                 jsonb not null default '[]'::jsonb,
  subtotal              numeric(14,2) not null default 0,
  discount              numeric(14,2) not null default 0,
  taxable_amount        numeric(14,2) not null default 0,
  tax_rate              numeric(5,2)  not null default 18,
  cgst_amount           numeric(14,2),
  sgst_amount           numeric(14,2),
  igst_amount           numeric(14,2),
  tax_amount            numeric(14,2) not null default 0,
  total                 numeric(14,2) not null default 0,
  status                text not null default 'DRAFT'
                        check (status in ('DRAFT','SENT','VIEWED','NEGOTIATION',
                                          'ACCEPTED','REJECTED','EXPIRED')),
  notes                 text,
  terms_and_conditions  jsonb not null default '[]'::jsonb,
  prepared_by           text not null default '',
  created_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Invoices
-- ---------------------------------------------------------------
create table if not exists public.invoices (
  id               text primary key,
  invoice_number   text not null unique,
  project_id       text references public.projects(id) on delete set null,
  project_name     text,
  customer_id      text references public.customers(id) on delete set null,
  customer_name    text not null,
  customer_phone   text,
  customer_email   text,
  customer_address text,
  customer_gstin   text,
  invoice_date     date not null default current_date,
  due_date         date,
  items            jsonb not null default '[]'::jsonb,
  subtotal         numeric(14,2) not null default 0,
  discount         numeric(14,2) not null default 0,
  taxable_amount   numeric(14,2) not null default 0,
  tax_rate         numeric(5,2)  not null default 18,
  is_interstate    boolean not null default false,
  cgst_rate        numeric(5,2),
  cgst_amount      numeric(14,2),
  sgst_rate        numeric(5,2),
  sgst_amount      numeric(14,2),
  igst_rate        numeric(5,2),
  igst_amount      numeric(14,2),
  tax_amount       numeric(14,2) not null default 0,
  total            numeric(14,2) not null default 0,
  amount_paid      numeric(14,2) not null default 0,
  balance          numeric(14,2) not null default 0,
  status           text not null default 'DRAFT',
  hsn_sac_code     text,
  reverse_charge   boolean not null default false,
  bank_details     jsonb,
  notes            text,
  terms            text,
  created_at       timestamptz not null default now()
);
create index if not exists invoices_customer_idx on public.invoices (customer_id);
create index if not exists invoices_status_idx   on public.invoices (status);

-- ---------------------------------------------------------------
-- Payments
-- ---------------------------------------------------------------
create table if not exists public.payments (
  id               text primary key,
  invoice_id       text references public.invoices(id) on delete cascade,
  invoice_number   text not null default '',
  project_id       text references public.projects(id) on delete set null,
  project_name     text,
  customer_name    text not null default '',
  amount           numeric(14,2) not null,
  payment_date     date not null default current_date,
  payment_method   text not null default 'UPI',
  payment_stage    text check (payment_stage in ('ADVANCE','SECOND_PAYMENT',
                                                 'FINAL_PAYMENT','OTHER')),
  reference_number text,
  notes            text,
  created_by       text not null default '',
  created_at       timestamptz not null default now()
);
create index if not exists payments_invoice_idx on public.payments (invoice_id);
create index if not exists payments_project_idx on public.payments (project_id);

-- ---------------------------------------------------------------
-- Business settings (single row, id = 1)
-- ---------------------------------------------------------------
create table if not exists public.business_settings (
  id         integer primary key default 1 check (id = 1),
  settings   jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------
alter table public.profiles          enable row level security;
alter table public.customers         enable row level security;
alter table public.leads             enable row level security;
alter table public.projects          enable row level security;
alter table public.quotations        enable row level security;
alter table public.invoices          enable row level security;
alter table public.payments          enable row level security;
alter table public.business_settings enable row level security;

do $rls$
declare t text;
begin
  foreach t in array array['customers','leads','projects','quotations',
                           'invoices','payments','business_settings']
  loop
    execute format(
      'drop policy if exists "authenticated full access" on public.%I', t);
    execute format(
      'create policy "authenticated full access" on public.%I
         for all to authenticated using (true) with check (true)', t);
  end loop;
end
$rls$;

-- Profiles: everyone signed in can read the team; you may edit only yourself.
drop policy if exists "read team"   on public.profiles;
drop policy if exists "update self" on public.profiles;
create policy "read team"   on public.profiles for select to authenticated using (true);
create policy "update self" on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);
