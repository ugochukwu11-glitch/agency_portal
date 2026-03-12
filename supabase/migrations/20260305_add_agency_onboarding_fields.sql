-- Add agency onboarding profile fields and completion flags.

alter table public.agencies
  add column if not exists phone text,
  add column if not exists city text,
  add column if not exists address text,
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz;

-- Keep provisioning semantics aligned with verified-login flow.
alter table public.agencies
  alter column status set default 'pending';

-- Optional backfill for existing active agencies with a meaningful name.
-- This avoids blocking already onboarded users after rollout.
update public.agencies
set onboarding_completed = true,
    onboarding_completed_at = coalesce(onboarding_completed_at, updated_at, now())
where status = 'active'
  and onboarding_completed = false
  and name is not null
  and btrim(name) <> ''
  and lower(btrim(name)) <> 'new agency';

-- Optional: force PostgREST schema cache refresh.
select pg_notify('pgrst', 'reload schema');
