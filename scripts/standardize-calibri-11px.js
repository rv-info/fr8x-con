const fs = require('fs');
const path = require('path');

console.log('=== STANDARDIZING CALIBRI 11PX & 5-COLOUR GREEN PALETTE ===\n');

// 1. Process app/globals.css
const globalsPath = path.join(__dirname, '../app/globals.css');
let globals = fs.readFileSync(globalsPath, 'utf8');

// Replace html and body base declarations
globals = globals.replace(
  /html\s*\{[\s\S]*?font-size:\s*14px;[\s\S]*?\}/,
  `html {
  font-size: 11px !important;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: var(--fr8x-canvas, #FAFBF7) !important;
}`
);

globals = globals.replace(
  /@media\s*\(max-width:\s*767px\)\s*\{\s*html\s*\{\s*font-size:\s*13\.5px;\s*\}\s*\}/,
  `@media (max-width: 767px) {
  html {
    font-size: 11px !important;
  }
}`
);

globals = globals.replace(
  /@media\s*\(min-width:\s*768px\)\s*and\s*\(max-width:\s*1023px\)\s*\{\s*html\s*\{\s*font-size:\s*14px;\s*\}\s*\}/,
  `@media (min-width: 768px) and (max-width: 1023px) {
  html {
    font-size: 11px !important;
  }
}`
);

