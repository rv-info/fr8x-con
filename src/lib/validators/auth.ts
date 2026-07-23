// FR8X-CON Zod Validators: Auth schemas

import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Full name is required")
      .min(2, "Full name must be at least 2 characters")
      .max(100, "Full name must be less than 100 characters"),
    workEmail: z
      .string()
      .min(1, "Work email is required")
      .email("Please enter a valid work email"),
    password: z
      .string()
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/,
        "Password must contain uppercase, lowercase, number, and special character"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    companyName: z
      .string()
      .min(1, "Company name is required")
      .max(200, "Company name must be less than 200 characters"),
    countryRegion: z
      .string()
      .min(1, "Country / Region is required"),
    role: z.enum([
      "nvocc",
      "mlo",
      "freight_forwarder",
      "cha",
      "transporter",
    ], {
      required_error: "Please select a role",
    }),
    industryTags: z
      .array(z.string())
      .min(1, "Select at least one industry/service tag"),
    membershipTier: z.enum(["trial", "basic", "premium"], {
      required_error: "Please select a membership tier",
    }),
    gstTaxId: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export const otpSchema = z.object({
  contact: z
    .string()
    .min(1, "Phone number or email is required"),
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must contain only digits"),
});

export type OTPFormData = z.infer<typeof otpSchema>;
