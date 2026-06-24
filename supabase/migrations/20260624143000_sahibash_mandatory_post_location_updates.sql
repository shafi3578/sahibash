begin;

-- Support device-based capture as an explicit source option.
do $$
begin
  if exists (select 1 from pg_type where typname = 'location_source') then
    begin
      alter type public.location_source add value if not exists 'device';
    exception when duplicate_object then
      null;
    end;
  end if;
end $$;

-- Track explicit confirmation in posting flow.
alter table public.listings
  add column if not exists is_location_confirmed boolean not null default false;

-- Privacy default: show only province/district unless seller opts in.
alter table public.listings
  alter column location_visibility set default 'hidden'::public.location_visibility;

create index if not exists idx_listings_location_confirmed on public.listings(is_location_confirmed);

commit;
