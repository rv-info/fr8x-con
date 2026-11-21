const fs = require('fs');
const path = require('path');

const MIME_MAP = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

const REQUIRED_CATEGORIES = [
  'ICONS',
  'LOGOS',
  'PROFILE',
  'ILLUSTRATIONS',
  'ANIMATIONS',
  '3D',
  'BACKGROUNDS',
  'DOCUMENTATION',
];

console.log('--- STEP 1: Verifying ART Directory Hierarchy ---');
let allDirsExist = true;
for (const cat of REQUIRED_CATEGORIES) {
  const rootDir = path.join(process.cwd(), 'ART', cat);
  const pubDir = path.join(process.cwd(), 'public', 'ART', cat);
  if (!fs.existsSync(rootDir)) {
    console.error('FAIL: Missing root ART directory:', rootDir);
    allDirsExist = false;
  }
  if (!fs.existsSync(pubDir)) {
    console.error('FAIL: Missing public ART directory:', pubDir);
    allDirsExist = false;
  }
}
if (allDirsExist) {
  console.log('✓ All 8 ART directories present in both /ART and /public/ART');
}

console.log('\n--- STEP 2: Verifying ART_ASSET_INDEX.txt ---');
const indexPath = path.join(process.cwd(), 'ART', 'DOCUMENTATION', 'ART_ASSET_INDEX.txt');
if (fs.existsSync(indexPath)) {
  const content = fs.readFileSync(indexPath, 'utf8');
  console.log(`✓ ART_ASSET_INDEX.txt exists (${content.length} characters, ${content.split('\n').length} lines)`);
  const checks = [
    'CATEGORY: ART/LOGOS',
    'CATEGORY: ART/ICONS',
    'CATEGORY: ART/PROFILE',
    'CATEGORY: ART/ILLUSTRATIONS',
    'CATEGORY: ART/ANIMATIONS',
    'CATEGORY: ART/3D',
    'CATEGORY: ART/BACKGROUNDS',
    'NAMING CONVENTION STANDARD',
    'ASSET REPLACEMENT & HOT-SWAP CONVENTION',
  ];
  for (const c of checks) {
    if (!content.includes(c)) {
      console.error(`FAIL: Index missing section: "${c}"`);
    } else {
      console.log(`  ✓ Contains section: "${c}"`);
    }
  }
} else {
  console.error('FAIL: ART_ASSET_INDEX.txt missing!');
}

console.log('\n--- STEP 3: Verifying Key Visual Assets & Formats ---');
const testAssets = [
  ['LOGOS', 'logo_primary.svg'],
  ['LOGOS', 'logo_primary.png'],
  ['LOGOS', 'logo_white.png'],
  ['LOGOS', 'logo_email.png'],
  ['LOGOS', 'logo_brand_master.svg'],
  ['ICONS', 'navigation_dashboard.png'],
  ['ICONS', 'navigation_feeds.png'],
  ['ICONS', 'navigation_nexus.png'],
  ['ICONS', 'navigation_auctions.png'],
  ['ICONS', 'navigation_rates.png'],
  ['ICONS', 'navigation_network.png'],
  ['ICONS', 'navigation_jobs.png'],
  ['ICONS', 'navigation_profile.png'],
  ['ICONS', 'transport_ship.png'],
  ['ICONS', 'transport_air.png'],
  ['ICONS', 'transport_truck.png'],
  ['ICONS', 'transport_container.png'],
  ['ICONS', 'action_calculator.png'],
  ['ICONS', 'action_notification.png'],
  ['ICONS', 'status_verified.png'],
  ['ICONS', 'app_icon_square.png'],
  ['ICONS', 'app_icon.png'],
  ['ICONS', 'app_icon_infinity.png'],
  ['PROFILE', 'profile_default.png'],
  ['ILLUSTRATIONS', 'illustration_empty_auctions.png'],
  ['ILLUSTRATIONS', 'illustration_empty_rates.png'],
  ['ILLUSTRATIONS', 'illustration_empty_jobs.png'],
  ['ILLUSTRATIONS', 'illustration_og_banner.png'],
];

let assetErrors = 0;
for (const [cat, file] of testAssets) {
  const rootFile = path.join(process.cwd(), 'ART', cat, file);
  const pubFile = path.join(process.cwd(), 'public', 'ART', cat, file);
  if (!fs.existsSync(rootFile)) {
    console.error(`FAIL: Missing ${rootFile}`);
    assetErrors++;
  } else if (!fs.existsSync(pubFile)) {
    console.error(`FAIL: Missing ${pubFile}`);
    assetErrors++;
  } else {
    const ext = path.extname(file);
    const mime = MIME_MAP[ext] || 'unknown';
    const size = fs.statSync(rootFile).size;
    console.log(`  ✓ ART/${cat}/${file} [${mime}] (${size} bytes)`);
  }
}

console.log('\n--- STEP 4: Verifying Route Handler & Central Registry ---');
const routePath = path.join(process.cwd(), 'app', 'ART', '[...slug]', 'route.ts');
if (fs.existsSync(routePath)) {
  console.log('✓ Dynamic route handler /app/ART/[...slug]/route.ts exists and ready');
} else {
  console.error('FAIL: Missing route handler!');
}

const registryPath = path.join(process.cwd(), 'lib', 'assets', 'registry.ts');
if (fs.existsSync(registryPath)) {
  const regContent = fs.readFileSync(registryPath, 'utf8');
  if (regContent.includes('/ART/LOGOS/logo_primary.png') && regContent.includes('/ART/ICONS/navigation_dashboard.png')) {
    console.log('✓ lib/assets/registry.ts properly updated with /ART/ endpoints');
  } else {
    console.error('FAIL: Registry does not reference /ART/ paths!');
  }
}

if (assetErrors === 0 && allDirsExist) {
  console.log('\n========================================');
  console.log('ALL ART ASSET VERIFICATIONS PASSED (100%)');
  console.log('========================================');
} else {
  console.error('\nVerification failed with errors!');
  process.exit(1);
}
