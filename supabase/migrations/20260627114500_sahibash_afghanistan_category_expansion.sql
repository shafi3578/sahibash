begin;

alter table public.category_nodes
  add column if not exists name_en text,
  add column if not exists name_fa text,
  add column if not exists name_ps text;

insert into public.categories (name, slug, description, display_order, is_active)
values
  ('Vehicles', 'vehicles', 'Cars, motorcycles, trucks, vans, parts and Afghan transport listings.', 1, true),
  ('Mobile Phones & Tablets', 'mobile-phones-tablets', 'Phones, tablets, watches, accessories, and repair.', 2, true),
  ('Computers & Electronics', 'electronics-computers', 'Laptops, computers, TVs, cameras, printers, and devices.', 3, true),
  ('Real Estate', 'real-estate', 'Houses, apartments, rooms, shops, and land for sale/rent.', 4, true),
  ('Jobs', 'jobs', 'Full-time, part-time, daily work, internships, and job seekers.', 5, true),
  ('Services', 'services', 'Construction, repair, transport, legal, medical, and local services.', 6, true),
  ('Home & Furniture', 'home-furniture-appliances', 'Furniture, home appliances, decor, and household goods.', 7, true),
  ('Animals & Agriculture', 'farm-animals', 'Livestock, feed, farm tools, seeds, and agriculture items.', 8, true),
  ('Clothing & Personal Items', 'clothing-personal-items', 'Men, women, children, shoes, bags, and personal items.', 9, true),
  ('Business & Industrial', 'business-industry', 'Industrial equipment, machinery, wholesale, and office tools.', 10, true),
  ('Education', 'education', 'Books, tutors, courses, classes, and exam preparation.', 11, true),
  ('Wanted / Request Ads', 'wanted-request-ads', 'Requests for buying, renting, hiring, and finding items/services.', 12, true),
  ('General Items / Other', 'general-items-other', 'General marketplace items that do not fit strict categories.', 13, true)
on conflict (slug) do update
set
  name = excluded.name,
  description = excluded.description,
  display_order = excluded.display_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.category_nodes (
  category_id,
  parent_id,
  name,
  slug,
  level,
  path,
  display_order,
  sort_order,
  is_active,
  is_leaf,
  description,
  icon,
  name_en,
  name_fa,
  name_ps
)
select
  c.id,
  null,
  c.name,
  c.slug,
  1,
  c.slug,
  c.display_order,
  c.display_order,
  c.is_active,
  false,
  c.description,
  case c.slug
    when 'vehicles' then 'car'
    when 'mobile-phones-tablets' then 'smartphone'
    when 'electronics-computers' then 'laptop'
    when 'real-estate' then 'home'
    when 'jobs' then 'briefcase'
    when 'services' then 'wrench'
    when 'home-furniture-appliances' then 'sofa'
    when 'farm-animals' then 'tractor'
    when 'clothing-personal-items' then 'shirt'
    when 'business-industry' then 'factory'
    when 'education' then 'book-open'
    when 'wanted-request-ads' then 'search'
    when 'general-items-other' then 'dots-horizontal'
    else 'dots-horizontal'
  end,
  c.name,
  case c.slug
    when 'vehicles' then 'وسایط'
    when 'mobile-phones-tablets' then 'موبایل و تبلت'
    when 'electronics-computers' then 'کمپیوتر و الکترونیک'
    when 'real-estate' then 'املاک'
    when 'jobs' then 'وظایف'
    when 'services' then 'خدمات'
    when 'home-furniture-appliances' then 'خانه و فرنیچر'
    when 'farm-animals' then 'حیوانات و زراعت'
    when 'clothing-personal-items' then 'لباس و وسایل شخصی'
    when 'business-industry' then 'تجارت و صنعت'
    when 'education' then 'آموزش'
    when 'wanted-request-ads' then 'نیازمندی / درخواست'
    when 'general-items-other' then 'اجناس عمومی / سایر'
    else c.name
  end,
  case c.slug
    when 'vehicles' then 'موټرې'
    when 'mobile-phones-tablets' then 'موبایل او ټابلیټ'
    when 'electronics-computers' then 'کمپیوټر او الکترونیک'
    when 'real-estate' then 'املاک'
    when 'jobs' then 'دندې'
    when 'services' then 'خدمتونه'
    when 'home-furniture-appliances' then 'کور او فرنیچر'
    when 'farm-animals' then 'حیوانات او کرنه'
    when 'clothing-personal-items' then 'جامې او شخصي توکي'
    when 'business-industry' then 'سوداګري او صنعت'
    when 'education' then 'زده کړه'
    when 'wanted-request-ads' then 'غوښتنه / Wanted اعلانونه'
    when 'general-items-other' then 'عمومي توکي / نور'
    else c.name
  end
