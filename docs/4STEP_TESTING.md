# 4-Step Posting Form - Testing Guide

## Quick Smoke Test (2 minutes)

1. **Start the dev server:**
   ```bash
   npm run dev
   ```

2. **Navigate to form:**
   ```
   http://localhost:3000/en/post-ad/create-new
   ```

3. **Verify UI loads:**
   - ✓ See 4-step progress bar (1/4)
   - ✓ See Step 1 title: "Step 1: Ad Basics"
   - ✓ See photo upload area, title field, description, location button, selling method selector
   - ✓ No errors in browser console

4. **Test photo upload:**
   - Click photo upload area
   - Select a test image
   - Verify preview appears in grid

5. **Test location:**
   - Click "Select Location" button
   - Verify modal opens with province/district dropdowns
   - Select a province and district
   - Verify location displays as "Province - District"

6. **Test draft saving:**
   - Fill title: "Test iPhone"
   - Open browser DevTools → Application → localStorage
   - Verify key `posting_draft_v4` exists with your data

7. **Continue to Step 2:**
   - Click "Continue" button (all fields required)
   - Verify Step 2 loads with AI suggestion tab + manual selection

8. **Verify AI suggestion:**
   - If your title was "Test iPhone", AI should suggest iPhone category
   - See "Suggested Category" with path: Phones → Mobile Phones → Apple → iPhone
   - Can accept or use manual selection

9. **Continue to Step 3:**
   - Select category (or accept AI) and continue
   - Step 3 should show seller details based on category
   - For iPhone: storage, color, condition, battery %, damage fields
   - For Android: also shows RAM field
   - Price field visible

10. **Continue to Step 4:**
    - Enter price: 50000
    - Continue to review
    - See summary of all entered data
    - Click "Publish" (will show alert - not yet connected to DB)

---

## Detailed Testing Scenarios

### Scenario 1: iPhone Listing
**Goal:** Verify iPhone schema is loaded correctly

```
Title:       iPhone 13 Pro Max
Description: Mint condition, all accessories included
Location:    Kabul, District 1
Method:      Sell
Photos:      [select test image]
```

**Expected Results:**
- Step 2: AI suggests "Apple → iPhone 13 Pro Max"
- Step 3: Shows iPhone-specific fields:
  - Storage (select: 128GB, 256GB, 512GB, etc.)
  - Color (select: Black, White, Gold, etc.)
  - Condition (select: Mint, Excellent, etc.)
  - Battery Health (number: 0-100)
  - Screen Damage (select options)
  - Body Damage (select options)
  - Includes box charger (checkbox)
  - Original charger (checkbox)
- Price: 50,000 AFN
- Step 4: Shows all entered data in clean preview

### Scenario 2: Samsung Phone
**Goal:** Verify Android schema differs from iPhone (has RAM)

```
Title:       Samsung Galaxy S23
Description: Used, good condition
Location:    Kandahar, Main District
Method:      Sell
```

**Expected Results:**
- Step 2: AI suggests "Samsung → Galaxy S23"
- Step 3: Shows Android fields INCLUDING:
  - **RAM** (select: 4GB, 6GB, 8GB, 12GB) ← NOT in iPhone
  - Storage
  - Color
  - Condition
  - Battery Health
  - etc.

**Verification:** RAM field should be visible and required

### Scenario 3: Vehicle Listing
**Goal:** Verify vehicle schema loaded

```
Title:       Toyota Corolla 2015
Description: White, good condition, regular maintenance
Location:    Herat, Downtown
Method:      Sell
```

**Expected Results:**
- Step 2: AI suggests "Cars → Toyota Corolla"
- Step 3: Shows vehicle-specific fields:
  - Year (number: default 2015)
  - Mileage (number)
  - Mileage Unit (select: km/miles)
  - Transmission (select: Manual/Automatic)
  - Fuel Type (select: Petrol/Diesel/Hybrid)
  - Condition (select)
  - Accident History (select: No/Minor/Major)
  - Color (select)
  - Interior Color (select)
  - Air Conditioning (checkbox)
  - Power Steering (checkbox)
  - Airbags (checkbox)
  - ABS (checkbox)

### Scenario 4: Real Estate
**Goal:** Verify real estate schema

```
Title:       2 Bedroom Apartment
Description: Furnished, near park, 200 sqm
Location:    Kabul, Shar-e Naw
Method:      Rent
```

**Expected Results:**
- Step 2: AI suggests "Real Estate → Apartment"
- Step 3: Shows real estate fields:
  - Property Type (select: Apartment, House, Villa, etc.)
  - Size (number: 200)
  - Size Unit (select: sqm/sqft)
  - Bedrooms (number)
  - Bathrooms (number)
  - Kitchens (number)
  - Condition (select)
  - Furnished (select: Unfurnished/Semi/Furnished)
  - Parking (checkbox)
  - Garden (checkbox)
  - Balcony (checkbox)
  - Elevator (checkbox)
  - Security (checkbox)

### Scenario 5: Unknown Category
**Goal:** Verify fallback for unsupported categories

```
Title:       Vintage Book Collection
Description: Rare Afghan books, good condition
Location:    [any]
Method:      Sell
```

**Expected Results:**
- Step 2: No AI suggestion (book category not in heuristics)
- Can manually browse categories
- Step 3: No seller-specific fields (schema is empty)
- Can still set price and publish

---

## Verification Checklist

### Step 1 Tests
- [ ] Photo upload shows preview grid
- [ ] Photo upload limit enforced (max 10)
- [ ] Title character counter works (max 100)
- [ ] Description character counter works (max 2000)
- [ ] Location modal opens on button click
- [ ] Location modal auto/manual toggle works
- [ ] Location defaults to "province_district" visibility
- [ ] Selling method buttons all clickable
- [ ] Continue button disabled until all fields filled
- [ ] Back button disabled on Step 1
- [ ] Progress bar shows 1/4 filled
- [ ] Draft saves to localStorage on every change

