-- Enforce correct agency provisioning semantics.
-- 1) New agencies are created as placeholder + pending.
-- 2) Existing bad rows are backfilled from auth metadata when possible.

-- Safety net: any insert without explicit status should be pending.
alter table public.agencies
  alter column status set default 'pending';

-- Trigger function used on auth.users insert.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.agencies (owner_user_id, name, status)
  values (
    new.id,
    'New Agency',
    'pending'
  )
  on conflict (owner_user_id) do nothing;

  return new;
end;
$$;

-- Backfill: where agency name was derived from email local-part,
-- replace with metadata agency_name if available, else keep placeholder.
update public.agencies as a
set
  name = coalesce(nullif(trim(u.raw_user_meta_data ->> 'agency_name'), ''), 'New Agency'),
  updated_at = now()
from auth.users as u
where a.owner_user_id = u.id
  and (
    lower(coalesce(a.name, '')) = split_part(lower(coalesce(u.email, '')), '@', 1)
    or nullif(trim(coalesce(a.name, '')), '') is null
  );

-- Backfill: unverified users should not have active agencies.
update public.agencies as a
set
  status = 'pending',
  updated_at = now()
from auth.users as u
where a.owner_user_id = u.id
  and u.email_confirmed_at is null
  and a.status <> 'pending';
