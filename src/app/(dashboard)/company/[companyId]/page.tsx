// FR8X-CON Public Company Profile View Page
// Dynamically resolves handles (e.g. @COMP-0001) and raw IDs, displaying verified details and employee rosters.

"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Building2, ShieldCheck, MapPin, FileText, Calendar, Loader2, ArrowLeft, Users } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { COLLECTIONS, ROUTES } from "@/lib/utils/constants";
import { getDocument, queryDocuments, where, limit } from "@/lib/firebase/firestore";
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

type EmployeeProfile = {
  id: string;
  userId: string;
  fullName: string;
  designation: string;
  location: string;
  photoURL: string | null;
  publicId?: string;
};

export default function PublicCompanyPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true);

  const decodedCompanyId = decodeURIComponent(companyId);

  const loadCompanyData = useCallback(async () => {
    setIsLoading(true);
    try {
      // 1. Resolve company by public ID handle or raw ID
      let resolvedComp: CompanyInfo | null = null;
      if (decodedCompanyId.startsWith("@")) {
        const results = await queryDocuments<CompanyInfo>(COLLECTIONS.COMPANIES, [
          where("publicId", "==", decodedCompanyId),
        ]);
        if (results.length > 0) resolvedComp = results[0] || null;
      } else {
        resolvedComp = await getDocument<CompanyInfo>(COLLECTIONS.COMPANIES, decodedCompanyId);
      }

      if (!resolvedComp) {
        setIsLoading(false);
        return;
      }

      setCompany(resolvedComp);

      // 2. Fetch employees working at this company
      setIsLoadingEmployees(true);
      try {
        const employeeList = await queryDocuments<EmployeeProfile>(COLLECTIONS.PROFILES, [
          where("companyId", "==", resolvedComp.id),
        ]);
        setEmployees(employeeList);
      } catch (err) {
        console.error("Error fetching company employees:", err);
      } finally {
        setIsLoadingEmployees(false);
      }
    } catch (err) {
      console.error("Error loading public company details:", err);
    } finally {
      setIsLoading(false);
    }
  }, [decodedCompanyId]);

  useEffect(() => {
    loadCompanyData();
  }, [loadCompanyData]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--fr8x-periwinkle)]" />
          <span className="text-body-sm text-foreground-secondary">Loading company data...</span>
        </div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="fr8x-card p-8 text-center max-w-md mx-auto my-12 bg-white">
        <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-2" />
        <h2 className="text-body-lg font-bold text-[var(--fr8x-jet)]">Company Not Found</h2>
        <p className="text-caption text-foreground-muted mt-1">
          The requested company profile does not exist or has been deactivated.
        </p>
        <Button onClick={() => router.push(ROUTES.FEEDS)} className="mt-4 fr8x-btn-primary">
          Back to Feed
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--fr8x-bg)] py-4">
      {/* Back link */}
      <div className="fr8x-container mb-3">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-[10px] text-foreground-secondary hover:text-[var(--fr8x-jet)] hover:underline"
        >
          <ArrowLeft className="h-3 w-3" /> Back
        </button>
      </div>

      {/* Header card banner */}
      <div className="fr8x-container mb-4">
        <div className="bg-white fr8x-card p-5 flex flex-col md:flex-row items-center md:items-start gap-4">
          <div className="w-20 h-20 bg-slate-900 border border-slate-700 rounded flex items-center justify-center text-white text-display-lg font-bold shrink-0 overflow-hidden">
            {company.logoURL ? (
              <img src={company.logoURL} alt={company.name} className="w-full h-full object-cover" />
            ) : (
              company.name.charAt(0)
            )}
          </div>

          <div className="flex-1 text-center md:text-left space-y-1">
            <div className="flex items-center justify-center md:justify-start gap-1.5 flex-wrap">
              <h1 className="text-heading-lg font-bold text-[var(--fr8x-jet)]">{company.name}</h1>
              {company.verified && (
                <span className="bg-emerald-50 text-emerald-700 p-0.5 rounded-full" title="Verified Logistics Partner">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-600 fill-emerald-100 shrink-0" />
                </span>
              )}
            </div>
            {company.publicId && (
              <p className="text-[10px] text-[var(--fr8x-periwinkle)] font-medium font-mono">
                {company.publicId}
              </p>
            )}
            <p className="text-caption text-foreground-secondary">{company.industry}</p>
            <p className="text-caption text-foreground-secondary flex items-center justify-center md:justify-start gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              {company.region ? `${company.region}, ` : ""}{company.country}
            </p>
          </div>
        </div>
      </div>

      {/* Main grids */}
      <div className="fr8x-container grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Side: Corporate credentials & business info */}
        <div className="lg:col-span-2 space-y-4">
          {/* Business identity */}
          <div className="fr8x-card p-4 bg-white space-y-3">
            <h3 className="text-body-sm font-semibold text-[var(--fr8x-jet)] border-b border-border pb-1">
              Corporate Credentials
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-caption">
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground-secondary">GSTN Number</p>
                  <p className="text-[var(--fr8x-jet)] font-mono">{company.gstn || "Verified Business"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground-secondary">PAN Number</p>
                  <p className="text-[var(--fr8x-jet)] font-mono">{company.pan || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground-secondary">CIN Number</p>
                  <p className="text-[var(--fr8x-jet)] font-mono">{company.cin || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground-secondary">IEC import/export Code</p>
                  <p className="text-[var(--fr8x-jet)] font-mono">{company.iec || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground-secondary">Business Registration No.</p>
                  <p className="text-[var(--fr8x-jet)]">{company.businessRegistrationNumber || "—"}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Calendar className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-foreground-secondary">Year Established / Type</p>
                  <p className="text-[var(--fr8x-jet)]">{company.yearEstablished || "—"} ({company.companyType || "Standard"})</p>
                </div>
              </div>
            </div>
          </div>

          {/* About section */}
          {company.about && (
            <div className="fr8x-card p-4 bg-white space-y-2">
              <h3 className="text-body-sm font-semibold text-[var(--fr8x-jet)]">About the Company</h3>
              <p className="text-body-sm text-[var(--fr8x-jet)] leading-relaxed whitespace-pre-line">
                {company.about}
              </p>
            </div>
          )}
        </div>

        {/* Right Side: Employees roster */}
        <div className="lg:col-span-1 space-y-4">
          <div className="fr8x-card p-4 bg-white">
            <h3 className="text-body-sm font-semibold text-[var(--fr8x-jet)] mb-3 flex items-center gap-1.5 border-b border-border pb-1.5">
              <Users className="h-4 w-4 text-[var(--fr8x-periwinkle)]" />
              <span>Network Professionals ({employees.length})</span>
            </h3>

            {isLoadingEmployees ? (
              <div className="flex justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              </div>
            ) : employees.length === 0 ? (
              <p className="text-caption text-foreground-muted italic text-center py-4">
                No active professionals found for this company.
              </p>
            ) : (
              <div className="divide-y divide-border max-h-[300px] overflow-y-auto pr-1">
                {employees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => router.push(ROUTES.PROFILE_VIEW(emp.userId))}
                    className="py-2 flex items-center gap-2.5 cursor-pointer hover:bg-[var(--fr8x-mist)] rounded px-1.5 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-[var(--fr8x-lavender)] flex items-center justify-center text-body-sm font-semibold text-[var(--fr8x-jet)] shrink-0 overflow-hidden border border-slate-200">
                      {emp.photoURL ? (
                        <img src={emp.photoURL} alt={emp.fullName} className="w-full h-full object-cover" />
                      ) : (
                        emp.fullName.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-left">
                      <p className="text-[11px] font-bold text-[var(--fr8x-jet)] truncate">{emp.fullName}</p>
                      <p className="text-[9px] text-foreground-secondary truncate">{emp.designation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
