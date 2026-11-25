'use client';

import React, { useState } from 'react';
import {
  X,
  Upload,
  Globe,
  ExternalLink,
  Mail,
  Phone,
  MessageCircle,
  Plus,
  Trash2,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Smartphone,
  Monitor,
  DollarSign,
  Tag,
  Calendar,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/context/ToastContext';
import { useAuth } from '@/lib/context/AuthContext';
import { AdCampaignRecord, AdCtaButton, CtaType, GeoScope, saveAd } from '@/lib/db/ads';
import { PaymentCheckoutModal } from '@/components/ui/PaymentCheckoutModal';

export interface AdBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (ad: AdCampaignRecord) => void;
}

const CONTINENTS = [
  'Asia',
  'Europe',
  'North America',
  'Africa',
  'South America',
  'Oceania',
];

const COMMON_COUNTRIES = [
  'India',
  'China',
  'United Arab Emirates',
  'Singapore',
  'Germany',
  'Netherlands',
  'United States',
  'United Kingdom',
  'Saudi Arabia',
  'Japan',
  'South Korea',
  'Vietnam',
  'Malaysia',
  'Belgium',
  'Australia',
];

const DURATION_PRICING = [
  { key: '2days', days: 2, label: '2 Days (Testing)', cost: 1000 },
  { key: '10days', days: 10, label: '10 Days (Recommended)', cost: 5000 },
  { key: '30days', days: 30, label: '30 Days (Maximum Reach)', cost: 14000 },
];

