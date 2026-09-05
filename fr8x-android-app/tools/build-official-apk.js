const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const ANDROID_APP_DIR = path.resolve(__dirname, '..');
const SDK_DIR = 'C:\\Users\\RajatKumarRai\\.tools\\android-sdk';
const BUILD_TOOLS_DIR = path.join(SDK_DIR, 'build-tools', '34.0.0');
const PLATFORMS_DIR = path.join(SDK_DIR, 'platforms', 'android-33');

const AAPT2 = path.join(BUILD_TOOLS_DIR, 'aapt2.exe');
const ZIPALIGN = path.join(BUILD_TOOLS_DIR, 'zipalign.exe');
const D8 = path.join(BUILD_TOOLS_DIR, 'd8.bat');
const APKSIGNER = path.join(BUILD_TOOLS_DIR, 'apksigner.bat');
const ANDROID_JAR = path.join(PLATFORMS_DIR, 'android.jar');

const JDK_BIN = 'C:\\Program Files\\Microsoft\\jdk-17.0.20.101-hotspot\\bin';
const JAVAC = path.join(JDK_BIN, 'javac.exe');
const JAR = path.join(JDK_BIN, 'jar.exe');
const KEYTOOL = path.join(JDK_BIN, 'keytool.exe');

const BUILD_DIR = path.join(ANDROID_APP_DIR, 'build');
const INTERMEDIATE_DIR = path.join(BUILD_DIR, 'intermediate');
const GEN_DIR = path.join(INTERMEDIATE_DIR, 'gen');
const CLASSES_DIR = path.join(INTERMEDIATE_DIR, 'classes');
const DEX_DIR = path.join(INTERMEDIATE_DIR, 'dex');
const DIST_DIR = path.join(ANDROID_APP_DIR, 'dist');
const KEYSTORE_DIR = path.join(ANDROID_APP_DIR, 'keystore');

function run(cmd, desc) {
  console.log(`\n>>> [${desc}]`);
  console.log(cmd);
  execSync(cmd, { stdio: 'inherit' });
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// Replaces any Windows backslashes in ZIP headers with POSIX forward slashes
function fixZipSlashes(filePath) {
  let buf = fs.readFileSync(filePath);
  let eocdPos = buf.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  if (eocdPos === -1) return;
  
  let cdOffset = buf.readUInt32LE(eocdPos + 16);
  let cdEntries = buf.readUInt16LE(eocdPos + 10);
  let p = cdOffset;
  let count = 0;

  for (let i = 0; i < cdEntries; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) break;
    let fnLen = buf.readUInt16LE(p + 28);
    let extraLen = buf.readUInt16LE(p + 30);
    let commentLen = buf.readUInt16LE(p + 32);
    let localOffset = buf.readUInt32LE(p + 42);

    for (let j = 0; j < fnLen; j++) {
      if (buf[p + 46 + j] === 0x5c) {
        buf[p + 46 + j] = 0x2f;
        count++;
      }
    }

    if (buf.readUInt32LE(localOffset) === 0x04034b50) {
      let localFnLen = buf.readUInt16LE(localOffset + 26);
      for (let j = 0; j < localFnLen; j++) {
        if (buf[localOffset + 30 + j] === 0x5c) {
          buf[localOffset + 30 + j] = 0x2f;
        }
      }
    }

    p += 46 + fnLen + extraLen + commentLen;
  }

  if (count > 0) {
    fs.writeFileSync(filePath, buf);
    console.log(`[ZIP] Normalized ${count} Windows backslashes to forward slashes in APK zip entries.`);
  }
}

