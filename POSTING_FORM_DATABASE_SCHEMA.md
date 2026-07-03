# Posting Form Database Schema

## 🗄️ Tables Required

### 1. categories
```sql
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name_en TEXT NOT NULL,
  name_fa TEXT NOT NULL,
  name_ps TEXT NOT NULL,
  
  -- Hierarchy
  parent_id UUID REFERENCES categories(id),
  level INT NOT NULL, -- 1=root, 2=category, 3=subcategory, 4=leaf
  path TEXT NOT NULL, -- "Electronics/Phones/Apple/iPhone 13 Pro Max"
  
  -- Metadata
  icon TEXT, -- emoji or icon class
  color TEXT, -- hex color for UI
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  
  UNIQUE(parent_id, slug)
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent ON categories(parent_id);
CREATE INDEX idx_categories_level ON categories(level);
CREATE INDEX idx_categories_path ON categories USING GIN(path);
```

---

### 2. category_specifications
```sql
-- Stores what fields should be shown for each category and which are auto-filled

CREATE TABLE category_specifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL UNIQUE REFERENCES categories(id) ON DELETE CASCADE,
  
  -- Auto-filled fields (from this table)
  auto_fields JSONB DEFAULT '{}', -- Example: {"brand": "Apple", "model": "iPhone 13 Pro Max"}
  
  -- Fields user must fill
  required_fields JSONB DEFAULT '{}', -- Example: [{"name": "storage", "type": "select", "options": [...]}, ...]
  
  -- Optional fields user can add
  optional_fields JSONB DEFAULT '{}', -- Example: [{"name": "original_box", "type": "checkbox"}, ...]
  
  -- Field visibility rules
  conditional_fields JSONB DEFAULT '{}', -- Example: {"trade_in_condition": {"visible_if": "trade_in_available === true"}}
  
  -- Pricing fields (if applicable)
  pricing_type TEXT, -- 'sale' | 'auction' | 'rent' | 'trade_in'
  allow_negotiation BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_category_specs_category ON category_specifications(category_id);
```

---

### 3. category_field_definitions
```sql
-- Reusable field definitions to avoid duplication

CREATE TABLE category_field_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_key TEXT UNIQUE NOT NULL, -- "storage_capacity", "color", "condition"
  
  field_type TEXT NOT NULL, -- 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'textarea'
  label_en TEXT NOT NULL,
  label_fa TEXT NOT NULL,
  label_ps TEXT NOT NULL,
  
  description_en TEXT,
  description_fa TEXT,
  description_ps TEXT,
  
  placeholder_en TEXT,
  placeholder_fa TEXT,
  placeholder_ps TEXT,
  
  -- For select fields
  options JSONB, -- [{"value": "128GB", "label_en": "128GB"}, ...]
  
  validation_rules JSONB, -- {"required": true, "min": 1, "max": 100}
  
  is_global BOOLEAN DEFAULT false, -- true if used across multiple categories
  
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE INDEX idx_field_defs_key ON category_field_definitions(field_key);
```

---

### 4. category_hierarchy_cache
```sql
-- Pre-computed hierarchy for fast tree generation

CREATE TABLE category_hierarchy_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES categories(id),
  child_id UUID REFERENCES categories(id),
  depth INT NOT NULL,
  
  path_ids UUID[] NOT NULL, -- [root_id, level1_id, level2_id, ...]
  path_slugs TEXT[] NOT NULL, -- ["electronics", "phones", "apple", ...]
  path_en TEXT[] NOT NULL, -- ["Electronics", "Phones", "Apple", ...]
  path_fa TEXT[] NOT NULL,
  path_ps TEXT[] NOT NULL,
  
  PRIMARY KEY (parent_id, child_id),
  UNIQUE (child_id) -- Each child has only one parent path
);

CREATE INDEX idx_hierarchy_child ON category_hierarchy_cache(child_id);
CREATE INDEX idx_hierarchy_parent ON category_hierarchy_cache(parent_id);
```

---

## 📊 Sample Data

### Categories Tree

