# Updated Execution Order - With Dual Image System

## 📋 Complete Setup Sequence

Execute these in **EXACT ORDER**:

### Phase 1: Database Setup
```
1. ✅ 01-schema-alterations.sql          (Adds shop_location_pic column)
2. 🗑️ 02-complete-data-erasure.sql       (Optional - fresh start only)
3. 👥 03-sample-data-population.sql      (Creates users & shops)
4. 📦 04-sample-parcels-transactions.sql (Creates parcels & payments)
```

### Phase 2: Image System Setup

#### Step 1: Create Storage Buckets (Supabase Dashboard)

**Bucket 1: `shop-loc-pics`**
- Name: `shop-loc-pics`
- Public: ✅ Yes
- File size: 5MB
- MIME types: `image/jpeg, image/png, image/webp`

**Bucket 2: `shop-logos`**
- Name: `shop-logos`
- Public: ✅ Yes
- File size: 2MB
- MIME types: `image/jpeg, image/png, image/svg+xml`

#### Step 2: Set Storage Policies (SQL Editor)

```sql
-- Shop Location Pics
CREATE POLICY "Public can view shop location pics"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'shop-loc-pics');

CREATE POLICY "Admins can upload location pics"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'shop-loc-pics' AND
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- Shop Logos
CREATE POLICY "Public can view shop logos"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'shop-logos');

CREATE POLICY "Partners can upload logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'shop-logos' AND
  auth.uid() IN (SELECT id FROM users WHERE role = 'partner')
);

CREATE POLICY "Partners can update logos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'shop-logos' AND
  auth.uid() IN (SELECT owner_id FROM shops)
);
```

#### Step 3: Upload Location Pictures

**Option A: Manual Upload** ⭐ Recommended
1. Go to Storage → `shop-loc-pics`
2. Upload images with proper names:
   - `hub1.jpeg` → `adera-hub-1-storefront.jpeg`
   - `hub2.jpg` → `adera-hub-2-storefront.jpg`
   - `s1.webp` → `bole-minimarket-storefront.webp`
   - `s2.jpg` → `piazza-general-store-storefront.jpg`
   - ... (see DUAL-IMAGE-SYSTEM-GUIDE.md for full list)

**Option B: Automated Script**
```bash
npm install @supabase/supabase-js
export SUPABASE_SERVICE_ROLE_KEY="your_key"
node supabase/upload-shop-location-pics.js
```

#### Step 4: Update Database with Image URLs

```
5. 🏪 07-update-shop-location-pics.sql   (Links location pics to shops)
6. 🎨 06-generate-default-shop-logos.sql (Creates initial-based logos)
```

## ⏱️ Estimated Time

| Phase | Time |
|-------|------|
| Database Setup (Steps 1-4) | ~5 minutes |
| Create Buckets | ~2 minutes |
| Set Policies | ~1 minute |
| Upload Images (Manual) | ~10 minutes |
| Upload Images (Script) | ~3 minutes |
| Update Database (Steps 5-6) | ~2 minutes |
| **Total (Manual)** | **~20 minutes** |
| **Total (Script)** | **~13 minutes** |

## 📊 What You Get

After completing all steps:

```
shops table:
├── shop_location_pic  → Storefront photo (from your upload)
└── logo_url           → Brand logo (auto-generated initials)
```

**32 shops with:**
- ✅ Realistic storefront photos
- ✅ Appealing initial-based logos (e.g., "BM" for Bole Minimarket)
- ✅ Partners can upload custom logos later

## 🎨 Default Logo Examples

| Shop Name | Initials | Color | Logo URL |
|-----------|----------|-------|----------|
| Bole Minimarket | BM | #FF6B6B | `logo-placeholder://BM/#FF6B6B` |
| Adera Sorting Hub 1 | ASH | #4ECDC4 | `logo-placeholder://ASH/#4ECDC4` |
| CMC Pharmacy | CP | #45B7D1 | `logo-placeholder://CP/#45B7D1` |

Your app renders these as colored circles with white initials.

## ✅ Verification Checklist

After each phase:

### Phase 1 Verification
```sql
-- Check data population
SELECT role, COUNT(*) FROM users GROUP BY role;
-- Expected: customer=14, driver=4, partner=32, staff=6

SELECT COUNT(*) FROM shops;
-- Expected: 32

SELECT COUNT(*) FROM parcels;
-- Expected: ~100-150
```

### Phase 2 Verification
```sql
-- Check images are linked
SELECT 
  name,
  CASE WHEN shop_location_pic IS NOT NULL THEN '✅' ELSE '❌' END as location,
  CASE WHEN logo_url IS NOT NULL THEN '✅' ELSE '❌' END as logo
FROM shops
ORDER BY is_hub DESC, name;

-- Expected: All 32 shops with ✅✅
```

## 🐛 Common Issues

### Issue: "Column shop_location_pic does not exist"
**Solution**: Run `01-schema-alterations.sql` again

### Issue: "Bucket shop-loc-pics does not exist"
**Solution**: Create the bucket in Supabase Dashboard → Storage

### Issue: "Policy violation when uploading"
**Solution**: Check storage policies are created correctly

### Issue: Images not displaying in app
**Solution**: 
1. Verify bucket is public
2. Check URL format in database
3. Test URL in browser

## 📝 Files Reference

| File | Purpose |
|------|---------|
| `01-schema-alterations.sql` | Adds shop_location_pic column |
| `02-complete-data-erasure.sql` | Erases all data (optional) |
| `03-sample-data-population.sql` | Creates users & shops |
| `04-sample-parcels-transactions.sql` | Creates parcels |
| `06-generate-default-shop-logos.sql` | Creates initial-based logos |
| `07-update-shop-location-pics.sql` | Links location pics |
| `upload-shop-location-pics.js` | Automated upload script |
| `DUAL-IMAGE-SYSTEM-GUIDE.md` | Complete documentation |

## 🎯 Quick Start Commands

```bash
# 1. Run database scripts in Supabase SQL Editor
01-schema-alterations.sql
02-complete-data-erasure.sql (optional)
03-sample-data-population.sql
04-sample-parcels-transactions.sql

# 2. Create buckets in Supabase Dashboard
# 3. Set storage policies (see above)

# 4. Upload images (choose one)
# Manual: Upload via Dashboard
# OR
# Script: node supabase/upload-shop-location-pics.js

# 5. Update database
07-update-shop-location-pics.sql
06-generate-default-shop-logos.sql

# 6. Verify
# Check shops table in Supabase Dashboard
```

## 🚀 Ready to Start?

1. ✅ Run Phase 1 scripts (database setup)
2. ✅ Create storage buckets
3. ✅ Upload location pictures
4. ✅ Run Phase 2 scripts (image linking)
5. ✅ Test in your app!

---

**Total Time**: ~20 minutes for complete setup
**Result**: Fully populated database with dual-image system ready for testing! 🎉
