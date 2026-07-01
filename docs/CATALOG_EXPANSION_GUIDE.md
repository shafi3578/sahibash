# Quick Catalog Expansion Guide

**Goal**: Add new phone, vehicle, or laptop models to the catalog  
**Effort**: ~5 min per brand with 2-3 models

## Pattern: Adding Phone Models

### Step 1: Create Brand File
Create `lib/data/catalogs/phones/[brand-id].ts`:

```typescript
import type { CatalogModel } from "@/lib/catalog/types";

export const MODELS: CatalogModel[] = [
  {
    id: "redmi-note-13",
    brandId: "redmi",
    name: "Redmi Note 13",
    nameAliases: ["Redmi Note 13", "Note 13", "Redmi Note13"],
    releaseYear: 2023,
    type: "smartphone",
    stableSpecs: [
      {
        key: "brand",
        label: { en: "Brand", fa: "برند", ps: "برانډ" },
        value: "Redmi",
        confidence: 1.0,
        editable: false,
      },
      {
        key: "os",
        label: { en: "Operating System", fa: "سیستم عامل", ps: "آپریٹنګ سسٹم" },
        value: "Android",
        confidence: 1.0,
        editable: false,
      },
      {
        key: "device_type",
        label: { en: "Device Type", fa: "نوع دستگاه", ps: "ډیوایس ډول" },
        value: "Smartphone",
        confidence: 1.0,
        editable: false,
      },
      {
        key: "charger_type",
        label: { en: "Charger Type", fa: "نوع شارژر", ps: "چارجر ډول" },
        value: "USB-C",
        confidence: 1.0,
        editable: false,
      },
      {
        key: "5g",
        label: { en: "5G Support", fa: "پشتیبانی ۵G", ps: "۵G ملاتړ" },
        value: true,
        confidence: 0.9,
        editable: false,
      },
      {
        key: "storage_options",
        label: { en: "Storage Options", fa: "گزینه‌های ذخیره‌سازی", ps: "ذخیره کولو اختیارات" },
        value: ["128GB", "256GB"],
        confidence: 0.9,
        editable: false,
      },
    ],
    requiredSellerFields: ["condition", "price", "location"],
    optionalSellerFields: ["color", "storage", "battery_health", "box_carton", "charger_included", "repair_history", "warranty"],
    buyerDetailFields: [
      "brand", "model", "storage", "color", "condition",
      "battery_health", "box_carton", "charger_included", "price", "location"
    ],
    searchAliases: [
      "Redmi Note 13", "redmi note 13", "Note 13",
      "ریڈمی نوٹ", "redmi"
    ],
    active: true,
  },
  // Add more models here...
];
```

### Step 2: Register Brand in Index
Update `lib/data/catalogs/phones/index.ts`:

```typescript
import type { CatalogBrand } from "@/lib/catalog/types";

export const PHONE_BRANDS: CatalogBrand[] = [
  // ... existing brands ...
  {
    id: "redmi",
    name: "Redmi",
    categoryId: "phones-electronics",
    active: true,
  },
  // ... more brands ...
];
```

### Step 3: Add Dynamic Import
Update `app/api/catalog/models/route.ts` – the import happens automatically via:

```typescript
const brandsModule = await import(`@/lib/data/catalogs/${category}/${brandId}.ts`);
const MODELS = brandsModule.MODELS;
```

### Step 4: Build, Commit, Deploy

```bash
npm run build                    # Verify TypeScript
git add -A
git commit -m "Add Redmi phone models"
git push origin main
npx vercel deploy --prod --yes  # Deploy to production
```

---

## Pattern: Adding Vehicle Models

Same pattern as phones. Create `lib/data/catalogs/vehicles/[brand-id].ts`:

```typescript
export const MODELS: CatalogModel[] = [
  {
    id: "hyundai-tucson",
    brandId: "hyundai",
    name: "Tucson",
    type: "car",
    stableSpecs: [
      {
        key: "brand",
        label: { en: "Brand", fa: "برند", ps: "برانډ" },
        value: "Hyundai",
        confidence: 1.0,
        editable: false,
      },
      {
        key: "model",
        label: { en: "Model", fa: "مدل", ps: "ماډل" },
        value: "Tucson",
        confidence: 1.0,
        editable: false,
      },
      {
        key: "body_type",
        label: { en: "Body Type", fa: "نوع بدن", ps: "بدن ډول" },
        value: "SUV",
        confidence: 0.95,
        editable: true,
      },
      {
        key: "fuel_type",
        label: { en: "Fuel Type", fa: "نوع سوخت", ps: "ایندھن ډول" },
        value: "Petrol",
        confidence: 0.9,
        editable: true,
      },
    ],
    requiredSellerFields: ["year", "mileage", "condition", "price", "location"],
    optionalSellerFields: ["fuel_type", "transmission", "engine_size", "accident_status", "documents"],
    buyerDetailFields: [
      "brand", "model", "year", "mileage", "fuel_type",
      "transmission", "condition", "accident_status", "price", "location"
    ],
    searchAliases: ["Hyundai Tucson", "Tucson", "هيونداي", "ہیونڈائی"],
    active: true,
  },
];
```

Update `lib/data/catalogs/vehicles/index.ts` with:

```typescript
{
  id: "hyundai",
  name: "Hyundai",
  categoryId: "vehicles",
  active: true,
}
```

---

## Common Specs by Category

