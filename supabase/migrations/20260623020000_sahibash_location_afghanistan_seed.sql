-- Sahibash Location System - Afghanistan Data Seed
-- Populates countries, provinces, districts, and areas for Afghanistan

begin;

-- =========================================================
-- 1) Insert Country
-- =========================================================

insert into public.countries (name, slug, iso_code, sort_order, is_active)
values ('Afghanistan', 'afghanistan', 'AF', 1, true)
on conflict do nothing;

-- Get Afghanistan country ID
-- (Subqueries in INSERT VALUES don't work in Supabase, so we'll reference by known insertion)
-- The above insert ensures Afghanistan exists as the first country

-- =========================================================
-- 2) Insert Provinces
-- =========================================================

-- Get the Afghanistan country ID (inserted above, should be 1, but use subquery for safety)
insert into public.provinces (country_id, name, slug, sort_order, is_active)
select id, 'Kabul', 'kabul', 1, true from public.countries where slug = 'afghanistan'
union all
select id, 'Herat', 'herat', 2, true from public.countries where slug = 'afghanistan'
union all
select id, 'Kandahar', 'kandahar', 3, true from public.countries where slug = 'afghanistan'
union all
select id, 'Balkh', 'balkh', 4, true from public.countries where slug = 'afghanistan'
union all
select id, 'Nangarhar', 'nangarhar', 5, true from public.countries where slug = 'afghanistan'
union all
select id, 'Kunduz', 'kunduz', 6, true from public.countries where slug = 'afghanistan'
union all
select id, 'Baghlan', 'baghlan', 7, true from public.countries where slug = 'afghanistan'
union all
select id, 'Takhar', 'takhar', 8, true from public.countries where slug = 'afghanistan'
union all
select id, 'Badakhshan', 'badakhshan', 9, true from public.countries where slug = 'afghanistan'
union all
select id, 'Samangan', 'samangan', 10, true from public.countries where slug = 'afghanistan'
union all
select id, 'Sar-e Pol', 'sar-e-pol', 11, true from public.countries where slug = 'afghanistan'
union all
select id, 'Faryab', 'faryab', 12, true from public.countries where slug = 'afghanistan'
union all
select id, 'Jawzjan', 'jawzjan', 13, true from public.countries where slug = 'afghanistan'
union all
select id, 'Bamyan', 'bamyan', 14, true from public.countries where slug = 'afghanistan'
union all
select id, 'Daikundi', 'daikundi', 15, true from public.countries where slug = 'afghanistan'
union all
select id, 'Ghor', 'ghor', 16, true from public.countries where slug = 'afghanistan'
union all
select id, 'Farah', 'farah', 17, true from public.countries where slug = 'afghanistan'
union all
select id, 'Helmand', 'helmand', 18, true from public.countries where slug = 'afghanistan'
union all
select id, 'Nimroz', 'nimroz', 19, true from public.countries where slug = 'afghanistan'
union all
select id, 'Uruzgan', 'uruzgan', 20, true from public.countries where slug = 'afghanistan'
union all
select id, 'Zabul', 'zabul', 21, true from public.countries where slug = 'afghanistan'
union all
select id, 'Paktia', 'paktia', 22, true from public.countries where slug = 'afghanistan'
union all
select id, 'Paktika', 'paktika', 23, true from public.countries where slug = 'afghanistan'
union all
select id, 'Khost', 'khost', 24, true from public.countries where slug = 'afghanistan'
union all
select id, 'Logar', 'logar', 25, true from public.countries where slug = 'afghanistan'
union all
select id, 'Wardak', 'wardak', 26, true from public.countries where slug = 'afghanistan'
union all
select id, 'Parwan', 'parwan', 27, true from public.countries where slug = 'afghanistan'
union all
select id, 'Kapisa', 'kapisa', 28, true from public.countries where slug = 'afghanistan'
union all
select id, 'Panjshir', 'panjshir', 29, true from public.countries where slug = 'afghanistan'
union all
select id, 'Nuristan', 'nuristan', 30, true from public.countries where slug = 'afghanistan'
union all
select id, 'Kunar', 'kunar', 31, true from public.countries where slug = 'afghanistan'
union all
select id, 'Laghman', 'laghman', 32, true from public.countries where slug = 'afghanistan'
union all
select id, 'Ghazni', 'ghazni', 33, true from public.countries where slug = 'afghanistan'
union all
select id, 'Badghis', 'badghis', 34, true from public.countries where slug = 'afghanistan'
on conflict do nothing;

-- =========================================================
-- 3) Insert Districts (sample for major provinces)
-- =========================================================

-- Kabul Districts
insert into public.districts (province_id, name, slug, sort_order, is_active)
select id, 'Kabul City', 'kabul-city', 1, true from public.provinces where slug = 'kabul'
union all
select id, 'Charasiah', 'charasiah', 2, true from public.provinces where slug = 'kabul'
union all
select id, 'Surobi', 'surobi', 3, true from public.provinces where slug = 'kabul'
union all
select id, 'Istalif', 'istalif', 4, true from public.provinces where slug = 'kabul'

