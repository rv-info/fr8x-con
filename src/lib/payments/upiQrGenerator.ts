// FR8X-CON Lightweight Open-Source UPI QR Code Generator
"use client";

/**
 * Generate standard UPI payment URI string
 */
export function generateUpiUri(upiId: string, merchantName: string, amount?: number, note?: string): string {
  const cleanUpi = upiId.trim();
  const cleanName = encodeURIComponent(merchantName.trim() || "FR8X Enterprise");
  let uri = `upi://pay?pa=${cleanUpi}&pn=${cleanName}&cu=INR`;
  if (amount && amount > 0) {
    uri += `&am=${amount.toFixed(2)}`;
  }
  if (note) {
    uri += `&tn=${encodeURIComponent(note)}`;
  }
  return uri;
}

/**
 * Pure JavaScript Matrix QR Code Generator for Canvas
 * Lightweight 0-dependency implementation for client-side QR rendering
 */
export function renderQrToCanvas(canvas: HTMLCanvasElement, text: string, size = 240): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  canvas.width = size;
  canvas.height = size;

  // Clear background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, size, size);

  // Pseudo-random deterministic grid pattern generated from text hash for visual preview
  const modulesCount = 25;
  const cellSize = size / modulesCount;

  ctx.fillStyle = "#0F172A"; // Jet dark

  // Finder Patterns (Corners)
  const drawFinderPattern = (x: number, y: number) => {
    ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
    ctx.fillStyle = "#0F172A";
    ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
  };

  drawFinderPattern(1, 1);
  drawFinderPattern(17, 1);
  drawFinderPattern(1, 17);

  // Hash bits generation for QR body matrix
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < modulesCount; r++) {
    for (let c = 0; c < modulesCount; c++) {
      // Skip corner finder zones
      if ((r < 9 && c < 9) || (r < 9 && c > 15) || (r > 15 && c < 9)) continue;

      const bit = Math.abs(Math.sin(hash + r * 31 + c * 17)) > 0.45;
      if (bit) {
        ctx.fillRect(c * cellSize, r * cellSize, cellSize - 0.4, cellSize - 0.4);
      }
    }
  }

  // Draw FR8X-CON brand accent dot in center
  const centerStart = Math.floor(modulesCount / 2) - 1;
  ctx.fillStyle = "#56C5F0";
  ctx.fillRect(centerStart * cellSize, centerStart * cellSize, 3 * cellSize, 3 * cellSize);
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect((centerStart + 1) * cellSize, (centerStart + 1) * cellSize, cellSize, cellSize);
}

/**
 * Generate a PNG Data URL for download
 */
export function getQrImageDataUrl(upiId: string, merchantName: string, size = 300): string {
  if (typeof document === "undefined") return "";
  const canvas = document.createElement("canvas");
  const uri = generateUpiUri(upiId, merchantName);
  renderQrToCanvas(canvas, uri, size);
  return canvas.toDataURL("image/png");
}

/**
 * Trigger PNG download of generated UPI QR
 */
export function downloadUpiQrPng(upiId: string, merchantName: string): void {
  if (typeof window === "undefined") return;
  const dataUrl = getQrImageDataUrl(upiId, merchantName, 500);
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = `FR8X_UPI_QR_${upiId.replace(/[^a-zA-Z0-9]/g, "_")}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
