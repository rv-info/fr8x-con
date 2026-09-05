const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const TOOLS_DIR = path.resolve('C:\\Users\\RajatKumarRai\\.tools\\android-sdk');

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    if (fs.existsSync(destPath) && fs.statSync(destPath).size > 1000000) {
      console.log(`[SDK] Already cached: ${path.basename(destPath)} (${(fs.statSync(destPath).size / 1024 / 1024).toFixed(1)} MB)`);
      return resolve(destPath);
    }
    console.log(`[SDK] Downloading ${url} ...`);
    const file = fs.createWriteStream(destPath);
    
    function requestWithRedirect(currentUrl) {
      https.get(currentUrl, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return requestWithRedirect(res.headers.location);
        }
        if (res.statusCode !== 200) {
          file.close();
          fs.unlinkSync(destPath);
          return reject(new Error(`HTTP ${res.statusCode} for ${currentUrl}`));
        }
        const total = parseInt(res.headers['content-length'] || '0', 10);
        let downloaded = 0;
        let lastReport = 0;
        res.on('data', (chunk) => {
          downloaded += chunk.length;
          const now = Date.now();
          if (now - lastReport > 2000) {
            lastReport = now;
            const pct = total ? ((downloaded / total) * 100).toFixed(0) : '?';
            console.log(`[SDK] Downloading ${path.basename(destPath)}: ${pct}% (${(downloaded / 1024 / 1024).toFixed(1)} MB)`);
          }
        });
        res.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            console.log(`[SDK] Download complete: ${path.basename(destPath)} (${(downloaded / 1024 / 1024).toFixed(1)} MB)`);
            resolve(destPath);
          });
        });
      }).on('error', (err) => {
        file.close();
        if (fs.existsSync(destPath)) fs.unlinkSync(destPath);
        reject(err);
      });
    }

    requestWithRedirect(url);
  });
}

async function main() {
  if (!fs.existsSync(TOOLS_DIR)) {
    fs.mkdirSync(TOOLS_DIR, { recursive: true });
  }

  const buildToolsZip = path.join(TOOLS_DIR, 'build-tools_r34.zip');
  const platformZip = path.join(TOOLS_DIR, 'platform-33.zip');

  await downloadFile('https://dl.google.com/android/repository/build-tools_r34-windows.zip', buildToolsZip);
  await downloadFile('https://dl.google.com/android/repository/platform-33_r01.zip', platformZip);

  const buildToolsTarget = path.join(TOOLS_DIR, 'build-tools', '34.0.0');
  const platformTarget = path.join(TOOLS_DIR, 'platforms', 'android-33');

  if (!fs.existsSync(path.join(buildToolsTarget, 'aapt2.exe'))) {
    console.log('[SDK] Extracting build-tools to ' + buildToolsTarget);
    fs.mkdirSync(buildToolsTarget, { recursive: true });
    // Use tar -xf
    execSync(`tar -xf "${buildToolsZip}" -C "${TOOLS_DIR}"`, { stdio: 'inherit' });
    // Google zips contain "android-14" as root folder for build-tools
    const candidates = ['android-14', 'android-34', 'android-34.0.0'];
    let extractedDir = candidates.find(c => fs.existsSync(path.join(TOOLS_DIR, c)));
    if (extractedDir) {
      const src = path.join(TOOLS_DIR, extractedDir);
      const items = fs.readdirSync(src);
      for (const item of items) {
        fs.renameSync(path.join(src, item), path.join(buildToolsTarget, item));
      }
      fs.rmdirSync(src);
    }
  }

  if (!fs.existsSync(path.join(platformTarget, 'android.jar'))) {
    console.log('[SDK] Extracting platform to ' + platformTarget);
    fs.mkdirSync(platformTarget, { recursive: true });
    execSync(`tar -xf "${platformZip}" -C "${TOOLS_DIR}"`, { stdio: 'inherit' });
    const candidates = ['android-33', 'android-13', 'android-Tiramisu'];
    let extractedDir = candidates.find(c => fs.existsSync(path.join(TOOLS_DIR, c)));
    if (extractedDir) {
      const src = path.join(TOOLS_DIR, extractedDir);
      const items = fs.readdirSync(src);
      for (const item of items) {
        fs.renameSync(path.join(src, item), path.join(platformTarget, item));
      }
      fs.rmdirSync(src);
    }
  }

  console.log('[SDK] Setup successfully verified!');
  console.log('aapt2:', fs.existsSync(path.join(buildToolsTarget, 'aapt2.exe')));
  console.log('zipalign:', fs.existsSync(path.join(buildToolsTarget, 'zipalign.exe')));
  console.log('d8.bat:', fs.existsSync(path.join(buildToolsTarget, 'd8.bat')));
  console.log('android.jar:', fs.existsSync(path.join(platformTarget, 'android.jar')));
}

main().catch(err => {
  console.error('[SDK Error]', err);
  process.exit(1);
});
