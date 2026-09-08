'use client';

import React, { useState, useEffect } from 'react';
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
  const { register, allUsers } = useAuth();
  const { toast } = useToast();

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isdCode, setIsdCode] = useState('+91');
  const [mobileNumber, setMobileNumber] = useState('');
  const [designation, setDesignation] = useState('Freight Procurement Manager');
  const [preferredContact, setPreferredContact] = useState<'tradeChat' | 'email' | 'mobile'>('tradeChat');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [country, setCountry] = useState('India');
  const [countryCode, setCountryCode] = useState('IN');
  const [state, setState] = useState('Punjab');
  const [stateCode, setStateCode] = useState('PB');
  const [countryList, setCountryList] = useState<
    { code: string; name: string; flag: string; phonecode: string }[]
  >([]);
  const [city, setCity] = useState('Ludhiana');
  const [cityList, setCityList] = useState<
    { name: string; state?: string; postalCode?: string }[]
  >([]);
  const [postalCode, setPostalCode] = useState('141001');
  const [isCustomCity, setIsCustomCity] = useState(false);
  const [customCity, setCustomCity] = useState('');
  const [isLoadingCities, setIsLoadingCities] = useState(false);

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

  // OTP Verification Card
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [otp, setOtp] = useState('');
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

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
            if (!matched && !isCustomCity) {
              setCity(data.cities[0].name);
              if (data.cities[0].postalCode) {
                setPostalCode(data.cities[0].postalCode);
              }
            } else if (matched && matched.postalCode && !postalCode) {
              setPostalCode(matched.postalCode);
            }
          } else {
            setCityList([]);
            setIsCustomCity(true);
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
    let interval: any;
    if (step === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, otpTimer]);

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
        if (sObj) setStateCode(sObj.isoCode);
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
        setCity(cities[0].name);
        setIsCustomCity(false);
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
      setErrorMessage('Please provide a valid corporate organization email address.');
      return;
    }

    // Strict One User, One Login: verify email uniqueness across all existing organizations
    const cleanEmail = email.trim().toLowerCase();
    const existingUser = allUsers.find(
      (u) => u.email.trim().toLowerCase() === cleanEmail
    );
    if (existingUser) {
      const isSameCompany =
        existingUser.company.trim().toLowerCase() === companyName.trim().toLowerCase();
      if (isSameCompany) {
        setErrorMessage(
          `An account with this corporate email (${email}) is already registered in ${existingUser.company}. Multi-accounting in the same organization is prohibited under the One User, One Login policy. Please sign in instead.`
        );
      } else {
        setErrorMessage(
          `This corporate email (${email}) is already associated with another organization (${existingUser.company}). Multi-accounting across organizations is strictly prohibited under the One User, One Login policy. Each individual is permitted only one active login account.`
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

    // Strict One User, One Login: verify mobile phone uniqueness
    const existingMobileUser = allUsers.find(
      (u) => u.mobile && u.mobile.replace(/[^0-9+]/g, '') === fullMobile.replace(/[^0-9+]/g, '')
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

      // Advance to OTP verification
      setStep('otp');
      setOtpTimer(30);
      setCanResend(false);
      toast(data.message || `Verification email dispatched to ${email}.`);
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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!otp || otp.trim().length !== 6) {
      setErrorMessage('Please enter a valid 6-digit verification code.');
      return;
    }

    setIsSubmitting(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        }),
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Verification failed. Please check your verification code.');
        return;
      }

      const effectiveCity = isCustomCity ? customCity.trim() || 'Global' : city;
      const cleanDigits = mobileNumber.replace(/\D/g, '');
      const fullMobile = `${isdCode}${cleanDigits}`;

      // Sync local client auth state
      await register(
        {
          firstName,
          lastName,
          email: email.trim().toLowerCase(),
          mobile: fullMobile,
          designation,
          company: companyName,
          companyId,
          city: effectiveCity,
          country,
          postalCode: postalCode.trim() || undefined,
          timezone,
          plan: selectedPlan,
          hasGoldenTick: selectedPlan === 'premium',
          isVerified: true,
        },
        password || 'Password@123'
      );

      toast(`Registration verified! Welcome to FR8X Workspace (${selectedPlan.toUpperCase()} Plan). A welcome confirmation email has been dispatched to ${email.trim().toLowerCase()}.`);
      router.push('/feeds');
    } catch (err: any) {
      clearTimeout(timeoutId);
      setIsSubmitting(false);
      if (err.name === 'AbortError') {
        setErrorMessage('Verification request timed out. Please check your internet connection and try again.');
      } else {
        setErrorMessage('Network error during verification. Please try again.');
      }
    }
  };

  const handleResendCode = async () => {
    setCanResend(false);
    setOtpTimer(60);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      clearTimeout(timeoutId);

      const data = await res.json();
      toast(data.message || 'Verification code resent to your corporate mailbox.');
    } catch (err: any) {
      clearTimeout(timeoutId);
      toast('Network slow or unavailable. Please try resending shortly.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        padding: '30px 16px 60px',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div style={{ width: '100%', maxWidth: '820px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            className="mark"
            style={{
              width: '38px',
              height: '38px',
              margin: '0 auto 10px',
              fontSize: '14px',
              borderRadius: '10px',
            }}
          >
            f8
          </div>
          <h1 style={{ fontSize: '22px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
            Enterprise Freight Entity Registration
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--mut)', margin: '4px 0 0' }}>
            Corporate KYC validation, professional email verification, and plan provisioning.
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '8px',
              background: '#fff0f1',
              border: '1px solid #f0c8ce',
              color: 'var(--red)',
              fontSize: '12px',
              marginBottom: '16px',
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
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#166534',
                fontSize: '11.5px',
                marginBottom: '16px',
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
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="cardhead">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <User size={15} color="var(--brand)" /> 1. Account & Contact Details
                </span>
                <span className="sub">Professional Corporate Identity</span>
              </div>
              <div className="cardbody">
                <div className="grid g3">
                  <div className="field">
                    <label>
                      First Name <span className="req">*</span>
                    </label>
                    <input
                      className="input"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>
                      Last Name <span className="req">*</span>
                    </label>
                    <input
                      className="input"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Designation / Title</label>
                    <input
                      className="input"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid g3" style={{ marginTop: '10px' }}>
                  <div className="field">
                    <label>
                      Professional Corporate Email <span className="req">*</span>
                    </label>
                    <input
                      type="email"
                      className="input"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>
                      Account Password <span className="req">*</span>
                    </label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="input"
                        placeholder="Create strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ paddingRight: '40px' }}
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
                  </div>
                  <div className="field">
                    <label>
                      Mobile Contact <span className="req">*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <div style={{ width: '195px', flexShrink: 0 }}>
                        <SearchableDropdown
                          options={isdOptions}
                          value={isdCode}
                          onChange={(newCode) => {
                            setIsdCode(newCode);
                            if (newCode === '+91' && mobileNumber.length > 10) {
                              setMobileNumber(mobileNumber.slice(0, 10));
                            }
                          }}
                          searchPlaceholder="Search country or code…"
                          maxHeight={280}
                        />
                      </div>

                      <input
                        className="input"
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
                        style={{ height: '38px' }}
                      />
                    </div>
                    {isdCode === '+91' && (
                      <span style={{ fontSize: '10.5px', color: 'var(--mut)', marginTop: '2px', display: 'block' }}>
                        10-digit fixture enforced for India (+91)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid g1" style={{ marginTop: '10px' }}>
                  <div className="field">
                    <label>Time Zone (IANA)</label>
                    <SearchableDropdown
                      options={timezoneOptions}
                      value={timezone}
                      onChange={setTimezone}
                      searchPlaceholder="Search time zone…"
                    />
                  </div>
                </div>

                <div className="grid g2" style={{ marginTop: '10px' }}>
                  <div className="field">
                    <label>Country of Registration</label>
                    <SearchableDropdown
                      options={countryOptions}
                      value={country}
                      onChange={handleCountryChange}
                      searchPlaceholder="Search country…"
                    />
                  </div>

                  <div className="field">
                    <label>State / Province</label>
                    <SearchableDropdown
                      options={stateOptions}
                      value={state}
                      onChange={handleStateChange}
                      placeholder="Select State"
                      searchPlaceholder="Search"
                    />
                  </div>
                </div>

                <div className="grid g2" style={{ marginTop: '10px' }}>
                  <div className="field">
                    <label>
                      City / Port Center {isLoadingCities && <span style={{ fontSize: '10.5px', color: 'var(--brand)' }}>(Loading…)</span>}
                    </label>
                    {!isCustomCity ? (
                      <SearchableDropdown
                        options={cityOptions}
                        value={city}
                        onChange={handleCitySelect}
                        searchPlaceholder="Search city…"
                        allowCustom
                      />
                    ) : (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <input
                          className="input"
                          placeholder="Enter your registered city…"
                          value={customCity}
                          onChange={(e) => setCustomCity(e.target.value)}
                          style={{ height: '38px' }}
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
                          style={{ whiteSpace: 'nowrap', fontSize: '11px', height: '38px' }}
                        >
                          Preset List
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="field">
                    <label>Postal Code / PIN Code</label>
                    <input
                      className="input"
                      placeholder="e.g. 141001, 400001, 10001"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      style={{ height: '38px' }}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* Card 2: Legal Business Card */}
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="cardhead">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Building size={15} color="var(--brand)" /> 2. Legal Entity & Compliance Card
                </span>
                <span className="sub">Government & Trade Registry</span>
              </div>
              <div className="cardbody">
                <div className="grid g2">
                  <div className="field">
                    <label>
                      Legal Company Name <span className="req">*</span>
                    </label>
                    <input
                      className="input"
                      placeholder="e.g. Atlas Logistics Pvt. Ltd."
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>System Company ID (Generated)</label>
                    <input className="input" value={companyId} readOnly />
                  </div>
                </div>

                <div className="field" style={{ marginTop: '10px' }}>
                  <label>Registered Corporate Address</label>
                  <input
                    className="input"
                    placeholder="Head office or registered statutory address…"
                    value={registeredAddress}
                    onChange={(e) => setRegisteredAddress(e.target.value)}
                  />
                </div>

                <div className="grid g4" style={{ marginTop: '10px' }}>
                  <div className="field">
                    <label>GSTN (India)</label>
                    <input
                      className="input"
                      placeholder="27AAACA1234A1Z5"
                      maxLength={15}
                      value={gstn}
                      onChange={(e) => handleGstnChange(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>
                      PAN Number{' '}
                      {gstn && pan && (
                        <span style={{ fontSize: '10px', color: '#16a34a', fontWeight: 600 }}>
                          (Auto from GSTN)
                        </span>
                      )}
                    </label>
                    <input
                      className="input"
                      placeholder="AAACA1234A"
                      maxLength={10}
                      value={pan}
                      onChange={(e) => setPan(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10))}
                    />
                  </div>
                  <div className="field">
                    <label>IEC Code</label>
                    <input
                      className="input"
                      placeholder="0300123456"
                      value={iecCode}
                      onChange={(e) => setIecCode(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>MTO License No.</label>
                    <input
                      className="input"
                      placeholder="MTO/DGS/2026/..."
                      value={mtoNumber}
                      onChange={(e) => setMtoNumber(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Plan Selection Card */}
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="cardhead">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CreditCard size={15} color="var(--brand)" /> 3. Membership & Plan Tier
                </span>
                <span className="sub">Enterprise Discount Rules</span>
              </div>
              <div className="cardbody">
                <div className="grid g3">
                  {/* Trial */}
                  <div
                    onClick={() => setSelectedPlan('trial')}
                    className="card cardbody"
                    style={{
                      cursor: 'pointer',
                      border: selectedPlan === 'trial' ? '2px solid var(--brand)' : '1px solid var(--line)',
                      background: selectedPlan === 'trial' ? '#f0f6ff' : '#fff',
                    }}
                  >
                    <b style={{ fontSize: '14px', display: 'block' }}>Trial Plan</b>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--ink)', margin: '4px 0', display: 'block' }}>
                      Free
                    </span>
                    <small style={{ color: 'var(--mut)', display: 'block', marginBottom: '8px' }}>
                      Valid for 2 days · 1 trial per company / year
                    </small>
                    <ul style={{ fontSize: '11px', color: 'var(--ink-secondary)', paddingLeft: '14px' }}>
                      <li>Standard reverse auctions</li>
                      <li>Standard bid posting (₹300/bid)</li>
                    </ul>
                  </div>

                  {/* Professional */}
                  <div
                    onClick={() => setSelectedPlan('professional')}
                    className="card cardbody"
                    style={{
                      cursor: 'pointer',
                      border: selectedPlan === 'professional' ? '2px solid var(--brand)' : '1px solid var(--line)',
                      background: selectedPlan === 'professional' ? '#f0f6ff' : '#fff',
                    }}
                  >
                    <b style={{ fontSize: '14px', display: 'block' }}>Professional</b>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--brand)', margin: '4px 0', display: 'block' }}>
                      ₹1,500 <small style={{ fontSize: '10px', color: 'var(--mut)' }}>/mo ($27 USD)</small>
                    </span>
                    <small style={{ color: 'var(--mut)', display: 'block', marginBottom: '8px' }}>
                      Inclusive of GST / Tax
                    </small>
                    <ul style={{ fontSize: '11px', color: 'var(--ink-secondary)', paddingLeft: '14px' }}>
                      <li>Full platform & market rates access</li>
                      <li>Standard bid posting (₹300/bid)</li>
                    </ul>
                  </div>

                  {/* Premium */}
                  <div
                    onClick={() => setSelectedPlan('premium')}
                    className="card cardbody"
                    style={{
                      cursor: 'pointer',
                      border: selectedPlan === 'premium' ? '2px solid var(--gold)' : '1px solid var(--line)',
                      background: selectedPlan === 'premium' ? '#fffdf7' : '#fff',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <b style={{ fontSize: '14px' }}>Premium</b>
                      <span className="badge amber">Recommended</span>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gold)', margin: '4px 0', display: 'block' }}>
                      ₹3,000 <small style={{ fontSize: '10px', color: 'var(--mut)' }}>/mo ($50 USD)</small>
                    </span>
                    <small style={{ color: 'var(--mut)', display: 'block', marginBottom: '8px' }}>
                      Golden Verified Tick + 40% Discount
                    </small>
                    <ul style={{ fontSize: '11px', color: 'var(--ink-secondary)', paddingLeft: '14px' }}>
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

            {/* Legal Acceptance */}
            <div className="card cardbody" style={{ marginBottom: '16px', background: '#fafcfe' }}>
              <label className="check">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  required
                />
                <span>
                  I confirm legal authority to represent <b>{companyName || 'this corporate entity'}</b> and agree to
                  the FR8X Master Terms of Service, anti-fraud, trade sanctions compliance, and bid fee regulations.
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="btn primary"
              style={{ width: '100%', height: '42px', fontSize: '14px' }}
            >
              Continue to OTP Verification <ArrowRight size={15} />
            </button>
          </form>
        ) : (
          /* Card 4: OTP Verification Screen */
          <div className="card" style={{ maxWidth: '440px', margin: '0 auto' }}>
            <div className="cardhead">
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <KeyRound size={15} color="var(--brand)" /> 4. One-Time Password (OTP) Verification
              </span>
            </div>
            <div className="cardbody">
              <p style={{ fontSize: '12.5px', color: 'var(--ink-secondary)', marginBottom: '14px' }}>
                A secure 6-digit authentication OTP was generated and sent to corporate email: <b>{email}</b>.
              </p>

              <form onSubmit={handleVerifyOtp}>
                <div className="field" style={{ marginBottom: '14px' }}>
                  <label>Enter 6-Digit OTP</label>
                  <input
                    className="input"
                    style={{ fontSize: '20px', letterSpacing: '6px', textAlign: 'center', height: '44px' }}
                    maxLength={6}
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    required
                    disabled={isSubmitting}
                  />
                  <div
                    style={{
                      padding: '11px 13px',
                      borderRadius: '8px',
                      background: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      color: '#334155',
                      fontSize: '11.5px',
                      marginTop: '12px',
                      lineHeight: '1.45',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                      <ShieldCheck size={16} color="var(--brand)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong>Instant Corporate Mail Dispatch:</strong> A 6-digit one-time passkey has been dispatched from <code>password@fr8x.in</code>. If it does not arrive in your inbox within seconds, please inspect your corporate <strong>Spam / Junk</strong> folder or company email quarantine.
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--mut)' }}>
                    Resend in {otpTimer > 0 ? `${otpTimer}s` : 'Ready'}
                  </span>
                  <button
                    type="button"
                    className="btn secondary sm"
                    disabled={!canResend || isSubmitting}
                    onClick={handleResendCode}
                  >
                    Resend Code
                  </button>
                </div>

                <button
                  type="submit"
                  className="btn primary"
                  disabled={isSubmitting || otp.length !== 6}
                  style={{ width: '100%', height: '40px', fontSize: '13px', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? 'Verifying Code…' : 'Verify OTP & Activate Workspace'}
                </button>

                <div style={{ textAlign: 'center', marginTop: '12px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('form');
                      setErrorMessage('');
                    }}
                    disabled={isSubmitting}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--brand)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    ← Back to Edit Registration Details
                  </button>
                </div>
              </form>
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
    </div>
  );
}
