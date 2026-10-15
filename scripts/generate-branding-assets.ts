/**
 * scripts/generate-branding-assets.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Generates authoritative branding assets, favicons, app icons, and SEO images
 * for FR8X using the official fr8x.png and fr8x.svg sources.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

function createIco(pngBuffers: Buffer[], sizes: number[]): Buffer {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // ICO type
  header.writeUInt16LE(count, 4); // count

  let offset = 6 + count * 16;
  const dirEntries: Buffer[] = [];
  for (let i = 0; i < count; i++) {
    const size = sizes[i];
    const buf = pngBuffers[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
    entry.writeUInt8(0, 2); // color count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(buf.length, 8); // image size
    entry.writeUInt32LE(offset, 12); // image offset
    dirEntries.push(entry);
    offset += buf.length;
  }

  return Buffer.concat([header, ...dirEntries, ...pngBuffers]);
}

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const sourcePng = path.join(projectRoot, 'fr8x.png');
  const sourceSvg = path.join(projectRoot, 'fr8x.svg');

  if (!fs.existsSync(sourcePng)) {
    throw new Error(`Source PNG not found at: ${sourcePng}`);
  }
  if (!fs.existsSync(sourceSvg)) {
    throw new Error(`Source SVG not found at: ${sourceSvg}`);
  }

  console.log('1. Analyzing and trimming source fr8x.png...');
  const trimmedBuf = await sharp(sourcePng).trim().toBuffer();
  const trimmedMeta = await sharp(trimmedBuf).metadata();
  console.log(`   Trimmed dimensions: ${trimmedMeta.width}x${trimmedMeta.height}`);

  // Helper to generate padded square icon
  async function generatePaddedIcon(dim: number, paddingFactor = 0.85): Promise<Buffer> {
    const targetInner = Math.max(1, Math.round(dim * paddingFactor));
    const innerBuf = await sharp(trimmedBuf)
      .resize({
        width: targetInner,
        height: targetInner,
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png({ compressionLevel: 9 })
      .toBuffer();

    return sharp({
      create: {
        width: dim,
        height: dim,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([{ input: innerBuf, gravity: 'center' }])
      .png({ compressionLevel: 9 })
      .toBuffer();
  }

  console.log('2. Generating icons at required resolutions...');
  const icon512 = await generatePaddedIcon(512, 0.84);
  const icon192 = await generatePaddedIcon(192, 0.84);
  const icon180 = await generatePaddedIcon(180, 0.84);
  const icon64 = await generatePaddedIcon(64, 0.86);
  const icon48 = await generatePaddedIcon(48, 0.88);
  const icon32 = await generatePaddedIcon(32, 0.90);
  const icon16 = await generatePaddedIcon(16, 0.94);

  console.log('3. Generating multi-resolution favicon.ico (16, 32, 48)...');
  const faviconIco = createIco([icon16, icon32, icon48], [16, 32, 48]);

  console.log('4. Generating 1200x630 OpenGraph / Twitter social card...');
  const ogInnerWidth = 800;
  const ogInnerHeight = 400;
  const ogLogo = await sharp(trimmedBuf)
    .resize({
      width: ogInnerWidth,
      height: ogInnerHeight,
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();

  const ogCard = await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 15, g: 23, b: 42, alpha: 1 }, // Slate 900 #0f172a theme color
    },
  })
    .composite([
      {
        input: await sharp(trimmedBuf)
          .negate({ alpha: false }) // Invert to crisp white on dark slate background
          .resize({ width: 640, height: 320, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer(),
        gravity: 'center',
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  console.log('5. Generating white-variant logo (for dark backgrounds)...');
  const whiteLogo512 = await sharp(icon512)
    .negate({ alpha: false })
    .png()
    .toBuffer();

  console.log('5b. Generating ultra-low file size logo for email clients (< 2 KB)...');
  const emailLogoSquare = await sharp({
    create: {
      width: 128,
      height: 128,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp(trimmedBuf)
          .resize({ width: 112, height: 112, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
          .png()
          .toBuffer(),
        gravity: 'center',
      },
    ])
    .png({ palette: true, quality: 90, compressionLevel: 9 })
    .toBuffer();

  const emailLogoHorizontal = await sharp(trimmedBuf)
    .resize({ width: 240, height: 120, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ palette: true, quality: 90, compressionLevel: 9 })
    .toBuffer();

  console.log('6. Writing assets to public/ and app/ directories...');
  const publicDir = path.join(projectRoot, 'public');
  const appDir = path.join(projectRoot, 'app');

  // Copy SVG
  fs.copyFileSync(sourceSvg, path.join(publicDir, 'logo.svg'));
  fs.copyFileSync(sourceSvg, path.join(publicDir, 'fr8x.svg'));

  // Write PNG icons to public/
  fs.writeFileSync(path.join(publicDir, 'logo.png'), icon512);
  fs.writeFileSync(path.join(publicDir, 'logo-white.png'), whiteLogo512);
  fs.writeFileSync(path.join(publicDir, 'mobile-app-icon.png'), icon512);
  fs.writeFileSync(path.join(publicDir, 'icon.png'), icon192);
  fs.writeFileSync(path.join(publicDir, 'apple-icon.png'), icon180);
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), icon64);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), faviconIco);
  fs.writeFileSync(path.join(publicDir, 'og-image.png'), ogCard);

  // Write ultra-low KB email logos to public/
  fs.writeFileSync(path.join(publicDir, 'email-logo.png'), emailLogoSquare);
  fs.writeFileSync(path.join(publicDir, 'logo-email.png'), emailLogoSquare);
  fs.writeFileSync(path.join(publicDir, 'email-logo-horizontal.png'), emailLogoHorizontal);

  // Write Next.js app/ directory icons
  fs.writeFileSync(path.join(appDir, 'icon.png'), icon192);
  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), icon180);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), faviconIco);

  // Sync Android mobile assets if directory exists
  const androidAssetsMobile = path.join(projectRoot, 'fr8x-android-app/app/src/main/assets/mobile/icon.png');
  const androidMobileApp = path.join(projectRoot, 'fr8x-android-app/mobile-app/icon.png');
  if (fs.existsSync(path.dirname(androidAssetsMobile))) {
    fs.writeFileSync(androidAssetsMobile, icon512);
  }
  if (fs.existsSync(path.dirname(androidMobileApp))) {
    fs.writeFileSync(androidMobileApp, icon512);
  }

  console.log('✔ All branding assets generated successfully:');
  console.log('  - public/logo.svg (vector infinity logo)');
  console.log('  - public/logo.png (512x512 crisp transparent PNG)');
  console.log('  - public/logo-white.png (512x512 inverted white variant)');
  console.log('  - public/mobile-app-icon.png (512x512 PWA & mobile icon)');
  console.log('  - public/icon.png (192x192 PWA standard icon)');
  console.log('  - public/apple-icon.png (180x180 Apple touch icon)');
  console.log('  - public/favicon.png (64x64 tab PNG icon)');
  console.log('  - public/favicon.ico & app/favicon.ico (multi-resolution 16, 32, 48)');
  console.log('  - public/og-image.png (1200x630 dark slate OpenGraph & Twitter banner)');
  console.log('  - app/icon.png & app/apple-icon.png (Next.js 14 App Router icons)');
}

main().catch((err) => {
  console.error('Asset generation failed:', err);
  process.exit(1);
});
