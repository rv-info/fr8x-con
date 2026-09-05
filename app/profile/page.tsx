'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { LocalTimeBadge } from '@/components/ui/LocalTimeBadge';
import { GoldenTick } from '@/components/ui/GoldenTick';
import {
  ProfileExperience,
  ProfileEducation,
  ProfileCertification,
  PlanTier,
  KYCDossier,
} from '@/lib/types';
import { normalizeAssociationName } from '@/lib/utils/associations';
import { upsertKYCDossierInDB } from '@/lib/firebase/firestore';
import {
  UserCheck,
  Save,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  ShieldCheck,
  Award,
  GraduationCap,
  Briefcase,
  Sparkles,
  ExternalLink,
  Check,
  Building2,
  Mail,
  Phone,
  Clock,
  Compass,
  Eye,
  Lock,
  Globe2,
  CheckCircle2,
  Star,
  Download,
  Share2,
  Layers,
  FileSpreadsheet,
  FileText,
  Activity,
  Anchor,
  Truck,
  TrendingUp,
  Percent,
  Key,
  Camera,
  Upload,
  Image as ImageIcon,
  X,
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateUser, upgradePlan } = useAuth();
  const { toast } = useToast();

  // Mode: View vs Edit
  const [isEditMode, setIsEditMode] = useState(false);

  // Active Tab: overview | experience_edu | kyc | scorecard | privacy
  const [activeTab, setActiveTab] = useState<'overview' | 'experience_edu' | 'kyc' | 'scorecard' | 'privacy'>('overview');

  // Basic Profile State
  const [firstName, setFirstName] = useState(user.firstName);
  const [lastName, setLastName] = useState(user.lastName);
  const [designation, setDesignation] = useState(user.designation);
  const [mobile, setMobile] = useState(user.mobile);
  const [company, setCompany] = useState(user.company);
  const [summary, setSummary] = useState(
    user.summary ||
      'Senior Freight Procurement & Maritime Logistics Executive with 10+ years driving multi-million dollar container shipping contracts, ocean freight reverse auctions, and multimodal logistics across Asia-Europe and Transpacific corridors.'
  );

  // Profile Image & Company Logo State
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl ? user.avatarUrl : null);
  const [companyLogoUrl, setCompanyLogoUrl] = useState<string | null>(user.companyLogoUrl ? user.companyLogoUrl : null);

  // Sync avatar and logo state whenever user object in AuthContext updates
  useEffect(() => {
    setAvatarUrl(user.avatarUrl ? user.avatarUrl : null);
  }, [user.avatarUrl]);

  useEffect(() => {
    setCompanyLogoUrl(user.companyLogoUrl ? user.companyLogoUrl : null);
  }, [user.companyLogoUrl]);

  // Address & Google Maps State
  const [city, setCity] = useState(user.city || 'Mumbai');
  const [stateName, setStateName] = useState(user.state || 'Maharashtra');
  const [country, setCountry] = useState(user.country || 'India');
  const [formattedAddress, setFormattedAddress] = useState(
    user.formattedAddress || 'Logistics Park, Andheri East, Mumbai, Maharashtra 400093'
  );
  const [lat, setLat] = useState(user.coordinates?.lat || 19.1136);
  const [lng, setLng] = useState(user.coordinates?.lng || 72.8697);
  const [timezone, setTimezone] = useState(user.timezone || 'Asia/Kolkata');

  // Business IDs & Statutory Filings
  const [gstn, setGstn] = useState(user.gstn || '27AAAAA0000A1Z5');
  const [pan, setPan] = useState(user.pan || 'AAAAA0000A');
  const [iec, setIec] = useState(user.iec || '0388129941');
  const [mto, setMto] = useState(user.mto || 'MTO/DGS/2024/9912');
  const [iataCode, setIataCode] = useState('14-3-8821');
  const [fiataReg, setFiataReg] = useState('FIATA-IND-2024-918');
  const [fmcNumber, setFmcNumber] = useState('FMC-OTI-024881');
  const [aeoTier, setAeoTier] = useState('AEO-T2 Certified (CBIC)');
  const [associationName, setAssociationName] = useState('WCA');
  const [associationId, setAssociationId] = useState('WCA-98124');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [showKycModal, setShowKycModal] = useState(false);

  // Edit Identity & Company Link State (User Requirements 9 & 10)
  const [showEditIdentityModal, setShowEditIdentityModal] = useState(false);
  const [editFirstName, setEditFirstName] = useState(user.firstName);
  const [editLastName, setEditLastName] = useState(user.lastName);
  const [editEmail, setEditEmail] = useState(user.email);
  const [editMobile, setEditMobile] = useState(user.mobile);
  const [editDesignation, setEditDesignation] = useState(user.designation);
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(user.avatarUrl ? user.avatarUrl : null);
  const [editCompanyLogoUrl, setEditCompanyLogoUrl] = useState<string | null>(user.companyLogoUrl || null);
  const [isChangingCompany, setIsChangingCompany] = useState(false);
  const [transferTargetCompany, setTransferTargetCompany] = useState('');
  const [transferTargetEmail, setTransferTargetEmail] = useState('');
  const [transferMethod, setTransferMethod] = useState<'self' | 'godfather'>('self');
  const [transferReason, setTransferReason] = useState('Change of Employer / Corporate Reorganization');

  // Privacy controls per section
  const [expPrivacy, setExpPrivacy] = useState<'public' | 'network' | 'private'>('public');
  const [eduPrivacy, setEduPrivacy] = useState<'public' | 'network' | 'private'>('public');
  const [certPrivacy, setCertPrivacy] = useState<'public' | 'network' | 'private'>('public');
  const [kycPrivacy, setKycPrivacy] = useState<'public' | 'network' | 'private'>('network');

  // Professional Record Cards (Experience, Education, Certifications)
  const [experiences, setExperiences] = useState<ProfileExperience[]>([
    {
      id: 'exp-1',
      company: 'Atlas Logistics International Pvt. Ltd.',
      designation: 'Director of Freight Procurement & Liner Operations',
      employmentType: 'Full-time',
      location: 'Mumbai, India',
      startDate: 'Jan 2021',
      isCurrent: true,
      description:
        'Overseeing container procurement across Asia-Europe and US West Coast lanes. Managing over 14,000+ TEUs annually, carrier liner contracts (MSC, Maersk, CMA CGM), and leading digital reverse auction bidding strategies.',
      skills: 'Ocean Procurement, Reverse Auctions, UN/LOCODE, Port Drayage, Contract Negotiation',
      visibility: 'public',
    },
    {
      id: 'exp-2',
      company: 'TransGlobal Freight Solutions NV',
      designation: 'Senior Ocean Freight Manager',
      employmentType: 'Full-time',
      location: 'Rotterdam, Netherlands',
      startDate: 'Aug 2017',
      endDate: 'Dec 2020',
      isCurrent: false,
      description:
        'Managed European import/export transshipment logistics, customs clearance documentation, and inland barge connections throughout the Rhine corridor.',
      skills: 'European Inland Transport, Rhine Barge Logistics, DTHC Optimization',
      visibility: 'public',
    },
  ]);

  const [educations, setEducations] = useState<ProfileEducation[]>([
    {
      id: 'edu-1',
      institution: 'Symbiosis Institute of International Business',
      qualification: 'MBA',
      fieldOfStudy: 'International Maritime Trade & Supply Chain Management',
      startYear: '2015',
      endYear: '2017',
      grade: 'Distinction / 3.9 GPA',
      description: 'Specialization in Maritime Law, Chartering Protocols, and Global Port Economics.',
      visibility: 'public',
    },
    {
      id: 'edu-2',
      institution: 'Indian Maritime University',
      qualification: 'Bachelor of Science (B.Sc.)',
      fieldOfStudy: 'Nautical Science & Maritime Logistics',
      startYear: '2011',
      endYear: '2015',
      grade: 'First Class with Honors',
      description: 'Foundational nautical navigation, container stowage planning, and dangerous goods protocols.',
      visibility: 'public',
    },
  ]);

  const [certifications, setCertifications] = useState<ProfileCertification[]>([
    {
      id: 'cert-1',
      title: 'IATA Dangerous Goods Regulation (DGR Cat 6)',
      issuingAuthority: 'International Air Transport Association (IATA)',
      certificateNumber: 'DGR-2024-8849',
      issueDate: 'Mar 2024',
      expiryDate: 'Mar 2027',
      verificationStatus: 'verified',
      credentialUrl: 'https://iata.org/verify/dgr-2024-8849',
      visibility: 'public',
    },
    {
      id: 'cert-2',
      title: 'FIATA Higher Diploma in Supply Chain Management',
      issuingAuthority: 'International Federation of Freight Forwarders (FIATA)',
      certificateNumber: 'FIATA-HD-2023-119',
      issueDate: 'Jun 2023',
      verificationStatus: 'verified',
      credentialUrl: 'https://fiata.org/credentials/2023-119',
      visibility: 'public',
    },
    {
      id: 'cert-3',
      title: 'Customs Brokerage Class A Qualified Licensee',
      issuingAuthority: 'Central Board of Indirect Taxes & Customs (CBIC)',
      certificateNumber: 'CBIC-REG-6441',
      issueDate: 'Jan 2022',
      verificationStatus: 'verified',
      credentialUrl: 'https://icegate.gov.in/verify/CBIC-REG-6441',
      visibility: 'public',
    },
  ]);

  // Modal State for Adding/Editing Records
  const [activeRecordModal, setActiveRecordModal] = useState<'exp' | 'edu' | 'cert' | null>(null);
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // Form State for Experience
  const [expTitle, setExpTitle] = useState('');
  const [expCompany, setExpCompany] = useState('');
  const [expLocation, setExpLocation] = useState('');
  const [expEmpType, setExpEmpType] = useState<ProfileExperience['employmentType']>('Full-time');
  const [expStart, setExpStart] = useState('');
  const [expEnd, setExpEnd] = useState('');
  const [expCurrent, setExpCurrent] = useState(false);
  const [expDesc, setExpDesc] = useState('');
  const [expSkills, setExpSkills] = useState('');

  // Form State for Education
  const [eduInst, setEduInst] = useState('');
  const [eduQual, setEduQual] = useState('');
  const [eduField, setEduField] = useState('');
  const [eduStart, setEduStart] = useState('');
  const [eduEnd, setEduEnd] = useState('');
  const [eduGrade, setEduGrade] = useState('');
  const [eduDesc, setEduDesc] = useState('');

  // Form State for Certifications
  const [certTitle, setCertTitle] = useState('');
  const [certOrg, setCertOrg] = useState('');
  const [certNumber, setCertNumber] = useState('');
  const [certIssue, setCertIssue] = useState('');
  const [certExpiry, setCertExpiry] = useState('');
  const [certUrl, setCertUrl] = useState('');

  // Avatar and Logo upload handlers
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const url = loadEvt.target?.result as string;
        setAvatarUrl(url);
        updateUser({ avatarUrl: url });
        toast('Profile photo updated.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompanyLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const url = loadEvt.target?.result as string;
        setCompanyLogoUrl(url);
        updateUser({ companyLogoUrl: url });
        toast('Company logo uploaded successfully.');
      };
      reader.readAsDataURL(file);
    }
  };

  // Profile Completeness Calculation
  const calculateCompleteness = () => {
    let score = 0;
    if (firstName && lastName) score += 15;
    if (company && designation) score += 15;
    if (avatarUrl) score += 10;
    if (companyLogoUrl) score += 10;
    if (formattedAddress && city) score += 10;
    if (summary) score += 10;
    if (gstn && pan && iec) score += 10;
    if (experiences.length > 0) score += 10;
    if (certifications.length > 0) score += 10;
    return Math.min(100, score);
  };

  const completeness = calculateCompleteness();

  const handleSaveProfile = () => {
    updateUser({
      firstName,
      lastName,
      displayName: `${firstName} ${lastName}`.trim(),
      designation,
      company,
      mobile,
      summary,
      avatarUrl: avatarUrl ? avatarUrl : '',
      companyLogoUrl: companyLogoUrl ? companyLogoUrl : '',
      city,
      state: stateName,
      country,
      formattedAddress,
      coordinates: { lat, lng },
      timezone,
      gstn,
      pan,
      iec,
      mto,
    });
    setIsEditMode(false);
    toast('Enterprise profile updated successfully.');
  };

  const handleOpenExpModal = (exp?: ProfileExperience) => {
    if (exp) {
      setEditingRecordId(exp.id);
      setExpTitle(exp.designation);
      setExpCompany(exp.company);
      setExpLocation(exp.location);
      setExpEmpType(exp.employmentType);
      setExpStart(exp.startDate);
      setExpEnd(exp.endDate || '');
      setExpCurrent(exp.isCurrent);
      setExpDesc(exp.description);
      setExpSkills(exp.skills);
    } else {
      setEditingRecordId(null);
      setExpTitle('');
      setExpCompany(company || user.company);
      setExpLocation(`${city}, ${country}`);
      setExpEmpType('Full-time');
      setExpStart('Jan 2022');
      setExpEnd('');
      setExpCurrent(true);
      setExpDesc('');
      setExpSkills('Ocean Freight, Reverse Auctions, Container Logistics');
    }
    setActiveRecordModal('exp');
  };

  const handleSaveExp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expTitle || !expCompany) return;
    if (editingRecordId) {
      setExperiences((prev) =>
        prev.map((item) =>
          item.id === editingRecordId
            ? {
                ...item,
                designation: expTitle,
                company: expCompany,
                location: expLocation,
                employmentType: expEmpType,
                startDate: expStart,
                endDate: expEnd,
                isCurrent: expCurrent,
                description: expDesc,
                skills: expSkills,
              }
            : item
        )
      );
    } else {
      setExperiences((prev) => [
        ...prev,
        {
          id: `exp-${Date.now()}`,
          designation: expTitle,
          company: expCompany,
          location: expLocation,
          employmentType: expEmpType,
          startDate: expStart,
          endDate: expEnd,
          isCurrent: expCurrent,
          description: expDesc,
          skills: expSkills,
          visibility: 'public',
        },
      ]);
    }
    setActiveRecordModal(null);
    toast('Work experience details saved.');
  };

  const handleOpenEduModal = (edu?: ProfileEducation) => {
    if (edu) {
      setEditingRecordId(edu.id);
      setEduInst(edu.institution);
      setEduQual(edu.qualification);
      setEduField(edu.fieldOfStudy);
      setEduStart(edu.startYear);
      setEduEnd(edu.endYear);
      setEduGrade(edu.grade || '');
      setEduDesc(edu.description || '');
    } else {
      setEditingRecordId(null);
      setEduInst('');
      setEduQual('Master / Bachelor Degree');
      setEduField('International Trade & Maritime Logistics');
      setEduStart('2018');
      setEduEnd('2022');
      setEduGrade('Distinction / First Class');
      setEduDesc('');
    }
    setActiveRecordModal('edu');
  };

  const handleSaveEdu = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eduInst || !eduQual) return;
    if (editingRecordId) {
      setEducations((prev) =>
        prev.map((item) =>
          item.id === editingRecordId
            ? {
                ...item,
                institution: eduInst,
                qualification: eduQual,
                fieldOfStudy: eduField,
                startYear: eduStart,
                endYear: eduEnd,
                grade: eduGrade,
                description: eduDesc,
              }
            : item
        )
      );
    } else {
      setEducations((prev) => [
        ...prev,
        {
          id: `edu-${Date.now()}`,
          institution: eduInst,
          qualification: eduQual,
          fieldOfStudy: eduField,
          startYear: eduStart,
          endYear: eduEnd,
          grade: eduGrade,
          description: eduDesc,
          visibility: 'public',
        },
      ]);
    }
    setActiveRecordModal(null);
    toast('Education details saved.');
  };

  const handleOpenCertModal = (cert?: ProfileCertification) => {
    if (cert) {
      setEditingRecordId(cert.id);
      setCertTitle(cert.title);
      setCertOrg(cert.issuingAuthority);
      setCertNumber(cert.certificateNumber);
      setCertIssue(cert.issueDate);
      setCertExpiry(cert.expiryDate || '');
      setCertUrl(cert.credentialUrl || '');
    } else {
      setEditingRecordId(null);
      setCertTitle('IATA / FIATA / Customs Broker Certification');
      setCertOrg('IATA / FIATA / CBIC');
      setCertNumber('CERT-2024-001');
      setCertIssue('Jan 2024');
      setCertExpiry('Jan 2027');
      setCertUrl('');
    }
    setActiveRecordModal('cert');
  };

  const handleSaveCert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!certTitle || !certOrg) return;
    if (editingRecordId) {
      setCertifications((prev) =>
        prev.map((item) =>
          item.id === editingRecordId
            ? {
                ...item,
                title: certTitle,
                issuingAuthority: certOrg,
                certificateNumber: certNumber,
                issueDate: certIssue,
                expiryDate: certExpiry,
                credentialUrl: certUrl,
              }
            : item
        )
      );
    } else {
      setCertifications((prev) => [
        ...prev,
        {
          id: `cert-${Date.now()}`,
          title: certTitle,
          issuingAuthority: certOrg,
          certificateNumber: certNumber,
          issueDate: certIssue,
          expiryDate: certExpiry,
          credentialUrl: certUrl,
          verificationStatus: 'verified',
          visibility: 'public',
        },
      ]);
    }
    setActiveRecordModal(null);
    toast('Certification credentials saved.');
  };

  const handleDownloadPassport = () => {
    toast('Generating official verified B2B Freight Passport PDF…');
  };

  const handleShareProfile = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    toast('Public profile link copied to clipboard.');
  };

  return (
    <div className="profile-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Experience Modal */}
      {activeRecordModal === 'exp' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveRecordModal(null)}
          title={editingRecordId ? 'Edit Work Experience Details' : 'Add Work Experience Details'}
          maxWidth="680px"
        >
          <form onSubmit={handleSaveExp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="grid g2">
              <div className="field">
                <label>Job Title / Designation <span className="req">*</span></label>
                <input className="input" value={expTitle} onChange={(e) => setExpTitle(e.target.value)} placeholder="Director of Ocean Procurement" required />
              </div>
              <div className="field">
                <label>Company Name <span className="req">*</span></label>
                <input className="input" value={expCompany} onChange={(e) => setExpCompany(e.target.value)} placeholder="Atlas Logistics Pvt. Ltd." required />
              </div>
            </div>

            <div className="grid g2">
              <div className="field">
                <label>Location / Port Hub</label>
                <input className="input" value={expLocation} onChange={(e) => setExpLocation(e.target.value)} placeholder="Mumbai, India / Nhava Sheva" />
              </div>
              <div className="field">
                <label>Employment Type</label>
                <select className="input" value={expEmpType} onChange={(e) => setExpEmpType(e.target.value as any)}>
                  <option>Full-time</option>
                  <option>Contract</option>
                  <option>Part-time</option>
                  <option>Freelance</option>
                </select>
              </div>
            </div>

            <div className="grid g2">
              <div className="field">
                <label>Start Date</label>
                <input className="input" value={expStart} onChange={(e) => setExpStart(e.target.value)} placeholder="e.g. Jan 2021" />
              </div>
              <div className="field">
                <label>End Date</label>
                <input
                  className="input"
                  value={expCurrent ? 'Present' : expEnd}
                  onChange={(e) => setExpEnd(e.target.value)}
                  placeholder="e.g. Dec 2023 or Present"
                  disabled={expCurrent}
                />
              </div>
            </div>

            <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={expCurrent}
                onChange={(e) => setExpCurrent(e.target.checked)}
              />
              I am currently working in this role
            </label>

            <div className="field">
              <label>Core Responsibilities & Operational Milestones</label>
              <textarea
                className="input"
                rows={3}
                value={expDesc}
                onChange={(e) => setExpDesc(e.target.value)}
                placeholder="Managed 14,000+ TEUs annually across Asia-Europe and US West Coast corridors, carrier rate negotiations (MSC, Maersk), and digital reverse auction execution…"
              />
            </div>

            <div className="field">
              <label>Key Skills, Liner Alliances & Trade Lanes</label>
              <input
                className="input"
                value={expSkills}
                onChange={(e) => setExpSkills(e.target.value)}
                placeholder="Ocean Procurement, Reverse Auctions, INNSA-NLRTM, Demurrage Management"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" className="btn secondary" onClick={() => setActiveRecordModal(null)}>Cancel</button>
              <button type="submit" className="btn primary">Save Experience</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Education Modal */}
      {activeRecordModal === 'edu' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveRecordModal(null)}
          title={editingRecordId ? 'Edit Academic Education' : 'Add Academic Education'}
          maxWidth="640px"
        >
          <form onSubmit={handleSaveEdu} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="grid g2">
              <div className="field">
                <label>Institution / University <span className="req">*</span></label>
                <input className="input" value={eduInst} onChange={(e) => setEduInst(e.target.value)} placeholder="Symbiosis Institute / World Maritime University" required />
              </div>
              <div className="field">
                <label>Degree / Qualification <span className="req">*</span></label>
                <input className="input" value={eduQual} onChange={(e) => setEduQual(e.target.value)} placeholder="MBA / B.Sc. Nautical Science" required />
              </div>
            </div>

            <div className="grid g2">
              <div className="field">
                <label>Field of Study / Major <span className="req">*</span></label>
                <input className="input" value={eduField} onChange={(e) => setEduField(e.target.value)} placeholder="Maritime Logistics & Supply Chain" required />
              </div>
              <div className="field">
                <label>Grade / GPA / Honors</label>
                <input className="input" value={eduGrade} onChange={(e) => setEduGrade(e.target.value)} placeholder="Distinction / 3.9 GPA" />
              </div>
            </div>

            <div className="grid g2">
              <div className="field">
                <label>Start Year</label>
                <input className="input" value={eduStart} onChange={(e) => setEduStart(e.target.value)} placeholder="2015" />
              </div>
              <div className="field">
                <label>End Year / Graduation Year</label>
                <input className="input" value={eduEnd} onChange={(e) => setEduEnd(e.target.value)} placeholder="2017" />
              </div>
            </div>

            <div className="field">
              <label>Key Coursework, Thesis & Specializations</label>
              <textarea
                className="input"
                rows={2}
                value={eduDesc}
                onChange={(e) => setEduDesc(e.target.value)}
                placeholder="Specialization in Maritime Trade Law, Port Economics, and Container Stowage Logistics…"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" className="btn secondary" onClick={() => setActiveRecordModal(null)}>Cancel</button>
              <button type="submit" className="btn primary">Save Education</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Certification Modal */}
      {activeRecordModal === 'cert' && (
        <Modal
          isOpen={true}
          onClose={() => setActiveRecordModal(null)}
          title={editingRecordId ? 'Edit Certification Credential' : 'Add Certification Credential'}
          maxWidth="640px"
        >
          <form onSubmit={handleSaveCert} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="grid g2">
              <div className="field">
                <label>Certification Title <span className="req">*</span></label>
                <input className="input" value={certTitle} onChange={(e) => setCertTitle(e.target.value)} placeholder="IATA Dangerous Goods DGR Cat 6" required />
              </div>
              <div className="field">
                <label>Issuing Authority / Body <span className="req">*</span></label>
                <input className="input" value={certOrg} onChange={(e) => setCertOrg(e.target.value)} placeholder="IATA / FIATA / CBIC" required />
              </div>
            </div>

            <div className="grid g2">
              <div className="field">
                <label>License / Certificate ID <span className="req">*</span></label>
                <input className="input" value={certNumber} onChange={(e) => setCertNumber(e.target.value)} placeholder="DGR-2024-8849" required />
              </div>
              <div className="field">
                <label>Issue Date</label>
                <input className="input" value={certIssue} onChange={(e) => setCertIssue(e.target.value)} placeholder="Mar 2024" />
              </div>
            </div>

            <div className="grid g2">
              <div className="field">
                <label>Expiration Date (Optional)</label>
                <input className="input" value={certExpiry} onChange={(e) => setCertExpiry(e.target.value)} placeholder="Mar 2027 or No Expiry" />
              </div>
              <div className="field">
                <label>Online Verification URL</label>
                <input className="input" value={certUrl} onChange={(e) => setCertUrl(e.target.value)} placeholder="https://iata.org/verify/..." />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" className="btn secondary" onClick={() => setActiveRecordModal(null)}>Cancel</button>
              <button type="submit" className="btn primary">Save Certification</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Top Header */}
      <div className="head" style={{ marginBottom: 0 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ margin: 0 }}>Enterprise Member Identity & Freight Passport</h1>
            <span className="badge green" style={{ fontSize: '10.5px' }}>
              <ShieldCheck size={12} /> Level 3 Verified
            </span>
          </div>
          <p style={{ marginTop: '4px' }}>
            Enterprise Freight Forwarding Identity, Statutory Registrations (GSTN/PAN/IEC/MTO), and Accredited Professional Records.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button className="btn secondary" onClick={handleDownloadPassport} title="Download Verified B2B Passport PDF">
            <Download size={14} /> Download Passport
          </button>
          <button className="btn secondary" onClick={handleShareProfile} title="Share Profile Link">
            <Share2 size={14} /> Share
          </button>
          <button
            className="btn primary"
            onClick={() => {
              setEditFirstName(user.firstName);
              setEditLastName(user.lastName);
              setEditEmail(user.email);
              setEditMobile(user.mobile);
              setEditDesignation(user.designation);
              setEditAvatarUrl(avatarUrl || user.avatarUrl || null);
              setEditCompanyLogoUrl(companyLogoUrl || user.companyLogoUrl || null);
              setIsChangingCompany(false);
              setTransferTargetCompany('');
              setTransferTargetEmail('');
              setShowEditIdentityModal(true);
            }}
          >
            <Edit2 size={14} /> Edit Identity
          </button>
        </div>
      </div>

      {/* Corporate Transfer Status Banner if Pending Godfather Review */}
      {user.companyTransferStatus === 'pending_godfather_approval' && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={18} color="#d97706" />
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#92400e' }}>
                Corporate Affiliation Transfer Pending Godfather Review
              </div>
              <div style={{ fontSize: '11px', color: '#b45309' }}>
                Requested transfer to <b>{user.pendingCompany}</b> with corporate email <b>{user.pendingEmail}</b>. Docket Ticket: <code>{user.transferRequestId}</code>
              </div>
            </div>
          </div>
          <span className="badge amber" style={{ fontSize: '10.5px' }}>Under Godfather Audit</span>
        </div>
      )}

      {/* Executive Hero Banner Card with Profile Picture & Company Logo Uploads */}
      <div
        className="card"
        style={{
          padding: '22px 24px',
          background: 'var(--card)',
          border: '1px solid var(--fr8x-outline)',
          boxShadow: 'var(--sh-md)',
          borderRadius: '8px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          {/* Avatar + Background CO Symbol + User Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
            {/* 5-Layer Stack: 1. Card Bg | 2. CO Symbol | 3. Circular Avatar | 4. GoldenTick Badge | 5. Camera/Edit Controls */}
            <div
              style={{
                position: 'relative',
                width: '106px',
                height: '106px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {/* LAYER 2: Subtle Geometric "CO" Background Symbol (40% larger than 76px avatar = 106px diameter) */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  background: 'var(--fr8x-input)',
                  border: '1px dashed var(--fr8x-outline)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 1,
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '32px',
                    fontWeight: 900,
                    letterSpacing: '-0.06em',
                    color: 'var(--fr8x-container)',
                    lineHeight: 1,
                  }}
                >
                  CO
                </span>
              </div>

              {/* LAYER 3: Circular Avatar (Reduced by exactly 10%: 84px -> 75.6px ≈ 76px) */}
              <div
                style={{
                  position: 'relative',
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  zIndex: 2,
                  boxShadow: 'var(--sh)',
                }}
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile"
                    style={{
                      width: '76px',
                      height: '76px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '2px solid #fff',
                      display: 'block',
                    }}
                  />
                ) : (
                  <div
                    className="avatar hero"
                    style={{
                      width: '76px',
                      height: '76px',
                      fontSize: '24px',
                      borderRadius: '50%',
                      background: 'var(--fr8x-outline)',
                      border: '2px solid #fff',
                      display: 'grid',
                      placeItems: 'center',
                      color: '#fff',
                      fontWeight: 800,
                    }}
                  >
                    {user.displayName.split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase()}
                  </div>
                )}

                {/* LAYER 4: Verified / Premium Brand Asset Badge */}
                {user.hasGoldenTick && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      right: '-2px',
                      zIndex: 3,
                    }}
                  >
                    <GoldenTick size={20} title="FR8X Premium Verified" />
                  </div>
                )}

                {/* LAYER 5: Camera / Upload Profile Photo Trigger */}
                <label
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    background: 'var(--fr8x-outline)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: 'var(--sh)',
                    border: '1.5px solid #fff',
                    zIndex: 4,
                  }}
                  title="Upload profile photo"
                >
                  <Camera size={10} />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
                </label>

                {/* Remove Profile Photo Trigger (if photo exists) */}
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarUrl(null);
                      updateUser({ avatarUrl: '' });
                      toast('Profile photo removed.');
                    }}
                    style={{
                      position: 'absolute',
                      top: '-2px',
                      left: '-2px',
                      background: '#dc2626',
                      color: '#fff',
                      borderRadius: '50%',
                      width: '22px',
                      height: '22px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: 'var(--sh)',
                      border: '1.5px solid #fff',
                      zIndex: 5,
                    }}
                    title="Remove profile photo"
                  >
                    <Trash2 size={10} />
                  </button>
                )}

                {/* Company Logo Badge — lower-left overlay */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: '-14px',
                    zIndex: 4,
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    {companyLogoUrl ? (
                      <img
                        src={companyLogoUrl}
                        alt="Company Logo"
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '5px',
                          objectFit: 'contain',
                          background: '#fff',
                          border: '1.5px solid var(--fr8x-outline)',
                          padding: '1px',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '5px',
                          background: 'var(--fr8x-input)',
                          border: '1.5px solid var(--fr8x-outline)',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--fr8x-text)',
                        }}
                      >
                        <Building2 size={12} />
                        <span style={{ fontSize: '6.5px', fontWeight: 800 }}>CO</span>
                      </div>
                    )}
                    {/* Upload company logo trigger */}
                    <label
                      style={{
                        position: 'absolute',
                        bottom: '-3px',
                        right: '-3px',
                        background: 'var(--fr8x-outline)',
                        color: '#fff',
                        borderRadius: '50%',
                        width: '14px',
                        height: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        border: '1px solid #fff',
                      }}
                      title="Upload company logo"
                    >
                      <Upload size={7} />
                      <input type="file" accept="image/*" onChange={handleCompanyLogoUpload} style={{ display: 'none' }} />
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* User Identity Details */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--fr8x-text)' }}>
                  {user.displayName}
                </h2>
                {user.hasGoldenTick && <GoldenTick size={16} />}
                <span className="badge" style={{ fontSize: '10px', fontWeight: 700 }}>
                  <ShieldCheck size={11} /> VERIFIED B2B
                </span>
                <span className="badge" style={{ fontSize: '10px' }}>
                  <Sparkles size={10} /> {user.plan.toUpperCase()} PLAN
                </span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--fr8x-text)', marginTop: '4px', fontWeight: 600 }}>
                {designation} at <span style={{ fontWeight: 700 }}>{company}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--fr8x-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={12} color="var(--fr8x-outline)" /> {city}, {country}
                </span>
                <LocalTimeBadge timezone={timezone} />
                <span style={{ fontSize: '11px', color: 'var(--fr8x-muted)' }}>
                  IATA: <b>{iataCode}</b> · MTO: <b>{mto}</b>
                </span>
              </div>
            </div>

          </div>

          {/* D&B / Ariba Trust Index & Completeness Score */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: 'var(--fr8x-input)', border: '1px solid var(--fr8x-outline)', padding: '10px 16px', borderRadius: '6px', textAlign: 'center' }}>
              <small style={{ color: 'var(--fr8x-muted)', fontSize: '9.5px', fontWeight: 800, textTransform: 'uppercase', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Star size={11} color="var(--fr8x-outline)" /> FR8X TRUST SCORE
              </small>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--fr8x-text)', marginTop: '2px' }}>
                98<span style={{ fontSize: '13px', color: 'var(--fr8x-muted)', fontWeight: 500 }}>/100</span>
              </div>
              <small style={{ fontSize: '9.5px', color: 'var(--fr8x-muted)', fontWeight: 700 }}>Tier-1 Accredited</small>
            </div>

            <div style={{ minWidth: '190px', background: '#ffffff', padding: '10px 14px', borderRadius: '6px', border: '1px solid var(--fr8x-outline)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--fr8x-text)' }}>Profile Completeness</span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--fr8x-text)' }}>{completeness}%</span>
              </div>
              <div className="progress" style={{ background: 'var(--fr8x-input)', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ width: `${completeness}%`, background: 'var(--fr8x-outline)', height: '100%' }} />
              </div>
              <small style={{ display: 'block', fontSize: '9.5px', color: 'var(--fr8x-muted)', marginTop: '4px' }}>
                {completeness === 100 ? 'All credentials & logos verified' : 'Upload photos & details to reach 100%'}
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* 3 DEDICATED, COMPREHENSIVE SECTIONS: CARDS IN ROWS (EXPERIENCE, EDUCATION, CERTIFICATIONS) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* SECTION 1: Professional Work Experience */}
        <div className="card" style={{ padding: '18px 20px', borderRadius: '0px', border: '1px solid var(--fr8x-outline)', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--fr8x-outline)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '0px', background: '#f8fafc', border: '1px solid var(--fr8x-outline)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Briefcase size={16} color="var(--fr8x-text)" />
              </div>
              <div>
                <b style={{ fontSize: '15px', color: 'var(--fr8x-text)' }}>1. Professional Work Experience</b>
                <span style={{ fontSize: '12px', color: 'var(--fr8x-muted)', display: 'block' }}>
                  Forwarding career milestones, freight volume managed, and liner contract leadership.
                </span>
              </div>
            </div>
            <button className="btn primary sm" style={{ borderRadius: '0px' }} onClick={() => handleOpenExpModal()}>
              <Plus size={13} /> Add Experience
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
            {experiences.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--fr8x-muted)', background: '#f8fafc', border: '1px solid var(--fr8x-outline)', gridColumn: '1 / -1' }}>
                No experience records added yet. Click &quot;+ Add Experience&quot; to showcase your career.
              </div>
            ) : (
              experiences.map((exp) => (
                <div
                  key={exp.id}
                  style={{
                    padding: '14px 16px',
                    background: '#ffffff',
                    borderRadius: '0px',
                    border: '1px solid var(--fr8x-outline)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <b style={{ fontSize: '14px', color: 'var(--fr8x-text)' }}>{exp.designation}</b>
                        <div style={{ fontSize: '12px', color: 'var(--fr8x-text)', fontWeight: 600, marginTop: '2px' }}>
                          {exp.company} · <span style={{ color: 'var(--fr8x-muted)' }}>{exp.location}</span>
                        </div>
                      </div>
                      <span className="badge" style={{ fontSize: '9.5px', background: '#f1f5f9', color: 'var(--fr8x-text)', borderRadius: '0px', border: '1px solid var(--fr8x-outline)' }}>
                        {exp.employmentType}
                      </span>
                    </div>

                    <div style={{ fontSize: '11px', color: 'var(--fr8x-muted)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={11} />
                      {exp.startDate} – {exp.isCurrent ? 'Present' : exp.endDate}
                    </div>

                    <p style={{ margin: '10px 0 8px', fontSize: '12px', color: 'var(--fr8x-text)', lineHeight: 1.5 }}>
                      {exp.description}
                    </p>
                  </div>

                  <div>
                    {exp.skills && (
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', margin: '8px 0' }}>
                        {exp.skills.split(',').map((s, idx) => (
                          <span key={idx} style={{ fontSize: '10px', background: '#f8fafc', padding: '2px 6px', border: '1px solid var(--fr8x-outline)', color: 'var(--fr8x-text)' }}>
                            {s.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--line-light)' }}>
                      <button className="btn secondary sm" style={{ borderRadius: '0px', padding: '3px 8px', fontSize: '11px' }} onClick={() => handleOpenExpModal(exp)}>
                        <Edit2 size={11} /> Edit
                      </button>
                      <button
                        className="btn secondary sm"
                        style={{ borderRadius: '0px', padding: '3px 8px', fontSize: '11px', color: '#b91c1c' }}
                        onClick={() => {
                          setExperiences((prev) => prev.filter((i) => i.id !== exp.id));
                          toast('Experience entry removed.');
                        }}
                      >
                        <Trash2 size={11} /> Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION 2: Academic & Maritime Education */}
        <div className="card" style={{ padding: '18px 20px', borderRadius: '0px', border: '1px solid var(--fr8x-outline)', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--fr8x-outline)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '0px', background: '#f8fafc', border: '1px solid var(--fr8x-outline)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <GraduationCap size={16} color="var(--fr8x-text)" />
              </div>
              <div>
                <b style={{ fontSize: '15px', color: 'var(--fr8x-text)' }}>2. Academic & Maritime Education</b>
                <span style={{ fontSize: '12px', color: 'var(--fr8x-muted)', display: 'block' }}>
                  University degrees, supply chain specializations, and maritime research credentials.
                </span>
              </div>
            </div>
            <button className="btn primary sm" style={{ borderRadius: '0px' }} onClick={() => handleOpenEduModal()}>
              <Plus size={13} /> Add Education
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
            {educations.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--fr8x-muted)', background: '#f8fafc', border: '1px solid var(--fr8x-outline)', gridColumn: '1 / -1' }}>
                No education records added yet. Click &quot;+ Add Education&quot; to add degree credentials.
              </div>
            ) : (
              educations.map((edu) => (
                <div
                  key={edu.id}
                  style={{
                    padding: '14px 16px',
                    background: '#ffffff',
                    borderRadius: '0px',
                    border: '1px solid var(--fr8x-outline)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <b style={{ fontSize: '14px', color: 'var(--fr8x-text)' }}>{edu.qualification} in {edu.fieldOfStudy}</b>
                    <div style={{ fontSize: '12px', color: 'var(--fr8x-text)', fontWeight: 600, marginTop: '2px' }}>
                      {edu.institution}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--fr8x-muted)', display: 'block', marginTop: '2px' }}>
                      {edu.startYear} – {edu.endYear} {edu.grade && `· Grade: ${edu.grade}`}
                    </span>

                    {edu.description && (
                      <p style={{ margin: '8px 0 0', fontSize: '12px', color: 'var(--fr8x-text)', lineHeight: 1.5 }}>
                        {edu.description}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--line-light)', marginTop: '10px' }}>
                    <button className="btn secondary sm" style={{ borderRadius: '0px', padding: '3px 8px', fontSize: '11px' }} onClick={() => handleOpenEduModal(edu)}>
                      <Edit2 size={11} /> Edit
                    </button>
                    <button
                      className="btn secondary sm"
                      style={{ borderRadius: '0px', padding: '3px 8px', fontSize: '11px', color: '#b91c1c' }}
                      onClick={() => {
                        setEducations((prev) => prev.filter((i) => i.id !== edu.id));
                        toast('Education record removed.');
                      }}
                    >
                      <Trash2 size={11} /> Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SECTION 3: Industry Certifications & Licences */}
        <div className="card" style={{ padding: '18px 20px', borderRadius: '0px', border: '1px solid var(--fr8x-outline)', background: '#ffffff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--fr8x-outline)', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '0px', background: '#f8fafc', border: '1px solid var(--fr8x-outline)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={16} color="var(--fr8x-text)" />
              </div>
              <div>
                <b style={{ fontSize: '15px', color: 'var(--fr8x-text)' }}>3. Industry Certifications & Licences</b>
                <span style={{ fontSize: '12px', color: 'var(--fr8x-muted)', display: 'block' }}>
                  IATA DGR, FIATA, CSCP, and CBIC Customs Brokerage license registrations.
                </span>
              </div>
            </div>
            <button className="btn primary sm" style={{ borderRadius: '0px' }} onClick={() => handleOpenCertModal()}>
              <Plus size={13} /> Add Certification
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
            {certifications.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--fr8x-muted)', background: '#f8fafc', border: '1px solid var(--fr8x-outline)', gridColumn: '1 / -1' }}>
                No certifications added yet. Click &quot;+ Add Certification&quot; to add your accredited licenses.
              </div>
            ) : (
              certifications.map((cert) => (
                <div
                  key={cert.id}
                  style={{
                    padding: '14px 16px',
                    background: '#ffffff',
                    borderRadius: '0px',
                    border: '1px solid var(--fr8x-outline)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <b style={{ fontSize: '14px', color: 'var(--fr8x-text)' }}>{cert.title}</b>
                      <span className="badge" style={{ fontSize: '9px', fontWeight: 800, background: '#f1f5f9', color: 'var(--fr8x-text)', border: '1px solid var(--fr8x-outline)', borderRadius: '0px' }}>
                        <CheckCircle2 size={10} /> VERIFIED
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--fr8x-text)', fontWeight: 600, marginTop: '2px' }}>
                      {cert.issuingAuthority}
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--fr8x-muted)', display: 'block', marginTop: '3px' }}>
                      License ID: <b style={{ fontFamily: 'var(--font-mono)', color: 'var(--fr8x-text)' }}>{cert.certificateNumber}</b>
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--fr8x-muted)', display: 'block', marginTop: '1px' }}>
                      Issued: {cert.issueDate} {cert.expiryDate ? `· Exp: ${cert.expiryDate}` : ''}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', paddingTop: '8px', borderTop: '1px solid var(--line-light)', marginTop: '10px' }}>
                    {cert.credentialUrl && (
                      <a
                        href={cert.credentialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="btn secondary sm"
                        style={{ borderRadius: '0px', padding: '3px 8px', fontSize: '11px' }}
                        title="Verify credential online"
                      >
                        <ExternalLink size={11} /> Verify
                      </a>
                    )}
                    <button className="btn secondary sm" style={{ borderRadius: '0px', padding: '3px 8px', fontSize: '11px' }} onClick={() => handleOpenCertModal(cert)}>
                      <Edit2 size={11} /> Edit
                    </button>
                    <button
                      className="btn secondary sm"
                      style={{ borderRadius: '0px', padding: '3px 8px', fontSize: '11px', color: '#b91c1c' }}
                      onClick={() => {
                        setCertifications((prev) => prev.filter((i) => i.id !== cert.id));
                        toast('Certification credential removed.');
                      }}
                    >
                      <Trash2 size={11} /> Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Corporate KYC & Regulatory Filings Section */}
      <div className="card" style={{ padding: '20px 24px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--line-light)', paddingBottom: '12px' }}>
          <div>
            <b style={{ fontSize: '16px', color: 'var(--ink)' }}>4. Corporate KYC & Statutory Trade Filings</b>
            <span style={{ fontSize: '12px', color: 'var(--mut)', display: 'block' }}>
              Statutory government identifiers validated with GSTN, Icegate, and DG Shipping registries.
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span className="badge green"><ShieldCheck size={11} /> 100% REGULATORY COMPLIANT</span>
            <button className="btn primary sm" onClick={() => setShowKycModal(true)}>
              <Edit2 size={12} /> Edit / Update KYC
            </button>
          </div>
        </div>

        <div className="grid g2" style={{ gap: '12px' }}>
          <div className="kv" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line-light)' }}>
            <span>GSTN Identification</span>
            <b style={{ fontFamily: 'var(--font-mono)' }}>{gstn} <span className="badge green" style={{ fontSize: '9px' }}>ACTIVE</span></b>
          </div>

          <div className="kv" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line-light)' }}>
            <span>Income Tax PAN</span>
            <b style={{ fontFamily: 'var(--font-mono)' }}>{pan} <span className="badge green" style={{ fontSize: '9px' }}>VERIFIED</span></b>
          </div>

          <div className="kv" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line-light)' }}>
            <span>Import Export Code (IEC)</span>
            <b style={{ fontFamily: 'var(--font-mono)' }}>{iec} <span className="badge green" style={{ fontSize: '9px' }}>DGFT VALID</span></b>
          </div>

          <div className="kv" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line-light)' }}>
            <span>MTO License Number</span>
            <b style={{ fontFamily: 'var(--font-mono)' }}>{mto} <span className="badge green" style={{ fontSize: '9px' }}>RECOGNISED</span></b>
          </div>

          <div className="kv" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line-light)' }}>
            <span>IATA Cargo Numeric Code</span>
            <b style={{ fontFamily: 'var(--font-mono)' }}>{iataCode}</b>
          </div>

          <div className="kv" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line-light)' }}>
            <span>FIATA Registration</span>
            <b style={{ fontFamily: 'var(--font-mono)' }}>{fiataReg}</b>
          </div>

          <div className="kv" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line-light)' }}>
            <span>FMC OTI License</span>
            <b style={{ fontFamily: 'var(--font-mono)' }}>{fmcNumber}</b>
          </div>

          <div className="kv" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line-light)' }}>
            <span>Authorized Economic Operator</span>
            <b style={{ color: 'var(--brand)' }}>{aeoTier}</b>
          </div>
        </div>
      </div>

      {/* KYC Edit Modal */}
      {showKycModal && (
        <Modal
          isOpen={showKycModal}
          onClose={() => setShowKycModal(false)}
          title="Edit Corporate KYC & Statutory Trade Filings"
          maxWidth="680px"
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!termsAccepted) {
                toast('You must accept the Terms & Non-Repudiation Policy to verify KYC.');
                return;
              }
              const canonicalAssoc = normalizeAssociationName(associationName);
              const now = new Date().toISOString();

              const dossier: KYCDossier = {
                userId: user.uid,
                companyId: user.company,
                legalEntityName: user.company,
                gstin: gstn.trim(),
                pan: pan.trim(),
                iec: iec.trim(),
                registeredAddress: {
                  addressLine1: formattedAddress || 'Logistics Hub',
                  city: city || 'Mumbai',
                  state: stateName || 'Maharashtra',
                  postalCode: '400093',
                  country: country || 'India',
                },
                memberships: [
                  {
                    id: `assoc_${canonicalAssoc}_${Date.now()}`,
                    association: canonicalAssoc,
                    canonicalName: canonicalAssoc,
                    membershipNumber: associationId.trim().toUpperCase(),
                    validTill: '2027-12-31',
                    verified: true,
                  },
                ],
                status: 'verified',
                missingItemsChecklist: [],
                statusHistory: [
                  {
                    status: 'verified',
                    timestamp: now,
                    reviewerUid: 'system',
                    reviewerName: 'FR8X Automated Verifier',
                    notes: 'Self-declaration certified with non-repudiation audit trail.',
                  },
                ],
                termsAccepted: true,
                termsAcceptedAt: now,
                termsVersion: 'v2.4-2026',
                submittedAt: now,
                verifiedAt: now,
                updatedAt: now,
              };

              try {
                await upsertKYCDossierInDB(dossier);
              } catch {}

              updateUser({
                gstn,
                pan,
                iec,
                mto,
              });
              setShowKycModal(false);
              toast('Corporate KYC & Association credentials verified and saved to ledger.');
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
          >
            <div className="grid g2">
              <div className="field">
                <label>GSTN Identification (15 Digits) <span className="req">*</span></label>
                <input
                  className="input"
                  style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                  value={gstn}
                  onChange={(e) => setGstn(e.target.value.toUpperCase())}
                  placeholder="27AAAAA0000A1Z5"
                  required
                />
              </div>
              <div className="field">
                <label>Income Tax PAN (10 Characters) <span className="req">*</span></label>
                <input
                  className="input"
                  style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  placeholder="AAAAA0000A"
                  required
                />
              </div>
            </div>

            <div className="grid g2">
              <div className="field">
                <label>Import Export Code (IEC) <span className="req">*</span></label>
                <input
                  className="input"
                  style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                  value={iec}
                  onChange={(e) => setIec(e.target.value.toUpperCase())}
                  placeholder="0388129941"
                  required
                />
              </div>
              <div className="field">
                <label>MTO License Registration (DG Shipping)</label>
                <input
                  className="input"
                  style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                  value={mto}
                  onChange={(e) => setMto(e.target.value.toUpperCase())}
                  placeholder="MTO/DGS/2024/9912"
                />
              </div>
            </div>

            <div className="grid g2">
              <div className="field">
                <label>Freight Forwarder Association Network</label>
                <input
                  className="input"
                  style={{ textTransform: 'uppercase' }}
                  value={associationName}
                  onChange={(e) => setAssociationName(e.target.value.toUpperCase())}
                  placeholder="E.G. WCA, FIATA, IATA, AMTOI..."
                />
                <small style={{ fontSize: '10.5px', color: 'var(--mut)', marginTop: '2px', display: 'block' }}>
                  Canonical Association: <b style={{ color: 'var(--brand)' }}>{normalizeAssociationName(associationName)}</b>
                </small>
              </div>
              <div className="field">
                <label>Association Membership ID</label>
                <input
                  className="input"
                  style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                  value={associationId}
                  onChange={(e) => setAssociationId(e.target.value.toUpperCase())}
                  placeholder="E.G. WCA-98124"
                />
              </div>
            </div>

            <div className="grid g2">
              <div className="field">
                <label>IATA Cargo Code</label>
                <input
                  className="input"
                  style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                  value={iataCode}
                  onChange={(e) => setIataCode(e.target.value.toUpperCase())}
                  placeholder="14-3-8821"
                />
              </div>
              <div className="field">
                <label>FIATA Registration Number</label>
                <input
                  className="input"
                  style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                  value={fiataReg}
                  onChange={(e) => setFiataReg(e.target.value.toUpperCase())}
                  placeholder="FIATA-IND-2024-918"
                />
              </div>
            </div>

            <div className="grid g2">
              <div className="field">
                <label>US Federal Maritime Commission (FMC)</label>
                <input
                  className="input"
                  style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                  value={fmcNumber}
                  onChange={(e) => setFmcNumber(e.target.value.toUpperCase())}
                  placeholder="FMC-OTI-024881"
                />
              </div>
              <div className="field">
                <label>Authorized Economic Operator (AEO)</label>
                <select className="input" value={aeoTier} onChange={(e) => setAeoTier(e.target.value)}>
                  <option value="AEO-T1 Certified (CBIC)">AEO-T1 Certified (CBIC)</option>
                  <option value="AEO-T2 Certified (CBIC)">AEO-T2 Certified (CBIC)</option>
                  <option value="AEO-T3 Tier-3 Secure">AEO-T3 Tier-3 Secure</option>
                  <option value="AEO-LO Logistics Operator">AEO-LO Logistics Operator</option>
                  <option value="Not Applicable">Not Applicable</option>
                </select>
              </div>
            </div>

            {/* Non-Repudiation Terms Consent Checkbox */}
            <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--line-light)' }}>
              <label className="check" style={{ fontSize: '11px', display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer', margin: 0 }}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  required
                />
                <span>
                  I legally certify that all GSTN, PAN, and trade association registrations are authentic and belong to <b>{user.company}</b>. I accept the <b>FR8X Enterprise Non-Repudiation Code</b> and Terms of Service (v2.4-2026).
                </span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" className="btn secondary" onClick={() => setShowKycModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn primary">
                <Check size={13} /> Save Statutory KYC
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: EDIT IDENTITY, PHOTO, LOGO, USER NAME, EMAIL & COMPANY LINK (User Requirements 9 & 10) */}
      {showEditIdentityModal && (
        <Modal
          isOpen={showEditIdentityModal}
          onClose={() => setShowEditIdentityModal(false)}
          title="Edit Member Identity, Credentials & Corporate Link"
          maxWidth="680px"
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();

              let newCompanyTransferStatus = user.companyTransferStatus || 'none';
              let newPendingCompany = user.pendingCompany;
              let newPendingEmail = user.pendingEmail;
              let newTransferRequestId = user.transferRequestId;
              let finalCompany = user.company;
              let finalEmail = editEmail;

              if (isChangingCompany && transferTargetCompany.trim()) {
                if (transferMethod === 'self') {
                  finalCompany = transferTargetCompany.trim();
                  finalEmail = transferTargetEmail.trim() || editEmail;
                  newCompanyTransferStatus = 'verified';
                  setCompany(finalCompany);
                  toast(`✓ Company transferred to ${finalCompany} and login email updated via Domain Self-Link.`);
                } else {
                  const ticket = `TRF-CO-${Math.floor(1000 + Math.random() * 9000)}`;
                  newCompanyTransferStatus = 'pending_godfather_approval';
                  newPendingCompany = transferTargetCompany.trim();
                  newPendingEmail = transferTargetEmail.trim() || editEmail;
                  newTransferRequestId = ticket;
                  toast(`Corporate transfer docket ${ticket} submitted for Godfather Governance review.`);
                }
              }

              // Update local state
              setFirstName(editFirstName);
              setLastName(editLastName);
              setMobile(editMobile);
              setDesignation(editDesignation);
              setAvatarUrl(editAvatarUrl || null);
              setCompanyLogoUrl(editCompanyLogoUrl || null);

              updateUser({
                firstName: editFirstName,
                lastName: editLastName,
                displayName: `${editFirstName} ${editLastName}`.trim(),
                email: finalEmail,
                mobile: editMobile,
                designation: editDesignation,
                company: finalCompany,
                avatarUrl: editAvatarUrl || '',
                companyLogoUrl: editCompanyLogoUrl || '',
                companyTransferStatus: newCompanyTransferStatus as any,
                pendingCompany: newPendingCompany,
                pendingEmail: newPendingEmail,
                transferRequestId: newTransferRequestId,
                transferSubmittedAt: isChangingCompany ? new Date().toISOString() : user.transferSubmittedAt,
              });

              setShowEditIdentityModal(false);
              toast('Enterprise identity credentials updated successfully.');
            }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {/* 1. Visual Identity & Brand Assets (Profile Picture + Company Logo) */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid var(--line-light)' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '10px' }}>
                1. Visual Identity & Brand Assets
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                {/* Profile Photo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '10px', background: '#fff', border: '1px solid var(--line-light)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>User Profile Photo</span>
                  <div style={{ position: 'relative', width: '64px', height: '64px' }}>
                    {editAvatarUrl ? (
                      <img src={editAvatarUrl} alt="Profile" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--brand)' }} />
                    ) : (
                      <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#e2e8f0', display: 'grid', placeItems: 'center', fontWeight: 700, color: '#475569' }}>
                        {editFirstName[0] || 'U'}{editLastName[0] || ''}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <label className="btn secondary sm" style={{ cursor: 'pointer', fontSize: '11px', padding: '4px 8px' }}>
                      <Camera size={12} /> Upload
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const r = new FileReader();
                            r.onload = (ev) => setEditAvatarUrl(ev.target?.result as string);
                            r.readAsDataURL(f);
                          }
                        }}
                      />
                    </label>
                    {editAvatarUrl && (
                      <button type="button" className="btn secondary sm" style={{ fontSize: '11px', padding: '4px 8px', color: '#dc2626' }} onClick={() => setEditAvatarUrl(null)}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                {/* Company Logo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '10px', background: '#fff', border: '1px solid var(--line-light)', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>Company Corporate Logo</span>
                  <div style={{ position: 'relative', width: '64px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {editCompanyLogoUrl ? (
                      <img src={editCompanyLogoUrl} alt="Logo" style={{ width: '64px', height: '64px', borderRadius: '8px', objectFit: 'contain', border: '1px solid var(--brand)', padding: '2px', background: '#fff' }} />
                    ) : (
                      <div style={{ width: '64px', height: '64px', borderRadius: '8px', background: '#f1f5f9', border: '1px dashed var(--brand)', display: 'grid', placeItems: 'center', color: 'var(--mut)' }}>
                        <Building2 size={24} />
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <label className="btn secondary sm" style={{ cursor: 'pointer', fontSize: '11px', padding: '4px 8px' }}>
                      <Upload size={12} /> Upload
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const r = new FileReader();
                            r.onload = (ev) => setEditCompanyLogoUrl(ev.target?.result as string);
                            r.readAsDataURL(f);
                          }
                        }}
                      />
                    </label>
                    {editCompanyLogoUrl && (
                      <button type="button" className="btn secondary sm" style={{ fontSize: '11px', padding: '4px 8px', color: '#dc2626' }} onClick={() => setEditCompanyLogoUrl(null)}>
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. User Name & Contact Credentials */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                2. User Name & Contact Credentials
              </span>
              <div className="grid g2">
                <div className="field">
                  <label>First Name <span className="req">*</span></label>
                  <input className="input" value={editFirstName} onChange={(e) => setEditFirstName(e.target.value)} required />
                </div>
                <div className="field">
                  <label>Last Name <span className="req">*</span></label>
                  <input className="input" value={editLastName} onChange={(e) => setEditLastName(e.target.value)} required />
                </div>
              </div>

              <div className="grid g2">
                <div className="field">
                  <label>Login Email ID (Primary Auth) <span className="req">*</span></label>
                  <input className="input" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} required />
                </div>
                <div className="field">
                  <label>Mobile Number (with Country Code) <span className="req">*</span></label>
                  <input className="input" value={editMobile} onChange={(e) => setEditMobile(e.target.value)} placeholder="+91 98200 12345" required />
                </div>
              </div>

              <div className="field">
                <label>Job Designation / Role</label>
                <input className="input" value={editDesignation} onChange={(e) => setEditDesignation(e.target.value)} placeholder="Senior Vice President - Ocean Procurement" />
              </div>
            </div>

            {/* 3. Company Link & Affiliation Governance (User Request 10) */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid var(--line-light)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--mut)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                    3. Enterprise Company Link & Login Affiliation
                  </span>
                  <div style={{ fontSize: '11px', color: 'var(--mut)', marginTop: '2px' }}>
                    Current Associated Organization: <b style={{ color: 'var(--ink)' }}>{user.company}</b>
                  </div>
                </div>
                <button
                  type="button"
                  className={`btn sm ${isChangingCompany ? 'primary' : 'secondary'}`}
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                  onClick={() => setIsChangingCompany(!isChangingCompany)}
                >
                  {isChangingCompany ? 'Cancel Switch' : 'Link / Switch Company'}
                </button>
              </div>

              {isChangingCompany && (
                <div style={{ background: '#fff', border: '1px solid var(--line-light)', borderRadius: '6px', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--mut)', lineHeight: 1.4 }}>
                    <b>Enterprise Governance Policy:</b> When switching organizations, your account profile can be transferred to the new company domain, updating your corporate login email ID. Choose between instant domain self-link or submitting for official Godfather regulatory clearance.
                  </div>

                  <div className="grid g2">
                    <div className="field">
                      <label>New Company / Employer Name <span className="req">*</span></label>
                      <input
                        className="input"
                        placeholder="e.g. Hapag-Lloyd AG or Maersk Logistics"
                        value={transferTargetCompany}
                        onChange={(e) => setTransferTargetCompany(e.target.value)}
                        required={isChangingCompany}
                      />
                    </div>
                    <div className="field">
                      <label>New Corporate Email ID <span className="req">*</span></label>
                      <input
                        className="input"
                        type="email"
                        placeholder="e.g. arjun.rao@hapag-lloyd.com"
                        value={transferTargetEmail}
                        onChange={(e) => setTransferTargetEmail(e.target.value)}
                        required={isChangingCompany}
                      />
                    </div>
                  </div>

                  <div className="field">
                    <label>Transfer & Verification Method</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px', cursor: 'pointer', padding: '8px', border: transferMethod === 'self' ? '1.5px solid var(--brand)' : '1px solid var(--line-light)', borderRadius: '6px', background: transferMethod === 'self' ? 'rgba(0, 163, 196, 0.05)' : '#fff' }}>
                        <input
                          type="radio"
                          name="transferMethod"
                          checked={transferMethod === 'self'}
                          onChange={() => setTransferMethod('self')}
                        />
                        <div>
                          <b>Method 1: Instant Self-Link</b>
                          <div style={{ fontSize: '10px', color: 'var(--mut)' }}>Verify immediately via corporate email domain match.</div>
                        </div>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px', cursor: 'pointer', padding: '8px', border: transferMethod === 'godfather' ? '1.5px solid var(--brand)' : '1px solid var(--line-light)', borderRadius: '6px', background: transferMethod === 'godfather' ? 'rgba(0, 163, 196, 0.05)' : '#fff' }}>
                        <input
                          type="radio"
                          name="transferMethod"
                          checked={transferMethod === 'godfather'}
                          onChange={() => setTransferMethod('godfather')}
                        />
                        <div>
                          <b>Method 2: Godfather Approval</b>
                          <div style={{ fontSize: '10px', color: 'var(--mut)' }}>Routes ticket to Godfather Admin for regulatory review.</div>
                        </div>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" className="btn secondary" onClick={() => setShowEditIdentityModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn primary">
                <Check size={13} /> Save Identity & Credentials
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
