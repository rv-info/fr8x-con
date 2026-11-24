'use client';

import React from 'react';
import {
  MapPin,
  Briefcase,
  DollarSign,
  ShieldCheck,
  Mail,
  Phone,
  MessageCircle,
  Copy,
  ExternalLink,
  Users,
  CheckCircle2,
  X,
  Building,
  User,
  Calendar,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/lib/context/ToastContext';
import { useAuth } from '@/lib/context/AuthContext';
import { LocalTimeBadge } from '@/components/ui/LocalTimeBadge';

export interface JobDetailsModalProps {
  job: any | null;
  isOpen: boolean;
  onClose: () => void;
  onApply?: (job: any) => void;
  hasApplied?: boolean;
  applicationCount?: number;
  onManageApplications?: (job: any) => void;
}

export function JobDetailsModal({
  job,
  isOpen,
  onClose,
  onApply,
  hasApplied = false,
  applicationCount = 0,
  onManageApplications,
}: JobDetailsModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!isOpen || !job) return null;

  const emailToUse = job.posterEmail || job.contactEmails?.[0]?.email || '';
  const phoneToUse = job.contactPhone || '';
  const whatsappToUse = job.whatsappNumber || (job.hasWhatsApp ? job.contactPhone : '');
  const websiteToUse = job.companyWebsite || '';
  const isPoster = job.postedByUid === user.uid || (user.email && job.posterEmail === user.email);

  // Clean WhatsApp number (remove +, spaces, dashes for wa.me link)
  const cleanWaNumber = whatsappToUse ? whatsappToUse.replace(/[^0-9]/g, '') : '';

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast(`Copied ${label} to clipboard: ${text}`);
    }).catch(() => {
      toast(`Failed to copy ${label}`);
    });
  };

  const applicantMailto = `mailto:${emailToUse}?subject=${encodeURIComponent(
    `Application for ${job.title} - ${user.displayName || 'Candidate'}`
  )}&body=${encodeURIComponent(
    `Dear Hiring Team at ${job.company},\n\nI am applying for the ${job.title} position on FR8X.\n\nApplicant: ${user.displayName || 'Candidate'}\nEmail: ${user.email || ''}\nPhone: ${user.mobile || ''}\nCompany: ${user.company || ''}\nDesignation: ${user.designation || ''}\n\nI look forward to discussing how my experience aligns with your team's requirements.\n\nBest regards,\n${user.displayName || 'Candidate'}`
  )}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={job.title}
      maxWidth="680px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: '#FFFFFF' }}>
        {/* Header with Company Logo & Metadata */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
          <UserAvatar
            name={job.postedBy}
            companyName={job.company}
            size={52}
            showCompanyLogo={true}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#172B45', lineHeight: 1.3 }}>
              {job.title}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
              <span style={{ color: '#075B5B', fontSize: '13px', fontWeight: 700 }}>{job.company}</span>
              <span className="badge green" style={{ fontSize: '9px', display: 'inline-flex', alignItems: 'center', gap: '3px', background: '#E6F4EA', color: '#137333', border: '1px solid #CEEAD6', padding: '1px 6px', borderRadius: '4px' }}>
                <ShieldCheck size={11} /> Verified Employer
              </span>
              <span style={{ color: '#D9E0E8' }}>·</span>
              <span style={{ fontSize: '11.5px', color: '#526174', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <MapPin size={11} /> {job.location || 'Pan-India'}
              </span>
              <span style={{ color: '#D9E0E8' }}>·</span>
              <span style={{ fontSize: '11.5px', color: '#526174', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Briefcase size={11} /> {job.employmentType || 'Full-time'}
              </span>
              {job.experience && (
                <>
                  <span style={{ color: '#D9E0E8' }}>·</span>
                  <span style={{ fontSize: '11.5px', color: '#526174' }}>Exp: {job.experience}</span>
                </>
              )}
            </div>
            {job.category && (
              <div style={{ marginTop: '4px' }}>
                <span style={{ fontSize: '11px', color: '#075B5B', background: '#F4F6F8', border: '1px solid #D9E0E8', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  {job.category}
                </span>
                {job.vacancies && job.vacancies > 1 && (
                  <span style={{ marginLeft: '6px', fontSize: '11px', color: '#526174' }}>
                    ({job.vacancies} vacancies)
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Package / Compensation Pill */}
        {job.packageDetails && (
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #D9E0E8',
              borderRadius: 8,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '2px 2px 6px rgba(0,0,0,0.03)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={15} style={{ color: '#075B5B' }} />
              <span style={{ fontSize: '11.5px', color: '#526174', fontWeight: 600 }}>Compensation Package:</span>
              <b style={{ fontSize: '13.5px', color: '#075B5B' }}>{job.packageDetails}</b>
            </div>
            {job.closingDate && (
              <span style={{ fontSize: '11px', color: '#526174', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={12} /> Deadline: {job.closingDate}
              </span>
            )}
          </div>
        )}

        {/* Skills Tags */}
        {(() => {
          const sList = Array.isArray(job.skills)
            ? job.skills
            : typeof job.skills === 'string'
              ? job.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
              : [];
          if (sList.length === 0) return null;
          return (
            <div>
              <b style={{ display: 'block', fontSize: '11px', color: '#526174', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                Required Skills &amp; Domain Expertise
              </b>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {sList.map((s: string) => (
                  <span
                    key={s}
                    style={{
                      background: '#F4F6F8',
                      border: '1px solid #D9E0E8',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      fontSize: '11.5px',
                      color: '#172B45',
                      fontWeight: 500,
                    }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>
          );
        })()}

        {/* Job Overview / Description */}
        {job.description && job.description !== job.requirements && (
          <div>
            <b style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#172B45', marginBottom: '4px' }}>
              Job Overview
            </b>
            <p style={{ fontSize: '12px', color: '#526174', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
              {job.description}
            </p>
          </div>
        )}

        {/* Requirements, Responsibilities, Qualifications */}
        {[
          { label: 'Core Requirements', value: job.requirements },
          { label: 'Key Responsibilities', value: job.responsibilities },
          { label: 'Qualifications & Background', value: job.qualifications },
        ].filter((s) => s.value).map((sec) => (
          <div key={sec.label}>
            <b style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: '#172B45', marginBottom: '4px' }}>
              {sec.label}
            </b>
            <p style={{ fontSize: '12px', color: '#526174', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-line' }}>
              {sec.value}
            </p>
          </div>
        ))}

        {/* ── PHASE 2.4: MANDATORY EMPLOYER CONTACT INFORMATION & ACTIONS ── */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #D9E0E8',
            borderRadius: 8,
            padding: '14px',
            boxShadow: '3px 3px 8px rgba(0,0,0,0.04), -2px -2px 6px rgba(255,255,255,0.9)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #D9E0E8', paddingBottom: '8px', marginBottom: '10px' }}>
            <b style={{ fontSize: '12px', color: '#075B5B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={13} /> Employer Contact &amp; Application Channels
            </b>
            <span style={{ fontSize: '10.5px', color: '#526174' }}>
              Verified Direct Contact Details
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Recruiter Identity Row */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <b style={{ fontSize: '13px', color: '#172B45', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <User size={13} color="#075B5B" />
                  {job.contactPerson || job.postedBy || 'Talent Acquisition Team'}
                </b>
                <small style={{ color: '#526174', fontSize: '11px', display: 'block' }}>
                  {job.contactDesignation || 'Recruiter'} · {job.company}
                </small>
              </div>

              {/* 6 Direct Action Buttons */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {/* 1. Email Employer */}
                {emailToUse && (
                  <a
                    href={applicantMailto}
                    className="btn secondary sm"
                    style={{
                      height: '28px',
                      fontSize: '11px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D9E0E8',
                      color: '#075B5B',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                    title="Send application email via your default mail client"
                  >
                    <Mail size={12} /> Email Employer
                  </a>
                )}

                {/* 2. Call Employer */}
                {phoneToUse && (
                  <a
                    href={`tel:${phoneToUse}`}
                    className="btn secondary sm"
                    style={{
                      height: '28px',
                      fontSize: '11px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D9E0E8',
                      color: '#172B45',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                    title="Dial phone number"
                  >
                    <Phone size={12} /> Call Employer
                  </a>
                )}

                {/* 3. WhatsApp Employer */}
                {cleanWaNumber && (
                  <a
                    href={`https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(`Hello, I am interested in the ${job.title} opportunity on FR8X.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn secondary sm"
                    style={{
                      height: '28px',
                      fontSize: '11px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#E6F4EA',
                      border: '1px solid #A8DAB5',
                      color: '#137333',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                    title="Open WhatsApp chat with recruiter"
                  >
                    <MessageCircle size={12} /> WhatsApp
                  </a>
                )}

                {/* 4. Copy Email */}
                {emailToUse && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(emailToUse, 'Employer Email')}
                    className="btn secondary sm"
                    style={{
                      height: '28px',
                      fontSize: '11px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D9E0E8',
                      color: '#526174',
                      cursor: 'pointer',
                    }}
                    title="Copy email to clipboard"
                  >
                    <Copy size={11} /> Copy Email
                  </button>
                )}

                {/* 5. Copy Phone */}
                {phoneToUse && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(phoneToUse, 'Employer Phone')}
                    className="btn secondary sm"
                    style={{
                      height: '28px',
                      fontSize: '11px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D9E0E8',
                      color: '#526174',
                      cursor: 'pointer',
                    }}
                    title="Copy phone number to clipboard"
                  >
                    <Copy size={11} /> Copy Phone
                  </button>
                )}

                {/* 6. Visit Company Website */}
                {websiteToUse && websiteToUse !== 'https://' && (
                  <a
                    href={websiteToUse.startsWith('http') ? websiteToUse : `https://${websiteToUse}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn secondary sm"
                    style={{
                      height: '28px',
                      fontSize: '11px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #D9E0E8',
                      color: '#172B45',
                      textDecoration: 'none',
                    }}
                    title="Visit official company website"
                  >
                    <ExternalLink size={11} /> Website
                  </a>
                )}
              </div>
            </div>

            {/* Contact details metadata readout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: '#172B45', flexWrap: 'wrap', backgroundColor: '#F8FAFC', padding: '6px 10px', borderRadius: '4px' }}>
              <span style={{ color: '#526174' }}>Official Email:</span>
              <strong style={{ color: '#075B5B' }}>{emailToUse || 'recruiter@company.com'}</strong>
              {phoneToUse && (
                <>
                  <span style={{ color: '#D9E0E8' }}>|</span>
                  <span style={{ color: '#526174' }}>Phone:</span>
                  <strong>{phoneToUse}</strong>
                </>
              )}
              {job.hasWhatsApp && (
                <span className="badge green" style={{ fontSize: '8px', padding: '1px 5px', background: '#E6F4EA', color: '#137333', border: '1px solid #CEEAD6', borderRadius: '3px' }}>
                  WHATSAPP ACTIVE
                </span>
              )}
            </div>

            {/* Application Instructions */}
            {job.applicationInstructions && (
              <div style={{ background: '#F8FAFC', padding: '8px 10px', borderRadius: '4px', fontSize: '11px', color: '#526174', border: '1px solid #D9E0E8' }}>
                <b style={{ color: '#172B45' }}>Application Instructions:</b> {job.applicationInstructions}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions: In-App Apply / Recruiter Manage */}
        <div
          style={{
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid #D9E0E8',
            paddingTop: '14px',
            marginTop: '4px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={14} style={{ color: '#075B5B' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#172B45' }}>
              {applicationCount} Candidate Application{applicationCount === 1 ? '' : 's'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isPoster ? (
              <button
                type="button"
                className="btn primary sm"
                onClick={() => {
                  if (onManageApplications) onManageApplications(job);
                  onClose();
                }}
                style={{
                  height: '32px',
                  padding: '0 14px',
                  backgroundColor: '#075B5B',
                  color: '#FFFFFF',
                  border: '1px solid #075B5B',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Users size={13} /> Manage Applications ({applicationCount})
              </button>
            ) : hasApplied ? (
              <div style={{ background: '#E6F4EA', border: '1px solid #CEEAD6', borderRadius: '6px', padding: '6px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#137333', fontSize: '12px', fontWeight: 600 }}>
                <CheckCircle2 size={14} color="#137333" />
                <span>Application Submitted &amp; Active</span>
              </div>
            ) : (
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  if (onApply) onApply(job);
                }}
                style={{
                  height: '34px',
                  padding: '0 20px',
                  backgroundColor: '#075B5B',
                  color: '#FFFFFF',
                  border: '1px solid #075B5B',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(7, 91, 91, 0.25)',
                }}
              >
                APPLY FOR THIS JOB
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default JobDetailsModal;
