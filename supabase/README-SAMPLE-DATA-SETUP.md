# Adera Hybrid App - Sample Data Setup Guide

## 📋 Overview

This guide will help you set up a complete testing environment for the Adera Hybrid App with realistic Ethiopian context-based sample data.

## 🗂️ Files Overview

1. **`01-schema-alterations.sql`** - Ensures all required columns exist
2. **`02-complete-data-erasure.sql`** - Cleans all data for fresh start
3. **`03-sample-data-population.sql`** - Creates users, shops, and products
4. **`04-sample-parcels-transactions.sql`** - Creates parcels and transactions

## 🚀 Quick Start

### Step 1: Run Schema Alterations

```sql
-- Run in Supabase SQL Editor
-- This ensures all columns exist
\i 01-schema-alterations.sql
```

### Step 2: Erase Existing Data (Optional)

⚠️ **WARNING**: This will delete ALL data including auth users!

```sql
-- Run in Supabase SQL Editor
\i 02-complete-data-erasure.sql
```

### Step 3: Populate Sample Data

```sql
-- Run in Supabase SQL Editor
\i 03-sample-data-population.sql
\i 04-sample-parcels-transactions.sql
```

## 👥 Sample Users Created

### All users have password: `MBet4321`

### Customers (14 users)
Heavy users (8-12 transactions each):
- `abebe.kebede@gmail.com` - Abebe Kebede
- `tigist.alemu@gmail.com` - Tigist Alemu
- `dawit.haile@gmail.com` - Dawit Haile
- `meron.tadesse@gmail.com` - Meron Tadesse
- `yohannes.bekele@gmail.com` - Yohannes Bekele

Medium users (4-7 transactions each):
- `selamawit.girma@gmail.com` - Selamawit Girma
- `mulugeta.tesfaye@gmail.com` - Mulugeta Tesfaye
- `hanna.wolde@gmail.com` - Hanna Wolde
- `getachew.assefa@gmail.com` - Getachew Assefa
- `bethlehem.mekonnen@gmail.com` - Bethlehem Mekonnen

Light users (1-3 transactions):
- `alemayehu.desta@gmail.com` - Alemayehu Desta
- `rahel.yosef@gmail.com` - Rahel Yosef
- `tesfaye.negash@gmail.com` - Tesfaye Negash

New user (0 transactions):
- `sara.amare@gmail.com` - Sara Amare

### Drivers (4 users)
- `mulatu.gebru@adera.et` - Mulatu Gebru
- `berhanu.lemma@adera.et` - Berhanu Lemma
- `yared.mengistu@adera.et` - Yared Mengistu
- `kidus.teshome@adera.et` - Kidus Teshome

### Partners (32 users)
- `partner1@shop.et` through `partner32@shop.et`
- First 2 are Adera Sorting Hubs (not visible to users)
- Remaining 30 are partner shops across Addis Ababa

### Staff (6 users)
Hub 1 Staff:
- `staff.hub1.1@adera.et`
- `staff.hub1.2@adera.et`
- `staff.hub1.3@adera.et`

Hub 2 Staff:
- `staff.hub2.1@adera.et`
- `staff.hub2.2@adera.et`
- `staff.hub2.3@adera.et`

## 🏪 Sample Shops Created

### 2 Sorting Hubs (Internal Use Only)
- Adera Sorting Hub 1
- Adera Sorting Hub 2

### 30 Partner Shops
Distributed across Addis Ababa neighborhoods:
- Bole Minimarket
- Piazza General Store
- Merkato Electronics Hub
- CMC Pharmacy
- Kazanchis Supermarket
- Arat Kilo Books
- Meskel Square Fashion
- Lideta Grocery
- Gerji Tech Shop
- Bole Medhanialem Bakery
- ... and 20 more

## 📦 Sample Data Statistics

- **Users**: 56 total (14 customers + 4 drivers + 32 partners + 6 staff)
- **Shops**: 32 total (2 hubs + 30 shops)
- **Products**: 5-15 per shop (~300-450 total)
- **Parcels**: ~100-150 with various statuses
- **Payments**: One per parcel
- **Notifications**: Welcome messages for all users

## 🖼️ Storage Bucket Setup

### Step 1: Create Storage Buckets

Go to Supabase Dashboard > Storage > Create Bucket

Create the following buckets:

1. **`shop-logos`** - For partner shop logos
   - Public: Yes
   - File size limit: 5MB
   - Allowed MIME types: image/jpeg, image/png, image/webp

2. **`product-images`** - For product photos
   - Public: Yes
   - File size limit: 5MB
   - Allowed MIME types: image/jpeg, image/png, image/webp

3. **`parcel-photos`** - For parcel condition photos
   - Public: No (requires authentication)
   - File size limit: 10MB
   - Allowed MIME types: image/jpeg, image/png

4. **`user-avatars`** - For user profile pictures
   - Public: Yes
   - File size limit: 2MB
   - Allowed MIME types: image/jpeg, image/png

### Step 2: Set Storage Policies

Run these SQL commands in Supabase SQL Editor:

```sql
-- Shop logos: Partners can upload, everyone can view
CREATE POLICY "Partners can upload shop logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'shop-logos' AND
  auth.uid() IN (SELECT id FROM users WHERE role = 'partner')
);

CREATE POLICY "Anyone can view shop logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'shop-logos');

-- Product images: Shop owners can upload, everyone can view
CREATE POLICY "Shop owners can upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  auth.uid() IN (SELECT owner_id FROM shops)
);

CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'product-images');

-- Parcel photos: Authenticated users can upload and view their own
CREATE POLICY "Users can upload parcel photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'parcel-photos');

CREATE POLICY "Users can view parcel photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'parcel-photos');

-- User avatars: Users can upload their own, everyone can view
CREATE POLICY "Users can upload their avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-avatars');
```