async function build() {
  console.log('================================================================');
  console.log('  FR8X ENTERPRISE MOBILE APK COMPILER (Official Google Toolchain)');
  console.log('================================================================');

  // Verify prerequisites
  const tools = [AAPT2, ZIPALIGN, D8, APKSIGNER, ANDROID_JAR, JAVAC, JAR, KEYTOOL];
  for (const t of tools) {
    if (!fs.existsSync(t)) {
      throw new Error(`Required tool missing: ${t}`);
    }
  }

  // 1. Prepare directories
  ensureDir(BUILD_DIR);
  ensureDir(INTERMEDIATE_DIR);
  ensureDir(GEN_DIR);
  ensureDir(CLASSES_DIR);
  ensureDir(DEX_DIR);
  ensureDir(DIST_DIR);
  ensureDir(KEYSTORE_DIR);

  const resDir = path.join(ANDROID_APP_DIR, 'app', 'src', 'main', 'res');
  const manifest = path.join(ANDROID_APP_DIR, 'app', 'src', 'main', 'AndroidManifest.xml');
  const assetsDir = path.join(ANDROID_APP_DIR, 'app', 'src', 'main', 'assets');
  const javaSrc = path.join(ANDROID_APP_DIR, 'app', 'src', 'main', 'java', 'com', 'fr8x', 'app', 'MainActivity.java');

  // Ensure assets are up-to-date from mobile-app
  const mobileAppDir = path.join(ANDROID_APP_DIR, 'mobile-app');
  const mobileAssetsTarget = path.join(assetsDir, 'mobile');
  ensureDir(mobileAssetsTarget);
  ['index.html', 'app.css', 'app.js', 'icon.png'].forEach(file => {
    const src = path.join(mobileAppDir, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(mobileAssetsTarget, file));
    }
  });

  // 2. Compile resources with aapt2
  const compiledResZip = path.join(INTERMEDIATE_DIR, 'compiled_res.zip');
  run(`"${AAPT2}" compile --dir "${resDir}" -o "${compiledResZip}"`, 'Compiling Android Resources with AAPT2');

  // 3. Link resources with aapt2 (generates base unaligned apk + R.java)
  const baseApk = path.join(INTERMEDIATE_DIR, 'base.apk');
  run(`"${AAPT2}" link -I "${ANDROID_JAR}" --manifest "${manifest}" -o "${baseApk}" --java "${GEN_DIR}" -A "${assetsDir}" "${compiledResZip}" --auto-add-overlay`, 'Linking Resources and Manifest with AAPT2');

  // 4. Compile Java sources (R.java + MainActivity.java)
  const rJava = path.join(GEN_DIR, 'com', 'fr8x', 'app', 'R.java');
  run(`"${JAVAC}" -cp "${ANDROID_JAR}" -d "${CLASSES_DIR}" --release 8 "${rJava}" "${javaSrc}"`, 'Compiling Java Sources with JDK 17');

  // 5. Compile bytecode to Dalvik Executable (classes.dex) with Google D8
  const classFiles = [
    path.join(CLASSES_DIR, 'com', 'fr8x', 'app', 'MainActivity.class'),
    path.join(CLASSES_DIR, 'com', 'fr8x', 'app', 'MainActivity$1.class'),
    path.join(CLASSES_DIR, 'com', 'fr8x', 'app', 'MainActivity$2.class'),
    path.join(CLASSES_DIR, 'com', 'fr8x', 'app', 'MainActivity$3.class'),
    path.join(CLASSES_DIR, 'com', 'fr8x', 'app', 'R.class'),
    path.join(CLASSES_DIR, 'com', 'fr8x', 'app', 'R$color.class'),
    path.join(CLASSES_DIR, 'com', 'fr8x', 'app', 'R$drawable.class'),
    path.join(CLASSES_DIR, 'com', 'fr8x', 'app', 'R$id.class'),
    path.join(CLASSES_DIR, 'com', 'fr8x', 'app', 'R$layout.class'),
    path.join(CLASSES_DIR, 'com', 'fr8x', 'app', 'R$string.class'),
    path.join(CLASSES_DIR, 'com', 'fr8x', 'app', 'R$style.class'),
    path.join(CLASSES_DIR, 'com', 'fr8x', 'app', 'R$xml.class')
  ].filter(f => fs.existsSync(f)).map(f => `"${f}"`).join(' ');

  run(`call "${D8}" --release --lib "${ANDROID_JAR}" --output "${DEX_DIR}" ${classFiles}`, 'Compiling Dalvik Executable (classes.dex) with Google D8');

  // 6. Insert classes.dex into base.apk
  const dexFile = path.join(DEX_DIR, 'classes.dex');
  if (!fs.existsSync(dexFile)) {
    throw new Error('classes.dex was not generated');
  }
  console.log(`[DEX] Generated classes.dex size: ${fs.statSync(dexFile).size} bytes`);
  
  process.chdir(DEX_DIR);
  run(`"${JAR}" uf "${baseApk}" classes.dex`, 'Packaging classes.dex into base APK');
  process.chdir(ROOT_DIR);

  // 6b. Normalize all path separators in base.apk to POSIX forward slashes
  fixZipSlashes(baseApk);

  // 7. Align APK with zipalign (4-byte boundary alignment)
  const alignedApk = path.join(INTERMEDIATE_DIR, 'app-aligned.apk');
  if (fs.existsSync(alignedApk)) fs.unlinkSync(alignedApk);
  run(`"${ZIPALIGN}" -f -p 4 "${baseApk}" "${alignedApk}"`, 'Aligning APK with Google Zipalign');

  // 8. Generate authentic production keystore if needed
  const keystoreFile = path.join(KEYSTORE_DIR, 'fr8x-release.keystore');
  if (!fs.existsSync(keystoreFile)) {
    run(`"${KEYTOOL}" -genkeypair -v -keystore "${keystoreFile}" -alias fr8x -keyalg RSA -keysize 2048 -validity 10000 -storepass fr8xenterprise -keypass fr8xenterprise -dname "CN=FR8X Enterprise, OU=Mobile Workspace, O=FR8X Inc, L=Mumbai, ST=MH, C=IN"`, 'Generating X.509 RSA Production Keystore');
  }

  // 9. Sign APK with Google apksigner (v1 + v2 + v3 schemes)
  const signedApk = path.join(DIST_DIR, 'fr8x-enterprise-mobile-v2.4.apk');
  if (fs.existsSync(signedApk)) fs.unlinkSync(signedApk);
  run(`call "${APKSIGNER}" sign --ks "${keystoreFile}" --ks-key-alias fr8x --ks-pass pass:fr8xenterprise --key-pass pass:fr8xenterprise --out "${signedApk}" "${alignedApk}"`, 'Signing APK with Google Apksigner (v1+v2+v3)');

  // 10. Verify APK signature
  run(`call "${APKSIGNER}" verify --verbose "${signedApk}"`, 'Verifying APK Signature Scheme');

  // 11. Dump badging info
  run(`"${AAPT2}" dump badging "${signedApk}"`, 'Inspecting APK Manifest & Metadata');

  // 12. Copy APK to distribution endpoints
  const targets = [
    path.join(ROOT_DIR, 'public', 'fr8x-enterprise-mobile-v2.4.apk'),
    path.join(ROOT_DIR, 'public', 'fr8x-mobile.apk'),
    path.join(ROOT_DIR, 'public', 'fr8x-workspace-debug.apk'),
    path.join(ROOT_DIR, 'fr8x-enterprise-mobile-v2.4.apk'),
    path.join(DIST_DIR, 'fr8x-workspace-debug.apk')
  ];

  for (const t of targets) {
    fs.copyFileSync(signedApk, t);
    console.log(`[DIST] Copied APK to: ${t} (${(fs.statSync(t).size / 1024).toFixed(1)} KB)`);
  }

  console.log('\n================================================================');
  console.log('  SUCCESS! 100% GENUINE, CERTIFIED ANDROID APK BUILT!');
  console.log(`  File: ${signedApk}`);
  console.log(`  Size: ${(fs.statSync(signedApk).size / 1024).toFixed(1)} KB`);
  console.log('================================================================\n');
}

build().catch(err => {
  console.error('\n[FATAL BUILD ERROR]:', err);
  process.exit(1);
});
