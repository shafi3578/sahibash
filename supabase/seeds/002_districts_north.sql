-- Districts of Northern Afghanistan Provinces
-- Includes: Balkh, Jowzjan, Sar-e-Pol, Samangan, Takhar, Faryab, Baghlan, Kunduz

-- BALKH DISTRICTS
INSERT INTO districts (province_id, slug, name_en, name_fa, name_ps, sort_order, is_active) 
SELECT id, 'balkh-city', 'Balkh', 'بلخ', 'بلخ', 1, true FROM provinces WHERE slug = 'balkh'
UNION ALL
SELECT id, 'mazar-e-sharif', 'Mazar-e-Sharif', 'مزارشریف', 'مزار شریف', 2, true FROM provinces WHERE slug = 'balkh'
UNION ALL
SELECT id, 'chahar-bolak', 'Chahar Bolak', 'چهار بولک', 'چهار بولک', 3, true FROM provinces WHERE slug = 'balkh'
UNION ALL
SELECT id, 'chahar-kint', 'Chahar Kint', 'چهار کنت', 'چهار کنت', 4, true FROM provinces WHERE slug = 'balkh'
UNION ALL
SELECT id, 'chimtal', 'Chimtal', 'چمتال', 'چمتال', 5, true FROM provinces WHERE slug = 'balkh'
UNION ALL
SELECT id, 'dawlatabad', 'Dawlatabad', 'دولتآباد', 'دولتآباد', 6, true FROM provinces WHERE slug = 'balkh'
UNION ALL
SELECT id, 'dehdadi', 'Dehdadi', 'ده دادی', 'ده دادی', 7, true FROM provinces WHERE slug = 'balkh'
UNION ALL
SELECT id, 'kaldar', 'Kaldar', 'کلدار', 'کلدار', 8, true FROM provinces WHERE slug = 'balkh'
UNION ALL
SELECT id, 'khulm', 'Khulm', 'خلم', 'خلم', 9, true FROM provinces WHERE slug = 'balkh'
UNION ALL
SELECT id, 'kishindeh', 'Kishindeh', 'کشینده', 'کشینده', 10, true FROM provinces WHERE slug = 'balkh'
UNION ALL
SELECT id, 'marmul', 'Marmul', 'مرمل', 'مرمل', 11, true FROM provinces WHERE slug = 'balkh'
UNION ALL
SELECT id, 'nahr-e-shahi', 'Nahr-e-Shahi', 'نهرشاهی', 'نهرشاهی', 12, true FROM provinces WHERE slug = 'balkh'
UNION ALL
SELECT id, 'sholgara', 'Sholgara', 'شلگره', 'شلگره', 13, true FROM provinces WHERE slug = 'balkh'
UNION ALL
SELECT id, 'shortepa', 'Shortepa', 'شرتپه', 'شرتپه', 14, true FROM provinces WHERE slug = 'balkh'
UNION ALL
SELECT id, 'zari', 'Zari', 'زاری', 'زاری', 15, true FROM provinces WHERE slug = 'balkh'

