// FR8X-CON Enterprise KYC & Company Identity Management
// 100% Text-Based Business Identity Onboarding (15 Required Fields) & GodMode Verification

"use client";

import { useState, useEffect, useCallback } from "react";
import { Building2, ShieldCheck, FileText, Loader2 } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { COLLECTIONS } from "@/lib/utils/constants";
import { getDocument, setDocument } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/Button";

type CompanyInfo = {
  id: string;
  name: string;
  registrationNumber: string;
  gstNumber: string;
  panNumber: string;
  address: string;
  country: string;
  city: string;
  contactPerson: string;
  phone: string;
  email: string;
  website: string;
  businessType: string;
  yearsInBusiness: string;
  employees: string;
  annualTurnover: string;
  publicId?: string;
  kycStatus: "pending" | "approved" | "rejected";
  kycApprovedBy?: string;
  kycApprovedAt?: string;
};

type UserProfile = {
  userId: string;
  companyId?: string | null;
  companyName?: string;
};

export default function OwnCompanyPage() {
  const { user } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // 15 Text-Based Onboarding Form Fields
  const [name, setName] = useState("");
  const [regNum, setRegNum] = useState("");
  const [gstNum, setGstNum] = useState("");
  const [panNum, setPanNum] = useState("");
  const [address, setAddress] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [employees, setEmployees] = useState("");
  const [annualTurnover, setAnnualTurnover] = useState("");
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
          setRegNum(comp.registrationNumber || "");
          setGstNum(comp.gstNumber || "");
          setPanNum(comp.panNumber || "");
          setAddress(comp.address || "");
          setCountry(comp.country || "");
          setCity(comp.city || "");
          setContactPerson(comp.contactPerson || "");
          setPhone(comp.phone || "");
          setEmail(comp.email || "");
          setWebsite(comp.website || "");
          setBusinessType(comp.businessType || "");
          setYearsInBusiness(comp.yearsInBusiness || "");
          setEmployees(comp.employees || "");
          setAnnualTurnover(comp.annualTurnover || "");
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

    if (
      !name.trim() ||
      !regNum.trim() ||
      !gstNum.trim() ||
      !panNum.trim() ||
      !address.trim() ||
      !country.trim() ||
      !city.trim() ||
      !contactPerson.trim() ||
      !phone.trim() ||
      !email.trim() ||
      !businessType.trim()
    ) {
      setError("Please fill in all mandatory text onboarding fields.");
      return;
    }

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
        registrationNumber: regNum.trim(),
        gstNumber: gstNum.trim(),
        panNumber: panNum.trim(),
        address: address.trim(),
        country: country.trim(),
        city: city.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        website: website.trim(),
        businessType: businessType.trim(),
        yearsInBusiness: yearsInBusiness.trim(),
        employees: employees.trim(),
        annualTurnover: annualTurnover.trim(),
        publicId: handle,
        kycStatus: company?.kycStatus || "pending",
      };

      // 1. Save company document to Firestore
      await setDocument(COLLECTIONS.COMPANIES, companyId!, payload, true);

      // 2. Submit to GodMode KYC review queue
      await setDocument("kyc_requests", companyId!, {
        id: companyId!,
        userId: user.uid,
        companyName: name.trim(),
        registrationNumber: regNum.trim(),
        gstNumber: gstNum.trim(),
        panNumber: panNum.trim(),
        address: address.trim(),
        country: country.trim(),
        city: city.trim(),
        contactPerson: contactPerson.trim(),
        phone: phone.trim(),
        email: email.trim(),
        website: website.trim(),
        businessType: businessType.trim(),
        yearsInBusiness: yearsInBusiness.trim(),
        employees: employees.trim(),
        annualTurnover: annualTurnover.trim(),
        status: "pending",
        submittedAt: new Date().toISOString(),
      }, true);

      // 3. Update user profile to link company & set kycStatus to pending
      await setDocument(
        COLLECTIONS.PROFILES,
        user.uid,
        {
          companyId: companyId,
          companyName: name.trim(),
          kycStatus: "pending",
        },
        true
      );

      await setDocument(
        COLLECTIONS.USERS,
        user.uid,
        {
          companyId: companyId,
          companyName: name.trim(),
          kycStatus: "pending",
        },
        true
      );

      setCompany(payload);
      setPublicId(handle);
      setIsEditing(false);
      setSuccess("Enterprise text onboarding details submitted! Pending GodMode verification.");
      setTimeout(() => setSuccess(null), 4000);
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
    <div className="space-y-4 py-3 min-h-screen bg-white">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h1 className="text-[14px] font-bold text-slate-900">Enterprise KYC & Company Identity</h1>
          <p className="text-[10px] text-slate-500">Text-based business identity onboarding & GodMode verification</p>
        </div>
        {company && !isEditing && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="fr8x-btn-primary py-1"
            >
              Edit Business Details
            </button>
          </div>
        )}
      </div>

      {/* KYC Status Banner */}
      {company && (
        <div className={`p-2.5 rounded border text-[10px] flex items-center justify-between ${
          company.kycStatus === "approved"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : company.kycStatus === "rejected"
            ? "bg-red-50 border-red-200 text-red-800"
            : "bg-amber-50 border-amber-200 text-amber-800"
        }`}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <div>
              <p className="font-bold">
                KYC Status: {company.kycStatus === "approved" ? "GodMode Verified" : company.kycStatus === "rejected" ? "Application Rejected" : "Pending GodMode Review"}
              </p>
              <p className="text-[9px]">
                {company.kycStatus === "approved"
                  ? "Your business identity is fully verified by GodMode Administrator."
                  : company.kycStatus === "rejected"
                  ? "Your text onboarding details were rejected. Please review fields and resubmit."
                  : "Submitted to GodMode Admin. Verification will be updated after manual review."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success/Error Alerts */}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] rounded p-2.5 flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-[10px] rounded p-2.5 flex items-center gap-2">
          <FileText className="h-4 w-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form or Card */}
      {!company && !isEditing ? (
        <div className="max-w-md mx-auto my-10 bg-white fr8x-card p-6 text-center space-y-4 border border-slate-200">
          <Building2 className="h-12 w-12 text-[var(--fr8x-periwinkle)] mx-auto" />
          <div>
            <h2 className="text-[12px] font-bold text-slate-900">Text-Based Enterprise Onboarding</h2>
            <p className="text-[10px] text-slate-500 mt-1">
              Complete your 15-field company identity profile for GodMode approval. No file uploads required.
            </p>
          </div>
          <button
            onClick={() => setIsEditing(true)}
            className="fr8x-btn-primary bg-[var(--fr8x-periwinkle)] hover:bg-[var(--fr8x-periwinkle)]/90 text-white w-full py-2 font-bold text-[10px]"
          >
            Start Text Onboarding
          </button>
        </div>
      ) : isEditing ? (
        /* ═══ 15 TEXT FIELDS ONBOARDING FORM ═══ */
        <form onSubmit={handleSaveCompany} className="space-y-4">
          <div className="fr8x-card p-4 bg-white border border-slate-200 rounded-lg space-y-4">
            <h3 className="text-[12px] font-bold text-slate-900 border-b border-border pb-1">
              Structured Corporate Onboarding (15 Mandatory Text Fields)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="fr8x-label block mb-1">1. Company Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Apex Ocean Freight Pvt Ltd"
                  className="fr8x-input text-[10px]"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1">2. Registration Number *</label>
                <input
                  type="text"
                  required
                  value={regNum}
                  onChange={(e) => setRegNum(e.target.value)}
                  placeholder="Business Reg / CIN / License No."
                  className="fr8x-input text-[10px] font-mono"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1">3. GST Number *</label>
                <input
                  type="text"
                  required
                  value={gstNum}
                  onChange={(e) => setGstNum(e.target.value)}
                  placeholder="15-digit GSTIN"
                  className="fr8x-input text-[10px] font-mono"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1">4. PAN Number *</label>
                <input
                  type="text"
                  required
                  value={panNum}
                  onChange={(e) => setPanNum(e.target.value)}
                  placeholder="10-digit PAN"
                  className="fr8x-input text-[10px] font-mono"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="fr8x-label block mb-1">5. Company Address *</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Full Registered Office Address"
                  className="fr8x-input text-[10px]"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1">6. Country *</label>
                <input
                  type="text"
                  required
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g. India"
                  className="fr8x-input text-[10px]"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1">7. City *</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="fr8x-input text-[10px]"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1">8. Contact Person *</label>
                <input
                  type="text"
                  required
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="Full Name of Primary Officer"
                  className="fr8x-input text-[10px]"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1">9. Phone Number *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 9876543210"
                  className="fr8x-input text-[10px]"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1">10. Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="corporate@company.com"
                  className="fr8x-input text-[10px]"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1">11. Company Website</label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.company.com"
                  className="fr8x-input text-[10px]"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1">12. Business Type *</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="fr8x-input text-[10px]"
                  required
                >
                  <option value="">Select Business Category</option>
                  <option value="Freight Forwarder">Freight Forwarder</option>
                  <option value="NVOCC">NVOCC</option>
                  <option value="Customs Broker">Customs Broker / CHA</option>
                  <option value="Transporter / Fleet Owner">Transporter / Fleet Owner</option>
                  <option value="3PL / Warehouse Operator">3PL / Warehouse Operator</option>
                  <option value="Shipper / Exporter-Importer">Shipper / Exporter-Importer</option>
                </select>
              </div>
              <div>
                <label className="fr8x-label block mb-1">13. Years in Business *</label>
                <input
                  type="number"
                  required
                  value={yearsInBusiness}
                  onChange={(e) => setYearsInBusiness(e.target.value)}
                  placeholder="e.g. 10"
                  className="fr8x-input text-[10px]"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1">14. Number of Employees *</label>
                <select
                  value={employees}
                  onChange={(e) => setEmployees(e.target.value)}
                  className="fr8x-input text-[10px]"
                  required
                >
                  <option value="">Select Employee Range</option>
                  <option value="1-10">1-10 Employees</option>
                  <option value="11-50">11-50 Employees</option>
                  <option value="51-200">51-200 Employees</option>
                  <option value="201-500">201-500 Employees</option>
                  <option value="500+">500+ Employees</option>
                </select>
              </div>
              <div>
                <label className="fr8x-label block mb-1">15. Annual Turnover *</label>
                <select
                  value={annualTurnover}
                  onChange={(e) => setAnnualTurnover(e.target.value)}
                  className="fr8x-input text-[10px]"
                  required
                >
                  <option value="">Select Revenue Bracket</option>
                  <option value="Under ₹1 Crore">Under ₹1 Crore</option>
                  <option value="₹1 Crore - ₹10 Crore">₹1 Crore - ₹10 Crore</option>
                  <option value="₹10 Crore - ₹50 Crore">₹10 Crore - ₹50 Crore</option>
                  <option value="₹50 Crore - ₹250 Crore">₹50 Crore - ₹250 Crore</option>
                  <option value="₹250 Crore+">₹250 Crore+</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="fr8x-btn-secondary text-[10px]"
            >
              Cancel
            </button>
            <Button
              type="submit"
              isLoading={isSaving}
              loadingText="Submitting to GodMode..."
              className="fr8x-btn-primary text-[10px] px-4 py-1.5"
            >
              Submit for GodMode Review
            </Button>
          </div>
        </form>
      ) : (
        /* READ-ONLY DASHBOARD */
        <div className="fr8x-card p-4 bg-white border border-slate-200 rounded-lg space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="text-[12px] font-bold text-slate-900">{company?.name}</h2>
            <span className="text-[10px] font-mono text-[var(--fr8x-periwinkle)] font-bold">{company?.publicId}</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-[10px]">
            <div><span className="font-bold text-slate-500">Reg No:</span> {company?.registrationNumber}</div>
            <div><span className="font-bold text-slate-500">GST:</span> {company?.gstNumber}</div>
            <div><span className="font-bold text-slate-500">PAN:</span> {company?.panNumber}</div>
            <div><span className="font-bold text-slate-500">Contact:</span> {company?.contactPerson}</div>
            <div><span className="font-bold text-slate-500">Phone:</span> {company?.phone}</div>
            <div><span className="font-bold text-slate-500">Email:</span> {company?.email}</div>
            <div><span className="font-bold text-slate-500">City:</span> {company?.city}, {company?.country}</div>
            <div><span className="font-bold text-slate-500">Type:</span> {company?.businessType}</div>
            <div><span className="font-bold text-slate-500">Experience:</span> {company?.yearsInBusiness} Years</div>
            <div><span className="font-bold text-slate-500">Employees:</span> {company?.employees}</div>
            <div><span className="font-bold text-slate-500">Turnover:</span> {company?.annualTurnover}</div>
            <div><span className="font-bold text-slate-500">Website:</span> {company?.website || "N/A"}</div>
          </div>
        </div>
      )}
    </div>
  );
}
