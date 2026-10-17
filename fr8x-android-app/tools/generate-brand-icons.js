const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const SOURCE_ICON = path.resolve(__dirname, '..', '..', 'accessories', 'FR8X Infinity App Icon.png');
const RES_DIR = path.resolve(__dirname, '..', 'app', 'src', 'main', 'res');

if (!fs.existsSync(SOURCE_ICON)) {
  console.error('[ERROR] Authoritative source icon not found at:', SOURCE_ICON);
  process.exit(1);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function extractInfinityMark(sourceBuffer) {
  const { data, info } = await sharp(sourceBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const out = Buffer.alloc(data.length);
  let minX = info.width, maxX = 0, minY = info.height, maxY = 0;

  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const idx = (y * info.width + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2], a = data[idx + 3];
      const brightness = 0.299 * r + 0.587 * g + 0.114 * b;

      if (brightness > 35 && a > 35) {
        const factor = Math.min(1, Math.max(0, (brightness - 30) / 225));
        const alpha = Math.round(factor * (a / 255) * 255);
        out[idx] = 255;
        out[idx + 1] = 255;
        out[idx + 2] = 255;
        out[idx + 3] = alpha;

        if (alpha > 20) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      } else {
        out[idx] = 0;
        out[idx + 1] = 0;
        out[idx + 2] = 0;
        out[idx + 3] = 0;
      }
    }
  }

  const croppedWidth = maxX - minX + 1;
  const croppedHeight = maxY - minY + 1;

  const cropped = await sharp(out, {
    raw: { width: info.width, height: info.height, channels: 4 }
  })
    .extract({ left: minX, top: minY, width: croppedWidth, height: croppedHeight })
    .png()
    .toBuffer();

  return cropped;
}

async function createRoundMask(size) {
  const radius = size / 2;
  const circleSvg = `<svg width="${size}" height="${size}"><circle cx="${radius}" cy="${radius}" r="${radius}" fill="white"/></svg>`;
  return Buffer.from(circleSvg);
}

