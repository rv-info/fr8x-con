'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { isCorporateEmail } from '@/lib/utils';
import { PlanTier } from '@/lib/types';
import {
  ShieldCheck,
  Building,
  User,
  CreditCard,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Clock,
  Eye,
  EyeOff,
  Mail,
  Scale,
  X,
  Calendar,
  Shield,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import SearchableDropdown, { DropdownOption } from '@/components/ui/SearchableDropdown';
import { Country as CSC_Country, State as CSC_State, City as CSC_City } from 'country-state-city';
import {
  getAllGlobalISDCodes,
  getAllGlobalCountries,
  getStatesForCountry,
  getCitiesForState,
  getCitiesForCountry,
  getAllGlobalTimezones,
  GlobalISDEntry,
} from '@/lib/geo/global-geo';

// --- Password Strength Scorer ---
type StrengthLevel = 'empty' | 'too_weak' | 'weak' | 'fair' | 'strong' | 'very_strong';
function calcPasswordStrength(pwd: string): { level: StrengthLevel; score: number; label: string; color: string; bg: string } {
  if (!pwd) return { level: 'empty', score: 0, label: '', color: '#94a3b8', bg: '#e2e8f0' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { level: 'too_weak', score: 1, label: 'Too Weak', color: '#ef4444', bg: '#fee2e2' };
  if (score === 2) return { level: 'weak', score: 2, label: 'Weak', color: '#f97316', bg: '#ffedd5' };
  if (score === 3) return { level: 'fair', score: 3, label: 'Fair', color: '#eab308', bg: '#fef9c3' };
  if (score === 4 || score === 5) return { level: 'strong', score: 4, label: 'Strong', color: '#22c55e', bg: '#dcfce7' };
  return { level: 'very_strong', score: 5, label: 'Very Strong', color: '#16a34a', bg: '#bbf7d0' };
}

// --- Live Clock/Calendar Widget ---
function LiveClockPanel() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const hh = String(now.getHours()).padStart(2,'0');
  const mm = String(now.getMinutes()).padStart(2,'0');
  const ss = String(now.getSeconds()).padStart(2,'0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  const h12 = now.getHours() % 12 || 12;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const calDays: (number|null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);
  while (calDays.length % 7 !== 0) calDays.push(null);

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0c1a2e 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 28px', gap: '0', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ fontSize: '32px', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.04em', lineHeight: 1 }}>
          fr<span style={{ color: '#0ea5e9' }}>8</span>x
        </div>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#64748b', marginTop: '4px' }}>Enterprise Logistics Platform</div>
      </div>

      {/* Digital Clock */}
      <div style={{
        background: 'rgba(14,165,233,0.08)',
        border: '1px solid rgba(14,165,233,0.2)',
        borderRadius: '16px',
        padding: '20px 32px',
        textAlign: 'center',
        marginBottom: '20px',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
          <span style={{ fontSize: '52px', fontWeight: 900, color: '#f1f5f9', fontFamily: 'monospace', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {String(h12).padStart(2,'0')}:{mm}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#0ea5e9', fontFamily: 'monospace' }}>{ampm}</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569', fontFamily: 'monospace' }}>{ss}s</span>
          </div>
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px', letterSpacing: '0.05em' }}>
          {days[now.getDay()]} · {months[now.getMonth()]} {now.getDate()}, {now.getFullYear()}
        </div>
      </div>

      {/* Mini Calendar */}
      <div style={{
        background: 'rgba(15,23,42,0.7)',
        border: '1px solid #1e293b',
        borderRadius: '14px',
        padding: '16px',
        width: '100%',
        maxWidth: '260px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '12px' }}>
          <Calendar size={14} color="#0ea5e9" />
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {months[now.getMonth()]} {now.getFullYear()}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
          {['S','M','T','W','T','F','S'].map((d,i) => (
            <div key={i} style={{ fontSize: '9px', fontWeight: 700, color: '#475569', padding: '3px 0', textTransform: 'uppercase' }}>{d}</div>
          ))}
          {calDays.map((d, i) => (
            <div key={i} style={{
              fontSize: '11px', fontWeight: d === now.getDate() ? 800 : 500,
              color: d === now.getDate() ? '#fff' : d ? '#94a3b8' : 'transparent',
              background: d === now.getDate() ? '#0ea5e9' : 'transparent',
              borderRadius: '4px', padding: '3px 0',
              transition: 'all 0.2s',
            }}>{d || ''}</div>
          ))}
        </div>
      </div>

      {/* Tagline */}
      <div style={{ marginTop: '28px', textAlign: 'center', maxWidth: '220px' }}>
        <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
          Trusted by freight professionals across 40+ countries for enterprise logistics procurement.
        </p>
      </div>

      {/* Shield badge */}
      <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Shield size={12} color="#22c55e" />
        <span style={{ fontSize: '10px', color: '#22c55e', fontWeight: 700, letterSpacing: '0.08em' }}>256-BIT TLS ENCRYPTED</span>
      </div>
    </div>
  );
}

// --- T&C Modal ---
function TnCModal({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  const [hasRead, setHasRead] = useState(false);
  const [checked, setChecked] = useState(false);
  const [scrollExpanded, setScrollExpanded] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (isNearBottom) setHasRead(true);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '16px',
    }}>
      <div style={{
        width: '100%', maxWidth: '720px',
        background: '#fff',
        borderRadius: '20px',
        boxShadow: '0 40px 80px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column',
        maxHeight: '90vh',
        overflow: 'hidden',
      }}>
        {/* Modal Header */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '20px 24px',
          display: 'flex', alignItems: 'center', gap: '12px',
          flexShrink: 0,
        }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Scale size={20} color="#0ea5e9" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#f1f5f9' }}>FR8X Master Terms of Service & Commercial Agreement</div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>You must read and accept to proceed with registration</div>
          </div>
          <Link href="/terms" target="_blank" style={{ fontSize: '11px', color: '#0ea5e9', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(14,165,233,0.3)' }}>
            View Full Page ↗
          </Link>
        </div>

        {/* Scrollable T&C Body */}
        <div
          onScroll={handleScroll}
          style={{
            flex: 1, overflowY: 'auto', padding: '24px',
            fontSize: '13px', color: '#334155', lineHeight: 1.7,
          }}
        >
          <div style={{ padding: '12px 16px', background: '#fef9c3', border: '1px solid #fde047', borderRadius: '8px', marginBottom: '16px', fontSize: '12px', color: '#92400e' }}>
            ⚠ Please scroll to the bottom to enable the checkbox and accept button.
          </div>
          <TnCBodyText />
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid #e2e8f0',
          padding: '16px 24px',
          background: '#f8fafc',
          flexShrink: 0,
        }}>
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: hasRead ? 'pointer' : 'not-allowed', marginBottom: '14px', opacity: hasRead ? 1 : 0.5 }}>
            <input
              type="checkbox"
              checked={checked}
              disabled={!hasRead}
              onChange={(e) => setChecked(e.target.checked)}
              style={{ width: '16px', height: '16px', marginTop: '1px', flexShrink: 0, accentColor: '#0ea5e9', cursor: hasRead ? 'pointer' : 'not-allowed' }}
            />
            <span style={{ fontSize: '13px', color: '#334155', lineHeight: 1.5 }}>
              I have read and understood the FR8X Master Terms of Service, Commercial Agreement, Trade Compliance Policy, and Privacy Policy, and I agree to be legally bound by them on behalf of the corporate entity I represent.
            </span>
          </label>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onDecline}
              style={{
                height: '42px', padding: '0 24px', borderRadius: '8px',
                border: '1px solid #e2e8f0', background: '#fff',
                color: '#ef4444', fontWeight: 700, fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              Decline — Exit
            </button>
            <button
              type="button"
              disabled={!checked}
              onClick={onAccept}
              style={{
                height: '42px', padding: '0 28px', borderRadius: '8px',
                border: 'none',
                background: checked ? 'linear-gradient(135deg, #0ea5e9, #0284c7)' : '#94a3b8',
                color: '#fff', fontWeight: 700, fontSize: '14px',
                cursor: checked ? 'pointer' : 'not-allowed',
                boxShadow: checked ? '0 4px 12px rgba(14,165,233,0.35)' : 'none',
                transition: 'all 0.2s',
                display: 'flex', alignItems: 'center', gap: '8px',
              }}
            >
              <ShieldCheck size={16} /> Accept & Proceed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TnCBodyText() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {[
        { title: '1. Definitions & Acceptance', body: 'These Terms constitute a binding agreement between FR8X Technology Private Limited and your corporate entity. By accepting, you confirm legal authority to bind your organization, that you are 18+, and that your entity is duly incorporated and in good standing.' },
        { title: '2. Platform Services', body: 'FR8X provides B2B freight forwarding, reverse auction, rate intelligence, and trade document services. FR8X is a marketplace facilitator; all transport contracts are between the Client and the selected service provider.' },
        { title: '3. One User, One Login Policy', body: 'Each individual may hold only one active account across all organizations. Multi-accounting for any purpose—including circumventing bid limits or auction access—is a material breach and may result in permanent suspension without refund.' },
        { title: '4. Bid Fee Structure & Payment', body: 'Trial: Free/2 days; bid ₹300. Professional: ₹1,500/mo; bid ₹300. Premium: ₹3,000/mo; bid ₹180 (40% off). All bid fees are non-refundable once submitted. Subscriptions are billed monthly in advance.' },
        { title: '5. International Trade Compliance & Sanctions', body: 'Users must comply with DGFT/FTP, Customs Act 1962, FEMA, PMLA, UNSC/OFAC/EU/UK sanctions, SCOMET export controls, Anti-Bribery Acts (IPC, FCPA, UK Bribery Act), IATA DGR, IMDG Code, and IMO SOLAS. Suspicious activity will be reported to authorities.' },
        { title: '6. Anti-Fraud & KYC', body: 'All entities must provide accurate KYC (CIN, PAN, GSTIN, IEC). False registration is fraud under IPC Sections 420/467/468/471. Rate manipulation and bid rigging are prohibited under the Competition Act 2002.' },
        { title: '7. Data Privacy & Security', body: 'Data is processed under India DPDPA 2023, IT Act 2000, GDPR (EU/UK). Registration data is encrypted AES-256-GCM. Sessions use signed JWTs. Communications secured via TLS 1.3. No data sale to third parties.' },
        { title: '8. Intellectual Property', body: 'All platform IP, trademarks, and data are exclusively owned by FR8X Technology Private Limited under the Indian Copyright Act 1957 and Trade Marks Act 1999. Reverse engineering, scraping, or unauthorized redistribution is prohibited.' },
        { title: '9. Limitation of Liability & Indemnification', body: "FR8X's aggregate liability shall not exceed 3 months' subscription fees. Users indemnify FR8X against claims arising from their breach, fraud, or violation of applicable law. FR8X is not liable for cargo loss, indirect damages, or force majeure events." },
        { title: '10. Governing Law & Dispute Resolution', body: 'Indian domestic disputes: Indian law, arbitration under Arbitration & Conciliation Act 1996 (Mumbai seat). International disputes: ICC Rules, Singapore seat. Emergency injunctive relief available in courts of competent jurisdiction.' },
        { title: '11. Account Termination', body: 'FR8X may terminate accounts immediately for breach, fraud, non-payment, or regulatory obligation. Data retention follows the Privacy Policy and applicable law. Deletion requests: legal@fr8x.in.' },
        { title: '12. Amendments', body: 'FR8X may amend these Terms with 15 days notice via registered email. Continued use constitutes acceptance. Refusing amended terms requires cessation of use and account closure request.' },
      ].map((section) => (
        <div key={section.title}>
          <div style={{ fontWeight: 700, color: '#0f172a', marginBottom: '4px', fontSize: '13.5px' }}>{section.title}</div>
          <div style={{ color: '#475569', lineHeight: 1.7 }}>{section.body}</div>
        </div>
      ))}
      <div style={{ marginTop: '8px', padding: '12px 16px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', fontSize: '12px', color: '#0369a1' }}>
        <strong>Contact:</strong> legal@fr8x.in · privacy@fr8x.in · support@fr8x.in · security@fr8x.in<br />
        FR8X Technology Private Limited, Mumbai, Maharashtra, India. Effective September 2026 · Version 3.1
      </div>
    </div>
  );
}



// Structured Global Logistics Hubs & Commercial Port Cities by Country
const COUNTRY_CITY_MAP: Record<string, string[]> = {
  India: [
    'Mumbai', 'Delhi NCR', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad',
    'Pune', 'Ahmedabad', 'Surat', 'Nhava Sheva (JNPT)', 'Mundra', 'Cochin',
    'Visakhapatnam', 'Tuticorin', 'Kandla', 'Jaipur', 'Ludhiana', 'Indore'
  ],
  'United Arab Emirates': [
    'Dubai', 'Abu Dhabi', 'Sharjah', 'Jebel Ali', 'Ajman', 'Ras Al Khaimah', 'Fujairah'
  ],
  'United States': [
    'New York', 'Los Angeles', 'Chicago', 'Houston', 'Long Beach', 'Seattle',
    'Miami', 'Atlanta', 'Savannah', 'Norfolk', 'Dallas', 'Oakland'
  ],
  Singapore: [
    'Singapore (Jurong)', 'Singapore (Pasir Panjang)', 'Singapore (Keppel)', 'Changi'
  ],
  Netherlands: [
    'Rotterdam', 'Amsterdam', 'The Hague', 'Utrecht', 'Eindhoven', 'Tilburg', 'Venlo'
  ],
  Germany: [
    'Hamburg', 'Bremen', 'Frankfurt', 'Berlin', 'Munich', 'Duisburg', 'Cologne', 'Stuttgart'
  ],
  'United Kingdom': [
    'London', 'Southampton', 'Felixstowe', 'Liverpool', 'Manchester', 'Birmingham', 'Leeds'
  ],
  'Saudi Arabia': [
    'Riyadh', 'Jeddah', 'Dammam', 'King Abdullah Port', 'Jubail', 'Yanbu'
  ],
  China: [
    'Shanghai', 'Ningbo', 'Shenzhen', 'Guangzhou', 'Qingdao', 'Tianjin', 'Xiamen', 'Dalian'
  ],
  'Hong Kong': [
    'Hong Kong (Kwai Tsing)', 'Hong Kong Island', 'Kowloon'
  ],
  Japan: [
    'Tokyo', 'Yokohama', 'Osaka', 'Kobe', 'Nagoya'
  ],
  Australia: [
    'Sydney', 'Melbourne', 'Brisbane', 'Fremantle', 'Adelaide'
  ],
  'South Korea': [
    'Busan', 'Seoul', 'Incheon', 'Gwangyang'
  ],
  Malaysia: [
    'Port Klang', 'Tanjung Pelepas', 'Penang', 'Kuala Lumpur'
  ],
  Vietnam: [
    'Ho Chi Minh City', 'Haiphong', 'Da Nang', 'Cai Mep'
  ],
  Indonesia: [
    'Jakarta (Tanjung Priok)', 'Surabaya', 'Belawan'
  ],
  Thailand: [
    'Bangkok', 'Laem Chabang', 'Rayong'
  ],
  Qatar: [
    'Doha', 'Hamad Port', 'Ras Laffan'
  ],
  France: [
    'Le Havre', 'Marseille', 'Paris', 'Dunkirk', 'Lyon'
  ],
  Spain: [
    'Valencia', 'Barcelona', 'Algeciras', 'Madrid', 'Bilbao'
  ],
  Italy: [
    'Genoa', 'Trieste', 'Gioia Tauro', 'Milan', 'Naples'
  ],
};

// Pre-established ISD Dialing Codes with fixture configurations
const ISD_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳', length: 10, pattern: '^[6-9]\\d{9}$' },
  { code: '+1', country: 'United States / Canada', flag: '🇺🇸', length: 10, pattern: '^\\d{10}$' },
  { code: '+971', country: 'United Arab Emirates', flag: '🇦🇪', length: 9, pattern: '^\\d{9}$' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', length: 8, pattern: '^\\d{8}$' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', length: 10, pattern: '^\\d{10}$' },
  { code: '+49', country: 'Germany', flag: '🇩🇪', length: 11, pattern: '^\\d{10,11}$' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱', length: 9, pattern: '^\\d{9}$' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', length: 9, pattern: '^\\d{9}$' },
  { code: '+86', country: 'China', flag: '🇨🇳', length: 11, pattern: '^\\d{11}$' },
  { code: '+852', country: 'Hong Kong', flag: '🇭🇰', length: 8, pattern: '^\\d{8}$' },
  { code: '+81', country: 'Japan', flag: '🇯🇵', length: 10, pattern: '^\\d{10}$' },
  { code: '+61', country: 'Australia', flag: '🇦🇺', length: 9, pattern: '^\\d{9}$' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷', length: 10, pattern: '^\\d{10}$' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾', length: 10, pattern: '^\\d{9,10}$' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳', length: 10, pattern: '^\\d{9,10}$' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩', length: 11, pattern: '^\\d{10,11}$' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭', length: 9, pattern: '^\\d{9}$' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦', length: 8, pattern: '^\\d{8}$' },
  { code: '+33', country: 'France', flag: '🇫🇷', length: 9, pattern: '^\\d{9}$' },
  { code: '+34', country: 'Spain', flag: '🇪🇸', length: 9, pattern: '^\\d{9}$' },
  { code: '+39', country: 'Italy', flag: '🇮🇹', length: 10, pattern: '^\\d{10}$' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, login, allUsers } = useAuth();
  const { toast } = useToast();

  // T&C Gate State
  const [termsStep, setTermsStep] = useState<'gate' | 'form'>('gate');

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isdCode, setIsdCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('');
  const [designation, setDesignation] = useState('');
  const [preferredContact, setPreferredContact] = useState<'tradeChat' | 'email' | 'mobile'>('tradeChat');
  const [timezone, setTimezone] = useState('');
  const [country, setCountry] = useState('');
  const [countryCode, setCountryCode] = useState('');
  const [state, setState] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [countryList, setCountryList] = useState<
    { code: string; name: string; flag: string; phonecode: string }[]
  >([]);
  const [city, setCity] = useState('');
  const [cityList, setCityList] = useState<
    { name: string; state?: string; postalCode?: string }[]
  >([]);
  const [postalCode, setPostalCode] = useState('');
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCity, setCustomCity] = useState('');
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  // Password strength
  const passwordStrength = calcPasswordStrength(password);

  // Complete Global Geography Datasets (All 250 Countries, 418 Timezones, Global States & Cities)
  const globalIsdEntries: GlobalISDEntry[] = React.useMemo(() => getAllGlobalISDCodes(), []);
  const globalCountries = React.useMemo(() => getAllGlobalCountries(), []);
  const globalTimezones = React.useMemo(() => getAllGlobalTimezones(), []);

  const isdOptions: DropdownOption[] = React.useMemo(() => {
    return globalIsdEntries.map((isd) => ({
      value: isd.code,
      label: `${isd.isoCode} ${isd.code} (${isd.country})`,
      flag: isd.flag,
      subLabel: `${isd.country} · ISO: ${isd.isoCode}`,
    }));
  }, [globalIsdEntries]);

  const timezoneOptions: DropdownOption[] = React.useMemo(() => {
    return globalTimezones.map((tz) => ({
      value: tz.value,
      label: tz.label,
      subLabel: tz.region,
    }));
  }, [globalTimezones]);

  const countryOptions: DropdownOption[] = React.useMemo(() => {
    return globalCountries.map((c) => ({
      value: c.name,
      label: `${c.name} (${c.isoCode})`,
      flag: c.flag,
      subLabel: c.phonecode ? `Dial: +${c.phonecode}` : c.currency || '',
    }));
  }, [globalCountries]);

  const stateOptions: DropdownOption[] = React.useMemo(() => {
    const states = getStatesForCountry(countryCode);
    if (!states || states.length === 0) {
      return [{ value: country, label: `National Capital / Territory (${country})` }];
    }
    return [
      { value: '', label: 'Select State' },
      ...states.map((s) => ({
        value: s.name,
        label: s.name,
        subLabel: s.isoCode,
      })),
    ];
  }, [countryCode, country]);

  const cityOptions: DropdownOption[] = React.useMemo(() => {
    if (state) {
      const states = getStatesForCountry(countryCode);
      const matchedState = states.find(
        (s) => s.name.toLowerCase() === state.toLowerCase() || s.isoCode.toLowerCase() === state.toLowerCase()
      );
      if (matchedState) {
        const stateCities = getCitiesForState(countryCode, matchedState.isoCode);
        if (stateCities && stateCities.length > 0) {
          return [
            ...stateCities.map((c) => ({ value: c.name, label: c.name })),
            { value: '__other__', label: '+ Enter Custom City / Port…' },
          ];
        }
      }
    }
    const countryCities = getCitiesForCountry(countryCode);
    if (countryCities && countryCities.length > 0) {
      return [
        ...countryCities.slice(0, 500).map((c) => ({ value: c.name, label: c.name })),
        { value: '__other__', label: '+ Enter Custom City / Port…' },
      ];
    }
    const fallbackList = COUNTRY_CITY_MAP[country] || ['Mumbai', 'Delhi NCR', 'Bengaluru'];
    return [
      ...fallbackList.map((c) => ({ value: c, label: c })),
      { value: '__other__', label: '+ Enter Custom City / Port…' },
    ];
  }, [countryCode, state, country]);



  // Business Card
  const [companyName, setCompanyName] = useState('');
  const [companyId] = useState(`CMP-${Math.floor(10000 + Math.random() * 90000)}`);
  const [registeredAddress, setRegisteredAddress] = useState('');
  const [gstn, setGstn] = useState('');
  const [pan, setPan] = useState('');
  const [iecCode, setIecCode] = useState('');
  const [mtoNumber, setMtoNumber] = useState('');

  // Plan Selection
  const [selectedPlan, setSelectedPlan] = useState<PlanTier>('premium');

  // Verification Card
  const [step, setStep] = useState<'form' | 'verify_pending'>('form');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  // Legal Acceptance
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch 250 global countries on mount
  useEffect(() => {
    fetch('/api/geo/countries')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.countries) && data.countries.length > 0) {
          setCountryList(data.countries);
        }
      })
      .catch((err) => console.error('Failed to load global countries:', err));
  }, []);

  // Fetch cities when countryCode changes
  useEffect(() => {
    let isMounted = true;
    setIsLoadingCities(true);
    fetch(`/api/geo/cities?country=${encodeURIComponent(countryCode)}&limit=250`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.success && Array.isArray(data.cities) && data.cities.length > 0) {
            setCityList(data.cities);
            const matched = data.cities.find((c: any) => c.name.toLowerCase() === city.toLowerCase());
            if (matched && matched.postalCode && !postalCode) {
              setPostalCode(matched.postalCode);
            }
          }
          setIsLoadingCities(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoadingCities(false);
      });

    return () => {
      isMounted = false;
    };
  }, [countryCode]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGstnChange = (val: string) => {
    const upper = val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15);
    setGstn(upper);
    // Indian GSTN: Characters 3 to 12 (0-indexed indices 2 to 11) is the entity's 10-char PAN
    if (upper.length >= 10) {
      const computedPan = upper.slice(2, 12);
      setPan(computedPan);
    }
  };

  const handleCountryChange = (val: string) => {
    setCountry(val);
    const found =
      countryList.find((c) => c.name.toLowerCase() === val.toLowerCase()) ||
      CSC_Country.getAllCountries().find((c) => c.name.toLowerCase() === val.toLowerCase());
    if (found) {
      const code = 'code' in found ? found.code : found.isoCode;
      setCountryCode(code);
      const phone = 'phonecode' in found ? found.phonecode : (found as any).phonecode;
      if (phone) {
        setIsdCode(phone.startsWith('+') ? phone : `+${phone}`);
      }
      const states = CSC_State.getStatesOfCountry(code);
      if (states.length > 0) {
        const defaultState = code === 'IN' ? (states.find(s => s.isoCode === 'PB')?.name || states[0].name) : states[0].name;
        setState(defaultState);
        const sObj = states.find(s => s.name === defaultState);
        if (sObj) {
          setStateCode(sObj.isoCode);
          const cList = CSC_City.getCitiesOfState(code, sObj.isoCode);
          if (cList && cList.length > 0) {
            const defC = sObj.isoCode === 'PB' ? (cList.find(c => c.name === 'Ludhiana')?.name || cList[0].name) : cList[0].name;
            setCity(defC);
            if (defC === 'Ludhiana') setPostalCode('141001');
          }
        }
      } else {
        setState('');
        setStateCode('');
      }
    } else {
      const code = val.slice(0, 2).toUpperCase();
      setCountryCode(code);
    }
  };

  const handleStateChange = (val: string) => {
    setState(val);
    const states = CSC_State.getStatesOfCountry(countryCode);
    const matched = states.find(
      (s) => s.name.toLowerCase() === val.toLowerCase() || s.isoCode.toLowerCase() === val.toLowerCase()
    );
    if (matched) {
      setStateCode(matched.isoCode);
      const cities = CSC_City.getCitiesOfState(countryCode, matched.isoCode);
      if (cities && cities.length > 0) {
        const defaultCity = matched.isoCode === 'PB'
          ? (cities.find(c => c.name === 'Ludhiana')?.name || cities[0].name)
          : cities[0].name;
        setCity(defaultCity);
        setIsCustomCity(false);
        if (defaultCity === 'Ludhiana') {
          setPostalCode('141001');
        }
      }
    }
  };


  const handleCitySelect = (selectedCityName: string) => {
    if (selectedCityName === '__other__') {
      setIsCustomCity(true);
      setCustomCity('');
      setPostalCode('');
    } else {
      setCity(selectedCityName);
      setIsCustomCity(false);
      const foundCity = cityList.find((c) => c.name === selectedCityName);
      if (foundCity && foundCity.postalCode) {
        setPostalCode(foundCity.postalCode);
      } else {
        fetch(`/api/geo/postal?country=${encodeURIComponent(countryCode)}&city=${encodeURIComponent(selectedCityName)}`)
          .then((res) => res.json())
          .then((data) => {
            if (data.success && data.data?.postalCode) {
              setPostalCode(data.data.postalCode);
            }
          })
          .catch(() => {});
      }
    }
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!firstName.trim() || !lastName.trim() || !companyName.trim()) {
      setErrorMessage('Please fill in all mandatory account and legal business fields.');
      return;
    }

    if (!isCorporateEmail(email)) {
      setErrorMessage('Please provide a valid email address.');
      return;
    }

    // Strict One User, One Login: verify email uniqueness across verified active accounts
    const cleanEmail = email.trim().toLowerCase();
    const existingUser = allUsers.find(
      (u) => u.email.trim().toLowerCase() === cleanEmail && u.isVerified
    );
    if (existingUser) {
      const isSameCompany =
        existingUser.company.trim().toLowerCase() === companyName.trim().toLowerCase();
      if (isSameCompany) {
        setErrorMessage(
          `An account with this corporate email (${email}) is already registered and verified in ${existingUser.company}. Multi-accounting in the same organization is prohibited under the One User, One Login policy. Please sign in instead.`
        );
      } else {
        setErrorMessage(
          `This corporate email (${email}) is already associated with another verified organization (${existingUser.company}). Multi-accounting across organizations is strictly prohibited under the One User, One Login policy. Each individual is permitted only one active login account.`
        );
      }
      return;
    }

    // Mobile validation & fixture enforcement
    const cleanDigits = mobileNumber.replace(/\D/g, '');
    if (!cleanDigits) {
      setErrorMessage('Please enter your mobile contact number.');
      return;
    }

    if (isdCode === '+91') {
      if (cleanDigits.length !== 10) {
        setErrorMessage('Indian mobile number fixture requires exactly 10 digits.');
        return;
      }
      if (!/^[6-9]\d{9}$/.test(cleanDigits)) {
        setErrorMessage('Indian mobile number must start with 6, 7, 8, or 9.');
        return;
      }
    } else if (cleanDigits.length < 7) {
      setErrorMessage('Please enter a valid international mobile phone number.');
      return;
    }

    const fullMobile = `${isdCode}${cleanDigits}`;

    // Strict One User, One Login: verify mobile phone uniqueness against verified accounts
    const existingMobileUser = allUsers.find(
      (u) => u.mobile && u.mobile.replace(/[^0-9+]/g, '') === fullMobile.replace(/[^0-9+]/g, '') && u.isVerified && u.email.trim().toLowerCase() !== cleanEmail
    );
    if (existingMobileUser) {
      setErrorMessage(
        `This mobile phone number (${fullMobile}) is already associated with an active account (${existingMobileUser.email}). Multi-accounting is prohibited under the One User, One Login policy.`
      );
      return;
    }

    if (!termsAccepted) {
      setErrorMessage('You must review and accept the FR8X Commercial & Compliance Terms.');
      return;
    }

    setIsSubmitting(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: cleanEmail,
          password: password || 'Password@123',
          company: companyName.trim(),
          companyId,
          mobile: fullMobile,
          designation,
          role: 'company_admin',
        }),
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Registration failed. Please check your details.');
        return;
      }

      // Advance to Email-link verification notice screen
      setStep('verify_pending');
      setResendCooldown(60);
      setResendMessage(null);
      setResendError(null);
      toast(data.message || `Verification email dispatched to ${cleanEmail}.`);
    } catch (err: any) {
      clearTimeout(timeoutId);
      setIsSubmitting(false);
      if (err.name === 'AbortError') {
        setErrorMessage('Network request timed out. Please check your connectivity and try again — your details are saved.');
      } else {
        setErrorMessage('Network connection slow or unavailable. Please try again.');
      }
    }
  };

  const handleResendVerification = async () => {
    setResendMessage(null);
    setResendError(null);
    setIsResending(true);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      setIsResending(false);

      if (res.ok && data.success) {
        setResendMessage(data.message || `A fresh 15-minute verification link has been sent to ${email}.`);
        setResendCooldown(60);
      } else {
        setResendError(data.error || 'Failed to resend verification email.');
        if (data.retryAfterSeconds) {
          setResendCooldown(data.retryAfterSeconds);
        }
      }
    } catch {
      setIsResending(false);
      setResendError('Network error while requesting verification email.');
    }
  };

  return (
    <>
      {/* T&C Modal Gate */}
      {termsStep === 'gate' && (
        <TnCModal
          onAccept={() => setTermsStep('form')}
          onDecline={() => router.push('/')}
        />
      )}

    <div
      style={{
        minHeight: '100vh',
        background: '#f1f5f9',
        display: 'flex',
        flexDirection: 'row',
        minWidth: 0,
      }}
    >
      {/* LEFT PANEL — Clock & Calendar */}
      <div style={{
        width: '280px',
        minWidth: '280px',
        position: 'sticky',
        top: 0,
        height: '100vh',
        flexShrink: 0,
        display: 'none',
      }} className="reg-left-panel">
        <LiveClockPanel />
      </div>

      {/* RIGHT PANEL — Registration Form */}
      <div style={{ flex: 1, minWidth: 0, padding: '30px 16px 60px', display: 'flex', justifyContent: 'center' }}>
      <div className="reg-container">
        {/* Header Branding */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              marginBottom: '10px',
            }}
          >
            <img
              src="/logo.png"
              alt="FR8X"
              style={{
                width: '52px',
                height: '52px',
                margin: '0 auto 8px',
                objectFit: 'contain',
                display: 'block',
              }}
            />
            <div
              style={{
                fontSize: '24px',
                fontWeight: 900,
                color: 'var(--ink, #0f172a)',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              fr<span style={{ color: 'var(--brand, #0284c7)' }}>8</span>x
            </div>
            <div
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: 'var(--brand, #0284c7)',
                marginTop: '3px',
              }}
            >
              Enterprise Logistics Platform
            </div>
          </Link>
          <h1 style={{ fontSize: '12pt', fontWeight: 700, margin: '4px 0 0', color: 'var(--ink)', fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif", textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            Enterprise Freight Entity Registration
          </h1>
          <p style={{ fontSize: '11pt', color: 'var(--mut)', margin: '4px 0 0', fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif" }}>
            Corporate KYC validation, professional email verification, and plan provisioning.
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: '4px',
              background: '#fff0f1',
              border: '1px solid #f0c8ce',
              color: 'var(--red)',
              fontSize: '11pt',
              fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif",
              marginBottom: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {step === 'form' ? (
          <form onSubmit={handleInitialSubmit}>
            {/* One User, One Login Policy Banner */}
            <div
              style={{
                padding: '8px 12px',
                borderRadius: '4px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
                fontSize: '11pt',
                fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif",
                marginBottom: '14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                lineHeight: 1.4,
              }}
            >
              <ShieldCheck size={16} style={{ flexShrink: 0, color: '#16a34a' }} />
              <span>
                <strong>One User, One Login Policy:</strong> Each logistics professional is permitted strictly one active account. Multi-accounting across different organizations or within the same organization is strictly prohibited.
              </span>
            </div>

            {/* Card 1: Account and Contact Card */}
            <div className="reg-section" style={{ position: 'relative', overflow: 'visible', zIndex: 40 }}>
              <div className="reg-section-head">
                <span className="reg-section-title">
                  <User size={15} color="var(--brand)" /> 1. Account & Contact Details
                </span>
                <span className="reg-section-sub">Professional Corporate Identity</span>
              </div>
              <div className="reg-section-body" style={{ position: 'relative', overflow: 'visible' }}>
                {/* Row 1: First Name, Last Name, Designation */}
                <div className="reg-grid-3">
                  <div className="reg-field">
                    <label className="reg-label">
                      <span className="reg-label-text">
                        First Name <span className="req" style={{ color: 'var(--red, #dc2626)' }}>*</span>
                      </span>
                    </label>
                    <input
                      className="reg-input"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="e.g. John"
                      required
                    />
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">
                      <span className="reg-label-text">
                        Last Name <span className="req" style={{ color: 'var(--red, #dc2626)' }}>*</span>
                      </span>
                    </label>
                    <input
                      className="reg-input"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="e.g. Doe"
                      required
                    />
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">
                      <span className="reg-label-text">Designation / Title</span>
                    </label>
                    <input
                      className="reg-input"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Freight Procurement Manager"
                    />
                  </div>
                </div>

                {/* Row 2: Email, Password, Mobile Contact */}
                <div className="reg-grid-3" style={{ marginTop: '12px' }}>
                  <div className="reg-field">
                    <label className="reg-label">
                      <span className="reg-label-text">
                        Professional Corporate Email <span className="req" style={{ color: 'var(--red, #dc2626)' }}>*</span>
                      </span>
                    </label>
                    <input
                      type="email"
                      className="reg-input"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">
                      <span className="reg-label-text">
                        Account Password <span className="req" style={{ color: 'var(--red, #dc2626)' }}>*</span>
                      </span>
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="reg-input"
                        placeholder="Create strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ paddingRight: '36px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: '8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#64748b',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '4px',
                        }}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {/* Password Strength Bar */}
                    {password.length > 0 && (
                      <div style={{ marginTop: '6px' }}>
                        <div style={{ height: '5px', borderRadius: '3px', background: '#e2e8f0', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${(passwordStrength.score / 5) * 100}%`,
                            background: passwordStrength.score <= 1 ? '#ef4444'
                              : passwordStrength.score === 2 ? '#f97316'
                              : passwordStrength.score === 3 ? '#eab308'
                              : passwordStrength.score === 4 ? '#22c55e'
                              : '#16a34a',
                            borderRadius: '3px',
                            transition: 'width 0.3s ease, background 0.3s ease',
                          }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                          <span style={{ fontSize: '10px', fontWeight: 700, color: passwordStrength.color }}>
                            {passwordStrength.label}
                          </span>
                          <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                            {password.length >= 8 ? '' : `${8 - password.length} more chars`}
                          </span>
                        </div>
                        {passwordStrength.level === 'too_weak' || passwordStrength.level === 'weak' ? (
                          <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>
                            Add uppercase, numbers &amp; symbols to strengthen
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">
                      <span className="reg-label-text">
                        Mobile Contact <span className="req" style={{ color: 'var(--red, #dc2626)' }}>*</span>
                      </span>
                      {isdCode === '+91' && (
                        <span className="reg-label-extra" style={{ color: 'var(--brand)', fontSize: '10px' }}>
                          10 Digits
                        </span>
                      )}
                    </label>
                    <div className="reg-mobile-group">
                      <div style={{ width: '92px', flexShrink: 0 }}>
                        <SearchableDropdown
                          options={isdOptions}
                          value={isdCode}
                          onChange={(newCode) => {
                            setIsdCode(newCode);
                            if (newCode === '+91' && mobileNumber.length > 10) {
                              setMobileNumber(mobileNumber.slice(0, 10));
                            }
                          }}
                          triggerHeight="38px"
                          triggerStyle={{
                            borderTopRightRadius: 0,
                            borderBottomRightRadius: 0,
                            borderRight: 'none',
                            padding: '0 6px 0 8px',
                            background: '#f8fafc',
                          }}
                          renderTriggerValue={(opt, val) => (
                            <span style={{ fontWeight: 700, fontSize: '11pt', fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif", display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontSize: '13pt' }}>{opt?.flag || '🌐'}</span>
                              <span>{val || isdCode}</span>
                            </span>
                          )}
                          popoverMinWidth="290px"
                          showClear={false}
                          searchPlaceholder="Search country or code…"
                          maxHeight={300}
                        />
                      </div>
                      <input
                        className="reg-input"
                        type="tel"
                        placeholder={
                          isdCode === '+91'
                            ? '10-digit mobile (e.g. 9876543210)'
                            : 'Mobile number'
                        }
                        maxLength={isdCode === '+91' ? 10 : 14}
                        value={mobileNumber}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, '');
                          setMobileNumber(isdCode === '+91' ? digits.slice(0, 10) : digits.slice(0, 14));
                        }}
                        required
                        style={{
                          borderTopLeftRadius: 0,
                          borderBottomLeftRadius: 0,
                          flex: 1,
                          minWidth: 0,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Row 3: Time Zone (IANA) full-width */}
                <div className="reg-grid-1" style={{ marginTop: '12px' }}>
                  <div className="reg-field">
                    <label className="reg-label">
                      <span className="reg-label-text">Time Zone (IANA)</span>
                    </label>
                    <SearchableDropdown
                      options={timezoneOptions}
                      value={timezone}
                      onChange={setTimezone}
                      searchPlaceholder="Search time zone…"
                      triggerHeight="38px"
                      maxHeight={300}
                    />
                  </div>
                </div>

                {/* Row 4: Country and State */}
                <div className="reg-grid-2" style={{ marginTop: '12px' }}>
                  <div className="reg-field">
                    <label className="reg-label">
                      <span className="reg-label-text">Country of Registration</span>
                    </label>
                    <SearchableDropdown
                      options={countryOptions}
                      value={country}
                      onChange={handleCountryChange}
                      searchPlaceholder="Search country…"
                      triggerHeight="38px"
                      maxHeight={300}
                    />
                  </div>

                  <div className="reg-field">
                    <label className="reg-label">
                      <span className="reg-label-text">State / Province</span>
                    </label>
                    <SearchableDropdown
                      options={stateOptions}
                      value={state}
                      onChange={handleStateChange}
                      placeholder="Select State"
                      searchPlaceholder="Search"
                      triggerHeight="38px"
                      maxHeight={300}
                    />
                  </div>
                </div>

                {/* Row 5: City and Postal Code */}
                <div className="reg-grid-2" style={{ marginTop: '12px' }}>
                  <div className="reg-field">
                    <label className="reg-label">
                      <span className="reg-label-text">City / Port Center</span>
                      {isLoadingCities && <span className="reg-label-extra" style={{ color: 'var(--brand)' }}>Loading…</span>}
                    </label>
                    {!isCustomCity ? (
                      <SearchableDropdown
                        options={cityOptions}
                        value={city}
                        onChange={handleCitySelect}
                        searchPlaceholder="Search city…"
                        allowCustom
                        triggerHeight="38px"
                        maxHeight={300}
                      />
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          className="reg-input"
                          placeholder="Enter your registered city…"
                          value={customCity}
                          onChange={(e) => setCustomCity(e.target.value)}
                        />
                        <button
                          type="button"
                          className="btn secondary sm"
                          onClick={() => {
                            setIsCustomCity(false);
                            const fallback =
                              cityList[0]?.name ||
                              COUNTRY_CITY_MAP[country]?.[0] ||
                              'Mumbai';
                            setCity(fallback);
                          }}
                          style={{ whiteSpace: 'nowrap', fontSize: '11pt', height: '38px', padding: '0 12px', borderRadius: '4px', fontFamily: "Calibri, 'Segoe UI', Arial, sans-serif", fontWeight: 700 }}
                        >
                          Preset List
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="reg-field">
                    <label className="reg-label">
                      <span className="reg-label-text">Postal Code / PIN Code</span>
                    </label>
                    <input
                      className="reg-input"
                      placeholder="e.g. 141001, 400001, 10001"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Card 2: Legal Business Card */}
            <div className="reg-section" style={{ position: 'relative', overflow: 'visible', zIndex: 30 }}>
              <div className="reg-section-head">
                <span className="reg-section-title">
                  <Building size={15} color="var(--brand)" /> 2. Legal Entity & Compliance Card
                </span>
                <span className="reg-section-sub">Government & Trade Registry</span>
              </div>
              <div className="reg-section-body" style={{ position: 'relative', overflow: 'visible' }}>
                {/* Row 1: Legal Company Name and System Company ID */}
                <div className="reg-grid-2">
                  <div className="reg-field">
                    <label className="reg-label">
                      <span className="reg-label-text">
                        Legal Company Name <span className="req" style={{ color: 'var(--red, #dc2626)' }}>*</span>
                      </span>
                    </label>
                    <input
                      className="reg-input"
                      placeholder="e.g. Atlas Logistics Pvt. Ltd."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">
                      <span className="reg-label-text">System Company ID (Generated)</span>
                    </label>
                    <input className="reg-input" value={companyId} readOnly />
                  </div>
                </div>

                {/* Row 2: Registered Corporate Address full-width */}
                <div className="reg-grid-1" style={{ marginTop: '12px' }}>
                  <div className="reg-field">
                    <label className="reg-label">
                      <span className="reg-label-text">Registered Corporate Address</span>
                    </label>
                    <input
                      className="reg-input"
                      placeholder="Head office or registered statutory address…"
                      value={registeredAddress}
                      onChange={(e) => setRegisteredAddress(e.target.value)}
                    />
                  </div>
                </div>

                {/* Row 3: 4 Equal-Width Columns for GSTN, PAN, IEC, MTO */}
                <div className="reg-grid-4" style={{ marginTop: '12px' }}>
                  <div className="reg-field">
                    <label className="reg-label">
                      <span className="reg-label-text">GSTN (India)</span>
                    </label>
                    <input
                      className="reg-input"
                      placeholder="27AAACA1234A1Z5"
                      maxLength={15}
                      value={gstn}
                      onChange={(e) => handleGstnChange(e.target.value)}
                    />
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">
                      <span className="reg-label-text">PAN Number</span>
                      {gstn && pan && (
                        <span className="reg-label-extra" style={{ color: '#16a34a' }}>
                          (Auto)
                        </span>
                      )}
                    </label>
                    <input
                      className="reg-input"
                      placeholder="AAACA1234A"
                      maxLength={10}
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                    />
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">
                      <span className="reg-label-text">IEC Code</span>
                    </label>
                    <input
                      className="reg-input"
                      placeholder="0300123456"
                      value={iecCode}
                      onChange={(e) => setIecCode(e.target.value)}
                    />
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">
                      <span className="reg-label-text">MTO License No.</span>
                    </label>
                    <input
                      className="reg-input"
                      placeholder="MTO/DGS/2026/..."
                      value={mtoNumber}
                      onChange={(e) => setMtoNumber(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Plan Selection Card */}
            <div className="reg-section" style={{ position: 'relative', overflow: 'visible', zIndex: 20 }}>
              <div className="reg-section-head">
                <span className="reg-section-title">
                  <CreditCard size={15} color="var(--brand)" /> 3. Membership & Plan Tier
                </span>
                <span className="reg-section-sub">Enterprise Discount Rules</span>
              </div>
              <div className="reg-section-body" style={{ position: 'relative', overflow: 'visible' }}>
                <div className="reg-plan-grid">
                  {/* Trial */}
                  <div
                    onClick={() => setSelectedPlan('trial')}
                    className="reg-plan-card"
                    style={{
                      border: selectedPlan === 'trial' ? '2px solid var(--brand)' : '1px solid var(--fr8x-outline)',
                      background: selectedPlan === 'trial' ? '#f0f6ff' : '#ffffff',
                    }}
                  >
                    <div>
                      <div className="reg-plan-header">
                        <b style={{ fontSize: '11pt', fontWeight: 700, color: 'var(--ink)' }}>Trial Plan</b>
                      </div>
                      <div className="reg-plan-price">
                        <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--ink)', lineHeight: '1.2' }}>
                          Free
                        </span>
                        <small style={{ color: 'var(--mut)', fontSize: '11pt', marginTop: '2px', display: 'block' }}>
                          Valid for 2 days · 1 trial per company / year
                        </small>
                      </div>
                    </div>
                    <ul className="reg-plan-features">
                      <li>Standard reverse auctions</li>
                      <li>Standard bid posting (₹300/bid)</li>
                    </ul>
                  </div>

                  {/* Professional */}
                  <div
                    onClick={() => setSelectedPlan('professional')}
                    className="reg-plan-card"
                    style={{
                      border: selectedPlan === 'professional' ? '2px solid var(--brand)' : '1px solid var(--fr8x-outline)',
                      background: selectedPlan === 'professional' ? '#f0f6ff' : '#ffffff',
                    }}
                  >
                    <div>
                      <div className="reg-plan-header">
                        <b style={{ fontSize: '11pt', fontWeight: 700, color: 'var(--ink)' }}>Professional</b>
                      </div>
                      <div className="reg-plan-price">
                        <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--brand)', lineHeight: '1.2' }}>
                          ₹1,500 <small style={{ fontSize: '10pt', color: 'var(--mut)', fontWeight: 500 }}>/mo ($27 USD)</small>
                        </span>
                        <small style={{ color: 'var(--mut)', fontSize: '11pt', marginTop: '2px', display: 'block' }}>
                          Inclusive of GST / Tax
                        </small>
                      </div>
                    </div>
                    <ul className="reg-plan-features">
                      <li>Full platform & market rates access</li>
                      <li>Standard bid posting (₹300/bid)</li>
                    </ul>
                  </div>

                  {/* Premium */}
                  <div
                    onClick={() => setSelectedPlan('premium')}
                    className="reg-plan-card"
                    style={{
                      border: selectedPlan === 'premium' ? '2px solid var(--gold)' : '1px solid var(--fr8x-outline)',
                      background: selectedPlan === 'premium' ? '#fffdf7' : '#ffffff',
                    }}
                  >
                    <div>
                      <div className="reg-plan-header">
                        <b style={{ fontSize: '11pt', fontWeight: 700, color: 'var(--ink)' }}>Premium</b>
                        <span className="badge amber" style={{ fontSize: '10pt', padding: '1px 6px', fontWeight: 700 }}>
                          Recommended
                        </span>
                      </div>
                      <div className="reg-plan-price">
                        <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--gold)', lineHeight: '1.2' }}>
                          ₹3,000 <small style={{ fontSize: '10pt', color: 'var(--mut)', fontWeight: 500 }}>/mo ($50 USD)</small>
                        </span>
                        <small style={{ color: 'var(--mut)', fontSize: '11pt', marginTop: '2px', display: 'block' }}>
                          Golden Verified Tick + 40% Discount
                        </small>
                      </div>
                    </div>
                    <ul className="reg-plan-features">
                      <li>
                        <b>Golden Verified Badge (✓)</b>
                      </li>
                      <li>
                        <b>40% Discount: ₹180/bid (vs ₹300)</b>
                      </li>
                      <li>Priority placement on reverse RFQs</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Legal Acceptance — terms already accepted via modal gate */}
            <div className="reg-section" style={{ position: 'relative', overflow: 'visible', zIndex: 10, background: '#f0fdf4', padding: '10px 14px', border: '1px solid #bbf7d0', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={16} color="#16a34a" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '11.5px', lineHeight: '1.45', color: '#166534' }}>
                  <strong>FR8X Master Terms accepted</strong> — You accepted the Terms of Service at the start of this session. Your submission confirms legal authority to represent <b>{companyName || 'this corporate entity'}</b>.
                  {' '}<Link href="/terms" target="_blank" style={{ color: '#0284c7', fontWeight: 600 }}>View Terms →</Link>
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="btn primary"
              disabled={isSubmitting}
              style={{
                width: '100%',
                height: '42px',
                fontSize: '13.5px',
                fontWeight: 700,
                letterSpacing: '0.3px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                borderRadius: '4px',
                background: 'var(--brand)',
                color: '#ffffff',
              }}
            >
              {isSubmitting ? 'Submitting Registration…' : (
                <>
                  CREATE ACCOUNT &amp; VERIFY EMAIL <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* Card 4: Email-Link Verification Screen */
          <div className="card" style={{ maxWidth: '480px', margin: '0 auto', textAlign: 'center', padding: '36px 28px' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#e0f2fe',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.15)',
              }}
            >
              <Mail size={32} />
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--fr8x-text)', margin: '0 0 8px' }}>
              Verify Your Email Address
            </h2>

            <p style={{ fontSize: '13.5px', color: 'var(--ink-secondary)', margin: '0 0 20px', lineHeight: 1.5 }}>
              We have dispatched a single-use verification link to:
              <br />
              <strong style={{ color: '#0f172a', wordBreak: 'break-all' }}>{email}</strong>
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '16px',
                textAlign: 'left',
                marginBottom: '24px',
                fontSize: '12.5px',
                color: '#334155',
                lineHeight: 1.5,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0369a1', marginBottom: '6px' }}>
                <Clock size={16} /> 15-Minute Expiration Notice
              </div>
              <div>
                Click the <strong>Verify Email Address</strong> button inside the email within 15 minutes to confirm your account and activate your workspace.
                You can also enter your 6-digit code or paste the direct link. If you do not see the email in your inbox, please check your <strong>Spam / Junk</strong> folder.
              </div>
            </div>

            {/* Resend Verification Email Section */}
            <div style={{ marginBottom: '20px' }}>
              {resendError && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#b91c1c',
                    background: '#fee2e2',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    textAlign: 'left',
                  }}
                >
                  {resendError}
                </div>
              )}

              {resendMessage && (
                <div
                  style={{
                    fontSize: '12px',
                    color: '#15803d',
                    background: '#dcfce7',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    marginBottom: '12px',
                    textAlign: 'left',
                  }}
                >
                  {resendMessage}
                </div>
              )}

              <button
                type="button"
                className="btn secondary"
                disabled={isResending || resendCooldown > 0}
                onClick={handleResendVerification}
                style={{
                  width: '100%',
                  height: '42px',
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                }}
              >
                {isResending ? (
                  <>Sending new link...</>
                ) : resendCooldown > 0 ? (
                  <>
                    <Clock size={15} /> Resend Link in {resendCooldown}s
                  </>
                ) : (
                  <>
                    <Mail size={15} /> Resend Verification Email
                  </>
                )}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link
                href="/login"
                className="btn primary"
                style={{
                  width: '100%',
                  height: '40px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                }}
              >
                Proceed to Sign In <ArrowRight size={15} style={{ marginLeft: '6px' }} />
              </Link>

              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setErrorMessage('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--brand)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  padding: '6px 0',
                }}
              >
                ← Back to Edit Registration Details
              </button>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '16px', fontSize: '12px', color: 'var(--mut)' }}>
          Already registered?{' '}
          <Link href="/login" style={{ color: 'var(--brand)', fontWeight: 700 }}>
            Sign In
          </Link>
        </div>
      </div>
      </div>{/* end right panel */}
    </div>
    <style>{`
      @media (min-width: 900px) {
        .reg-left-panel { display: flex !important; }
      }
    `}</style>
    </>
  );
}
