-- Provinces of Afghanistan
-- This file contains all provinces with their names in English, Dari, and Pashto

INSERT INTO provinces (slug, name_en, name_fa, name_ps, aliases, sort_order, is_active) VALUES

-- Capital Region
('kabul', 'Kabul', 'کابل', 'کابل', ARRAY['Kabul City'], 1, true),

-- Northern Provinces
('balkh', 'Balkh', 'بلخ', 'بلخ', ARRAY['Mazar-i-Sharif'], 2, true),
('jowzjan', 'Jowzjan', 'جوزجان', 'جوزجان', ARRAY['Jawzjan'], 3, true),
('sar-e-pol', 'Sar-e Pol', 'سرپل', 'سرپل', ARRAY['Sar-i-Pul'], 4, true),
('samangan', 'Samangan', 'سمنگان', 'سمنگان', ARRAY['Samangan'], 5, true),
('takhar', 'Takhar', 'تخار', 'تخار', ARRAY['Talogan'], 6, true),
('faryab', 'Faryab', 'فاریاب', 'فاریاب', ARRAY['Farah'], 7, true),
('baghlan', 'Baghlan', 'بغلان', 'بغلان', ARRAY['Baglan'], 8, true),
('kunduz', 'Kunduz', 'کندز', 'کندز', ARRAY['Qunduz'], 9, true),

-- Eastern Provinces
('nangarhar', 'Nangarhar', 'ننگرهار', 'ننگرهار', ARRAY['Jalalabad'], 10, true),
('laghman', 'Laghman', 'لغمان', 'لغمان', ARRAY['Lagman'], 11, true),
('kunar', 'Kunar', 'کنر', 'کنر', ARRAY['Kunnar'], 12, true),
('nuristan', 'Nuristan', 'نورستان', 'نورستان', ARRAY['Kafiristan'], 13, true),
('kapisa', 'Kapisa', 'کاپیسا', 'کاپیسا', ARRAY['Kapisah'], 14, true),
('parwan', 'Parwan', 'پروان', 'پروان', ARRAY['Bagram'], 15, true),
('panjshir', 'Panjshir', 'پنجشیر', 'پنجشیر', ARRAY['Panjsheer'], 16, true),

-- Central Provinces
('bamyan', 'Bamyan', 'باميان', 'باميان', ARRAY['Band-i-Amir'], 17, true),
('daykundi', 'Daykundi', 'دايکندی', 'دايکندی', ARRAY['Daikundi'], 18, true),
('ghor', 'Ghor', 'غور', 'غور', ARRAY['Ghur', 'Firozkoh'], 19, true),
('wardak', 'Wardak', 'وردک', 'وردک', ARRAY['Wardag'], 20, true),
('logar', 'Logar', 'لوگر', 'لوگر', ARRAY['Loghar'], 21, true),

-- Southern Provinces
('kandahar', 'Kandahar', 'کندهار', 'کندهار', ARRAY['Qandahar'], 22, true),
('ghazni', 'Ghazni', 'غزنی', 'غزنی', ARRAY['Ghazna'], 23, true),
('uruzgan', 'Uruzgan', 'ارزگان', 'ارزگان', ARRAY['Oruzgan'], 24, true),
('zabul', 'Zabul', 'زابل', 'زابل', ARRAY['Zabol'], 25, true),
('paktia', 'Paktia', 'پکتیا', 'پکتیا', ARRAY['Pakhtia'], 26, true),
('paktika', 'Paktika', 'پکتیکا', 'پکتیکا', ARRAY['Pakhtika'], 27, true),
('khost', 'Khost', 'خوست', 'خوست', ARRAY['Khust'], 28, true),

-- Western Provinces
('herat', 'Herat', 'هرات', 'هرات', ARRAY['Herat City'], 29, true),
('farah', 'Farah', 'فراه', 'فراه', ARRAY['Ferah'], 30, true),
('nimruz', 'Nimruz', 'نیمروز', 'نیمروز', ARRAY['Zaranj'], 31, true),
('badghis', 'Badghis', 'بادغیس', 'بادغیس', ARRAY['Badgis'], 32, true),

-- Northeastern Provinces
('badakhshan', 'Badakhshan', 'بدخشان', 'بدخشان', ARRAY['Fayzabad'], 33, true);
