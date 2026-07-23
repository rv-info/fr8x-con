// FR8X-CON Job Types

import type { AuditFields } from "./common";

export type JobStatus = "Draft" | "Published" | "Expired";

export type JobPosting = {
  id: string;
  // Left Column Fields
  jobTitle: string;
  industry: string;
  employmentType: string;
  experienceRequired: string;
  salaryMin: number;
  salaryMax: number;
  country: string;
  city: string;
  jobSummary: string;
  requiredSkills: string;
  cargoType: string;
  applyVia: string;
  email: string;
  recruiterName: string;
  officialEmail: string;
  submissionFee: number;
  featuredJob: boolean;
  showSalary: boolean;
  declarationConfirmed: boolean;

  // Right Column Fields
  companyName: string;
  jobCategory: string;
  vacancies: number;
  education: string;
  salaryType: string;
  state: string;
  workMode: string;
  keyResponsibilities: string;
  preferredSoftware: string;
  languages: string;
  applicationDeadline: string;
  websiteUrl: string;
  mobileNumber: string;
  companyWebsite: string;
  validityDays: number;
  renewalFee: number;
  urgentHiring: boolean;
  status: JobStatus;
  seenCount: number;
  postedByUserId: string;
} & AuditFields;
