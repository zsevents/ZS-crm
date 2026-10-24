-- Business data (customers, leads, projects, quotations, invoices, payments, settings)
-- is only ever read and written by the CRM server, which uses the secret key and so
-- bypasses Row Level Security. Signed-in browser sessions get no direct table access:
-- before this, any signed-in account could read or change every record through the
-- public Supabase API, skipping the CRM's approval and role checks.
-- Profiles keep their own policies (read the team, update yourself).
do $$
declare t text;
begin
  foreach t in array array['customers','leads','projects','quotations',
                           'invoices','payments','business_settings']
  loop
    execute format('drop policy if exists "authenticated full access" on public.%I', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end
$$;
