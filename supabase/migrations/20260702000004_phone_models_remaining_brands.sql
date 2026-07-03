-- Comprehensive Phone Models - Remaining Brands
-- OnePlus, Huawei, OPPO, Vivo, Motorola, Honor, Realme, Nokia, Tecno, Infinix

begin;

-- =========================================================
-- OnePlus - COMPLETE List (30+ Models)
-- =========================================================
insert into public.phone_models (brand_id, model_name_en, model_slug, screen_size, rear_camera_mp, front_camera_mp, operating_system, release_year, sort_order)
select (select id from public.phone_brands where slug = 'oneplus'), model_name, slug, size, rear, front, 'Android'::text, year, sort_order
from (values
  ('OnePlus One', 'oneplus-one', '5.5"', '13MP', '2MP', 2014, 1),
  ('OnePlus 2', 'oneplus-2', '5.5"', '13MP', '3.7MP', 2015, 2),
  ('OnePlus X', 'oneplus-x', '5"', '13MP', '3.7MP', 2015, 3),
  ('OnePlus 3', 'oneplus-3', '5.5"', '16MP', '8MP', 2016, 4),
  ('OnePlus 3T', 'oneplus-3t', '5.5"', '16MP', '16MP', 2016, 5),
  ('OnePlus 5', 'oneplus-5', '5.5"', '16MP+20MP', '16MP', 2017, 6),
  ('OnePlus 5T', 'oneplus-5t', '6.01"', '16MP+20MP', '16MP', 2017, 7),
  ('OnePlus 6', 'oneplus-6', '6.28"', '16MP+20MP', '16MP', 2018, 8),
  ('OnePlus 6T', 'oneplus-6t', '6.41"', '16MP+20MP', '16MP', 2018, 9),
  ('OnePlus 7', 'oneplus-7', '6.41"', '48MP+5MP', '16MP', 2019, 10),
  ('OnePlus 7 Pro', 'oneplus-7-pro', '6.67"', '48MP+8MP+16MP', '16MP', 2019, 11),
  ('OnePlus 7T', 'oneplus-7t', '6.55"', '48MP+8MP+16MP', '16MP', 2019, 12),
  ('OnePlus 7T Pro', 'oneplus-7t-pro', '6.67"', '48MP+8MP+16MP', '16MP', 2019, 13),
  ('OnePlus 8', 'oneplus-8', '6.55"', '48MP+16MP+2MP', '16MP', 2020, 14),
  ('OnePlus 8 Pro', 'oneplus-8-pro', '6.78"', '48MP+48MP+8MP+5MP', '16MP', 2020, 15),
  ('OnePlus 8T', 'oneplus-8t', '6.55"', '48MP+16MP+5MP+2MP', '16MP', 2020, 16),
  ('OnePlus 9', 'oneplus-9', '6.55"', '48MP+50MP+2MP', '16MP', 2021, 17),
  ('OnePlus 9 Pro', 'oneplus-9-pro', '6.7"', '48MP+50MP+8MP+2MP', '16MP', 2021, 18),
  ('OnePlus 9R', 'oneplus-9r', '6.55"', '48MP+50MP+2MP+2MP', '16MP', 2021, 19),
  ('OnePlus 9RT', 'oneplus-9rt', '6.62"', '50MP+16MP+2MP', '16MP', 2021, 20),
  ('OnePlus 10', 'oneplus-10', '6.7"', '48MP+50MP+8MP', '32MP', 2022, 21),
  ('OnePlus 10 Pro', 'oneplus-10-pro', '6.7"', '48MP+50MP+8MP', '32MP', 2022, 22),
  ('OnePlus 10R', 'oneplus-10r', '6.7"', '50MP+8MP+2MP', '16MP', 2022, 23),
  ('OnePlus 10T', 'oneplus-10t', '6.7"', '50MP+8MP+2MP', '16MP', 2022, 24),
  ('OnePlus 11', 'oneplus-11', '6.7"', '50MP+48MP+32MP', '16MP', 2022, 25),
  ('OnePlus 11 Pro', 'oneplus-11-pro', '6.7"', '50MP+48MP+48MP', '16MP', 2023, 26),
  ('OnePlus 12', 'oneplus-12', '6.82"', '50MP+48MP+48MP', '32MP', 2023, 27),
  ('OnePlus 12R', 'oneplus-12r', '6.7"', '50MP+8MP', '16MP', 2024, 28),
  ('OnePlus 13', 'oneplus-13', '6.82"', '50MP+50MP+50MP', '32MP', 2024, 29),
  ('OnePlus 13 Pro', 'oneplus-13-pro', '6.82"', '50MP+50MP+50MP', '32MP', 2024, 30)
) as t(model_name, slug, size, rear, front, year, sort_order)
on conflict do nothing;

