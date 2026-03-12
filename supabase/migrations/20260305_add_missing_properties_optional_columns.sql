-- Align properties schema with listing form/API expectations.
-- Fixes: "Could not find the 'description' column of 'properties' in the schema cache"

alter table public.properties
  add column if not exists description text,
  add column if not exists location_text text;

-- Optional: ask PostgREST to reload schema cache immediately.
select pg_notify('pgrst', 'reload schema');
