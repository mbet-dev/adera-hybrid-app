/**
 * ADERA HYBRID APP - IMAGE FILE RENAMER
 * 
 * This script renames your existing image files to the proper format
 * for the dual-image system.
 * 
 * Run this BEFORE uploading to Supabase Storage
 * 
 * Usage:
 * node supabase/rename-image-files.js
 */

const fs = require('fs');
const path = require('path');

// ============================================
// CONFIGURATION
// ============================================

const IMAGES_DIR = path.join(__dirname, '..', 'ReferenceResources', 'SamplePartnersShopsPics-X');
const BACKUP_DIR = path.join(IMAGES_DIR, 'originals-backup');

// ============================================
// RENAME MAPPING
// ============================================

const renameMap = {
  // Hubs
  'hub1.jpeg': 'adera-hub-1-storefront.jpeg',
  'hub2.jpg': 'adera-hub-2-storefront.jpg',
  
  // Partner shops
  's1.webp': 'bole-minimarket-storefront.webp',
  's2.jpg': 'piazza-general-store-storefront.jpg',
  's3.jpg': 'merkato-electronics-hub-storefront.jpg',
  's3.jpeg': 'merkato-electronics-hub-storefront.jpeg', // Alternative extension
  's4.jpg': 'cmc-pharmacy-storefront.jpg',
  's5.jpg': 'kazanchis-supermarket-storefront.jpg',
  's6.jpg': 'arat-kilo-books-storefront.jpg',
  's6.webp': 'arat-kilo-books-storefront.webp', // Alternative extension
  's7.jpg': 'meskel-square-fashion-storefront.jpg',
  's8.jpg': 'lideta-grocery-storefront.jpg',
  's9.jpg': 'gerji-tech-shop-storefront.jpg',
  's10.jpg': 'bole-medhanialem-bakery-storefront.jpg',
  's11.jpg': 'addis-ketema-hardware-storefront.jpg',
  's11.webp': 'addis-ketema-hardware-storefront.webp', // Alternative extension
  's12.jpg': 'yeka-electronics-storefront.jpg',
  's13.jpg': 'kirkos-furniture-storefront.jpg',
  's14.jpg': 'arada-clothing-storefront.jpg',
  's14.webp': 'arada-clothing-storefront.webp', // Alternative extension
  's15.jpg': 'nifas-silk-market-storefront.jpg',
  's15.jpeg': 'nifas-silk-market-storefront.jpeg', // Alternative extension
  's16.jpg': 'kolfe-store-storefront.jpg',
  's16.jpeg': 'kolfe-store-storefront.jpeg', // Alternative extension
  's17.jpg': 'gulele-pharmacy-storefront.jpg',
  's18.jpg': 'akaki-shop-storefront.jpg',
  's19.jpg': 'lemi-kura-minimarket-storefront.jpg',
  's20.jpg': 'sarbet-store-storefront.jpg',
  's21.jpg': 'megenagna-electronics-storefront.jpg',
  's22.jpg': 'hayat-supermarket-storefront.jpg',
  's23.jpg': 'aware-grocery-storefront.jpg',
  's24.jpg': 'jemo-pharmacy-storefront.jpg',
  's25.jpg': 'kality-tech-hub-storefront.jpg',
  's25.jpeg': 'kality-tech-hub-storefront.jpeg', // Alternative extension
  's26.jpg': 'saris-minimarket-storefront.jpg',
  's27.jpg': 'teklehaimanot-books-storefront.jpg',
  's28.jpg': 'shiro-meda-fashion-storefront.jpg',
  's28.webp': 'shiro-meda-fashion-storefront.webp', // Alternative extension
  'ss28.webp': 'shiro-meda-fashion-storefront.webp', // Typo variant
  's29.jpg': 'gofa-grocery-storefront.jpg',
  's30.jpg': 'lebu-hardware-storefront.jpg',
};

// ============================================
// MAIN RENAME FUNCTION
// ============================================

function renameImageFiles() {
  console.log('================================================');
  console.log('📝 ADERA IMAGE FILE RENAMER');
  console.log('================================================');
  console.log(`📁 Images directory: ${IMAGES_DIR}`);
  console.log('================================================\n');

  // Check if images directory exists
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`❌ Error: Images directory not found: ${IMAGES_DIR}`);
    console.error('Please ensure the ReferenceResources/SamplePartnersShopsPics-X directory exists.');
    process.exit(1);
  }

  // Create backup directory
  if (!fs.existsSync(BACKUP_DIR)) {
    fs.mkdirSync(BACKUP_DIR, { recursive: true });
    console.log(`✅ Created backup directory: ${BACKUP_DIR}\n`);
  }

  let renamedCount = 0;
  let backedUpCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  // Process each file in the rename map
  for (const [oldName, newName] of Object.entries(renameMap)) {
    const oldPath = path.join(IMAGES_DIR, oldName);
    const newPath = path.join(IMAGES_DIR, newName);
    const backupPath = path.join(BACKUP_DIR, oldName);

    console.log(`📝 Processing: ${oldName} → ${newName}`);

    try {
      // Check if old file exists
      if (!fs.existsSync(oldPath)) {
        console.log(`   ⚠️  File not found, skipping\n`);
        skippedCount++;
        continue;
      }

      // Check if new file already exists
      if (fs.existsSync(newPath)) {
        console.log(`   ⚠️  Target file already exists, skipping\n`);
        skippedCount++;
        continue;
      }

      // Create backup
      fs.copyFileSync(oldPath, backupPath);
      console.log(`   💾 Backed up to: originals-backup/${oldName}`);
      backedUpCount++;

      // Rename file
      fs.renameSync(oldPath, newPath);
      console.log(`   ✅ Renamed successfully\n`);
      renamedCount++;

    } catch (error) {
      console.error(`   ❌ Error: ${error.message}\n`);
      errorCount++;
    }
  }

  // Summary
  console.log('================================================');
  console.log('📊 RENAME SUMMARY');
  console.log('================================================');
  console.log(`✅ Renamed: ${renamedCount} files`);
  console.log(`💾 Backed up: ${backedUpCount} files`);
  console.log(`⚠️  Skipped: ${skippedCount} files`);
  console.log(`❌ Errors: ${errorCount} files`);
  console.log('================================================');

  if (errorCount === 0 && renamedCount > 0) {
    console.log('🎉 All files renamed successfully!');
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Review the renamed files in the images directory');
    console.log('2. Original files are backed up in originals-backup/');
    console.log('3. Upload to Supabase Storage (shop-loc-pics bucket)');
    console.log('4. Run: 07-update-shop-location-pics.sql');
    console.log('5. Run: 06-generate-default-shop-logos.sql');
  } else if (renamedCount === 0) {
    console.log('ℹ️  No files were renamed.');
    console.log('This might mean:');
    console.log('- Files are already renamed');
    console.log('- Files are missing from the directory');
    console.log('- File names don\'t match the expected format');
  } else {
    console.log('⚠️  Some files had errors. Check the output above.');
  }

  console.log('');
  console.log('💡 Tip: You can restore original files from originals-backup/ if needed');
}

// ============================================
// RUN SCRIPT
// ============================================

renameImageFiles();
