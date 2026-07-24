// FR8X-CON Enterprise Business Registration Policy
// Configurable domain restrictions, blocked public providers, and enterprise validation rules.
// Controlled via GodMode Control Panel.

export interface RegistrationPolicyConfig {
  strictCorporateEmailOnly: boolean;
  blockedEmailDomains: string[];
  whitelistedEmailDomains: string[];
  requireEmailVerification: boolean;
  requireManualGodmodeApproval: boolean;
}

export const DEFAULT_REGISTRATION_POLICY: RegistrationPolicyConfig = {
  strictCorporateEmailOnly: true,
  blockedEmailDomains: [
    "gmail.com",
    "yahoo.com",
    "yahoo.co.in",
    "outlook.com",
    "hotmail.com",
    "live.com",
    "aol.com",
    "icloud.com",
    "protonmail.com",
    "proton.me",
    "zoho.com",
    "yandex.com",
    "gmx.com",
    "mail.com",
    "rediffmail.com",
    "tutanota.com",
    "tempmail.com",
    "mailinator.com",
    "10minutemail.com",
    "guerrillamail.com",
    "dispostable.com",
    "trashmail.com",
  ],
  whitelistedEmailDomains: [
    "fr8x.in",
    "cogoport.com",
    "maersk.com",
    "msc.com",
    "dhl.com",
    "kuehne-nagel.com",
    "dbschenker.com",
  ],
  requireEmailVerification: true,
  requireManualGodmodeApproval: false,
};

/**
 * Validates whether an email address complies with the Enterprise Registration Policy.
 */
export function validateEnterpriseEmail(
  email: string,
  customPolicy: RegistrationPolicyConfig = DEFAULT_REGISTRATION_POLICY
): { isValid: boolean; reason?: string } {
  const trimmed = email.trim().toLowerCase();
  const parts = trimmed.split("@");
  if (parts.length !== 2 || !parts[1]) {
    return { isValid: false, reason: "Please enter a valid email address format." };
  }

  const domain = parts[1];

  // Check if explicit whitelisted domain
  if (customPolicy.whitelistedEmailDomains.includes(domain)) {
    return { isValid: true };
  }

  // Check if domain is blocked
  if (customPolicy.blockedEmailDomains.includes(domain)) {
    return {
      isValid: false,
      reason: `Personal/public email address (@${domain}) is strictly prohibited on FR8X-CON Enterprise. Please use your official corporate company email address (e.g. user@company.com).`,
    };
  }

  return { isValid: true };
}