```sql
-- Root categories
INSERT INTO categories (slug, name_en, name_fa, name_ps, level, path) VALUES
('electronics', 'Electronics', 'الکترونیک', 'الکترونیک', 1, 'Electronics'),
('vehicles', 'Vehicles', 'گاڑیاں', 'ګاډې', 1, 'Vehicles'),
('real-estate', 'Real Estate', 'رئیل اسٹیٹ', 'ریل اسٹیٹ', 1, 'Real Estate');

-- Electronics subcategories
INSERT INTO categories (slug, name_en, name_fa, name_ps, parent_id, level, path) VALUES
('phones', 'Phones', 'فون', 'تلیفون', (SELECT id FROM categories WHERE slug='electronics'), 2, 'Electronics/Phones'),
('laptops', 'Laptops', 'لیپ ٹاپ', 'لیپ ټاپ', (SELECT id FROM categories WHERE slug='electronics'), 2, 'Electronics/Laptops'),
('cameras', 'Cameras', 'کیمرے', 'کیمرې', (SELECT id FROM categories WHERE slug='electronics'), 2, 'Electronics/Cameras');

-- Phones > Brands
INSERT INTO categories (slug, name_en, name_fa, name_ps, parent_id, level, path) VALUES
('apple', 'Apple', 'ایپل', 'ایپل', (SELECT id FROM categories WHERE slug='phones'), 3, 'Electronics/Phones/Apple'),
('samsung', 'Samsung', 'سام سنگ', 'سام سنگ', (SELECT id FROM categories WHERE slug='phones'), 3, 'Electronics/Phones/Samsung'),
('huawei', 'Huawei', 'ہوا وے', 'هواوي', (SELECT id FROM categories WHERE slug='phones'), 3, 'Electronics/Phones/Huawei');

-- Apple > Models (LEAF NODES - these are where users select)
INSERT INTO categories (slug, name_en, name_fa, name_ps, parent_id, level, path) VALUES
('iphone-13-pro-max', 'iPhone 13 Pro Max', 'آئی فون ۱۳ پرو میکس', 'آی فون ۱۳ پرو ماکس', (SELECT id FROM categories WHERE slug='apple'), 4, 'Electronics/Phones/Apple/iPhone 13 Pro Max'),
('iphone-13-pro', 'iPhone 13 Pro', 'آئی فون ۱۳ پرو', 'آی فون ۱۳ پرو', (SELECT id FROM categories WHERE slug='apple'), 4, 'Electronics/Phones/Apple/iPhone 13 Pro'),
('iphone-13', 'iPhone 13', 'آئی فون ۱۳', 'آی فون ۱۳', (SELECT id FROM categories WHERE slug='apple'), 4, 'Electronics/Phones/Apple/iPhone 13'),
('iphone-12-pro-max', 'iPhone 12 Pro Max', 'آئی فون ۱۲ پرو میکس', 'آی فون ۱۲ پرو ماکس', (SELECT id FROM categories WHERE slug='apple'), 4, 'Electronics/Phones/Apple/iPhone 12 Pro Max');

-- Vehicles > Cars > Brands > Models
INSERT INTO categories (slug, name_en, name_fa, name_ps, parent_id, level, path) VALUES
('cars', 'Cars', 'کار', 'موټر', (SELECT id FROM categories WHERE slug='vehicles'), 2, 'Vehicles/Cars');

INSERT INTO categories (slug, name_en, name_fa, name_ps, parent_id, level, path) VALUES
('toyota', 'Toyota', 'ٹویوٹا', 'ټویوتا', (SELECT id FROM categories WHERE slug='cars'), 3, 'Vehicles/Cars/Toyota');

INSERT INTO categories (slug, name_en, name_fa, name_ps, parent_id, level, path) VALUES
('corolla', 'Corolla', 'کرولا', 'کرولا', (SELECT id FROM categories WHERE slug='toyota'), 4, 'Vehicles/Cars/Toyota/Corolla'),
('camry', 'Camry', 'کیمری', 'کیمری', (SELECT id FROM categories WHERE slug='toyota'), 4, 'Vehicles/Cars/Toyota/Camry');

-- Corolla > Year Models (LEAF NODES)
INSERT INTO categories (slug, name_en, name_fa, name_ps, parent_id, level, path) VALUES
('corolla-2023', '2023 Corolla', '۲۰۲۳ کرولا', '۲۰۲۳ کرولا', (SELECT id FROM categories WHERE slug='corolla'), 5, 'Vehicles/Cars/Toyota/Corolla/2023'),
('corolla-2022', '2022 Corolla', '۲۰۲۲ کرولا', '۲۰۲۲ کرولا', (SELECT id FROM categories WHERE slug='corolla'), 5, 'Vehicles/Cars/Toyota/Corolla/2022'),
('corolla-2021', '2021 Corolla', '۲۰۲۱ کرولا', '۲۰۲۱ کرولا', (SELECT id FROM categories WHERE slug='corolla'), 5, 'Vehicles/Cars/Toyota/Corolla/2021');
```

---

### Category Specifications

