# 4-Step Posting Form - Implementation Guide

## Quick Start

### For Users
Navigate to: **`/post-ad/create-new`**

The form will guide users through 4 steps:
1. **Step 1**: Photos, title, description, location, selling method
2. **Step 2**: Category selection (AI suggestion + manual browse)
3. **Step 3**: Seller-specific details based on category + pricing
4. **Step 4**: Preview before publishing

### For Developers

#### Key Files Structure
```
components/posting/
  ├── NewPostingForm.tsx      (Main orchestrator, state management, localStorage)
  ├── Step1BasicAd.tsx        (Photos, title, desc, location, method)
  ├── Step2CategoryFinding.tsx (AI suggestion + manual navigation)
  ├── Step3Details.tsx        (Seller details from schema + pricing)
  ├── Step4ReviewPublish.tsx  (Preview & publish)
  ├── LocationModal.tsx       (Location selection popup)
  ├── SellingMethodSelector.tsx
  └── FieldRenderer.tsx       (Dynamic field rendering)

lib/posting/
  ├── types.ts                (All TypeScript definitions)
  ├── categoryTree.ts         (Category navigation utilities)
  └── schemas/
      ├── iphone.ts           (iPhone seller detail fields)
      ├── android.ts          (Android seller detail fields)
      ├── vehicle.ts          (Vehicle seller detail fields)
      ├── realEstate.ts       (Real estate seller detail fields)
      └── index.ts            (Schema loader/mapper)

app/
  ├── post-ad/create-new/page.tsx  (Route entry point)
  └── api/posting/suggest-category/route.ts (AI endpoint)

lib/i18n/
  └── client.ts               (useTranslation hook)
```

#### How It Works

**State Management:**
- Single `PostingState` object in NewPostingForm
- Auto-saves to localStorage on every change (`posting_draft_v4` key)
- Auto-loads draft on component mount

**Category Selection:**
- Step 2 fetches AI suggestion from `/api/posting/suggest-category`
- User can accept AI suggestion or manually browse categories
- Final selection must have `finalNode: true`

**Seller Details:**
- Step 3 loads schema based on `finalCategoryNodeId`
- Schema mapper (`getSchemaForCategory`) returns appropriate fields
- Example: iPhone schema has storage/color/battery %, Android adds RAM

**Draft Persistence:**
- localStorage key: `posting_draft_v4`
- Auto-saved after any state change
- Restored on component mount

## API Endpoints

### POST `/api/posting/suggest-category`

**Request:**
```typescript
{
  title: string;           // Item title
  description: string;     // Item description
  location?: {
    province?: string;
    district?: string;
  };
  sellingMethod?: string;  // sell|rent|exchange|wanted|negotiable
  photoUrls?: string[];    // For future CV-based suggestions
}
```

**Response:**
```typescript
{
  suggestion: {
    categoryPath: CategoryNode[]; // Full path from root to final node
    confidence: number;           // 0-1 confidence score
    reasoning: string;            // Explanation of suggestion
    usedPhotos: boolean;
    usedTitle: boolean;
    usedDescription: boolean;
    usedLocation: boolean;
  }
}
```

## Extending the System

### Adding a New Category Type

1. **Create schema** in `lib/posting/schemas/{category}.ts`:
```typescript
export const MY_CATEGORY_SCHEMA: PostingFieldSchema[] = [
  {
    id: "fieldName",
    type: "select",
    labelKey: "category.fieldName",
    required: true,
    options: [
      { value: "opt1", labelKey: "option.opt1" },
    ],
  },
];
```

2. **Register in mapper** in `lib/posting/schemas/index.ts`:
```typescript
const SCHEMA_MAP: Record<string, PostingFieldSchema[]> = {
  my_category_node_id: MY_CATEGORY_SCHEMA,
  // ...
};
```

3. **Update category tree** in `lib/posting/categoryTree.ts`:
Add new nodes with `finalNode: true` for selectable categories

4. **Update AI endpoint** in `app/api/posting/suggest-category/route.ts`:
Add heuristics for detecting your category

### Adding New Field Types

FieldRenderer supports: `text`, `number`, `percentage`, `select`, `checkbox`, `date`

To add a new type:
1. Add type to `PostingFieldSchema.type` union
2. Add case in FieldRenderer component

### i18n Translation Keys

All labels use translation keys. Add keys to i18n system:
- `category.{categoryId}`
- `phones.specs.{fieldName}`
- `condition.{value}`
- etc.

## TODO / Not Yet Implemented

- [ ] Image upload to cloud storage (currently localStorage preview only)
- [ ] Server action `createListingAction` to save posting to database
- [ ] Migrate categories from in-memory to Supabase
- [ ] Advanced AI suggestions (Claude API integration)
- [ ] Catalog data (phones specs, vehicle models, etc.)
- [ ] Multi-language testing (EN, FA, PS)
- [ ] Mobile optimization
- [ ] Acceptance testing

## Testing Flow

### Test 1: Simple iPhone Listing
1. Navigate to `/post-ad/create-new`
2. Upload photo
3. Title: "iPhone 13 Pro Max"
4. Description: "Great condition, all accessories"
5. Select location
6. Continue → AI suggests iPhone category
7. Accept suggestion
8. Step 3 shows: storage, color, condition, battery %, screen/body damage, charger
9. Fill pricing: 50000 AFN
10. Review and publish (will show alert - not yet connected to DB)

### Test 2: Samsung Phone Listing
- Title: "Samsung Galaxy S23"
- AI suggests Android path
- Step 3 shows RAM field (unlike iPhone)

### Test 3: Vehicle Listing
- Title: "Toyota Corolla 2015"
- AI suggests car category
- Step 3 shows: year, mileage, transmission, fuel, condition, accident history

### Test 4: Apartment Listing
- Title: "1 Bedroom Apartment Kabul"
- AI suggests real estate
- Step 3 shows: size, bedrooms, bathrooms, furnished, features

## Known Limitations

- No image upload to cloud (uses data URLs in memory)
- No server action yet (publishing shows alert)
- Category tree is in-memory (not in database)
- AI suggestions use simple heuristics (not ML-based)
- Seller details schema is hardcoded (not database-driven)

## Production Readiness Checklist

- [ ] Database schema for listings
- [ ] Server action for createListing
- [ ] Image upload to cloud storage
- [ ] Category tree migrated to database
- [ ] Comprehensive i18n translations
- [ ] Error handling and validation
- [ ] Load testing
- [ ] Security validation
- [ ] Mobile responsiveness
- [ ] Accessibility compliance

---

**Created:** 4-step posting system redesign
**Status:** Core functionality complete, ready for DB integration
**Build:** Zero TypeScript errors ✅
