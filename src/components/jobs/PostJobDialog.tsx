// FR8X-CON Post Jobs Popup — Spec Page 6
// Two-Column Form Layout + Footer Action

"use client";

import { useState } from "react";
import { X } from "lucide-react";
import {
  JOB_INDUSTRIES,
  JOB_EMPLOYMENT_TYPES,
  JOB_EXPERIENCE_LEVELS,
  JOB_CARGO_TYPES,
  JOB_CATEGORIES,
  JOB_APPLY_VIA,
  JOB_WORK_MODES,
  JOB_SALARY_TYPES,
  JOB_PREFERRED_SOFTWARE,
  JOB_LANGUAGES,
  JOB_SUBMISSION_FEE_INR,
  JOB_VALIDITY_DAYS,
  JOB_RENEWAL_FEE_INR,
} from "@/lib/utils/constants";
import type { JobPosting } from "@/lib/types/job";

interface PostJobDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (job: Partial<JobPosting>) => void;
}

export default function PostJobDialog({ isOpen, onClose, onSubmit }: PostJobDialogProps) {
  const [jobTitle, setJobTitle] = useState("");
  const [industry, setIndustry] = useState<string>(JOB_INDUSTRIES[0]);
  const [employmentType, setEmploymentType] = useState<string>(JOB_EMPLOYMENT_TYPES[0]);
  const [experienceRequired, setExperienceRequired] = useState<string>(JOB_EXPERIENCE_LEVELS[1]);
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");

  const [country, setCountry] = useState("India");
  const [city, setCity] = useState("");

  const [jobSummary, setJobSummary] = useState("");
  const [requiredSkills, setRequiredSkills] = useState("");
  const [cargoType, setCargoType] = useState<string>(JOB_CARGO_TYPES[0]);

  const [applyVia, setApplyVia] = useState<string>(JOB_APPLY_VIA[0]);
  const [email, setEmail] = useState("");

  const [recruiterName, setRecruiterName] = useState("");
  const [officialEmail, setOfficialEmail] = useState("");

  const [featuredJob, setFeaturedJob] = useState(false);
  const [showSalary, setShowSalary] = useState(true);
  const [declarationConfirmed, setDeclarationConfirmed] = useState(false);

  // Right column
  const [companyName, setCompanyName] = useState("");
  const [jobCategory, setJobCategory] = useState<string>(JOB_CATEGORIES[0]);
  const [vacancies, setVacancies] = useState("1");
  const [education, setEducation] = useState("");
  const [salaryType, setSalaryType] = useState<string>(JOB_SALARY_TYPES[0]);
  const [state, setState] = useState("");
  const [workMode, setWorkMode] = useState<string>(JOB_WORK_MODES[0]);
  const [keyResponsibilities, setKeyResponsibilities] = useState("");
  const [preferredSoftware, setPreferredSoftware] = useState<string>(JOB_PREFERRED_SOFTWARE[0]);
  const [languages, setLanguages] = useState<string>(JOB_LANGUAGES[0]);
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [urgentHiring, setUrgentHiring] = useState(false);
  const [status, setStatus] = useState<"Draft" | "Published" | "Expired">("Published");

  if (!isOpen) return null;

  const handleSubmit = (action: "draft" | "preview" | "publish") => {
    if (action === "publish" && !declarationConfirmed) {
      alert("Please confirm the declaration checkbox.");
      return;
    }

    const payload: Partial<JobPosting> = {
      jobTitle,
      industry,
      employmentType,
      experienceRequired,
      salaryMin: parseFloat(salaryMin) || 0,
      salaryMax: parseFloat(salaryMax) || 0,
      country,
      city,
      jobSummary,
      requiredSkills,
      cargoType,
      applyVia,
      email,
      recruiterName,
      officialEmail,
      submissionFee: JOB_SUBMISSION_FEE_INR,
      featuredJob,
      showSalary,
      declarationConfirmed,
      companyName,
      jobCategory,
      vacancies: parseInt(vacancies) || 1,
      education,
      salaryType,
      state,
      workMode,
      keyResponsibilities,
      preferredSoftware,
      languages,
      applicationDeadline,
      websiteUrl,
      mobileNumber,
      companyWebsite,
      validityDays: JOB_VALIDITY_DAYS,
      renewalFee: JOB_RENEWAL_FEE_INR,
      urgentHiring,
      status: action === "draft" ? "Draft" : status,
    };

    if (onSubmit) onSubmit(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-background-card w-full max-w-5xl rounded-xl shadow-elevated border border-border flex flex-col max-h-[90vh] my-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-heading-lg font-bold text-[var(--fr8x-jet)]">Post Jobs (Popup)</h2>
            <p className="text-caption text-foreground-secondary">Create and publish job listing</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-foreground-secondary hover:text-[var(--fr8x-jet)] hover:bg-[var(--fr8x-mist)] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Two-Column Form Layout */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ═══ LEFT COLUMN ═══ */}
          <div className="space-y-6">
            {/* Job Info */}
            <div className="space-y-3">
              <h3 className="text-heading-sm font-semibold text-[var(--fr8x-jet)] border-b border-border pb-1">Job Info</h3>
              <div>
                <label className="fr8x-label block mb-1">Job Title *</label>
                <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className="fr8x-input" placeholder="e.g. Senior Logistics Manager" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="fr8x-label block mb-1">Industry</label>
                  <select value={industry} onChange={(e) => setIndustry(e.target.value)} className="fr8x-input">
                    {JOB_INDUSTRIES.map((ind) => (<option key={ind} value={ind}>{ind}</option>))}
                  </select>
                </div>
                <div>
                  <label className="fr8x-label block mb-1">Employment Type</label>
                  <select value={employmentType} onChange={(e) => setEmploymentType(e.target.value)} className="fr8x-input">
                    {JOB_EMPLOYMENT_TYPES.map((emp) => (<option key={emp} value={emp}>{emp}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="fr8x-label block mb-1">Experience Required</label>
                  <select value={experienceRequired} onChange={(e) => setExperienceRequired(e.target.value)} className="fr8x-input">
                    {JOB_EXPERIENCE_LEVELS.map((exp) => (<option key={exp} value={exp}>{exp}</option>))}
                  </select>
                </div>
                <div>
                  <label className="fr8x-label block mb-1">Salary Range (LPA)</label>
                  <div className="flex items-center gap-1">
                    <input type="number" value={salaryMin} onChange={(e) => setSalaryMin(e.target.value)} className="fr8x-input" placeholder="Min" />
                    <span className="text-caption text-foreground-muted">to</span>
                    <input type="number" value={salaryMax} onChange={(e) => setSalaryMax(e.target.value)} className="fr8x-input" placeholder="Max" />
                  </div>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <h3 className="text-heading-sm font-semibold text-[var(--fr8x-jet)] border-b border-border pb-1">Location</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="fr8x-label block mb-1">Country</label>
                  <input type="text" value={country} onChange={(e) => setCountry(e.target.value)} className="fr8x-input" />
                </div>
                <div>
                  <label className="fr8x-label block mb-1">City</label>
                  <input type="text" value={city} onChange={(e) => setCity(e.target.value)} className="fr8x-input" placeholder="e.g. Mumbai" />
                </div>
              </div>
            </div>

            {/* Job Details */}
            <div className="space-y-3">
              <h3 className="text-heading-sm font-semibold text-[var(--fr8x-jet)] border-b border-border pb-1">Job Details</h3>
              <div>
                <label className="fr8x-label block mb-1">Job Summary</label>
                <textarea value={jobSummary} onChange={(e) => setJobSummary(e.target.value)} className="fr8x-input min-h-[60px] resize-none" placeholder="Brief summary of the role..." />
              </div>
              <div>
                <label className="fr8x-label block mb-1">Required Skills</label>
                <input type="text" value={requiredSkills} onChange={(e) => setRequiredSkills(e.target.value)} className="fr8x-input" placeholder="e.g. Documentation, Freight Negotiation, Customs Clearance" />
              </div>
              <div>
                <label className="fr8x-label block mb-1">Cargo Type</label>
                <select value={cargoType} onChange={(e) => setCargoType(e.target.value)} className="fr8x-input">
                  {JOB_CARGO_TYPES.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
              </div>
            </div>

            {/* Application & Contact */}
            <div className="space-y-3">
              <h3 className="text-heading-sm font-semibold text-[var(--fr8x-jet)] border-b border-border pb-1">Application & Contact</h3>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="fr8x-label block mb-1">Apply Via</label>
                  <select value={applyVia} onChange={(e) => setApplyVia(e.target.value)} className="fr8x-input">
                    {JOB_APPLY_VIA.map((v) => (<option key={v} value={v}>{v}</option>))}
                  </select>
                </div>
                <div>
                  <label className="fr8x-label block mb-1">Apply Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="fr8x-input" placeholder="jobs@company.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="fr8x-label block mb-1">Recruiter Name</label>
                  <input type="text" value={recruiterName} onChange={(e) => setRecruiterName(e.target.value)} className="fr8x-input" />
                </div>
                <div>
                  <label className="fr8x-label block mb-1">Official Email</label>
                  <input type="email" value={officialEmail} onChange={(e) => setOfficialEmail(e.target.value)} className="fr8x-input" />
                </div>
              </div>
            </div>

            {/* Posting Plan & Settings */}
            <div className="space-y-3 bg-[var(--fr8x-mist)] p-3 rounded-lg">
              <div className="flex items-center justify-between text-body-sm font-semibold text-[var(--fr8x-jet)]">
                <span>Submission Fee:</span>
                <span>₹{JOB_SUBMISSION_FEE_INR} per post</span>
              </div>
              <p className="text-caption text-foreground-secondary">After Expiry: Marked as Expired automatically</p>
              <div className="flex items-center justify-between pt-2 border-t border-border">
                <label className="flex items-center gap-2 cursor-pointer text-body-sm text-[var(--fr8x-jet)]">
                  <input type="checkbox" checked={featuredJob} onChange={(e) => setFeaturedJob(e.target.checked)} className="accent-[var(--fr8x-periwinkle)]" />
                  Featured Job
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-body-sm text-[var(--fr8x-jet)]">
                  <input type="checkbox" checked={showSalary} onChange={(e) => setShowSalary(e.target.checked)} className="accent-[var(--fr8x-periwinkle)]" />
                  Show Salary
                </label>
              </div>
            </div>

            {/* Declaration */}
            <label className="flex items-start gap-2 cursor-pointer text-caption text-[var(--fr8x-jet)]">
              <input type="checkbox" checked={declarationConfirmed} onChange={(e) => setDeclarationConfirmed(e.target.checked)} className="mt-0.5 accent-[var(--fr8x-periwinkle)]" />
              <span>I confirm all details are correct and agree to the listing terms.</span>
            </label>
          </div>

          {/* ═══ RIGHT COLUMN ═══ */}
          <div className="space-y-6">
            <div className="space-y-3">
              <h3 className="text-heading-sm font-semibold text-[var(--fr8x-jet)] border-b border-border pb-1">Company Details & Core Attributes</h3>
              <div>
                <label className="fr8x-label block mb-1">Company Name *</label>
                <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="fr8x-input" placeholder="e.g. Apex Logistics India Pvt Ltd" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="fr8x-label block mb-1">Job Category</label>
                  <select value={jobCategory} onChange={(e) => setJobCategory(e.target.value)} className="fr8x-input">
                    {JOB_CATEGORIES.map((cat) => (<option key={cat} value={cat}>{cat}</option>))}
                  </select>
                </div>
                <div>
                  <label className="fr8x-label block mb-1">Vacancies</label>
                  <input type="number" value={vacancies} onChange={(e) => setVacancies(e.target.value)} className="fr8x-input" min="1" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="fr8x-label block mb-1">Education</label>
                  <input type="text" value={education} onChange={(e) => setEducation(e.target.value)} className="fr8x-input" placeholder="e.g. Graduate / MBA" />
                </div>
                <div>
                  <label className="fr8x-label block mb-1">Salary Type</label>
                  <select value={salaryType} onChange={(e) => setSalaryType(e.target.value)} className="fr8x-input">
                    {JOB_SALARY_TYPES.map((st) => (<option key={st} value={st}>{st}</option>))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="fr8x-label block mb-1">State</label>
                  <input type="text" value={state} onChange={(e) => setState(e.target.value)} className="fr8x-input" placeholder="e.g. Maharashtra" />
                </div>
                <div>
                  <label className="fr8x-label block mb-1">Work Mode</label>
                  <select value={workMode} onChange={(e) => setWorkMode(e.target.value)} className="fr8x-input">
                    {JOB_WORK_MODES.map((wm) => (<option key={wm} value={wm}>{wm}</option>))}
                  </select>
                </div>
              </div>

              <div>
                <label className="fr8x-label block mb-1">Key Responsibilities</label>
                <textarea value={keyResponsibilities} onChange={(e) => setKeyResponsibilities(e.target.value)} className="fr8x-input min-h-[60px] resize-none" placeholder="List key responsibilities..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="fr8x-label block mb-1">Preferred Software</label>
                  <select value={preferredSoftware} onChange={(e) => setPreferredSoftware(e.target.value)} className="fr8x-input">
                    {JOB_PREFERRED_SOFTWARE.map((ps) => (<option key={ps} value={ps}>{ps}</option>))}
                  </select>
                </div>
                <div>
                  <label className="fr8x-label block mb-1">Languages</label>
                  <select value={languages} onChange={(e) => setLanguages(e.target.value)} className="fr8x-input">
                    {JOB_LANGUAGES.map((lang) => (<option key={lang} value={lang}>{lang}</option>))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="fr8x-label block mb-1">Application Deadline</label>
                  <input type="date" value={applicationDeadline} onChange={(e) => setApplicationDeadline(e.target.value)} className="fr8x-input" />
                </div>
                <div>
                  <label className="fr8x-label block mb-1">Mobile Number</label>
                  <input type="text" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} className="fr8x-input" placeholder="+91 9876543210" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="fr8x-label block mb-1">Website / URL</label>
                  <input type="text" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="fr8x-input" placeholder="https://..." />
                </div>
                <div>
                  <label className="fr8x-label block mb-1">Company Website</label>
                  <input type="text" value={companyWebsite} onChange={(e) => setCompanyWebsite(e.target.value)} className="fr8x-input" placeholder="https://..." />
                </div>
              </div>

              <div className="space-y-2 bg-[var(--fr8x-mist)] p-3 rounded-lg">
                <div className="flex items-center justify-between text-body-sm font-semibold text-[var(--fr8x-jet)]">
                  <span>Validity: {JOB_VALIDITY_DAYS} Days</span>
                  <span>Renewal Fee: ₹{JOB_RENEWAL_FEE_INR} for 2 more days</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <label className="flex items-center gap-2 cursor-pointer text-body-sm text-[var(--fr8x-jet)]">
                    <input type="checkbox" checked={urgentHiring} onChange={(e) => setUrgentHiring(e.target.checked)} className="accent-[var(--fr8x-periwinkle)]" />
                    Urgent Hiring
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-caption font-medium">Status:</span>
                    <select value={status} onChange={(e) => setStatus(e.target.value as "Draft" | "Published" | "Expired")} className="fr8x-input py-1 text-caption">
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-[var(--fr8x-bg)] rounded-b-xl">
          <button
            onClick={() => handleSubmit("draft")}
            className="fr8x-btn-secondary"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSubmit("preview")}
            className="fr8x-btn-secondary"
          >
            Preview
          </button>
          <button
            onClick={() => handleSubmit("publish")}
            className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0] px-6"
          >
            Pay & Publish (₹{JOB_SUBMISSION_FEE_INR})
          </button>
        </div>
      </div>
    </div>
  );
}