```sql
-- iPhone 13 Pro Max specifications
INSERT INTO category_specifications (
  category_id,
  auto_fields,
  required_fields,
  optional_fields,
  pricing_type
) VALUES (
  (SELECT id FROM categories WHERE slug='iphone-13-pro-max'),
  '{"brand": "Apple", "model": "iPhone 13 Pro Max", "screen_size": "6.7 inches", "screen_type": "Super Retina XDR", "rear_cameras": "12MP Wide + 12MP Ultra-wide + 12MP Telephoto", "front_camera": "12MP", "os": "iOS 15+", "processor": "A15 Bionic", "battery": "3200 mAh"}'::jsonb,
  '[
    {"name": "storage_capacity", "type": "select", "label": "Storage", "options": ["128GB", "256GB", "512GB", "1TB"], "required": true},
    {"name": "color", "type": "select", "label": "Color", "options": ["Midnight", "Starlight", "Deep Purple", "Gold", "Silver"], "required": true},
    {"name": "condition", "type": "select", "label": "Condition", "options": ["Like New", "Excellent", "Good", "Fair", "For Parts"], "required": true},
    {"name": "warranty", "type": "select", "label": "Warranty", "options": ["Apple Care+", "Original Warranty", "No Warranty"], "required": true},
    {"name": "purchase_place", "type": "select", "label": "Purchase Place", "options": ["Official Apple Store", "Authorized Dealer", "Private Seller"], "required": true}
  ]'::jsonb,
  '[
    {"name": "percentage_original", "type": "number", "label": "Percentage of Original", "placeholder": "95"},
    {"name": "original_box", "type": "checkbox", "label": "Comes with original box"},
    {"name": "original_charger", "type": "checkbox", "label": "Comes with original charger"},
    {"name": "trade_in_available", "type": "checkbox", "label": "Trade-In Available"},
    {"name": "trade_in_condition", "type": "select", "label": "Trade-In Device Condition", "options": ["Perfect", "Good", "Acceptable"]}
  ]'::jsonb,
  'sale'
);

-- 2023 Toyota Corolla specifications
INSERT INTO category_specifications (
  category_id,
  auto_fields,
  required_fields,
  optional_fields,
  pricing_type
) VALUES (
  (SELECT id FROM categories WHERE slug='corolla-2023'),
  '{"brand": "Toyota", "model": "Corolla", "year": 2023, "body_type": "Sedan", "seats": 5, "transmission_options": ["Manual", "Automatic"]}'::jsonb,
  '[
    {"name": "color", "type": "select", "label": "Color", "options": ["White", "Silver", "Black", "Blue", "Red", "Gray"], "required": true},
    {"name": "mileage", "type": "number", "label": "Mileage (km)", "required": true},
    {"name": "transmission", "type": "select", "label": "Transmission", "options": ["Manual", "Automatic"], "required": true},
    {"name": "condition", "type": "select", "label": "Condition", "options": ["Like New", "Excellent", "Good", "Fair"], "required": true},
    {"name": "accidents", "type": "select", "label": "Accidents", "options": ["None", "Minor", "Major"], "required": true}
  ]'::jsonb,
  '[
    {"name": "service_history", "type": "select", "label": "Service History", "options": ["Regular", "Irregular", "None"]},
    {"name": "full_papers", "type": "checkbox", "label": "Full Papers Available"},
    {"name": "original_paint", "type": "checkbox", "label": "Original Paint"},
    {"name": "trade_in_available", "type": "checkbox", "label": "Trade-In Available"}
  ]'::jsonb,
  'sale'
);
```

---

### Field Definitions

```sql
INSERT INTO category_field_definitions (field_key, field_type, label_en, label_fa, label_ps, options) VALUES
('storage_capacity', 'select', 'Storage Capacity', 'ذخیرہ کی گنجائش', 'ذخیره ظرفیت', 
  '[{"value": "64GB", "label_en": "64GB"}, {"value": "128GB", "label_en": "128GB"}, {"value": "256GB", "label_en": "256GB"}, {"value": "512GB", "label_en": "512GB"}, {"value": "1TB", "label_en": "1TB"}]'::jsonb),

('color', 'select', 'Color', 'رنگ', 'رنگ',
  '[{"value": "black", "label_en": "Black"}, {"value": "white", "label_en": "White"}, {"value": "silver", "label_en": "Silver"}, {"value": "blue", "label_en": "Blue"}, {"value": "red", "label_en": "Red"}]'::jsonb),

('condition', 'select', 'Condition', 'حالت', 'حالت',
  '[{"value": "like_new", "label_en": "Like New"}, {"value": "excellent", "label_en": "Excellent"}, {"value": "good", "label_en": "Good"}, {"value": "fair", "label_en": "Fair"}, {"value": "for_parts", "label_en": "For Parts"}]'::jsonb),

('warranty', 'select', 'Warranty', 'وارنٹی', 'وارنټي',
  '[{"value": "extended", "label_en": "Extended/Care+"}, {"value": "original", "label_en": "Original 1-Year"}, {"value": "none", "label_en": "No Warranty"}]'::jsonb),

('mileage', 'number', 'Mileage (km)', 'میل (کلومیٹر)', 'مایل (کلومتر)', NULL),

('percentage_original', 'number', 'Percentage of Original', 'اصل کا فیصد', 'اصل فیصد', NULL);
```

