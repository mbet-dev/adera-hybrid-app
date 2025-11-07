# Dual Image System Guide - Shop Location Pics & Logos

## 🎯 Overview

Adera uses a **dual-image system** for partner shops:

1. **`shop_location_pic`** - Storefront/location photos (uploaded by you initially)
2. **`logo_url`** - Brand logos (default initials OR custom partner uploads)

This gives partners both a realistic storefront view AND professional branding.

## 📊 System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    SHOPS TABLE                          │
├─────────────────────────────────────────────────────────┤
│  shop_location_pic  │  Storefront photo                 │
│  (shop-loc-pics)    │  • Uploaded by admin initially    │
│                     │  • Shows actual location          │
│                     │  • Helps customers find shop      │
├─────────────────────┼───────────────────────────────────┤
│  logo_url           │  Brand logo                       │
│  (shop-logos)       │  • Default: Initials + Color      │
│                     │  • Partners can upload custom     │
│                     │  • Used in app UI/branding        │
└─────────────────────┴───────────────────────────────────┘
```

## 🗂️ Storage Buckets

### Bucket 1: `shop-loc-pics` (Location Photos)
- **Purpose**: Storefront/location photos
- **Uploaded by**: Admin (you) initially
- **Public**: Yes
- **File naming**: `{shop-name}-storefront.{ext}`
- **Examples**: 
  - `bole-minimarket-storefront.webp`
  - `adera-hub-1-storefront.jpeg`

### Bucket 2: `shop-logos` (Brand Logos)
- **Purpose**: Partner brand logos
- **Default**: Auto-generated initials with colors
- **Custom**: Partners can upload their own
- **Public**: Yes
- **File naming**: `{shop-id}-logo.{ext}` or `logo-placeholder://INITIALS/COLOR`

## 🚀 Complete Setup Process

### Step 1: Run Schema Alterations

```sql
-- Run in Supabase SQL Editor
-- This adds shop_location_pic column
supabase/01-schema-alterations.sql
```

### Step 2: Create Storage Buckets

**Create Bucket 1: shop-loc-pics**
1. Supabase Dashboard → Storage → New bucket
2. Name: `shop-loc-pics`
3. Public: ✅ Yes
4. File size limit: 5MB
5. Allowed MIME types: `image/jpeg, image/png, image/webp`

**Create Bucket 2: shop-logos**
1. Supabase Dashboard → Storage → New bucket
2. Name: `shop-logos`
3. Public: ✅ Yes
4. File size limit: 2MB
5. Allowed MIME types: `image/jpeg, image/png, image/svg+xml`

### Step 3: Set Storage Policies

```sql
-- Run in SQL Editor

-- ============================================
-- SHOP LOCATION PICS POLICIES
-- ============================================

-- Public can view location pics
CREATE POLICY "Public can view shop location pics"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shop-loc-pics');

-- Only admins can upload location pics (initially)
CREATE POLICY "Admins can upload location pics"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shop-loc-pics' AND
  auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
);

-- ============================================
-- SHOP LOGOS POLICIES
-- ============================================

-- Public can view logos
CREATE POLICY "Public can view shop logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shop-logos');

-- Partners can upload their own logos
CREATE POLICY "Partners can upload logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shop-logos' AND
  auth.uid() IN (SELECT id FROM users WHERE role = 'partner')
);

-- Partners can update their own logos
CREATE POLICY "Partners can update logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'shop-logos' AND
  auth.uid() IN (SELECT owner_id FROM shops)
);
```

### Step 4: Upload Location Pictures

**Option A: Manual Upload** ⭐ Recommended

1. Go to Storage → `shop-loc-pics`
2. Upload all 32 images from `ReferenceResources/SamplePartnersShopsPics-X/`
3. **Rename during upload** using this pattern:
   - `hub1.jpeg` → `adera-hub-1-storefront.jpeg`
   - `hub2.jpg` → `adera-hub-2-storefront.jpg`
   - `s1.webp` → `bole-minimarket-storefront.webp`
   - `s2.jpg` → `piazza-general-store-storefront.jpg`
   - ... (see full mapping below)

**Option B: Automated Script**

