// One-shot generator per:
//   - favicon PNG variants (16/32/180/192/512)
//   - OG image canonica 1200x630 da SEO.jpg
//
// Usa sharp (già nelle devDependencies). Run: node scripts/generate-static-assets.mjs

import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const PUBLIC = resolve(ROOT, 'public');

const faviconSvg = readFileSync(resolve(PUBLIC, 'favicon.svg'));

const faviconTargets = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

for (const { name, size } of faviconTargets) {
  await sharp(faviconSvg, { density: 384 })
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(resolve(PUBLIC, name));
  console.log(`✓ ${name} (${size}×${size})`);
}

// OG image canonica 1200×630 (1.91:1) — Facebook/Twitter ottimale
// SEO.jpg è 1920×1280 (3:2): center-crop preserva il logo centrale
await sharp(resolve(PUBLIC, 'SEO.jpg'))
  .resize(1200, 630, { fit: 'cover', position: 'center' })
  .jpeg({ quality: 85, mozjpeg: true })
  .toFile(resolve(PUBLIC, 'og-image.jpg'));
console.log('✓ og-image.jpg (1200×630)');