### Step 3: Upload Sample Shop Images

The sample shop images are located in:
```
ReferenceResources/SamplePartnersShopsPics-X/
```

**Upload Mapping:**
- `hub1.jpeg` → Upload to `shop-logos/hub1.jpeg`
- `hub2.jpg` → Upload to `shop-logos/hub2.jpg`
- `s1.webp` through `s30.jpg` → Upload to `shop-logos/s1.jpg` through `shop-logos/s30.jpg`

**Upload Methods:**

#### Option 1: Supabase Dashboard (Manual)
1. Go to Storage > shop-logos
2. Click "Upload file"
3. Select images from `ReferenceResources/SamplePartnersShopsPics-X/`
4. Upload one by one

#### Option 2: Supabase CLI (Batch Upload)
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Upload files
cd ReferenceResources/SamplePartnersShopsPics-X
for file in *.{jpg,jpeg,webp,png}; do
  supabase storage upload shop-logos "$file" --project-ref your-project-ref
done
```

#### Option 3: JavaScript Upload Script
Create a file `upload-shop-images.js`:

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_SERVICE_ROLE_KEY'
);

const uploadImages = async () => {
  const imagesDir = './ReferenceResources/SamplePartnersShopsPics-X';
  const files = fs.readdirSync(imagesDir);

  for (const file of files) {
    const filePath = path.join(imagesDir, file);
    const fileBuffer = fs.readFileSync(filePath);

    const { data, error } = await supabase.storage
      .from('shop-logos')
      .upload(file, fileBuffer, {
        contentType: `image/${path.extname(file).slice(1)}`,
        upsert: true
      });

    if (error) {
      console.error(`Error uploading ${file}:`, error);
    } else {
      console.log(`✅ Uploaded ${file}`);
    }
  }
};

uploadImages();
```

Run with:
```bash
node upload-shop-images.js
```

## 🔍 Verification

After running all scripts, verify the data:

```sql
-- Check user counts
SELECT role, COUNT(*) FROM users GROUP BY role;

-- Check shop counts
SELECT is_hub, COUNT(*) FROM shops GROUP BY is_hub;

-- Check parcel statuses
SELECT status, COUNT(*) FROM parcels GROUP BY status ORDER BY status;

-- Check payment methods
SELECT payment_method, COUNT(*) FROM payments GROUP BY payment_method;

-- Check products per shop
SELECT s.name, COUNT(p.id) as product_count
FROM shops s
LEFT JOIN products p ON s.id = p.shop_id
WHERE s.is_hub = false
GROUP BY s.name
ORDER BY product_count DESC
LIMIT 10;
```

## 🧪 Testing Scenarios

### Test Customer Flows
1. Login as `abebe.kebede@gmail.com` (heavy user)
   - View parcel history (should see 8-12 parcels)
   - Check wallet balance (should have random amount)
   - Track active parcels

2. Login as `sara.amare@gmail.com` (new user)
   - Create first parcel
   - Test payment flow
   - Verify notifications

### Test Driver Flows
1. Login as `mulatu.gebru@adera.et`
   - View assigned parcels
   - Scan QR codes
   - Update parcel status

### Test Partner Flows
1. Login as `partner3@shop.et` (Merkato Electronics Hub)
   - View shop dashboard
   - Manage products
   - Scan incoming/outgoing parcels
   - Check earnings

### Test Staff Flows
1. Login as `staff.hub1.1@adera.et`
   - View hub dashboard
   - Sort incoming parcels
   - Assign drivers
   - Track hub capacity

## 🐛 Troubleshooting

### Issue: Users not appearing in auth.users
**Solution**: The scripts create users in `public.users` table. You need to either:
1. Manually create auth users through Supabase Dashboard
2. Use Supabase Admin API to create users programmatically
3. Have users sign up through the app

### Issue: Shop logos not displaying
**Solution**: 
1. Verify storage bucket is public
2. Check RLS policies are set correctly
3. Ensure images are uploaded to correct bucket
4. Verify image URLs in database match uploaded files

### Issue: Parcels not showing correct status
**Solution**: 
1. Check `parcel_events` table for status history
2. Verify triggers are enabled
3. Run schema alterations script again

### Issue: Payment methods not working
**Solution**: 
1. Verify payment gateway configurations
2. Check wallet balances are populated
3. Ensure payment enum types match

## 📝 Notes

- All coordinates are within Addis Ababa bounds (lat: 8.9-9.1, lon: 38.7-38.9)
- Parcel statuses are distributed realistically based on creation date
- Wallet balances are randomized for customers (0-1000 ETB)
- All shops have realistic operating hours (08:00-20:00 weekdays, 10:00-18:00 Sunday)
- Hubs operate 24/7 for logistics operations
- Payment methods are randomly distributed across parcels
- All users are pre-verified for testing purposes

## 🔐 Security Reminder

⚠️ **Important**: 
- Change all passwords after testing
- Never use these credentials in production
- Rotate Supabase service role keys regularly
- Enable email confirmation in production
- Set up proper RLS policies for production data

## 📞 Support

For issues or questions:
1. Check the main project documentation
2. Review Supabase logs in Dashboard
3. Verify all scripts ran without errors
4. Check the `.adera/memory/` folder for additional context

---

**Happy Testing! 🚀🇪🇹**