---

## 🔗 Schema Relationships

```
categories (tree structure)
    ↓
    └─→ category_specifications (what fields to show)
            ├─→ auto_fields (JSONB)
            ├─→ required_fields (JSONB)
            └─→ optional_fields (JSONB)
                    ↓
                    └─→ category_field_definitions (reusable field definitions)

listings
    ├─→ category_id (which final category)
    ├─→ category_specification_id (which specs apply)
    └─→ listing_details (JSONB with actual values)
```

---

## 📝 Sample Listing Data

```sql
-- When user posts iPhone listing, create:
INSERT INTO listings (
  user_id,
  category_id, -- iPhone 13 Pro Max
  title,
  description,
  photos_urls,
  location_province_id,
  location_district_id,
  location_area_custom,
  
  -- Specification data (JSONB)
  details
) VALUES (
  'user-uuid',
  (SELECT id FROM categories WHERE slug='iphone-13-pro-max'),
  'iPhone 13 Pro Max - 256GB, Blue, Like New',
  'Perfect condition, comes with original box and charger...',
  '["url1", "url2", "url3"]'::text[],
  'kabul-province-id',
  'shahr-e-nau-district-id',
  NULL,
  '{
    "auto_fields": {
      "brand": "Apple",
      "model": "iPhone 13 Pro Max",
      "screen_size": "6.7 inches",
      "processor": "A15 Bionic",
      "rear_cameras": "12MP+12MP+12MP",
      "front_camera": "12MP",
      "os": "iOS 15+"
    },
    "user_fields": {
      "storage_capacity": "256GB",
      "color": "Blue",
      "condition": "Like New",
      "warranty": "Original Warranty",
      "purchase_place": "Authorized Dealer",
      "percentage_original": 98,
      "original_box": true,
      "original_charger": true,
      "trade_in_available": false
    }
  }'::jsonb
);
```

---

## 🗝️ Key Considerations

### 1. Auto-filled vs User-filled
```
Auto-filled (locked):
- Never change these
- Used for filtering and search
- Verified by platform
- Example: iPhone specs (OS, processor, cameras)

User-filled (changeable):
- User must select from options
- Cannot be free text (prevents errors)
- Example: Storage, color, condition
```

### 2. Category Depth
```
Electronics > Phones > Apple > iPhone 13 Pro Max (depth=4, LEAF)
Vehicles > Cars > Toyota > Corolla > 2023 (depth=5, LEAF)
Real Estate > Apartments > 2-Bedroom (depth=3, LEAF)

Leaf nodes are where users make selections.
Non-leaf nodes are for browsing/navigation.
```

### 3. Field Reusability
```
"color" used in:
- Electronics > Phones > Apple > iPhone 13 Pro Max
- Vehicles > Cars > Toyota > Corolla > 2023
- Real Estate > Apartments > 2-Bedroom

Instead of defining twice, use category_field_definitions
and reference in category_specifications.
```

### 4. Conditional Fields
```
"trade_in_condition" only visible if "trade_in_available" is checked.
"attachment_type" only visible for documents category.

Handled via conditional_fields JSONB in specifications.
```

---

## 🚀 Migration Script

```sql
-- Run migrations in order:

1. supabase/migrations/001_init.sql (existing)
2. supabase/migrations/002_location_system.sql (existing)
3. supabase/migrations/003_posting_form_schema.sql (NEW - create categories, specifications, etc)
4. supabase/seeds/posting_form_categories.sql (seed category tree)
5. supabase/seeds/posting_form_specifications.sql (seed specifications)
```

---

## 🔄 Querying Examples

### Get Category Tree
```sql
WITH RECURSIVE category_tree AS (
  SELECT id, slug, name_en, parent_id, level, 0 as depth
  FROM categories
  WHERE parent_id IS NULL
  
  UNION ALL
  
  SELECT c.id, c.slug, c.name_en, c.parent_id, c.level, ct.depth + 1
  FROM categories c
  JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree ORDER BY depth, sort_order;
```

### Get Category with Specifications
```sql
SELECT 
  c.*,
  cs.auto_fields,
  cs.required_fields,
  cs.optional_fields
FROM categories c
LEFT JOIN category_specifications cs ON c.id = cs.category_id
WHERE c.slug = 'iphone-13-pro-max';
```

### Get Children of Category
```sql
SELECT * FROM categories
WHERE parent_id = (SELECT id FROM categories WHERE slug = 'apple')
ORDER BY sort_order;
```

---

This is the complete database foundation for your posting form system.
