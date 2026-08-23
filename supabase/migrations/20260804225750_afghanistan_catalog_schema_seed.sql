begin;

-- Publish the existing catalog as editable schema versions. Existing fields,
-- listings, users, and category rows are never changed or removed.
with super_admin as (
  select ur.user_id
  from public.admin_user_roles ur
  join public.admin_roles r on r.id = ur.role_id
  where r.name = 'super_administrator'
  order by ur.user_id
  limit 1
),
template_fields(root_slug, field_key, field_type, label_en, label_fa, label_ps, options, required, filterable, card, section_key, sort_order) as (
  values
  (null, 'condition', 'select', 'Condition', 'وضعیت', 'حالت', '[{"value":"new","labels":{"en":"New","fa":"نو","ps":"نوی"}},{"value":"like_new","labels":{"en":"Like new","fa":"مانند نو","ps":"د نوي په شان"}},{"value":"used","labels":{"en":"Used","fa":"استفاده شده","ps":"کارول شوی"}},{"value":"needs_repair","labels":{"en":"Needs repair","fa":"نیاز به ترمیم","ps":"ترمیم ته اړتیا لري"}}]'::jsonb, true, true, true, 'overview', 10),
  (null, 'seller_type', 'select', 'Seller type', 'نوع فروشنده', 'د پلورونکي ډول', '[{"value":"owner","labels":{"en":"Owner","fa":"مالک","ps":"مالک"}},{"value":"dealer","labels":{"en":"Dealer / shop","fa":"دکاندار","ps":"پلورنځی"}},{"value":"agent","labels":{"en":"Agent","fa":"نماینده","ps":"استازی"}}]'::jsonb, false, true, true, 'overview', 20),
  (null, 'delivery_available', 'boolean', 'Delivery available', 'ارسال موجود است', 'رسونه شته', '[]'::jsonb, false, true, true, 'trade', 80),
  (null, 'exchange_possible', 'boolean', 'Exchange possible', 'تبادله ممکن است', 'تبادله ممکنه ده', '[]'::jsonb, false, true, false, 'trade', 90),

  ('jobs', 'job_type', 'select', 'Job type', 'نوع وظیفه', 'د دندې ډول', '[{"value":"full_time","labels":{"en":"Full time","fa":"تمام وقت","ps":"بشپړ وخت"}},{"value":"part_time","labels":{"en":"Part time","fa":"نیمه وقت","ps":"نیمه وخت"}},{"value":"contract","labels":{"en":"Contract","fa":"قراردادی","ps":"قراردادي"}},{"value":"daily","labels":{"en":"Daily wage","fa":"روز مزد","ps":"ورځنی مزد"}}]'::jsonb, true, true, true, 'job', 30),
  ('jobs', 'experience_level', 'select', 'Experience level', 'سطح تجربه', 'د تجربې کچه', '[{"value":"entry","labels":{"en":"Entry level","fa":"تازه کار","ps":"پیل کونکی"}},{"value":"mid","labels":{"en":"Mid level","fa":"متوسط","ps":"منځنۍ"}},{"value":"senior","labels":{"en":"Senior","fa":"با تجربه","ps":"لوړه تجربه"}}]'::jsonb, true, true, false, 'job', 40),
  ('jobs', 'education_level', 'select', 'Education required', 'تحصیلات مورد نیاز', 'اړینه زده کړه', '[{"value":"none","labels":{"en":"No formal requirement","fa":"بدون شرط تحصیلی","ps":"رسمي شرط نشته"}},{"value":"school","labels":{"en":"School","fa":"مکتب","ps":"ښوونځی"}},{"value":"bachelor","labels":{"en":"Bachelor","fa":"لیسانس","ps":"لیسانس"}},{"value":"master","labels":{"en":"Master or higher","fa":"ماستری یا بالاتر","ps":"ماسټري یا پورته"}}]'::jsonb, false, true, false, 'job', 50),
  ('jobs', 'salary_period', 'select', 'Salary period', 'دوره معاش', 'د معاش موده', '[{"value":"monthly","labels":{"en":"Monthly","fa":"ماهانه","ps":"میاشتنی"}},{"value":"daily","labels":{"en":"Daily","fa":"روزانه","ps":"ورځنی"}},{"value":"project","labels":{"en":"Per project","fa":"فی پروژه","ps":"د پروژې پر بنسټ"}}]'::jsonb, false, true, false, 'job', 60),
  ('jobs', 'remote_allowed', 'boolean', 'Remote work available', 'کار از راه دور', 'له لرې کار', '[]'::jsonb, false, true, true, 'job', 70),

  ('services', 'service_mode', 'select', 'Service mode', 'شیوه خدمت', 'د خدمت طریقه', '[{"value":"on_site","labels":{"en":"On site","fa":"در محل","ps":"په ځای کې"}},{"value":"home_visit","labels":{"en":"Home visit","fa":"مراجعه به منزل","ps":"کور ته ورتګ"}},{"value":"online","labels":{"en":"Online","fa":"آنلاین","ps":"انلاین"}}]'::jsonb, true, true, true, 'service', 30),
  ('services', 'experience_years', 'number', 'Years of experience', 'سال‌های تجربه', 'د تجربې کلونه', '[]'::jsonb, false, true, true, 'service', 40),
  ('services', 'price_basis', 'select', 'Price basis', 'مبنای قیمت', 'د بیې بنسټ', '[{"value":"fixed","labels":{"en":"Fixed","fa":"ثابت","ps":"ثابت"}},{"value":"hourly","labels":{"en":"Hourly","fa":"ساعتی","ps":"ساعتي"}},{"value":"daily","labels":{"en":"Daily","fa":"روزانه","ps":"ورځنی"}},{"value":"negotiable","labels":{"en":"Negotiable","fa":"توافقی","ps":"د خبرو وړ"}}]'::jsonb, false, true, false, 'service', 50),
  ('services', 'emergency_service', 'boolean', 'Emergency service', 'خدمت عاجل', 'بیړنی خدمت', '[]'::jsonb, false, true, true, 'service', 60),

  ('education', 'delivery_mode', 'select', 'Learning mode', 'شیوه آموزش', 'د زده کړې طریقه', '[{"value":"in_person","labels":{"en":"In person","fa":"حضوری","ps":"حضوري"}},{"value":"online","labels":{"en":"Online","fa":"آنلاین","ps":"انلاین"}},{"value":"hybrid","labels":{"en":"Hybrid","fa":"ترکیبی","ps":"ګډ"}}]'::jsonb, true, true, true, 'course', 30),
  ('education', 'education_level', 'select', 'Level', 'سطح', 'کچه', '[{"value":"beginner","labels":{"en":"Beginner","fa":"مبتدی","ps":"پیل"}},{"value":"intermediate","labels":{"en":"Intermediate","fa":"متوسط","ps":"منځنۍ"}},{"value":"advanced","labels":{"en":"Advanced","fa":"پیشرفته","ps":"پرمختللې"}}]'::jsonb, false, true, false, 'course', 40),
  ('education', 'certificate_available', 'boolean', 'Certificate available', 'سند موجود است', 'سند شته', '[]'::jsonb, false, true, true, 'course', 50),
  ('education', 'duration', 'text', 'Duration', 'مدت', 'موده', '[]'::jsonb, false, false, false, 'course', 60),

  ('business-industry', 'business_type', 'text', 'Business type', 'نوع تجارت', 'د سوداګرۍ ډول', '[]'::jsonb, true, true, true, 'business', 30),
  ('business-industry', 'years_operating', 'number', 'Years operating', 'سال‌های فعالیت', 'د فعالیت کلونه', '[]'::jsonb, false, true, true, 'business', 40),
  ('business-industry', 'license_status', 'select', 'License status', 'وضعیت جواز', 'د جواز حالت', '[{"value":"licensed","labels":{"en":"Licensed","fa":"دارای جواز","ps":"جواز لري"}},{"value":"pending","labels":{"en":"Pending","fa":"در حال طی مراحل","ps":"د پروسې لاندې"}},{"value":"not_required","labels":{"en":"Not required","fa":"نیاز نیست","ps":"اړین نه دی"}}]'::jsonb, false, true, false, 'business', 50),
  ('business-industry', 'employees', 'number', 'Number of employees', 'تعداد کارمندان', 'د کارکوونکو شمېر', '[]'::jsonb, false, true, false, 'business', 60),

  ('farm-animals', 'quantity', 'number', 'Quantity', 'تعداد', 'شمېر', '[]'::jsonb, true, true, true, 'agriculture', 30),
  ('farm-animals', 'breed_or_variety', 'text', 'Breed or variety', 'نسل یا نوع', 'نسل یا ډول', '[]'::jsonb, false, true, true, 'agriculture', 40),
  ('farm-animals', 'age_or_harvest', 'text', 'Age or harvest information', 'سن یا معلومات برداشت', 'د عمر یا حاصلاتو معلومات', '[]'::jsonb, false, false, false, 'agriculture', 50),
  ('farm-animals', 'health_verified', 'boolean', 'Health verified', 'صحت تأیید شده', 'روغتیا تایید شوې', '[]'::jsonb, false, true, true, 'agriculture', 60),

  ('sports-hobbies', 'activity_type', 'text', 'Sport or activity', 'ورزش یا فعالیت', 'سپورت یا فعالیت', '[]'::jsonb, true, true, true, 'item', 30),
  ('sports-hobbies', 'brand', 'text', 'Brand', 'برند', 'برانډ', '[]'::jsonb, false, true, true, 'item', 40),
  ('sports-hobbies', 'size', 'text', 'Size', 'اندازه', 'اندازه', '[]'::jsonb, false, true, false, 'item', 50),
  ('sports-hobbies', 'age_group', 'select', 'Age group', 'گروه سنی', 'د عمر ډله', '[{"value":"children","labels":{"en":"Children","fa":"اطفال","ps":"ماشومان"}},{"value":"adult","labels":{"en":"Adult","fa":"بزرگسال","ps":"لویان"}},{"value":"all","labels":{"en":"All ages","fa":"همه سنین","ps":"ټول عمرونه"}}]'::jsonb, false, true, false, 'item', 60)
),
existing_fields as (
  select
    n.id as category_node_id,
    f.field_key as key,
    f.field_type as type,
    jsonb_build_object(
      'en', f.field_label,
      'fa', case f.field_key
        when 'brand' then 'برند' when 'model' then 'مدل' when 'condition' then 'وضعیت'
        when 'color' then 'رنگ' when 'year' then 'سال' when 'size' then 'اندازه'
        when 'material' then 'جنس' when 'quantity' then 'تعداد' when 'warranty' then 'تضمین'
        when 'rooms' then 'اتاق‌ها' when 'bathrooms' then 'حمام‌ها' when 'area' then 'مساحت'
        when 'fuel_type' then 'نوع سوخت' when 'transmission' then 'گیربکس' when 'mileage' then 'کارکرد'
        else f.field_label end,
      'ps', case f.field_key
        when 'brand' then 'برانډ' when 'model' then 'ماډل' when 'condition' then 'حالت'
        when 'color' then 'رنګ' when 'year' then 'کال' when 'size' then 'اندازه'
        when 'material' then 'مواد' when 'quantity' then 'شمېر' when 'warranty' then 'تضمین'
        when 'rooms' then 'خونې' when 'bathrooms' then 'تشنابونه' when 'area' then 'مساحت'
        when 'fuel_type' then 'د سون ډول' when 'transmission' then 'ګیربکس' when 'mileage' then 'مایلیج'
        else f.field_label end
    ) as labels,
    coalesce((select jsonb_agg(jsonb_build_object('value', value, 'labels', jsonb_build_object('en', value, 'fa', value, 'ps', value)))
      from jsonb_array_elements_text(case when jsonb_typeof(f.options_json) = 'array' then f.options_json else '[]'::jsonb end) value), '[]'::jsonb) as options,
    f.unit,
    coalesce(nullif(f.group_key, ''), 'details') as section_key,
    coalesce(f.sort_order, f.display_order, 0) as sort_order,
    f.is_required as required,
    f.is_active as posting,
    coalesce(f.is_filterable, false) as filterable,
    coalesce(f.display_order, 999) < 4 as card,
    true as detail,
    f.is_active as active
  from public.category_nodes n
  join public.category_fields f on f.category_node_id = n.id
  where n.is_active and f.is_active
),
generated_fields as (
  select
    n.id as category_node_id, t.field_key as key, t.field_type as type,
    jsonb_build_object('en', t.label_en, 'fa', t.label_fa, 'ps', t.label_ps) as labels,
    t.options, null::text as unit, t.section_key, t.sort_order,
    t.required, true as posting, t.filterable, t.card, true as detail, true as active
  from public.category_nodes n
  cross join template_fields t
  where n.is_active
    and not exists (select 1 from public.category_fields f where f.category_node_id = n.id and f.is_active)
    and (t.root_slug is null or t.root_slug = split_part(n.path, '/', 1))
),
all_fields as (
  select * from existing_fields
  union all
  select * from generated_fields
),
field_json as (
  select category_node_id,
    jsonb_agg(jsonb_build_object(
      'key', key, 'type', type, 'labels', labels, 'options', options, 'unit', unit,
      'sectionKey', section_key, 'order', sort_order, 'required', required,
      'posting', posting, 'filter', filterable, 'card', card, 'detail', detail, 'active', active
    ) order by sort_order, key) as fields
  from all_fields
  group by category_node_id
),
section_keys as (
  select category_node_id, section_key, min(sort_order) as sort_order
  from all_fields group by category_node_id, section_key
),
ordered_sections as (
  select category_node_id, section_key, sort_order,
    row_number() over (partition by category_node_id order by sort_order, section_key) - 1 as section_order
  from section_keys
),
section_json as (
  select category_node_id,
    jsonb_agg(jsonb_build_object(
      'key', section_key,
      'titles', jsonb_build_object(
        'en', initcap(replace(section_key, '_', ' ')),
        'fa', case section_key when 'overview' then 'مرور کلی' when 'trade' then 'معامله و تحویل' when 'job' then 'جزئیات وظیفه' when 'service' then 'جزئیات خدمت' when 'course' then 'جزئیات آموزش' when 'business' then 'جزئیات تجارت' when 'agriculture' then 'جزئیات زراعت' when 'item' then 'جزئیات جنس' else 'مشخصات' end,
        'ps', case section_key when 'overview' then 'لنډیز' when 'trade' then 'معامله او سپارل' when 'job' then 'د دندې جزیات' when 'service' then 'د خدمت جزیات' when 'course' then 'د زده کړې جزیات' when 'business' then 'د سوداګرۍ جزیات' when 'agriculture' then 'د کرنې جزیات' when 'item' then 'د توکي جزیات' else 'ځانګړنې' end
      ),
      'order', section_order,
      'visible', true
    ) order by sort_order, section_key) as sections
  from ordered_sections
  group by category_node_id
)
insert into public.listing_schema_versions(category_node_id, version, status, config, created_by)
select n.id, 1, 'published', jsonb_build_object('schemaVersion', 1, 'fields', f.fields, 'sections', s.sections), a.user_id
from public.category_nodes n
join field_json f on f.category_node_id = n.id
join section_json s on s.category_node_id = n.id
cross join super_admin a
where n.is_active
  and not exists (select 1 from public.listing_schema_versions v where v.category_node_id = n.id);

commit;
