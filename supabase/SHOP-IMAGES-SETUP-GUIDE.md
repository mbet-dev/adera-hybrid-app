# Shop Images Setup Guide

## 🎯 Overview

This guide explains how to upload shop images to Supabase Storage and link them to partner shops in the database.

## 📊 Comparison: Storage Bucket vs Database

| Feature | Storage Bucket ✅ | Database ❌ |
|---------|------------------|-------------|
| **Performance** | Fast (CDN) | Slow (base64) |
| **Cost** | Cheaper | Expensive |
| **Scalability** | Excellent | Poor |
| **Image URLs** | Direct public URLs | Encoded strings |
| **Database Size** | Stays lean | Bloats quickly |
| **Caching** | Built-in CDN | Manual |
| **Transformations** | Supported | Not supported |

**Verdict**: Use Supabase Storage Bucket 🏆

## 🚀 Quick Start (Recommended Method)

### Step 1: Create Storage Bucket

1. Go to Supabase Dashboard → **Storage**
2. Click **"New bucket"**
3. Configure:
   - **Name**: `shop-logos`
   - **Public bucket**: ✅ Yes
   - **File size limit**: 5 MB
   - **Allowed MIME types**: `image/jpeg, image/png, image/webp`
4. Click **"Create bucket"**

### Step 2: Set Storage Policies

Run this in **SQL Editor**:

```sql
-- Allow public read access
CREATE POLICY "Public can view shop logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shop-logos');

-- Allow partners to upload (optional - for future)
CREATE POLICY "Partners can upload shop logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shop-logos' AND
  auth.uid() IN (SELECT id FROM users WHERE role = 'partner')
);
```

### Step 3: Upload Images (Choose One)

#### **Option A: Manual Upload (Simplest)** ⭐ Recommended for initial setup

1. Go to **Storage** → `shop-logos` bucket
2. Click **"Upload file"**
3. Navigate to `ReferenceResources/SamplePartnersShopsPics-X/`
4. Select all images (hub1.jpeg, hub2.jpg, s1.webp through s30.jpg)
5. Click **"Upload"**
6. Wait for upload to complete

#### **Option B: Automated Script Upload**

**Prerequisites:**
```bash
npm install @supabase/supabase-js
```

**Get your Service Role Key:**
1. Go to Supabase Dashboard → Settings → API
2. Copy the `service_role` key (keep it secret!)

**Run the upload script:**
```bash
# Set environment variable
export SUPABASE_SERVICE_ROLE_KEY="your_service_role_key_here"

# Or edit the script directly and add your key

# Run the script
node supabase/upload-shop-images.js
```

### Step 4: Update Database with Image URLs

After uploading images, run this SQL script:

```bash
# In Supabase SQL Editor
supabase/05-update-shop-image-urls.sql
```

This will update all 32 shops with their corresponding image URLs.

## 📁 File Structure

```
ReferenceResources/SamplePartnersShopsPics-X/
├── hub1.jpeg          → Adera Sorting Hub 1
├── hub2.jpg           → Adera Sorting Hub 2
├── s1.webp            → Bole Minimarket
├── s2.jpg             → Piazza General Store
├── s3.jpg             → Merkato Electronics Hub
├── s4.jpg             → CMC Pharmacy
├── s5.jpg             → Kazanchis Supermarket
├── s6.jpg             → Arat Kilo Books
├── s7.jpg             → Meskel Square Fashion
├── s8.jpg             → Lideta Grocery
├── s9.jpg             → Gerji Tech Shop
├── s10.jpg            → Bole Medhanialem Bakery
├── s11.jpg            → Addis Ketema Hardware
├── s12.jpg            → Yeka Electronics
├── s13.jpg            → Kirkos Furniture
├── s14.jpg            → Arada Clothing
├── s15.jpg            → Nifas Silk Market
├── s16.jpg            → Kolfe Store
├── s17.jpg            → Gulele Pharmacy
├── s18.jpg            → Akaki Shop
├── s19.jpg            → Lemi Kura Minimarket
├── s20.jpg            → Sarbet Store
├── s21.jpg            → Megenagna Electronics
├── s22.jpg            → Hayat Supermarket
├── s23.jpg            → Aware Grocery
├── s24.jpg            → Jemo Pharmacy
├── s25.jpg            → Kality Tech Hub
├── s26.jpg            → Saris Minimarket
├── s27.jpg            → Teklehaimanot Books
├── s28.jpg            → Shiro Meda Fashion
├── s29.jpg            → Gofa Grocery
└── s30.jpg            → Lebu Hardware
```

