"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  User,
  Building2,
  Camera,
  Briefcase,
  GraduationCap,
  Tag,
  CheckCircle2,
  Sparkles,
  Plus,
  Trash2,
  Save,
  Loader2,
  Upload,
  MapPin,
  ShieldCheck,
  Eye,
  Crop,
  Globe,
  FileText,
  Award,
  Truck,
  Warehouse,
  Compass,
  Check,
  FileCheck,
  ShieldAlert,
  Palette,
  FileUp,
  Anchor,
} from "lucide-react";
import { uploadFileWithProgress } from "@/lib/firebase/storage";
import { compressAndOptimizeImage } from "@/lib/utils/imageOptimizer";

import { ImageCropModal } from "./ImageCropModal";

export type WorkExpItem = { id: string; company: string; location: string; designation: string; from: string; to: string; roleDescription?: string };
export type EduItem = { id: string; college: string; stream: string; from: string; to: string };
export type CertItem = { id: string; title: string; issuer: string; year: string };
export type KYCDocItem = { id: string; docType: "gstin" | "iec" | "pan" | "iso" | "customs"; title: string; fileName: string; status: "verified" | "pending" | "uploaded" };

export type UserProfileForm = {
  fullName: string;
  companyName: string;
  designation: string;
  location: string;
  country: string;
  about: string;
  industryTags: string[];
  photoURL: string | null;
  companyLogoURL: string | null;
  publicId: string;
  workExperience: WorkExpItem[];
  education: EduItem[];
  certifications?: CertItem[];
  kycDocuments?: KYCDocItem[];
  gstin?: string;
  iec?: string;
  iataNo?: string;
  fiataNo?: string;
  fmcNo?: string;
  aeoStatus?: string;
  fleetSize?: string;
  warehouseCapacity?: string;
  keyTradeLanes?: string;
  website?: string;
  cardTheme?: "slate" | "indigo" | "emerald" | "amber" | "dark";
  privacySetting?: "public" | "connections_only";
};

interface EnhancedProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: UserProfileForm;
  onSave: (data: UserProfileForm) => Promise<void>;
  userId: string;
}

const CATEGORIZED_SPECIALIZATIONS = [
  {
    category: "Ocean & Sea Freight",
    items: ["Ocean Freight (FCL)", "Ocean Freight (LCL)", "NVOCC Services", "Breakbulk & Chartering", "Reefer / Cold Chain Sea"],
  },
  {
    category: "Air Freight & Express",
    items: ["Air Freight Express", "Charter Flight Ops", "IATA Cargo Agent", "AOG / Urgent Express"],
  },
  {
    category: "Customs & Clearance",
    items: ["Customs House Brokerage (CHA)", "AEO Certified Clearance", "Bonded Warehousing", "SVB / High-Sea Sales"],
  },
  {
    category: "Surface & Multimodal",
    items: ["Cross-Border Trucking", "FTL / LTL Surface", "Heavy Lift & Project Cargo", "Dangerous Goods (DG Cargo)"],
  },
  {
    category: "Warehousing & Supply Chain",
    items: ["Warehousing & Fulfillment", "3PL / 4PL Contract Logistics", "Inventory Management", "Reverse Logistics"],
  },
];

const MAJOR_PORTS = [
  "JNPT Mumbai (INNSA)", "Mundra Port (INMUN)", "Chennai Port (INMAA)",
  "Dubai Jebel Ali (AEJEA)", "Singapore (SGSIN)", "Shanghai (CNSHA)",
  "Rotterdam (NLRTM)", "Hamburg (DEHAM)", "Los Angeles (USLAX)",
];

const CARD_THEMES = [
  { id: "indigo", name: "Royal Indigo", bg: "from-indigo-950 via-slate-900 to-slate-950", accent: "text-indigo-400", border: "border-indigo-500/30" },
  { id: "slate", name: "Midnight Slate", bg: "from-slate-900 via-slate-950 to-slate-900", accent: "text-slate-300", border: "border-slate-700" },
  { id: "emerald", name: "Emerald Gold", bg: "from-emerald-950 via-slate-950 to-slate-900", accent: "text-emerald-400", border: "border-emerald-500/30" },
  { id: "amber", name: "Enterprise Amber", bg: "from-amber-950 via-slate-950 to-slate-900", accent: "text-amber-400", border: "border-amber-500/30" },
  { id: "dark", name: "Obsidian Noir", bg: "from-black via-slate-950 to-black", accent: "text-purple-400", border: "border-purple-500/30" },
];

