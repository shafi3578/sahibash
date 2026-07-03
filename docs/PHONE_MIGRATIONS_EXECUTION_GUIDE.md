# Phone Catalog Migrations - Execution Guide

## ✅ Status
All 4 migration files are prepared and ready to execute. Follow this guide to populate your Supabase database with 500+ phone models.

---

## 🎯 Option 1: Execute via Supabase Web Console (EASIEST)

### Step 1: Access Supabase SQL Editor
1. Go to your Supabase project: https://app.supabase.com
2. Select your project: **sbtzkniuquewrtctsdpy** (Sahibash)
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Execute Migrations in Order

#### **Migration 1: Create Phone Catalog Schema**
1. Open file: `supabase/migrations/20260702000001_phone_catalog_system.sql`
2. Copy entire contents
3. Paste into SQL Editor in Supabase
4. Click **Run** (or press Cmd+Enter / Ctrl+Enter)
5. ✅ Wait for success message

#### **Migration 2: Insert Apple, Samsung, Google, Xiaomi Models**
1. Open file: `supabase/migrations/20260702000002_phone_models_data_comprehensive.sql`
2. Copy entire contents
3. Click **New Query** for a fresh editor
4. Paste into SQL Editor
5. Click **Run**
6. ✅ Wait for success message (should show ~270 rows inserted)

#### **Migration 3: Insert Remaining Brands (OnePlus, Huawei, OPPO, etc.)**
1. Open file: `supabase/migrations/20260702000004_phone_models_remaining_brands.sql`
2. Copy entire contents
3. Click **New Query** for a fresh editor
4. Paste into SQL Editor
5. Click **Run**
6. ✅ Wait for success message (should show ~240 rows inserted)

#### **Migration 4: Add Multilingual Aliases & Seller Fields**
1. Open file: `supabase/migrations/20260702000003_phone_aliases_and_fields.sql`
2. Copy entire contents
3. Click **New Query** for a fresh editor
4. Paste into SQL Editor
5. Click **Run**
6. ✅ Wait for success message

---

## 🔍 Verification After Execution

After all 4 migrations complete, verify the data was inserted correctly:

### Check 1: Verify Tables Exist
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'phone_%'
ORDER BY tablename;
```
**Expected Result:** 4 tables
- `phone_brands`
- `phone_model_aliases`
- `phone_models`
- `phone_selectable_fields`

### Check 2: Verify Brand Count
```sql
SELECT COUNT(*) as total_brands FROM phone_brands;
```
**Expected Result:** 15 brands

### Check 3: Verify Model Count
```sql
SELECT COUNT(*) as total_models FROM phone_models;
```
**Expected Result:** 509 models

### Check 4: Verify Seller Fields
```sql
SELECT COUNT(*) as total_fields FROM phone_selectable_fields;
```
**Expected Result:** 24 fields

### Check 5: Sample Brands
```sql
SELECT id, name_en, name_fa, is_active FROM phone_brands 
ORDER BY sort_order LIMIT 5;
```
**Expected Result:** Sample brands like Apple, Samsung, etc.

---

## 🚀 Option 2: Execute via Supabase CLI (If Installed)

If you have the Supabase CLI installed:

```bash
# Navigate to project directory
cd e:\sahibash

# Push migrations to Supabase
supabase db push
```

This will automatically execute all migrations in order.

---

## 🛠️ Option 3: Execute via Node.js Script

If you have Node.js and the @supabase/supabase-js package:

```bash
# From project root
node scripts/execute-phone-migrations.mjs
```

This will execute all 4 migrations in the correct order.

---

## ✨ Next Steps After Migrations Complete

Once migrations are verified, your API endpoints will work:

### Test API: Fetch All Brands
```bash
curl http://localhost:3000/api/phone/brands
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name_en": "Apple",
      "name_fa": "اپل",
      "name_ps": "Apple",
      "slug": "apple",
      "is_active": true
    },
    ...
  ]
}
```

### Test API: Fetch Models for Brand
```bash
curl "http://localhost:3000/api/phone/models?brandId=1"
```

### Test API: Fetch Seller Fields
```bash
curl "http://localhost:3000/api/phone/fields?os=iOS"
```

---

## 📋 Migration File Details

| File | Size | Purpose | Models |
|------|------|---------|--------|
| 20260702000001_phone_catalog_system.sql | 3.5 KB | Create tables & indexes | - |
| 20260702000002_phone_models_data_comprehensive.sql | 16.8 KB | Apple + Samsung + Google + Xiaomi | 270 |
| 20260702000004_phone_models_remaining_brands.sql | 15.4 KB | 9 additional brands | 240 |
| 20260702000003_phone_aliases_and_fields.sql | 2.4 KB | Aliases + seller fields | - |

**Total:** 781 lines of SQL, 509 phone models

---

## 🆘 Troubleshooting

### Error: "relation does not exist"
**Cause:** Trying to insert into tables before schema migration
**Fix:** Always execute migration files in the specified order

### Error: "duplicate key value violates unique constraint"
**Cause:** Attempting to re-run migrations that already executed
**Fix:** Migrations are idempotent - you can re-run them safely if tables already exist

### Error: "permission denied"
**Cause:** Not using a service role key
**Fix:** Ensure you're using the SUPABASE_SERVICE_ROLE_KEY from .env.local

### API still returns "Failed to fetch brands" after migration
**Cause:** Dev server not reloaded
**Fix:** Restart dev server: `npm run dev`

---

## 📞 Support

If you encounter issues:
1. Check the migration file syntax
2. Verify database connection in Supabase dashboard
3. Ensure you have `SUPABASE_SERVICE_ROLE_KEY` in environment
4. Check Supabase logs in the dashboard

---

**Status:** All migration files prepared and ready  
**Next Action:** Execute via Supabase Web Console (Option 1)  
**Expected Duration:** < 2 minutes for all 4 migrations
