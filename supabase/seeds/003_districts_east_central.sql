-- Districts of Eastern and Central Afghanistan Provinces
-- Includes: Nangarhar, Laghman, Kunar, Nuristan, Kapisa, Parwan, Panjshir, Bamyan, Daykundi, Ghor, Wardak, Logar

-- NANGARHAR DISTRICTS
INSERT INTO districts (province_id, slug, name_en, name_fa, name_ps, sort_order, is_active) 
SELECT id, 'jalalabad', 'Jalalabad', 'جلال آباد', 'جلال آباد', 1, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'achin', 'Achin', 'اچین', 'اچین', 2, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'bati-kot', 'Bati Kot', 'باتی کوت', 'باتی کوت', 3, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'behsud', 'Behsud', 'بهسود', 'بهسود', 4, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'chaparhar', 'Chaparhar', 'چپرهار', 'چپرهار', 5, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'dara-e-nur', 'Dara-e-Nur', 'دره نور', 'دره نور', 6, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'deh-bala', 'Deh Bala', 'ده بالا', 'ده بالا', 7, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'dur-baba', 'Dur Baba', 'دور بابا', 'دور بابا', 8, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'ghani-khel', 'Ghani Khel', 'غنی خیل', 'غنی خیل', 9, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'goshta', 'Goshta', 'گوشتا', 'گوشتا', 10, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'hesarak', 'Hesarak', 'حصارک', 'حصارک', 11, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'haska-meyna', 'Haska Meyna', 'هسکه مینه', 'هسکه مینه', 12, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'kama', 'Kama', 'کاما', 'کاما', 13, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'khogyani', 'Khogyani', 'خوگیانی', 'خوگیانی', 14, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'kot', 'Kot', 'کوت', 'کوت', 15, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'kuz-kunar', 'Kuz Kunar', 'کوز کنر', 'کوز کنر', 16, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'lal-pur', 'Lal Pur', 'لال پور', 'لال پور', 17, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'muhmand-dara', 'Muhmand Dara', 'محمند دره', 'محمند دره', 18, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'nazian', 'Nazian', 'نازیان', 'نازیان', 19, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'pachir-agam', 'Pachir Agam', 'پچیر اگم', 'پچیر اگم', 20, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'rodat', 'Rodat', 'رودات', 'رودات', 21, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'sherzad', 'Sherzad', 'شیرزاد', 'شیرزاد', 22, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'shinwar', 'Shinwar', 'شینوار', 'شینوار', 23, true FROM provinces WHERE slug = 'nangarhar'
UNION ALL
SELECT id, 'surkh-rod', 'Surkh Rod', 'سرخ رود', 'سرخ رود', 24, true FROM provinces WHERE slug = 'nangarhar'

-- KAPISA DISTRICTS
UNION ALL
SELECT id, 'mahmud-e-raqi', 'Mahmud-e-Raqi', 'محمود رقی', 'محمود رقی', 1, true FROM provinces WHERE slug = 'kapisa'
UNION ALL
SELECT id, 'alasay', 'Alasay', 'الاسی', 'الاسی', 2, true FROM provinces WHERE slug = 'kapisa'
UNION ALL
SELECT id, 'hesa-awal-kohistan', 'Hesa Awal Kohistan', 'حصه اول کوهستان', 'حصه اول کوهستان', 3, true FROM provinces WHERE slug = 'kapisa'
UNION ALL
SELECT id, 'hesa-duwum-kohistan', 'Hesa Duwum Kohistan', 'حصه دوم کوهستان', 'حصه دوم کوهستان', 4, true FROM provinces WHERE slug = 'kapisa'
UNION ALL
SELECT id, 'koh-band', 'Koh Band', 'کوه بند', 'کوه بند', 5, true FROM provinces WHERE slug = 'kapisa'
UNION ALL
SELECT id, 'nijrab', 'Nijrab', 'نیجراب', 'نیجراب', 6, true FROM provinces WHERE slug = 'kapisa'
UNION ALL
SELECT id, 'tagab', 'Tagab', 'تاب', 'تاب', 7, true FROM provinces WHERE slug = 'kapisa'

-- PARWAN DISTRICTS
UNION ALL
SELECT id, 'bagram', 'Bagram', 'باگرام', 'باگرام', 1, true FROM provinces WHERE slug = 'parwan'
UNION ALL
SELECT id, 'charikar', 'Charikar', 'چاریکار', 'چاریکار', 2, true FROM provinces WHERE slug = 'parwan'
UNION ALL
SELECT id, 'jabal-saraj', 'Jabal Saraj', 'جبل سراج', 'جبل سراج', 3, true FROM provinces WHERE slug = 'parwan'
UNION ALL
SELECT id, 'koh-e-safi', 'Koh-e-Safi', 'کوه صفی', 'کوه صفی', 4, true FROM provinces WHERE slug = 'parwan'
UNION ALL
SELECT id, 'salang', 'Salang', 'سلنگ', 'سلنگ', 5, true FROM provinces WHERE slug = 'parwan'
UNION ALL
SELECT id, 'sayd-khel', 'Sayd Khel', 'سید خیل', 'سید خیل', 6, true FROM provinces WHERE slug = 'parwan'
UNION ALL
SELECT id, 'sheikh-ali', 'Sheikh Ali', 'شیخ علی', 'شیخ علی', 7, true FROM provinces WHERE slug = 'parwan'
UNION ALL
SELECT id, 'shinwari', 'Shinwari', 'شینواری', 'شینواری', 8, true FROM provinces WHERE slug = 'parwan'
UNION ALL
SELECT id, 'surkhi-parsa', 'Surkhi Parsa', 'سرخی پارسا', 'سرخی پارسا', 9, true FROM provinces WHERE slug = 'parwan'
UNION ALL
SELECT id, 'syah-gerd', 'Syah Gerd', 'سیاه گرد', 'سیاه گرد', 10, true FROM provinces WHERE slug = 'parwan'