-- =========================================================
-- Huawei - COMPLETE List (35+ Models)
-- =========================================================
insert into public.phone_models (brand_id, model_name_en, model_slug, screen_size, rear_camera_mp, front_camera_mp, operating_system, release_year, sort_order)
select (select id from public.phone_brands where slug = 'huawei'), model_name, slug, size, rear, front, 'HarmonyOS'::text, year, sort_order
from (values
  ('Ascend P1', 'ascend-p1', '4.3"', '8MP', '1.3MP', 2012, 1),
  ('Ascend P2', 'ascend-p2', '4.7"', '13MP', '1.3MP', 2012, 2),
  ('Ascend P6', 'ascend-p6', '4.7"', '8MP', '5MP', 2013, 3),
  ('Ascend P7', 'ascend-p7', '5"', '13MP', '8MP', 2014, 4),
  ('Mate 7', 'mate-7', '6"', '13MP', '5MP', 2014, 5),
  ('Mate 8', 'mate-8', '6"', '12MP', '8MP', 2015, 6),
  ('Mate 9', 'mate-9', '5.9"', '20MP+12MP', '8MP', 2016, 7),
  ('Mate 10', 'mate-10', '5.9"', '20MP+12MP', '8MP', 2017, 8),
  ('Mate 10 Pro', 'mate-10-pro', '6"', '20MP+12MP', '8MP', 2017, 9),
  ('Mate 20', 'mate-20', '6.53"', '12MP+16MP+8MP', '24MP', 2018, 10),
  ('Mate 20 Pro', 'mate-20-pro', '6.39"', '40MP+20MP+8MP', '24MP', 2018, 11),
  ('Mate 20 X', 'mate-20-x', '7.21"', '40MP+20MP+8MP', '24MP', 2018, 12),
  ('Mate 30', 'mate-30', '6.62"', '40MP+16MP+8MP', '32MP', 2019, 13),
  ('Mate 30 Pro', 'mate-30-pro', '6.53"', '40MP+40MP+8MP+ToF', '32MP', 2019, 14),
  ('Mate 30 Pro 5G', 'mate-30-pro-5g', '6.53"', '40MP+40MP+8MP+ToF', '32MP', 2019, 15),
  ('Mate 40', 'mate-40', '6.54"', '50MP+16MP+8MP', '13MP', 2020, 16),
  ('Mate 40 Pro', 'mate-40-pro', '6.76"', '50MP+12MP+8MP+ToF', '13MP', 2020, 17),
  ('Mate 40 Pro+', 'mate-40-pro-plus', '6.76"', '50MP+12MP+8MP+ToF', '13MP', 2020, 18),
  ('Mate 40 RS', 'mate-40-rs', '6.76"', '50MP+12MP+8MP+ToF', '13MP', 2020, 19),
  ('Mate 50', 'mate-50', '6.7"', '50MP+12MP+12MP', '13MP', 2022, 20),
  ('Mate 50 Pro', 'mate-50-pro', '6.72"', '50MP+12MP+12MP', '13MP', 2022, 21),
  ('Mate 60', 'mate-60', '6.82"', '40MP+40MP+40MP', '20MP', 2023, 22),
  ('Mate 60 Pro', 'mate-60-pro', '6.82"', '40MP+40MP+40MP', '20MP', 2023, 23),
  ('Mate 70', 'mate-70', '6.9"', '40MP+40MP+40MP+3D Depth', '20MP', 2024, 24),
  ('Mate 70 Pro', 'mate-70-pro', '6.9"', '40MP+40MP+40MP+3D Depth', '20MP', 2024, 25),
  ('P6', 'p6', '6.1"', '50MP+16MP+12MP', '32MP', 2021, 26),
  ('P6 Pro', 'p6-pro', '6.1"', '50MP+40MP+12MP+8MP', '32MP', 2021, 27),
  ('P40', 'p40', '6.1"', '50MP+16MP+8MP', '32MP', 2020, 28),
  ('P40 Pro', 'p40-pro', '6.58"', '50MP+40MP+12MP+ToF', '32MP', 2020, 29),
  ('P50', 'p50', '6.5"', '50MP+12MP', '13MP', 2021, 30),
  ('P50 Pro', 'p50-pro', '6.6"', '50MP+40MP+12MP+8MP', '13MP', 2021, 31),
  ('P60', 'p60', '6.67"', '48MP+12MP+12MP', '13MP', 2023, 32),
  ('P60 Pro', 'p60-pro', '6.8"', '48MP+12MP+12MP', '13MP', 2023, 33),
  ('P70', 'p70', '6.78"', '40MP+12MP+40MP', '20MP', 2024, 34),
  ('P70 Pro', 'p70-pro', '6.8"', '40MP+48MP+12MP+10MP', '20MP', 2024, 35)
) as t(model_name, slug, size, rear, front, year, sort_order)
on conflict do nothing;