```bash
# Install dependencies
npm install @supabase/supabase-js

# Set your service role key
export SUPABASE_SERVICE_ROLE_KEY="your_key_here"

# Run script (automatically renames files)
node supabase/upload-shop-location-pics.js
```

### Step 5: Update Database with Location Pic URLs

```sql
-- Run in SQL Editor
supabase/07-update-shop-location-pics.sql
```

### Step 6: Generate Default Logos

```sql
-- Run in SQL Editor
-- This creates appealing initial-based logos for all shops
supabase/06-generate-default-shop-logos.sql
```

## 📋 Complete File Naming Reference

### Hubs
| Original | New Name | Shop Name |
|----------|----------|-----------|
| `hub1.jpeg` | `adera-hub-1-storefront.jpeg` | Adera Sorting Hub 1 |
| `hub2.jpg` | `adera-hub-2-storefront.jpg` | Adera Sorting Hub 2 |

### Partner Shops
| Original | New Name | Shop Name |
|----------|----------|-----------|
| `s1.webp` | `bole-minimarket-storefront.webp` | Bole Minimarket |
| `s2.jpg` | `piazza-general-store-storefront.jpg` | Piazza General Store |
| `s3.jpg` | `merkato-electronics-hub-storefront.jpg` | Merkato Electronics Hub |
| `s4.jpg` | `cmc-pharmacy-storefront.jpg` | CMC Pharmacy |
| `s5.jpg` | `kazanchis-supermarket-storefront.jpg` | Kazanchis Supermarket |
| `s6.jpg` | `arat-kilo-books-storefront.jpg` | Arat Kilo Books |
| `s7.jpg` | `meskel-square-fashion-storefront.jpg` | Meskel Square Fashion |
| `s8.jpg` | `lideta-grocery-storefront.jpg` | Lideta Grocery |
| `s9.jpg` | `gerji-tech-shop-storefront.jpg` | Gerji Tech Shop |
| `s10.jpg` | `bole-medhanialem-bakery-storefront.jpg` | Bole Medhanialem Bakery |
| `s11.jpg` | `addis-ketema-hardware-storefront.jpg` | Addis Ketema Hardware |
| `s12.jpg` | `yeka-electronics-storefront.jpg` | Yeka Electronics |
| `s13.jpg` | `kirkos-furniture-storefront.jpg` | Kirkos Furniture |
| `s14.jpg` | `arada-clothing-storefront.jpg` | Arada Clothing |
| `s15.jpg` | `nifas-silk-market-storefront.jpg` | Nifas Silk Market |
| `s16.jpg` | `kolfe-store-storefront.jpg` | Kolfe Store |
| `s17.jpg` | `gulele-pharmacy-storefront.jpg` | Gulele Pharmacy |
| `s18.jpg` | `akaki-shop-storefront.jpg` | Akaki Shop |
| `s19.jpg` | `lemi-kura-minimarket-storefront.jpg` | Lemi Kura Minimarket |
| `s20.jpg` | `sarbet-store-storefront.jpg` | Sarbet Store |
| `s21.jpg` | `megenagna-electronics-storefront.jpg` | Megenagna Electronics |
| `s22.jpg` | `hayat-supermarket-storefront.jpg` | Hayat Supermarket |
| `s23.jpg` | `aware-grocery-storefront.jpg` | Aware Grocery |
| `s24.jpg` | `jemo-pharmacy-storefront.jpg` | Jemo Pharmacy |
| `s25.jpg` | `kality-tech-hub-storefront.jpg` | Kality Tech Hub |
| `s26.jpg` | `saris-minimarket-storefront.jpg` | Saris Minimarket |
| `s27.jpg` | `teklehaimanot-books-storefront.jpg` | Teklehaimanot Books |
| `s28.jpg` | `shiro-meda-fashion-storefront.jpg` | Shiro Meda Fashion |
| `s29.jpg` | `gofa-grocery-storefront.jpg` | Gofa Grocery |
| `s30.jpg` | `lebu-hardware-storefront.jpg` | Lebu Hardware |

## 🎨 Default Logo System

### How It Works

