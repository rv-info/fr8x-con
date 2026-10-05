/**
 * lib/supabase/validation.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Input Validation & Normalization Layer for FR8X Supabase Operations.
 * Prevents invalid state from reaching PostgreSQL.
 * Specifically normalizes phone, designation, and location fields.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { ValidationError } from './errors';

export interface ValidatedProfileUpdate {
  phone?: string;
  mobile?: string;
  isd_code?: string;
  designation?: string;
  position?: string;
  location?: string;
  city?: string;
  state?: string;
  country?: string;
  company_name?: string;
  department?: string;
  display_name?: string;
  first_name?: string;
  last_name?: string;
  address?: string;
  formatted_address?: string;
  postal_code?: string;
  avatar_url?: string;
  bio?: string;
  gstn?: string;
  pan?: string;
  cin?: string;
  iec?: string;
}

/**
 * Normalizes phone numbers: removes extraneous whitespace, dashes, and parentheses.
 * Ensures valid international E.164 or Indian 10-digit format.
 */
export function normalizePhoneNumber(rawPhone: string, isdCode: string = '+91'): { phone: string; isdCode: string } {
  if (!rawPhone || typeof rawPhone !== 'string') {
    return { phone: '', isdCode };
  }

  const cleaned = rawPhone.trim().replace(/[\s\-\(\)]/g, '');
  if (!cleaned) {
    return { phone: '', isdCode };
  }

  // If already starts with '+', extract ISD code
  if (cleaned.startsWith('+')) {
    if (cleaned.startsWith('+91') && cleaned.length >= 13) {
      return { phone: cleaned.slice(3), isdCode: '+91' };
    }
    return { phone: cleaned, isdCode };
  }

  // Strip leading 0
  const stripped = cleaned.replace(/^0+/, '');
  if (stripped.length === 10) {
    return { phone: stripped, isdCode };
  }

  return { phone: stripped, isdCode };
}

/**
 * Validates and normalizes user profile update inputs.
 * Strictly guarantees that phone, designation, and location are clean, trimmed,
 * and valid before sending to PostgreSQL.
 */
export function validateProfileUpdate(input: Record<string, any>): ValidatedProfileUpdate {
  if (!input || typeof input !== 'object') {
    throw new ValidationError('Profile update payload must be an object');
  }

  const output: ValidatedProfileUpdate = {};

  // 1. Phone / Mobile validation & normalization
  const rawPhone = input.phone || input.mobile;
  const rawIsd = input.isd_code || input.isdCode || '+91';
  if (rawPhone !== undefined) {
    const { phone, isdCode } = normalizePhoneNumber(String(rawPhone), String(rawIsd));
    output.phone = phone;
    output.mobile = phone;
    output.isd_code = isdCode;
  }

  // 2. Designation / Position validation & normalization
  const rawDesignation = input.designation || input.position;
  if (rawDesignation !== undefined) {
    const cleaned = String(rawDesignation).trim();
    if (cleaned.length > 100) {
      throw new ValidationError('Designation cannot exceed 100 characters');
    }
    output.designation = cleaned;
    output.position = cleaned;
  }

  // 3. Location / City / State / Country validation & normalization
  if (input.location !== undefined) {
    output.location = String(input.location).trim().slice(0, 200);
  }
  if (input.city !== undefined) {
    output.city = String(input.city).trim().slice(0, 100);
  }
  if (input.state !== undefined) {
    output.state = String(input.state).trim().slice(0, 100);
  }
  if (input.country !== undefined) {
    output.country = String(input.country).trim().slice(0, 100);
  }
  if (input.address !== undefined || input.formatted_address !== undefined || input.formattedAddress !== undefined) {
    const addr = String(input.address || input.formatted_address || input.formattedAddress).trim();
    output.address = addr;
    output.formatted_address = addr;
  }
  if (input.postal_code !== undefined || input.postalCode !== undefined) {
    output.postal_code = String(input.postal_code || input.postalCode).trim().slice(0, 20);
  }

  // If city/state/country updated but location not explicitly set, compute normalized location
  if (!output.location && (output.city || output.state || output.country)) {
    output.location = [output.city, output.state, output.country].filter(Boolean).join(', ');
  }

  // 4. Company & Department
  if (input.company_name !== undefined || input.company !== undefined || input.companyName !== undefined) {
    output.company_name = String(input.company_name || input.company || input.companyName).trim();
  }
  if (input.department !== undefined) {
    output.department = String(input.department).trim();
  }

  // 5. Name
  if (input.display_name !== undefined || input.displayName !== undefined) {
    output.display_name = String(input.display_name || input.displayName).trim();
  }
  if (input.first_name !== undefined || input.firstName !== undefined) {
    output.first_name = String(input.first_name || input.firstName).trim();
  }
  if (input.last_name !== undefined || input.lastName !== undefined) {
    output.last_name = String(input.last_name || input.lastName).trim();
  }

  // 6. Statutory & KYC Identifiers
  if (input.gstn !== undefined) output.gstn = String(input.gstn).trim().toUpperCase();
  if (input.pan !== undefined) output.pan = String(input.pan).trim().toUpperCase();
  if (input.cin !== undefined) output.cin = String(input.cin).trim().toUpperCase();
  if (input.iec !== undefined) output.iec = String(input.iec).trim().toUpperCase();

  // 7. Media & Bio
  if (input.avatar_url !== undefined || input.avatarUrl !== undefined) {
    output.avatar_url = String(input.avatar_url || input.avatarUrl).trim();
  }
  if (input.bio !== undefined) {
    output.bio = String(input.bio).trim().slice(0, 2000);
  }

  return output;
}
