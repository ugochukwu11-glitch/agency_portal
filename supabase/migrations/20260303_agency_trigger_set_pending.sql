-- Update agency auto-create trigger behavior:
-- agencies should start in `pending` and only move to `active`
-- after the user has verified email and logged in.

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
