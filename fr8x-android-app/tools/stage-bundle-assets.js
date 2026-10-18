const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const ANDROID_APP_DIR = path.resolve(__dirname, '..');
const ASSETS_DIR = path.join(ANDROID_APP_DIR, 'app', 'src', 'main', 'assets');
const BUNDLE_DIR = path.join(ASSETS_DIR, 'bundle');

function copyDirRecursive(src, dest, filterFn) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src);
  for (const entry of entries) {
    const srcPath = path.join(src, entry);
    const destPath = path.join(dest, entry);

    if (filterFn && !filterFn(srcPath, entry)) continue;

    const stat = fs.statSync(srcPath);
    if (stat.isDirectory()) {
      copyDirRecursive(srcPath, destPath, filterFn);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log('Copying Next.js static chunks to assets/bundle/_next/static...');
copyDirRecursive(
  path.join(ROOT_DIR, '.next', 'static'),
  path.join(BUNDLE_DIR, '_next', 'static')
);

console.log('Copying public fonts and brand assets to assets/bundle/public...');
copyDirRecursive(
  path.join(ROOT_DIR, 'public'),
  path.join(BUNDLE_DIR, 'public'),
  (fullPath, filename) => !filename.endsWith('.apk')
);

console.log('Copying accessories to assets/bundle/accessories...');
copyDirRecursive(
  path.join(ROOT_DIR, 'accessories'),
  path.join(BUNDLE_DIR, 'accessories')
);

function getDirSize(dir) {
  let size = 0;
  if (!fs.existsSync(dir)) return 0;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) size += getDirSize(full);
    else size += stat.size;
  }
  return size;
}

const totalSize = getDirSize(BUNDLE_DIR);
console.log(`[SUCCESS] Bundled asset footprint: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