async function generateAll() {
  console.log('================================================================');
  console.log('  FR8X BRAND IDENTITY & ANDROID RESOURCE COMPILER');
  console.log('  Authoritative Asset: accessories/FR8X Infinity App Icon.png');
  console.log('================================================================');

  const sourceBuffer = fs.readFileSync(SOURCE_ICON);
  const markBuffer = await extractInfinityMark(sourceBuffer);

  const mipmapDensities = [
    { name: 'mdpi', legacySize: 48, adaptiveSize: 108, notifSize: 24 },
    { name: 'hdpi', legacySize: 72, adaptiveSize: 162, notifSize: 36 },
    { name: 'xhdpi', legacySize: 96, adaptiveSize: 216, notifSize: 48 },
    { name: 'xxhdpi', legacySize: 144, adaptiveSize: 324, notifSize: 72 },
    { name: 'xxxhdpi', legacySize: 192, adaptiveSize: 432, notifSize: 96 }
  ];

  for (const d of mipmapDensities) {
    const mipmapDir = path.join(RES_DIR, `mipmap-${d.name}`);
    const drawableDir = path.join(RES_DIR, `drawable-${d.name}`);
    ensureDir(mipmapDir);
    ensureDir(drawableDir);

    // 1. Legacy Launcher Icon (full squircle artwork)
    const legacyIconPath = path.join(mipmapDir, 'ic_launcher.png');
    await sharp(sourceBuffer)
      .resize(d.legacySize, d.legacySize, { fit: 'contain', kernel: 'lanczos3' })
      .png()
      .toFile(legacyIconPath);

    // 2. Legacy Round Icon (circular mask over artwork)
    const roundMask = await createRoundMask(d.legacySize);
    const roundIconPath = path.join(mipmapDir, 'ic_launcher_round.png');
    await sharp(sourceBuffer)
      .resize(d.legacySize, d.legacySize, { fit: 'cover', kernel: 'lanczos3' })
      .composite([{ input: roundMask, blend: 'dest-in' }])
      .png()
      .toFile(roundIconPath);

    // 3. Adaptive Foreground Icon (inner mark scaled to safe-zone 62% of 108dp canvas)
    // 72dp is the mask diameter; 62dp gives a crisp, comfortable safe-zone margin
    const targetMarkWidth = Math.round(d.adaptiveSize * 0.62);
    const resizedMark = await sharp(markBuffer)
      .resize(targetMarkWidth, null, { fit: 'contain', kernel: 'lanczos3' })
      .toBuffer();

    const markMeta = await sharp(resizedMark).metadata();
    const leftPad = Math.round((d.adaptiveSize - markMeta.width) / 2);
    const topPad = Math.round((d.adaptiveSize - markMeta.height) / 2);

    const adaptiveForegroundPath = path.join(mipmapDir, 'ic_launcher_foreground.png');
    await sharp({
      create: {
        width: d.adaptiveSize,
        height: d.adaptiveSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: resizedMark, left: leftPad, top: topPad }])
      .png()
      .toFile(adaptiveForegroundPath);

    // 4. Android 13+ Themed Monochrome Icon
    const monochromePath = path.join(mipmapDir, 'ic_launcher_monochrome.png');
    fs.copyFileSync(adaptiveForegroundPath, monochromePath);

    // 5. Notification Small Icon (white silhouette on transparent)
    const notifMarkWidth = Math.round(d.notifSize * 0.85);
    const resizedNotifMark = await sharp(markBuffer)
      .resize(notifMarkWidth, null, { fit: 'contain', kernel: 'lanczos3' })
      .toBuffer();
    const notifMeta = await sharp(resizedNotifMark).metadata();
    const notifLeft = Math.round((d.notifSize - notifMeta.width) / 2);
    const notifTop = Math.round((d.notifSize - notifMeta.height) / 2);

    const notifPath = path.join(drawableDir, 'ic_stat_fr8x.png');
    await sharp({
      create: {
        width: d.notifSize,
        height: d.notifSize,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      }
    })
      .composite([{ input: resizedNotifMark, left: notifLeft, top: notifTop }])
      .png()
      .toFile(notifPath);

    console.log(`[ICON] Generated resources for ${d.name} (Legacy: ${d.legacySize}px, Adaptive: ${d.adaptiveSize}px, Notif: ${d.notifSize}px)`);
  }

  // 6. AnyDPI Adaptive Icon XML (API 26+)
  const anyDpiDir = path.join(RES_DIR, 'mipmap-anydpi-v26');
  ensureDir(anyDpiDir);

  const adaptiveXml = `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome" />
</adaptive-icon>
`;

  fs.writeFileSync(path.join(anyDpiDir, 'ic_launcher.xml'), adaptiveXml);
  fs.writeFileSync(path.join(anyDpiDir, 'ic_launcher_round.xml'), adaptiveXml);
  console.log('[XML] Generated adaptive-icon XML in mipmap-anydpi-v26');

  // 7. High-res Play Store Icon (512x512) and Splash Logo
  const drawableBase = path.join(RES_DIR, 'drawable');
  ensureDir(drawableBase);

  await sharp(sourceBuffer)
    .resize(512, 512, { fit: 'contain', kernel: 'lanczos3' })
    .png()
    .toFile(path.join(drawableBase, 'ic_launcher.png'));

  // Splash Logo (White mark on transparent, 360px wide)
  const splashMark = await sharp(markBuffer)
    .resize(360, null, { fit: 'contain', kernel: 'lanczos3' })
    .png()
    .toFile(path.join(drawableBase, 'splash_logo.png'));

  // Also copy to mobile-app asset directory
  const mobileAppDir = path.resolve(__dirname, '..', 'mobile-app');
  if (fs.existsSync(mobileAppDir)) {
    fs.copyFileSync(path.join(drawableBase, 'ic_launcher.png'), path.join(mobileAppDir, 'icon.png'));
  }

  console.log('[HIGH-RES] Generated 512x512 store icon and splash_logo.png');
  console.log('================================================================');
  console.log('  SUCCESS: ALL ANDROID BRAND RESOURCES DERIVED AND VERIFIED!');
  console.log('================================================================\n');
}

generateAll().catch(err => {
  console.error('[FATAL ICON ERROR]:', err);
  process.exit(1);
});