-- Herat Districts
union all
select id, 'Herat City', 'herat-city', 1, true from public.provinces where slug = 'herat'
union all
select id, 'Guzara', 'guzara', 2, true from public.provinces where slug = 'herat'
union all
select id, 'Karukh', 'karukh', 3, true from public.provinces where slug = 'herat'

-- Kandahar Districts
union all
select id, 'Kandahar City', 'kandahar-city', 1, true from public.provinces where slug = 'kandahar'
union all
select id, 'Maruf', 'maruf', 2, true from public.provinces where slug = 'kandahar'
union all
select id, 'Dand', 'dand', 3, true from public.provinces where slug = 'kandahar'

-- Balkh Districts
union all
select id, 'Mazar-i-Sharif', 'mazar-i-sharif', 1, true from public.provinces where slug = 'balkh'
union all
select id, 'Balkh', 'balkh-district', 2, true from public.provinces where slug = 'balkh'
union all
select id, 'Dehdadi', 'dehdadi', 3, true from public.provinces where slug = 'balkh'

-- Nangarhar Districts
union all
select id, 'Jalalabad', 'jalalabad', 1, true from public.provinces where slug = 'nangarhar'
union all
select id, 'Behsud', 'behsud', 2, true from public.provinces where slug = 'nangarhar'
union all
select id, 'Khewa', 'khewa', 3, true from public.provinces where slug = 'nangarhar'

-- Kunduz Districts
union all
select id, 'Kunduz City', 'kunduz-city', 1, true from public.provinces where slug = 'kunduz'
union all
select id, 'Khanabad', 'khanabad', 2, true from public.provinces where slug = 'kunduz'

-- Parwan Districts
union all
select id, 'Charikar', 'charikar', 1, true from public.provinces where slug = 'parwan'
union all
select id, 'Bagram', 'bagram', 2, true from public.provinces where slug = 'parwan'

on conflict do nothing;

-- =========================================================
-- 4) Insert Areas (neighborhoods) for Kabul City District
-- =========================================================

insert into public.areas (district_id, name, slug, sort_order, is_active)
select id, 'Karte 1', 'karte-1', 1, true from public.districts where slug = 'kabul-city'
union all
select id, 'Karte 2', 'karte-2', 2, true from public.districts where slug = 'kabul-city'
union all
select id, 'Karte 3', 'karte-3', 3, true from public.districts where slug = 'kabul-city'
union all
select id, 'Karte 4', 'karte-4', 4, true from public.districts where slug = 'kabul-city'
union all
select id, 'Karte 5', 'karte-5', 5, true from public.districts where slug = 'kabul-city'
union all
select id, 'Karte Char', 'karte-char', 6, true from public.districts where slug = 'kabul-city'
union all
select id, 'Karte Seh', 'karte-seh', 7, true from public.districts where slug = 'kabul-city'
union all
select id, 'Wazir Akbar Khan', 'wazir-akbar-khan', 8, true from public.districts where slug = 'kabul-city'
union all
select id, 'Shahr-e Naw', 'shahr-e-naw', 9, true from public.districts where slug = 'kabul-city'
union all
select id, 'Shar-e Ajdad', 'shar-e-ajdad', 10, true from public.districts where slug = 'kabul-city'
union all
select id, 'Taimani', 'taimani', 11, true from public.districts where slug = 'kabul-city'
union all
select id, 'Afshar', 'afshar', 12, true from public.districts where slug = 'kabul-city'
union all
select id, 'Macroyan', 'macroyan', 13, true from public.districts where slug = 'kabul-city'
union all
select id, 'Pule Surkh', 'pule-surkh', 14, true from public.districts where slug = 'kabul-city'
union all
select id, 'Qalae Fatah', 'qalae-fatah', 15, true from public.districts where slug = 'kabul-city'

-- Jalalabad Areas
union all
select id, 'Jalalabad City Center', 'jalalabad-city-center', 1, true from public.districts where slug = 'jalalabad'
union all
select id, 'Nadi Ali', 'nadi-ali', 2, true from public.districts where slug = 'jalalabad'
union all
select id, 'Kheshgi', 'kheshgi', 3, true from public.districts where slug = 'jalalabad'

-- Mazar-i-Sharif Areas
union all
select id, 'Mazar-i-Sharif City Center', 'mazar-city-center', 1, true from public.districts where slug = 'mazar-i-sharif'
union all
select id, 'Blue Mosque Area', 'blue-mosque-area', 2, true from public.districts where slug = 'mazar-i-sharif'

-- Herat City Areas
union all
select id, 'Herat City Center', 'herat-city-center', 1, true from public.districts where slug = 'herat-city'
union all
select id, 'Old City', 'herat-old-city', 2, true from public.districts where slug = 'herat-city'

on conflict do nothing;

commit;
