// FR8X-CON Auth Types

export type UserRole =
  | "nvocc"
  | "mlo"
  | "freight_forwarder"
  | "cha"
  | "transporter"
  | "importer"
  | "exporter"
  | "procurement"
  | "logistics_manager"
  | "admin"
  | "godmode";

export type MembershipTier = "trial" | "basic" | "premium";

export type AuthProvider = "email" | "google" | "microsoft" | "otp";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterData = {
  fullName: string;
  workEmail: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  countryRegion: string;
  role: UserRole;
  industryTags: string[];
  membershipTier: MembershipTier;
  gstTaxId?: string;
};

export type AuthState = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: AuthUser | null;
  error: string | null;
};

export type AuthUser = {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  role: UserRole;
  isGodMode: boolean;
  companyId: string | null;
  membershipTier: MembershipTier;
};

export type OTPRequest = {
  phone?: string;
  email?: string;
  method: "sms" | "email";
};
