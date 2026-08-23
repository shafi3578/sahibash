begin;

-- Profiles are created by the trusted auth trigger. Browser users may edit
-- presentation/contact fields, but authorization fields are never writable.
revoke insert, update on table public.profiles from anon, authenticated;
grant select on table public.profiles to authenticated;
grant update (
  full_name,
  phone,
  city,
  avatar_url,
  province,
  preferred_language,
  updated_at
) on public.profiles to authenticated;

drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own_or_admin on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

-- The older permissive policy was OR-ed with the restricted policy and made
-- featured/approval protections ineffective. Keep exactly one update policy.
drop policy if exists listings_update_owner_or_admin on public.listings;
drop policy if exists listings_update_owner_limited_or_admin on public.listings;
create policy listings_update_owner_limited_or_admin
on public.listings
for update
to authenticated
using (
  user_id = (select auth.uid())
  or (select public.is_admin((select auth.uid())))
)
with check (
  (select public.is_admin((select auth.uid())))
  or (
    user_id = (select auth.uid())
    and featured = false
    and urgent = false
    and approved_by is null
    and approved_at is null
    and status in ('pending', 'rejected', 'sold', 'expired')
  )
);

commit;
