/**
 * ADERA HYBRID APP - SHOP LOCATION PICTURES UPLOADER
 * 
 * This script uploads shop location/storefront photos from ReferenceResources/SamplePartnersShopsPics-X/
 * to Supabase Storage (shop-loc-pics bucket) and updates the database.
 * 
 * Prerequisites:
 * 1. Create 'shop-loc-pics' bucket in Supabase Storage (public)
 * 2. Install dependencies: npm install @supabase/supabase-js
 * 3. Set environment variables or update the config below
 * 
 * Usage:
 * node supabase/upload-shop-location-pics.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ehrmscvjuxnqpxcixnvq.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY_HERE';

const IMAGES_DIR = path.join(__dirname, '..', 'ReferenceResources', 'SamplePartnersShopsPics-X');
const BUCKET_NAME = 'shop-loc-pics';

// ============================================
// INITIALIZE SUPABASE CLIENT
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================
// IMAGE MAPPING (with proper naming)
// ============================================

const imageMapping = {
  // Hubs - renamed for clarity
  'hub1.jpeg': { 
    newName: 'adera-hub-1-storefront.jpeg',
    shopName: 'Adera Sorting Hub 1', 
    isHub: true 
  },
  'hub2.jpg': { 
    newName: 'adera-hub-2-storefront.jpg',
    shopName: 'Adera Sorting Hub 2', 
    isHub: true 
  },
  
  // Partner shops - renamed with descriptive names
  's1.webp': { newName: 'bole-minimarket-storefront.webp', shopName: 'Bole Minimarket' },
  's2.jpg': { newName: 'piazza-general-store-storefront.jpg', shopName: 'Piazza General Store' },
  's3.jpg': { newName: 'merkato-electronics-hub-storefront.jpg', shopName: 'Merkato Electronics Hub' },
  's3.jpeg': { newName: 'merkato-electronics-hub-storefront.jpeg', shopName: 'Merkato Electronics Hub' },
  's4.jpg': { newName: 'cmc-pharmacy-storefront.jpg', shopName: 'CMC Pharmacy' },
  's5.jpg': { newName: 'kazanchis-supermarket-storefront.jpg', shopName: 'Kazanchis Supermarket' },
  's6.jpg': { newName: 'arat-kilo-books-storefront.jpg', shopName: 'Arat Kilo Books' },
  's6.webp': { newName: 'arat-kilo-books-storefront.webp', shopName: 'Arat Kilo Books' },
  's7.jpg': { newName: 'meskel-square-fashion-storefront.jpg', shopName: 'Meskel Square Fashion' },
  's8.jpg': { newName: 'lideta-grocery-storefront.jpg', shopName: 'Lideta Grocery' },
  's9.jpg': { newName: 'gerji-tech-shop-storefront.jpg', shopName: 'Gerji Tech Shop' },
  's10.jpg': { newName: 'bole-medhanialem-bakery-storefront.jpg', shopName: 'Bole Medhanialem Bakery' },
  's11.jpg': { newName: 'addis-ketema-hardware-storefront.jpg', shopName: 'Addis Ketema Hardware' },
  's11.webp': { newName: 'addis-ketema-hardware-storefront.webp', shopName: 'Addis Ketema Hardware' },
  's12.jpg': { newName: 'yeka-electronics-storefront.jpg', shopName: 'Yeka Electronics' },
  's13.jpg': { newName: 'kirkos-furniture-storefront.jpg', shopName: 'Kirkos Furniture' },
  's14.jpg': { newName: 'arada-clothing-storefront.jpg', shopName: 'Arada Clothing' },
  's14.webp': { newName: 'arada-clothing-storefront.webp', shopName: 'Arada Clothing' },
  's15.jpg': { newName: 'nifas-silk-market-storefront.jpg', shopName: 'Nifas Silk Market' },
  's15.jpeg': { newName: 'nifas-silk-market-storefront.jpeg', shopName: 'Nifas Silk Market' },
  's16.jpg': { newName: 'kolfe-store-storefront.jpg', shopName: 'Kolfe Store' },
  's16.jpeg': { newName: 'kolfe-store-storefront.jpeg', shopName: 'Kolfe Store' },
  's17.jpg': { newName: 'gulele-pharmacy-storefront.jpg', shopName: 'Gulele Pharmacy' },
  's18.jpg': { newName: 'akaki-shop-storefront.jpg', shopName: 'Akaki Shop' },
  's19.jpg': { newName: 'lemi-kura-minimarket-storefront.jpg', shopName: 'Lemi Kura Minimarket' },
  's20.jpg': { newName: 'sarbet-store-storefront.jpg', shopName: 'Sarbet Store' },
  's21.jpg': { newName: 'megenagna-electronics-storefront.jpg', shopName: 'Megenagna Electronics' },
  's22.jpg': { newName: 'hayat-supermarket-storefront.jpg', shopName: 'Hayat Supermarket' },
  's23.jpg': { newName: 'aware-grocery-storefront.jpg', shopName: 'Aware Grocery' },
  's24.jpg': { newName: 'jemo-pharmacy-storefront.jpg', shopName: 'Jemo Pharmacy' },
  's25.jpg': { newName: 'kality-tech-hub-storefront.jpg', shopName: 'Kality Tech Hub' },
  's25.jpeg': { newName: 'kality-tech-hub-storefront.jpeg', shopName: 'Kality Tech Hub' },
  's26.jpg': { newName: 'saris-minimarket-storefront.jpg', shopName: 'Saris Minimarket' },
  's27.jpg': { newName: 'teklehaimanot-books-storefront.jpg', shopName: 'Teklehaimanot Books' },
  's28.jpg': { newName: 'shiro-meda-fashion-storefront.jpg', shopName: 'Shiro Meda Fashion' },
  's28.webp': { newName: 'shiro-meda-fashion-storefront.webp', shopName: 'Shiro Meda Fashion' },
  'ss28.webp': { newName: 'shiro-meda-fashion-storefront.webp', shopName: 'Shiro Meda Fashion' },
  's29.jpg': { newName: 'gofa-grocery-storefront.jpg', shopName: 'Gofa Grocery' },
  's30.jpg': { newName: 'lebu-hardware-storefront.jpg', shopName: 'Lebu Hardware' },
};

// ============================================
// MAIN UPLOAD FUNCTION
// ============================================

async function uploadShopLocationPics() {
  console.log('================================================');
  console.log('🏪 ADERA SHOP LOCATION PICTURES UPLOADER');
  console.log('================================================');
  console.log(`📁 Images directory: ${IMAGES_DIR}`);
  console.log(`🪣 Bucket: ${BUCKET_NAME}`);
  console.log('================================================\n');

  // Check if images directory exists
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`❌ Error: Images directory not found: ${IMAGES_DIR}`);
    console.error('Please ensure the ReferenceResources/SamplePartnersShopsPics-X directory exists.');
    process.exit(1);
  }

  // Get all image files
  const files = fs.readdirSync(IMAGES_DIR);
  const imageFiles = files.filter(file => 
    /\.(jpg|jpeg|png|webp)$/i.test(file)
  );

  console.log(`📊 Found ${imageFiles.length} image files\n`);

  let uploadedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  // Upload each image with proper naming
  for (const fileName of imageFiles) {
    const mapping = imageMapping[fileName];
    
    if (!mapping) {
      console.log(`⚠️  Skipping ${fileName} (no mapping found)\n`);
      continue;
    }

    const filePath = path.join(IMAGES_DIR, fileName);
    const fileBuffer = fs.readFileSync(filePath);
    const newFileName = mapping.newName;
    const fileExt = path.extname(newFileName).slice(1);
    const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

    console.log(`📤 Uploading: ${fileName} → ${newFileName}...`);

    try {
      // Upload to Supabase Storage with new name
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(newFileName, fileBuffer, {
          contentType: contentType,
          upsert: true // Overwrite if exists
        });

      if (uploadError) {
        console.error(`   ❌ Upload failed: ${uploadError.message}`);
        errorCount++;
        continue;
      }

      console.log(`   ✅ Uploaded successfully`);
      uploadedCount++;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(newFileName);

      const publicUrl = urlData.publicUrl;
      console.log(`   🔗 URL: ${publicUrl}`);

      // Update database with location pic URL
      const { data: updateData, error: updateError } = await supabase
        .from('shops')
        .update({ shop_location_pic: publicUrl })
        .eq('name', mapping.shopName);

      if (updateError) {
        console.error(`   ⚠️  Database update failed: ${updateError.message}`);
      } else {
        console.log(`   ✅ Updated shop: ${mapping.shopName}`);
        updatedCount++;
      }

      console.log('');

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}`);
      errorCount++;
    }
  }

  // Summary
  console.log('================================================');
  console.log('📊 UPLOAD SUMMARY');
  console.log('================================================');
  console.log(`✅ Uploaded: ${uploadedCount} location pictures`);
  console.log(`✅ Updated: ${updatedCount} shop records`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('================================================');

  if (errorCount === 0) {
    console.log('🎉 All location pictures uploaded successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: supabase/06-generate-default-shop-logos.sql');
    console.log('2. This will create default initial-based logos');
    console.log('3. Partners can later upload custom logos');
  } else {
    console.log('⚠️  Some images failed to upload. Check errors above.');
  }
}

// ============================================
// RUN SCRIPT
// ============================================

uploadShopLocationPics()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
