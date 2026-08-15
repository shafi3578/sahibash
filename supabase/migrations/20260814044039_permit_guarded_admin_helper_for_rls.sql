begin;
-- Existing public policies evaluate this caller-bound helper for anonymous
-- reads. private.is_admin rejects null and identities other than auth.uid().
grant execute on function public.is_admin(uuid) to anon;
grant execute on function public.is_admin() to anon;
commit;
