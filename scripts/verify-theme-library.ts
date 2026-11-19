/**
 * Verification Test Suite for FR8X Theme & Occasion Library
 * Tests theme tokens, Godfather defaults, calendar occasion detection, and CSS engine generation.
 */

import {
  ALL_THEMES,
  GODFATHER_THEME,
  DIWALI_THEME,
  HOLI_THEME,
  CHRISTMAS_THEME,
  EID_THEME,
  INDEPENDENCE_THEME,
  NEW_YEAR_THEME,
  HARVEST_THEME,
  getThemeById,
  detectOccasionTheme,
  resolveEffectiveTheme,
  themeToCssVariables,
  generateThemeCss,
  isDateInsideOccasion,
  ThemeId,
} from '../lib/theme';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${message}`);
    failed++;
  }
}

console.log('================================================================');
console.log('  FR8X THEME & OCCASION DESIGN SYSTEM LIBRARY VERIFICATION      ');
console.log('================================================================');

console.log('\n─── SUITE 1: Theme Catalog & Token Integrity ───');
assert(ALL_THEMES.length === 8, `Theme catalog exports 8 complete presets (actual: ${ALL_THEMES.length})`);
assert(GODFATHER_THEME.isDefault === true, 'Godfather Enterprise is marked as the default theme');
assert(GODFATHER_THEME.id === 'godfather', 'Godfather theme ID is "godfather"');
assert(GODFATHER_THEME.colors.canvas === '#FAFBF7', 'Godfather canvas is #FAFBF7');
assert(GODFATHER_THEME.colors.surface === '#FFFFFF', 'Godfather surface is pure white #FFFFFF');
assert(GODFATHER_THEME.colors.primary === '#15803D', 'Godfather primary brand is #15803D (Enterprise Green)');
assert(GODFATHER_THEME.colors.activeBackground === '#E8F7EF', 'Godfather active nav background is #E8F7EF');

console.log('\n─── SUITE 2: Strict Typography & Line Governance ───');
for (const theme of ALL_THEMES) {
  assert(theme.typography.fontFamily === 'Calibri, sans-serif', `${theme.name} enforces Calibri, sans-serif`);
  assert(theme.typography.fontSizeBase === '10px', `${theme.name} enforces 10px standard font size`);
  assert(theme.lines.borderWidth === '1px', `${theme.name} enforces 1px border width`);
  assert(theme.colors.surface === '#FFFFFF', `${theme.name} enforces pure white #FFFFFF card/surface background`);
}

console.log('\n─── SUITE 3: Occasion & Festival Calendar Detection ───');
// Diwali: Oct 25
const diwaliDate = new Date('2026-10-25T12:00:00Z');
const detectedDiwali = detectOccasionTheme(diwaliDate);
assert(detectedDiwali?.id === 'diwali', `Oct 25 resolves to Diwali Theme (actual: ${detectedDiwali?.id})`);

// Holi: Mar 15
const holiDate = new Date('2026-03-15T12:00:00Z');
const detectedHoli = detectOccasionTheme(holiDate);
assert(detectedHoli?.id === 'holi', `Mar 15 resolves to Holi Theme (actual: ${detectedHoli?.id})`);

// Christmas: Dec 25
const xmasDate = new Date('2026-12-25T12:00:00Z');
const detectedXmas = detectOccasionTheme(xmasDate);
assert(detectedXmas?.id === 'christmas', `Dec 25 resolves to Christmas Theme (actual: ${detectedXmas?.id})`);

// Independence Day: Aug 15
const indDate = new Date('2026-08-15T12:00:00Z');
const detectedInd = detectOccasionTheme(indDate);
assert(detectedInd?.id === 'independence', `Aug 15 resolves to Independence Day Theme (actual: ${detectedInd?.id})`);

// Normal non-festival day (e.g. May 20)
const normalDate = new Date('2026-05-20T12:00:00Z');
const detectedNormal = detectOccasionTheme(normalDate);
assert(detectedNormal === null, `May 20 has no active festival, returns null (actual: ${detectedNormal?.id || 'null'})`);

console.log('\n─── SUITE 4: Effective Theme Resolution & Fallbacks ───');
// In normal day, fallback to Godfather
const fallback = resolveEffectiveTheme(null, normalDate);
assert(fallback.theme.id === 'godfather', 'Normal day resolves to Godfather Default theme');
assert(fallback.isAutoScheduled === false, 'Fallback is not auto-scheduled');

// Explicit manual override to Diwali
const manualDiwali = resolveEffectiveTheme('diwali', normalDate);
assert(manualDiwali.theme.id === 'diwali', 'Manual override explicitly enforces Diwali theme');
assert(manualDiwali.isAutoScheduled === false, 'Manual override is marked isAutoScheduled=false');

// Auto-calendar mode on Diwali date
const autoDiwali = resolveEffectiveTheme('auto', diwaliDate);
assert(autoDiwali.theme.id === 'diwali', 'Auto mode resolves to Diwali on festival date');
assert(autoDiwali.isAutoScheduled === true, 'Auto mode marks isAutoScheduled=true');

console.log('\n─── SUITE 5: CSS Variable Engine & Stylesheet Generation ───');
const cssVars = themeToCssVariables(GODFATHER_THEME);
assert(cssVars['--color-background'] === '#FAFBF7', 'CSS engine maps --color-background');
assert(cssVars['--color-surface'] === '#FFFFFF', 'CSS engine maps --color-surface');
assert(cssVars['--color-primary'] === '#15803D', 'CSS engine maps --color-primary');
assert(cssVars['--color-border'] === '#DDE7E1', 'CSS engine maps --color-border');
assert(cssVars['--font-family-primary'] === 'Calibri, sans-serif', 'CSS engine maps --font-family-primary');
assert(cssVars['--font-size-base'] === '10px', 'CSS engine maps --font-size-base');

const rawCss = generateThemeCss(GODFATHER_THEME);
assert(rawCss.includes('--color-primary: #15803D !important;'), 'Raw CSS contains primary color declaration');
assert(rawCss.includes('.nav a.on'), 'Raw CSS contains active navigation rules');
assert(rawCss.includes('.btn.primary'), 'Raw CSS contains primary button rules');

console.log('================================================================');
console.log(`  VERIFICATION RESULT: ${passed} PASSED, ${failed} FAILED`);
console.log('================================================================');

if (failed > 0) {
  process.exit(1);
} else {
  console.log('\n🎉 ALL THEME LIBRARY & OCCASION TESTS PASSED SUCCESSFULLY!\n');
}
