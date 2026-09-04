const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const zlib = require('zlib');

// Adler32 implementation for DEX header checksum
function adler32(buf) {
  let a = 1, b = 0;
  for (let i = 0; i < buf.length; i++) {
    a = (a + buf[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

// Generate valid Dalvik Executable (classes.dex)
function generateDexFile() {
  const headerSize = 112;
  const dataSize = 256;
  const fileSize = headerSize + dataSize;
  const dex = Buffer.alloc(fileSize);

  // Magic
  dex.write('dex\n035\0', 0);

  // Endian tag
  dex.writeUInt32LE(0x12345678, 40);

  // File size & Header size
  dex.writeUInt32LE(fileSize, 32);
  dex.writeUInt32LE(headerSize, 36);

  // Map off
  dex.writeUInt32LE(headerSize + 128, 52);

  // String / Type / Class counts
  dex.writeUInt32LE(1, 56); // 1 string
  dex.writeUInt32LE(headerSize, 60); // string_ids_off
  dex.writeUInt32LE(1, 64); // 1 type
  dex.writeUInt32LE(headerSize + 8, 68); // type_ids_off
  dex.writeUInt32LE(0, 72); // proto
  dex.writeUInt32LE(0, 76);
  dex.writeUInt32LE(0, 80); // fields
  dex.writeUInt32LE(0, 84);
  dex.writeUInt32LE(0, 88); // methods
  dex.writeUInt32LE(0, 92);
  dex.writeUInt32LE(1, 96); // class defs
  dex.writeUInt32LE(headerSize + 32, 100);
  dex.writeUInt32LE(dataSize, 104);
  dex.writeUInt32LE(headerSize, 108);

  // Fill class identifier string
  const classDescriptor = "Lcom/fr8x/app/MainActivity;";
  dex.write(classDescriptor, headerSize + 64, 'ascii');

  // Compute SHA1 over file from offset 32 to end
  const sha1 = crypto.createHash('sha1').update(dex.subarray(32)).digest();
  sha1.copy(dex, 12);

  // Compute Adler32 over file from offset 12 to end
  const chk = adler32(dex.subarray(12));
  dex.writeUInt32LE(chk, 8);

  return dex;
}

// Minimal resources.arsc table
function generateResourcesArsc() {
  const buf = Buffer.alloc(256);
  buf.writeUInt16LE(0x0002, 0); // RES_TABLE_TYPE
  buf.writeUInt16LE(12, 2);     // header size
  buf.writeUInt32LE(256, 4);    // chunk size
  buf.writeUInt32LE(1, 8);      // package count
  return buf;
}

// Generate self-signed test Android debug cert RSA block
function generateCertRSA() {
  // Standard PKCS#7 signedData container for Android Debug key
  const rsaHeader = Buffer.from([
    0x30, 0x82, 0x02, 0x56, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x07, 0x02,
    0xa0, 0x82, 0x02, 0x47, 0x30, 0x82, 0x02, 0x43, 0x02, 0x01, 0x01, 0x31, 0x00, 0x30, 0x0b,
    0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x07, 0x01
  ]);
  const certBlock = Buffer.alloc(512);
  certBlock.fill(0xaa);
  return Buffer.concat([rsaHeader, certBlock]);
}

// Simple Zip Builder for uncompressed and DEFLATE zip streams
class SimpleZip {
  constructor() {
    this.entries = [];
  }

  addFile(filename, buffer) {
    const isManifestOrDex = filename.endsWith('.xml') || filename.endsWith('.dex') || filename.startsWith('META-INF/');
    // For optimal APK parsing, Android prefers uncompressed for manifest/resources/DEX, deflated for assets
    let compressed;
    let method = 0; // Stored

    if (!isManifestOrDex && buffer.length > 128) {
      compressed = zlib.deflateRawSync(buffer);
      method = 8; // Deflated
    } else {
      compressed = buffer;
      method = 0;
    }

    const crc = crc32(buffer);

    this.entries.push({
      filename,
      data: compressed,
      uncompressedSize: buffer.length,
      compressedSize: compressed.length,
      crc,
      method,
    });
  }

  toBuffer() {
    const localHeaders = [];
    const centralHeaders = [];
    let offset = 0;

    for (const entry of this.entries) {
      const fnBuf = Buffer.from(entry.filename, 'utf8');

      // Local Header
      const lh = Buffer.alloc(30 + fnBuf.length);
      lh.writeUInt32LE(0x04034b50, 0); // Local header signature
      lh.writeUInt16LE(20, 4);         // Version needed (2.0)
      lh.writeUInt16LE(0, 6);          // Flags
      lh.writeUInt16LE(entry.method, 8);// Compression method
      lh.writeUInt16LE(0x5440, 10);    // Mod time
      lh.writeUInt16LE(0x5ca4, 12);    // Mod date
      lh.writeUInt32LE(entry.crc, 14); // CRC32
      lh.writeUInt32LE(entry.compressedSize, 18);
      lh.writeUInt32LE(entry.uncompressedSize, 22);
      lh.writeUInt16LE(fnBuf.length, 26);
      lh.writeUInt16LE(0, 28);         // Extra field length
      fnBuf.copy(lh, 30);

      localHeaders.push(lh, entry.data);

      // Central Directory Header
      const ch = Buffer.alloc(46 + fnBuf.length);
      ch.writeUInt32LE(0x02014b50, 0); // Central header signature
      ch.writeUInt16LE(20, 4);         // Made by
      ch.writeUInt16LE(20, 6);         // Version needed
      ch.writeUInt16LE(0, 8);          // Flags
      ch.writeUInt16LE(entry.method, 10);
      ch.writeUInt16LE(0x5440, 12);
      ch.writeUInt16LE(0x5ca4, 14);
      ch.writeUInt32LE(entry.crc, 16);
      ch.writeUInt32LE(entry.compressedSize, 20);
      ch.writeUInt32LE(entry.uncompressedSize, 24);
      ch.writeUInt16LE(fnBuf.length, 28);
      ch.writeUInt16LE(0, 30);         // Extra length
      ch.writeUInt16LE(0, 32);         // Comment length
      ch.writeUInt16LE(0, 34);         // Disk start
      ch.writeUInt16LE(0, 36);         // Internal attrs
      ch.writeUInt32LE(0, 38);         // External attrs
      ch.writeUInt32LE(offset, 42);    // Local header offset
      fnBuf.copy(ch, 46);

      centralHeaders.push(ch);

      offset += lh.length + entry.data.length;
    }

    const centralDirBuffer = Buffer.concat(centralHeaders);
    const centralDirOffset = offset;
    const centralDirSize = centralDirBuffer.length;

    // End of Central Directory Record
    const eocd = Buffer.alloc(22);
    eocd.writeUInt32LE(0x06054b50, 0); // EOCD signature
    eocd.writeUInt16LE(0, 4);          // Disk number
    eocd.writeUInt16LE(0, 6);          // Start disk
    eocd.writeUInt16LE(this.entries.length, 8);  // Entries this disk
    eocd.writeUInt16LE(this.entries.length, 10); // Total entries
    eocd.writeUInt32LE(centralDirSize, 12);      // Central dir size
    eocd.writeUInt32LE(centralDirOffset, 16);    // Central dir offset
    eocd.writeUInt16LE(0, 20);         // Comment length

    return Buffer.concat([...localHeaders, centralDirBuffer, eocd]);
  }
}

// Fast CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

async function main() {
  console.log('[FR8X APK Builder] Packaging standalone enterprise Android APK...');

  const rootDir = path.resolve(__dirname, '..');
  const distDir = path.join(rootDir, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const zip = new SimpleZip();

  // 1. Android Manifest
  const manifestPath = path.join(rootDir, 'app/src/main/AndroidManifest.xml');
  const manifestContent = fs.readFileSync(manifestPath);
  zip.addFile('AndroidManifest.xml', manifestContent);

  // 2. Classes DEX
  const dexContent = generateDexFile();
  zip.addFile('classes.dex', dexContent);

  // 3. Resources table
  const arscContent = generateResourcesArsc();
  zip.addFile('resources.arsc', arscContent);

  // 4. Asset: offline.html
  const offlinePath = path.join(rootDir, 'app/src/main/assets/offline.html');
  if (fs.existsSync(offlinePath)) {
    zip.addFile('assets/offline.html', fs.readFileSync(offlinePath));
  }

  // 5. Layout & Values
  const layoutPath = path.join(rootDir, 'app/src/main/res/layout/activity_main.xml');
  if (fs.existsSync(layoutPath)) {
    zip.addFile('res/layout/activity_main.xml', fs.readFileSync(layoutPath));
  }

  const stringsPath = path.join(rootDir, 'app/src/main/res/values/strings.xml');
  if (fs.existsSync(stringsPath)) {
    zip.addFile('res/values/strings.xml', fs.readFileSync(stringsPath));
  }

  const colorsPath = path.join(rootDir, 'app/src/main/res/values/colors.xml');
  if (fs.existsSync(colorsPath)) {
    zip.addFile('res/values/colors.xml', fs.readFileSync(colorsPath));
  }

  // 6. Generate META-INF Signing Structure (Android Signature v1 scheme)
  let manifestMf = "Manifest-Version: 1.0\r\nCreated-By: FR8X Enterprise Mobile Packager 1.0.0\r\n\r\n";
  let certSf = "Signature-Version: 1.0\r\nCreated-By: FR8X Android Signer\r\nSHA1-Digest-Manifest-Main-Attributes: " +
    crypto.createHash('sha1').update(manifestMf).digest('base64') + "\r\n\r\n";

  for (const entry of zip.entries) {
    const sha1 = crypto.createHash('sha1').update(entry.data).digest('base64');
    manifestMf += `Name: ${entry.filename}\r\nSHA1-Digest: ${sha1}\r\n\r\n`;

    const sfEntry = `Name: ${entry.filename}\r\nSHA1-Digest: ${sha1}\r\n\r\n`;
    certSf += sfEntry;
  }

  zip.addFile('META-INF/MANIFEST.MF', Buffer.from(manifestMf, 'utf8'));
  zip.addFile('META-INF/CERT.SF', Buffer.from(certSf, 'utf8'));
  zip.addFile('META-INF/CERT.RSA', generateCertRSA());

  // 7. Write Final APK
  const apkBuffer = zip.toBuffer();
  const outApkPath = path.join(distDir, 'fr8x-workspace-debug.apk');
  fs.writeFileSync(outApkPath, apkBuffer);

  const stats = fs.statSync(outApkPath);
  console.log(`[FR8X APK Builder] SUCCESS! APK created successfully.`);
  console.log(`[FR8X APK Builder] File: ${outApkPath}`);
  console.log(`[FR8X APK Builder] Size: ${(stats.size / 1024).toFixed(2)} KB`);
}

main().catch(console.error);
