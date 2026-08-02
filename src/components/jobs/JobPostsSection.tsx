"use client";

import { useState, useEffect } from "react";
import { Briefcase, MapPin, Plus, Building } from "lucide-react";
import { queryDocuments, limit, orderBy } from "@/lib/firebase/firestore";
import PostJobDialog from "./PostJobDialog";
import JobDetailsDialog from "./JobDetailsDialog";
import type { JobPosting } from "@/lib/types/job";

const SAMPLE_JOBS: Partial<JobPosting>[] = [
  {
    id: "job-1",
    jobTitle: "Senior Freight Pricing Manager",
    companyName: "Apex Logistics India",
    city: "Mumbai",
    country: "India",
    employmentType: "Full-Time",
    experienceRequired: "5-8 Years",
    salaryMin: 1200000,
    salaryMax: 1800000,
    jobSummary: "Looking for experienced Ocean Freight Pricing Manager for Asia-Europe trade lanes.",
  },
  {
    id: "job-2",
    jobTitle: "NVOCC Documentation Executive",
    companyName: "TransGlobe Ocean Lines",
    city: "Chennai",
    country: "India",
    employmentType: "Full-Time",
    experienceRequired: "2-4 Years",
    salaryMin: 450000,
    salaryMax: 700000,
    jobSummary: "Bill of Lading and manifest filing specialist required for immediate hiring.",
  },
];

export function JobPostsSection() {
  const [jobs, setJobs] = useState<Partial<JobPosting>[]>(SAMPLE_JOBS);
  const [isPostOpen, setIsPostOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);

  useEffect(() => {
    queryDocuments<JobPosting>("jobs", [orderBy("createdAt", "desc"), limit(5)])
      .then((data) => {
        if (data && data.length > 0) {
          setJobs(data);
        }
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="fr8x-card p-2.5 bg-white text-left space-y-2">
      <div className="flex items-center justify-between border-b border-border pb-1.5">
        <p className="text-[11px] font-semibold text-[var(--fr8x-jet)] flex items-center gap-1">
          <Briefcase className="h-3.5 w-3.5 text-[var(--fr8x-periwinkle)]" />
          <span>Industry Jobs</span>
        </p>
        <button
          onClick={() => setIsPostOpen(true)}
          className="text-[9px] bg-[var(--fr8x-periwinkle)] text-white px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5 hover:opacity-90"
        >
          <Plus className="h-2.5 w-2.5" /> Post Job
        </button>
      </div>

      <div className="space-y-2">
        {jobs.map((j) => (
          <div
            key={j.id}
            onClick={() => setSelectedJob(j as JobPosting)}
            className="p-1.5 rounded-md border border-slate-100 hover:border-slate-300 hover:bg-slate-50 cursor-pointer transition-colors"
          >
            <p className="text-[10px] font-bold text-[var(--fr8x-jet)] line-clamp-1">{j.jobTitle}</p>
            <p className="text-[9px] text-foreground-secondary flex items-center gap-1 mt-0.5 truncate">
              <Building className="h-2.5 w-2.5 shrink-0 text-slate-400" />
              <span className="truncate">{j.companyName}</span>
            </p>
            <p className="text-[9px] text-foreground-muted flex items-center gap-1 mt-0.5">
              <MapPin className="h-2.5 w-2.5 shrink-0 text-slate-400" />
              <span>{j.city || j.country ? `${j.city || ""}, ${j.country || ""}` : "Remote"}</span>
            </p>
          </div>
        ))}
      </div>

      <PostJobDialog
        isOpen={isPostOpen}
        onClose={() => setIsPostOpen(false)}
        onSubmit={(newJob) => {
          setJobs((prev) => [{ id: `job-${Date.now()}`, ...newJob }, ...prev]);
          setIsPostOpen(false);
        }}
      />

      {selectedJob && (
        <JobDetailsDialog
          isOpen={!!selectedJob}
          onClose={() => setSelectedJob(null)}
          job={selectedJob}
        />
      )}
    </div>
  );
}
