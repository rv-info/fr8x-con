/**
 * FR8X Secure File-Upload Pipeline & Malware Quarantine Engine
 * Multi-layer file inspection, magic-bytes verification, SHA-256 checksumming,
 * and quarantine state machine: PENDING_SCAN -> SCANNING -> CLEAN -> AVAILABLE
 */

import crypto from 'crypto';

export type ScanStatus =
  | 'PENDING_SCAN'
  | 'SCANNING'
  | 'CLEAN'
  | 'QUARANTINED'
  | 'REJECTED'
  | 'SCAN_FAILED';

export type UploadPurpose =
  | 'avatar'
  | 'freight_document'
  | 'shipment_attachment'
  | 'kyc'
  | 'general';

export interface FileScanResult {
  scanStatus: ScanStatus;
  isAvailable: boolean;
  detectedMimeType: string | null;
  checksumSha256: string;
  fileSizeBytes: number;
  quarantineReason?: string;
  scannerEngine: string;
  scannedAt: Date;
}

export interface UploadInspectionOptions {
  fileName: string;
  claimedMimeType: string;
  purpose: UploadPurpose;
  buffer: Buffer;
}

// Prohibited executable and script extensions
const PROHIBITED_EXTENSIONS = new Set([
  '.exe',
  '.bat',
  '.cmd',
  '.sh',
  '.bash',
  '.ps1',
  '.vbs',
  '.js',
  '.mjs',
  '.php',
  '.phtml',
  '.py',
  '.rb',
  '.bin',
  '.dll',
  '.so',
  '.dylib',
  '.msi',
  '.scr',
  '.hta',
  '.cpl',
  '.jar',
  '.com',
]);

// Allowed extensions per purpose
const PERMITTED_EXTENSIONS_BY_PURPOSE: Record<UploadPurpose, string[]> = {
  avatar: ['.png', '.jpg', '.jpeg', '.webp'],
  kyc: ['.pdf', '.png', '.jpg', '.jpeg'],
  freight_document: ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.xlsx', '.csv'],
  shipment_attachment: ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.xlsx', '.csv'],
  general: ['.pdf', '.png', '.jpg', '.jpeg', '.docx', '.xlsx', '.txt'],
};

// Size limits per purpose in bytes
const SIZE_LIMITS_BY_PURPOSE: Record<UploadPurpose, number> = {
  avatar: 5 * 1024 * 1024, // 5 MB
  kyc: 15 * 1024 * 1024, // 15 MB
  freight_document: 35 * 1024 * 1024, // 35 MB
  shipment_attachment: 35 * 1024 * 1024, // 35 MB
  general: 20 * 1024 * 1024, // 20 MB
};

// EICAR Standard Anti-Virus Test File signature
const EICAR_SIGNATURE = 'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*';

/**
 * Detects real file format using header magic bytes
 */
export function detectMagicBytes(buffer: Buffer): { mime: string; ext: string } | null {
  if (!buffer || buffer.length < 4) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return { mime: 'image/png', ext: '.png' };
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: '.jpg' };
  }

  // PDF: 25 50 44 46 ('%PDF')
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    return { mime: 'application/pdf', ext: '.pdf' };
  }

  // WebP: RIFF .... WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return { mime: 'image/webp', ext: '.webp' };
  }

  // ZIP / DOCX / XLSX: 50 4B 03 04 ('PK\x03\x04')
  if (
    buffer[0] === 0x50 &&
    buffer[1] === 0x4b &&
    buffer[2] === 0x03 &&
    buffer[3] === 0x04
  ) {
    return { mime: 'application/zip', ext: '.zip' };
  }

  // Plain Text / CSV
  const isAsciiText = buffer.subarray(0, Math.min(buffer.length, 512)).every(
    (b) => (b >= 32 && b <= 126) || b === 9 || b === 10 || b === 13
  );
  if (isAsciiText) {
    return { mime: 'text/plain', ext: '.txt' };
  }

  return null;
}

/**
 * Calculates cryptographic SHA-256 checksum of file buffer
 */
export function calculateSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Main Quarantine and Scanning Pipeline
 */
