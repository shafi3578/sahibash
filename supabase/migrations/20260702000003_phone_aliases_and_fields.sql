-- Phone Model Aliases and Seller-Selectable Fields Migration
-- Multilingual search support and field configurations

begin;

-- =========================================================
-- 1) Phone Model Aliases (English examples - can be expanded)
-- =========================================================
insert into public.phone_model_aliases (model_id, alias, language)
select m.id, alias_value, 'en'::public.language_code
from public.phone_models m
join public.phone_brands b on m.brand_id = b.id
cross join lateral (
  values 
    (case when b.slug = 'apple' then 'iPhone ' || substring(m.model_name_en, 8) else null end),
    (case when b.slug = 'samsung' then substring(m.model_name_en, 8) else null end),
    (case when b.slug = 'google-pixel' then substring(m.model_name_en, 8) else null end)
) t(alias_value)
where alias_value is not null
  and not exists (
    select 1 from public.phone_model_aliases pma 
    where pma.model_id = m.id and pma.alias = alias_value and pma.language = 'en'::public.language_code
  )
on conflict do nothing;

-- =========================================================
-- 2) iPhone Seller-Selectable Fields (No RAM)
-- =========================================================
insert into public.phone_selectable_fields (applies_to_os, applies_to_all, field_key, field_label_en, field_label_fa, field_label_ps, field_type, options_json, is_required, sort_order, is_active)
values
  ('iOS', false, 'color', 'Color', 'رنگ', 'رنگ', 'select', '{"options": ["Black", "White", "Silver", "Gold", "Rose Gold", "Blue", "Green", "Purple", "Red", "Yellow", "Orange", "Pink", "Midnight", "Starlight", "Space Black", "Titanium", "Other"]}', true, 1, true),
  ('iOS', false, 'storage_capacity', 'Storage Capacity', 'ظرفیت ذخیره سازی', 'د ذخیره کولو صلاحیت', 'select', '{"options": ["64GB", "128GB", "256GB", "512GB", "1TB"]}', true, 2, true),
  ('iOS', false, 'purchase_from', 'Purchased From', 'خریده شده از', 'د کومه څخه خریده شوه', 'select', '{"options": ["Official Store", "Authorized Dealer", "Online Retailer", "Private Seller", "Unknown"]}', false, 3, true),
  ('iOS', false, 'warranty', 'Warranty Status', 'حالت ضمان', 'د ضمان حالت', 'select', '{"options": ["In Warranty", "Out of Warranty", "Apple Care+", "Partial Warranty"]}', false, 4, true),
  ('iOS', false, 'condition', 'Condition', 'شرط', 'حالت', 'select', '{"options": ["Excellent (Like New)", "Very Good", "Good", "Fair", "Poor"]}', true, 5, true),
  ('iOS', false, 'battery_health', 'Battery Health %', 'صحت باتری %', 'د بیټري صحت %', 'number', null, false, 6, true),
  ('iOS', false, 'trade_in', 'Trade-In Available', 'تبدیل ممکن', 'تبادله دستیاب', 'boolean', null, false, 7, true),
  ('iOS', false, 'seller_type', 'Selling As', 'فروخت به عنوان', 'د فروخت په توګد', 'select', '{"options": ["Individual Owner", "Dealer", "Reseller"]}', false, 8, true);

-- =========================================================
-- 3) Android Seller-Selectable Fields (With RAM)
-- =========================================================
insert into public.phone_selectable_fields (applies_to_os, applies_to_all, field_key, field_label_en, field_label_fa, field_label_ps, field_type, options_json, is_required, sort_order, is_active)
values
  ('Android', false, 'color', 'Color', 'رنگ', 'رنگ', 'select', '{"options": ["Black", "White", "Silver", "Gold", "Blue", "Green", "Purple", "Red", "Yellow", "Orange", "Pink", "Gray", "Cyan", "Midnight", "Other"]}', true, 1, true),
  ('Android', false, 'storage_capacity', 'Storage Capacity', 'ظرفیت ذخیره سازی', 'د ذخیره کولو صلاحیت', 'select', '{"options": ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB"]}', true, 2, true),
  ('Android', false, 'ram', 'RAM', 'RAM', 'RAM', 'select', '{"options": ["2GB", "3GB", "4GB", "6GB", "8GB", "12GB", "16GB", "18GB", "24GB"]}', true, 3, true),
  ('Android', false, 'purchase_from', 'Purchased From', 'خریده شده از', 'د کومه څخه خریده شوه', 'select', '{"options": ["Official Store", "Authorized Dealer", "Online Retailer", "Private Seller", "Unknown"]}', false, 4, true),
  ('Android', false, 'warranty', 'Warranty Status', 'حالت ضمان', 'د ضمان حالت', 'select', '{"options": ["In Warranty", "Out of Warranty", "Partial Warranty"]}', false, 5, true),
  ('Android', false, 'condition', 'Condition', 'شرط', 'حالت', 'select', '{"options": ["Excellent (Like New)", "Very Good", "Good", "Fair", "Poor"]}', true, 6, true),
  ('Android', false, 'trade_in', 'Trade-In Available', 'تبدیل ممکن', 'تبادله دستیاب', 'boolean', null, false, 7, true),
  ('Android', false, 'seller_type', 'Selling As', 'فروخت به عنوان', 'د فروخت په توګد', 'select', '{"options": ["Individual Owner", "Dealer", "Reseller"]}', false, 8, true);

-- =========================================================
-- 4) HarmonyOS (Huawei) Seller-Selectable Fields
-- =========================================================
insert into public.phone_selectable_fields (applies_to_os, applies_to_all, field_key, field_label_en, field_label_fa, field_label_ps, field_type, options_json, is_required, sort_order, is_active)
values
  ('HarmonyOS', false, 'color', 'Color', 'رنگ', 'رنگ', 'select', '{"options": ["Black", "White", "Silver", "Gold", "Purple", "Green", "Red", "Blue", "Other"]}', true, 1, true),
  ('HarmonyOS', false, 'storage_capacity', 'Storage Capacity', 'ظرفیت ذخیره سازی', 'د ذخیره کولو صلاحیت', 'select', '{"options": ["128GB", "256GB", "512GB", "1TB"]}', true, 2, true),
  ('HarmonyOS', false, 'ram', 'RAM', 'RAM', 'RAM', 'select', '{"options": ["8GB", "12GB", "16GB"]}', true, 3, true),
  ('HarmonyOS', false, 'condition', 'Condition', 'شرط', 'حالت', 'select', '{"options": ["Excellent (Like New)", "Very Good", "Good", "Fair", "Poor"]}', true, 4, true),
  ('HarmonyOS', false, 'trade_in', 'Trade-In Available', 'تبدیل ممکن', 'تبادله دستیاب', 'boolean', null, false, 5, true);

commit;
