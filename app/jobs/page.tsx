'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/context/DataContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { SkeletonScreen } from '@/components/ui/SkeletonScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { GoldenTick } from '@/components/ui/GoldenTick';
import { LocalTimeBadge } from '@/components/ui/LocalTimeBadge';
import { JobCreateModal } from '@/components/jobs/JobCreateModal';
import { JobPost } from '@/lib/types';
import {
  Briefcase,
  Plus,
  Search,
  MapPin,
  Clock,
  Building2,
  ChevronRight,
  X,
  Mail,
  Filter,
  DollarSign,
  Users,
  Calendar,
  Tag,
  Trash2,
  ExternalLink,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Send,
  FileText,
  Phone,
  UserCheck,
  Eye,
  Check,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { PaymentCheckoutModal } from '@/components/ui/PaymentCheckoutModal';
import { getStoredPlatformConfig, isFeatureFreeForUser } from '@/lib/platform-config';

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  candidateUid: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  experience: string;
  currentRole?: string;
  resumeUrl?: string;
  coverNote?: string;
  status: 'Under Review' | 'Shortlisted' | 'Interview Scheduled' | 'Rejected' | 'Hired';
  appliedAt: string;
}

export default function JobsPage() {
  const { jobs, addJob, deleteJob, isHydrated } = useData();
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPaymentCheckout, setShowPaymentCheckout] = useState(false);
  const [pendingJobData, setPendingJobData] = useState<any>(null);

  // Application and Recruiter management state
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [applyingJob, setApplyingJob] = useState<JobPost | null>(null);
  const [managingJobApps, setManagingJobApps] = useState<JobPost | null>(null);

  // Application form fields
  const [appName, setAppName] = useState('');
  const [appEmail, setAppEmail] = useState('');
  const [appPhone, setAppPhone] = useState('');
  const [appExp, setAppExp] = useState('3–5 yrs experience');
  const [appRole, setAppRole] = useState('');
  const [appResume, setAppResume] = useState('');
  const [appNote, setAppNote] = useState('');
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);

  // Load applications from localStorage on mount
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('fr8x_job_applications');
      if (stored) {
        setJobApplications(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const openApplyModal = (job: JobPost) => {
    setApplyingJob(job);
    setAppName(user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || '');
    setAppEmail(user.email || '');
    setAppPhone((user as any).phone || '');
    setAppRole(user.designation || '');
    setAppResume('');
    setAppNote('');
  };

  const handleApplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyingJob) return;

    if (!appName.trim() || !appEmail.trim() || !appPhone.trim()) {
      toast('Please enter your full name, email, and contact phone number.');
      return;
    }

    // Duplicate application check
    const isDuplicate = jobApplications.some(
      (a) => a.jobId === applyingJob.id && (a.candidateUid === user.uid || a.candidateEmail.toLowerCase() === appEmail.trim().toLowerCase())
    );
    if (isDuplicate) {
      toast('⚠️ You have already submitted an application for this position.');
      return;
    }

    setIsSubmittingApp(true);
    const newApp: JobApplication = {
      id: `app_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      jobId: applyingJob.id,
      jobTitle: applyingJob.title,
      companyName: applyingJob.company,
      candidateUid: user.uid,
      candidateName: appName.trim(),
      candidateEmail: appEmail.trim(),
      candidatePhone: appPhone.trim(),
      experience: appExp.trim(),
      currentRole: appRole.trim(),
      resumeUrl: appResume.trim() || undefined,
      coverNote: appNote.trim(),
      status: 'Under Review',
      appliedAt: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    const next = [newApp, ...jobApplications];
    setJobApplications(next);
    try {
      localStorage.setItem('fr8x_job_applications', JSON.stringify(next));
    } catch {}

    setIsSubmittingApp(false);
    setApplyingJob(null);
    toast(`🎉 Application successfully submitted to ${applyingJob.company}! The recruiter will review your profile.`);
  };

  const handleUpdateAppStatus = (appId: string, newStatus: JobApplication['status']) => {
    const next = jobApplications.map((a) => (a.id === appId ? { ...a, status: newStatus } : a));
    setJobApplications(next);
    try {
      localStorage.setItem('fr8x_job_applications', JSON.stringify(next));
    } catch {}
    toast(`Candidate application status updated to '${newStatus}'.`);
  };

  // Job create form state
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState(user.company);
  const [newLocation, setNewLocation] = useState(`${user.city}, ${user.country} · On-site`);
  const [newType, setNewType] = useState('Full-time');
  const [newExp, setNewExp] = useState('3–5 yrs experience');
  const [newPkg, setNewPkg] = useState('');
  const [newReq, setNewReq] = useState('');
  const [newResp, setNewResp] = useState('');
  const [newQual, setNewQual] = useState('');
  const [newClosing, setNewClosing] = useState('');
  const [newSkills, setNewSkills] = useState('');
  const [jobDurationDays, setJobDurationDays] = useState<number>(2);
  const [autoRenewJob, setAutoRenewJob] = useState<boolean>(true);

  // Job pricing calculation: 2 days = ₹300, each additional day = ₹180
  const calculateJobPostingCost = (days: number) => {
    if (days <= 2) return 300;
    return 300 + (days - 2) * 180;
  };
  const currentJobCost = calculateJobPostingCost(jobDurationDays);

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Freelance', 'Internship'];
  const locations = [...new Set(jobs.map((j) => j.location.split('·')[0].trim()))].slice(0, 6);

  const filteredJobs = jobs.filter((j) => {
    // Commercial regulation:
    // Only jobs with confirmed payment or promotional waiver are publicly visible.
    // Unverified / pending payment jobs are strictly restricted to the poster himself.
    const isPaidOrWaived = j.paymentStatus === 'paid' || j.paymentStatus === 'waived_promotional' || j.paymentStatus === undefined;
    const isCreator = j.posterUid === user.uid;

    if (!isPaidOrWaived && !isCreator) {
      return false;
    }

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q) ||
      (j.requirements || '').toLowerCase().includes(q) ||
      (Array.isArray(j.skills) ? j.skills.join(' ') : typeof j.skills === 'string' ? j.skills : '').toLowerCase().includes(q);

    const matchesTab = activeTab === 'all' || j.posterUid === user.uid;
    const matchesType = !filterType || j.employmentType === filterType;
    const matchesLocation = !filterLocation || j.location.toLowerCase().includes(filterLocation.toLowerCase());

    return matchesSearch && matchesTab && matchesType && matchesLocation;
  });

  const resetJobForm = () => {
    setNewTitle('');
    setNewReq('');
    setNewResp('');
    setNewQual('');
    setNewSkills('');
    setNewClosing('');
    setPendingJobData(null);
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newReq.trim()) {
      toast('Job title and requirements are required.');
      return;
    }

    const payload = {
      title: newTitle.trim(),
      company: newCompany.trim() || user.company,
      location: newLocation.trim(),
      employmentType: newType as any,
      experience: newExp.trim(),
      packageDetails: newPkg.trim(),
      requirements: newReq.trim(),
      responsibilities: newResp.trim(),
      qualifications: newQual.trim(),
      skills: newSkills.split(',').map((s) => s.trim()).filter(Boolean),
      closingDate: newClosing,
      posterEmail: user.email,
      showEmailPublicly: false,
      posterTimezone: user.timezone,
    };

    const config = getStoredPlatformConfig();
    const isFree = isFeatureFreeForUser(config, 'JOB_POSTING', user.uid);

    if (isFree) {
      addJob({
        ...payload,
        paymentStatus: 'waived_promotional',
        paidAmount: 0,
        status: 'active',
      });
      setShowCreateModal(false);
      resetJobForm();
      toast('🎉 Promotional free waiver applied! Job posted successfully.');
      return;
    }

    // Require commercial checkout
    setPendingJobData(payload);
    setShowPaymentCheckout(true);
  };

  const myJobs = jobs.filter((j) => j.posterUid === user.uid);

  return (
    <div>
      {/* Job Detail Modal */}
      {selectedJob && (
        <Modal
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          title={selectedJob.title}
          maxWidth="640px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <UserAvatar
                name={selectedJob.postedBy}
                companyName={selectedJob.company}
                size={48}
                showCompanyLogo={true}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--ink)' }}>{selectedJob.title}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--brand)', fontSize: '12.5px', fontWeight: 700 }}>{selectedJob.company}</span>
                  <span className="badge green" style={{ fontSize: '9px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <ShieldCheck size={10} /> Verified Company
                  </span>
                  <span style={{ color: 'var(--mut)' }}>·</span>
                  <span style={{ fontSize: '11.5px', color: 'var(--mut)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <MapPin size={11} /> {selectedJob.location}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <span className="badge blue">{selectedJob.employmentType}</span>
                  <span className="badge grey">{selectedJob.experience}</span>
                  {selectedJob.closingDate && (
                    <span className="badge amber" style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <Clock size={10} /> Closes {selectedJob.closingDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Package */}
            {selectedJob.packageDetails && (
              <div style={{ background: '#e7f7ed', border: '1px solid #bbf7d0', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <DollarSign size={14} style={{ color: 'var(--green)' }} />
                  <b style={{ fontSize: '13px', color: 'var(--green)' }}>{selectedJob.packageDetails}</b>
                </div>
              </div>
            )}

            {/* Skills */}
            {(() => {
              const sList = Array.isArray(selectedJob.skills)
                ? selectedJob.skills
                : typeof selectedJob.skills === 'string'
                  ? (selectedJob.skills as string).split(',').map((s) => s.trim()).filter(Boolean)
                  : [];
              if (sList.length === 0) return null;
              return (
                <div>
                  <b style={{ display: 'block', fontSize: '10.5px', color: 'var(--mut)', textTransform: 'uppercase', marginBottom: '6px' }}>Required Skills</b>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                    {sList.map((s) => (
                      <span key={s} className="badge grey">{s}</span>
                    ))}
                  </div>
                </div>
              );
            })()}

            {/* Sections */}
            {[
              { label: 'Requirements', value: selectedJob.requirements },
              { label: 'Responsibilities', value: selectedJob.responsibilities },
              { label: 'Qualifications', value: selectedJob.qualifications },
            ].filter((s) => s.value).map((section) => (
              <div key={section.label}>
                <b style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--ink)', marginBottom: '6px' }}>{section.label}</b>
                <p style={{ fontSize: '12px', color: 'var(--ink-secondary)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                  {section.value}
                </p>
              </div>
            ))}

            {/* Recruiter Contact Channels & Application Information (Mandatory Directive) */}
            <div style={{ background: '#FFFFFF', border: '1px solid #D9E0E8', borderRadius: 8, padding: '12px' }}>
              <b style={{ fontSize: '11px', color: '#075B5B', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '8px' }}>
                <Mail size={12} /> Recruiter &amp; Application Channels
              </b>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px' }}>
                  <div>
                    <b style={{ fontSize: '12.5px', color: '#172B45', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {selectedJob.postedBy}
                    </b>
                    <small style={{ color: '#526174', fontSize: '11px' }}>
                      {selectedJob.company} · {selectedJob.postedDate}
                    </small>
                  </div>
                  {selectedJob.posterEmail && (
                    <a
                      href={`mailto:${selectedJob.posterEmail}?subject=${encodeURIComponent(`Application for ${selectedJob.title} - ${user.displayName || 'Candidate'}`)}&body=${encodeURIComponent(`Dear Hiring Team at ${selectedJob.company},\n\nI am applying for the ${selectedJob.title} position on FR8X.\n\nApplicant: ${user.displayName}\nEmail: ${user.email}\nPhone: ${user.mobile || ''}\nCompany: ${user.company || ''}\n\nBest regards,\n${user.displayName}`)}`}
                      className="btn secondary sm"
                      style={{ fontSize: '11px', height: '28px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Mail size={12} /> Apply via Email
                    </a>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#172B45', flexWrap: 'wrap' }}>
                  <span style={{ color: '#526174' }}>Primary Email:</span>
                  <a href={`mailto:${selectedJob.posterEmail || 'recruiter@company.com'}`} style={{ color: '#075B5B', fontWeight: 600, textDecoration: 'none' }}>
                    {selectedJob.posterEmail || 'recruiter@company.com'}
                  </a>
                  {selectedJob.contactPhone && (
                    <>
                      <span style={{ color: '#D9E0E8' }}>|</span>
                      <span style={{ color: '#526174' }}>Phone:</span>
                      <span style={{ fontWeight: 600 }}>{selectedJob.contactPhone}</span>
                      {selectedJob.hasWhatsApp && <span className="badge green" style={{ fontSize: '7.5px', padding: '1px 4px' }}>WHATSAPP</span>}
                    </>
                  )}
                </div>

                {selectedJob.applicationInstructions && (
                  <div style={{ background: '#F4F6F8', padding: '8px 10px', borderRadius: '4px', fontSize: '11px', color: '#526174', marginTop: '2px' }}>
                    <b style={{ color: '#172B45' }}>Application Instructions:</b> {selectedJob.applicationInstructions}
                  </div>
                )}
              </div>
              {selectedJob.posterTimezone && (
                <div style={{ marginTop: '8px' }}>
                  <LocalTimeBadge timezone={selectedJob.posterTimezone} />
                </div>
              )}
            </div>

            {/* Controlled Action Workflow: Apply Now / Recruiter Manage */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--line)', paddingTop: '14px', marginTop: '6px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Users size={14} style={{ color: 'var(--brand)' }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                  {jobApplications.filter((a) => a.jobId === selectedJob.id).length} Candidate Application{jobApplications.filter((a) => a.jobId === selectedJob.id).length === 1 ? '' : 's'}
                </span>
              </div>

              {selectedJob.posterUid === user.uid ? (
                <button
                  type="button"
                  className="btn primary sm"
                  onClick={() => {
                    const job = selectedJob;
                    setSelectedJob(null);
                    setManagingJobApps(job);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <UserCheck size={13} /> Manage Applications ({jobApplications.filter((a) => a.jobId === selectedJob.id).length})
                </button>
              ) : jobApplications.some((a) => a.jobId === selectedJob.id && (a.candidateUid === user.uid || a.candidateEmail.toLowerCase() === (user.email || '').toLowerCase())) ? (
                <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '6px', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#065f46', fontSize: '12px', fontWeight: 600 }}>
                  <CheckCircle2 size={14} color="#059669" />
                  <span>Application Submitted &amp; Under Review</span>
                </div>
              ) : (
                <button
                  type="button"
                  className="btn primary"
                  onClick={() => {
                    const job = selectedJob;
                    setSelectedJob(null);
                    openApplyModal(job);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 20px', fontWeight: 700 }}
                >
                  <Send size={13} />
                  <span>APPLY NOW</span>
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Candidate Apply Now Modal */}
      {applyingJob && (
        <Modal
          isOpen={!!applyingJob}
          onClose={() => setApplyingJob(null)}
          title={`Apply for ${applyingJob.title}`}
          maxWidth="560px"
        >
          <form onSubmit={handleApplySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid var(--line)', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <UserAvatar name={applyingJob.postedBy} companyName={applyingJob.company} size={36} showCompanyLogo={true} />
              <div>
                <b style={{ fontSize: '13px', color: 'var(--ink)', display: 'block' }}>{applyingJob.title}</b>
                <small style={{ fontSize: '11px', color: 'var(--mut)' }}>{applyingJob.company} · {applyingJob.location}</small>
              </div>
            </div>

            <div className="grid g2">
              <div className="field">
                <label>Full Name <span className="req">*</span></label>
                <input
                  className="input"
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="e.g. Rajat Kumar Rai"
                  required
                />
              </div>
              <div className="field">
                <label>Corporate / Contact Email <span className="req">*</span></label>
                <input
                  className="input"
                  type="email"
                  value={appEmail}
                  onChange={(e) => setAppEmail(e.target.value)}
                  placeholder="candidate@company.com"
                  required
                />
              </div>
            </div>

            <div className="grid g2">
              <div className="field">
                <label>Contact Phone <span className="req">*</span></label>
                <input
                  className="input"
                  value={appPhone}
                  onChange={(e) => setAppPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  required
                />
              </div>
              <div className="field">
                <label>Total Experience</label>
                <input
                  className="input"
                  value={appExp}
                  onChange={(e) => setAppExp(e.target.value)}
                  placeholder="e.g. 5+ years"
                />
              </div>
            </div>

            <div className="field">
              <label>Current Company &amp; Designation</label>
              <input
                className="input"
                value={appRole}
                onChange={(e) => setAppRole(e.target.value)}
                placeholder="e.g. Senior Freight Forwarder at Blue Freight"
              />
            </div>

            <div className="field">
              <label>Resume / CV Link (or Portfolio URL)</label>
              <input
                className="input"
                value={appResume}
                onChange={(e) => setAppResume(e.target.value)}
                placeholder="https://drive.google.com/your-resume or LinkedIn"
              />
            </div>

            <div className="field">
              <label>Cover Note for Recruiter</label>
              <textarea
                className="input"
                rows={3}
                value={appNote}
                onChange={(e) => setAppNote(e.target.value)}
                placeholder="Briefly highlight your logistics experience, trade lanes handled, and why you are a good fit…"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" className="btn secondary" onClick={() => setApplyingJob(null)}>
                Cancel
              </button>
              <button type="submit" className="btn primary" disabled={isSubmittingApp}>
                <Send size={13} />
                <span>Submit Application</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Recruiter Applications Management Modal */}
      {managingJobApps && (
        <Modal
          isOpen={!!managingJobApps}
          onClose={() => setManagingJobApps(null)}
          title={`Candidate Applications · ${managingJobApps.title}`}
          maxWidth="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <div>
                <b style={{ fontSize: '13px', color: 'var(--ink)', display: 'block' }}>{managingJobApps.title}</b>
                <small style={{ fontSize: '11px', color: 'var(--mut)' }}>Posted by your organization on {managingJobApps.postedDate}</small>
              </div>
              <span className="badge blue" style={{ fontSize: '11px' }}>
                {jobApplications.filter((a) => a.jobId === managingJobApps.id).length} Applicants
              </span>
            </div>

            {jobApplications.filter((a) => a.jobId === managingJobApps.id).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--mut)' }}>
                <Users size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <p style={{ fontSize: '13px', margin: 0, fontWeight: 600 }}>No applications submitted yet.</p>
                <small style={{ fontSize: '11.5px' }}>Your job opening is actively broadcast to freight network members.</small>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '420px', overflowY: 'auto' }}>
                {jobApplications.filter((a) => a.jobId === managingJobApps.id).map((app) => (
                  <div
                    key={app.id}
                    style={{
                      border: '1px solid var(--line)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      background: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <UserAvatar name={app.candidateName} size={34} showCompanyLogo={false} />
                        <div>
                          <b style={{ fontSize: '13px', color: 'var(--ink)', display: 'block' }}>{app.candidateName}</b>
                          <small style={{ fontSize: '11px', color: 'var(--mut)' }}>{app.currentRole || 'Logistics Candidate'} · Exp: {app.experience}</small>
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <select
                          className="input"
                          style={{ fontSize: '11px', padding: '3px 8px', height: '28px' }}
                          value={app.status}
                          onChange={(e) => handleUpdateAppStatus(app.id, e.target.value as any)}
                        >
                          <option value="Under Review">Under Review</option>
                          <option value="Shortlisted">Shortlisted</option>
                          <option value="Interview Scheduled">Interview Scheduled</option>
                          <option value="Hired">Hired</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </div>
                    </div>

                    {app.coverNote && (
                      <p style={{ fontSize: '11.5px', color: 'var(--ink-secondary)', margin: 0, background: '#f8fafc', padding: '6px 10px', borderRadius: '5px' }}>
                        "{app.coverNote}"
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: '6px', fontSize: '11px', color: 'var(--mut)', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <a href={`mailto:${app.candidateEmail}`} style={{ color: 'var(--brand)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                          <Mail size={11} /> {app.candidateEmail}
                        </a>
                        <a href={`tel:${app.candidatePhone}`} style={{ color: 'var(--ink-secondary)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <Phone size={11} /> {app.candidatePhone}
                        </a>
                      </div>
                      {app.resumeUrl && (
                        <a
                          href={app.resumeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn secondary sm"
                          style={{ padding: '2px 8px', fontSize: '10.5px' }}
                        >
                          <FileText size={11} /> View Resume
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create Job Modal with Mandatory Contact & Application Channels */}
      <JobCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {/* Header */}
      <div className="head">
        <div>
          <h1>Jobs Board</h1>
          <p>Professional logistics and freight trade career opportunities across the FR8X network</p>
        </div>
        <div className="actions">
          <button className="btn primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={14} /> Post a Job
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid g4" style={{ marginBottom: '16px' }}>
        {[
          { label: 'Total Jobs', value: jobs.length, color: '#1168d7' },
          { label: 'Active Listings', value: jobs.filter(j => j.status === 'active').length, color: '#059669' },
          { label: 'My Posted', value: myJobs.length, color: '#7c3aed' },
          { label: 'Companies Hiring', value: new Set(jobs.map(j => j.company)).size, color: '#d97706' },
        ].map((stat) => (
          <div key={stat.label} className="metric">
            <small>{stat.label}</small>
            <b style={{ color: stat.color }}>{stat.value}</b>
          </div>
        ))}
      </div>

      {/* Tabs + Search + Filter Row */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap' }}>
        <div className="tabs">
          <button className={activeTab === 'all' ? 'on' : ''} onClick={() => setActiveTab('all')}>
            All Jobs ({jobs.length})
          </button>
          <button className={activeTab === 'mine' ? 'on' : ''} onClick={() => setActiveTab('mine')}>
            My Posted ({myJobs.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: 0, flexWrap: 'wrap' }}>
          <div className="search-icon-wrap" style={{ position: 'relative', minWidth: '200px', flex: 1, display: 'flex', alignItems: 'center' }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--mut)', pointerEvents: 'none', zIndex: 2 }} />
            <input
              className="input search-input-field has-leading-icon"
              style={{ paddingLeft: 32, width: '100%', boxSizing: 'border-box' }}
              placeholder="Search jobs, companies, skills…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <select className="input" style={{ width: 130 }} value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="">All Types</option>
            {jobTypes.map((t) => <option key={t}>{t}</option>)}
          </select>
          <select className="input" style={{ width: 160 }} value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
            <option value="">All Locations</option>
            {locations.map((l) => <option key={l}>{l}</option>)}
          </select>
          {(searchQuery || filterType || filterLocation) && (
            <button className="btn secondary sm" onClick={() => { setSearchQuery(''); setFilterType(''); setFilterLocation(''); }}>
              <X size={12} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Jobs Grid with Progressive Skeleton Loading (Principle 1 & 2) */}
      {!isHydrated ? (
        <div style={{ padding: '8px 0' }}>
          <SkeletonScreen type="card" count={3} label="Loading logistics job listings…" />
        </div>
      ) : filteredJobs.length === 0 ? (
        <EmptyState
          icon={<Briefcase size={32} />}
          title={searchQuery ? `No jobs matching "${searchQuery}"` : 'No job postings found'}
          description={searchQuery ? 'Try clearing your search term or selecting another location.' : 'Be the first freight company to post an opening for logistics talent.'}
          actionLabel="Post a Job"
          onAction={() => setShowCreateModal(true)}
        />
      ) : (
        <div className="jobs-grid">
          {filteredJobs.map((job) => (
            <div key={job.id} className="job-card">
              <div className="job-card-head">
                <UserAvatar
                  name={job.postedBy}
                  companyName={job.company}
                  size={42}
                  showCompanyLogo={true}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b className="job-card-title">{job.title}</b>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11.5px', color: 'var(--brand)', fontWeight: 700 }}>{job.company}</span>
                    <span className="badge green" style={{ fontSize: '8.5px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <ShieldCheck size={9} /> Verified
                    </span>
                    {job.posterUid === user.uid && (
                      <span className="badge blue" style={{ fontSize: '8.5px' }}>My Post</span>
                    )}
                    {job.posterUid === user.uid && job.paymentStatus === 'pending_verification' && (
                      <span className="badge amber" style={{ fontSize: '8.5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Clock size={9} /> Pending Verification {job.paymentReference ? `· ${job.paymentReference}` : ''}
                      </span>
                    )}
                    {job.posterUid === user.uid && job.paymentStatus === 'paid' && (
                      <span className="badge green" style={{ fontSize: '8.5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <CheckCircle2 size={9} /> Paid &amp; Active (₹{job.paidAmount || 300})
                      </span>
                    )}
                    {job.posterUid === user.uid && job.paymentStatus === 'waived_promotional' && (
                      <span className="badge purple" style={{ fontSize: '8.5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <Sparkles size={9} /> Promotional Free
                      </span>
                    )}
                    {job.posterUid === user.uid && job.paymentStatus === 'unpaid' && (
                      <span className="badge red" style={{ fontSize: '8.5px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                        <AlertTriangle size={9} /> Unpaid · Inactive
                      </span>
                    )}
                  </div>
                </div>
                {job.posterUid === user.uid && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteJob(job.id); }}
                    className="btn danger sm icon"
                    title="Remove job posting"
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>

              <div className="job-card-meta">
                <span><MapPin size={11} /> {job.location}</span>
                <span><Briefcase size={11} /> {job.employmentType}</span>
                <span><Users size={11} /> {job.experience}</span>
                {job.closingDate && <span><Calendar size={11} /> Closes {job.closingDate}</span>}
              </div>

              {job.packageDetails && (
                <div style={{ color: 'var(--green)', fontSize: '11.5px', fontWeight: 700, padding: '4px 0' }}>
                  {job.packageDetails}
                </div>
              )}

              {(() => {
                const sList = Array.isArray(job.skills)
                  ? job.skills
                  : typeof job.skills === 'string'
                    ? (job.skills as string).split(',').map((s) => s.trim()).filter(Boolean)
                    : [];
                if (sList.length === 0) return null;
                return (
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                    {sList.slice(0, 4).map((s) => (
                      <span key={s} className="badge grey" style={{ fontSize: '9px' }}>{s}</span>
                    ))}
                    {sList.length > 4 && (
                      <span className="badge grey" style={{ fontSize: '9px' }}>+{sList.length - 4}</span>
                    )}
                  </div>
                );
              })()}

              <div className="job-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line-light, #edf2f7)', paddingTop: '8px', marginTop: '6px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <small style={{ color: 'var(--mut)', fontSize: '10.5px' }}>
                    Posted {job.postedDate}
                  </small>
                  {jobApplications.filter((a) => a.jobId === job.id).length > 0 && (
                    <small style={{ color: 'var(--brand)', fontSize: '10px', fontWeight: 600 }}>
                      {jobApplications.filter((a) => a.jobId === job.id).length} applicant{jobApplications.filter((a) => a.jobId === job.id).length === 1 ? '' : 's'}
                    </small>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {job.posterUid === user.uid && (
                    <button
                      type="button"
                      className="btn secondary sm"
                      style={{ padding: '3px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={() => setManagingJobApps(job)}
                      title="Manage candidate applications"
                    >
                      <Users size={11} /> Apps ({jobApplications.filter((a) => a.jobId === job.id).length})
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn primary sm"
                    style={{ fontWeight: 700, padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px' }}
                    onClick={() => setSelectedJob(job)}
                  >
                    <Eye size={12} /> SHOW JOB
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Commercial Payment Checkout Modal */}
      {showPaymentCheckout && pendingJobData && (
        <PaymentCheckoutModal
          isOpen={showPaymentCheckout}
          onClose={() => setShowPaymentCheckout(false)}
          itemType="job"
          itemTitle={pendingJobData.title}
          amount={currentJobCost}
          onPaymentSuccess={(details) => {
            const isLive = details.paymentStatus === 'paid' || details.paymentStatus === 'waived_promotional';
            addJob({
              ...pendingJobData,
              paymentStatus: details.paymentStatus,
              paidAmount: details.paidAmount,
              paymentMethod: details.paymentMethod,
              paymentReference: details.paymentReference,
              status: isLive ? 'active' : 'pending',
            });
            setShowPaymentCheckout(false);
            setShowCreateModal(false);
            resetJobForm();
          }}
        />
      )}
    </div>
  );
}
