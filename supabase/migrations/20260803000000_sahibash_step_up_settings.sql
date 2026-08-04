begin;

alter table public.site_settings
  add column if not exists step_up_window_minutes integer not null default 15;

create or replace function public.save_site_settings(
  payload jsonb,
  change_summary text,
  editor_id uuid
)
returns public.site_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_row public.site_settings;
  next_version integer;
begin
  insert into public.site_settings (
    id,
    site_name,
    site_tagline,
    contact_email,
    contact_phone,
    default_locale,
    home_hero_title,
    home_hero_subtitle,
    home_primary_cta_label,
    home_primary_cta_path,
    home_secondary_cta_label,
    home_secondary_cta_path,
    navigation_links,
    step_up_window_minutes
  )
  values (
    1,
    coalesce(nullif(btrim(payload->>'site_name'), ''), 'Sahibash'),
    nullif(btrim(payload->>'site_tagline'), ''),
    coalesce(nullif(btrim(payload->>'contact_email'), ''), 'hello@sahibash.com'),
    coalesce(nullif(btrim(payload->>'contact_phone'), ''), '+93700000000'),
    coalesce(nullif(btrim(payload->>'default_locale'), ''), 'fa'),
    coalesce(nullif(btrim(payload->>'home_hero_title'), ''), 'Discover trusted listings across Afghanistan'),
    coalesce(nullif(btrim(payload->>'home_hero_subtitle'), ''), 'Buy, sell, and browse with local-first controls and multilingual search.'),
    coalesce(nullif(btrim(payload->>'home_primary_cta_label'), ''), 'Browse listings'),
    coalesce(nullif(btrim(payload->>'home_primary_cta_path'), ''), '/listings'),
    nullif(btrim(payload->>'home_secondary_cta_label'), ''),
    nullif(btrim(payload->>'home_secondary_cta_path'), ''),
    coalesce(
      case
        when jsonb_typeof(payload->'navigation_links') = 'array' and jsonb_array_length(payload->'navigation_links') > 0 then payload->'navigation_links'
        else null
      end,
      '[{"label":"Listings","path":"/listings"},{"label":"Categories","path":"/categories"}]'::jsonb
    ),
    coalesce(nullif((payload->>'step_up_window_minutes')::int, 0), 15)
  )
  on conflict (id) do update set
    site_name = excluded.site_name,
    site_tagline = excluded.site_tagline,
    contact_email = excluded.contact_email,
    contact_phone = excluded.contact_phone,
    default_locale = excluded.default_locale,
    home_hero_title = excluded.home_hero_title,
    home_hero_subtitle = excluded.home_hero_subtitle,
    home_primary_cta_label = excluded.home_primary_cta_label,
    home_primary_cta_path = excluded.home_primary_cta_path,
    home_secondary_cta_label = excluded.home_secondary_cta_label,
    home_secondary_cta_path = excluded.home_secondary_cta_path,
    navigation_links = excluded.navigation_links,
    step_up_window_minutes = excluded.step_up_window_minutes,
    updated_at = now()
  returning * into updated_row;

  select coalesce(max(version_number), 0) + 1
  into next_version
  from public.site_settings_versions
  where site_settings_id = 1;

  insert into public.site_settings_versions (
    site_settings_id,
    version_number,
    change_summary,
    settings_snapshot,
    created_by
  ) values (
    1,
    next_version,
    nullif(btrim(change_summary), ''),
    to_jsonb(updated_row),
    editor_id
  );

  return updated_row;
end;
$$;

create or replace function public.restore_site_settings_version(
  version_row_id bigint,
  change_summary text,
  editor_id uuid
)
returns public.site_settings
language plpgsql
security definer
set search_path = public
as $$
declare
  snapshot record;
  restored_row public.site_settings;
  next_version integer;
begin
  select *
  into snapshot
  from public.site_settings_versions
  where id = version_row_id
    and site_settings_id = 1;

  if not found then
    raise exception 'Site settings version not found';
  end if;

  insert into public.site_settings (
    id,
    site_name,
    site_tagline,
    contact_email,
    contact_phone,
    default_locale,
    home_hero_title,
    home_hero_subtitle,
    home_primary_cta_label,
    home_primary_cta_path,
    home_secondary_cta_label,
    home_secondary_cta_path,
    navigation_links,
    step_up_window_minutes
  )
  values (
    1,
    coalesce(nullif(btrim(snapshot.settings_snapshot->>'site_name'), ''), 'Sahibash'),
    nullif(btrim(snapshot.settings_snapshot->>'site_tagline'), ''),
    coalesce(nullif(btrim(snapshot.settings_snapshot->>'contact_email'), ''), 'hello@sahibash.com'),
    coalesce(nullif(btrim(snapshot.settings_snapshot->>'contact_phone'), ''), '+93700000000'),
    coalesce(nullif(btrim(snapshot.settings_snapshot->>'default_locale'), ''), 'fa'),
    coalesce(nullif(btrim(snapshot.settings_snapshot->>'home_hero_title'), ''), 'Discover trusted listings across Afghanistan'),
    coalesce(nullif(btrim(snapshot.settings_snapshot->>'home_hero_subtitle'), ''), 'Buy, sell, and browse with local-first controls and multilingual search.'),
    coalesce(nullif(btrim(snapshot.settings_snapshot->>'home_primary_cta_label'), ''), 'Browse listings'),
    coalesce(nullif(btrim(snapshot.settings_snapshot->>'home_primary_cta_path'), ''), '/listings'),
    nullif(btrim(snapshot.settings_snapshot->>'home_secondary_cta_label'), ''),
    nullif(btrim(snapshot.settings_snapshot->>'home_secondary_cta_path'), ''),
    coalesce(
      case
        when jsonb_typeof(snapshot.settings_snapshot->'navigation_links') = 'array' and jsonb_array_length(snapshot.settings_snapshot->'navigation_links') > 0 then snapshot.settings_snapshot->'navigation_links'
        else null
      end,
      '[{"label":"Listings","path":"/listings"},{"label":"Categories","path":"/categories"}]'::jsonb
    ),
    coalesce(nullif((snapshot.settings_snapshot->>'step_up_window_minutes')::int, 0), 15)
  )
  on conflict (id) do update set
    site_name = excluded.site_name,
    site_tagline = excluded.site_tagline,
    contact_email = excluded.contact_email,
    contact_phone = excluded.contact_phone,
    default_locale = excluded.default_locale,
    home_hero_title = excluded.home_hero_title,
    home_hero_subtitle = excluded.home_hero_subtitle,
    home_primary_cta_label = excluded.home_primary_cta_label,
    home_primary_cta_path = excluded.home_primary_cta_path,
    home_secondary_cta_label = excluded.home_secondary_cta_label,
    home_secondary_cta_path = excluded.home_secondary_cta_path,
    navigation_links = excluded.navigation_links,
    step_up_window_minutes = excluded.step_up_window_minutes,
    updated_at = now()
  returning * into restored_row;

  select coalesce(max(version_number), 0) + 1
  into next_version
  from public.site_settings_versions
  where site_settings_id = 1;

  insert into public.site_settings_versions (
    site_settings_id,
    version_number,
    change_summary,
    settings_snapshot,
    created_by
  ) values (
    1,
    next_version,
    coalesce(nullif(btrim(change_summary), ''), 'Restored site settings version ' || version_row_id::text),
    to_jsonb(restored_row),
    editor_id
  );

  return restored_row;
end;
$$;

commit;
