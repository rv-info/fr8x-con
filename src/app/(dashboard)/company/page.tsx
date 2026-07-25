// FR8X-CON Own Company Page Settings / Identity Management
// Allows users to create a company if they don't have one, or upload logo & manage business identity (GSTN, PAN, CIN, etc.)

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Building2, ShieldCheck, MapPin, Upload, FileText, Calendar, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { COLLECTIONS, ROUTES } from "@/lib/utils/constants";
import { getDocument, setDocument, queryDocuments, where, limit } from "@/lib/firebase/firestore";
import { ImageUploadWithCrop } from "@/components/ui/ImageUploadWithCrop";
import { getCompanyLogoPath } from "@/lib/firebase/storage";
import { Button } from "@/components/ui/Button";

type CompanyInfo = {
  id: string;
  name: string;
  country: string;
  region: string;
  industry: string;
  logoURL: string | null;
  publicId?: string;
  gstn?: string;
  pan?: string;
  cin?: string;
  iec?: string;
  businessRegistrationNumber?: string;
  companyType?: string;
  yearEstablished?: string;
  about?: string;
  verified?: boolean;
};

type UserProfile = {
  userId: string;
  companyId?: string | null;
  companyName?: string;
};

export default function OwnCompanyPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [industry, setIndustry] = useState("");
  const [gstn, setGstn] = useState("");
  const [pan, setPan] = useState("");
  const [cin, setCin] = useState("");
  const [iec, setIec] = useState("");
  const [businessRegNum, setBusinessRegNum] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [yearEstablished, setYearEstablished] = useState("");
  const [about, setAbout] = useState("");
  const [logoURL, setLogoURL] = useState<string | null>(null);
  const [publicId, setPublicId] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const generateCompanyHandle = (compName: string): string => {
    const clean = compName.replace(/[^a-zA-Z0-9]/g, "").substring(0, 4).toUpperCase() || "COMP";
    const num = Math.floor(1000 + Math.random() * 9000);
    return `@${clean}-${num}`;
  };

  const loadDetails = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const prof = await getDocument<UserProfile>(COLLECTIONS.PROFILES, user.uid);
      setProfile(prof);

      if (prof?.companyId) {
        const comp = await getDocument<CompanyInfo>(COLLECTIONS.COMPANIES, prof.companyId);
        if (comp) {
          setCompany(comp);
          setName(comp.name || "");
          setCountry(comp.country || "");
          setRegion(comp.region || "");
          setIndustry(comp.industry || "");
          setGstn(comp.gstn || "");
          setPan(comp.pan || "");
          setCin(comp.cin || "");
          setIec(comp.iec || "");
          setBusinessRegNum(comp.businessRegistrationNumber || "");
          setCompanyType(comp.companyType || "");
          setYearEstablished(comp.yearEstablished || "");
          setAbout(comp.about || "");
          setLogoURL(comp.logoURL || null);
          setPublicId(comp.publicId || "");
        }
      }
    } catch (err) {
      console.error("Error loading company settings:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadDetails();
  }, [loadDetails]);

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.uid || !profile) return;
    
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      let companyId = profile.companyId;
      const isNew = !companyId;

      if (isNew) {
        companyId = `comp_${Date.now()}`;
      }

      const handle = publicId || generateCompanyHandle(name);

      const payload: CompanyInfo = {
        id: companyId!,
        name: name.trim(),
        country: country.trim(),
        region: region.trim(),
        industry: industry.trim(),
        logoURL: logoURL,
        publicId: handle,
        gstn: gstn.trim(),
        pan: pan.trim(),
        cin: cin.trim(),
        iec: iec.trim(),
        businessRegistrationNumber: businessRegNum.trim(),
        companyType: companyType,
        yearEstablished: yearEstablished.trim(),
        about: about.trim(),
        verified: company?.verified || false,
      };

      // 1. Save company document
      await setDocument(COLLECTIONS.COMPANIES, companyId!, payload, true);

      // 2. Update user profile to link to company
      if (isNew) {
        await setDocument(
          COLLECTIONS.PROFILES,
          user.uid,
          {
            companyId: companyId,
            companyName: name.trim(),
          },
          true
        );
      }

      setCompany(payload);
      setPublicId(handle);
      setIsEditing(false);
      setSuccess(isNew ? "Company profile created successfully!" : "Company details updated successfully!");
      setTimeout(() => setSuccess(null), 3000);
      loadDetails();
    } catch (err: any) {
      console.error("Error saving company details:", err);
      setError(err.message || "Failed to save company details.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--fr8x-periwinkle)]" />
          <span className="text-body-sm text-foreground-secondary">Loading company settings...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 py-3 min-h-screen bg-[var(--fr8x-bg)]">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h1 className="text-heading-md font-semibold text-[var(--fr8x-jet)]">Company Identity Center</h1>
          <p className="text-caption text-foreground-secondary">Manage and verify your business identity credentials</p>
        </div>
        {company && !isEditing && (
          <div className="flex gap-2">
            <button
              onClick={() => router.push(ROUTES.COMPANY_VIEW(company.id))}
              className="fr8x-btn-secondary text-[11px] py-1 flex items-center gap-1"
            >
              View Public Page <ArrowRight className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0] text-[11px] py-1"
            >
              Edit Company Info
            </button>
          </div>
        )}
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-caption rounded p-2.5 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-caption rounded p-2.5 flex items-center gap-2">
          <FileText className="h-4 w-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ═══ CREATE COMPANY PROFILE (if user doesn't belong to any company) ═══ */}
      {!company && !isEditing ? (
        <div className="max-w-md mx-auto my-10 bg-white fr8x-card p-6 text-center space-y-4">
          <Building2 className="h-12 w-12 text-[var(--fr8x-periwinkle)] mx-auto" />
          <div>
            <h2 className="text-body-lg font-bold text-[var(--fr8x-jet)]">Create Company Profile</h2>
            <p className="text-caption text-foreground-secondary mt-1">
              Add your company identity to publish RFQs, post jobs, showcase your services, and upload logos.
            </p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="fr8x-btn-primary bg-[var(--fr8x-periwinkle)] hover:bg-[var(--fr8x-periwinkle)]/90 text-white w-full py-2 font-semibold text-body-sm shadow"
          >
            Create Company Profile
          </button>
        </div>
      ) : isEditing ? (
        /* ═══ EDIT / CREATE FORM ═══ */
        <form onSubmit={handleSaveCompany} className="space-y-4">
          <div className="fr8x-card p-4 bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Left side: logo upload */}
            <div className="md:col-span-1 border-r border-border pr-4 space-y-2">
              <label className="fr8x-label block">Company Logo</label>
              <ImageUploadWithCrop
                currentImageUrl={logoURL}
                storagePath={getCompanyLogoPath(company?.id || `temp_${Date.now()}`)}
                onUploadComplete={(url) => setLogoURL(url)}
                onRemove={() => setLogoURL(null)}
                label="Upload Company Logo"
                aspectRatio="square"
              />
            </div>

            {/* Right side: company info fields */}
            <div className="md:col-span-2 space-y-4">
              <h3 className="text-body-sm font-semibold text-[var(--fr8x-jet)] border-b border-border pb-1">
                Company Basics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="fr8x-label block mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Apex Ocean Line"
                    className="fr8x-input"
                  />
                </div>
                <div>
                  <label className="fr8x-label block mb-1">Unique Handles (e.g. @COMP-0001)</label>
                  <input
                    type="text"
                    value={publicId}
                    onChange={(e) => {
                      let val = e.target.value;
                      if (val && !val.startsWith("@")) val = "@" + val;
                      setPublicId(val.replace(/\s+/g, "").toUpperCase());
                    }}
                    placeholder="Auto-generated if empty"
                    className="fr8x-input font-mono"
                  />
                </div>
                <div>
                  <label className="fr8x-label block mb-1">Country *</label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="e.g. India"
                    className="fr8x-input"
                  />
                </div>
                <div>
                  <label className="fr8x-label block mb-1">Region / City</label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g. Mumbai"
                    className="fr8x-input"
                  />
                </div>
                <div>
                  <label className="fr8x-label block mb-1">Industry Type *</label>
                  <input
                    type="text"
                    required
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="e.g. Freight Forwarder / NVOCC"
                    className="fr8x-input"
                  />
                </div>
                <div>
                  <label className="fr8x-label block mb-1">Company Type</label>
                  <select
                    value={companyType}
                    onChange={(e) => setCompanyType(e.target.value)}
                    className="fr8x-input"
                  >
                    <option value="">Select Company Type</option>
                    <option value="Private Limited">Private Limited</option>
                    <option value="Partnership">Partnership</option>
                    <option value="Proprietorship">Proprietorship</option>
                    <option value="Public Carrier">Public Carrier</option>
                    <option value="MLO">MLO / Liner</option>
                  </select>
                </div>
                <div>
                  <label className="fr8x-label block mb-1">Year Established</label>
                  <input
                    type="number"
                    value={yearEstablished}
                    onChange={(e) => setYearEstablished(e.target.value)}
                    placeholder="e.g. 2015"
                    className="fr8x-input"
                  />
                </div>
              </div>

              <h3 className="text-body-sm font-semibold text-[var(--fr8x-jet)] border-b border-border pb-1 pt-2">
                Business Registrations & Tax IDs
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="fr8x-label block mb-1">GSTN Number *</label>
                  <input
                    type="text"
                    required
                    value={gstn}
                    onChange={(e) => setGstn(e.target.value)}
                    placeholder="15-digit GSTN"
                    className="fr8x-input font-mono"
                  />
                </div>
                <div>
                  <label className="fr8x-label block mb-1">PAN Number (Optional)</label>
                  <input
                    type="text"
                    value={pan}
                    onChange={(e) => setPan(e.target.value)}
                    placeholder="10-digit PAN"
                    className="fr8x-input font-mono"
                  />
                </div>
                <div>
                  <label className="fr8x-label block mb-1">CIN Number (Optional)</label>
                  <input
                    type="text"
                    value={cin}
                    onChange={(e) => setCin(e.target.value)}
                    placeholder="21-digit Corporate Identity Number"
                    className="fr8x-input font-mono"
                  />
                </div>
                <div>
                  <label className="fr8x-label block mb-1">IEC Code (Optional)</label>
                  <input
                    type="text"
                    value={iec}
                    onChange={(e) => setIec(e.target.value)}
                    placeholder="Import Export Code"
                    className="fr8x-input font-mono"
                  />
                </div>
                <div>
                  <label className="fr8x-label block mb-1">Business Registration Number</label>
                  <input
                    type="text"
                    value={businessRegNum}
                    onChange={(e) => setBusinessRegNum(e.target.value)}
                    placeholder="Registration/License Number"
                    className="fr8x-input"
                  />
                </div>
              </div>

              <h3 className="text-body-sm font-semibold text-[var(--fr8x-jet)] border-b border-border pb-1 pt-2">
                About & Specializations
              </h3>
              <div>
                <label className="fr8x-label block mb-1">Company Description</label>
                <textarea
                  rows={3}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Tell clients about your network coverage, fleet size, special equipment cargo..."
                  className="fr8x-input"
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                if (company) {
                  setIsEditing(false);
                } else {
                  router.push(ROUTES.FEEDS);
                }
              }}
              className="fr8x-btn-secondary"
            >
              Cancel
            </button>
            <Button
              type="submit"
              isLoading={isSaving}
              loadingText="Saving Company profile..."
              className="fr8x-btn-primary text-body-sm px-4 py-1.5"
            >
              Save Company Identity
            </Button>
          </div>
        </form>
      ) : (
        /* ═══ READ-ONLY COMPANY IDENTITY DASHBOARD ═══ */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Company Card Header */}
          <div className="lg:col-span-1 fr8x-card p-4 bg-white text-center space-y-3">
            <div className="w-16 h-16 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-heading-lg text-white font-bold mx-auto overflow-hidden">
              {logoURL ? (
                <img src={logoURL} alt={name} className="w-full h-full object-cover" />
              ) : (
                name.charAt(0)
              )}
            </div>
            <div>
              <div className="flex items-center justify-center gap-1.5">
                <h2 className="text-body-lg font-bold text-[var(--fr8x-jet)]">{name}</h2>
                {company?.verified && (
                  <span className="bg-emerald-50 text-emerald-700 p-0.5 rounded-full" title="Verified Logistics Business">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 fill-emerald-100" />
                  </span>
                )}
              </div>
              {publicId && (
                <p className="text-[10px] text-[var(--fr8x-periwinkle)] font-medium font-mono">{publicId}</p>
              )}
              <p className="text-caption text-foreground-secondary mt-1">{industry}</p>
              <p className="text-caption text-foreground-secondary flex items-center justify-center gap-1 mt-0.5">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {region}, {country}
              </p>
            </div>
          </div>

          {/* Details sections */}
          <div className="lg:col-span-2 space-y-4">
            {/* Identity fields */}
            <div className="fr8x-card p-4 bg-white space-y-3">
              <h3 className="text-body-sm font-semibold text-[var(--fr8x-jet)] border-b border-border pb-1">
                Corporate Credentials
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-caption">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground-secondary">GSTN Number</p>
                    <p className="text-[var(--fr8x-jet)] font-mono">{gstn || "Not Provided"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground-secondary">PAN Number</p>
                    <p className="text-[var(--fr8x-jet)] font-mono">{pan || "Not Provided"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground-secondary">CIN Number</p>
                    <p className="text-[var(--fr8x-jet)] font-mono">{cin || "Not Provided"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground-secondary">IEC Import/Export Code</p>
                    <p className="text-[var(--fr8x-jet)] font-mono">{iec || "Not Provided"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Building2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground-secondary">Business Registry No.</p>
                    <p className="text-[var(--fr8x-jet)]">{businessRegNum || "Not Provided"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-foreground-secondary">Year Established / Type</p>
                    <p className="text-[var(--fr8x-jet)]">{yearEstablished || "—"} ({companyType || "Standard"})</p>
                  </div>
                </div>
              </div>
            </div>

            {/* About text */}
            {about && (
              <div className="fr8x-card p-4 bg-white space-y-2">
                <h3 className="text-body-sm font-semibold text-[var(--fr8x-jet)]">About the Company</h3>
                <p className="text-body-sm text-[var(--fr8x-jet)] leading-relaxed whitespace-pre-line">
                  {about}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