## 🔗 Image URL Format

After upload, images will be accessible at:

```
https://YOUR_PROJECT_REF.supabase.co/storage/v1/object/public/shop-logos/FILENAME
```

Example:
```
https://ehrmscvjuxnqpxcixnvq.supabase.co/storage/v1/object/public/shop-logos/s1.webp
```

## ✅ Verification

After completing all steps, verify:

```sql
-- Check if all shops have logo URLs
SELECT 
  name, 
  logo_url,
  CASE 
    WHEN logo_url IS NOT NULL THEN '✅'
    ELSE '❌'
  END as has_logo
FROM shops
ORDER BY is_hub DESC, name;

-- Count shops with logos
SELECT 
  COUNT(*) as total_shops,
  COUNT(logo_url) as shops_with_logos,
  COUNT(*) - COUNT(logo_url) as shops_without_logos
FROM shops;
```

Expected result: **32 shops with logos** (2 hubs + 30 partner shops)

## 🎨 Using Images in Your App

### React Native / Expo

```javascript
import { Image } from 'react-native';

// In your component
<Image 
  source={{ uri: shop.logo_url }}
  style={{ width: 100, height: 100, borderRadius: 8 }}
  resizeMode="cover"
/>
```

### With Image Transformations

Supabase Storage supports on-the-fly image transformations:

```javascript
// Resize to 200x200
const imageUrl = `${shop.logo_url}?width=200&height=200`;

// Add quality parameter
const optimizedUrl = `${shop.logo_url}?width=200&height=200&quality=80`;
```

## 🔒 Security Best Practices

### For Sample Data (Current Setup)
- ✅ Public bucket (anyone can view)
- ✅ Authenticated upload only
- ✅ Partners can upload their own logos

### For Production
```sql
-- Restrict uploads to verified partners only
CREATE POLICY "Verified partners can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shop-logos' AND
  auth.uid() IN (
    SELECT id FROM users 
    WHERE role = 'partner' AND is_verified = true
  )
);

-- Partners can only update their own shop logos
CREATE POLICY "Partners update own logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'shop-logos' AND
  (storage.foldername(name))[1] = (
    SELECT id::text FROM shops WHERE owner_id = auth.uid()
  )
);

-- Partners can only delete their own logos
CREATE POLICY "Partners delete own logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'shop-logos' AND
  (storage.foldername(name))[1] = (
    SELECT id::text FROM shops WHERE owner_id = auth.uid()
  )
);
```

## 🐛 Troubleshooting

### Issue: Images not displaying in app
**Solution:**
1. Check bucket is public
2. Verify URL is correct (copy-paste in browser)
3. Check CORS settings in Supabase
4. Ensure image file exists in bucket

### Issue: Upload fails with "Policy violation"
**Solution:**
1. Check storage policies are created
2. Verify user is authenticated
3. Ensure user has correct role (partner)
4. Use service role key for admin uploads

### Issue: Images too large / slow to load
**Solution:**
1. Compress images before upload (use tools like TinyPNG)
2. Use image transformations (`?width=200&height=200`)
3. Implement lazy loading in app
4. Consider using thumbnails for lists

## 📝 Alternative: Update Sample Data Script

If you want to pre-populate `logo_url` during data generation, modify `03-sample-data-population.sql`:

```sql
-- Instead of:
logo_url := 's' || counter || '.jpg';

-- Use full URL:
logo_url := 'https://ehrmscvjuxnqpxcixnvq.supabase.co/storage/v1/object/public/shop-logos/s' || counter || '.jpg';
```

**Note**: This assumes images are already uploaded to storage.

## 🎓 Summary

**Recommended Workflow:**

1. ✅ Create `shop-logos` bucket (public)
2. ✅ Set storage policies
3. ✅ Upload images manually or via script
4. ✅ Run SQL script to update database
5. ✅ Verify all shops have logo URLs
6. ✅ Test in your app

**Total Time**: ~10-15 minutes for manual upload, ~5 minutes for automated script

---

**Need Help?** Check the main README or Supabase documentation for more details.
