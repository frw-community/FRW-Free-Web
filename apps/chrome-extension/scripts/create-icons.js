/**
 * Icon Creation Script
 * 
 * This script requires 'sharp' package:
 * npm install sharp
 * 
 * Usage:
 * node scripts/create-icons.js path/to/logo.png
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [16, 32, 48, 128];
const inputFile = process.argv[2];

if (!inputFile) {
  console.error('Usage: node scripts/create-icons.js <input-logo.png>');
  console.error('Example: node scripts/create-icons.js logo.png');
  process.exit(1);
}

if (!fs.existsSync(inputFile)) {
  console.error(`Error: File not found: ${inputFile}`);
  process.exit(1);
}

const iconsDir = path.join(__dirname, '..', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Creating icons from:', inputFile);
console.log('Output directory:', iconsDir);
console.log('');

async function createIcons() {
  for (const size of sizes) {
    const outputFile = path.join(iconsDir, `icon-${size}.png`);
    
    try {
      await sharp(inputFile)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .png()
        .toFile(outputFile);
      
      console.log(`✓ Created: icon-${size}.png`);
    } catch (error) {
      console.error(`✗ Failed to create icon-${size}.png:`, error.message);
    }
  }
  
  console.log('');
  console.log('Done! Icons created in:', iconsDir);
  console.log('');
  console.log('Next steps:');
  console.log('1. Run: npm run build');
  console.log('2. Load extension in Chrome');
  console.log('3. Enjoy your FRW extension!');
}

createIcons().catch(console.error);