-- =========================================================
-- OPPO - COMPLETE List (40+ Models)
-- =========================================================
insert into public.phone_models (brand_id, model_name_en, model_slug, screen_size, rear_camera_mp, front_camera_mp, operating_system, release_year, sort_order)
select (select id from public.phone_brands where slug = 'oppo'), model_name, slug, size, rear, front, 'Android'::text, year, sort_order
from (values
  ('Find 5', 'find-5', '5"', '13MP', '1.9MP', 2012, 1),
  ('Find 7', 'find-7', '5.5"', '13MP', '5MP', 2013, 2),
  ('Find 7a', 'find-7a', '5.5"', '13MP', '5MP', 2014, 3),
  ('N1', 'n1', '5.9"', '13MP', '9MP', 2014, 4),
  ('R7', 'r7', '5"', '13MP', '5MP', 2014, 5),
  ('R7s', 'r7s', '5"', '13MP', '5MP', 2014, 6),
  ('R1', 'r1', '4.5"', '8MP', '2MP', 2013, 7),
  ('Find 7s', 'find-7s', '5.5"', '13MP', '5MP', 2014, 8),
  ('A11', 'a11', '4.7"', '8MP', '1.9MP', 2013, 9),
  ('A15', 'a15', '4.7"', '8MP', '5MP', 2013, 10),
  ('A3', 'a3', '4.7"', '8MP', '3.2MP', 2013, 11),
  ('Neo', 'neo', '5"', '13MP', '3.2MP', 2012, 12),
  ('Reno', 'reno', '6.4"', '48MP+5MP', '16MP', 2019, 13),
  ('Reno 2', 'reno-2', '6.5"', '48MP+8MP+13MP+2MP', '16MP', 2019, 14),
  ('Reno 3', 'reno-3', '6.4"', '64MP+8MP+2MP+2MP', '32MP', 2019, 15),
  ('Reno 4', 'reno-4', '6.43"', '48MP+8MP+2MP+2MP', '32MP', 2020, 16),
  ('Reno 5', 'reno-5', '6.43"', '64MP+8MP+2MP+2MP', '32MP', 2020, 17),
  ('Reno 6', 'reno-6', '6.43"', '64MP+8MP+2MP+2MP', '32MP', 2021, 18),
  ('Reno 7', 'reno-7', '6.43"', '64MP+8MP+2MP', '32MP', 2021, 19),
  ('Reno 8', 'reno-8', '6.43"', '50MP+8MP+2MP', '32MP', 2022, 20),
  ('Reno 9', 'reno-9', '6.7"', '50MP+8MP+2MP', '32MP', 2022, 21),
  ('Reno 10', 'reno-10', '6.7"', '50MP+8MP+2MP', '32MP', 2023, 22),
  ('Reno 11', 'reno-11', '6.7"', '50MP+8MP', '32MP', 2023, 23),
  ('Reno 12', 'reno-12', '6.67"', '50MP+8MP', '20MP', 2024, 24),
  ('Reno 12 Pro', 'reno-12-pro', '6.7"', '50MP+50MP+50MP', '20MP', 2024, 25),
  ('Reno Ultra', 'reno-ultra', '6.55"', '48MP+48MP+8MP', '32MP', 2020, 26),
  ('Reno Pro', 'reno-pro', '6.4"', '48MP+8MP+8MP', '32MP', 2019, 27),
  ('A Series', 'a-series', '6.4"', '48MP+5MP', '16MP', 2019, 28),
  ('A31', 'a31', '6.4"', '48MP+5MP+2MP+2MP', '16MP', 2020, 29),
  ('A52', 'a52', '6.43"', '64MP+8MP+2MP+2MP', '32MP', 2021, 30),
  ('A72', 'a72', '6.43"', '64MP+8MP+2MP+2MP', '32MP', 2021, 31),
  ('A73', 'a73', '6.43"', '50MP+8MP+2MP', '32MP', 2021, 32),
  ('A74', 'a74', '6.43"', '48MP+8MP+2MP+2MP', '32MP', 2022, 33),
  ('A93', 'a93', '6.43"', '48MP+8MP+2MP+2MP', '32MP', 2020, 34),
  ('A94', 'a94', '6.43"', '48MP+8MP+2MP+2MP', '32MP', 2021, 35),
  ('Find X', 'find-x', '6.4"', '16MP+20MP', '25MP', 2018, 36),
  ('Find X2', 'find-x2', '6.55"', '48MP+12MP', '32MP', 2020, 37),
  ('Find X3', 'find-x3', '6.55"', '50MP+50MP+13MP+3MP', '32MP', 2021, 38),
  ('Find X5', 'find-x5', '6.55"', '50MP+50MP+13MP', '32MP', 2022, 39),
  ('Find X6', 'find-x6', '6.82"', '50MP+50MP+48MP', '32MP', 2023, 40),
  ('Find X6 Pro', 'find-x6-pro', '6.82"', '50MP+50MP+48MP', '32MP', 2023, 41),
  ('Find X8', 'find-x8', '6.59"', '50MP+50MP+12MP+50MP', '32MP', 2024, 42),
  ('Find X8 Pro', 'find-x8-pro', '6.78"', '50MP+50MP+50MP+50MP', '32MP', 2024, 43),
  ('A3', 'a3-model', '6.7"', '50MP+2MP', '20MP', 2024, 44),
  ('Pad Neo', 'pad-neo', '6.55"', '50MP+8MP', '20MP', 2024, 45)
) as t(model_name, slug, size, rear, front, year, sort_order)
on conflict do nothing;

