begin;

-- Keep legacy city column for backward compatibility, but do not require it.
alter table public.listings
  alter column city drop not null;

commit;
