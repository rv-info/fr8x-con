const fs = require('fs');
const path = require('path');

const iconNames = [
  'speedometer2', 'rss', 'globe2', 'globe', 'hammer', 'bar-chart-line', 'people',
  'briefcase', 'person', 'person-badge', 'chevron-bar-left', 'chevron-bar-right',
  'box-arrow-right', 'search', 'geo-alt', 'calculator', 'bell', 'chevron-down',
  'chevron-right', 'chevron-up', 'gear', 'shield-check', 'arrow-repeat', 'check2-all',
  'trash', 'x-lg', 'list', 'arrow-left-right', 'airplane', 'truck', 'train-front',
  'box-seam', 'water', 'building', 'signpost-2', 'file-earmark-text', 'receipt',
  'check-circle', 'exclamation-triangle', 'x-circle', 'info-circle', 'pencil', 'eye',
  'plus', 'plus-lg', 'download', 'upload', 'printer', 'calendar3', 'clock',
  'funnel', 'arrow-down-up', 'cash-stack', 'credit-card', 'wallet2', 'percent',
  'file-earmark-check', 'file-earmark-spreadsheet', 'file-earmark-pdf', 'shield-lock',
  'paperclip', 'bookmark', 'activity', 'award', 'columns-gap', 'house',
  'star', 'lightning', 'arrow-right', 'exclamation-circle'
];

function toPascal(str) {
  return str.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
}

let out = `'use client';

import React from 'react';

export interface BootstrapIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

const createIcon = (name: string, paths: React.ReactNode) => {
  const Component = ({ size = 16, className = '', style, ...props }: BootstrapIconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      className={\`bi bi-\${name} \${className}\`.trim()}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
      aria-hidden="true"
      {...props}
    >
      {paths}
    </svg>
  );
  Component.displayName = \`BootstrapIcon.\${name}\`;
  return Component;
};
\n`;

for (const name of iconNames) {
  const svgPath = path.join('node_modules', 'bootstrap-icons', 'icons', name + '.svg');
  if (!fs.existsSync(svgPath)) continue;
  let raw = fs.readFileSync(svgPath, 'utf8');
  // Extract inner svg
  const match = raw.match(/<svg[^>]*>([\s\S]*?)<\/svg>/);
  if (!match) continue;
  let inner = match[1].trim();
  // Clean attributes for React JSX: fill-rule -> fillRule, clip-rule -> clipRule
  inner = inner.replace(/fill-rule=/g, 'fillRule=');
  inner = inner.replace(/clip-rule=/g, 'clipRule=');
  // Wrap in JSX fragment if multiple elements
  const componentName = 'Bi' + toPascal(name);
  out += `// ${name}\nexport const ${componentName} = createIcon(\n  '${name}',\n  <>\n    ${inner}\n  </>\n);\n\n`;
}

// Custom bi-ship freight vessel icon
out += `// ship (Sea Freight Vessel)\nexport const BiShip = createIcon(\n  'ship',\n  <>\n    <path d="M8 1a.5.5 0 0 1 .5.5V3h2a.5.5 0 0 1 .5.5v1h1a.5.5 0 0 1 .5.5v1.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V5.5H8.5V4h-1v1.5H5v.5a.5.5 0 0 1-.5.5h-1a.5.5 0 0 1-.5-.5V5a.5.5 0 0 1 .5-.5h1V3.5a.5.5 0 0 1 .5-.5h2V1.5A.5.5 0 0 1 8 1" />\n    <path d="M1.5 8h13l-1.5 5.5a2 2 0 0 1-1.9 1.5H4.9a2 2 0 0 1-1.9-1.5L1.5 8zm1 1 1.2 4.4a1 1 0 0 0 .95.6h6.7a1 1 0 0 0 .95-.6L13.5 9h-11z" />\n  </>\n);\n\n`;

// Add compatibility aliases
out += `// Standard Compatibility Aliases
export const LayoutDashboard = BiSpeedometer2;
export const Speedometer2 = BiSpeedometer2;
export const Rss = BiRss;
export const Globe2 = BiGlobe2;
export const Globe = BiGlobe;
export const Gavel = BiHammer;
export const Hammer = BiHammer;
export const BarChart3 = BiBarChartLine;
export const BarChartLine = BiBarChartLine;
export const Users = BiPeople;
export const People = BiPeople;
export const Briefcase = BiBriefcase;
export const User = BiPerson;
export const Person = BiPerson;
export const PanelLeftClose = BiChevronBarLeft;
export const PanelLeftOpen = BiChevronBarRight;
export const LogOut = BiBoxArrowRight;

// Logistics & Freight Aliases
export const Ship = BiShip;
export const Airplane = BiAirplane;
export const Truck = BiTruck;
export const TrainFront = BiTrainFront;
export const BoxSeam = BiBoxSeam;
export const GeoAlt = BiGeoAlt;
export const Building = BiBuilding;
export const FileEarmarkText = BiFileEarmarkText;
export const Receipt = BiReceipt;
export const Gear = BiGear;
export const Search = BiSearch;
export const Bell = BiBell;
export const Clock = BiClock;
export const Calendar = BiCalendar3;
export const Activity = BiActivity;
export const Bookmark = BiBookmark;
export const Award = BiAward;
export const TrendingUp = BiBarChartLine;
export const MessageSquare = BiFileEarmarkText;
export const Check = BiCheckCircle;
export const CheckCheck = BiCheck2All;
export const Plus = BiPlus;
export const Trash2 = BiTrash;
export const ChevronDown = BiChevronDown;
export const ArrowRightLeft = BiArrowLeftRight;
export const Calculator = BiCalculator;
export const X = BiXLg;
export const ShieldCheck = BiShieldCheck;
export const RefreshCw = BiArrowRepeat;
export const UserIcon = BiPerson;
export const AlertCircle = BiExclamationCircle;
export const CheckCircle2 = BiCheckCircle;
export const FileText = BiFileEarmarkText;
export const Star = BiStar;
export const Zap = BiLightning;
export const ArrowRight = BiArrowRight;
export const Anchor = BiWater;
`;

fs.writeFileSync('components/ui/BootstrapIcons.tsx', out, 'utf8');
console.log('✅ Generated components/ui/BootstrapIcons.tsx with', iconNames.length + 1, 'Bootstrap Icons');
