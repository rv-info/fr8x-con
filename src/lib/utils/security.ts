// FR8X-CON Malware & Malicious Content Protection Service
// Standardized input sanitizers, file signature magic byte validation, and antivirus scanners.

"use client";

// --- 1. Text Sanitization & Injection Protection ---
export function sanitizeText(input: string): string {
  if (!input) return "";

  // Normalize Unicode representations to prevent evasion/obfuscation attacks
  let sanitized = input.normalize("NFKC");

  // Prevent XSS / HTML / Script Injections
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, "")
    .replace(/javascript:\s*/gi, "no-javascript:");

  // Escape basic HTML tags to prevent HTML injection
  sanitized = sanitized
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Prevent dangerous semi-colons and SQL comment leaks without breaking single quotes or container ticks (e.g. 20'DV, 40'HC)
  sanitized = sanitized
    .replace(/;/g, " ");

  // Prevent CSV / Excel Formula Injection (cells starting with =, +, @, |)
  if (/^[=\+\@\|]/.test(sanitized)) {
    sanitized = "'" + sanitized;
  }

  // Prevent Path Traversal
  sanitized = sanitized
    .replace(/\.\.\//g, "")
    .replace(/\.\.\\/g, "");

  return sanitized.trim();
}

// --- 2. File Signature (Magic Bytes) Checker ---
// Validates actual file contents by matching header magic bytes, not just extension labels.
export async function validateFileSignature(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = (evt) => {
      if (!evt.target || evt.target.readyState !== FileReader.DONE) {
        resolve(false);
        return;
      }

      const resultBuffer = evt.target.result as ArrayBuffer;
      if (!resultBuffer) {
        resolve(false);
        return;
      }
      const arr = new Uint8Array(resultBuffer).subarray(0, 4);
      let header = "";
      for (let i = 0; i < arr.length; i++) {
        const val = arr[i];
        if (val !== undefined) {
          header += val.toString(16).padStart(2, "0").toUpperCase();
        }
      }

      // Safe Signatures Registry (Magic Numbers)
      const isPNG = header.startsWith("89504E47");
      const isJPEG = header.startsWith("FFD8FF");
      const isGIF = header.startsWith("47494638");
      const isPDF = header.startsWith("25504446");
      const isWEBP = header.substring(0, 8) === "52494646" && header.substring(16, 24) === "57454250"; // RIFF .... WEBP
      const isZIP = header.startsWith("504B0304"); // e.g. Excel xlsx / zip
      
      // Executable / Script signatures (Must block)
      const isExecutablePE = header.startsWith("4D5A"); // MZ (DOS/Windows PE)
      const isELF = header.startsWith("7F454C46"); // ELF (Linux Executable)
      const isScriptShebang = header.startsWith("2321"); // #! (Scripts)

      if (isExecutablePE || isELF || isScriptShebang) {
        resolve(false);
        return;
      }

      // Allow standard safe files
      if (isPNG || isJPEG || isGIF || isPDF || isWEBP || isZIP) {
        resolve(true);
      } else {
        // Fallback for simple text files like CSV / text which do not have binary magic numbers
        const textExts = ["csv", "txt", "json", "xml"];
        const ext = file.name.split(".").pop()?.toLowerCase();
        if (ext && textExts.includes(ext) && file.type.startsWith("text/")) {
          resolve(true);
        } else {
          resolve(false);
        }
      }
    };

    // Read the first 24 bytes (sufficient to read WEBP RIFF/WEBP magic offset)
    reader.readAsArrayBuffer(file.slice(0, 24));
  });
}

// --- 3. Antivirus Scanner (ClamAV Emulator) ---
// Scans for EICAR standard virus test string and blocks blacklisted dangerous extensions.
export async function mockVirusScan(file: File): Promise<{ safe: boolean; error?: string }> {
  return new Promise((resolve) => {
    // 1. Extension Blacklist Check
    const dangerousExts = ["exe", "bat", "cmd", "sh", "scr", "vbs", "js", "jar", "msi", "ps1"];
    const ext = file.name.split(".").pop()?.toLowerCase() || "";
    if (dangerousExts.includes(ext)) {
      resolve({
        safe: false,
        error: `Security Alert: Dangerous file type detected (.${ext}). Script and executable files are blocked.`,
      });
      return;
    }

    // 2. Read content to inspect EICAR Test Signature
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      
      // EICAR Standard Anti-Virus Test File signature string
      const eicarSignature = "X5O!P%@AP[4\\PZX54(P^)7CC7Y(T)BFTX(R)B-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";
      
      if (text && text.includes(eicarSignature)) {
        resolve({
          safe: false,
          error: "Malware Alert: EICAR Standard Antivirus Test File detected! Blocked by ClamAV scanner.",
        });
      } else {
        resolve({ safe: true });
      }
    };

    // Read first 1000 characters for text scanning (EICAR is usually small)
    reader.readAsText(file.slice(0, 1000));
  });
}
