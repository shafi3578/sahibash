-- Sahibash Afghanistan full province + district seed
-- Source: curated nationwide district list (EN canonical)

begin;

with province_rows as (
  select * from (values
    ('badakhshan', 'Badakhshan', '["بدخشان","بدخشان"]'::jsonb),
    ('badghis', 'Badghis', '["بادغیس","بادغیس"]'::jsonb),
    ('baghlan', 'Baghlan', '["بغلان","بغلان"]'::jsonb),
    ('balkh', 'Balkh', '["بلخ","بلخ"]'::jsonb),
    ('bamyan', 'Bamyan', '["بامیان","بامیان"]'::jsonb),
    ('daikundi', 'Daykundi', '["دایکندی","دایکندي","Daikundi"]'::jsonb),
    ('farah', 'Farah', '["فراه","فراه"]'::jsonb),
    ('faryab', 'Faryab', '["فاریاب","فاریاب"]'::jsonb),
    ('ghazni', 'Ghazni', '["غزنی","غزني"]'::jsonb),
    ('ghor', 'Ghor', '["غور","غور"]'::jsonb),
    ('helmand', 'Helmand', '["هلمند","هلمند"]'::jsonb),
    ('herat', 'Herat', '["هرات","هرات"]'::jsonb),
    ('jawzjan', 'Jowzjan', '["جوزجان","جوزجان","Jawzjan"]'::jsonb),
    ('kabul', 'Kabul', '["کابل","کابل"]'::jsonb),
    ('kandahar', 'Kandahar', '["کندهار","کندهار"]'::jsonb),
    ('kapisa', 'Kapisa', '["کاپیسا","کاپیسا"]'::jsonb),
    ('khost', 'Khost', '["خوست","خوست"]'::jsonb),
    ('kunar', 'Kunar', '["کنر","کنړ"]'::jsonb),
    ('kunduz', 'Kunduz', '["کندز","کندز"]'::jsonb),
    ('laghman', 'Laghman', '["لغمان","لغمان"]'::jsonb),
    ('logar', 'Logar', '["لوگر","لوګر"]'::jsonb),
    ('nangarhar', 'Nangarhar', '["ننگرهار","ننګرهار"]'::jsonb),
    ('nimroz', 'Nimruz', '["نیمروز","نیمروز","Nimroz"]'::jsonb),
    ('nuristan', 'Nuristan', '["نورستان","نورستان"]'::jsonb),
    ('paktia', 'Paktia', '["پکتیا","پکتیا"]'::jsonb),
    ('paktika', 'Paktika', '["پکتیکا","پکتیکا"]'::jsonb),
    ('panjshir', 'Panjshir', '["پنجشیر","پنجشېر"]'::jsonb),
    ('parwan', 'Parwan', '["پروان","پروان"]'::jsonb),
    ('samangan', 'Samangan', '["سمنگان","سمنګان"]'::jsonb),
    ('sar-e-pol', 'Sar-e Pol', '["سرپل","سرپل","Sarpol"]'::jsonb),
    ('takhar', 'Takhar', '["تخار","تخار"]'::jsonb),
    ('uruzgan', 'Uruzgan', '["ارزگان","اروزګان"]'::jsonb),
    ('wardak', 'Wardak', '["وردک","وردګ","Maidan Wardak"]'::jsonb),
    ('zabul', 'Zabul', '["زابل","زابل"]'::jsonb)
  ) as t(slug, name_en, aliases)
)
update public.provinces p
set
  name = pr.name_en,
  name_en = pr.name_en,
  name_fa = coalesce(nullif(p.name_fa, ''), pr.name_en),
  name_ps = coalesce(nullif(p.name_ps, ''), pr.name_en),
  aliases = pr.aliases,
  is_active = true,
  updated_at = now()
from province_rows pr
where p.slug = pr.slug;