### Phone Specs
- `brand` (confidence: 1.0) – Fixed
- `os` (confidence: 1.0) – iOS/Android (fixed)
- `device_type` (confidence: 1.0) – "Smartphone"
- `charger_type` (confidence: 1.0) – USB-C, Lightning, Micro-USB
- `5g` (confidence: 0.9) – Boolean
- `storage_options` (confidence: 0.9) – Array: ["128GB", "256GB", ...]
- `screen_size` (confidence: 0.95) – "6.1 inches"
- `colors` (confidence: 0.75) – Array: ["Black", "Silver", ...]

### Vehicle Specs
- `brand` (confidence: 1.0) – Fixed
- `model` (confidence: 1.0) – Fixed
- `body_type` (confidence: 0.95) – Sedan, SUV, Truck (editable: true)
- `fuel_type` (confidence: 0.9) – Petrol, Diesel (editable: true)
- `transmission` (confidence: 0.75) – Manual, Automatic (editable: true)
- `engine_size` (confidence: 0.5) – Editable by user

### Laptop Specs
- `brand` (confidence: 1.0) – Fixed
- `os` (confidence: 1.0) – macOS, Windows, Linux
- `processor` (confidence: 0.95) – Intel i7, M4 Max, Ryzen 9
- `ram_options` (confidence: 0.9) – ["8GB", "16GB", "32GB"]
- `storage_options` (confidence: 0.9) – ["256GB", "512GB", "1TB"]
- `screen_size` (confidence: 0.95) – "13 inches", "15 inches"

---

## Confidence Levels: When to Use

| Level | When | Locked? | Example |
|-------|------|---------|---------|
| 1.0 | 100% certain, never varies | ✅ Yes | Brand, OS, charger type |
| 0.95 | Almost always true, <1% variance | ✅ Yes | Screen size, storage options |
| 0.9 | Very likely, ~5% variance | ✅ Yes | 5G, fuel type |
| 0.75 | Often true, 15-20% variance | ❌ No | Body type (can be customized) |
| 0.5 | Frequently wrong, ~50% variance | ❌ No | Year for vehicles (user enters) |

**Rule**: Only lock specs with confidence ≥ 0.9. Editable specs usually have confidence ≤ 0.75.

---

## Example: Expanding Apple MacBooks

File: `lib/data/catalogs/laptops/apple.ts`

```typescript
export const MODELS: CatalogModel[] = [
  {
    id: "macbook-air-m3-13",
    brandId: "apple",
    name: "MacBook Air M3 13-inch",
    releaseYear: 2024,
    type: "laptop",
    stableSpecs: [
      { key: "brand", label: { en: "Brand", fa: "برند", ps: "برانډ" }, value: "Apple", confidence: 1.0, editable: false },
      { key: "os", label: { en: "OS", fa: "سیستم عامل", ps: "آپریٹنګ سسٹم" }, value: "macOS", confidence: 1.0, editable: false },
      { key: "processor", label: { en: "Processor", fa: "پروسیسر", ps: "پروسیسر" }, value: "Apple M3", confidence: 1.0, editable: false },
      { key: "screen_size", label: { en: "Screen", fa: "صفحه", ps: "سکرین" }, value: "13 inches", confidence: 0.95, editable: false },
      { key: "ram_options", label: { en: "RAM", fa: "رم", ps: "رام" }, value: ["8GB", "16GB", "24GB"], confidence: 0.9, editable: false },
      { key: "storage_options", label: { en: "SSD", fa: "ذخیره", ps: "ذخیره" }, value: ["256GB", "512GB", "1TB"], confidence: 0.9, editable: false },
    ],
    requiredSellerFields: ["condition", "price", "location"],
    optionalSellerFields: ["storage", "ram", "battery_health", "keyboard_condition", "screen_condition", "warranty"],
    buyerDetailFields: ["brand", "model", "storage", "ram", "condition", "battery_health", "warranty", "price", "location"],
    searchAliases: ["MacBook Air M3", "MacBook Air 13", "Apple MacBook Air M3 13"],
    active: true,
  },
  // Add more MacBook models...
];
```

---

## Validation Checklist

Before committing a new brand:

- [ ] All `stableSpecs` have `key`, `label`, `value`, `confidence`, `editable`
- [ ] `label` has all 3 languages: `{ en, fa, ps }`
- [ ] `confidence` is one of: 0.5, 0.75, 0.9, 0.95, 1.0
- [ ] `requiredSellerFields` at least 3 items
- [ ] `optionalSellerFields` at least 3 items
- [ ] `buyerDetailFields` includes required + optional + key specs
- [ ] `searchAliases` includes EN + multilingual variants
- [ ] Brand registered in index file with `active: true`
- [ ] TypeScript build passes: `npm run build`

---

## Batch Expansion Template

To add 5 phone brands at once:

```bash
# Create all files
touch lib/data/catalogs/phones/{huawei,honor,oppo,vivo,oneplus}.ts

# Copy template into each (replace brandId, name, model names)
# Update lib/data/catalogs/phones/index.ts with 5 brand entries

# Build and test
npm run build

# Commit
git add -A
git commit -m "Add Huawei, Honor, Oppo, Vivo, OnePlus phone models"
git push origin main
npx vercel deploy --prod --yes
```

---

## Need Help?

See [CATALOG_SYSTEM_COMPLETE.md](CATALOG_SYSTEM_COMPLETE.md) for full architecture overview.

Contact team for:
- Brand/model specifications not in system
- Multi-language translations
- Spec confidence level guidance
- Admin management system setup
