/**
 * Migration: Add Phone Brand Category Nodes
 * Creates category nodes for phone brands under Mobile Phones
 * This allows the category selection flow to show brands as selectable items,
 * matching the vehicle flow (Vehicles > Cars > [Brand List])
 */

BEGIN;

-- Get the phones-electronics category and mobile-phones node IDs
-- Insert brand nodes under mobile-phones for level 3 hierarchy

INSERT INTO public.category_nodes (category_id, parent_id, name, slug, level, path, display_order, is_active)
SELECT 
  c.id,
  p.id,
  b.name,
  b.slug,
  3,
  p.path || '/' || b.slug,
  b.display_order,
  true
FROM public.categories c
JOIN public.category_nodes p ON p.category_id = c.id AND p.slug = 'mobile-phones'
CROSS JOIN (
  VALUES
    ('Apple', 'apple', 1),
    ('Samsung', 'samsung', 2),
    ('Xiaomi', 'xiaomi', 3),
    ('Google Pixel', 'google', 4),
    ('OnePlus', 'oneplus', 5),
    ('Oppo', 'oppo', 6),
    ('Vivo', 'vivo', 7),
    ('Realme', 'realme', 8),
    ('Huawei', 'huawei', 9),
    ('Honor', 'honor', 10),
    ('Nokia', 'nokia', 11),
    ('Motorola', 'motorola', 12),
    ('Tecno', 'tecno', 13),
    ('Infinix', 'infinix', 14),
    ('Other Android Brands', 'other-android', 15),
    ('Other Brands', 'other-brands', 16)
) AS b(name, slug, display_order)
WHERE c.slug = 'phones-electronics'
ON CONFLICT (path) DO UPDATE
SET
  name = excluded.name,
  display_order = excluded.display_order,
  is_active = true,
  updated_at = now();

COMMIT;