with district_groups as (
  select * from (values
    ('badakhshan', array['Arghanj Khwa','Argo','Baharak','Darayem','Darwaz','Darwaz-e-Bala','Fayzabad','Ishkashim','Jurm','Keshm','Khash','Khwahan','Kof Ab','Kohistan','Kuran wa Munjan','Raghistan','Shahr-e-Buzurg','Shaki','Shighnan','Shuhada','Tagab','Teshkan','Wakhan','Warduj','Yaftal-e-Sufla','Yamgan','Yawan','Zebak']),
    ('badghis', array['Ab Kamari','Bala Murghab','Ghormach','Jawand','Muqur','Qadis','Qala-e-Naw']),
    ('baghlan', array['Andarab','Baghlan-e-Jadid','Burka','Dahana-e-Ghori','Deh Salah','Dushi','Firing wa Gharu','Guzargah-e-Nur','Khenjan','Khost wa Fereng','Khwaja Hejran','Nahrin','Pul-e-Khumri','Pul-e-Hesar','Tala wa Barfak']),
    ('balkh', array['Balkh','Chahar Bolak','Chahar Kint','Chimtal','Dawlatabad','Dehdadi','Kaldar','Khulm','Kishindeh','Marmul','Mazar-e-Sharif','Nahr-e-Shahi','Sholgara','Shortepa','Zari']),
    ('bamyan', array['Bamyan','Kahmard','Panjab','Sayghan','Shibar','Waras','Yakawlang']),
    ('daikundi', array['Ashtarlay','Gizab','Kajran','Khadir','Kiti','Miramor','Nili','Sang-e-Takht','Shahristan']),
    ('farah', array['Anar Dara','Bakwa','Bala Buluk','Farah','Gulestan','Khak-e-Safed','Lash-e-Juwayn','Pur Chaman','Pusht Rod','Qala-e-Kah','Shib Koh']),
    ('faryab', array['Almar','Andkhoy','Bilchiragh','Dawlatabad','Garziwan','Ghormach','Khan-e-Char Bagh','Khwaja Sabz Posh','Kohistan','Maymana','Pashtun Kot','Qaram Qol','Qaysar','Qorghan','Shirin Tagab']),
    ('ghazni', array['Ab Band','Ajristan','Andar','Deh Yak','Gelan','Giro','Ghazni','Jaghatu','Jaghori','Khwaja Omari','Malistan','Muqur','Nawa','Nawur','Qarabagh','Rashidan','Waghaz','Wali Muhammad Shahid','Zana Khan']),
    ('ghor', array['Chaghcharan / Firozkoh','Chahar Sadah','Dawlat Yar','Du Layna','Lal wa Sarjangal','Pasaband','Saghar','Shahrak','Taywara','Tulak']),
    ('helmand', array['Baghran','Dishu','Garmsir','Kajaki','Lashkar Gah','Musa Qala','Nad Ali','Nahr-e-Saraj','Nawzad','Nawa-e-Barakzayi','Reg / Khanashin','Sangin','Washer']),
    ('herat', array['Adraskan','Chishti Sharif','Farsi','Ghoryan','Gulran','Guzara','Herat','Injil','Karukh','Kohsan','Kushk','Kushk-e-Kuhna','Obe','Pashtun Zarghun','Shindand','Zinda Jan']),
    ('jawzjan', array['Aqcha','Darzab','Fayzabad','Khamyab','Khanaqa','Khwaja Du Koh','Mardyan','Mingajik','Qarqin','Qush Tepa','Shiberghan']),
    ('kabul', array['Bagrami','Chahar Asyab','Deh Sabz','Estalef','Farza','Guldara','Kabul','Kalakan','Khak-e-Jabbar','Mir Bacha Kot','Musayi','Paghman','Qarabagh','Shakardara','Surobi']),
    ('kandahar', array['Arghandab','Arghistan','Daman','Ghorak','Kandahar','Khakrez','Maruf','Maywand','Miyanishin','Nesh','Panjwayi','Reg','Shah Wali Kot','Shorabak','Spin Boldak','Zheray']),
    ('kapisa', array['Alasay','Hesa Awal Kohistan','Hesa Duwum Kohistan','Koh Band','Mahmud-e-Raqi','Nijrab','Tagab']),
    ('khost', array['Bak','Gurbuz','Jaji Maydan','Khost / Matun','Mandozayi','Musa Khel','Nadir Shah Kot','Qalandar','Sabari','Shamal','Spera','Tani','Tere Zayi']),
    ('kunar', array['Asadabad','Bar Kunar','Chapa Dara','Chawkay','Dangam','Dara-e-Pech','Ghaziabad','Khas Kunar','Marawara','Narang','Nari','Nurgal','Sarkani','Shigal','Wata Pur']),
    ('kunduz', array['Aliabad','Aqtash','Chahar Dara','Dasht-e-Archi','Imam Sahib','Khanabad','Kunduz','Qala-e-Zal']),
    ('laghman', array['Alingar','Alishang','Bad Pakh','Dawlat Shah','Mehtarlam','Qarghayi']),
    ('logar', array['Azra','Baraki Barak','Charkh','Kharwar','Khoshi','Mohammad Agha','Pul-e-Alam']),
    ('nangarhar', array['Achin','Bati Kot','Behsud','Chaparhar','Dara-e-Nur','Deh Bala','Dur Baba','Ghani Khel','Goshta','Hesarak','Haska Meyna','Jalalabad','Kama','Khogyani','Kot','Kuz Kunar','Lal Pur','Muhmand Dara','Nazian','Pachir Agam','Rodat','Sherzad','Shinwar','Surkh Rod']),
    ('nimroz', array['Chahar Burjak','Chakhansur','Delaram','Kang','Khash Rod','Zaranj']),
    ('nuristan', array['Barg-e-Matal','Du Ab','Kamdesh','Mandol','Nurgaram','Parun','Wama','Waygal']),
    ('paktia', array['Ahmadabad','Ali Khel / Jaji','Chamkani','Dand wa Patan','Gardez','Jani Khel','Laja Mangal','Lija Ahmad Khel','Sayed Karam','Shawak','Zadran','Zurmat']),
    ('paktika', array['Barmal','Dand-e-Patan','Dila','Gayan','Gomal','Jani Khel','Mata Khan','Nika','Omna','Sar Hawza','Sarobi','Sharan','Tarwa','Urgun','Waza Khwa','Wor Mamay','Yahya Khel','Yosuf Khel','Zarghun Shahr','Ziruk']),
    ('panjshir', array['Abshar','Bazarak','Dara','Khenj','Onaba','Parian','Rukha','Shutul']),
    ('parwan', array['Bagram','Charikar','Jabal Saraj','Koh-e-Safi','Salang','Sayd Khel','Sheikh Ali','Shinwari','Surkhi Parsa','Syah Gerd']),
    ('samangan', array['Aybak','Dara-e-Suf Payin','Dara-e-Suf Bala','Feroz Nakhchir','Hazrat Sultan','Khuram wa Sarbagh','Ruy-e-Du Ab']),
    ('sar-e-pol', array['Balkhab','Gosfandi','Kohistanat','Sancharak','Sar-e Pol','Sayad','Sozma Qala']),
    ('takhar', array['Baharak','Bangi','Chah Ab','Chal','Darqad','Dasht-e-Qala','Farkhar','Hazar Sumuch','Ishkamish','Kalafgan','Khwaja Bahawuddin','Khwaja Ghar','Namak Ab','Rustaq','Taloqan','Warsaj','Yangi Qala']),
    ('uruzgan', array['Chora','Deh Rawud','Gizab','Khas Uruzgan','Shahid-e-Hassas','Tarin Kot']),
    ('wardak', array['Chak','Day Mirdad','Hesa Awal Behsud','Jaghatu','Jalrez','Markaz-e-Behsud','Maydan Shahr','Nirkh','Saydabad']),
    ('zabul', array['Arghandab','Atghar','Daychopan','Kakar','Mizan','Naw Bahar','Qalat','Shah Joy','Shahr-e-Safa','Shinkay','Shamulzayi','Tarnak wa Jaldak'])
  ) as t(province_slug, district_names)
), expanded as (
  select
    dg.province_slug,
    trim(name_item) as district_name,
    ordinality::int as sort_order
  from district_groups dg,
  unnest(dg.district_names) with ordinality as u(name_item, ordinality)
), district_rows as (
  select
    p.id as province_id,
    e.district_name,
    trim(both '-' from regexp_replace(lower(replace(replace(e.district_name, '/', ' '), '''', '')), '[^a-z0-9]+', '-', 'g')) as district_slug,
    e.sort_order
  from expanded e
  join public.provinces p on p.slug = e.province_slug
)
insert into public.districts (
  province_id,
  name,
  name_en,
  name_fa,
  name_ps,
  slug,
  aliases,
  sort_order,
  is_active
)
select
  province_id,
  district_name,
  district_name,
  district_name,
  district_name,
  district_slug,
  '[]'::jsonb,
  sort_order,
  true
from district_rows
on conflict (province_id, slug)
do update set
  name = excluded.name,
  name_en = excluded.name_en,
  name_fa = coalesce(public.districts.name_fa, excluded.name_fa),
  name_ps = coalesce(public.districts.name_ps, excluded.name_ps),
  sort_order = excluded.sort_order,
  is_active = true,
  updated_at = now();

commit;