export function AdBookingModal({ isOpen, onClose, onSuccess }: AdBookingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  // Basic Advertiser Info
  const [businessName, setBusinessName] = useState(user.company || 'Enterprise Logistics Co.');
  const [contactPerson, setContactPerson] = useState(user.displayName || 'Corporate Marketing Lead');
  const [contactEmail, setContactEmail] = useState(user.email || '');
  const [contactPhone, setContactPhone] = useState(user.mobile || user.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(user.mobile || user.phone || '');
  const [isSameWhatsApp, setIsSameWhatsApp] = useState(true);
  const [companyWebsite, setCompanyWebsite] = useState('https://');

  // Ad Content & Creative
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Ocean Freight & Carrier Direct');
  const [targetAudience, setTargetAudience] = useState('Freight Forwarders, NVOCCs & BCOs');
  const [destUrl, setDestUrl] = useState('https://');
  const [creativeName, setCreativeName] = useState<string | null>(null);
  const [creativePreview, setCreativePreview] = useState<string | null>(null);

  // Geographic Targeting (Phase 5)
  const [isWorldwide, setIsWorldwide] = useState(false);
  const [selectedContinents, setSelectedContinents] = useState<string[]>(['Asia', 'Europe']);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['India', 'Singapore', 'United Arab Emirates']);

  // Call-to-Action Buttons (Phase 4.2)
  const [ctaButtons, setCtaButtons] = useState<AdCtaButton[]>([
    {
      id: 'cta-1',
      type: 'visit_website',
      label: 'Explore Rates',
      destination: 'https://',
      style: 'primary',
      position: 'bottom_bar',
      visible: true,
    },
    {
      id: 'cta-2',
      type: 'contact_us',
      label: 'Contact Us',
      destination: user.email || 'sales@company.com',
      style: 'outline',
      position: 'bottom_bar',
      visible: true,
    },
  ]);
  const [buttonLayout, setButtonLayout] = useState<'horizontal' | 'vertical' | 'overlay'>('horizontal');

  // Duration & Pricing
  const [selectedDurationKey, setSelectedDurationKey] = useState<'2days' | '10days' | '30days'>('10days');
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Payment Checkout
  const [showCheckout, setShowCheckout] = useState(false);
  const [pendingAdRecord, setPendingAdRecord] = useState<AdCampaignRecord | null>(null);

  if (!isOpen) return null;

  const currentDuration = DURATION_PRICING.find((d) => d.key === selectedDurationKey) || DURATION_PRICING[1];
  const totalCost = currentDuration.cost;

  const handleCreativeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check supported types: PNG, JPG, JPEG, WebP, GIF
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      toast('Please upload a valid creative: PNG, JPG, WebP, or GIF');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast('Creative file size must be less than 5MB');
      return;
    }

    setCreativeName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      setCreativePreview(reader.result as string);
      toast(`✓ Creative loaded: ${file.name}`);
    };
    reader.readAsDataURL(file);
  };

  const handleAddCta = () => {
    if (ctaButtons.length >= 3) {
      toast('Maximum 3 CTA buttons allowed per advertisement');
      return;
    }
    const newId = `cta-${Date.now()}`;
    setCtaButtons((prev) => [
      ...prev,
      {
        id: newId,
        type: 'whatsapp_us',
        label: 'WhatsApp Desk',
        destination: whatsappNumber || '+91',
        style: 'glass',
        position: 'bottom_bar',
        visible: true,
      },
    ]);
  };

  const handleRemoveCta = (id: string) => {
    setCtaButtons((prev) => prev.filter((b) => b.id !== id));
  };

  const handleUpdateCta = (id: string, updates: Partial<AdCtaButton>) => {
    setCtaButtons((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const toggleContinent = (cont: string) => {
    setSelectedContinents((prev) =>
      prev.includes(cont) ? prev.filter((c) => c !== cont) : [...prev, cont]
    );
  };

  const toggleCountry = (country: string) => {
    setSelectedCountries((prev) =>
      prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]
    );
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessName.trim()) {
      toast('Please enter business name');
      return;
    }
    if (!contactEmail.trim() || !contactEmail.includes('@')) {
      toast('Please enter valid contact email');
      return;
    }
    if (!contactPhone.trim()) {
      toast('Please enter valid telephone number');
      return;
    }
    if (!headline.trim()) {
      toast('Please enter advertisement headline');
      return;
    }
    if (!destUrl.trim() || destUrl === 'https://') {
      toast('Please enter valid destination website URL');
      return;
    }

    // Prepare Ad Campaign Record
    const record: AdCampaignRecord = {
      id: `AD-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      businessName: businessName.trim(),
      contactPerson: contactPerson.trim(),
      contactEmail: contactEmail.trim(),
      contactPhone: contactPhone.trim(),
      whatsappNumber: isSameWhatsApp ? contactPhone.trim() : whatsappNumber.trim(),
      companyWebsite: companyWebsite.trim(),
      headline: headline.trim(),
      description: description.trim() || headline.trim(),
      destUrl: destUrl.trim(),
      creativeUrl: creativePreview || undefined,
      creativeName: creativeName || undefined,
      category,
      targetAudience,
      geoScope: isWorldwide ? 'worldwide' : selectedContinents.length > 1 ? 'multi_continent' : 'continent',
      targetContinents: isWorldwide ? CONTINENTS : selectedContinents,
      targetCountries: isWorldwide ? [] : selectedCountries,
      isWorldwideRequested: isWorldwide,
      worldwideApprovalStatus: isWorldwide ? 'pending' : undefined,
      duration: selectedDurationKey,
      durationDays: currentDuration.days,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      ctaButtons,
      buttonLayout,
      costINR: totalCost,
      paymentStatus: 'unpaid',
      status: isWorldwide ? 'pending_godfather_approval' : 'submitted',
      impressions: 0,
      clicks: 0,
      ctr: 0,
      userId: user.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (isWorldwide) {
      // Phase 5.1: Worldwide requires Godfather administration review first!
      saveAd(record);
      toast('🛡️ Worldwide targeting requested! Campaign saved and routed to Godfather administration for review.');
      if (onSuccess) onSuccess(record);
      onClose();
    } else {
      setPendingAdRecord(record);
      setShowCheckout(true);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Book Sponsored Advertisement &amp; Creative Editor"
        maxWidth="1020px"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '20px', background: 'var(--surface-primary, #FFFFFF)' }}>
          {/* LEFT: Configuration & CTA Controls */}
          <form
            onSubmit={handleFormSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              maxHeight: '76vh',
              overflowY: 'auto',
              paddingRight: '10px',
            }}
          >
            {/* Advertiser Identification Card */}
            <div style={{ background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '8px', padding: '12px', boxShadow: '2px 2px 6px rgba(0,0,0,0.03)' }}>
              <b style={{ fontSize: '11.5px', color: 'var(--accent-primary, #006B68)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                <ShieldCheck size={12} /> Advertiser Identity &amp; Contact
              </b>
              <div className="grid g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-primary, #1F2937)', display: 'block', marginBottom: '2px' }}>
                    Business / Brand Name <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    className="input"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Maersk / MSC / Kuehne+Nagel"
                    style={{ width: '100%', height: '30px', fontSize: '11.5px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '4px', padding: '0 8px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-primary, #1F2937)', display: 'block', marginBottom: '2px' }}>
                    Contact Person Name <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    className="input"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Marketing Lead"
                    style={{ width: '100%', height: '30px', fontSize: '11.5px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '4px', padding: '0 8px' }}
                    required
                  />
                </div>
              </div>

              <div className="grid g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-primary, #1F2937)', display: 'block', marginBottom: '2px' }}>
                    Official Contact Email <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="email"
                    className="input"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="sponsor@company.com"
                    style={{ width: '100%', height: '30px', fontSize: '11.5px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '4px', padding: '0 8px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-primary, #1F2937)', display: 'block', marginBottom: '2px' }}>
                    Phone Number <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="tel"
                      className="input"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 9876543210"
                      style={{ flex: 1, height: '30px', fontSize: '11.5px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '4px', padding: '0 8px' }}
                      required
                    />
                    <label style={{ fontSize: '10px', color: 'var(--text-primary, #1F2937)', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={isSameWhatsApp}
                        onChange={(e) => setIsSameWhatsApp(e.target.checked)}
                      />
                      WhatsApp
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Content Card */}
            <div style={{ background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '8px', padding: '12px', boxShadow: '2px 2px 6px rgba(0,0,0,0.03)' }}>
              <b style={{ fontSize: '11.5px', color: 'var(--accent-primary, #006B68)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                <Tag size={12} /> Campaign Message &amp; Placement
              </b>
              <div>
                <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-primary, #1F2937)', display: 'block', marginBottom: '2px' }}>
                  Ad Headline <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  className="input"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Guaranteed FCL Allocation from Nhava Sheva to Rotterdam"
                  style={{ width: '100%', height: '30px', fontSize: '11.5px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '4px', padding: '0 8px' }}
                  required
                />
              </div>

              <div style={{ marginTop: '6px' }}>
                <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-primary, #1F2937)', display: 'block', marginBottom: '2px' }}>
                  Ad Promotional Description
                </label>
                <textarea
                  className="input"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short, high-impact value proposition displayed with your visual creative..."
                  style={{ width: '100%', fontSize: '11.5px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '4px', padding: '6px 8px', resize: 'vertical' }}
                />
              </div>

              <div className="grid g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '6px' }}>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-primary, #1F2937)', display: 'block', marginBottom: '2px' }}>
                    Destination URL <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="url"
                    className="input"
                    value={destUrl}
                    onChange={(e) => setDestUrl(e.target.value)}
                    placeholder="https://company.com/rates"
                    style={{ width: '100%', height: '30px', fontSize: '11.5px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '4px', padding: '0 8px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--text-primary, #1F2937)', display: 'block', marginBottom: '2px' }}>
                    Target Logistics Category
                  </label>
                  <select
                    className="input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: '100%', height: '30px', fontSize: '11.5px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '4px', padding: '0 6px' }}
                  >
                    <option value="Ocean Freight &amp; Carrier Direct">Ocean Freight &amp; Carrier Direct</option>
                    <option value="Air Cargo &amp; Charter Flights">Air Cargo &amp; Charter Flights</option>
                    <option value="Customs Brokerage &amp; Port CFS">Customs Brokerage &amp; Port CFS</option>
                    <option value="Project Cargo &amp; Heavy Lift">Project Cargo &amp; Heavy Lift</option>
                    <option value="Inland Trucking &amp; Rail Freight">Inland Trucking &amp; Rail Freight</option>
                    <option value="Trade Tech &amp; Supply Chain SaaS">Trade Tech &amp; Supply Chain SaaS</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Creative Upload Area */}
            <div style={{ background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '8px', padding: '12px', boxShadow: '2px 2px 6px rgba(0,0,0,0.03)' }}>
              <b style={{ fontSize: '11.5px', color: 'var(--accent-primary, #006B68)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                <Upload size={12} /> Creative Asset (237 × 299 px Desktop Rail)
              </b>
              <div
                style={{
                  border: '1px dashed var(--accent-primary, #006B68)',
                  borderRadius: '6px',
                  padding: '12px',
                  textAlign: 'center',
                  background: 'var(--surface-secondary, #F9FAFB)',
                  position: 'relative',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  onChange={handleCreativeUpload}
                  style={{
                    opacity: 0,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <Upload size={18} color="#075B5B" />
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary, #1F2937)' }}>
                    {creativeName ? `✓ ${creativeName}` : 'Click to Upload Creative (PNG, JPG, WebP, GIF)'}
                  </span>
                  <small style={{ color: 'var(--text-secondary, #64748B)', fontSize: '10px' }}>
                    Recommended 237 × 299 px · Max 5MB
                  </small>
                </div>
              </div>
            </div>

            {/* PHASE 4.2: CALL-TO-ACTION (CTA) BUTTON CONFIGURATION */}
            <div style={{ background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '8px', padding: '12px', boxShadow: '2px 2px 6px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <b style={{ fontSize: '11.5px', color: 'var(--accent-primary, #006B68)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <ExternalLink size={12} /> Actionable Call-To-Action (CTA) Buttons
                </b>
                <button
                  type="button"
                  onClick={handleAddCta}
                  disabled={ctaButtons.length >= 3}
                  style={{
                    background: 'var(--surface-primary, #FFFFFF)',
                    border: '1px solid var(--accent-primary, #006B68)',
                    color: 'var(--accent-primary, #006B68)',
                    fontSize: '10.5px',
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  <Plus size={11} /> Add CTA Button
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {ctaButtons.map((btn, idx) => (
                  <div
                    key={btn.id}
                    style={{
                      background: 'var(--surface-secondary, #F9FAFB)',
                      border: '1px solid var(--border-default, #D9DEE5)',
                      borderRadius: '6px',
                      padding: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--accent-primary, #006B68)' }}>
                        Button #{idx + 1}
                      </span>
                      <select
                        value={btn.type}
                        onChange={(e) => {
                          const t = e.target.value as CtaType;
                          let defaultLabel = 'Click Here';
                          let defaultDest = destUrl;
                          if (t === 'email_us') { defaultLabel = 'Email Us'; defaultDest = contactEmail; }
                          else if (t === 'whatsapp_us') { defaultLabel = 'WhatsApp Us'; defaultDest = whatsappNumber; }
                          else if (t === 'call_now') { defaultLabel = 'Call Now'; defaultDest = contactPhone; }
                          else if (t === 'contact_us') { defaultLabel = 'Contact Us'; defaultDest = destUrl; }
                          else if (t === 'visit_website') { defaultLabel = 'Visit Website'; defaultDest = destUrl; }
                          else if (t === 'learn_more') { defaultLabel = 'Learn More'; defaultDest = destUrl; }
                          else if (t === 'apply_now') { defaultLabel = 'Apply Now'; defaultDest = destUrl; }

                          handleUpdateCta(btn.id, { type: t, label: defaultLabel, destination: defaultDest });
                        }}
                        style={{ height: '26px', fontSize: '11px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '4px', padding: '0 4px' }}
                      >
                        <option value="visit_website">Visit Website</option>
                        <option value="contact_us">Contact Us</option>
                        <option value="email_us">Email Us (mailto:)</option>
                        <option value="whatsapp_us">WhatsApp Us</option>
                        <option value="call_now">Call Now (tel:)</option>
                        <option value="learn_more">Learn More</option>
                        <option value="apply_now">Apply Now</option>
                        <option value="custom">Custom Button</option>
                      </select>

                      <input
                        type="text"
                        value={btn.label}
                        onChange={(e) => handleUpdateCta(btn.id, { label: e.target.value })}
                        placeholder="Button Text"
                        style={{ flex: 1, height: '26px', fontSize: '11px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '4px', padding: '0 6px' }}
                      />

                      <button
                        type="button"
                        onClick={() => handleRemoveCta(btn.id)}
                        style={{ background: 'none', border: 'none', color: '#DC2626', cursor: 'pointer', padding: '2px' }}
                        title="Remove button"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary, #64748B)' }}>Target:</span>
                      <input
                        type="text"
                        value={btn.destination}
                        onChange={(e) => handleUpdateCta(btn.id, { destination: e.target.value })}
                        placeholder="URL, email or phone number"
                        style={{ flex: 1, height: '24px', fontSize: '10.5px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '4px', padding: '0 6px' }}
                      />
                      <select
                        value={btn.style}
                        onChange={(e) => handleUpdateCta(btn.id, { style: e.target.value as any })}
                        style={{ height: '24px', fontSize: '10px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '4px', padding: '0 4px' }}
                      >
                        <option value="primary">Teal Fill</option>
                        <option value="outline">Neutral Outline</option>
                        <option value="glass">Soft Highlight</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* PHASE 5: GEOGRAPHIC TARGETING & WORLDWIDE PRIVILEGE RESTRICTION */}
            <div style={{ background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '8px', padding: '12px', boxShadow: '2px 2px 6px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <b style={{ fontSize: '11.5px', color: 'var(--accent-primary, #006B68)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Globe size={12} /> Geographic Targeting &amp; Regional Scope
                </b>
                <label style={{ fontSize: '11px', color: 'var(--text-primary, #1F2937)', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={isWorldwide}
                    onChange={(e) => setIsWorldwide(e.target.checked)}
                  />
                  Request Worldwide Scope
                </label>
              </div>

              {isWorldwide ? (
                <div style={{ background: 'rgba(217, 119, 6, 0.1)', border: '1px solid #F59E0B', borderRadius: '6px', padding: '10px', fontSize: '11.5px', color: '#d97706' }}>
                  <b style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                    <AlertTriangle size={14} /> Privileged Scope: Godfather Review Required
                  </b>
                  Worldwide advertisement placement is a privileged scope. When submitted, this campaign will be saved with a <strong>pending review</strong> status and requires explicit authorization by the Godfather administration before going live.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-secondary, #64748B)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Target Continents:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                      {CONTINENTS.map((cont) => {
                        const active = selectedContinents.includes(cont);
                        return (
                          <button
                            key={cont}
                            type="button"
                            onClick={() => toggleContinent(cont)}
                            style={{
                              background: active ? '#075B5B' : '#FFFFFF',
                              color: active ? '#FFFFFF' : '#172B45',
                              border: active ? '1px solid #075B5B' : '1px solid var(--border-default, #D9DEE5)',
                              borderRadius: '4px',
                              padding: '2px 8px',
                              fontSize: '11px',
                              cursor: 'pointer',
                              fontWeight: active ? 600 : 400,
                            }}
                          >
                            {cont}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-secondary, #64748B)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                      Key Country Corridors:
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {COMMON_COUNTRIES.map((ctry) => {
                        const active = selectedCountries.includes(ctry);
                        return (
                          <button
                            key={ctry}
                            type="button"
                            onClick={() => toggleCountry(ctry)}
                            style={{
                              background: active ? 'rgba(16, 185, 129, 0.12)' : '#FFFFFF',
                              color: active ? '#137333' : '#526174',
                              border: active ? '1px solid #A8DAB5' : '1px solid var(--border-default, #D9DEE5)',
                              borderRadius: '4px',
                              padding: '2px 6px',
                              fontSize: '10.5px',
                              cursor: 'pointer',
                              fontWeight: active ? 600 : 400,
                            }}
                          >
                            {active ? '✓ ' : ''}{ctry}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Duration & Pricing Matrix */}
            <div style={{ background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '8px', padding: '12px', boxShadow: '2px 2px 6px rgba(0,0,0,0.03)' }}>
              <b style={{ fontSize: '11.5px', color: 'var(--accent-primary, #006B68)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                <DollarSign size={12} /> Campaign Duration &amp; Tariff
              </b>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {DURATION_PRICING.map((d) => {
                  const isSel = selectedDurationKey === d.key;
                  return (
                    <div
                      key={d.key}
                      onClick={() => setSelectedDurationKey(d.key as any)}
                      style={{
                        padding: '8px',
                        borderRadius: '6px',
                        border: isSel ? '2px solid #075B5B' : '1px solid var(--border-default, #D9DEE5)',
                        background: isSel ? '#F0FDF4' : '#FFFFFF',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <b style={{ fontSize: '13px', color: isSel ? '#075B5B' : '#172B45', display: 'block' }}>
                        ₹{d.cost.toLocaleString('en-IN')}
                      </b>
                      <small style={{ fontSize: '10.5px', color: 'var(--text-secondary, #64748B)' }}>{d.label}</small>
                    </div>
                  );
                })}
              </div>

              {/* Total Summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-default, #D9DEE5)' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-secondary, #64748B)' }}>Total Campaign Investment:</span>
                  <strong style={{ fontSize: '14px', color: 'var(--accent-primary, #006B68)', marginLeft: '6px' }}>₹{totalCost.toLocaleString('en-IN')}</strong>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={onClose}
                    style={{
                      height: '32px',
                      padding: '0 14px',
                      background: 'var(--surface-primary, #FFFFFF)',
                      border: '1px solid var(--border-default, #D9DEE5)',
                      color: 'var(--text-primary, #1F2937)',
                      borderRadius: '4px',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      height: '32px',
                      padding: '0 18px',
                      background: '#075B5B',
                      border: '1px solid var(--accent-primary, #006B68)',
                      color: '#FFFFFF',
                      borderRadius: '4px',
                      fontSize: '11.5px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      boxShadow: '0 2px 4px rgba(7, 91, 91, 0.25)',
                    }}
                  >
                    {isWorldwide ? 'Request Worldwide Approval' : 'Proceed to Payment'}
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* RIGHT: Live Advertisement Preview Editor (Phase 4.3) */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              borderLeft: '1px solid var(--border-default, #D9DEE5)',
              paddingLeft: '16px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <b style={{ fontSize: '12px', color: 'var(--text-primary, #1F2937)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <Eye size={13} color="#075B5B" /> Live Advertisement Preview
              </b>
              <div style={{ display: 'flex', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  style={{
                    background: previewDevice === 'desktop' ? '#075B5B' : '#FFFFFF',
                    color: previewDevice === 'desktop' ? '#FFFFFF' : '#526174',
                    border: '1px solid var(--border-default, #D9DEE5)',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Monitor size={11} /> Desktop
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  style={{
                    background: previewDevice === 'mobile' ? '#075B5B' : '#FFFFFF',
                    color: previewDevice === 'mobile' ? '#FFFFFF' : '#526174',
                    border: '1px solid var(--border-default, #D9DEE5)',
                    borderRadius: '4px',
                    padding: '3px 8px',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Smartphone size={11} /> Mobile
                </button>
              </div>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-secondary, #64748B)', margin: 0 }}>
              Live rendering matching the 237 × 299 px sponsored placement in the FR8X feed sidebar.
            </p>

            {/* The Actual Rendered Ad Card */}
            <div
              style={{
                width: previewDevice === 'desktop' ? '237px' : '100%',
                maxWidth: '280px',
                minHeight: '299px',
                margin: '0 auto',
                background: 'var(--surface-primary, #FFFFFF)',
                border: '1px solid var(--border-default, #D9DEE5)',
                borderRadius: '8px',
                padding: '10px',
                boxShadow: '4px 4px 10px rgba(0,0,0,0.06), -4px -4px 10px rgba(255,255,255,0.95)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                {/* Sponsor Label */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary, #64748B)', letterSpacing: '0.04em' }}>
                    SPONSORED
                  </span>
                  <span style={{ fontSize: '9px', color: 'var(--accent-primary, #006B68)', fontWeight: 600 }}>
                    {isWorldwide ? 'WORLDWIDE' : selectedContinents[0] || 'REGIONAL'}
                  </span>
                </div>

                {/* Creative Visual */}
                <div
                  style={{
                    width: '100%',
                    height: '130px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    backgroundColor: 'var(--surface-secondary, #F9FAFB)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid var(--border-default, #D9DEE5)',
                    position: 'relative',
                  }}
                >
                  {creativePreview ? (
                    <img
                      src={creativePreview}
                      alt="Ad Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '10px' }}>
                      <Globe size={24} color="#075B5B" />
                      <span style={{ fontSize: '10px', color: 'var(--text-secondary, #64748B)', display: 'block', marginTop: '4px' }}>
                        237 × 299 px Creative
                      </span>
                    </div>
                  )}
                  {/* Category Pill */}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '4px',
                      left: '4px',
                      background: 'rgba(23, 43, 69, 0.85)',
                      color: '#FFFFFF',
                      fontSize: '8.5px',
                      padding: '1px 5px',
                      borderRadius: '3px',
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    {businessName || 'Sponsor'}
                  </span>
                </div>

                {/* Headline & Description */}
                <h4 style={{ margin: '8px 0 4px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', lineHeight: 1.3 }}>
                  {headline || 'Your Catchy Logistics Headline Appears Here'}
                </h4>
                <p style={{ margin: 0, fontSize: '10.5px', color: 'var(--text-secondary, #64748B)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {description || 'Promotional message detailing ocean rates, port reliability, and direct carrier booking assurances.'}
                </p>
              </div>

              {/* Actionable CTA Buttons Rendered */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '10px', paddingTop: '8px', borderTop: '1px solid var(--border-default, #D9DEE5)' }}>
                {ctaButtons.filter((b) => b.visible).map((btn) => (
                  <button
                    key={btn.id}
                    type="button"
                    onClick={() => {
                      toast(`Simulated Action: ${btn.label} -> ${btn.destination}`);
                    }}
                    style={{
                      width: '100%',
                      height: '26px',
                      borderRadius: '4px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      ...(btn.style === 'primary'
                        ? { background: '#075B5B', color: '#FFFFFF', border: '1px solid var(--accent-primary, #006B68)' }
                        : btn.style === 'glass'
                        ? { background: 'rgba(16, 185, 129, 0.12)', color: '#137333', border: '1px solid #A8DAB5' }
                        : { background: 'var(--surface-primary, #FFFFFF)', color: 'var(--text-primary, #1F2937)', border: '1px solid var(--border-default, #D9DEE5)' }),
                    }}
                  >
                    {btn.type === 'email_us' ? (
                      <Mail size={11} />
                    ) : btn.type === 'call_now' ? (
                      <Phone size={11} />
                    ) : btn.type === 'whatsapp_us' ? (
                      <MessageCircle size={11} />
                    ) : (
                      <ExternalLink size={11} />
                    )}
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ background: 'var(--surface-secondary, #F9FAFB)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '6px', padding: '8px 10px', fontSize: '10.5px', color: 'var(--text-secondary, #64748B)' }}>
              <strong>Target Corridors:</strong>{' '}
              {isWorldwide ? 'Worldwide (Global All Ports)' : `${selectedContinents.join(', ')} (${selectedCountries.slice(0, 3).join(', ')}${selectedCountries.length > 3 ? ` +${selectedCountries.length - 3}` : ''})`}
            </div>
          </div>
        </div>
      </Modal>

      {/* Commercial Checkout Modal for Ads */}
      {showCheckout && pendingAdRecord && (
        <PaymentCheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          itemType="ad"
          itemTitle={pendingAdRecord.headline}
          amount={totalCost}
          onPaymentSuccess={(details) => {
            const confirmed: AdCampaignRecord = {
              ...pendingAdRecord,
              paymentStatus: details.paymentStatus === 'paid' ? 'paid' : 'pending_verification',
              paymentReference: details.paymentReference,
              status: details.paymentStatus === 'paid' ? 'active' : 'submitted',
            };
            saveAd(confirmed);
            setShowCheckout(false);
            toast(`🎉 Sponsored ad campaign booked and activated! Status: ${confirmed.status.toUpperCase()}`);
            if (onSuccess) onSuccess(confirmed);
            onClose();
          }}
        />
      )}
    </>
  );
}

export default AdBookingModal;
