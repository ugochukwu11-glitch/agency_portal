-- Agents constraints and RLS policies (owner-managed agents only).

alter table public.agents alter column agency_id set not null;
alter table public.agents alter column is_active set default true;

create unique index if not exists agents_agency_phone_unique
  on public.agents (agency_id, phone);

alter table public.agents enable row level security;

drop policy if exists "agents_select_own" on public.agents;
drop policy if exists "agents_insert_own" on public.agents;
drop policy if exists "agents_update_own" on public.agents;
drop policy if exists "agents_delete_own" on public.agents;

create policy "agents_select_own"
on public.agents
for select
using (
  agency_id in (
    select id from public.agencies where owner_user_id = auth.uid()
  )
);

create policy "agents_insert_own"
on public.agents
for insert
with check (
  agency_id in (
    select id from public.agencies where owner_user_id = auth.uid()
  )
);

create policy "agents_update_own"
on public.agents
for update
using (
  agency_id in (
    select id from public.agencies where owner_user_id = auth.uid()
  )
)
with check (
  agency_id in (
    select id from public.agencies where owner_user_id = auth.uid()
  )
);

create policy "agents_delete_own"
on public.agents
for delete
using (
  agency_id in (
    select id from public.agencies where owner_user_id = auth.uid()
  )
);

select pg_notify('pgrst', 'reload schema');
