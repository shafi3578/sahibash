begin;

with authorized_actor as (
  select aur.user_id
  from public.admin_user_roles aur
  join public.admin_roles ar on ar.id = aur.role_id
  where ar.name = 'super_administrator'
  order by aur.assigned_at desc nulls last, aur.user_id
  limit 1
), updated_settings as (
  update public.site_settings s
  set site_tagline = 'Afghanistan’s trusted marketplace',
      home_hero_title = 'Find trusted listings across Afghanistan',
      home_hero_subtitle = 'Buy, sell, and browse vehicles, homes, phones, services, and more with local search in English, Dari, and Pashto.',
      home_primary_cta_label = 'Browse ads',
      home_secondary_cta_label = 'Post an ad',
      updated_at = now()
  where s.id = 1
  returning s.*
), version_row as (
  insert into public.site_settings_versions (
    site_settings_id,
    version_number,
    change_summary,
    settings_snapshot,
    created_by,
    created_at,
    published_at
  )
  select
    updated_settings.id,
    coalesce((select max(version_number) + 1 from public.site_settings_versions where site_settings_id = updated_settings.id), 1),
    'Step 1 final production copy cleanup',
    to_jsonb(updated_settings),
    authorized_actor.user_id,
    now(),
    now()
  from updated_settings
  cross join authorized_actor
  returning site_settings_id
)
insert into public.audit_logs (
  admin_user_id,
  action,
  entity_type,
  entity_id,
  safe_changes
)
select
  authorized_actor.user_id,
  'SITE_SETTINGS_COPY_UPDATED',
  'site_settings',
  updated_settings.id::text,
  jsonb_build_object(
    'reason', 'step1_localization_copy_cleanup',
    'site_tagline', updated_settings.site_tagline,
    'home_hero_title', updated_settings.home_hero_title,
    'localized_dari_pashto_rendering', 'handled in application copy',
    'source', 'step1_final_hardening'
  )
from updated_settings
cross join authorized_actor;

commit;
