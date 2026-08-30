export const CURRENCY_RATES: Record<string, { symbol: string; rateFromUSD: number; name: string }> = {
  USD: { symbol: '$', rateFromUSD: 1, name: 'US Dollar' },
  INR: { symbol: '₹', rateFromUSD: 87.5, name: 'Indian Rupee' },
  EUR: { symbol: '€', rateFromUSD: 0.92, name: 'Euro' },
  GBP: { symbol: '£', rateFromUSD: 0.78, name: 'British Pound' },
  AED: { symbol: 'AED ', rateFromUSD: 3.67, name: 'UAE Dirham' },
  SGD: { symbol: 'S$', rateFromUSD: 1.34, name: 'Singapore Dollar' },
  CNY: { symbol: '¥', rateFromUSD: 7.24, name: 'Chinese Yuan' },
  JPY: { symbol: '¥', rateFromUSD: 154.2, name: 'Japanese Yen' },
};

export const BLOCKED_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'yahoo.co.in',
  'yahoo.co.uk',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'gmx.com',
]);

export function isCorporateEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return !BLOCKED_EMAIL_DOMAINS.has(domain);
}

export const CURRENCY_LOCALES: Record<string, string> = {
  USD: 'en-US',
  INR: 'en-IN',
  EUR: 'de-DE',
  GBP: 'en-GB',
  AED: 'en-AE',
  SGD: 'en-SG',
  CNY: 'zh-CN',
  JPY: 'ja-JP',
};

export function formatCurrency(amountUSD: number, targetCurrency: string = 'USD'): string {
  const curr = CURRENCY_RATES[targetCurrency] || CURRENCY_RATES.USD;
  const converted = amountUSD * curr.rateFromUSD;
  const locale = CURRENCY_LOCALES[targetCurrency] || 'en-US';
  return `${curr.symbol}${converted.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(n: number | undefined | null, locale: string = 'en-US'): string {
  if (n === undefined || n === null || isNaN(Number(n))) return '0';
  return Number(n).toLocaleString(locale);
}

export function convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
  const fromRate = CURRENCY_RATES[fromCurrency]?.rateFromUSD || 1;
  const toRate = CURRENCY_RATES[toCurrency]?.rateFromUSD || 1;
  const inUSD = amount / fromRate;
  return inUSD * toRate;
}

export function getLocalTime(timezone: string = 'Asia/Kolkata'): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());
  }
}

export function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function parseRichText(text: string): string {
  if (!text) return '';
  let escaped = escapeHtml(text);

  // Code blocks ```code```
  escaped = escaped.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  // Inline code `code`
  escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold *text*
  escaped = escaped.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
  // Italic _text_
  escaped = escaped.replace(/_([^_]+)_/g, '<em>$1</em>');
  // Strikethrough ~text~
  escaped = escaped.replace(/~([^~]+)~/g, '<del>$1</del>');
  // Blockquote > text
  escaped = escaped.replace(/^&gt;\s?(.*)$/gm, '<blockquote>$1</blockquote>');
  // Line breaks
  escaped = escaped.replace(/\n/g, '<br>');

  return escaped;
}

export const PORT_SUGGESTIONS = [
  'Nhava Sheva (INNSA), India',
  'Mundra (INMUN), India',
  'Chennai (INMAA), India',
  'Kolkata (INCCU), India',
  'Cochin (INCOK), India',
  'Pipavav (INPAV), India',
  'Hazira (INHAZ), India',
  'Rotterdam (NLRTM), Netherlands',
  'Antwerp (BEANR), Belgium',
  'Hamburg (DEHAM), Germany',
  'Felixstowe (GBFXT), United Kingdom',
  'Southampton (GBSOU), United Kingdom',
  'Le Havre (FRLEH), France',
  'Valencia (ESVLC), Spain',
  'Genoa (ITGOA), Italy',
  'Jebel Ali (AEJEA), United Arab Emirates',
  'Salalah (OMSLL), Oman',
  'Singapore (SGSIN), Singapore',
  'Port Klang (MYPKG), Malaysia',
  'Tanjung Pelepas (MYTPP), Malaysia',
  'Shanghai (CNSHA), China',
  'Ningbo-Zhoushan (CNNGB), China',
  'Shenzhen (CNSZX), China',
  'Guangzhou (CNGZG), China',
  'Qingdao (CNTAO), China',
  'Busan (KRPUS), South Korea',
  'Los Angeles (USLAX), United States',
  'Long Beach (USLGB), United States',
  'New York / New Jersey (USNYC), United States',
  'Savannah (USSAV), United States',
  'Houston (USHOU), United States',
];

export const FREIGHT_EQUIPMENT = [
  "20' Standard (20DV)",
  "40' Standard (40DV)",
  "40' High Cube (40HC)",
  "45' High Cube (45HC)",
  "20' Reefer (20RF)",
  "40' Reefer HC (40HR)",
  "20' Open Top (20OT)",
  "40' Open Top (40OT)",
  "20' Flat Rack (20FR)",
  "40' Flat Rack (40FR)",
  'ISO Tank Container',
  'Bulk Container',
];

export const INCOTERMS_2020 = [
  'FOB - Free on Board',
  'CIF - Cost, Insurance and Freight',
  'CFR - Cost and Freight',
  'EXW - Ex Works',
  'FCA - Free Carrier',
  'CPT - Carriage Paid To',
  'CIP - Carriage and Insurance Paid To',
  'DAP - Delivered at Place',
  'DPU - Delivered at Place Unloaded',
  'DDP - Delivered Duty Paid',
  'FAS - Free Alongside Ship',
];
