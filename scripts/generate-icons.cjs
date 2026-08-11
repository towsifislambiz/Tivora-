/**
 * Tivora Icon Generator Script
 * Resizes the master icon to all required Android mipmap sizes and PWA icon sizes.
 * Run: node scripts/generate-icons.cjs
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE_ICON = path.resolve('C:/Users/User/.gemini/antigravity/brain/01317b27-89e0-4dac-9b36-11231cc3e8e7/tivora_app_icon_1786398740471.jpg');

const ANDROID_SIZES = [
  { dir: 'mipmap-mdpi',    size: 48 },
  { dir: 'mipmap-hdpi',    size: 72 },
  { dir: 'mipmap-xhdpi',   size: 96 },
  { dir: 'mipmap-xxhdpi',  size: 144 },
  { dir: 'mipmap-xxxhdpi', size: 192 },
];

const ANDROID_ICON_BASE = path.resolve('C:/Users/User/Desktop/Tivora/android/app/src/main/res');

const PWA_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];
const PWA_ICONS_DIR = path.resolve('C:/Users/User/Desktop/Tivora/public/icons');

async function generateIcons() {
  // Ensure output dirs exist
  fs.mkdirSync(PWA_ICONS_DIR, { recursive: true });
  for (const { dir } of ANDROID_SIZES) {
    fs.mkdirSync(path.join(ANDROID_ICON_BASE, dir), { recursive: true });
  }

  console.log('Generating Android mipmap icons...');
  for (const { dir, size } of ANDROID_SIZES) {
    const outPath = path.join(ANDROID_ICON_BASE, dir, 'ic_launcher.png');
    await sharp(SOURCE_ICON)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(outPath);
    console.log(`  ✓ ${dir}/ic_launcher.png (${size}x${size})`);

    // Also generate round icon (same image, Android uses it in some launchers)
    const outPathRound = path.join(ANDROID_ICON_BASE, dir, 'ic_launcher_round.png');
    await sharp(SOURCE_ICON)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(outPathRound);
    console.log(`  ✓ ${dir}/ic_launcher_round.png (${size}x${size})`);
  }

  // Generate a 512x512 foreground for adaptive icon
  const foregroundDir = path.join(ANDROID_ICON_BASE, 'mipmap-xxxhdpi');
  fs.mkdirSync(foregroundDir, { recursive: true });
  await sharp(SOURCE_ICON)
    .resize(432, 432, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extend({ top: 40, bottom: 40, left: 40, right: 40, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(path.join(foregroundDir, 'ic_launcher_foreground.png'));
  console.log('  ✓ ic_launcher_foreground.png (adaptive icon)');

  console.log('\nGenerating PWA web icons...');
  for (const size of PWA_SIZES) {
    const outPath = path.join(PWA_ICONS_DIR, `icon-${size}x${size}.png`);
    await sharp(SOURCE_ICON)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(outPath);
    console.log(`  ✓ icon-${size}x${size}.png`);
  }

  // Generate splash screen (1920x1080, dark bg, centered icon)
  const splashDir = path.join(ANDROID_ICON_BASE, 'drawable');
  fs.mkdirSync(splashDir, { recursive: true });
  const splashIconBuffer = await sharp(SOURCE_ICON)
    .resize(288, 288, { fit: 'cover' })
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: 1920,
      height: 1920,
      channels: 4,
      background: { r: 15, g: 15, b: 26, alpha: 1 }
    }
  })
  .composite([{ input: splashIconBuffer, gravity: 'center' }])
  .png()
  .toFile(path.join(splashDir, 'splash.png'));
  console.log('  ✓ drawable/splash.png (Android splash screen)');

  console.log('\n✅ All icons generated successfully!');
}

generateIcons().catch(err => {
  console.error('Icon generation failed:', err);
  process.exit(1);
});