-- JOWZJAN DISTRICTS
UNION ALL
SELECT id, 'aqcha', 'Aqcha', 'اقچه', 'اقچه', 1, true FROM provinces WHERE slug = 'jowzjan'
UNION ALL
SELECT id, 'darzab', 'Darzab', 'درزاب', 'درزاب', 2, true FROM provinces WHERE slug = 'jowzjan'
UNION ALL
SELECT id, 'fayzabad', 'Fayzabad', 'فیضآباد', 'فیضآباد', 3, true FROM provinces WHERE slug = 'jowzjan'
UNION ALL
SELECT id, 'khamyab', 'Khamyab', 'خمیاب', 'خمیاب', 4, true FROM provinces WHERE slug = 'jowzjan'
UNION ALL
SELECT id, 'khanaqa', 'Khanaqa', 'خانقه', 'خانقه', 5, true FROM provinces WHERE slug = 'jowzjan'
UNION ALL
SELECT id, 'khwaja-du-koh', 'Khwaja Du Koh', 'خواجه دو کوه', 'خواجه دو کوه', 6, true FROM provinces WHERE slug = 'jowzjan'
UNION ALL
SELECT id, 'mardyan', 'Mardyan', 'مردیان', 'مردیان', 7, true FROM provinces WHERE slug = 'jowzjan'
UNION ALL
SELECT id, 'mingajik', 'Mingajik', 'مینگجیک', 'مینگجیک', 8, true FROM provinces WHERE slug = 'jowzjan'
UNION ALL
SELECT id, 'qarqin', 'Qarqin', 'قرقین', 'قرقین', 9, true FROM provinces WHERE slug = 'jowzjan'
UNION ALL
SELECT id, 'qush-tepa', 'Qush Tepa', 'قوش تپه', 'قوش تپه', 10, true FROM provinces WHERE slug = 'jowzjan'
UNION ALL
SELECT id, 'shiberghan', 'Shiberghan', 'شبرغان', 'شبرغان', 11, true FROM provinces WHERE slug = 'jowzjan'

-- SAR-E-POL DISTRICTS
UNION ALL
SELECT id, 'balkhab', 'Balkhab', 'بلخاب', 'بلخاب', 1, true FROM provinces WHERE slug = 'sar-e-pol'
UNION ALL
SELECT id, 'gosfandi', 'Gosfandi', 'گوسفندی', 'گوسفندی', 2, true FROM provinces WHERE slug = 'sar-e-pol'
UNION ALL
SELECT id, 'kohistanat', 'Kohistanat', 'کوهستانات', 'کوهستانات', 3, true FROM provinces WHERE slug = 'sar-e-pol'
UNION ALL
SELECT id, 'sancharak', 'Sancharak', 'سنچرک', 'سنچرک', 4, true FROM provinces WHERE slug = 'sar-e-pol'
UNION ALL
SELECT id, 'sar-e-pol-city', 'Sar-e Pol', 'سرپل', 'سرپل', 5, true FROM provinces WHERE slug = 'sar-e-pol'
UNION ALL
SELECT id, 'sayad', 'Sayad', 'سیاد', 'سیاد', 6, true FROM provinces WHERE slug = 'sar-e-pol'
UNION ALL
SELECT id, 'sozma-qala', 'Sozma Qala', 'سوزما قلعه', 'سوزما قلعه', 7, true FROM provinces WHERE slug = 'sar-e-pol'

-- SAMANGAN DISTRICTS
UNION ALL
SELECT id, 'aybak', 'Aybak', 'ایبک', 'ایبک', 1, true FROM provinces WHERE slug = 'samangan'
UNION ALL
SELECT id, 'dara-e-suf-payin', 'Dara-e-Suf Payin', 'دره سوف پایین', 'دره سوف پایین', 2, true FROM provinces WHERE slug = 'samangan'
UNION ALL
SELECT id, 'dara-e-suf-bala', 'Dara-e-Suf Bala', 'دره سوف بالا', 'دره سوف بالا', 3, true FROM provinces WHERE slug = 'samangan'
UNION ALL
SELECT id, 'feroz-nakhchir', 'Feroz Nakhchir', 'فیروز ناخچیر', 'فیروز ناخچیر', 4, true FROM provinces WHERE slug = 'samangan'
UNION ALL
SELECT id, 'hazrat-sultan', 'Hazrat Sultan', 'حضرت سلطان', 'حضرت سلطان', 5, true FROM provinces WHERE slug = 'samangan'
UNION ALL
SELECT id, 'khuram-wa-sarbagh', 'Khuram wa Sarbagh', 'خورام و سربغ', 'خورام و سربغ', 6, true FROM provinces WHERE slug = 'samangan'
UNION ALL
SELECT id, 'ruy-e-du-ab', 'Ruy-e-Du Ab', 'روی دو آب', 'روی دو آب', 7, true FROM provinces WHERE slug = 'samangan';
