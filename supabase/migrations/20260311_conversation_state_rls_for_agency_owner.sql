-- Allow agency owners to read/update conversation state only for their own leads.

alter table public.conversation_state enable row level security;

drop policy if exists "conversation_state_select_own" on public.conversation_state;
drop policy if exists "conversation_state_update_own" on public.conversation_state;
drop policy if exists "conversation_state_insert_own" on public.conversation_state;

create policy "conversation_state_select_own"
on public.conversation_state
for select
using (
  exists (
    select 1
    from public.leads l
    join public.agencies a on a.id = l.agency_id
    where l.phone = conversation_state.phone
      and a.owner_user_id = auth.uid()
  )
);

create policy "conversation_state_update_own"
on public.conversation_state
for update
using (
  exists (
    select 1
    from public.leads l
    join public.agencies a on a.id = l.agency_id
    where l.phone = conversation_state.phone
      and a.owner_user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.leads l
    join public.agencies a on a.id = l.agency_id
    where l.phone = conversation_state.phone
      and a.owner_user_id = auth.uid()
  )
);

create policy "conversation_state_insert_own"
on public.conversation_state
for insert
with check (
  exists (
    select 1
    from public.leads l
    join public.agencies a on a.id = l.agency_id
    where l.phone = conversation_state.phone
      and a.owner_user_id = auth.uid()
  )
);

select pg_notify('pgrst', 'reload schema');