from public.categories c
where c.slug in (
  'vehicles', 'mobile-phones-tablets', 'electronics-computers', 'real-estate',
  'jobs', 'services', 'home-furniture-appliances', 'farm-animals',
  'clothing-personal-items', 'business-industry', 'education',
  'wanted-request-ads', 'general-items-other'
)
on conflict (path) do update
set
  name = excluded.name,
  display_order = excluded.display_order,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  description = excluded.description,
  icon = excluded.icon,
  name_en = excluded.name_en,
  name_fa = excluded.name_fa,
  name_ps = excluded.name_ps,
  updated_at = now();

insert into public.category_aliases (category_id, alias, language)
select c.id, a.alias, a.language
from public.categories c
join (
  values
    ('vehicles', 'car', 'en'),
    ('vehicles', 'vehicle', 'en'),
    ('vehicles', 'موتر', 'fa'),
    ('vehicles', 'موټر', 'ps'),
    ('real-estate', 'house', 'en'),
    ('real-estate', 'home', 'en'),
    ('real-estate', 'خانه', 'fa'),
    ('real-estate', 'کور', 'ps'),
    ('jobs', 'job', 'en'),
    ('jobs', 'work', 'en'),
    ('jobs', 'وظیفه', 'fa'),
    ('jobs', 'کار', 'fa'),
    ('mobile-phones-tablets', 'phone', 'en'),
    ('mobile-phones-tablets', 'mobile', 'en'),
    ('mobile-phones-tablets', 'موبایل', 'fa'),
    ('mobile-phones-tablets', 'تلیفون', 'ps'),
    ('wanted-request-ads', 'wanted', 'en'),
    ('wanted-request-ads', 'need', 'en'),
    ('wanted-request-ads', 'نیاز دارم', 'fa'),
    ('wanted-request-ads', 'ضرورت لرم', 'ps')
) as a(slug, alias, language) on a.slug = c.slug
on conflict do nothing;

insert into public.posting_category_config (
  category_id,
  category_node_id,
  requires_images,
  min_images,
  max_images,
  recommended_images,
  allow_video,
  posting_mode,
  ai_category_hint,
  required_contact_fields,
  smart_post_enabled,
  quick_post_enabled,
  parse_telegram_enabled,
  is_active
)
select
  c.id,
  root.id,
  case
    when c.slug in ('jobs', 'services', 'wanted-request-ads') then false
    when c.slug in ('real-estate') then false
    else true
  end,
  case
    when c.slug in ('jobs', 'services', 'wanted-request-ads') then 0
    when c.slug = 'real-estate' then 0
    else 1
  end,
  case
    when c.slug in ('vehicles', 'real-estate') then 15
    when c.slug in ('mobile-phones-tablets', 'electronics-computers', 'home-furniture-appliances', 'farm-animals') then 12
    else 10
  end,
  case
    when c.slug = 'vehicles' then 'front, back, sides, interior, dashboard, odometer, engine'
    when c.slug = 'mobile-phones-tablets' then 'front, back, screen on, box, charger, damage if any'
    when c.slug = 'real-estate' then 'rooms, kitchen, bathroom, front view'
    when c.slug = 'home-furniture-appliances' then 'full view, close-up, any damage'
    when c.slug = 'farm-animals' then 'full body and condition photos'
    else null
  end,
  true,
  'guided',
  c.slug,
  array['contact_phone'],
  true,
  true,
  true,
  true
from public.categories c
join public.category_nodes root on root.category_id = c.id and root.parent_id is null
where c.slug in (
  'vehicles', 'mobile-phones-tablets', 'electronics-computers', 'real-estate',
  'jobs', 'services', 'home-furniture-appliances', 'farm-animals',
  'wanted-request-ads', 'business-industry', 'education', 'clothing-personal-items', 'general-items-other'
)
on conflict (category_id) do update
set
  requires_images = excluded.requires_images,
  min_images = excluded.min_images,
  max_images = excluded.max_images,
  recommended_images = excluded.recommended_images,
  allow_video = excluded.allow_video,
  smart_post_enabled = excluded.smart_post_enabled,
  quick_post_enabled = excluded.quick_post_enabled,
  parse_telegram_enabled = excluded.parse_telegram_enabled,
  is_active = true,
  updated_at = now();

commit;
