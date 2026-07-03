-- Phone Catalog System for Professional Mobile Phone Posting
-- This migration creates a complete phone brand, model, and specification system

begin;

-- =========================================================
-- 1) Phone Brands Table
-- =========================================================
create table if not exists public.phone_brands (
  id uuid primary key default gen_random_uuid(),
  name_en text not null,
  name_fa text not null,
  name_ps text not null,
  slug text not null unique,
  logo_url text,
  description_en text,
  description_fa text,
  description_ps text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint phone_brands_slug_format check (slug = lower(slug))
);

-- =========================================================
-- 2) Phone Models Table
-- =========================================================
create table if not exists public.phone_models (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.phone_brands(id) on delete cascade,
  model_name_en text not null,
  model_name_fa text,
  model_name_ps text,
  model_slug text not null,
  screen_size text,
  rear_camera_mp text,
  front_camera_mp text,
  operating_system text not null check (operating_system in ('iOS', 'Android', 'HarmonyOS')),
  release_year int,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint phone_models_unique_brand_slug unique (brand_id, model_slug)
);

-- =========================================================
-- 3) Phone Model Aliases (Multilingual search support)
-- =========================================================
create table if not exists public.phone_model_aliases (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.phone_models(id) on delete cascade,
  alias text not null,
  language public.language_code not null,
  created_at timestamptz not null default now(),
  constraint phone_model_aliases_unique unique (model_id, alias, language)
);

-- =========================================================
-- 4) Phone Selectable Fields (Dynamic seller fields per brand)
-- =========================================================
create table if not exists public.phone_selectable_fields (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references public.phone_brands(id) on delete cascade,
  applies_to_os text check (applies_to_os in ('iOS', 'Android', 'HarmonyOS')),
  applies_to_all boolean not null default false,
  field_key text not null,
  field_label_en text not null,
  field_label_fa text not null,
  field_label_ps text not null,
  field_type text not null check (field_type in ('text', 'select', 'number', 'boolean')),
  options_json jsonb,
  is_required boolean not null default false,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- 5) Indexes for Performance
-- =========================================================
create index idx_phone_brands_active on public.phone_brands(is_active, sort_order);
create index idx_phone_models_brand_active on public.phone_models(brand_id, is_active, sort_order);
create index idx_phone_model_aliases_model on public.phone_model_aliases(model_id);
create index idx_phone_model_aliases_language on public.phone_model_aliases(language);
create index idx_phone_selectable_fields_brand on public.phone_selectable_fields(brand_id, is_active);
create index idx_phone_selectable_fields_os on public.phone_selectable_fields(applies_to_os);

-- =========================================================
-- 6) Initial Data: Phone Brands
-- =========================================================
insert into public.phone_brands (name_en, name_fa, name_ps, slug, sort_order, is_active) values
  ('Apple', 'اپل', 'ایپل', 'apple', 1, true),
  ('Samsung', 'سامسونگ', 'سمسونگ', 'samsung', 2, true),
  ('Google Pixel', 'گوگل پیکسل', 'گوګل پکسل', 'google-pixel', 3, true),
  ('Xiaomi', 'شیائومی', 'شیاومي', 'xiaomi', 4, true),
  ('Huawei', 'هوآوی', 'هوآوي', 'huawei', 5, true),
  ('OnePlus', 'وان پلاس', 'ون پلس', 'oneplus', 6, true),
  ('OPPO', 'اپو', 'اپو', 'oppo', 7, true),
  ('Vivo', 'ویوو', 'ویوو', 'vivo', 8, true),
  ('Realme', 'ریلمی', 'ریلمې', 'realme', 9, true),
  ('Motorola', 'موتورولا', 'موټورولا', 'motorola', 10, true),
  ('Tecno', 'تکنو', 'ټکنو', 'tecno', 11, true),
  ('Infinix', 'انفینکس', 'انفينکس', 'infinix', 12, true),
  ('Honor', 'آنر', 'آنور', 'honor', 13, true),
  ('Nokia', 'نوکیا', 'نوکیا', 'nokia', 14, true),
  ('Other Android Brand', 'دیگر برند اندروید', 'نور اندرويد برانډ', 'other-android', 99, true)
on conflict do nothing;

commit;