globals = globals.replace(
  /body\s*\{[\s\S]*?font:\s*400\s*1rem\/1\.5[\s\S]*?color:\s*var\(--fr8x-text-primary,\s*#000000\);[\s\S]*?\}/,
  `body {
  background: var(--fr8x-canvas, #FAFBF7) !important;
  background-color: var(--fr8x-canvas, #FAFBF7) !important;
  font: 400 11px/1.4 Calibri, sans-serif !important;
  font-family: Calibri, sans-serif !important;
  color: var(--fr8x-text-primary, #12372A) !important;
  min-height: 100vh;
  overflow-x: hidden;
}`
);

fs.writeFileSync(globalsPath, globals, 'utf8');
console.log('✔ app/globals.css updated.');

// 2. Process app/people-network.css
const pnPath = path.join(__dirname, '../app/people-network.css');
let pn = fs.readFileSync(pnPath, 'utf8');

// Replace black and light grey with palette
pn = pn.replace(/#000000/g, '#12372A');
pn = pn.replace(/#E6E6E6/g, '#DDE7E1');

// Replace connection-btn connect colors
pn = pn.replace(
  /\.connection-btn\.connect\s*\{[\s\S]*?\}/,
  `.connection-btn.connect {
  background: #3FA66B !important;
  color: #FFFFFF !important;
  border-color: #3FA66B !important;
}`
);

pn = pn.replace(
  /\.connection-btn\.connect:hover:not\(:disabled\)\s*\{[\s\S]*?\}/,
  `.connection-btn.connect:hover:not(:disabled) {
  background: #348E5B !important;
  color: #FFFFFF !important;
  border-color: #348E5B !important;
}`
);

// Normalize font sizes in people-network.css
pn = pn.replace(/font-size:\s*(\d+(\.\d+)?(px|rem));/g, 'font-size: 11px !important;');

fs.writeFileSync(pnPath, pn, 'utf8');
console.log('✔ app/people-network.css updated.');

// 3. Process components/ui/UserAvatar.tsx
const userAvatarPath = path.join(__dirname, '../components/ui/UserAvatar.tsx');
let ua = fs.readFileSync(userAvatarPath, 'utf8');
ua = ua.replace(/#E6E6E6/g, '#E8F7EF');
ua = ua.replace(/#000000/g, '#12372A');
ua = ua.replace(/fontSize:\s*computedFontSize/g, "fontSize: '11px'");
fs.writeFileSync(userAvatarPath, ua, 'utf8');
console.log('✔ components/ui/UserAvatar.tsx updated.');

// 4. Process components/ui/GoldenTick.tsx
const goldenTickPath = path.join(__dirname, '../components/ui/GoldenTick.tsx');
let gt = fs.readFileSync(goldenTickPath, 'utf8');
gt = gt.replace(/fill="#000000"/g, 'fill="#12372A"');
fs.writeFileSync(goldenTickPath, gt, 'utf8');
console.log('✔ components/ui/GoldenTick.tsx updated.');

// 5. Process components/ui/EmptyState.tsx
const emptyStatePath = path.join(__dirname, '../components/ui/EmptyState.tsx');
let es = fs.readFileSync(emptyStatePath, 'utf8');
es = es.replace(/#E6E6E6/g, '#DDE7E1');
es = es.replace(/#000000/g, '#12372A');
es = es.replace(/fontSize:\s*'14px'/g, "fontSize: '11px'");
es = es.replace(/fontSize:\s*'12px'/g, "fontSize: '11px'");
fs.writeFileSync(emptyStatePath, es, 'utf8');
console.log('✔ components/ui/EmptyState.tsx updated.');

// 6. Process components/people/RecommendedSection.tsx
const recPath = path.join(__dirname, '../components/people/RecommendedSection.tsx');
let rec = fs.readFileSync(recPath, 'utf8');
rec = rec.replace(/#000000/g, '#12372A');
rec = rec.replace(/#E6E6E6/g, '#DDE7E1');
rec = rec.replace(/fontSize:\s*'1rem'/g, "fontSize: '11px'");
rec = rec.replace(/fontSize:\s*'14\.5px'/g, "fontSize: '11px'");
rec = rec.replace(/fontSize:\s*'12\.5px'/g, "fontSize: '11px'");
rec = rec.replace(/fontSize:\s*'12px'/g, "fontSize: '11px'");
rec = rec.replace(/fontSize:\s*'11\.5px'/g, "fontSize: '11px'");
fs.writeFileSync(recPath, rec, 'utf8');
console.log('✔ components/people/RecommendedSection.tsx updated.');

// 7. Process components/layout/Sidebar.tsx
const sidebarPath = path.join(__dirname, '../components/layout/Sidebar.tsx');
let sb = fs.readFileSync(sidebarPath, 'utf8');
sb = sb.replace(/#E6E6E6/g, '#E8F7EF');
sb = sb.replace(/#000000/g, '#12372A');
sb = sb.replace(/fontSize:\s*collapsed\s*\?\s*'9px'\s*:\s*'12px'/g, "fontSize: '11px'");
fs.writeFileSync(sidebarPath, sb, 'utf8');
console.log('✔ components/layout/Sidebar.tsx updated.');

// 8. Process components/layout/TopBar.tsx
const topBarPath = path.join(__dirname, '../components/layout/TopBar.tsx');
let tb = fs.readFileSync(topBarPath, 'utf8');
tb = tb.replace(/color:\s*'#000000'/g, "color: '#12372A'");
tb = tb.replace(/#E6E6E6/g, '#DDE7E1');
tb = tb.replace(/#000000/g, '#12372A');
// Change unread badge to Money Green with white text
tb = tb.replace(/background:\s*'#12372A',\s*color:\s*'#ffffff'/g, "background: '#3FA66B', color: '#ffffff'");
// Replace inline font sizes with 11px
tb = tb.replace(/fontSize:\s*'(10\.5|12|12\.5|13|14|9\.5|9|10)px'/g, "fontSize: '11px'");
fs.writeFileSync(topBarPath, tb, 'utf8');
console.log('✔ components/layout/TopBar.tsx updated.');

// 9. Process components/layout/AppShell.tsx
const appShellPath = path.join(__dirname, '../components/layout/AppShell.tsx');
let ash = fs.readFileSync(appShellPath, 'utf8');
ash = ash.replace(/#000000/g, '#12372A');
ash = ash.replace(/#E6E6E6/g, '#DDE7E1');
ash = ash.replace(/borderTopColor:\s*'#12372A'/g, "borderTopColor: '#3FA66B'");
ash = ash.replace(/fontSize:\s*'18px'/g, "fontSize: '11px'");
ash = ash.replace(/fontSize:\s*'13px'/g, "fontSize: '11px'");
fs.writeFileSync(appShellPath, ash, 'utf8');
console.log('✔ components/layout/AppShell.tsx updated.');

// 10. Process app/network/page.tsx
const netPagePath = path.join(__dirname, '../app/network/page.tsx');
let np = fs.readFileSync(netPagePath, 'utf8');
np = np.replace(/#000000/g, '#12372A');
np = np.replace(/#E6E6E6/g, '#DDE7E1');
// Active indicator
np = np.replace(/borderBottom:\s*activeTab === '(\w+)' \? '2px solid #12372A' : '2px solid transparent'/g, "borderBottom: activeTab === '$1' ? '2px solid #3FA66B' : '2px solid transparent'");
np = np.replace(/color:\s*activeTab === '(\w+)' \? '#12372A' : '#12372A'/g, "color: activeTab === '$1' ? '#12372A' : '#66736D'");
np = np.replace(/background:\s*activeTab === 'connections' \? '#12372A' : '#DDE7E1'/g, "background: activeTab === 'connections' ? '#3FA66B' : '#E8F7EF'");
np = np.replace(/fontSize:\s*'(28|17|14\.5|13\.5|14|13|12\.5|12|10|9)px'/g, "fontSize: '11px'");
fs.writeFileSync(netPagePath, np, 'utf8');
console.log('✔ app/network/page.tsx updated.');

// 11. Process app/network/[id]/page.tsx
const netIdPagePath = path.join(__dirname, '../app/network/[id]/page.tsx');
let nid = fs.readFileSync(netIdPagePath, 'utf8');
nid = nid.replace(/#000000/g, '#12372A');
nid = nid.replace(/#E6E6E6/g, '#DDE7E1');
nid = nid.replace(/fontSize:\s*'(28|17|15|14\.5|14|13|12\.5|12|11\.5|10|9)px'/g, "fontSize: '11px'");
fs.writeFileSync(netIdPagePath, nid, 'utf8');
console.log('✔ app/network/[id]/page.tsx updated.');

console.log('\n=== ALL FILES SUCCESSFULLY STANDARDIZED ===');
