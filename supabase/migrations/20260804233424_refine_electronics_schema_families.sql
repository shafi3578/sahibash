begin;

-- Correct compound electronics slugs discovered by the post-migration audit.
-- Reuse the validated family configuration and retain every previous version.
create temporary table electronics_schema_corrections on commit drop as
with super_admin as (
  select ur.user_id
  from public.admin_user_roles ur
  join public.admin_roles r on r.id = ur.role_id
  where r.name = 'super_administrator'
  order by ur.user_id
  limit 1
),
targets as (
  select n.id,
    case
      when n.path in (
        'mobile-phones-tablets/audio-equipment',
        'second-hand-items/electronics-computers/audio-speakers',
        'second-hand-items/electronics-computers/satellite-receivers'
      ) then 'media_device'
      when n.path like '%solar-power-equipment%'
        or n.path like '%solar-inverters%'
        or n.path like '%solar-panels%'
        or n.path like '%other-power-equipment%'
      then 'power_equipment'
      when n.path in (
        'second-hand-items/electronics-computers',
        'second-hand-items/electronics-computers/other-electronics'
      ) then 'electronic'
    end family
  from public.category_nodes n
  where n.path in (
      'mobile-phones-tablets/audio-equipment',
      'second-hand-items/electronics-computers/audio-speakers',
      'second-hand-items/electronics-computers/satellite-receivers',
      'second-hand-items/electronics-computers',
      'second-hand-items/electronics-computers/other-electronics'
    )
    or n.path like '%solar-power-equipment%'
    or n.path like '%solar-inverters%'
    or n.path like '%solar-panels%'
    or n.path like '%other-power-equipment%'
),
donors as (
  select distinct on (v.config->>'taxonomyFamily')
    v.config->>'taxonomyFamily' family,
    v.config
  from public.listing_schema_versions v
  where v.status = 'published'
    and v.config->>'taxonomyFamily' in ('media_device', 'power_equipment', 'electronic')
  order by v.config->>'taxonomyFamily', v.category_node_id
)
select
  t.id category_node_id,
  coalesce(max(existing.version), 0) + 1 next_version,
  d.config,
  a.user_id created_by
from targets t
join donors d on d.family = t.family
cross join super_admin a
left join public.listing_schema_versions existing on existing.category_node_id = t.id
where t.family is not null
group by t.id, d.config, a.user_id;

update public.listing_schema_versions current
set status = 'archived'
from electronics_schema_corrections correction
where current.category_node_id = correction.category_node_id
  and current.status = 'published';

insert into public.listing_schema_versions(category_node_id, version, status, config, created_by)
select category_node_id, next_version, 'published', config, created_by
from electronics_schema_corrections;

commit;