export function EnhancedProfileEditModal({
  isOpen,
  onClose,
  initialData,
  onSave,
  userId,
}: EnhancedProfileEditModalProps) {
  const [activeSection, setActiveSection] = useState<"basic" | "company" | "branding" | "experience" | "education" | "tags">("basic");
  const [formData, setFormData] = useState<UserProfileForm>({
    cardTheme: "indigo",
    certifications: [],
    kycDocuments: [],
    ...initialData,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);
  const [previewTab, setPreviewTab] = useState<"card" | "credentials" | "lanes">("card");

  // File refs & upload progress
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [photoProgress, setPhotoProgress] = useState(0);
  const [logoProgress, setLogoProgress] = useState(0);

  const [isSavedState, setIsSavedState] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [showUnsavedPrompt, setShowUnsavedPrompt] = useState(false);

  // Esc key listener with unsaved changes prompt
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        setShowUnsavedPrompt(true);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    setFormData({
      cardTheme: "indigo",
      certifications: [],
      kycDocuments: [],
      ...initialData,
    });
  }, [initialData]);

  if (!isOpen) return null;

  // Calculate Profile Completion Percentage & Breakdown
  const calculateCompletionDetails = () => {
    const breakdown = [
      { key: "basic", name: "Personal Bio", met: Boolean(formData.fullName?.trim() && formData.designation?.trim() && formData.location?.trim()), weight: 20 },
      { key: "company", name: "Enterprise KYC", met: Boolean(formData.companyName?.trim() && (formData.gstin || formData.iec)), weight: 20 },
      { key: "branding", name: "Visual Identity", met: Boolean(formData.photoURL || formData.companyLogoURL), weight: 20 },
      { key: "experience", name: "Work History", met: Boolean(formData.workExperience && formData.workExperience.length > 0), weight: 15 },
      { key: "education", name: "Academic / Certs", met: Boolean((formData.education && formData.education.length > 0) || (formData.certifications && formData.certifications.length > 0)), weight: 10 },
      { key: "tags", name: "Trade Tags", met: Boolean(formData.industryTags && formData.industryTags.length >= 2), weight: 15 },
    ];

    const totalScore = breakdown.reduce((acc, curr) => (curr.met ? acc + curr.weight : acc), 0);
    return { score: Math.min(100, totalScore), breakdown };
  };

  const { score: completionScore, breakdown: completionBreakdown } = calculateCompletionDetails();

  const getStrengthBadge = (score: number) => {
    if (score >= 80) return { label: "Elite Enterprise Identity", color: "bg-emerald-500/10 text-emerald-700 border-emerald-300" };
    if (score >= 50) return { label: "Verified Partner Profile", color: "bg-indigo-500/10 text-indigo-700 border-indigo-300" };
    return { label: "Basic Profile", color: "bg-amber-500/10 text-amber-700 border-amber-300" };
  };

  const strengthBadge = getStrengthBadge(completionScore);
  const activeThemeConfig = (CARD_THEMES.find((t) => t.id === (formData.cardTheme || "indigo")) || CARD_THEMES[0])!;

  // Photo & Logo Upload Handlers
  const handlePhotoSelect = async (file: File) => {
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      const compressedDataUrl = await compressAndOptimizeImage(file, 600, 600, 0.75);
      setCropImageSrc(compressedDataUrl);
      setShowCropModal(true);
      
      try {
        const path = `profiles/${userId}/photo_${Date.now()}`;
        const url = await uploadFileWithProgress(path, file, (p) => setPhotoProgress(Math.round(p)));
        setCropImageSrc(url);
      } catch {
        /* Keep compressed data URL fallback */
      }
    } catch (err) {
      console.warn("Photo compression warning:", err);
    } finally {
      setIsUploadingPhoto(false);
      setPhotoProgress(0);
    }
  };

  const handleLogoSelect = async (file: File) => {
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const compressedDataUrl = await compressAndOptimizeImage(file, 600, 600, 0.75);
      setFormData((prev) => ({ ...prev, companyLogoURL: compressedDataUrl }));

      try {
        const path = `companies/${userId}/logo_${Date.now()}`;
        const url = await uploadFileWithProgress(path, file, (p) => setLogoProgress(Math.round(p)));
        setFormData((prev) => ({ ...prev, companyLogoURL: url }));
      } catch {
        /* Keep compressed data URL fallback */
      }
    } catch (err) {
      console.warn("Logo compression warning:", err);
    } finally {
      setIsUploadingLogo(false);
      setLogoProgress(0);
    }
  };

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      industryTags: prev.industryTags.includes(tag)
        ? prev.industryTags.filter((t) => t !== tag)
        : [...prev.industryTags, tag],
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      setIsSavedState(true);
      setTimeout(() => {
        setIsSavedState(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto text-left font-sans">
      {/* Hidden file inputs */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f); e.target.value = ""; }}
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoSelect(f); e.target.value = ""; }}
      />

      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-6xl max-h-[94vh] flex flex-col overflow-hidden text-left transition-all">
        {/* Top Header - Sleek Enterprise Studio Theme */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-950 text-white flex items-center justify-between border-b border-indigo-500/20 shadow-md shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl text-white shadow-lg shadow-indigo-500/30 border border-white/20 shrink-0">
              <Sparkles className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold tracking-tight text-white leading-snug">Enterprise Profile Studio</h2>
                <span className="text-[10px] uppercase tracking-wider font-black px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  PRO STUDIO 3.0
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">Configure your B2B enterprise identity, trade credentials &amp; logistics capabilities</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                showLivePreview
                  ? "bg-indigo-600/30 text-indigo-200 border-indigo-500/40 shadow-inner"
                  : "bg-slate-800/80 hover:bg-slate-800 text-slate-300 border-slate-700"
              }`}
            >
              <Eye className="h-4.5 w-4.5 text-indigo-400" />
              <span className="hidden sm:inline">{showLivePreview ? "Hide B2B Card Preview" : "Show B2B Card Preview"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-800/80 p-2 rounded-xl transition-all"
              title="Close Profile Studio"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Completion Progress & Strength Bar */}
        <div className="bg-slate-900/95 text-slate-200 px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4.5 w-4.5 text-emerald-400" />
              <span className="font-semibold text-slate-300">Profile Strength:</span>
              <span className="font-bold text-emerald-400">{completionScore}% Complete</span>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${strengthBadge.color}`}>
              {strengthBadge.label}
            </span>
          </div>

          <div className="flex items-center gap-3 min-w-[240px] flex-1 max-w-md">
            <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/80 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-500 shadow-sm"
                style={{ width: `${completionScore}%` }}
              />
            </div>
          </div>

          <div className="hidden xl:flex items-center gap-3 text-[11px] text-slate-400">
            {completionBreakdown.map((item) => (
              <span
                key={item.key}
                className={`flex items-center gap-1 font-medium ${item.met ? "text-emerald-400 font-semibold" : "text-slate-500 opacity-75"}`}
              >
                {item.met ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <div className="h-2 w-2 rounded-full bg-slate-700" />}
                {item.name}
              </span>
            ))}
          </div>
        </div>

        {/* Main Body: Navigation Sidebar + Form Controls + Live Card Preview */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Navigation Sidebar */}
          <div className="w-full lg:w-64 bg-slate-900 text-slate-300 border-r border-slate-800 p-3 space-y-1.5 overflow-y-auto shrink-0">
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider font-black text-slate-400">
              Studio Configuration
            </div>
            {[
              { id: "basic", label: "Basic Info & Bio", icon: User, desc: "Personal & contact details" },
              { id: "company", label: "Company & KYC", icon: Building2, desc: "GSTIN, IEC, licenses" },
              { id: "branding", label: "Visual Identity", icon: Camera, desc: "Avatar & company logo" },
              { id: "experience", label: "Work Experience", icon: Briefcase, desc: "Career timeline" },
              { id: "education", label: "Education & Certs", icon: GraduationCap, desc: "Diplomas & accreditation" },
              { id: "tags", label: "Logistics Tags", icon: Tag, desc: "Specializations & ports" },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              const isSectionMet = completionBreakdown.find((b) => b.key === tab.id)?.met;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSection(tab.id as any)}
                  className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all ${
                    isActive
                      ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 text-white shadow-xl shadow-indigo-600/30 font-bold"
                      : "text-slate-300 hover:bg-slate-800/70 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${isActive ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"}`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-snug">{tab.label}</p>
                      <p className={`text-[10px] font-medium leading-tight ${isActive ? "text-indigo-200" : "text-slate-500"}`}>{tab.desc}</p>
                    </div>
                  </div>
                  {isSectionMet && (
                    <CheckCircle2 className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-emerald-400"}`} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Form Content Area */}
          <div className="flex-1 p-5 sm:p-6 overflow-y-auto space-y-6 bg-slate-50/50">
            <form onSubmit={handleFormSubmit} className="space-y-6">
              {/* TAB 1: BASIC INFO */}
              {activeSection === "basic" && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <User className="h-5 w-5 text-indigo-600" /> Executive &amp; Personal Profile
                      </h3>
                      <p className="text-xs text-slate-500">Provide your personal enterprise details for trade partners.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="fr8x-label block mb-1">Full Name *</label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="e.g. Rajat Kumar Rai"
                          className="fr8x-input pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="fr8x-label block mb-1">Professional Designation *</label>
                      <div className="relative">
                        <Briefcase className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          value={formData.designation}
                          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                          placeholder="e.g. Managing Director / VP Freight Ops"
                          className="fr8x-input pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="fr8x-label block mb-1">City / Base Station *</label>
                      <div className="relative">
                        <MapPin className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          value={formData.location}
                          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                          placeholder="e.g. Mumbai / JNPT Region"
                          className="fr8x-input pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="fr8x-label block mb-1">Country</label>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          placeholder="e.g. India"
                          className="fr8x-input pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="fr8x-label block mb-1">Executive Bio &amp; Capability Summary</label>
                    <div className="relative">
                      <FileText className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <textarea
                        value={formData.about}
                        onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                        rows={4}
                        placeholder="Highlight your trade experience, key trade lanes handled, and specialized freight solutions..."
                        className="fr8x-input pl-10 resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: COMPANY & COMPLIANCE */}
              {activeSection === "company" && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-indigo-600" /> Enterprise &amp; Trade KYC Compliance
                    </h3>
                    <p className="text-xs text-slate-500">Add corporate tax IDs and international trade licenses to boost B2B trust.</p>
                  </div>

                  <div>
                    <label className="fr8x-label block mb-1">Registered Corporate Enterprise Name *</label>
                    <div className="relative">
                      <Building2 className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        value={formData.companyName}
                        onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                        placeholder="e.g. Cogoport Logistics Private Limited"
                        className="fr8x-input pl-10"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="fr8x-label block mb-1">GSTIN / Tax ID</label>
                      <div className="relative">
                        <ShieldCheck className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          value={formData.gstin || ""}
                          onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                          placeholder="e.g. 27AAAAA0000A1Z5"
                          className="fr8x-input pl-10 font-mono uppercase"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="fr8x-label block mb-1">Import Export Code (IEC)</label>
                      <div className="relative">
                        <FileCheck className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          value={formData.iec || ""}
                          onChange={(e) => setFormData({ ...formData, iec: e.target.value })}
                          placeholder="e.g. 0512345678"
                          className="fr8x-input pl-10 font-mono uppercase"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="fr8x-label block mb-1">IATA Reg. No.</label>
                      <input
                        value={formData.iataNo || ""}
                        onChange={(e) => setFormData({ ...formData, iataNo: e.target.value })}
                        placeholder="e.g. 14-3 9999"
                        className="fr8x-input font-mono"
                      />
                    </div>
                    <div>
                      <label className="fr8x-label block mb-1">FIATA License No.</label>
                      <input
                        value={formData.fiataNo || ""}
                        onChange={(e) => setFormData({ ...formData, fiataNo: e.target.value })}
                        placeholder="e.g. FIATA-IN-889"
                        className="fr8x-input font-mono"
                      />
                    </div>
                    <div>
                      <label className="fr8x-label block mb-1">FMC / NVOCC Bond</label>
                      <input
                        value={formData.fmcNo || ""}
                        onChange={(e) => setFormData({ ...formData, fmcNo: e.target.value })}
                        placeholder="e.g. FMC Org #02941"
                        className="fr8x-input font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="fr8x-label block mb-1">Official Web Address</label>
                      <div className="relative">
                        <Globe className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          value={formData.website || ""}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="e.g. https://www.enterprise-freight.com"
                          className="fr8x-input pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="fr8x-label block mb-1">AEO Certification Status</label>
                      <select
                        value={formData.aeoStatus || "None"}
                        onChange={(e) => setFormData({ ...formData, aeoStatus: e.target.value })}
                        className="fr8x-input"
                      >
                        <option value="None">None / In Process</option>
                        <option value="AEO-T1">AEO-T1 (Tier 1 Verified)</option>
                        <option value="AEO-T2">AEO-T2 (Tier 2 Certified)</option>
                        <option value="AEO-LO">AEO-LO (Logistics Operator)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="fr8x-label block mb-1">Fleet / Container Asset Capacity</label>
                      <div className="relative">
                        <Truck className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          value={formData.fleetSize || ""}
                          onChange={(e) => setFormData({ ...formData, fleetSize: e.target.value })}
                          placeholder="e.g. 150+ Heavy Trailers, 500+ TEUs"
                          className="fr8x-input pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="fr8x-label block mb-1">Warehousing Space (SQFT)</label>
                      <div className="relative">
                        <Warehouse className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                        <input
                          value={formData.warehouseCapacity || ""}
                          onChange={(e) => setFormData({ ...formData, warehouseCapacity: e.target.value })}
                          placeholder="e.g. 250,000 SQFT Bonded Warehouse"
                          className="fr8x-input pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="fr8x-label block mb-1">Primary Global Trade Lanes</label>
                    <div className="relative">
                      <Compass className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                      <input
                        value={formData.keyTradeLanes || ""}
                        onChange={(e) => setFormData({ ...formData, keyTradeLanes: e.target.value })}
                        placeholder="e.g. India-Middle East, Asia-US West Coast, Europe-ISC"
                        className="fr8x-input pl-10"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: LOGO & AVATAR BRANDING */}
              {activeSection === "branding" && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="border-b border-slate-200 pb-3">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <Camera className="h-5 w-5 text-indigo-600" /> Visual Identity &amp; Branding Studio
                    </h3>
                    <p className="text-xs text-slate-500">Upload high-resolution corporate logo and executive avatar image.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Executive Avatar Uploader */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handlePhotoSelect(file);
                      }}
                      className="p-5 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-3xl text-center space-y-4 bg-white shadow-xs transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <User className="h-4 w-4 text-indigo-600" /> Avatar Picture
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${formData.photoURL ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-300'}`}>
                          {formData.photoURL ? 'Custom Active' : 'Default'}
                        </span>
                      </div>

                      <div
                        onClick={() => {
                          if (formData.photoURL) {
                            setCropImageSrc(formData.photoURL);
                            setShowCropModal(true);
                          } else {
                            photoInputRef.current?.click();
                          }
                        }}
                        className="relative w-32 h-32 mx-auto rounded-full bg-slate-100 border-4 border-white shadow-lg overflow-hidden flex items-center justify-center group cursor-pointer hover:scale-105 transition-all ring-2 ring-indigo-500/20"
                      >
                        {formData.photoURL ? (
                          <img src={formData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-14 w-14 text-slate-400" />
                        )}
                        {isUploadingPhoto && (
                          <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center text-white text-xs font-bold">
                            <Loader2 className="h-6 w-6 animate-spin mb-1 text-indigo-400" />
                            {photoProgress}%
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-bold transition-opacity gap-1">
                          <Crop className="h-5 w-5 text-indigo-300" />
                          <span>{formData.photoURL ? "Crop / Adjust" : "Upload Picture"}</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500">
                        Drag &amp; drop profile image here or click below (PNG, JPG, WebP)
                      </p>

                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 border border-slate-300 transition-all"
                        >
                          <Upload className="h-4 w-4 text-slate-600" /> {formData.photoURL ? "Change Avatar Image" : "Upload Avatar Image"}
                        </button>

                        {formData.photoURL && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCropImageSrc(formData.photoURL);
                                setShowCropModal(true);
                              }}
                              className="flex-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Crop className="h-3.5 w-3.5 text-indigo-600" /> Crop / Zoom
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, photoURL: null }))}
                              className="flex-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-600" /> Remove
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Company Logo Uploader */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleLogoSelect(file);
                      }}
                      className="p-5 border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-3xl text-center space-y-4 bg-white shadow-xs transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Building2 className="h-4 w-4 text-indigo-600" /> Company Logo Banner
                        </span>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${formData.companyLogoURL ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-slate-100 text-slate-600 border-slate-300'}`}>
                          {formData.companyLogoURL ? 'Logo Active' : 'Default'}
                        </span>
                      </div>

                      <div
                        onClick={() => logoInputRef.current?.click()}
                        className="relative w-32 h-32 mx-auto rounded-2xl bg-slate-50 border-2 border-slate-200 shadow-md overflow-hidden flex items-center justify-center p-3 group cursor-pointer hover:scale-105 transition-all ring-2 ring-indigo-500/20"
                      >
                        {formData.companyLogoURL ? (
                          <img src={formData.companyLogoURL} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <Building2 className="h-14 w-14 text-indigo-500/80" />
                        )}
                        {isUploadingLogo && (
                          <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center text-white text-xs font-bold">
                            <Loader2 className="h-6 w-6 animate-spin mb-1 text-indigo-400" />
                            {logoProgress}%
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white text-xs font-bold transition-opacity gap-1">
                          <Upload className="h-5 w-5 text-indigo-300" />
                          <span>Upload Corporate Logo</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500">
                        Drag &amp; drop official company logo here or click below
                      </p>

                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 border border-slate-300 transition-all"
                        >
                          <Upload className="h-4 w-4 text-slate-600" /> {formData.companyLogoURL ? "Change Corporate Logo" : "Upload Corporate Logo"}
                        </button>

                        {formData.companyLogoURL && (
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, companyLogoURL: null }))}
                            className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5 text-rose-600" /> Remove Corporate Logo
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: WORK EXPERIENCE */}
              {activeSection === "experience" && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-indigo-600" /> Professional Experience Timeline
                      </h3>
                      <p className="text-xs text-slate-500">Document your career history in global freight and logistics.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          workExperience: [
                            ...(formData.workExperience || []),
                            { id: `we_${Date.now()}`, company: "", location: "", designation: "", from: "", to: "" },
                          ],
                        })
                      }
                      className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl shadow-md transition-all"
                    >
                      <Plus className="h-4 w-4" /> Add Position
                    </button>
                  </div>

                  {(!formData.workExperience || formData.workExperience.length === 0) ? (
                    <div className="p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300 text-slate-500 space-y-2">
                      <Briefcase className="h-8 w-8 text-slate-400 mx-auto" />
                      <p className="text-xs font-semibold">No work experience added yet.</p>
                      <p className="text-[11px] text-slate-400">Click &quot;Add Position&quot; above to list your career background.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {formData.workExperience.map((we, idx) => (
                        <div key={we.id} className="p-5 border border-slate-200 bg-white rounded-2xl shadow-xs space-y-4 relative group">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <span className="text-xs font-bold text-indigo-700 flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-extrabold">
                                {idx + 1}
                              </span>
                              Career Position
                            </span>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, workExperience: formData.workExperience.filter((item) => item.id !== we.id) })}
                              className="text-rose-500 hover:text-rose-700 text-xs font-semibold flex items-center gap-1 p-1 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Company / Enterprise</label>
                              <input
                                value={we.company}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    workExperience: formData.workExperience.map((item) => (item.id === we.id ? { ...item, company: e.target.value } : item)),
                                  })
                                }
                                placeholder="e.g. DHL Global Forwarding"
                                className="fr8x-input text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Designation / Role</label>
                              <input
                                value={we.designation}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    workExperience: formData.workExperience.map((item) => (item.id === we.id ? { ...item, designation: e.target.value } : item)),
                                  })
                                }
                                placeholder="e.g. Senior Ocean Freight Manager"
                                className="fr8x-input text-xs"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 block mb-1">Location</label>
                              <input
                                value={we.location}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    workExperience: formData.workExperience.map((item) => (item.id === we.id ? { ...item, location: e.target.value } : item)),
                                  })
                                }
                                placeholder="e.g. Singapore"
                                className="fr8x-input text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 block mb-1">From Year</label>
                              <input
                                value={we.from}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    workExperience: formData.workExperience.map((item) => (item.id === we.id ? { ...item, from: e.target.value } : item)),
                                  })
                                }
                                placeholder="e.g. 2020"
                                className="fr8x-input text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-semibold text-slate-600 block mb-1">To Year</label>
                              <input
                                value={we.to}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    workExperience: formData.workExperience.map((item) => (item.id === we.id ? { ...item, to: e.target.value } : item)),
                                  })
                                }
                                placeholder="e.g. Present"
                                className="fr8x-input text-xs"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-600 block mb-1">Role Description</label>
                            <textarea
                              value={we.roleDescription || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  workExperience: formData.workExperience.map((item) => (item.id === we.id ? { ...item, roleDescription: e.target.value } : item)),
                                })
                              }
                              placeholder="Key achievements, volume handled (TEUs/tons), team size..."
                              rows={2}
                              className="fr8x-input text-xs resize-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: EDUCATION & CERTS */}
              {activeSection === "education" && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-indigo-600" /> Academic &amp; Trade Qualifications
                      </h3>
                      <p className="text-xs text-slate-500">Degree, logistics certifications, and industry diplomas.</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            education: [
                              ...(formData.education || []),
                              { id: `edu_${Date.now()}`, college: "", stream: "", from: "", to: "" },
                            ],
                          })
                        }
                        className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl shadow-md transition-all"
                      >
                        <Plus className="h-4 w-4" /> Add Degree
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            certifications: [
                              ...(formData.certifications || []),
                              { id: `cert_${Date.now()}`, title: "", issuer: "", year: "" },
                            ],
                          })
                        }
                        className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl shadow-md transition-all"
                      >
                        <Award className="h-4 w-4" /> Add Cert
                      </button>
                    </div>
                  </div>

                  {/* Academic Degrees */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-indigo-600" /> University Degrees &amp; Diplomas
                    </h4>
                    {(!formData.education || formData.education.length === 0) ? (
                      <p className="text-xs text-slate-400 bg-white p-4 rounded-xl border border-slate-200">No academic degrees added yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {formData.education.map((edu, idx) => (
                          <div key={edu.id} className="p-4 border border-slate-200 bg-white rounded-2xl shadow-xs space-y-3">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                              <span className="text-xs font-bold text-indigo-700">Degree #{idx + 1}</span>
                              <button
                                type="button"
                                onClick={() => setFormData({ ...formData, education: formData.education.filter((item) => item.id !== edu.id) })}
                                className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input
                                value={edu.college}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    education: formData.education.map((item) => (item.id === edu.id ? { ...item, college: e.target.value } : item)),
                                  })
                                }
                                placeholder="University / Institute Name"
                                className="fr8x-input text-xs"
                              />
                              <input
                                value={edu.stream}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    education: formData.education.map((item) => (item.id === edu.id ? { ...item, stream: e.target.value } : item)),
                                  })
                                }
                                placeholder="Degree / Specialization (e.g. MBA Supply Chain)"
                                className="fr8x-input text-xs"
                              />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <input
                                value={edu.from}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    education: formData.education.map((item) => (item.id === edu.id ? { ...item, from: e.target.value } : item)),
                                  })
                                }
                                placeholder="Start Year"
                                className="fr8x-input text-xs"
                              />
                              <input
                                value={edu.to}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    education: formData.education.map((item) => (item.id === edu.id ? { ...item, to: e.target.value } : item)),
                                  })
                                }
                                placeholder="End Year"
                                className="fr8x-input text-xs"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Certifications & Accreditation */}
                  <div className="space-y-3 pt-3 border-t border-slate-200">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <Award className="h-4 w-4 text-purple-600" /> Trade &amp; Professional Certifications
                    </h4>
                    {(!formData.certifications || formData.certifications.length === 0) ? (
                      <p className="text-xs text-slate-400 bg-white p-4 rounded-xl border border-slate-200">No professional certifications added yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {formData.certifications.map((cert) => (
                          <div key={cert.id} className="p-4 border border-purple-100 bg-purple-50/30 rounded-2xl shadow-xs space-y-3">
                            <div className="flex items-center justify-between border-b border-purple-100 pb-2">
                              <span className="text-xs font-bold text-purple-700">Certification Item</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    certifications: (formData.certifications || []).filter((item) => item.id !== cert.id),
                                  })
                                }
                                className="text-rose-500 hover:text-rose-700 text-xs font-semibold"
                              >
                                Remove
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <input
                                value={cert.title}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    certifications: (formData.certifications || []).map((item) => (item.id === cert.id ? { ...item, title: e.target.value } : item)),
                                  })
                                }
                                placeholder="Cert Title (e.g. Dangerous Goods Cat-6)"
                                className="fr8x-input text-xs"
                              />
                              <input
                                value={cert.issuer}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    certifications: (formData.certifications || []).map((item) => (item.id === cert.id ? { ...item, issuer: e.target.value } : item)),
                                  })
                                }
                                placeholder="Issuing Body (e.g. IATA / FIATA)"
                                className="fr8x-input text-xs"
                              />
                              <input
                                value={cert.year}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    certifications: (formData.certifications || []).map((item) => (item.id === cert.id ? { ...item, year: e.target.value } : item)),
                                  })
                                }
                                placeholder="Year Received"
                                className="fr8x-input text-xs"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: SPECIALIZATIONS */}
              {activeSection === "tags" && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="border-b border-slate-200 pb-3 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Tag className="h-5 w-5 text-indigo-600" /> Trade Specializations &amp; Port Network
                      </h3>
                      <p className="text-xs text-slate-500">Select all freight modalities and logistics services your company provides.</p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                      {formData.industryTags.length} Selected
                    </span>
                  </div>

                  <div className="space-y-5">
                    {CATEGORIZED_SPECIALIZATIONS.map((cat) => (
                      <div key={cat.category} className="space-y-2.5">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                          <span className="w-1.5 h-3.5 bg-indigo-600 rounded-full" />
                          {cat.category}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {cat.items.map((spec) => {
                            const selected = formData.industryTags.includes(spec);
                            return (
                              <button
                                key={spec}
                                type="button"
                                onClick={() => toggleTag(spec)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 border ${
                                  selected
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-md font-bold"
                                    : "bg-white text-slate-700 border-slate-300 hover:border-indigo-300 hover:bg-indigo-50/50"
                                }`}
                              >
                                {selected ? <Check className="h-3.5 w-3.5 text-white stroke-[3]" /> : <Plus className="h-3.5 w-3.5 text-slate-400" />}
                                {spec}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {/* Major Gateway Ports */}
                    <div className="space-y-2.5 pt-3 border-t border-slate-200">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                        <Anchor className="h-4 w-4 text-indigo-600" /> Key Gateway Ports Serviced
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {MAJOR_PORTS.map((port) => {
                          const selected = formData.industryTags.includes(port);
                          return (
                            <button
                              key={port}
                              type="button"
                              onClick={() => toggleTag(port)}
                              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1.5 border ${
                                selected
                                  ? "bg-slate-900 text-indigo-300 border-slate-800 font-bold"
                                  : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"
                              }`}
                            >
                              <Anchor className="h-3 w-3 text-slate-400" />
                              {port}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons Footer */}
              <div className="pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-500 font-medium">
                  {isSavedState ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Enterprise Profile Updated!
                    </span>
                  ) : (
                    <span>Changes will update across your B2B profile card instantly.</span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={isSaving || isSavedState}
                    className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all shadow-lg ${
                      isSavedState
                        ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
                        : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30"
                    }`}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : isSavedState ? (
                      <CheckCircle2 className="h-4 w-4 text-white" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>{isSavedState ? "Saved Successfully!" : "Save Profile Studio Changes"}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Side-by-Side Live B2B Preview Card */}
          {showLivePreview && (
            <div className="w-full lg:w-80 bg-slate-900 text-slate-100 p-5 border-l border-slate-800 space-y-4 overflow-y-auto shrink-0">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h4 className="text-xs uppercase tracking-wider font-extrabold text-indigo-400 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-indigo-400" /> Real-Time B2B Preview
                </h4>
                <span className="text-[10px] font-mono text-slate-400 font-bold">{formData.publicId || "@USER"}</span>
              </div>

              {/* Theme Switcher Bar */}
              <div className="flex items-center gap-1.5 justify-between bg-slate-950 p-2 rounded-xl border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                  <Palette className="h-3 w-3 text-indigo-400" /> Theme:
                </span>
                <div className="flex gap-1">
                  {CARD_THEMES.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, cardTheme: theme.id as any })}
                      className={`w-5 h-5 rounded-full border transition-all ${
                        (formData.cardTheme || "indigo") === theme.id ? "ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-110" : "opacity-70 hover:opacity-100"
                      } bg-gradient-to-tr ${theme.bg}`}
                      title={theme.name}
                    />
                  ))}
                </div>
              </div>

              {/* Preview Tab Selector */}
              <div className="flex rounded-xl bg-slate-800 p-1 border border-slate-700/80 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setPreviewTab("card")}
                  className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                    previewTab === "card" ? "bg-indigo-600 text-white font-bold shadow-xs" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Card
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("credentials")}
                  className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                    previewTab === "credentials" ? "bg-indigo-600 text-white font-bold shadow-xs" : "text-slate-400 hover:text-white"
                  }`}
                >
                  KYC
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("lanes")}
                  className={`flex-1 py-1.5 rounded-lg transition-all text-center ${
                    previewTab === "lanes" ? "bg-indigo-600 text-white font-bold shadow-xs" : "text-slate-400 hover:text-white"
                  }`}
                >
                  Lanes
                </button>
              </div>

              {/* Preview Content: Card View */}
              {previewTab === "card" && (
                <div className={`bg-gradient-to-b ${activeThemeConfig.bg} rounded-2xl border ${activeThemeConfig.border} overflow-hidden shadow-2xl space-y-0 text-slate-100`}>
                  {/* Top Banner / Logo */}
                  <div className="h-20 bg-black/40 p-3 relative flex items-end justify-end overflow-hidden border-b border-white/10">
                    {formData.companyLogoURL ? (
                      <img src={formData.companyLogoURL} alt="Logo preview" className="h-10 max-w-[120px] object-contain opacity-95 filter drop-shadow-md" />
                    ) : (
                      <Building2 className="h-12 w-12 text-white/10 absolute right-2 bottom-1" />
                    )}
                  </div>

                  <div className="p-4 space-y-3.5 relative pt-0">
                    {/* Avatar Overlap */}
                    <div className="-mt-10 flex items-end justify-between">
                      <div className="w-16 h-16 rounded-full bg-slate-900 border-4 border-slate-950 shadow-xl flex items-center justify-center font-extrabold text-xl text-indigo-400 overflow-hidden shrink-0">
                        {formData.photoURL ? (
                          <img src={formData.photoURL} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                          formData.fullName?.charAt(0) || "U"
                        )}
                      </div>
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-400" /> B2B Verified
                      </span>
                    </div>

                    <div className="space-y-1">
                      <h5 className="font-extrabold text-sm text-white truncate leading-snug">{formData.fullName || "Your Full Name"}</h5>
                      <p className={`text-xs ${activeThemeConfig.accent} truncate leading-tight font-semibold`}>{formData.designation || "Executive Role"}</p>
                    </div>

                    <div className="pt-2 border-t border-white/10 space-y-1.5 text-xs text-slate-300 font-medium">
                      <div className="flex items-center gap-2 truncate">
                        <Building2 className={`h-3.5 w-3.5 ${activeThemeConfig.accent} shrink-0`} />
                        <span className="truncate">{formData.companyName || "Enterprise Name"}</span>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className={`h-3.5 w-3.5 ${activeThemeConfig.accent} shrink-0`} />
                        <span className="truncate">{formData.location ? `${formData.location}${formData.country ? `, ${formData.country}` : ''}` : "City, Country"}</span>
                      </div>
                      {formData.website && (
                        <div className={`flex items-center gap-2 truncate ${activeThemeConfig.accent} font-mono text-[11px]`}>
                          <Globe className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{formData.website}</span>
                        </div>
                      )}
                    </div>

                    {formData.about && (
                      <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3 pt-2 border-t border-white/10">
                        {formData.about}
                      </p>
                    )}

                    {formData.industryTags && formData.industryTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2 border-t border-white/10">
                        {formData.industryTags.slice(0, 3).map((t) => (
                          <span key={t} className="px-2 py-0.5 rounded text-[9px] bg-white/10 text-white font-semibold border border-white/15">
                            {t}
                          </span>
                        ))}
                        {formData.industryTags.length > 3 && (
                          <span className={`px-2 py-0.5 rounded text-[9px] bg-indigo-950 ${activeThemeConfig.accent} font-bold border border-indigo-800`}>
                            +{formData.industryTags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Content: Credentials View */}
              {previewTab === "credentials" && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <h6 className="font-bold text-white uppercase text-[10px] tracking-wider text-slate-400">Trade KYC badging</h6>
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 font-semibold">GSTIN Tax ID</span>
                      <span className="font-mono text-indigo-300 font-bold">{formData.gstin || "Not Added"}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 font-semibold">IEC Code</span>
                      <span className="font-mono text-indigo-300 font-bold">{formData.iec || "Not Added"}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                      <span className="text-slate-400 font-semibold">AEO Status</span>
                      <span className="font-bold text-emerald-400">{formData.aeoStatus || "None"}</span>
                    </div>
                    {formData.iataNo && (
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <span className="text-slate-400 font-semibold">IATA Agent</span>
                        <span className="font-mono text-indigo-300 font-bold">{formData.iataNo}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Preview Content: Lanes & Capacity View */}
              {previewTab === "lanes" && (
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3 text-xs">
                  <h6 className="font-bold text-white uppercase text-[10px] tracking-wider text-slate-400">Capacity &amp; Network</h6>
                  <div className="space-y-2.5">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Trade Lanes</span>
                      <p className="text-indigo-300 font-semibold text-xs mt-0.5">{formData.keyTradeLanes || "Not Specified"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Fleet Asset Size</span>
                      <p className="text-white font-medium text-xs mt-0.5">{formData.fleetSize || "Not Specified"}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold block">Warehouse Space</span>
                      <p className="text-white font-medium text-xs mt-0.5">{formData.warehouseCapacity || "Not Specified"}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={showCropModal}
        imageSrc={cropImageSrc || formData.photoURL}
        onClose={() => setShowCropModal(false)}
        onSaveCrop={(cropped) => setFormData((prev) => ({ ...prev, photoURL: cropped }))}
        onRemovePicture={() => setFormData((prev) => ({ ...prev, photoURL: null }))}
      />

      {/* Unsaved Changes Prompt Modal on Esc */}
      {showUnsavedPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4">
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4 text-slate-900">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900">Save Profile Studio Changes?</h4>
            </div>
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              You pressed Esc. Would you like to save your enterprise profile studio changes before closing?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowUnsavedPrompt(false);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
              >
                Discard &amp; Close
              </button>
              <button
                type="button"
                onClick={async (e) => {
                  setShowUnsavedPrompt(false);
                  await handleFormSubmit(e as any);
                }}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md"
              >
                Save &amp; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