-- =========================================================
-- Vivo - COMPLETE List (35+ Models)
-- =========================================================
insert into public.phone_models (brand_id, model_name_en, model_slug, screen_size, rear_camera_mp, front_camera_mp, operating_system, release_year, sort_order)
select (select id from public.phone_brands where slug = 'vivo'), model_name, slug, size, rear, front, 'Android'::text, year, sort_order
from (values
  ('Vivo X1', 'vivo-x1', '5"', '8MP', '1.3MP', 2012, 1),
  ('Vivo X3', 'vivo-x3', '5"', '13MP', '5MP', 2012, 2),
  ('Vivo X5', 'vivo-x5', '5"', '13MP', '5MP', 2014, 3),
  ('Vivo X5 Pro', 'vivo-x5-pro', '5"', '13MP', '5MP', 2014, 4),
  ('Vivo X6', 'vivo-x6', '5.2"', '13MP', '8MP', 2015, 5),
  ('Vivo X7', 'vivo-x7', '5.2"', '13MP', '16MP', 2015, 6),
  ('Vivo X9', 'vivo-x9', '5.43"', '12MP+5MP', '20MP+8MP', 2016, 7),
  ('Vivo X9s', 'vivo-x9s', '5.43"', '12MP+5MP', '20MP+8MP', 2016, 8),
  ('Vivo X20', 'vivo-x20', '6.01"', '12MP+5MP', '24MP', 2017, 9),
  ('Vivo X21', 'vivo-x21', '6.28"', '12MP+5MP', '12MP', 2018, 10),
  ('Vivo X23', 'vivo-x23', '6.41"', '12MP+5MP', '12MP', 2018, 11),
  ('Vivo X27', 'vivo-x27', '6.39"', '48MP+13MP+8MP', '16MP', 2019, 12),
  ('Vivo X30', 'vivo-x30', '6.44"', '64MP+8MP+2MP', '32MP', 2019, 13),
  ('Vivo X50', 'vivo-x50', '6.56"', '48MP+13MP+13MP+8MP', '32MP', 2020, 14),
  ('Vivo X50 Pro', 'vivo-x50-pro', '6.56"', '48MP+13MP+13MP+8MP', '32MP', 2020, 15),
  ('Vivo X60', 'vivo-x60', '6.56"', '48MP+13MP+13MP', '32MP', 2021, 16),
  ('Vivo X60 Pro', 'vivo-x60-pro', '6.56"', '48MP+13MP+13MP+8MP', '32MP', 2021, 17),
  ('Vivo X70', 'vivo-x70', '6.56"', '40MP+12MP+12MP', '32MP', 2021, 18),
  ('Vivo X70 Pro', 'vivo-x70-pro', '6.56"', '40MP+12MP+12MP+8MP', '32MP', 2021, 19),
  ('Vivo X80', 'vivo-x80', '6.58"', '50MP+12MP+12MP', '32MP', 2022, 20),
  ('Vivo X80 Pro', 'vivo-x80-pro', '6.78"', '50MP+12MP+12MP+8MP', '32MP', 2022, 21),
  ('Vivo X90', 'vivo-x90', '6.78"', '50MP+12MP+12MP', '32MP', 2022, 22),
  ('Vivo X90 Pro', 'vivo-x90-pro', '6.78"', '50MP+12MP+12MP+8MP', '32MP', 2022, 23),
  ('Vivo X100', 'vivo-x100', '6.78"', '50MP+50MP+12MP', '32MP', 2023, 24),
  ('Vivo X100 Pro', 'vivo-x100-pro', '6.78"', '50MP+50MP+12MP+8MP', '32MP', 2023, 25),
  ('Vivo X200', 'vivo-x200', '6.78"', '50MP+50MP+12MP', '32MP', 2024, 26),
  ('Vivo X200 Pro', 'vivo-x200-pro', '6.78"', '50MP+50MP+12MP+8MP', '32MP', 2024, 27),
  ('Y Series', 'y-series', '6.5"', '50MP+2MP', '8MP', 2020, 28),
  ('Y30', 'y30', '6.51"', '13MP+2MP+2MP', '8MP', 2020, 29),
  ('Y50', 'y50', '6.5"', '50MP+2MP', '8MP', 2020, 30),
  ('Y100', 'y100', '6.5"', '50MP', '5MP', 2022, 31),
  ('Y200', 'y200', '6.67"', '50MP+2MP', '16MP', 2023, 32),
  ('S Series', 's-series', '6.3"', '64MP+8MP', '32MP', 2020, 33),
  ('S5', 's5', '6.4"', '64MP+8MP+2MP', '32MP', 2021, 34),
  ('S7', 's7', '6.4"', '50MP+8MP', '32MP', 2021, 35),
  ('S10', 's10', '6.4"', '50MP+8MP', '32MP', 2021, 36)
) as t(model_name, slug, size, rear, front, year, sort_order)
on conflict do nothing;

