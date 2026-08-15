begin;

-- Give every preserved category, including inactive/archive categories, an
-- editable schema. No category, listing, user, or existing schema is changed.
with super_admin as (
  select ur.user_id
  from public.admin_user_roles ur
  join public.admin_roles r on r.id = ur.role_id
  where r.name = 'super_administrator'
  order by ur.user_id
  limit 1
),
missing_categories as (
  select n.id, n.path
  from public.category_nodes n
  where not exists (
    select 1
    from public.listing_schema_versions v
    where v.category_node_id = n.id
  )
),
resolved_configs as (
  select
    missing.id as category_node_id,
    coalesce(
      inherited.config,
      jsonb_build_object(
        'schemaVersion', 1,
        'fields', jsonb_build_array(
          jsonb_build_object(
            'key', 'condition', 'type', 'select',
            'labels', jsonb_build_object('en', 'Condition', 'fa', 'وضعیت', 'ps', 'حالت'),
            'options', jsonb_build_array(
              jsonb_build_object('value', 'new', 'labels', jsonb_build_object('en', 'New', 'fa', 'نو', 'ps', 'نوی')),
              jsonb_build_object('value', 'used', 'labels', jsonb_build_object('en', 'Used', 'fa', 'استفاده شده', 'ps', 'کارول شوی'))
            ),
            'sectionKey', 'overview', 'order', 10, 'required', true,
            'posting', true, 'filter', true, 'card', true, 'detail', true, 'active', true
          ),
          jsonb_build_object(
            'key', 'seller_type', 'type', 'select',
            'labels', jsonb_build_object('en', 'Seller type', 'fa', 'نوع فروشنده', 'ps', 'د پلورونکي ډول'),
            'options', jsonb_build_array(
              jsonb_build_object('value', 'owner', 'labels', jsonb_build_object('en', 'Owner', 'fa', 'مالک', 'ps', 'مالک')),
              jsonb_build_object('value', 'business', 'labels', jsonb_build_object('en', 'Business', 'fa', 'تجارت', 'ps', 'سوداګري'))
            ),
            'sectionKey', 'overview', 'order', 20, 'required', false,
            'posting', true, 'filter', true, 'card', true, 'detail', true, 'active', true
          )
        ),
        'sections', jsonb_build_array(
          jsonb_build_object(
            'key', 'overview',
            'titles', jsonb_build_object('en', 'Overview', 'fa', 'مرور کلی', 'ps', 'لنډیز'),
            'order', 0, 'visible', true
          )
        )
      )
    ) as config
  from missing_categories missing
  left join lateral (
    select v.config
    from public.category_nodes ancestor
    join public.listing_schema_versions v on v.category_node_id = ancestor.id
    where v.status = 'published'
      and missing.path like ancestor.path || '/%'
    order by length(ancestor.path) desc, v.version desc
    limit 1
  ) inherited on true
)
insert into public.listing_schema_versions (
  category_node_id,
  version,
  status,
  config,
  created_by
)
select
  resolved.category_node_id,
  1,
  'published',
  resolved.config,
  admin.user_id
from resolved_configs resolved
cross join super_admin admin;

commit;