When you run `06-generate-default-shop-logos.sql`, it creates placeholder logos using:

1. **Initials**: First letter of each word (max 3)
   - "Bole Minimarket" → "BM"
   - "Adera Sorting Hub 1" → "ASH"
   - "CMC Pharmacy" → "CP"

2. **Colors**: Rotating through 15 appealing colors
   - `#FF6B6B`, `#4ECDC4`, `#45B7D1`, etc.

3. **Format**: `logo-placeholder://INITIALS/COLOR`
   - Example: `logo-placeholder://BM/#FF6B6B`

### Rendering in App

Your app should detect the `logo-placeholder://` prefix and render it as a colored circle with initials:

```javascript
// React Native example
const ShopLogo = ({ shop }) => {
  if (shop.logo_url?.startsWith('logo-placeholder://')) {
    const [, data] = shop.logo_url.split('://');
    const [initials, color] = data.split('/');
    
    return (
      <View style={{
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: color,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 18 }}>
          {initials}
        </Text>
      </View>
    );
  }
  
  // Custom logo
  return <Image source={{ uri: shop.logo_url }} style={{ width: 50, height: 50 }} />;
};
```

## 🔄 Partner Logo Upload Flow

### In Your App

```javascript
// When partner wants to upload custom logo
const uploadCustomLogo = async (shopId, imageFile) => {
  const fileName = `${shopId}-logo.${imageFile.extension}`;
  
  const { data, error } = await supabase.storage
    .from('shop-logos')
    .upload(fileName, imageFile, { upsert: true });
  
  if (!error) {
    const { data: urlData } = supabase.storage
      .from('shop-logos')
      .getPublicUrl(fileName);
    
    // Update shop record
    await supabase
      .from('shops')
      .update({ logo_url: urlData.publicUrl })
      .eq('id', shopId);
  }
};
```

## ✅ Verification

```sql
-- Check both images are set
SELECT 
  name,
  CASE 
    WHEN shop_location_pic IS NOT NULL THEN '✅ Has location pic'
    ELSE '❌ Missing location pic'
  END as location_status,
  CASE 
    WHEN logo_url LIKE 'logo-placeholder://%' THEN '🎨 Default logo (initials)'
    WHEN logo_url LIKE 'https://%' THEN '✅ Custom logo'
    ELSE '❌ No logo'
  END as logo_status
FROM shops
ORDER BY is_hub DESC, name;

-- Count by status
SELECT 
  COUNT(*) FILTER (WHERE shop_location_pic IS NOT NULL) as with_location_pic,
  COUNT(*) FILTER (WHERE logo_url IS NOT NULL) as with_logo,
  COUNT(*) as total_shops
FROM shops;
```

Expected: **32 shops with location pics AND 32 shops with logos**

## 📱 App UI Examples

### Shop Card (List View)
```
┌─────────────────────────────────┐
│ [Logo]  Bole Minimarket         │
│  BM     ⭐⭐⭐⭐⭐ (4.8)          │
│         Grocery • 2.3 km away   │
└─────────────────────────────────┘
```

### Shop Detail View
```
┌─────────────────────────────────┐
│  [Large Location Photo]         │
│  Shows actual storefront        │
├─────────────────────────────────┤
│  [Logo] Bole Minimarket         │
│   BM    ⭐⭐⭐⭐⭐ (4.8)          │
│         Open: 8:00 AM - 8:00 PM │
│         📍 Bole, Addis Ababa    │
└─────────────────────────────────┘
```

## 🎓 Summary

**Execution Order:**

1. ✅ Run `01-schema-alterations.sql` (adds columns)
2. ✅ Create `shop-loc-pics` bucket
3. ✅ Create `shop-logos` bucket
4. ✅ Set storage policies
5. ✅ Upload location pictures (manual or script)
6. ✅ Run `07-update-shop-location-pics.sql`
7. ✅ Run `06-generate-default-shop-logos.sql`
8. ✅ Verify both images are set

**Total Time**: ~20 minutes

**Result**: 
- 32 shops with storefront photos
- 32 shops with default initial-based logos
- Partners can upload custom logos anytime

---

**Questions?** Check the main README or Supabase docs!
