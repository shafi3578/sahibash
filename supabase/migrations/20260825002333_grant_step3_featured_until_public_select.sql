-- Step 3 public listing boundary repair applied to the linked Supabase project
-- as migration 20260825002333. The app's safe public listing selector reads
-- featured_until so expired Featured listings can be hidden without exposing
-- private seller/location fields.

grant select (featured_until) on public.listings to anon;
grant select (featured_until) on public.listings to authenticated;
