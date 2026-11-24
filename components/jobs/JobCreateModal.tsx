'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Mail,
  Phone,
  Briefcase,
  DollarSign,
  Calendar,
  FileText,
  Building2,
  MapPin,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { useData } from '@/lib/context/DataContext';
import { useToast } from '@/lib/context/ToastContext';
import { PaymentCheckoutModal } from '@/components/ui/PaymentCheckoutModal';
import { AiJobSuggestions } from '@/components/ai/AiJobSuggestions';

export interface AdditionalEmail {
  id: string;
  email: string;
  label: 'Recruiter' | 'HR' | 'Operations' | 'Finance' | 'Executive';
}

export interface JobCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DURATION_TIERS = [
  { days: 2, label: '2 Days (Min)', cost: 300 },
  { days: 7, label: '7 Days', cost: 1200 },
  { days: 15, label: '15 Days', cost: 2640 },
  { days: 30, label: '30 Days', cost: 5340 },
];

export function JobCreateModal({ isOpen, onClose, onSuccess }: JobCreateModalProps) {
  const { user } = useAuth();
  const { addJob } = useData();
  const { toast } = useToast();

  // Basic job fields
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState(user.company || 'COGOPORT PRIVATE LIMITED');
  const [location, setLocation] = useState(
    user.city ? `${user.city}, India · On-site` : 'Gurugram (Sikanderpur), India · On-site'
  );
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [category, setCategory] = useState('Ocean Freight & Liner Operations');
  const [vacancies, setVacancies] = useState('1');
  const [experience, setExperience] = useState('3–5 yrs experience');
  const [packageDetails, setPackageDetails] = useState('');
  const [closingDate, setClosingDate] = useState('');
  const [skills, setSkills] = useState('');
  const [description, setDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [qualifications, setQualifications] = useState('');

  // Contact & Application Channels (Critical Requirement)
  const [contactPerson, setContactPerson] = useState(user.displayName || '');
  const [contactDesignation, setContactDesignation] = useState(user.designation || 'Head of Talent Acquisition');
  const [companyWebsite, setCompanyWebsite] = useState('https://');
  const [whatsappNumber, setWhatsappNumber] = useState(user.mobile || user.phone || '');
  const [primaryEmail, setPrimaryEmail] = useState(user.email || '');
  const [contactPhone, setContactPhone] = useState(user.mobile || user.phone || '');
  const [hasWhatsApp, setHasWhatsApp] = useState(true);
  const [additionalEmails, setAdditionalEmails] = useState<AdditionalEmail[]>([]);
  const [newEmailInput, setNewEmailInput] = useState('');
  const [newEmailLabel, setNewEmailLabel] = useState<AdditionalEmail['label']>('Recruiter');
  const [showAddEmailRow, setShowAddEmailRow] = useState(false);
  const [applicationInstructions, setApplicationInstructions] = useState(
    'Please apply with updated CV quoting job title and reference code in subject line.'
  );
  const [applicationMethod, setApplicationMethod] = useState<'both' | 'email' | 'in_app'>('both');

  // Tariff & Commercials
  const [durationDays, setDurationDays] = useState(2);
  const [autoRenew, setAutoRenew] = useState(true);

  // Payment checkout state
  const [showCheckout, setShowCheckout] = useState(false);
  const [pendingJobPayload, setPendingJobPayload] = useState<any>(null);

  if (!isOpen) return null;

  const currentTier = DURATION_TIERS.find((t) => t.days === durationDays) || DURATION_TIERS[0];
  const totalCost = currentTier.cost;

  // Check if eligible for promotional free waiver
  const isFreeWaiver =
    user.role === 'super_admin' ||
    Boolean(user.hasGoldenTick) ||
    Boolean((user as any).isFreeWaiverActive) ||
    Boolean((user as any).companyIsPromotional);

  const handleAddEmail = () => {
    const trimmed = newEmailInput.trim();
    if (!trimmed || !trimmed.includes('@')) {
      toast('Please enter a valid email address.');
      return;
    }
    setAdditionalEmails((prev) => [
      ...prev,
      { id: `ae_${Date.now()}`, email: trimmed, label: newEmailLabel },
    ]);
    setNewEmailInput('');
    setShowAddEmailRow(false);
  };

  const handleRemoveEmail = (id: string) => {
    setAdditionalEmails((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast('Please enter a job title.');
      return;
    }
    if (!requirements.trim() && !description.trim()) {
      toast('Please enter the core requirements or job description.');
      return;
    }
    if (!primaryEmail.trim() || !primaryEmail.includes('@')) {
      toast('Please enter a valid official company / recruiter email address.');
      return;
    }
    if (!contactPhone.trim() && !whatsappNumber.trim()) {
      toast('Please provide at least one valid telephone or WhatsApp contact number.');
      return;
    }

    const payload = {
      title: title.trim(),
      company: company.trim() || 'Enterprise Logistics',
      companyId: user.companyId || null,
      location: location.trim() || 'Pan-India',
      employmentType,
      category,
      vacancies: parseInt(vacancies, 10) || 1,
      experience: experience.trim(),
      packageDetails: packageDetails.trim() || 'Competitive',
      closingDate: closingDate || undefined,
      skills: skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      description: description.trim() || requirements.trim(),
      requirements: requirements.trim() || description.trim(),
      responsibilities: responsibilities.trim() || undefined,
      qualifications: qualifications.trim() || undefined,

      // Employer Contact Details (Mandatory)
      contactPerson: contactPerson.trim() || user.displayName || 'Hiring Lead',
      contactDesignation: contactDesignation.trim() || user.designation || 'Talent Acquisition',
      posterEmail: primaryEmail.trim(),
      companyWebsite: companyWebsite.trim() && companyWebsite !== 'https://' ? companyWebsite.trim() : undefined,
      contactEmails: [
        { email: primaryEmail.trim(), label: 'Official Company Email', isPrimary: true },
        ...additionalEmails.map((ae) => ({ email: ae.email, label: ae.label, isPrimary: false })),
      ],
      contactPhone: contactPhone.trim(),
      whatsappNumber: whatsappNumber.trim() || (hasWhatsApp ? contactPhone.trim() : ''),
      hasWhatsApp: Boolean(hasWhatsApp || whatsappNumber.trim()),
      applicationInstructions: applicationInstructions.trim(),
      applicationMethod,

      // Commercials
      tariffDuration: durationDays,
      isAutoRenew: autoRenew,
      cost: totalCost,
      status: 'active' as const,
    };

    if (isFreeWaiver) {
      addJob({
        ...payload,
        paymentStatus: 'waived_promotional',
        paidAmount: 0,
      });
      toast('🎉 Promotional free waiver applied! Job opportunity published live.');
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setPendingJobPayload(payload);
      setShowCheckout(true);
    }
  };

  return (
    <>
      <div
        className="modal-overlay"
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px',
        }}
      >
        <div
          className="modal-card"
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.25), 0 0 1px 1px rgba(0, 0, 0, 0.05)',
            border: '1px solid #D9E0E8',
            width: '100%',
            maxWidth: '740px',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'modalSlideIn 0.2s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid #D9E0E8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FFFFFF',
            }}
          >
            <b style={{ fontSize: '15px', color: '#172B45', fontWeight: 700 }}>
              Post a Job Opportunity
            </b>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                backgroundColor: '#DC2626',
                border: 'none',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'transform 0.1s ease',
              }}
              title="Close modal"
            >
              <X size={15} />
            </button>
          </div>

          {/* Form Body */}
          <form
            onSubmit={handleSubmit}
            style={{
              overflowY: 'auto',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              backgroundColor: '#FFFFFF',
            }}
          >
            {/* Row 1: Title & Company */}
            <div className="grid g2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172B45', marginBottom: '4px' }}>
                  Job Title <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  className="input"
                  placeholder="e.g. Senior Freight Analyst"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  style={{ width: '100%', height: '34px', fontSize: '12px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '6px', padding: '0 10px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172B45', marginBottom: '4px' }}>
                  Company
                </label>
                <input
                  className="input"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  style={{ width: '100%', height: '34px', fontSize: '12px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '6px', padding: '0 10px' }}
                />
              </div>
            </div>

            {/* Row 2: Category & Vacancies */}
            <div className="grid g2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172B45', marginBottom: '4px' }}>
                  Job Category / Department <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <select
                  className="input"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ width: '100%', height: '34px', fontSize: '12px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '6px', padding: '0 8px' }}
                >
                  <option value="Ocean Freight & Liner Operations">Ocean Freight & Liner Operations</option>
                  <option value="Air Cargo & Charter Operations">Air Cargo & Charter Operations</option>
                  <option value="Customs Brokerage & Port Clearance">Customs Brokerage & Port Clearance</option>
                  <option value="Surface Transport & Fleet Management">Surface Transport & Fleet Management</option>
                  <option value="Warehousing & 3PL Logistics">Warehousing & 3PL Logistics</option>
                  <option value="Freight Procurement & Reverse Auctions">Freight Procurement & Reverse Auctions</option>
                  <option value="Commercial Trade Sales & Key Accounts">Commercial Trade Sales & Key Accounts</option>
                  <option value="Logistics Finance, Billing & Compliance">Logistics Finance, Billing & Compliance</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172B45', marginBottom: '4px' }}>
                  Number of Vacancies
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  className="input"
                  value={vacancies}
                  onChange={(e) => setVacancies(e.target.value)}
                  style={{ width: '100%', height: '34px', fontSize: '12px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '6px', padding: '0 10px' }}
                />
              </div>
            </div>

            {/* Row 3: Location & Employment Type */}
            <div className="grid g2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172B45', marginBottom: '4px' }}>
                  Location
                </label>
                <input
                  className="input"
                  placeholder="e.g. Gurugram (Sikanderpur), India · On-site"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  style={{ width: '100%', height: '34px', fontSize: '12px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '6px', padding: '0 10px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172B45', marginBottom: '4px' }}>
                  Employment Type
                </label>
                <select
                  className="input"
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  style={{ width: '100%', height: '34px', fontSize: '12px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '6px', padding: '0 8px' }}
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Freelance">Freelance</option>
                  <option value="Remote">Remote</option>
                </select>
              </div>
            </div>

            {/* Row 3: Experience & Package */}
            <div className="grid g2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172B45', marginBottom: '4px' }}>
                  Experience
                </label>
                <input
                  className="input"
                  placeholder="e.g. 3–5 yrs experience"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  style={{ width: '100%', height: '34px', fontSize: '12px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '6px', padding: '0 10px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172B45', marginBottom: '4px' }}>
                  Package / Compensation
                </label>
                <input
                  className="input"
                  placeholder="e.g. ₹10–15 LPA"
                  value={packageDetails}
                  onChange={(e) => setPackageDetails(e.target.value)}
                  style={{ width: '100%', height: '34px', fontSize: '12px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '6px', padding: '0 10px' }}
                />
              </div>
            </div>

            {/* Row 4: Closing Date & Skills */}
            <div className="grid g2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172B45', marginBottom: '4px' }}>
                  Closing Date
                </label>
                <input
                  type="date"
                  className="input"
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  style={{ width: '100%', height: '34px', fontSize: '12px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '6px', padding: '0 10px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172B45', marginBottom: '4px' }}>
                  Skills (comma-separated)
                </label>
                <input
                  className="input"
                  placeholder="FCL, Carrier Negotiations, INCOTERMS"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  style={{ width: '100%', height: '34px', fontSize: '12px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '6px', padding: '0 10px' }}
                />
              </div>
            </div>

            {/* Row 5: Job Description */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172B45', marginBottom: '4px' }}>
                Job Description
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="Comprehensive overview of the role, team context, and objectives..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%', fontSize: '12px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '6px', padding: '8px 10px', resize: 'vertical' }}
              />
            </div>

            {/* Row 6: Requirements */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172B45', marginBottom: '4px' }}>
                Requirements <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="Key skills, tools, and experience required..."
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                style={{ width: '100%', fontSize: '12px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '6px', padding: '8px 10px', resize: 'vertical' }}
                required
              />
              <div style={{ marginTop: '6px' }}>
                <AiJobSuggestions onAppend={(text) => setRequirements((prev) => (prev ? prev + '\n' + text : text))} />
              </div>
            </div>

            {/* Row 6: Responsibilities */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172B45', marginBottom: '4px' }}>
                Responsibilities
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="Day-to-day responsibilities..."
                value={responsibilities}
                onChange={(e) => setResponsibilities(e.target.value)}
                style={{ width: '100%', fontSize: '12px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '6px', padding: '8px 10px', resize: 'vertical' }}
              />
            </div>

            {/* Row 7: Qualifications */}
            <div>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#172B45', marginBottom: '4px' }}>
                Qualifications
              </label>
              <textarea
                className="input"
                rows={2}
                placeholder="Educational background, certifications..."
                value={qualifications}
                onChange={(e) => setQualifications(e.target.value)}
                style={{ width: '100%', fontSize: '12px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '6px', padding: '8px 10px', resize: 'vertical' }}
              />
            </div>

            {/* Row 8: Employer Contact Information (Mandatory Section) */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #D9E0E8',
                borderRadius: '8px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                boxShadow: '2px 2px 8px rgba(0,0,0,0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #D9E0E8', paddingBottom: '6px' }}>
                <b style={{ fontSize: '12.5px', color: '#075B5B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={14} /> Employer Contact Information
                </b>
                <span style={{ fontSize: '10.5px', color: '#526174' }}>
                  Mandatory for application routing &amp; applicant verification
                </span>
              </div>

              {/* Contact Person Name & Designation */}
              <div className="grid g2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172B45', marginBottom: '3px' }}>
                    Contact Person Name <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Rajat Kumar / Lead Recruiter"
                    style={{ width: '100%', height: '32px', fontSize: '12px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '6px', padding: '0 10px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172B45', marginBottom: '3px' }}>
                    Designation
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={contactDesignation}
                    onChange={(e) => setContactDesignation(e.target.value)}
                    placeholder="e.g. Head of Talent Acquisition"
                    style={{ width: '100%', height: '32px', fontSize: '12px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '6px', padding: '0 10px' }}
                  />
                </div>
              </div>

              {/* Official Email & Company Website */}
              <div className="grid g2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172B45', marginBottom: '3px' }}>
                    Official Company Email Address <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <input
                    type="email"
                    className="input"
                    value={primaryEmail}
                    onChange={(e) => setPrimaryEmail(e.target.value)}
                    placeholder="recruiter@company.com"
                    style={{ width: '100%', height: '32px', fontSize: '12px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '6px', padding: '0 10px' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172B45', marginBottom: '3px' }}>
                    Company Website
                  </label>
                  <input
                    type="url"
                    className="input"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="https://company.com"
                    style={{ width: '100%', height: '32px', fontSize: '12px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '6px', padding: '0 10px' }}
                  />
                </div>
              </div>

              {/* Phone & WhatsApp Number */}
              <div className="grid g2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172B45', marginBottom: '3px' }}>
                    Contact Phone Number <span style={{ color: '#DC2626' }}>*</span>
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="tel"
                      className="input"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      style={{ flex: 1, height: '32px', fontSize: '12px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '6px', padding: '0 10px' }}
                      required
                    />
                    <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#172B45', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      <input
                        type="checkbox"
                        checked={hasWhatsApp}
                        onChange={(e) => setHasWhatsApp(e.target.checked)}
                      />
                      Same on WhatsApp
                    </label>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#172B45', marginBottom: '3px' }}>
                    Dedicated WhatsApp Number (International format)
                  </label>
                  <input
                    type="tel"
                    className="input"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    placeholder="+919876543210 (country code + number)"
                    style={{ width: '100%', height: '32px', fontSize: '12px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '6px', padding: '0 10px' }}
                  />
                </div>
              </div>

              {/* Additional Contact Emails list */}
              {additionalEmails.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 600, color: '#526174' }}>Secondary Notification Emails:</span>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {additionalEmails.map((ae) => (
                      <span
                        key={ae.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#F4F6F8',
                          border: '1px solid #D9E0E8',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          fontSize: '11px',
                          color: '#172B45',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#075B5B' }}>[{ae.label}]</span>
                        {ae.email}
                        <button
                          type="button"
                          onClick={() => handleRemoveEmail(ae.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#DC2626' }}
                          title="Remove email"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* + ADD EMAIL control */}
              {showAddEmailRow ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                  <select
                    value={newEmailLabel}
                    onChange={(e) => setNewEmailLabel(e.target.value as any)}
                    style={{ height: '30px', fontSize: '11px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '4px', padding: '0 6px' }}
                  >
                    <option value="Recruiter">Recruiter</option>
                    <option value="HR">HR</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                    <option value="Executive">Executive</option>
                  </select>
                  <input
                    type="email"
                    placeholder="additional.recruiter@company.com"
                    value={newEmailInput}
                    onChange={(e) => setNewEmailInput(e.target.value)}
                    style={{ flex: 1, height: '30px', fontSize: '11.5px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '4px', padding: '0 8px' }}
                  />
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    style={{
                      height: '30px',
                      padding: '0 10px',
                      background: '#075B5B',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddEmailRow(false)}
                    style={{
                      height: '30px',
                      padding: '0 8px',
                      background: 'none',
                      border: '1px solid #D9E0E8',
                      borderRadius: '4px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div>
                  <button
                    type="button"
                    onClick={() => setShowAddEmailRow(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#FFFFFF',
                      border: '1px dashed #075B5B',
                      color: '#075B5B',
                      padding: '3px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    <Plus size={11} /> + ADD EMAIL
                  </button>
                </div>
              )}

              {/* Application Instructions & Method */}
              <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#172B45' }}>
                  Application Instructions &amp; Preference
                </label>
                <input
                  className="input"
                  value={applicationInstructions}
                  onChange={(e) => setApplicationInstructions(e.target.value)}
                  placeholder="e.g. Apply via portal or send resume to recruiter..."
                  style={{ width: '100%', height: '30px', fontSize: '11.5px', background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: '4px', padding: '0 8px' }}
                />
                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginTop: '2px' }}>
                  <label style={{ fontSize: '11px', color: '#172B45', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="appMethod"
                      checked={applicationMethod === 'both'}
                      onChange={() => setApplicationMethod('both')}
                    />
                    Accept In-App &amp; Direct Email
                  </label>
                  <label style={{ fontSize: '11px', color: '#172B45', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="appMethod"
                      checked={applicationMethod === 'in_app'}
                      onChange={() => setApplicationMethod('in_app')}
                    />
                    FR8X In-App Only
                  </label>
                  <label style={{ fontSize: '11px', color: '#172B45', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="appMethod"
                      checked={applicationMethod === 'email'}
                      onChange={() => setApplicationMethod('email')}
                    />
                    Direct Email Only
                  </label>
                </div>
              </div>
            </div>

            {/* Row 9: Tariff & Duration Box (Screenshot 1 Reference) */}
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #D9E0E8',
                borderRadius: '8px',
                padding: '14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ fontSize: '12px', color: '#075B5B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <DollarSign size={13} /> Job Listing Tariff &amp; Duration
                </b>
                <span style={{ fontSize: '11px', color: '#526174' }}>
                  ₹300 for 2 days · ₹180/day thereafter
                </span>
              </div>

              {/* 4 Duration Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '8px',
                }}
              >
                {DURATION_TIERS.map((tier) => {
                  const isSelected = durationDays === tier.days;
                  return (
                    <div
                      key={tier.days}
                      onClick={() => setDurationDays(tier.days)}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '6px',
                        border: isSelected ? '2px solid #075B5B' : '1px solid #D9E0E8',
                        backgroundColor: isSelected ? '#F0FDF4' : '#FFFFFF',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.1s ease',
                      }}
                    >
                      <b style={{ fontSize: '14px', color: isSelected ? '#075B5B' : '#172B45', display: 'block' }}>
                        ₹{tier.cost.toLocaleString('en-IN')}
                      </b>
                      <small style={{ fontSize: '10.5px', color: '#526174', marginTop: '2px', display: 'block' }}>
                        {tier.label}
                      </small>
                    </div>
                  );
                })}
              </div>

              {/* Pricing Summary Box (Phase 3 Directive) */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderTop: '1px solid #D9E0E8',
                  paddingTop: '12px',
                  marginTop: '6px',
                  backgroundColor: '#F8FAFC',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid #D9E0E8',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span style={{ fontSize: '11px', color: '#526174' }}>
                    Job Listing Package: <strong>₹{totalCost.toLocaleString('en-IN')}</strong>
                  </span>
                  <span style={{ fontSize: '11px', color: '#526174' }}>
                    Duration: <strong>{durationDays} Days</strong>
                  </span>
                  <label style={{ fontSize: '11px', color: '#172B45', display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', marginTop: '2px' }}>
                    <input
                      type="checkbox"
                      checked={autoRenew}
                      onChange={(e) => setAutoRenew(e.target.checked)}
                    />
                    Auto-renew listing at ₹180/day thereafter
                  </label>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10.5px', color: '#526174', display: 'block', fontWeight: 600 }}>
                    TOTAL PAYABLE
                  </span>
                  <b style={{ fontSize: '18px', color: '#075B5B' }}>
                    {isFreeWaiver ? '₹0 (Promotional Waiver)' : `₹${totalCost.toLocaleString('en-IN')}`}
                  </b>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '4px',
                paddingTop: '8px',
              }}
            >
              <button
                type="button"
                onClick={onClose}
                style={{
                  height: '34px',
                  padding: '0 16px',
                  backgroundColor: '#FFFFFF',
                  color: '#172B45',
                  border: '1px solid #D9E0E8',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '1px 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  height: '34px',
                  minWidth: '100px',
                  padding: '0 24px',
                  backgroundColor: '#075B5B',
                  color: '#FFFFFF',
                  border: '1px solid #075B5B',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(7, 91, 91, 0.25), inset 0 1px 0 rgba(255,255,255,0.3)',
                  letterSpacing: '0.04em',
                }}
              >
                {isFreeWaiver ? 'POST JOB' : 'PAY'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Commercial Payment Modal */}
      {showCheckout && pendingJobPayload && (
        <PaymentCheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          itemType="job"
          itemTitle={pendingJobPayload.title}
          amount={totalCost}
          onPaymentSuccess={(details) => {
            addJob({
              ...pendingJobPayload,
              paymentStatus: details.paymentStatus,
              paidAmount: details.paidAmount,
              paymentMethod: details.paymentMethod,
              paymentReference: details.paymentReference,
              paymentVerifiedAt: details.paymentStatus === 'paid' ? new Date().toISOString() : undefined,
            });
            setShowCheckout(false);
            if (onSuccess) onSuccess();
            onClose();
          }}
        />
      )}
    </>
  );
}