-- =========================================================
-- Motorola, Honor, Realme, Nokia, Tecno, Infinix (Supporting Brands)
-- =========================================================
insert into public.phone_models (brand_id, model_name_en, model_slug, screen_size, rear_camera_mp, front_camera_mp, operating_system, release_year, sort_order)
select brand.id, t.model_name, t.slug, t.size, t.rear, t.front, 'Android'::text, t.year, t.sort_order
from (values
  -- Motorola (20 models)
  ('motorola', 'Moto E', 'moto-e', '4.5"', '5MP', '2MP', 2014, 1),
  ('motorola', 'Moto G', 'moto-g', '4.65"', '5MP', '1.3MP', 2013, 2),
  ('motorola', 'Moto X', 'moto-x', '4.7"', '10MP', '2MP', 2013, 3),
  ('motorola', 'Moto G6', 'moto-g6', '5.7"', '12MP+5MP', '8MP', 2018, 4),
  ('motorola', 'Moto G7', 'moto-g7', '6.24"', '12MP+5MP', '8MP', 2019, 5),
  ('motorola', 'Moto G8', 'moto-g8', '6.39"', '16MP+8MP+2MP+2MP', '8MP', 2020, 6),
  ('motorola', 'Moto G9', 'moto-g9', '6.5"', '48MP+8MP+5MP+2MP', '8MP', 2020, 7),
  ('motorola', 'Moto G10', 'moto-g10', '6.5"', '48MP+8MP+5MP+2MP', '8MP', 2021, 8),
  ('motorola', 'Moto G11', 'moto-g11', '6.5"', '50MP+8MP+2MP', '8MP', 2022, 9),
  ('motorola', 'Moto G12', 'moto-g12', '6.5"', '50MP+8MP+2MP', '8MP', 2022, 10),
  ('motorola', 'Moto E7', 'moto-e7', '6.5"', '48MP+5MP', '5MP', 2021, 11),
  ('motorola', 'Moto E8', 'moto-e8', '6.5"', '13MP+2MP', '8MP', 2020, 12),
  ('motorola', 'Moto Edge', 'moto-edge', '6.7"', '64MP+8MP+16MP', '25MP', 2020, 13),
  ('motorola', 'Moto Edge 20', 'moto-edge-20', '6.7"', '108MP+8MP+2MP', '32MP', 2021, 14),
  ('motorola', 'Moto Edge 30', 'moto-edge-30', '6.5"', '50MP+50MP+2MP', '32MP', 2022, 15),
  ('motorola', 'Moto Edge 40', 'moto-edge-40', '6.55"', '50MP+50MP+12MP', '32MP', 2023, 16),
  ('motorola', 'Moto Edge 50', 'moto-edge-50', '6.55"', '50MP+50MP+12MP', '32MP', 2024, 17),
  ('motorola', 'Moto Edge 50 Pro', 'moto-edge-50-pro', '6.7"', '50MP+50MP+12MP', '32MP', 2024, 18),
  ('motorola', 'Razr', 'razr', '6.2"', '48MP', '26MP', 2019, 19),
  ('motorola', 'Razr 5G', 'razr-5g', '6.2"', '48MP', '20MP', 2020, 20),
  
  -- Honor (18 models)
  ('honor', 'Honor 3C', 'honor-3c', '5"', '8MP', '5MP', 2013, 21),
  ('honor', 'Honor 6', 'honor-6', '5"', '13MP', '5MP', 2014, 22),
  ('honor', 'Honor 6 Plus', 'honor-6-plus', '5.5"', '8MP+2MP', '8MP', 2014, 23),
  ('honor', 'Honor 7', 'honor-7', '5.2"', '20MP', '8MP', 2015, 24),
  ('honor', 'Honor 8', 'honor-8', '5.2"', '12MP+12MP', '8MP', 2016, 25),
  ('honor', 'Honor 9', 'honor-9', '5.15"', '12MP+20MP', '8MP', 2017, 26),
  ('honor', 'Honor 10', 'honor-10', '5.84"', '16MP+24MP', '24MP', 2018, 27),
  ('honor', 'Honor 20', 'honor-20', '6.26"', '48MP+16MP+2MP+2MP', '32MP', 2019, 28),
  ('honor', 'Honor 30', 'honor-30', '6.53"', '40MP+8MP+2MP', '32MP', 2020, 29),
  ('honor', 'Honor 50', 'honor-50', '6.57"', '108MP+8MP+2MP+2MP', '32MP', 2021, 30),
  ('honor', 'Honor 60', 'honor-60', '6.67"', '108MP+8MP+2MP', '32MP', 2021, 31),
  ('honor', 'Honor 70', 'honor-70', '6.67"', '50MP+8MP+2MP', '32MP', 2022, 32),
  ('honor', 'Honor 80', 'honor-80', '6.67"', '50MP+50MP', '32MP', 2022, 33),
  ('honor', 'Honor 100', 'honor-100', '6.7"', '50MP+50MP', '20MP', 2023, 34),
  ('honor', 'Honor 200', 'honor-200', '6.7"', '50MP+40MP+12MP', '20MP', 2024, 35),
  ('honor', 'Honor 200 Pro', 'honor-200-pro', '6.78"', '50MP+40MP+12MP', '20MP', 2024, 36),
  ('honor', 'Honor View 10', 'honor-view-10', '6.39"', '20MP+2MP', '13MP', 2017, 37),
  ('honor', 'Honor X7', 'honor-x7', '6.51"', '50MP+5MP+2MP+2MP', '8MP', 2021, 38),
  
  -- Realme (20 models)
  ('realme', 'Realme 1', 'realme-1', '6.3"', '13MP+2MP', '8MP', 2018, 39),
  ('realme', 'Realme 2', 'realme-2', '6.2"', '13MP+2MP', '8MP', 2018, 40),
  ('realme', 'Realme 3', 'realme-3', '6.3"', '13MP+2MP', '13MP', 2019, 41),
  ('realme', 'Realme 5', 'realme-5', '6.5"', '12MP+8MP+5MP+2MP', '13MP', 2019, 42),
  ('realme', 'Realme 6', 'realme-6', '6.5"', '64MP+8MP+2MP+2MP', '16MP', 2020, 43),
  ('realme', 'Realme 7', 'realme-7', '6.5"', '64MP+8MP+2MP+2MP', '16MP', 2020, 44),
  ('realme', 'Realme 8', 'realme-8', '6.4"', '64MP+8MP+2MP+2MP', '16MP', 2021, 45),
  ('realme', 'Realme 9', 'realme-9', '6.4"', '50MP+8MP+2MP', '16MP', 2022, 46),
  ('realme', 'Realme 10', 'realme-10', '6.5"', '50MP+8MP', '13MP', 2022, 47),
  ('realme', 'Realme 11', 'realme-11', '6.4"', '50MP+8MP', '13MP', 2023, 48),
  ('realme', 'Realme 12', 'realme-12', '6.72"', '50MP+8MP', '16MP', 2023, 49),
  ('realme', 'Realme 13 Pro', 'realme-13-pro', '6.67"', '50MP+8MP', '16MP', 2024, 50),
  ('realme', 'Realme X', 'realme-x', '6.53"', '48MP+5MP', '16MP', 2019, 51),
  ('realme', 'Realme X2 Pro', 'realme-x2-pro', '6.5"', '64MP+8MP+2MP+2MP', '16MP', 2019, 52),
  ('realme', 'Realme X3', 'realme-x3', '6.6"', '64MP+8MP+2MP+2MP', '16MP', 2020, 53),
  ('realme', 'Realme X7', 'realme-x7', '6.4"', '64MP+8MP+2MP+2MP', '32MP', 2020, 54),
  ('realme', 'Realme X50', 'realme-x50', '6.57"', '64MP+12MP+8MP', '16MP', 2020, 55),
  ('realme', 'Realme GT', 'realme-gt', '6.43"', '64MP+8MP+2MP', '16MP', 2021, 56),
  ('realme', 'Realme GT 2', 'realme-gt-2', '6.62"', '50MP+8MP+2MP', '16MP', 2022, 57),
  ('realme', 'Realme GT 3', 'realme-gt-3', '6.74"', '50MP+8MP+2MP', '20MP', 2023, 58),
  
  -- Nokia (12 models)
  ('nokia', 'Nokia 6', 'nokia-6', '5.5"', '16MP', '8MP', 2017, 59),
  ('nokia', 'Nokia 7', 'nokia-7', '5.2"', '12MP', '5MP', 2017, 60),
  ('nokia', 'Nokia 8', 'nokia-8', '5.3"', '12MP+13MP', '13MP', 2017, 61),
  ('nokia', 'Nokia 8.1', 'nokia-81', '6.18"', '12MP+13MP', '20MP', 2018, 62),
  ('nokia', 'Nokia 9', 'nokia-9', '5.99"', '12MP x 5', '20MP', 2019, 63),
  ('nokia', 'Nokia G10', 'nokia-g10', '6.5"', '48MP+5MP+2MP', '8MP', 2021, 64),
  ('nokia', 'Nokia G20', 'nokia-g20', '6.5"', '48MP+5MP+2MP+2MP', '8MP', 2021, 65),
  ('nokia', 'Nokia G50', 'nokia-g50', '6.82"', '48MP+5MP+2MP', '8MP', 2021, 66),
  ('nokia', 'Nokia X10', 'nokia-x10', '6.67"', '48MP+8MP+5MP+2MP', '8MP', 2021, 67),
  ('nokia', 'Nokia X20', 'nokia-x20', '6.67"', '48MP+8MP+5MP+2MP', '8MP', 2021, 68),
  ('nokia', 'Nokia X30', 'nokia-x30', '6.43"', '50MP+13MP', '13MP', 2022, 69),
  ('nokia', 'Nokia C10', 'nokia-c10', '6.52"', '8MP', '5MP', 2021, 70),
  
  -- Tecno (12 models)
  ('tecno', 'TECNO Spark 6', 'tecno-spark-6', '6.6"', '13MP+2MP', '8MP', 2020, 71),
  ('tecno', 'TECNO Spark 7', 'tecno-spark-7', '6.52"', '13MP+2MP', '5MP', 2021, 72),
  ('tecno', 'TECNO Spark 8', 'tecno-spark-8', '6.8"', '13MP+2MP', '5MP', 2021, 73),
  ('tecno', 'TECNO Spark 9', 'tecno-spark-9', '6.6"', '13MP+2MP', '8MP', 2022, 74),
  ('tecno', 'TECNO Spark 10', 'tecno-spark-10', '6.52"', '50MP', '13MP', 2022, 75),
  ('tecno', 'TECNO Spark 20', 'tecno-spark-20', '6.6"', '50MP', '13MP', 2023, 76),
  ('tecno', 'TECNO Spark 20 Pro', 'tecno-spark-20-pro', '6.52"', '50MP+2MP', '13MP', 2024, 77),
  ('tecno', 'TECNO Camon 16', 'tecno-camon-16', '6.8"', '48MP+8MP+2MP', '16MP', 2021, 78),
  ('tecno', 'TECNO Camon 17', 'tecno-camon-17', '6.8"', '48MP+5MP+2MP', '32MP', 2021, 79),
  ('tecno', 'TECNO Camon 18', 'tecno-camon-18', '6.7"', '50MP+2MP', '16MP', 2022, 80),
  ('tecno', 'TECNO Camon 20', 'tecno-camon-20', '6.7"', '50MP+2MP', '32MP', 2023, 81),
  ('tecno', 'TECNO Pova', 'tecno-pova', '6.9"', '13MP+2MP', '8MP', 2021, 82),
  
  -- Infinix (12 models)
  ('infinix', 'Infinix Hot 7', 'infinix-hot-7', '6.2"', '13MP+2MP', '8MP', 2019, 83),
  ('infinix', 'Infinix Hot 8', 'infinix-hot-8', '6.52"', '13MP+2MP', '8MP', 2020, 84),
  ('infinix', 'Infinix Hot 9', 'infinix-hot-9', '6.6"', '13MP+2MP', '8MP', 2020, 85),
  ('infinix', 'Infinix Hot 10', 'infinix-hot-10', '6.78"', '13MP+2MP', '8MP', 2021, 86),
  ('infinix', 'Infinix Hot 11', 'infinix-hot-11', '6.82"', '50MP', '8MP', 2021, 87),
  ('infinix', 'Infinix Hot 12', 'infinix-hot-12', '6.75"', '50MP+2MP', '8MP', 2022, 88),
  ('infinix', 'Infinix Note 7', 'infinix-note-7', '6.95"', '48MP+2MP+2MP', '16MP', 2021, 89),
  ('infinix', 'Infinix Note 8', 'infinix-note-8', '6.95"', '48MP+8MP', '16MP', 2021, 90),
  ('infinix', 'Infinix Note 10', 'infinix-note-10', '6.95"', '48MP+2MP+2MP', '16MP', 2021, 91),
  ('infinix', 'Infinix Note 12', 'infinix-note-12', '6.7"', '50MP+2MP', '16MP', 2022, 92),
  ('infinix', 'Infinix Note 30 Pro', 'infinix-note-30-pro', '6.78"', '108MP+8MP', '16MP', 2023, 93),
  ('infinix', 'Infinix S5 Pro', 'infinix-s5-pro', '6.6"', '48MP+2MP+2MP', '32MP', 2020, 94)
) as t(brand_slug, model_name, slug, size, rear, front, year, sort_order)
join public.phone_brands brand on brand.slug = t.brand_slug
on conflict do nothing;

commit;
