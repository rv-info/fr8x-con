// FR8X-CON Published Job Details Popup — Spec Page 7

"use client";

import { X, Mail, Globe } from "lucide-react";
import type { JobPosting } from "@/lib/types/job";

interface JobDetailsDialogProps {
  job: Partial<JobPosting> | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function JobDetailsDialog({ job, isOpen, onClose }: JobDetailsDialogProps) {
  if (!isOpen || !job) return null;

  const handleSendEmail = () => {
    const email = job.email || job.officialEmail || "contact@company.com";
    window.location.href = `mailto:${email}?subject=Application for ${encodeURIComponent(job.jobTitle || "Job Position")}`;
  };

  const fields = [
    { label: "Job ID", value: job.id || "JOB-2026-001" },
    { label: "Job Title", value: job.jobTitle || "Logistics Manager" },
    { label: "Company", value: job.companyName || "Apex Logistics" },
    { label: "Industry", value: job.industry || "Logistics / Freight" },
    { label: "Employment Type", value: job.employmentType || "Full-Time" },
    { label: "Experience", value: job.experienceRequired || "3-5 Yrs" },
    { label: "Education", value: job.education || "Graduate" },
    {
      label: "Salary",
      value: job.showSalary && job.salaryMin && job.salaryMax
        ? `₹${job.salaryMin} - ₹${job.salaryMax} LPA (${job.salaryType || "Annual"})`
        : "Undisclosed",
    },
    { label: "Location", value: `${job.city || "Mumbai"}, ${job.state || "Maharashtra"}, ${job.country || "India"}` },
    { label: "Work Mode", value: job.workMode || "On-site" },
    { label: "Posted On", value: job.createdAt ? new Date().toLocaleDateString() : "21/07/2026" },
    { label: "Valid Till", value: "23/07/2026 (2 Days)" },
    { label: "Job Description", value: job.jobSummary || job.keyResponsibilities || "N/A" },
    { label: "Required Skills", value: job.requiredSkills || "N/A" },
    { label: "Contact Email", value: job.email || job.officialEmail || "N/A" },
    { label: "Company Website", value: job.companyWebsite || job.websiteUrl || "N/A" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-background-card w-full max-w-2xl rounded-xl shadow-elevated border border-border flex flex-col max-h-[85vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-heading-lg font-bold text-[var(--fr8x-jet)]">Published Job Details</h2>
            <p className="text-caption text-foreground-secondary">{job.jobTitle} at {job.companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-foreground-secondary hover:text-[var(--fr8x-jet)] hover:bg-[var(--fr8x-mist)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Details Table */}
        <div className="p-6 overflow-y-auto">
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="fr8x-table">
              <thead>
                <tr>
                  <th className="w-1/3 border-r border-border">Field</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {fields.map((f) => (
                  <tr key={f.label} className="hover:bg-[var(--fr8x-mist)] transition-colors">
                    <td className="font-medium text-[var(--fr8x-jet)] border-r border-border bg-[var(--fr8x-bg)]">
                      {f.label}
                    </td>
                    <td className="text-foreground">
                      {f.label === "Company Website" && f.value !== "N/A" ? (
                        <a href={f.value} target="_blank" rel="noreferrer" className="text-[var(--fr8x-periwinkle)] underline hover:text-brand-700 flex items-center gap-1">
                          <Globe className="h-3.5 w-3.5" />
                          {f.value}
                        </a>
                      ) : f.label === "Contact Email" && f.value !== "N/A" ? (
                        <a href={`mailto:${f.value}`} className="text-[var(--fr8x-periwinkle)] underline hover:text-brand-700 flex items-center gap-1">
                          <Mail className="h-3.5 w-3.5" />
                          {f.value}
                        </a>
                      ) : (
                        f.value
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Action */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-[var(--fr8x-bg)] rounded-b-xl">
          <p className="text-caption text-foreground-secondary">
            Apply direct via recruiter contact email
          </p>
          <button
            onClick={handleSendEmail}
            className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0] px-6 flex items-center gap-2"
          >
            <Mail className="h-4 w-4" />
            Send Email
          </button>
        </div>
      </div>
    </div>
  );
}
