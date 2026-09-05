const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b1320"/>
      <stop offset="50%" stop-color="#081b33"/>
      <stop offset="100%" stop-color="#020813"/>
    </linearGradient>
    <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="accentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2dd4bf"/>
      <stop offset="100%" stop-color="#0ea5e9"/>
    </linearGradient>
  </defs>

  <!-- App Background -->
  <rect width="512" height="512" rx="112" fill="url(#bgGrad)"/>
  <rect x="20" y="20" width="472" height="472" rx="92" fill="none" stroke="url(#accentGrad)" stroke-width="4" stroke-opacity="0.5"/>

  <!-- Freight Container Iso Icon -->
  <g transform="translate(256, 205)">
    <!-- Main hexagon frame -->
    <path d="M0 -110 L105 -50 L105 60 L0 120 L-105 60 L-105 -50 Z" fill="#0f2642" stroke="url(#cyanGrad)" stroke-width="8" stroke-linejoin="round"/>
    <!-- Internal cube edges -->
    <path d="M0 0 L105 -50 M0 0 L-105 -50 M0 0 L0 120" stroke="#38bdf8" stroke-width="6" stroke-linecap="round"/>
    
    <!-- Isometric container rib lines -->
    <line x1="-52" y1="-25" x2="-52" y2="85" stroke="#2dd4bf" stroke-width="4" stroke-opacity="0.8"/>
    <line x1="52" y1="-25" x2="52" y2="85" stroke="#2dd4bf" stroke-width="4" stroke-opacity="0.8"/>
    <line x1="-50" y1="-75" x2="0" y2="-50" stroke="#38bdf8" stroke-width="3" stroke-opacity="0.6"/>
    <line x1="0" y1="-50" x2="50" y2="-75" stroke="#38bdf8" stroke-width="3" stroke-opacity="0.6"/>
  </g>

  <!-- FR8X Monogram -->
  <text x="256" y="395" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="900" font-size="64" fill="#ffffff" text-anchor="middle" letter-spacing="3">FR8<tspan fill="#38bdf8">X</tspan></text>
  <text x="256" y="435" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-weight="700" font-size="19" fill="#94a3b8" text-anchor="middle" letter-spacing="5">ENTERPRISE MOBILE</text>
</svg>
`;

const outPath = path.join(__dirname, '..', 'fr8x-android-app', 'mobile-app', 'icon.png');

sharp(Buffer.from(svg))
  .resize(512, 512)
  .png()
  .toFile(outPath)
  .then(() => {
    console.log('[ICON] Created 512x512 app icon at:', outPath);
  })
  .catch(err => {
    console.error('[ICON ERROR]', err);
    process.exit(1);
  });
