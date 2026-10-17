const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const APK_PATH = path.resolve(__dirname, '..', 'dist', 'FR8X-Android-Universal-Release.apk');
const AAPT2 = 'C:\\Users\\RajatKumarRai\\.tools\\android-sdk\\build-tools\\34.0.0\\aapt2.exe';
const APKSIGNER = 'C:\\Users\\RajatKumarRai\\.tools\\android-sdk\\build-tools\\34.0.0\\apksigner.bat';

console.log('================================================================');
console.log('       FR8X ANDROID UNIVERSAL APK VERIFICATION SUITE');
console.log('================================================================');

if (!fs.existsSync(APK_PATH)) {
  console.error('[FAIL] APK not found at:', APK_PATH);
  process.exit(1);
}

const stat = fs.statSync(APK_PATH);
console.log(`[PASS] APK File Exists: ${APK_PATH}`);
console.log(`[PASS] File Size: ${stat.size} bytes (${(stat.size / 1024).toFixed(1)} KB)`);

// 1. Verify signatures
console.log('\n--- 1. SIGNATURE VERIFICATION ---');
const signOutput = execSync(`call "${APKSIGNER}" verify --verbose "${APK_PATH}"`).toString();
console.log(signOutput.trim());
if (signOutput.includes('Verified using v1 scheme (JAR signing): true') &&
    signOutput.includes('Verified using v2 scheme (APK Signature Scheme v2): true') &&
    signOutput.includes('Verified using v3 scheme (APK Signature Scheme v3): true')) {
  console.log('[PASS] All signature schemes (v1, v2, v3) verified successfully.');
} else {
  console.error('[FAIL] Signature verification incomplete.');
  process.exit(1);
}

// 2. Verify badging
console.log('\n--- 2. MANIFEST BADGING & IDENTITY VERIFICATION ---');
const badgingOutput = execSync(`"${AAPT2}" dump badging "${APK_PATH}"`).toString();
console.log(badgingOutput.split('\n').filter(l => 
  l.startsWith('package:') ||
  l.startsWith('sdkVersion:') ||
  l.startsWith('targetSdkVersion:') ||
  l.startsWith('application-label:') ||
  l.startsWith('application:') ||
  l.startsWith('launchable-activity:') ||
  l.startsWith('uses-permission:')
).join('\n'));

// Check package and label
if (badgingOutput.includes("package: name='com.fr8x.app'") &&
    badgingOutput.includes("application-label:'FR8X'") &&
    badgingOutput.includes("targetSdkVersion:'34'") &&
    badgingOutput.includes("sdkVersion:'21'")) {
  console.log('[PASS] Package identity, target SDK (34), min SDK (21), and application label (FR8X) verified.');
} else {
  console.error('[FAIL] Badging metadata check failed.');
  process.exit(1);
}

// 3. Inspect ZIP entries for adaptive icons and assets
console.log('\n--- 3. ZIP STRUCTURE & RESOURCE AUDIT ---');
const JAR = 'C:\\Program Files\\Microsoft\\jdk-17.0.20.101-hotspot\\bin\\jar.exe';
const tfOutput = execSync(`"${JAR}" tf "${APK_PATH}"`).toString().split('\n');

const requiredEntries = [
  'AndroidManifest.xml',
  'classes.dex',
  'resources.arsc',
  'res/mipmap-anydpi-v26/ic_launcher.xml',
  'res/mipmap-anydpi-v26/ic_launcher_round.xml',
  'res/mipmap-hdpi-v4/ic_launcher.png',
  'res/mipmap-xxhdpi-v4/ic_launcher.png',
  'res/mipmap-xxxhdpi-v4/ic_launcher.png',
  'res/mipmap-xxxhdpi-v4/ic_launcher_foreground.png',
  'res/mipmap-xxxhdpi-v4/ic_launcher_monochrome.png',
  'res/drawable-xxhdpi-v4/ic_stat_fr8x.png',
  'res/drawable/splash_logo.png',
  'assets/mobile/index.html',
  'assets/mobile/icon.png',
  'META-INF/MANIFEST.MF'
];


let allEntriesPresent = true;
for (const entry of requiredEntries) {
  const found = tfOutput.some(line => line.trim() === entry);
  if (found) {
    console.log(`[PASS] Entry present: ${entry}`);
  } else {
    console.error(`[FAIL] Required entry missing: ${entry}`);
    allEntriesPresent = false;
  }
}

if (!allEntriesPresent) {
  console.error('[FAIL] Missing essential entries in APK.');
  process.exit(1);
}

console.log('\n================================================================');
console.log('  ALL AUTOMATED VERIFICATION GATES PASSED (100% SUCCEEDED)');
console.log('================================================================');