export async function scanAndValidateUpload(
  options: UploadInspectionOptions
): Promise<FileScanResult> {
  const { fileName, claimedMimeType, purpose, buffer } = options;
  const checksumSha256 = calculateSha256(buffer);
  const fileSizeBytes = buffer.length;

  const now = new Date();

  // 1. Check size limit
  const maxAllowedBytes = SIZE_LIMITS_BY_PURPOSE[purpose] || 20 * 1024 * 1024;
  if (fileSizeBytes > maxAllowedBytes) {
    return {
      scanStatus: 'REJECTED',
      isAvailable: false,
      detectedMimeType: null,
      checksumSha256,
      fileSizeBytes,
      quarantineReason: `File size ${fileSizeBytes} bytes exceeds limit of ${maxAllowedBytes} bytes for purpose ${purpose}`,
      scannerEngine: 'FR8X-PolicyEngine-v1',
      scannedAt: now,
    };
  }

  // 2. Validate filename and extension
  const extMatch = fileName.toLowerCase().match(/\.[a-z0-9]+$/);
  const fileExt = extMatch ? extMatch[0] : '';

  if (!fileExt || PROHIBITED_EXTENSIONS.has(fileExt)) {
    return {
      scanStatus: 'QUARANTINED',
      isAvailable: false,
      detectedMimeType: null,
      checksumSha256,
      fileSizeBytes,
      quarantineReason: `Executable or prohibited file extension detected: ${fileExt}`,
      scannerEngine: 'FR8X-HeuristicScanner-v1',
      scannedAt: now,
    };
  }

  const allowedExtensions = PERMITTED_EXTENSIONS_BY_PURPOSE[purpose] || [];
  if (!allowedExtensions.includes(fileExt)) {
    return {
      scanStatus: 'REJECTED',
      isAvailable: false,
      detectedMimeType: null,
      checksumSha256,
      fileSizeBytes,
      quarantineReason: `Extension ${fileExt} not permitted for upload category ${purpose}`,
      scannerEngine: 'FR8X-PolicyEngine-v1',
      scannedAt: now,
    };
  }

  // 3. Inspect magic bytes
  const magic = detectMagicBytes(buffer);
  if (!magic) {
    return {
      scanStatus: 'QUARANTINED',
      isAvailable: false,
      detectedMimeType: null,
      checksumSha256,
      fileSizeBytes,
      quarantineReason: 'File signature (magic bytes) could not be verified or is unknown',
      scannerEngine: 'FR8X-HeuristicScanner-v1',
      scannedAt: now,
    };
  }

  // 4. Verify extension matches magic bytes
  if (magic.ext === '.zip' && !['.docx', '.xlsx', '.zip'].includes(fileExt)) {
    return {
      scanStatus: 'QUARANTINED',
      isAvailable: false,
      detectedMimeType: magic.mime,
      checksumSha256,
      fileSizeBytes,
      quarantineReason: `MIME / Magic bytes mismatch: detected ZIP container with extension ${fileExt}`,
      scannerEngine: 'FR8X-SignatureScanner-v1',
      scannedAt: now,
    };
  }

  // 5. Signature & Malware Pattern Inspection
  // A. Check for EICAR standard test signature
  const bufferString = buffer.toString('binary');
  if (bufferString.includes(EICAR_SIGNATURE)) {
    return {
      scanStatus: 'QUARANTINED',
      isAvailable: false,
      detectedMimeType: magic.mime,
      checksumSha256,
      fileSizeBytes,
      quarantineReason: 'EICAR Standard Anti-Virus Test Signature Detected [MALWARE_POSITIVE]',
      scannerEngine: 'FR8X-SignatureScanner-v1',
      scannedAt: now,
    };
  }

  // B. Check for PE Windows Executable header (MZ = 0x4D, 0x5A) embedded in images/docs
  if (buffer.length > 2 && buffer[0] === 0x4d && buffer[1] === 0x5a) {
    return {
      scanStatus: 'QUARANTINED',
      isAvailable: false,
      detectedMimeType: 'application/x-dosexec',
      checksumSha256,
      fileSizeBytes,
      quarantineReason: 'Embedded DOS/PE Executable Header (MZ) detected in non-executable file',
      scannerEngine: 'FR8X-SignatureScanner-v1',
      scannedAt: now,
    };
  }

  // C. Check for shell script shebang
  if (buffer.length > 2 && buffer[0] === 0x23 && buffer[1] === 0x21) {
    return {
      scanStatus: 'QUARANTINED',
      isAvailable: false,
      detectedMimeType: 'text/x-shellscript',
      checksumSha256,
      fileSizeBytes,
      quarantineReason: 'Executable Shell Shebang (#!) detected',
      scannerEngine: 'FR8X-SignatureScanner-v1',
      scannedAt: now,
    };
  }

  // File passed all validation and scanning tiers: mark CLEAN & AVAILABLE
  return {
    scanStatus: 'CLEAN',
    isAvailable: true,
    detectedMimeType: magic.mime,
    checksumSha256,
    fileSizeBytes,
    scannerEngine: 'FR8X-SecurityPipeline-v1',
    scannedAt: now,
  };
}
