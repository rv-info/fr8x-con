'use client';

import React, { useState } from 'react';
import { Briefcase, Search, CheckCircle2, AlertTriangle, Eye, Shield, MapPin, DollarSign } from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export default function JobsModerationPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [jobs, setJobs] = useState([
    {
      id: 'JOB-2026-081',
      title: 'Senior Ocean Freight Forwarding Specialist',
      company: 'Atlas Logistics Pvt. Ltd.',
      location: 'Mumbai, India',
      packageDetails: '₹12 - 16 LPA + Performance Bonus',
      status: 'active',
      postedBy: 'Arjun Rao',
      postedDate: '2026-08-28',
      employmentType: 'Full-time',
      experience: '5 - 8 Years',
    },
    {
      id: 'JOB-2026-079',
      title: 'Trade Lane Manager (Asia-Europe Corridor)',
      company: 'Northstar Freight Group',
      location: 'Dubai, UAE',
      packageDetails: 'AED 24,000 - 30,000 / month',
      status: 'active',
      postedBy: 'Kiran Mehta',
      postedDate: '2026-08-25',
      employmentType: 'Full-time',
      experience: '8+ Years',
    },
  ]);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    actionType: string;
    targetLabel: string;
    targetId: string;
    isDestructive?: boolean;
    onConfirm: (reason: string) => void;
  } | null>(null);

  const handleToggleJob = (job: any) => {
    const isClosing = job.status === 'active';
    setModalConfig({
      isOpen: true,
      title: isClosing ? 'Moderate / Close Freight Job Listing' : 'Reactivate Freight Job Listing',
      actionType: isClosing ? 'JOB_LISTING_CLOSED_MODERATION' : 'JOB_LISTING_REACTIVATED',
      targetLabel: `${job.id} · ${job.title}`,
      targetId: job.id,
      isDestructive: isClosing,
      onConfirm: (reason) => {
        setJobs((prev) =>
          prev.map((j) => (j.id === job.id ? { ...j, status: isClosing ? 'closed' : 'active' } : j))
        );
        setModalConfig(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue text-[11px] font-bold">OPERATIONS</span>
            <span className="gf-badge gf-badge-green text-[11px]">{jobs.filter((j) => j.status === 'active').length} Verified Jobs</span>
          </div>
          <h1 className="gf-page-title">Verified Freight Jobs & Advertisements</h1>
          <p className="gf-page-subtitle">
            Inspect verified logistics job postings, salary transparency indicators, and moderate advertisements
          </p>
        </div>
      </div>

      <div className="gf-card">
        <div className="gf-filter-bar">
          <div className="gf-search-input-wrap">
            <Search className="lucide w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search jobs by title, company, location..."
              className="gf-search-input"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="gf-table text-xs">
            <thead>
              <tr>
                <th>Job ID & Title</th>
                <th>Company & Poster</th>
                <th>Location & Type</th>
                <th>Compensation Package</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <div className="font-bold text-slate-100">{job.title}</div>
                    <div className="text-[10px] text-mut font-mono">{job.id} · Exp: {job.experience}</div>
                  </td>
                  <td>
                    <div className="font-semibold text-slate-200">{job.company}</div>
                    <div className="text-[10px] text-faint">Posted by: {job.postedBy}</div>
                  </td>
                  <td>
                    <div className="text-slate-300">{job.location}</div>
                    <div className="text-[10px] text-mut">{job.employmentType}</div>
                  </td>
                  <td className="font-mono text-emerald-400 font-bold">{job.packageDetails}</td>
                  <td>
                    <span className={`gf-badge gf-badge-${job.status === 'active' ? 'green' : 'gray'} text-[10px] uppercase font-bold`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => handleToggleJob(job)}
                      className={`gf-btn text-[11px] py-1 px-2 ${job.status === 'active' ? 'gf-btn-danger' : 'gf-btn-success'}`}
                    >
                      {job.status === 'active' ? 'Close Job' : 'Reactivate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

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
