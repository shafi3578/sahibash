begin;

-- Ensure newer application value is valid on legacy databases.
do $$
begin
  alter type public.location_visibility add value if not exists 'province_district';
exception
  when duplicate_object then
    null;
end $$;

commit;
