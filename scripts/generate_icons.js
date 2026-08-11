const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const srcIcon = 'C:\\Users\\User\\.gemini\\antigravity\\brain\\01317b27-89e0-4dac-9b36-11231cc3e8e7\\tivora_app_icon_1786444938308.jpg';
const resDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

const sizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

async function generateIcons() {
  for (const [folder, size] of Object.entries(sizes)) {
    const dir = path.join(resDir, folder);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // Square Launcher Icon
    await sharp(srcIcon)
      .resize(size, size)
      .toFormat('png')
      .toFile(path.join(dir, 'ic_launcher.png'));

    // Round Launcher Icon
    const roundedMask = Buffer.from(
      `<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${size / 2}" ry="${size / 2}"/></svg>`
    );

    await sharp(srcIcon)
      .resize(size, size)
      .composite([{ input: roundedMask, blend: 'dest-in' }])
      .toFormat('png')
      .toFile(path.join(dir, 'ic_launcher_round.png'));

    // Foreground Icon (for adaptive icons)
    const innerSize = Math.round(size * 0.7);
    const padding = Math.round((size - innerSize) / 2);

    await sharp(srcIcon)
      .resize(innerSize, innerSize)
      .extend({
        top: padding,
        bottom: padding,
        left: padding,
        right: padding,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .toFormat('png')
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));
  }
  console.log('App icons generated successfully across all mipmap folders!');
}

generateIcons().catch(err => console.error('Icon generation error:', err));
