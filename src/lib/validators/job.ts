// FR8X-CON Job Posting Zod Validation Schema

import { z } from "zod";

export const jobPostingSchema = z.object({
  jobTitle: z.string().min(2, "Job title is required"),
  industry: z.string().min(1, "Industry is required"),
  employmentType: z.string().min(1, "Employment type is required"),
  experienceRequired: z.string().min(1, "Experience is required"),
  salaryMin: z.number().min(0, "Minimum salary must be non-negative"),
  salaryMax: z.number().min(0, "Maximum salary must be non-negative"),
  country: z.string().min(1, "Country is required"),
  city: z.string().min(1, "City is required"),
  jobSummary: z.string().min(10, "Job summary must be at least 10 characters"),
  requiredSkills: z.string().min(2, "Required skills are required"),
  cargoType: z.string().min(1, "Cargo type is required"),
  applyVia: z.string().min(1, "Apply via is required"),
  email: z.string().email("Invalid email address"),
  recruiterName: z.string().min(2, "Recruiter name is required"),
  officialEmail: z.string().email("Invalid official email"),
  featuredJob: z.boolean(),
  showSalary: z.boolean(),
  declarationConfirmed: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the listing terms" }),
  }),

  companyName: z.string().min(2, "Company name is required"),
  jobCategory: z.string().min(1, "Job category is required"),
  vacancies: z.number().min(1, "At least 1 vacancy is required"),
  education: z.string().min(1, "Education is required"),
  salaryType: z.string().min(1, "Salary type is required"),
  state: z.string().min(1, "State is required"),
  workMode: z.string().min(1, "Work mode is required"),
  keyResponsibilities: z.string().min(10, "Key responsibilities required"),
  preferredSoftware: z.string().min(1, "Preferred software is required"),
  languages: z.string().min(1, "Languages required"),
  applicationDeadline: z.string().min(1, "Deadline is required"),
  websiteUrl: z.string().optional(),
  mobileNumber: z.string().min(5, "Mobile number is required"),
  companyWebsite: z.string().optional(),
  urgentHiring: z.boolean(),
});

export type JobPostingFormData = z.infer<typeof jobPostingSchema>;
