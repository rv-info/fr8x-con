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
} from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register, allUsers } = useAuth();
  const { toast } = useToast();

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mobile, setMobile] = useState('');
  const [designation, setDesignation] = useState('Freight Procurement Manager');
  const [preferredContact, setPreferredContact] = useState<'tradeChat' | 'email' | 'mobile'>('tradeChat');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [country, setCountry] = useState('India');
  const [city, setCity] = useState('Mumbai');

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
  const [devCode, setDevCode] = useState<string | null>(null);

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!firstName.trim() || !lastName.trim() || !companyName.trim()) {
      setErrorMessage('Please fill in all mandatory account and legal business fields.');
      return;
    }

    if (!isCorporateEmail(email)) {
      setErrorMessage(
        'Registration requires a verified corporate email domain. Free email services (Gmail, Yahoo, Outlook, Hotmail, iCloud, Proton) are strictly restricted.'
      );
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

    // Strict One User, One Login: verify mobile phone uniqueness
    const cleanMobile = mobile.replace(/[^0-9+]/g, '');
    if (cleanMobile && cleanMobile.length >= 8) {
      const existingMobileUser = allUsers.find(
        (u) => u.mobile && u.mobile.replace(/[^0-9+]/g, '') === cleanMobile
      );
      if (existingMobileUser) {
        setErrorMessage(
          `This mobile phone number (${mobile}) is already associated with an active account (${existingMobileUser.email}). Multi-accounting is prohibited under the One User, One Login policy.`
        );
        return;
      }
    }

    if (!termsAccepted) {
      setErrorMessage('You must review and accept the FR8X Commercial & Compliance Terms.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: cleanEmail,
          password: password || 'Password@123',
          company: companyName.trim(),
          companyId,
          mobile: cleanMobile,
          designation,
          role: 'company_admin',
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Registration failed. Please check your details.');
        return;
      }

      // Advance to OTP verification
      setStep('otp');
      setOtpTimer(60);
      setCanResend(false);
      if (data.demoCode) {
        setDevCode(data.demoCode);
      }
      toast(data.message || `Verification email sent from password@fr8x.in to ${email}.`);
    } catch {
      setIsSubmitting(false);
      setErrorMessage('Network connection error. Please try again.');
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
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Verification failed. Please check your verification code.');
        return;
      }

      // Sync local client auth state
      await register(
        {
          firstName,
          lastName,
          email: email.trim().toLowerCase(),
          mobile,
          designation,
          company: companyName,
          companyId,
          city,
          country,
          timezone,
          plan: selectedPlan,
          hasGoldenTick: selectedPlan === 'premium',
          isVerified: true,
        },
        password || 'Password@123'
      );

      toast(`Registration verified! Welcome to FR8X Workspace (${selectedPlan.toUpperCase()} Plan).`);
      router.push('/feeds');
    } catch {
      setIsSubmitting(false);
      setErrorMessage('Network error during verification. Please try again.');
    }
  };

  const handleResendCode = async () => {
    setCanResend(false);
    setOtpTimer(60);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      toast(data.message || 'Verification code resent.');
    } catch {
      toast('Failed to resend verification code. Please try again.');
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
                    <input
                      type="password"
                      className="input"
                      placeholder="Create strong password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Mobile Number</label>
                    <input
                      className="input"
                      placeholder="+91 98765 43210"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid g1" style={{ marginTop: '10px' }}>
                  <div className="field">
                    <label>Time Zone (IANA)</label>
                    <select
                      className="input"
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                    >
                      <option value="Asia/Kolkata">Asia/Kolkata (IST +05:30)</option>
                      <option value="Europe/Amsterdam">Europe/Amsterdam (CET +01:00)</option>
                      <option value="Asia/Dubai">Asia/Dubai (GST +04:00)</option>
                      <option value="Asia/Singapore">Asia/Singapore (SGT +08:00)</option>
                      <option value="Europe/London">Europe/London (GMT +00:00)</option>
                      <option value="America/New_York">America/New_York (EST -05:00)</option>
                    </select>
                  </div>
                </div>

                <div className="grid g2" style={{ marginTop: '10px' }}>
                  <div className="field">
                    <label>Country of Registration</label>
                    <input
                      className="input"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>City</label>
                    <input
                      className="input"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
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
                      value={gstn}
                      onChange={(e) => setGstn(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label>PAN Number</label>
                    <input
                      className="input"
                      placeholder="AAACA1234A"
                      value={pan}
                      onChange={(e) => setPan(e.target.value)}
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
                  {devCode && (
                    <small
                      onClick={() => setOtp(devCode)}
                      style={{ color: 'var(--brand)', fontSize: '11px', marginTop: '4px', cursor: 'pointer', display: 'inline-block' }}
                    >
                      Dev sandbox test code: <b>{devCode}</b> (click to auto-fill)
                    </small>
                  )}
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
                  disabled={isSubmitting}
                  style={{ width: '100%', height: '38px', fontSize: '13px', opacity: isSubmitting ? 0.7 : 1 }}
                >
                  {isSubmitting ? 'Verifying Code...' : 'Verify OTP & Activate Workspace'}
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
