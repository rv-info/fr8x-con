'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Search,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Shield,
  MapPin,
  DollarSign,
  Plus,
  X,
  Building,
  Mail,
  Calendar,
  Clock,
  Trash2,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';
import { useData } from '@/lib/context/DataContext';

interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  packageDetails: string;
  status: 'active' | 'pending' | 'suspended' | 'closed';
  postedBy: string;
  posterEmail: string;
  posterKyc: boolean;
  postedDate: string;
  employmentType: 'Full-time' | 'Contract' | 'Remote';
  experience: string;
  department: string;
  description: string;
  requirements: string[];
  skills: string[];
  contactEmail: string;
}

const INITIAL_JOBS: JobListing[] = [];

export default function JobsModerationPage() {
  const { jobs: dataJobs, verifyJobPayment } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'pending' | 'suspended'>('all');
  const [jobs, setJobs] = useState<JobListing[]>(INITIAL_JOBS);

  // Sync live user jobs from DataContext
  useEffect(() => {
    const liveMapped: JobListing[] = dataJobs.map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      location: j.location,
      packageDetails: j.packageDetails || 'Standard Package',
      status: j.status === 'active' ? 'active' : j.status === 'pending' ? 'pending' : 'suspended',
      postedBy: j.postedBy || j.posterName || 'Platform User',
      posterEmail: j.posterEmail || 'user@fr8x.in',
      posterKyc: true,
      postedDate: j.postedDate || new Date().toISOString().slice(0, 10),
      employmentType: (j.employmentType as any) || 'Full-time',
      experience: j.experience || '3–5 yrs',
      department: 'Logistics Procurement',
      description: j.requirements || 'Trade opportunity',
      requirements: [j.requirements || 'Relevant experience'],
      skills: j.skills || [],
      contactEmail: j.posterEmail || 'jobs@fr8x.in',
    }));
    const liveIds = new Set(liveMapped.map((l) => l.id));
    setJobs([...liveMapped, ...INITIAL_JOBS.filter((ij) => !liveIds.has(ij.id))]);
  }, [dataJobs]);

  // Inspection modal state
  const [selectedJob, setSelectedJob] = useState<JobListing | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Create Job modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newJobForm, setNewJobForm] = useState<Partial<JobListing>>({
    title: '',
    company: '',
    location: '',
    packageDetails: '',
    employmentType: 'Full-time',
    experience: '',
    department: '',
    description: '',
    contactEmail: '',
    skills: [],
    requirements: [],
  });

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    actionType: string;
    targetLabel: string;
    targetId: string;
    isDestructive?: boolean;
    onConfirm: (reason: string) => void;
  } | null>(null);

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && job.status === activeTab;
  });

  const handleOpenJobDetail = (job: JobListing) => {
    setSelectedJob(job);
    setIsDetailModalOpen(true);
  };

  const handleApproveJob = (job: JobListing) => {
    setModalConfig({
      isOpen: true,
      title: 'Approve & Publish Freight Job Listing',
      actionType: 'JOB_LISTING_APPROVED',
      targetLabel: `${job.id} · ${job.title}`,
      targetId: job.id,
      isDestructive: false,
      onConfirm: () => {
        verifyJobPayment(job.id, 'Godfather Operations');
        setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: 'active' } : j)));
        if (selectedJob?.id === job.id) setSelectedJob({ ...selectedJob, status: 'active' });
        setModalConfig(null);
      },
    });
  };

  const handleSuspendJob = (job: JobListing) => {
    setModalConfig({
      isOpen: true,
      title: 'Suspend / Flag Job Listing from Public Board',
      actionType: 'JOB_LISTING_SUSPENDED',
      targetLabel: `${job.id} · ${job.title}`,
      targetId: job.id,
      isDestructive: true,
      onConfirm: () => {
        setJobs((prev) => prev.map((j) => (j.id === job.id ? { ...j, status: 'suspended' } : j)));
        if (selectedJob?.id === job.id) setSelectedJob({ ...selectedJob, status: 'suspended' });
        setModalConfig(null);
      },
    });
  };

  const handleDeleteJob = (job: JobListing) => {
    setModalConfig({
      isOpen: true,
      title: 'Permanently Delete Freight Job Listing',
      actionType: 'JOB_LISTING_DELETED',
      targetLabel: `${job.id} · ${job.title}`,
      targetId: job.id,
      isDestructive: true,
      onConfirm: () => {
        setJobs((prev) => prev.filter((j) => j.id !== job.id));
        setIsDetailModalOpen(false);
        setModalConfig(null);
      },
    });
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: JobListing = {
      id: `JOB-2026-${Math.floor(100 + Math.random() * 900)}`,
      title: newJobForm.title || 'Logistics Executive',
      company: newJobForm.company || 'Verified Carrier Partner',
      location: newJobForm.location || 'Pan-India',
      packageDetails: newJobForm.packageDetails || 'Competitive Market Rate',
      status: 'active',
      postedBy: 'Godfather Operations Team',
      posterEmail: 'ops.lead@con.fr8x.in',
      posterKyc: true,
      postedDate: new Date().toISOString().split('T')[0],
      employmentType: newJobForm.employmentType || 'Full-time',
      experience: newJobForm.experience || '3+ Years',
      department: newJobForm.department || 'Operations',
      description: newJobForm.description || 'Verified freight job posting approved by platform administrators.',
      requirements: ['Valid industry experience', 'Freight documentation proficiency'],
      skills: ['Ocean Freight', 'Logistics Operations'],
      contactEmail: newJobForm.contactEmail || 'careers@fr8x.in',
    };

    setJobs([newEntry, ...jobs]);
    setIsCreateModalOpen(false);
    setNewJobForm({
      title: '',
      company: '',
      location: '',
      packageDetails: '',
      employmentType: 'Full-time',
      experience: '',
      department: '',
      description: '',
      contactEmail: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue text-[11px] font-bold">OPERATIONS</span>
            <span className="gf-badge gf-badge-green text-[11px] font-bold">
              {jobs.filter((j) => j.status === 'active').length} Active Jobs
            </span>
            <span className="gf-badge gf-badge-amber text-[11px] font-bold">
              {jobs.filter((j) => j.status === 'pending').length} Pending Review
            </span>
          </div>
          <h1 className="gf-page-title">Verified Freight Jobs & Advertisements Moderation</h1>
          <p className="gf-page-subtitle">
            Inspect detailed freight job postings, verify salary transparency, review poster KYC credentials, and approve or moderate listings.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="gf-btn gf-btn-primary text-xs font-bold flex items-center gap-1.5"
        >
          <Plus className="lucide w-4 h-4" />
          <span>Post Official Job Listing</span>
        </button>
      </div>

      {/* Main Container */}
      <div className="gf-card">
        {/* Filter Bar & Tabs */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('all')}
              className={`py-1 px-3 rounded text-xs font-bold transition-all ${
                activeTab === 'all' ? 'bg-white text-sky-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Listings ({jobs.length})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`py-1 px-3 rounded text-xs font-bold transition-all ${
                activeTab === 'active' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Active ({jobs.filter((j) => j.status === 'active').length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-1 px-3 rounded text-xs font-bold transition-all ${
                activeTab === 'pending' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending Moderation ({jobs.filter((j) => j.status === 'pending').length})
            </button>
            <button
              onClick={() => setActiveTab('suspended')}
              className={`py-1 px-3 rounded text-xs font-bold transition-all ${
                activeTab === 'suspended' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Suspended ({jobs.filter((j) => j.status === 'suspended').length})
            </button>
          </div>

          <div className="gf-search-input-wrap max-w-xs">
            <Search className="lucide w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title, company, location..."
              className="gf-search-input font-medium"
            />
          </div>
        </div>

        {/* Jobs Table */}
        <div className="overflow-x-auto">
          <table className="gf-table text-xs">
            <thead>
              <tr>
                <th>Job ID & Title</th>
                <th>Company & Poster</th>
                <th>Location & Type</th>
                <th>Compensation Package</th>
                <th>KYC Verification</th>
                <th>Status</th>
                <th className="text-right">Inspection & Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500 font-medium text-xs">
                    No job postings found. Newly published maritime and logistics opportunities will appear here for operational approval.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50">
                  <td>
                    <div
                      className="font-bold text-slate-900 cursor-pointer hover:text-sky-700"
                      onClick={() => handleOpenJobDetail(job)}
                    >
                      {job.title}
                    </div>
                    <div className="text-[10.5px] text-slate-500 font-mono">
                      {job.id} · Exp: {job.experience} · {job.department}
                    </div>
                  </td>
                  <td>
                    <div className="font-semibold text-slate-800">{job.company}</div>
                    <div className="text-[10.5px] text-slate-500 font-mono">Poster: {job.postedBy}</div>
                  </td>
                  <td>
                    <div className="text-slate-700 font-medium">{job.location}</div>
                    <div className="text-[10.5px] text-slate-500">{job.employmentType}</div>
                  </td>
                  <td className="font-mono text-emerald-800 font-bold">{job.packageDetails}</td>
                  <td>
                    {job.posterKyc ? (
                      <span className="gf-badge gf-badge-green text-[10px] font-bold flex items-center gap-1 w-fit">
                        <CheckCircle2 className="lucide w-3 h-3" /> KYC Verified
                      </span>
                    ) : (
                      <span className="gf-badge gf-badge-amber text-[10px] font-bold flex items-center gap-1 w-fit">
                        <AlertTriangle className="lucide w-3 h-3" /> Pending KYC
                      </span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`gf-badge ${
                        job.status === 'active'
                          ? 'gf-badge-green'
                          : job.status === 'pending'
                          ? 'gf-badge-amber'
                          : 'gf-badge-red'
                      } text-[10px] uppercase font-bold`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenJobDetail(job)}
                        className="gf-btn gf-btn-secondary text-[11px] py-1 px-2.5 font-bold flex items-center gap-1"
                        title="View detailed job post popup"
                      >
                        <Eye className="lucide w-3.5 h-3.5 text-sky-600" />
                        <span>View Details</span>
                      </button>

                      {job.status !== 'active' ? (
                        <button
                          type="button"
                          onClick={() => handleApproveJob(job)}
                          className="gf-btn gf-btn-primary text-[11px] py-1 px-2 font-bold"
                          title="Approve & Publish"
                        >
                          Approve
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSuspendJob(job)}
                          className="gf-btn gf-btn-danger text-[11px] py-1 px-2 font-bold"
                          title="Suspend Job"
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAILED JOB INSPECTION MODAL */}
      {isDetailModalOpen && selectedJob && (
        <div className="gf-modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
          <div className="gf-modal-card max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="gf-modal-header">
              <div className="flex items-center gap-2">
                <Briefcase className="lucide w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="gf-modal-title">{selectedJob.title}</h3>
                  <p className="gf-modal-subtitle font-mono">
                    {selectedJob.id} · {selectedJob.company} · Posted on {selectedJob.postedDate}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="gf-modal-close-btn">
                <X className="lucide w-4 h-4" />
              </button>
            </div>

            <div className="gf-modal-body space-y-4 max-h-[72vh] overflow-y-auto">
              {/* Header Badges Strip */}
              <div className="flex flex-wrap items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span
                  className={`gf-badge ${
                    selectedJob.status === 'active'
                      ? 'gf-badge-green'
                      : selectedJob.status === 'pending'
                      ? 'gf-badge-amber'
                      : 'gf-badge-red'
                  } text-xs font-bold uppercase`}
                >
                  Status: {selectedJob.status}
                </span>
                <span className="gf-badge gf-badge-blue text-xs font-bold">
                  {selectedJob.employmentType}
                </span>
                <span className="gf-badge gf-badge-gray text-xs font-semibold">
                  Exp: {selectedJob.experience}
                </span>
                <span className="gf-badge gf-badge-gray text-xs font-semibold">
                  Dept: {selectedJob.department}
                </span>
              </div>

              {/* Compensation & Location Card */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="text-[11px] font-bold text-emerald-900 uppercase tracking-wider mb-1">
                    Offered Compensation
                  </div>
                  <div className="text-sm font-black font-mono text-emerald-800">
                    {selectedJob.packageDetails}
                  </div>
                  <div className="text-[10.5px] text-emerald-700 mt-0.5">Transparent verified package</div>
                </div>

                <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg">
                  <div className="text-[11px] font-bold text-sky-900 uppercase tracking-wider mb-1">
                    Work Location
                  </div>
                  <div className="text-xs font-bold text-sky-900 flex items-center gap-1">
                    <MapPin className="lucide w-3.5 h-3.5 text-sky-600" />
                    <span>{selectedJob.location}</span>
                  </div>
                  <div className="text-[10.5px] text-sky-700 mt-0.5">Contact: {selectedJob.contactEmail}</div>
                </div>
              </div>

              {/* Poster Verification Info */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    Posted By: <span className="text-sky-800 font-semibold">{selectedJob.postedBy}</span> ({selectedJob.posterEmail})
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Company: {selectedJob.company}
                  </div>
                </div>
                {selectedJob.posterKyc ? (
                  <span className="gf-badge gf-badge-green text-xs font-bold flex items-center gap-1">
                    <CheckCircle2 className="lucide w-3.5 h-3.5" /> KYC Verified Company
                  </span>
                ) : (
                  <span className="gf-badge gf-badge-amber text-xs font-bold flex items-center gap-1">
                    <AlertTriangle className="lucide w-3.5 h-3.5" /> Unverified Poster KYC
                  </span>
                )}
              </div>

              {/* Job Description */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">Job Description & Responsibilities</label>
                <div className="p-3 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-700 font-medium">
                  {selectedJob.description}
                </div>
              </div>

              {/* Key Requirements */}
              {selectedJob.requirements && selectedJob.requirements.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Candidate Requirements</label>
                  <ul className="space-y-1.5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                    {selectedJob.requirements.map((req, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-sky-600 font-bold">•</span>
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Skills Tags */}
              {selectedJob.skills && selectedJob.skills.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">Required Skills & Capabilities</label>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedJob.skills.map((skill, idx) => (
                      <span key={idx} className="gf-badge gf-badge-blue text-xs font-mono">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="gf-modal-footer flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleDeleteJob(selectedJob)}
                className="gf-btn gf-btn-secondary text-xs text-rose-700 hover:bg-rose-50 font-bold flex items-center gap-1"
              >
                <Trash2 className="lucide w-3.5 h-3.5" />
                <span>Delete Post</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDetailModalOpen(false)}
                  className="gf-btn gf-btn-secondary text-xs"
                >
                  Close
                </button>

                {selectedJob.status === 'active' ? (
                  <button
                    type="button"
                    onClick={() => handleSuspendJob(selectedJob)}
                    className="gf-btn gf-btn-danger text-xs font-bold"
                  >
                    Suspend Listing
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleApproveJob(selectedJob)}
                    className="gf-btn gf-btn-primary text-xs font-bold"
                  >
                    Approve &amp; Activate Listing
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE NEW JOB MODAL */}
      {isCreateModalOpen && (
        <div className="gf-modal-overlay" onClick={() => setIsCreateModalOpen(false)}>
          <div className="gf-modal-card max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="gf-modal-header">
              <div className="flex items-center gap-2">
                <Plus className="lucide w-5 h-5 text-sky-600" />
                <h3 className="gf-modal-title">Post New Official Freight Job</h3>
              </div>
              <button onClick={() => setIsCreateModalOpen(false)} className="gf-modal-close-btn">
                <X className="lucide w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateJob}>
              <div className="gf-modal-body space-y-3.5 max-h-[72vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="gf-form-label">Job Title *</label>
                    <input
                      type="text"
                      required
                      value={newJobForm.title}
                      onChange={(e) => setNewJobForm({ ...newJobForm, title: e.target.value })}
                      placeholder="e.g. Line Operations Manager"
                      className="gf-input"
                    />
                  </div>
                  <div>
                    <label className="gf-form-label">Company Name *</label>
                    <input
                      type="text"
                      required
                      value={newJobForm.company}
                      onChange={(e) => setNewJobForm({ ...newJobForm, company: e.target.value })}
                      placeholder="e.g. Pacific Logistics Pvt Ltd"
                      className="gf-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="gf-form-label">Location *</label>
                    <input
                      type="text"
                      required
                      value={newJobForm.location}
                      onChange={(e) => setNewJobForm({ ...newJobForm, location: e.target.value })}
                      placeholder="Mumbai / Remote"
                      className="gf-input"
                    />
                  </div>
                  <div>
                    <label className="gf-form-label">Compensation Package *</label>
                    <input
                      type="text"
                      required
                      value={newJobForm.packageDetails}
                      onChange={(e) => setNewJobForm({ ...newJobForm, packageDetails: e.target.value })}
                      placeholder="₹12 - 16 LPA"
                      className="gf-input font-mono"
                    />
                  </div>
                  <div>
                    <label className="gf-form-label">Employment Type *</label>
                    <select
                      value={newJobForm.employmentType}
                      onChange={(e) =>
                        setNewJobForm({
                          ...newJobForm,
                          employmentType: e.target.value as 'Full-time' | 'Contract' | 'Remote',
                        })
                      }
                      className="gf-select"
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Remote">Remote</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="gf-form-label">Experience Required</label>
                    <input
                      type="text"
                      value={newJobForm.experience}
                      onChange={(e) => setNewJobForm({ ...newJobForm, experience: e.target.value })}
                      placeholder="5 - 8 Years"
                      className="gf-input"
                    />
                  </div>
                  <div>
                    <label className="gf-form-label">Application Contact Email *</label>
                    <input
                      type="email"
                      required
                      value={newJobForm.contactEmail}
                      onChange={(e) => setNewJobForm({ ...newJobForm, contactEmail: e.target.value })}
                      placeholder="careers@company.com"
                      className="gf-input font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="gf-form-label">Job Description & Responsibilities *</label>
                  <textarea
                    rows={4}
                    required
                    value={newJobForm.description}
                    onChange={(e) => setNewJobForm({ ...newJobForm, description: e.target.value })}
                    placeholder="Provide full details of freight operations, carrier coordination, and requirements..."
                    className="gf-textarea"
                  />
                </div>
              </div>

              <div className="gf-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="gf-btn gf-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="gf-btn gf-btn-primary">
                  Publish Verified Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Action Modal */}
      {modalConfig && (
        <ActionConfirmModal
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          actionType={modalConfig.actionType}
          targetLabel={modalConfig.targetLabel}
          targetId={modalConfig.targetId}
          isDestructive={modalConfig.isDestructive}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}