### Step 2 Tests
- [ ] AI tab visible if title has keywords (iPhone, Samsung, etc.)
- [ ] AI suggestion displays category path
- [ ] Accept AI suggestion button works
- [ ] Manual selection shows root categories
- [ ] Can navigate into categories
- [ ] Breadcrumb shows current path
- [ ] Back button goes up one level
- [ ] Can only continue when finalNode selected
- [ ] Continue button disabled for non-final nodes
- [ ] Progress bar shows 2/4
- [ ] Back button returns to Step 1 (preserves state)

### Step 3 Tests
- [ ] Correct schema loaded based on finalCategoryNodeId
- [ ] All required fields marked with *
- [ ] Field types render correctly:
  - [ ] text fields show input
  - [ ] number fields show input with unit
  - [ ] select fields show dropdown with i18n labels
  - [ ] checkbox fields show toggles
  - [ ] percentage fields show slider with %
- [ ] Price validation works:
  - [ ] Can't continue with price = 0
  - [ ] Can't continue with price < 0
  - [ ] Can't set minimum offer > asking price
- [ ] Currency selector works (AFN/USD)
- [ ] Negotiable checkbox works
- [ ] Progress bar shows 3/4
- [ ] Back button returns to Step 2 (preserves state)

### Step 4 Tests
- [ ] All entered data displayed in preview
- [ ] Main photo shown
- [ ] Title, price (green, large) shown
- [ ] Location, category path, method displayed
- [ ] Description shown
- [ ] Specs table shows all fields (with i18n labels)
- [ ] Seller details shown
- [ ] Empty/null fields hidden
- [ ] Back button returns to Step 3 (preserves state)
- [ ] Publish button shows "Publishing..." while active
- [ ] Alert shows on publish (DB not yet connected)
- [ ] localStorage draft cleared after publish
- [ ] Progress bar shows 4/4

### localStorage Tests
- [ ] localStorage key: `posting_draft_v4`
- [ ] Created when user first fills form
- [ ] Updated after every state change
- [ ] Contains all PostingState fields
- [ ] Cleared after successful publish
- [ ] Auto-loads on page reload
- [ ] Can go back and edit draft

### API Tests
- [ ] POST `/api/posting/suggest-category` accepts request
- [ ] Returns suggestion with category path + confidence
- [ ] Returns null for unknown categories
- [ ] Returns 400 for missing title/description
- [ ] Error handling works for failed requests

### i18n Tests
- [ ] All labels use translation keys
- [ ] Field labels translate correctly
- [ ] Option labels translate correctly
- [ ] Error messages show in correct language
- [ ] Navigation buttons translated
- [ ] Step descriptions translated

---

## Performance Checks

### Build
```bash
npm run build
```
**Expected:**
- ✓ Zero TypeScript errors
- ✓ Build time < 1 minute
- ✓ No warnings about unused code

### Bundle Size
```bash
npm run analyze  # if you have bundle analyzer
```
**Expected:**
- ✓ No excessive bundle size increase
- ✓ Schema imports not duplicated

### DevTools Performance
- Open DevTools → Performance tab
- Perform a Step transition
- Expected: < 100ms for state update
- Expected: No janky interactions

---

## Browser Compatibility

Test on:
- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

**Expected:** All interactions smooth, no console errors

---

## Error Scenarios (Edge Cases)

### Test: Rapid Clicking
- Click Continue multiple times quickly
- Expected: Step only advances once

### Test: Page Reload Mid-Form
1. Fill Step 1 data
2. Press F5 to reload
3. Expected: Draft restored, can continue from Step 1

### Test: Invalid Category ID
- Manually set finalCategoryNodeId to invalid ID in localStorage
- Load form
- Expected: No schema loaded, but can still fill price

### Test: Missing i18n Key
- If a label key doesn't exist in translations
- Expected: Falls back to key string itself (no error)

### Test: Large Form Submission
- Fill all fields with maximum length data
- Try to publish
- Expected: No errors, reasonable performance

---

## Sign-Off Checklist

- [ ] All 4 steps render correctly
- [ ] All 4 scenarios tested (iPhone, Samsung, Vehicle, Real Estate)
- [ ] localStorage persistence works
- [ ] AI suggestions functional
- [ ] Schema loading works for each category
- [ ] Price validation enforced
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] No broken links
- [ ] Mobile responsive (hamburger menu visible, layout adjusts)
- [ ] i18n labels showing
- [ ] Performance acceptable
- [ ] Ready for DB integration

---

## Known Limitations (Not Bugs)

1. **Publishing shows alert** - Server action not yet implemented
2. **No image cloud upload** - Uses data URLs in memory
3. **Category tree in-memory** - Not persisted to database
4. **AI suggestions heuristic** - Simple keyword matching, not ML-based
5. **No email verification** - Draft location not sent
6. **No conflict resolution** - If two tabs open same form, last write wins
7. **Seller detail schema hardcoded** - Not database-driven

---

## Next Steps After Sign-Off

1. **Implement createListingAction** - Server action to save to DB
2. **Image upload to cloud** - Supabase Storage or similar
3. **Category tree to database** - Query from supabase
4. **Schema from database** - Load dynamically
5. **Advanced AI** - Integrate Claude API for better suggestions
6. **Email notifications** - Send listing confirmation
7. **Mobile app** - React Native or Flutter if needed

---

**Test Date:** [Enter Date]
**Tester:** [Enter Name]
**Status:** ✅ Ready for Production / ❌ Issues Found
**Notes:** [Add any issues or observations]