-- BAMYAN DISTRICTS
UNION ALL
SELECT id, 'bamyan-city', 'Bamyan', 'باميان', 'باميان', 1, true FROM provinces WHERE slug = 'bamyan'
UNION ALL
SELECT id, 'kahmard', 'Kahmard', 'کهمرد', 'کهمرد', 2, true FROM provinces WHERE slug = 'bamyan'
UNION ALL
SELECT id, 'panjab', 'Panjab', 'پنجاب', 'پنجاب', 3, true FROM provinces WHERE slug = 'bamyan'
UNION ALL
SELECT id, 'sayghan', 'Sayghan', 'سیغان', 'سیغان', 4, true FROM provinces WHERE slug = 'bamyan'
UNION ALL
SELECT id, 'shibar', 'Shibar', 'شیبر', 'شیبر', 5, true FROM provinces WHERE slug = 'bamyan'
UNION ALL
SELECT id, 'waras', 'Waras', 'وارس', 'وارس', 6, true FROM provinces WHERE slug = 'bamyan'
UNION ALL
SELECT id, 'yakawlang', 'Yakawlang', 'یکاولنگ', 'یکاولنگ', 7, true FROM provinces WHERE slug = 'bamyan'

-- WARDAK DISTRICTS
UNION ALL
SELECT id, 'maydan-shahr', 'Maydan Shahr', 'میدان شهر', 'میدان شهر', 1, true FROM provinces WHERE slug = 'wardak'
UNION ALL
SELECT id, 'chak', 'Chak', 'چک', 'چک', 2, true FROM provinces WHERE slug = 'wardak'
UNION ALL
SELECT id, 'day-mirdad', 'Day Mirdad', 'دی میرداد', 'دی میرداد', 3, true FROM provinces WHERE slug = 'wardak'
UNION ALL
SELECT id, 'hesa-awal-behsud', 'Hesa Awal Behsud', 'حصه اول بهسود', 'حصه اول بهسود', 4, true FROM provinces WHERE slug = 'wardak'
UNION ALL
SELECT id, 'jaghatu', 'Jaghatu', 'جاغتو', 'جاغتو', 5, true FROM provinces WHERE slug = 'wardak'
UNION ALL
SELECT id, 'jalrez', 'Jalrez', 'جلریز', 'جلریز', 6, true FROM provinces WHERE slug = 'wardak'
UNION ALL
SELECT id, 'markaz-e-behsud', 'Markaz-e-Behsud', 'مرکز بهسود', 'مرکز بهسود', 7, true FROM provinces WHERE slug = 'wardak'
UNION ALL
SELECT id, 'nirkh', 'Nirkh', 'نیرخ', 'نیرخ', 8, true FROM provinces WHERE slug = 'wardak'
UNION ALL
SELECT id, 'saydabad', 'Saydabad', 'سیدآباد', 'سیدآباد', 9, true FROM provinces WHERE slug = 'wardak'

-- LOGAR DISTRICTS
UNION ALL
SELECT id, 'pul-e-alam', 'Pul-e-Alam', 'پل علم', 'پل علم', 1, true FROM provinces WHERE slug = 'logar'
UNION ALL
SELECT id, 'azra', 'Azra', 'ازره', 'ازره', 2, true FROM provinces WHERE slug = 'logar'
UNION ALL
SELECT id, 'baraki-barak', 'Baraki Barak', 'برکی برک', 'برکی برک', 3, true FROM provinces WHERE slug = 'logar'
UNION ALL
SELECT id, 'charkh', 'Charkh', 'چرخ', 'چرخ', 4, true FROM provinces WHERE slug = 'logar'
UNION ALL
SELECT id, 'kharwar', 'Kharwar', 'خروار', 'خروار', 5, true FROM provinces WHERE slug = 'logar'
UNION ALL
SELECT id, 'khoshi', 'Khoshi', 'خوشی', 'خوشی', 6, true FROM provinces WHERE slug = 'logar'
UNION ALL
SELECT id, 'mohammad-agha', 'Mohammad Agha', 'محمد آغا', 'محمد آغا', 7, true FROM provinces WHERE slug = 'logar';
