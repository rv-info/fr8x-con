'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/context/DataContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { GoldenTick } from '@/components/ui/GoldenTick';
import { LocalTimeBadge } from '@/components/ui/LocalTimeBadge';
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
} from 'lucide-react';

export default function JobsPage() {
  const { jobs, addJob, deleteJob } = useData();
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'all' | 'mine'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterLocation, setFilterLocation] = useState('');

  const [selectedJob, setSelectedJob] = useState<JobPost | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

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
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q) ||
      (j.requirements || '').toLowerCase().includes(q) ||
      (j.skills || []).join(' ').toLowerCase().includes(q);

    const matchesTab = activeTab === 'all' || j.posterUid === user.uid;
    const matchesType = !filterType || j.employmentType === filterType;
    const matchesLocation = !filterLocation || j.location.toLowerCase().includes(filterLocation.toLowerCase());

    return matchesSearch && matchesTab && matchesType && matchesLocation;
  });

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newReq.trim()) {
      toast('Job title and requirements are required.');
      return;
    }
    addJob({
      title: newTitle,
      company: newCompany,
      location: newLocation,
      employmentType: newType,
      experience: newExp,
      packageDetails: newPkg,
      requirements: newReq,
      responsibilities: newResp,
      qualifications: newQual,
      skills: newSkills.split(',').map((s) => s.trim()).filter(Boolean),
      closingDate: newClosing,
      posterEmail: user.email,
      showEmailPublicly: false,
      posterTimezone: user.timezone,
    });
    setShowCreateModal(false);
    toast(`Job opportunity posted successfully! Paid ₹${currentJobCost.toLocaleString('en-IN')} for ${jobDurationDays} days.`);
    setNewTitle('');
    setNewReq('');
    setNewResp('');
    setNewQual('');
    setNewSkills('');
    setNewClosing('');
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
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header */}
            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
              <div className="cologo" style={{ width: 44, height: 44, borderRadius: 10, fontSize: 14 }}>
                {selectedJob.company.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>{selectedJob.title}</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span style={{ color: 'var(--brand)', fontSize: '12px', fontWeight: 600 }}>{selectedJob.company}</span>
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
            {selectedJob.skills && selectedJob.skills.length > 0 && (
              <div>
                <b style={{ display: 'block', fontSize: '10.5px', color: 'var(--mut)', textTransform: 'uppercase', marginBottom: '6px' }}>Required Skills</b>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px' }}>
                  {selectedJob.skills.map((s) => (
                    <span key={s} className="badge grey">{s}</span>
                  ))}
                </div>
              </div>
            )}

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

            {/* Posted by */}
            <div style={{ background: '#f8fafc', border: '1px solid var(--line)', borderRadius: 8, padding: '12px' }}>
              <b style={{ fontSize: '11px', color: 'var(--mut)', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>Posted By</b>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'space-between' }}>
                <div>
                  <b style={{ fontSize: '12.5px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {selectedJob.postedBy}
                  </b>
                  <small style={{ color: 'var(--mut)', fontSize: '11px' }}>
                    {selectedJob.company} · {selectedJob.postedDate}
                  </small>
                </div>
                {selectedJob.showEmailPublicly && selectedJob.posterEmail && (
                  <a href={`mailto:${selectedJob.posterEmail}`} className="btn secondary sm">
                    <Mail size={12} /> Apply via Email
                  </a>
                )}
              </div>
              {selectedJob.posterTimezone && (
                <div style={{ marginTop: '6px' }}>
                  <LocalTimeBadge timezone={selectedJob.posterTimezone} />
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Create Job Modal */}
      {showCreateModal && (
        <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Post a Job Opportunity">
          <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="grid g2">
              <div className="field">
                <label>Job Title <span className="req">*</span></label>
                <input className="input" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="e.g. Senior Freight Analyst" />
              </div>
              <div className="field">
                <label>Company</label>
                <input className="input" value={newCompany} onChange={(e) => setNewCompany(e.target.value)} />
              </div>
            </div>
            <div className="grid g2">
              <div className="field">
                <label>Location</label>
                <input className="input" value={newLocation} onChange={(e) => setNewLocation(e.target.value)} />
              </div>
              <div className="field">
                <label>Employment Type</label>
                <select className="input" value={newType} onChange={(e) => setNewType(e.target.value)}>
                  {jobTypes.map((t) => <option key={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div className="grid g2">
              <div className="field">
                <label>Experience</label>
                <input className="input" value={newExp} onChange={(e) => setNewExp(e.target.value)} placeholder="e.g. 3–5 yrs experience" />
              </div>
              <div className="field">
                <label>Package / Compensation</label>
                <input className="input" value={newPkg} onChange={(e) => setNewPkg(e.target.value)} placeholder="e.g. ₹10–15 LPA" />
              </div>
            </div>
            <div className="grid g2">
              <div className="field">
                <label>Closing Date</label>
                <input className="input" type="date" value={newClosing} onChange={(e) => setNewClosing(e.target.value)} />
              </div>
              <div className="field">
                <label>Skills (comma-separated)</label>
                <input className="input" value={newSkills} onChange={(e) => setNewSkills(e.target.value)} placeholder="FCL, Carrier Negotiations, INCOTERMS" />
              </div>
            </div>
            <div className="field">
              <label>Requirements <span className="req">*</span></label>
              <textarea className="input" value={newReq} onChange={(e) => setNewReq(e.target.value)} placeholder="Key skills, tools, and experience required…" rows={3} />
            </div>
            <div className="field">
              <label>Responsibilities</label>
              <textarea className="input" value={newResp} onChange={(e) => setNewResp(e.target.value)} placeholder="Day-to-day responsibilities…" rows={3} />
            </div>
            <div className="field">
              <label>Qualifications</label>
              <textarea className="input" value={newQual} onChange={(e) => setNewQual(e.target.value)} placeholder="Educational background, certifications…" rows={2} />
            </div>

            {/* Transparent Job Posting Fee & Duration Matrix */}
            <div style={{ background: '#f8fafc', border: '1px solid #c8e0fe', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <b style={{ fontSize: '12px', color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <DollarSign size={13} /> Job Listing Tariff & Duration
                </b>
                <span style={{ fontSize: '11px', color: 'var(--mut)' }}>
                  ₹300 for 2 days · ₹180/day thereafter
                </span>
              </div>

              <div className="grid g4" style={{ gap: '8px' }}>
                {[
                  { days: 2, label: '2 Days (Min)', cost: 300 },
                  { days: 7, label: '7 Days', cost: 1200 },
                  { days: 15, label: '15 Days', cost: 2640 },
                  { days: 30, label: '30 Days', cost: 5340 },
                ].map((tier) => (
                  <div
                    key={tier.days}
                    onClick={() => setJobDurationDays(tier.days)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: jobDurationDays === tier.days ? '2px solid var(--brand)' : '1px solid var(--line)',
                      background: jobDurationDays === tier.days ? '#eef6ff' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <b style={{ fontSize: '13px', color: 'var(--ink)', display: 'block' }}>₹{tier.cost.toLocaleString('en-IN')}</b>
                    <small style={{ fontSize: '10px', color: 'var(--mut)' }}>{tier.label}</small>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line-light)', paddingTop: '8px' }}>
                <label style={{ fontSize: '11.5px', color: 'var(--ink-secondary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={autoRenewJob}
                    onChange={(e) => setAutoRenewJob(e.target.checked)}
                  />
                  Auto-renew listing at ₹180/day thereafter till revoked
                </label>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10px', color: 'var(--mut)', display: 'block' }}>TOTAL PAYABLE</span>
                  <b style={{ fontSize: '16px', color: 'var(--brand)' }}>₹{currentJobCost.toLocaleString('en-IN')}</b>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" className="btn secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
              <button type="submit" className="btn primary">Pay ₹{currentJobCost.toLocaleString('en-IN')} & Post Job</button>
            </div>
          </form>
        </Modal>
      )}

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
          <div style={{ position: 'relative', minWidth: '200px', flex: 1 }}>
            <Search size={13} style={{ position: 'absolute', left: 9, top: 10, color: 'var(--mut)' }} />
            <input
              className="input"
              style={{ paddingLeft: 28 }}
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

      {/* Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', background: '#fff', borderRadius: 10, border: '1px solid var(--line)' }}>
          <Briefcase size={32} style={{ margin: '0 auto 12px', opacity: 0.25, display: 'block' }} />
          <b style={{ display: 'block', marginBottom: '6px' }}>No jobs found</b>
          <small style={{ color: 'var(--mut)' }}>
            {searchQuery ? `No results for "${searchQuery}"` : 'No jobs match the selected filters.'}
          </small>
          <br />
          <button className="btn primary sm" style={{ marginTop: '12px' }} onClick={() => setShowCreateModal(true)}>
            Post the First Job
          </button>
        </div>
      ) : (
        <div className="jobs-grid">
          {filteredJobs.map((job) => (
            <div key={job.id} className="job-card">
              <div className="job-card-head">
                <div className="cologo" style={{ width: 38, height: 38, borderRadius: 9, fontSize: 12, flexShrink: 0 }}>
                  {job.company.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b className="job-card-title">{job.title}</b>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: 'var(--brand)', fontWeight: 600 }}>{job.company}</span>
                    {job.posterUid === user.uid && (
                      <span className="badge blue" style={{ fontSize: '8.5px' }}>My Post</span>
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

              {job.skills && job.skills.length > 0 && (
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {job.skills.slice(0, 4).map((s) => (
                    <span key={s} className="badge grey" style={{ fontSize: '9px' }}>{s}</span>
                  ))}
                  {job.skills.length > 4 && (
                    <span className="badge grey" style={{ fontSize: '9px' }}>+{job.skills.length - 4}</span>
                  )}
                </div>
              )}

              <div className="job-card-footer">
                <small style={{ color: 'var(--faint)', fontSize: '10px' }}>
                  <Clock size={10} /> Posted {job.postedDate}
                </small>
                <button
                  className="btn secondary sm"
                  onClick={() => setSelectedJob(job)}
                >
                  View Details <ChevronRight size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
