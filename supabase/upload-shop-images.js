/**
 * ADERA HYBRID APP - SHOP IMAGE UPLOADER
 * 
 * This script uploads shop images from ReferenceResources/SamplePartnersShopsPics-X/
 * to Supabase Storage and updates the database with the correct URLs.
 * 
 * Prerequisites:
 * 1. Create 'shop-logos' bucket in Supabase Storage (public)
 * 2. Install dependencies: npm install @supabase/supabase-js
 * 3. Set environment variables or update the config below
 * 
 * Usage:
 * node supabase/upload-shop-images.js
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
const BUCKET_NAME = 'shop-logos';

// ============================================
// INITIALIZE SUPABASE CLIENT
// ============================================

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ============================================
// IMAGE MAPPING
// ============================================

// Map image files to shop names/IDs
const imageMapping = {
  // Hubs
  'hub1.jpeg': { shopName: 'Adera Sorting Hub 1', isHub: true },
  'hub2.jpg': { shopName: 'Adera Sorting Hub 2', isHub: true },
  
  // Partner shops (s1.jpg through s30.jpg)
  's1.webp': { shopName: 'Bole Minimarket' },
  's2.jpg': { shopName: 'Piazza General Store' },
  's3.jpg': { shopName: 'Merkato Electronics Hub' },
  's4.jpg': { shopName: 'CMC Pharmacy' },
  's5.jpg': { shopName: 'Kazanchis Supermarket' },
  's6.jpg': { shopName: 'Arat Kilo Books' },
  's7.jpg': { shopName: 'Meskel Square Fashion' },
  's8.jpg': { shopName: 'Lideta Grocery' },
  's9.jpg': { shopName: 'Gerji Tech Shop' },
  's10.jpg': { shopName: 'Bole Medhanialem Bakery' },
  's11.jpg': { shopName: 'Addis Ketema Hardware' },
  's12.jpg': { shopName: 'Yeka Electronics' },
  's13.jpg': { shopName: 'Kirkos Furniture' },
  's14.jpg': { shopName: 'Arada Clothing' },
  's15.jpg': { shopName: 'Nifas Silk Market' },
  's16.jpg': { shopName: 'Kolfe Store' },
  's17.jpg': { shopName: 'Gulele Pharmacy' },
  's18.jpg': { shopName: 'Akaki Shop' },
  's19.jpg': { shopName: 'Lemi Kura Minimarket' },
  's20.jpg': { shopName: 'Sarbet Store' },
  's21.jpg': { shopName: 'Megenagna Electronics' },
  's22.jpg': { shopName: 'Hayat Supermarket' },
  's23.jpg': { shopName: 'Aware Grocery' },
  's24.jpg': { shopName: 'Jemo Pharmacy' },
  's25.jpg': { shopName: 'Kality Tech Hub' },
  's26.jpg': { shopName: 'Saris Minimarket' },
  's27.jpg': { shopName: 'Teklehaimanot Books' },
  's28.jpg': { shopName: 'Shiro Meda Fashion' },
  's29.jpg': { shopName: 'Gofa Grocery' },
  's30.jpg': { shopName: 'Lebu Hardware' },
};

// ============================================
// MAIN UPLOAD FUNCTION
// ============================================

async function uploadShopImages() {
  console.log('================================================');
  console.log('🖼️  ADERA SHOP IMAGE UPLOADER');
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

  // Upload each image
  for (const fileName of imageFiles) {
    const filePath = path.join(IMAGES_DIR, fileName);
    const fileBuffer = fs.readFileSync(filePath);
    const fileExt = path.extname(fileName).slice(1);
    const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

    console.log(`📤 Uploading: ${fileName}...`);

    try {
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(fileName, fileBuffer, {
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
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;
      console.log(`   🔗 URL: ${publicUrl}`);

      // Update database with logo URL
      const mapping = imageMapping[fileName];
      if (mapping) {
        const { data: updateData, error: updateError } = await supabase
          .from('shops')
          .update({ logo_url: publicUrl })
          .eq('name', mapping.shopName);

        if (updateError) {
          console.error(`   ⚠️  Database update failed: ${updateError.message}`);
        } else {
          console.log(`   ✅ Updated shop: ${mapping.shopName}`);
          updatedCount++;
        }
      } else {
        console.log(`   ⚠️  No mapping found for ${fileName}`);
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
  console.log(`✅ Uploaded: ${uploadedCount} images`);
  console.log(`✅ Updated: ${updatedCount} shop records`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('================================================');

  if (errorCount === 0) {
    console.log('🎉 All images uploaded successfully!');
  } else {
    console.log('⚠️  Some images failed to upload. Check errors above.');
  }
}

// ============================================
// RUN SCRIPT
// ============================================

uploadShopImages()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
