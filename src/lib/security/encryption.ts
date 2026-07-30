// FR8X-CON High-Security Encryption & Hashing Utility Module
// Powered by Web Crypto API (AES-256-GCM & PBKDF2) for edge & client compatibility.

const DEFAULT_SECRET = process.env.ENCRYPTION_SECRET || "fr8x-con-enterprise-godmode-sec-key-2026";
const ITERATIONS = 100000;
const KEY_LEN = 256;

/**
 * Derives a CryptoKey from a secret passphrase using PBKDF2
 */
async function deriveKey(secret: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: KEY_LEN },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypt plaintext string into an AES-256-GCM formatted payload
 * Format: hex(salt:16bytes) + ":" + hex(iv:12bytes) + ":" + hex(ciphertext)
 */
export async function encryptData(text: string, customSecret?: string): Promise<string> {
  if (!text) return "";
  const secret = customSecret || DEFAULT_SECRET;
  const enc = new TextEncoder();
  const data = enc.encode(text);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(secret, salt);

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    key,
    data as unknown as BufferSource
  );

  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const ivHex = Array.from(iv).map((b) => b.toString(16).padStart(2, "0")).join("");
  const ciphertextHex = Array.from(new Uint8Array(encryptedBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return `${saltHex}:${ivHex}:${ciphertextHex}`;
}

/**
 * Decrypt an AES-256-GCM formatted payload back to plaintext
 */
export async function decryptData(encryptedString: string, customSecret?: string): Promise<string> {
  if (!encryptedString) return "";
  try {
    const parts = encryptedString.split(":");
    if (parts.length !== 3) return encryptedString; // Return as-is if unencrypted fallback

    const [saltHex, ivHex, ciphertextHex] = parts;
    if (!saltHex || !ivHex || !ciphertextHex) return encryptedString;

    const secret = customSecret || DEFAULT_SECRET;

    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);
    const ciphertext = new Uint8Array(ciphertextHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || []);

    const key = await deriveKey(secret, salt);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as unknown as BufferSource },
      key,
      ciphertext as unknown as BufferSource
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch {
    console.error("AES-256-GCM decryption failed.");
    return "";
  }
}

/**
 * One-way SHA-256 hash helper for sensitive tokens & emails
 */
export async function sha256Hash(input: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Mask sensitive user identifier for audit logs (e.g. j***n@domain.com)
 */
export function maskIdentifier(identifier: string): string {
  if (!identifier) return "****";
  if (identifier.includes("@")) {
    const parts = identifier.split("@");
    const user = parts[0] || "";
    const domain = parts[1] || "";
    if (user.length <= 2) return `${user[0] || ""}*@${domain}`;
    return `${user[0]}${"*".repeat(user.length - 2)}${user[user.length - 1]}@${domain}`;
  }
  if (identifier.length <= 4) return "****";
  return `${identifier.slice(0, 2)}${"*".repeat(identifier.length - 4)}${identifier.slice(-2)}`;
}
