-- One-time backfill for agencies created before trigger fix,
-- where agency name was derived from email local-part.
-- If auth metadata has agency_name, promote it into agencies.name.

update public.agencies as a
set
  name = trim(u.raw_user_meta_data ->> 'agency_name'),
  updated_at = now()
from auth.users as u
where a.owner_user_id = u.id
  and nullif(trim(u.raw_user_meta_data ->> 'agency_name'), '') is not null
  and (
    lower(coalesce(a.name, '')) = split_part(lower(coalesce(u.email, '')), '@', 1)
    or lower(coalesce(a.name, '')) = 'new agency'
  );
