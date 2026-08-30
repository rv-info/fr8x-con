'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { LocalTimeBadge } from '@/components/ui/LocalTimeBadge';
import { GoldenTick } from '@/components/ui/GoldenTick';
import {
  ProfileExperience,
  ProfileEducation,
  ProfileCertification,
} from '@/lib/types';
import {
  UserCheck,
  Save,
  MapPin,
  MapPinned,
  Plus,
  Edit2,
  Trash2,
  Eye,
  ShieldCheck,
  Award,
  GraduationCap,
  Briefcase,
  Sparkles,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser, upgradePlan } = useAuth();
  const { toast } = useToast();

  // Basic Profile State
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [designation, setDesignation] = useState(user.designation);
  const [email, setEmail] = useState(user.email);
  const [mobile, setMobile] = useState(user.mobile);
  const [company, setCompany] = useState(user.company);
  const [summary, setSummary] = useState(
    user.summary ||
      'Freight procurement specialist with 9+ years managing ocean FCL and OOG breakbulk across Asia-Europe and US West Coast corridors.'
  );

  // Address & Google Maps State
  const [addressSearch, setAddressSearch] = useState('Logistics Park, Andheri East, Mumbai, Maharashtra 400093');
  const [placeId, setPlaceId] = useState('ChIJwe1EZjDG5zsRaYxkjYvliu8');
  const [timezone, setTimezone] = useState(user.timezone || 'Asia/Kolkata');
  const [city, setCity] = useState(user.city || 'Mumbai');
  const [postalCode, setPostalCode] = useState('400093');

  // Professional Record Cards (Experience, Education, Certifications)
  const [experiences, setExperiences] = useState<ProfileExperience[]>([
    {
      id: 'exp-1',
      company: 'Atlas Logistics Pvt. Ltd.',
      designation: 'Freight Manager',
      employmentType: 'Full-time',
      location: 'Mumbai, India',
      startDate: 'Jan 2021',
      isCurrent: true,
      description: 'Heading reverse auction procurement, liner contract execution, and transshipment carrier operations.',
      skills: 'Rate Procurement, Carrier Negotiation, UN/LOCODE',
      visibility: 'public',
    },
  ]);

  const [educations, setEducations] = useState<ProfileEducation[]>([
    {
      id: 'edu-1',
      institution: 'Symbiosis Institute of International Business',
      qualification: 'MBA',
      fieldOfStudy: 'Logistics & Supply Chain Management',
      startYear: '2016',
      endYear: '2018',
      grade: 'Distinction',
      visibility: 'public',
    },
  ]);

  const [certifications, setCertifications] = useState<ProfileCertification[]>([
    {
      id: 'cert-1',
      title: 'IATA Dangerous Goods Regulation (DGR)',
      issuingAuthority: 'IATA Training Center',
      certificateNumber: 'DGR-2024-8849',
      issueDate: 'Mar 2024',
      expiryDate: 'Mar 2027',
      verificationStatus: 'verified',
      visibility: 'public',
    },
  ]);

  // Modal State for Adding/Editing Records
  const [activeRecordModal, setActiveRecordModal] = useState<'exp' | 'edu' | 'cert' | null>(null);
  const [editingRecord, setEditingRecord] = useState<any>(null);

  const handleSaveProfile = () => {
    updateUser({
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`.trim(),
      designation,
      mobile,
      summary,
      timezone,
      city,
    });
    toast('Profile and Google Maps address preferences saved successfully.');
  };

  return (
    <div>
      {/* Head */}
      <div className="head">
        <div>
          <h1>Personal & Professional Profile</h1>
          <p>Verified freight identity, IANA timezone synchronization, credentials, and visibility settings.</p>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={handleSaveProfile}>
            <Save size={14} /> Save Profile Changes
          </button>
        </div>
      </div>

      <div className="profilegrid">
        {/* Main Left Content */}
        <div>
          {/* Card 1: Professional Identity */}
          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="cardhead">
              <span>Professional Identity</span>
              {user.hasGoldenTick && (
                <span className="badge amber">
                  <Sparkles size={11} /> Premium Golden Verified
                </span>
              )}
            </div>
            <div className="cardbody">
              <div className="grid g3">
                <div className="field">
                  <label>First Name</label>
                  <input
                    className="input"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Last Name</label>
                  <input
                    className="input"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Designation</label>
                  <input
                    className="input"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Professional Corporate Email</label>
                  <input className="input" value={email} readOnly />
                </div>
                <div className="field">
                  <label>Mobile Number</label>
                  <input
                    className="input"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Company</label>
                  <input className="input" value={company} readOnly />
                </div>
              </div>

              <div className="field" style={{ marginTop: '10px' }}>
                <label>Professional Bio & Executive Summary</label>
                <textarea
                  className="input"
                  rows={3}
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Primary Address & Google Maps Integration */}
          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="cardhead">
              <span>Primary Address & Geolocation</span>
              <span className="sub">Google Maps Places Autocomplete Integration</span>
            </div>
            <div className="cardbody">
              <div className="grid g3">
                <div className="field" style={{ gridColumn: 'span 2' }}>
                  <label>Google Maps Places Address Search</label>
                  <input
                    className="input"
                    value={addressSearch}
                    onChange={(e) => setAddressSearch(e.target.value)}
                    placeholder="Search Google Maps location…"
                  />
                </div>
                <div className="field">
                  <label>Place ID (Google Maps)</label>
                  <input className="input" value={placeId} readOnly />
                </div>
                <div className="field">
                  <label>IANA Timezone (Dynamic Local Time Source)</label>
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
                    <option value="Asia/Shanghai">Asia/Shanghai (CST +08:00)</option>
                  </select>
                </div>
                <div className="field">
                  <label>City</label>
                  <input
                    className="input"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Postal Code</label>
                  <input
                    className="input"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                  />
                </div>
              </div>

              {/* Google Maps Visual Interactive Preview Box */}
              <div
                style={{
                  marginTop: '12px',
                  height: '140px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #1e3a5f, #142a42)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexDirection: 'column',
                  gap: '6px',
                  border: '1px solid var(--line)',
                  boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)',
                }}
              >
                <MapPinned size={28} color="#2dd4bf" />
                <b style={{ fontSize: '13px' }}>{addressSearch}</b>
                <small style={{ color: '#94a3b8', fontSize: '10.5px' }}>
                  Coordinates: 19.1136° N, 72.8697° E · Timezone: {timezone}
                </small>
              </div>
            </div>
          </div>

          {/* Section 3: Professional Record Cards (3 in a Row on Desktop) */}
          <div className="grid g3">
            {/* Experience Card */}
            <div className="card">
              <div className="cardhead">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Briefcase size={14} /> Experience
                </span>
                <button
                  className="btn secondary sm icon"
                  onClick={() => {
                    setEditingRecord(null);
                    setActiveRecordModal('exp');
                  }}
                  title="Add Experience"
                >
                  <Plus size={13} />
                </button>
              </div>
              <div className="cardbody">
                {experiences.map((exp) => (
                  <div key={exp.id}>
                    <b style={{ fontSize: '12px', display: 'block' }}>{exp.designation}</b>
                    <p style={{ fontSize: '11px', color: 'var(--mut)', margin: '2px 0 6px' }}>
                      {exp.company} · {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--ink-secondary)', lineHeight: 1.4, marginBottom: '8px' }}>
                      {exp.description}
                    </p>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn secondary sm"
                        onClick={() => {
                          setEditingRecord(exp);
                          setActiveRecordModal('exp');
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn danger sm icon"
                        onClick={() => {
                          setExperiences((prev) => prev.filter((e) => e.id !== exp.id));
                          toast('Experience removed.');
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Education Card */}
            <div className="card">
              <div className="cardhead">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <GraduationCap size={14} /> Education
                </span>
                <button
                  className="btn secondary sm icon"
                  onClick={() => {
                    setEditingRecord(null);
                    setActiveRecordModal('edu');
                  }}
                  title="Add Education"
                >
                  <Plus size={13} />
                </button>
              </div>
              <div className="cardbody">
                {educations.map((edu) => (
                  <div key={edu.id}>
                    <b style={{ fontSize: '12px', display: 'block' }}>
                      {edu.qualification} in {edu.fieldOfStudy}
                    </b>
                    <p style={{ fontSize: '11px', color: 'var(--mut)', margin: '2px 0 6px' }}>
                      {edu.institution} ({edu.startYear} – {edu.endYear})
                    </p>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '10px' }}>
                      <button
                        className="btn secondary sm"
                        onClick={() => {
                          setEditingRecord(edu);
                          setActiveRecordModal('edu');
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn danger sm icon"
                        onClick={() => {
                          setEducations((prev) => prev.filter((e) => e.id !== edu.id));
                          toast('Education record removed.');
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Certifications Card */}
            <div className="card">
              <div className="cardhead">
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Award size={14} /> Certifications
                </span>
                <button
                  className="btn secondary sm icon"
                  onClick={() => {
                    setEditingRecord(null);
                    setActiveRecordModal('cert');
                  }}
                  title="Add Certification"
                >
                  <Plus size={13} />
                </button>
              </div>
              <div className="cardbody">
                {certifications.map((cert) => (
                  <div key={cert.id}>
                    <b style={{ fontSize: '12px', display: 'block' }}>{cert.title}</b>
                    <p style={{ fontSize: '11px', color: 'var(--mut)', margin: '2px 0 4px' }}>
                      {cert.issuingAuthority} · {cert.certificateNumber}
                    </p>
                    <span className="badge green" style={{ fontSize: '9px', marginBottom: '8px' }}>
                      <ShieldCheck size={10} /> Verified Credential
                    </span>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <button
                        className="btn secondary sm"
                        onClick={() => {
                          setEditingRecord(cert);
                          setActiveRecordModal('cert');
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="btn danger sm icon"
                        onClick={() => {
                          setCertifications((prev) => prev.filter((c) => c.id !== cert.id));
                          toast('Certification removed.');
                        }}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Aside: Profile Strength & Plan Upgrade */}
        <aside>
          {/* Profile Strength Card */}
          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="cardhead">
              <span>Profile Strength</span>
              <span className="sub">Enterprise Ready</span>
            </div>
            <div className="cardbody">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <b style={{ fontSize: '12px' }}>Completion Score</b>
                <b style={{ color: 'var(--teal)', fontSize: '13px' }}>92%</b>
              </div>
              <div className="progress" style={{ marginBottom: '12px' }}>
                <i style={{ width: '92%' }} />
              </div>

              <div className="kv">
                <span>Current Timezone</span>
                <b>{timezone}</b>
              </div>

              <div className="kv" style={{ alignItems: 'center' }}>
                <span>Dynamic Local Time</span>
                <LocalTimeBadge timezone={timezone} />
              </div>

              <div className="kv">
                <span>Entity Verification</span>
                <span className="badge green">
                  <ShieldCheck size={11} /> Verified KYC
                </span>
              </div>
            </div>
          </div>

          {/* Membership Tier & Discount Card */}
          <div className="card">
            <div className="cardhead">
              <span>Subscription & Plan</span>
            </div>
            <div className="cardbody">
              <b style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                {user.plan.toUpperCase()} TIER
                {user.hasGoldenTick && <GoldenTick />}
              </b>
              <p style={{ fontSize: '11px', color: 'var(--mut)', margin: '4px 0 10px' }}>
                {user.plan === 'premium'
                  ? 'Active 40% bidding discount applied (₹180 vs ₹300 per bid posting).'
                  : 'Upgrade to Premium for golden badge & 40% discount on auction biddings.'}
              </p>

              {user.plan !== 'premium' && (
                <button
                  className="btn primary sm"
                  style={{ width: '100%' }}
                  onClick={() => {
                    upgradePlan('premium');
                    toast('Upgraded to Premium plan! Golden tick and 40% discount activated.');
                  }}
                >
                  <Sparkles size={12} /> Upgrade to Premium Plan
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Record Editor Modal */}
      {activeRecordModal && (
        <Modal
          isOpen={!!activeRecordModal}
          onClose={() => setActiveRecordModal(null)}
          title={`Edit ${
            activeRecordModal === 'exp'
              ? 'Professional Experience'
              : activeRecordModal === 'edu'
              ? 'Education'
              : 'Certification'
          }`}
          footer={
            <>
              <button className="btn secondary" onClick={() => setActiveRecordModal(null)}>
                Cancel
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  toast('Record updated.');
                  setActiveRecordModal(null);
                }}
              >
                Save Record
              </button>
            </>
          }
        >
          <div className="grid g2">
            <div className="field">
              <label>Title / Institution</label>
              <input className="input" placeholder="Enter title or company…" defaultValue={editingRecord?.title || editingRecord?.company || ''} />
            </div>
            <div className="field">
              <label>Designation / Field</label>
              <input className="input" placeholder="Enter designation or qualification…" defaultValue={editingRecord?.designation || editingRecord?.qualification || ''} />
            </div>
            <div className="field">
              <label>Start Date / Year</label>
              <input className="input" placeholder="e.g. 2021" defaultValue={editingRecord?.startDate || editingRecord?.startYear || ''} />
            </div>
            <div className="field">
              <label>End Date / Year</label>
              <input className="input" placeholder="e.g. Present" defaultValue={editingRecord?.endDate || editingRecord?.endYear || ''} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
