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
} from "lucide-react";
import { uploadFileWithProgress } from "@/lib/firebase/storage";
import { compressAndOptimizeImage } from "@/lib/utils/imageOptimizer";

import { ImageCropModal } from "./ImageCropModal";

export type WorkExpItem = { id: string; company: string; location: string; designation: string; from: string; to: string; roleDescription?: string };
export type EduItem = { id: string; college: string; stream: string; from: string; to: string };
export type CertItem = { id: string; title: string; issuer: string; year: string };

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
  privacySetting?: "public" | "connections_only";
};

interface EnhancedProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: UserProfileForm;
  onSave: (data: UserProfileForm) => Promise<void>;
  userId: string;
}

const AVAILABLE_SPECIALIZATIONS = [
  "Ocean Freight (FCL)",
  "Ocean Freight (LCL)",
  "Air Freight Express",
  "NVOCC Services",
  "Customs House Brokerage (CHA)",
  "Project Cargo & Heavy Lift",
  "Cold Chain Logistics",
  "Warehousing & Fulfillment",
  "Cross-Border Trucking",
  "Dangerous Goods (DG Cargo)",
  "Breakbulk & Chartering",
];

export function EnhancedProfileEditModal({
  isOpen,
  onClose,
  initialData,
  onSave,
  userId,
}: EnhancedProfileEditModalProps) {
  const [activeSection, setActiveSection] = useState<"basic" | "company" | "branding" | "experience" | "education" | "tags">("basic");
  const [formData, setFormData] = useState<UserProfileForm>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [showLivePreview, setShowLivePreview] = useState(true);

  // File refs & upload progress
  const photoInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
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
    setFormData(initialData);
  }, [initialData]);

  if (!isOpen) return null;

  // Calculate Profile Completion Percentage
  const calculateCompletion = () => {
    let score = 0;
    if (formData.fullName.trim()) score += 15;
    if (formData.companyName.trim()) score += 15;
    if (formData.designation.trim()) score += 10;
    if (formData.location.trim()) score += 10;
    if (formData.about.trim()) score += 15;
    if (formData.photoURL) score += 10;
    if (formData.companyLogoURL) score += 10;
    if (formData.workExperience.length > 0) score += 10;
    if (formData.education.length > 0) score += 5;
    return Math.min(100, score);
  };

  const completionScore = calculateCompletion();

  // Photo & Logo Upload Handlers with instant compressed Data URL fallbacks
  const handlePhotoSelect = async (file: File) => {
    if (!file) return;
    setIsUploadingPhoto(true);
    try {
      // Compress image client-side to <40KB WebP and strip EXIF for high performance & privacy
      const compressedDataUrl = await compressAndOptimizeImage(file, 600, 600, 0.75);
      setFormData((prev) => ({ ...prev, photoURL: compressedDataUrl }));

      try {
        const path = `profiles/${userId}/photo_${Date.now()}`;
        const url = await uploadFileWithProgress(path, file, (p) => setPhotoProgress(Math.round(p)));
        setFormData((prev) => ({ ...prev, photoURL: url }));
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
      // Compress image client-side to <40KB WebP and strip EXIF for high performance & privacy
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
      }, 1500);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto text-left">
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoSelect(f); }}
      />
      <input
        ref={logoInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleLogoSelect(f); }}
      />

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-left">
        {/* Top Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--fr8x-periwinkle)]/20 rounded-xl text-[var(--fr8x-periwinkle)]">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Enterprise Profile Studio</h2>
              <p className="text-xs text-slate-400">Configure your B2B enterprise identity &amp; trade credentials</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Eye className="h-4 w-4 text-[var(--fr8x-periwinkle)]" />
              {showLivePreview ? "Hide Live Preview" : "Show Live Preview"}
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Completion Progress Bar */}
        <div className="bg-slate-50 px-6 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span className="font-semibold text-slate-700">Profile Strength:</span>
            <span className="font-bold text-emerald-700">{completionScore}% Complete</span>
          </div>
          <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${completionScore}%` }} />
          </div>
        </div>

        {/* Main Body with Sidebar Tabs + Form + Live Preview */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[480px]">
          {/* Navigation Sidebar */}
          <div className="w-full lg:w-64 bg-slate-50 border-r border-slate-200 p-3 space-y-1 overflow-y-auto">
            {[
              { id: "basic", label: "Basic Info", icon: User },
              { id: "company", label: "Company & Compliance", icon: Building2 },
              { id: "branding", label: "Logo & Avatar", icon: Camera },
              { id: "experience", label: "Work Experience", icon: Briefcase },
              { id: "education", label: "Education & Certs", icon: GraduationCap },
              { id: "tags", label: "Specializations", icon: Tag },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveSection(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-semibold text-xs transition-all text-left ${
                    isActive
                      ? "bg-[var(--fr8x-periwinkle)] text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Controls Content */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-white">
            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* TAB 1: BASIC INFO */}
              {activeSection === "basic" && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-2">Personal &amp; Contact Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="fr8x-label block mb-1">Full Name</label>
                      <input
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        placeholder="e.g. Rajat Kumar Rai"
                        className="fr8x-input"
                      />
                    </div>
                    <div>
                      <label className="fr8x-label block mb-1">Professional Designation</label>
                      <input
                        value={formData.designation}
                        onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                        placeholder="e.g. Managing Director / Head of Ocean Freight"
                        className="fr8x-input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="fr8x-label block mb-1">City / Location</label>
                      <input
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="e.g. Mumbai"
                        className="fr8x-input"
                      />
                    </div>
                    <div>
                      <label className="fr8x-label block mb-1">Country</label>
                      <input
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        placeholder="e.g. India"
                        className="fr8x-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="fr8x-label block mb-1">About / Executive Bio</label>
                    <textarea
                      value={formData.about}
                      onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                      rows={4}
                      placeholder="Brief summary of your logistics expertise and enterprise solutions..."
                      className="fr8x-input resize-none"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: COMPANY & COMPLIANCE */}
              {activeSection === "company" && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-2">Company Information &amp; Trade Licenses</h3>
                  <div>
                    <label className="fr8x-label block mb-1">Registered Enterprise Name</label>
                    <input
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      placeholder="e.g. Rai Vega Logistics Private Limited"
                      className="fr8x-input"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="fr8x-label block mb-1">GSTIN / Corporate Reg. No.</label>
                      <input
                        value={formData.gstin || ""}
                        onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
                        placeholder="e.g. 27AAAAA0000A1Z5"
                        className="fr8x-input font-mono"
                      />
                    </div>
                    <div>
                      <label className="fr8x-label block mb-1">Import Export Code (IEC)</label>
                      <input
                        value={formData.iec || ""}
                        onChange={(e) => setFormData({ ...formData, iec: e.target.value })}
                        placeholder="e.g. 0512345678"
                        className="fr8x-input font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="fr8x-label block mb-1">Official Website URL</label>
                    <input
                      value={formData.website || ""}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      placeholder="e.g. https://www.raivega.in"
                      className="fr8x-input"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: LOGO & AVATAR BRANDING */}
              {activeSection === "branding" && (
                <div className="space-y-5">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-2">Enterprise Branding &amp; Visual Identity</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Photo Uploader */}
                    <div className="p-4 border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-3 bg-slate-50/50">
                      <h4 className="font-bold text-sm text-slate-800">Profile Avatar Photo</h4>
                      <div className="relative w-24 h-24 mx-auto rounded-full bg-slate-200 border-2 border-white shadow-md overflow-hidden flex items-center justify-center">
                        {formData.photoURL ? (
                          <img src={formData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-10 w-10 text-slate-400" />
                        )}
                        {isUploadingPhoto && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold">
                            {photoProgress}%
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        className="fr8x-btn-secondary w-full flex items-center justify-center gap-1.5"
                      >
                        <Upload className="h-4 w-4" /> Upload Avatar Photo
                      </button>
                    </div>

                    {/* Logo Uploader */}
                    <div className="p-4 border-2 border-dashed border-slate-300 rounded-2xl text-center space-y-3 bg-slate-50/50">
                      <h4 className="font-bold text-sm text-slate-800">Company Logo Banner</h4>
                      <div className="relative w-24 h-24 mx-auto rounded-2xl bg-slate-900 border-2 border-white shadow-md overflow-hidden flex items-center justify-center p-2">
                        {formData.companyLogoURL ? (
                          <img src={formData.companyLogoURL} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <Building2 className="h-10 w-10 text-[var(--fr8x-periwinkle)]" />
                        )}
                        {isUploadingLogo && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-xs font-bold">
                            {logoProgress}%
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => logoInputRef.current?.click()}
                        className="fr8x-btn-secondary w-full flex items-center justify-center gap-1.5"
                      >
                        <Upload className="h-4 w-4" /> Upload Company Logo
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: WORK EXPERIENCE */}
              {activeSection === "experience" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-base font-bold text-slate-900">Work Experience Timeline</h3>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          workExperience: [
                            ...formData.workExperience,
                            { id: `we_${Date.now()}`, company: "", location: "", designation: "", from: "", to: "" },
                          ],
                        })
                      }
                      className="fr8x-btn-primary flex items-center gap-1 text-xs"
                    >
                      <Plus className="h-4 w-4" /> Add Experience
                    </button>
                  </div>

                  {formData.workExperience.length === 0 && (
                    <p className="text-xs text-slate-400 py-4 text-center">No work experience added yet. Click &quot;Add Experience&quot; above.</p>
                  )}

                  <div className="space-y-3">
                    {formData.workExperience.map((we) => (
                      <div key={we.id} className="p-4 border border-slate-200 bg-slate-50 rounded-xl space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            value={we.company}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                workExperience: formData.workExperience.map((item) => (item.id === we.id ? { ...item, company: e.target.value } : item)),
                              })
                            }
                            placeholder="Company Name"
                            className="fr8x-input"
                          />
                          <input
                            value={we.designation}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                workExperience: formData.workExperience.map((item) => (item.id === we.id ? { ...item, designation: e.target.value } : item)),
                              })
                            }
                            placeholder="Designation / Role"
                            className="fr8x-input"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <input
                            value={we.location}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                workExperience: formData.workExperience.map((item) => (item.id === we.id ? { ...item, location: e.target.value } : item)),
                              })
                            }
                            placeholder="Location"
                            className="fr8x-input"
                          />
                          <input
                            value={we.from}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                workExperience: formData.workExperience.map((item) => (item.id === we.id ? { ...item, from: e.target.value } : item)),
                              })
                            }
                            placeholder="From (e.g. 2019)"
                            className="fr8x-input"
                          />
                          <input
                            value={we.to}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                workExperience: formData.workExperience.map((item) => (item.id === we.id ? { ...item, to: e.target.value } : item)),
                              })
                            }
                            placeholder="To (e.g. Present)"
                            className="fr8x-input"
                          />
                        </div>
                        <div>
                          <textarea
                            value={we.roleDescription || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                workExperience: formData.workExperience.map((item) => (item.id === we.id ? { ...item, roleDescription: e.target.value } : item)),
                              })
                            }
                            placeholder="Detailed job profile & key responsibilities (e.g. Managed ocean freight rate negotiations, handled customs clearance for Asia-Europe lanes)..."
                            rows={2}
                            className="fr8x-input text-[11px] resize-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, workExperience: formData.workExperience.filter((item) => item.id !== we.id) })}
                          className="text-rose-600 hover:underline text-xs font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove Position
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: EDUCATION */}
              {activeSection === "education" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="text-base font-bold text-slate-900">Education &amp; Academic Credentials</h3>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          education: [
                            ...formData.education,
                            { id: `edu_${Date.now()}`, college: "", stream: "", from: "", to: "" },
                          ],
                        })
                      }
                      className="fr8x-btn-primary flex items-center gap-1 text-xs"
                    >
                      <Plus className="h-4 w-4" /> Add Education
                    </button>
                  </div>

                  {formData.education.length === 0 && (
                    <p className="text-xs text-slate-400 py-4 text-center">No education records added yet.</p>
                  )}

                  <div className="space-y-3">
                    {formData.education.map((edu) => (
                      <div key={edu.id} className="p-4 border border-slate-200 bg-slate-50 rounded-xl space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            value={edu.college}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                education: formData.education.map((item) => (item.id === edu.id ? { ...item, college: e.target.value } : item)),
                              })
                            }
                            placeholder="University / College"
                            className="fr8x-input"
                          />
                          <input
                            value={edu.stream}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                education: formData.education.map((item) => (item.id === edu.id ? { ...item, stream: e.target.value } : item)),
                              })
                            }
                            placeholder="Degree / Stream (e.g. B.Tech Logistics)"
                            className="fr8x-input"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            value={edu.from}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                education: formData.education.map((item) => (item.id === edu.id ? { ...item, from: e.target.value } : item)),
                              })
                            }
                            placeholder="From (Year)"
                            className="fr8x-input"
                          />
                          <input
                            value={edu.to}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                education: formData.education.map((item) => (item.id === edu.id ? { ...item, to: e.target.value } : item)),
                              })
                            }
                            placeholder="To (Year)"
                            className="fr8x-input"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, education: formData.education.filter((item) => item.id !== edu.id) })}
                          className="text-rose-600 hover:underline text-xs font-semibold flex items-center gap-1"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Remove Education
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: SPECIALIZATION TAGS */}
              {activeSection === "tags" && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b pb-2">Logistics Specializations &amp; Service Tags</h3>
                  <p className="text-xs text-slate-500">Select all trade capabilities that apply to your enterprise offerings:</p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {AVAILABLE_SPECIALIZATIONS.map((spec) => {
                      const selected = formData.industryTags.includes(spec);
                      return (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => toggleTag(spec)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                            selected
                              ? "bg-[var(--fr8x-periwinkle)] text-white border-[var(--fr8x-periwinkle)] shadow-sm"
                              : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                          }`}
                        >
                          {selected && <CheckCircle2 className="h-3.5 w-3.5" />}
                          {spec}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="fr8x-btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isSavedState}
                  className={`fr8x-btn-primary flex items-center gap-2 px-5 py-2 transition-all ${
                    isSavedState ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                  }`}
                >
                  {isSaving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isSavedState ? (
                    <CheckCircle2 className="h-4 w-4 text-white" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{isSavedState ? "Saved" : "Save Profile"}</span>
                </button>
              </div>
            </form>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
              <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl space-y-3">
                <h4 className="text-body-md font-bold text-slate-900">Save Unsaved Changes?</h4>
                <p className="text-caption text-slate-600">
                  You pressed Esc. Would you like to save your profile changes before closing?
                </p>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => {
                      setShowUnsavedPrompt(false);
                      onClose();
                    }}
                    className="fr8x-btn-secondary text-[11px] px-3 py-1.5"
                  >
                    Discard & Close
                  </button>
                  <button
                    onClick={async (e) => {
                      setShowUnsavedPrompt(false);
                      await handleFormSubmit(e as any);
                    }}
                    className="fr8x-btn-primary text-[11px] px-4 py-1.5"
                  >
                    Save & Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Side-by-Side Live Card Preview */}
          {showLivePreview && (
            <div className="w-full lg:w-80 bg-slate-900 text-white p-5 border-l border-slate-800 space-y-4 overflow-y-auto">
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-400 flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-[var(--fr8x-periwinkle)]" /> Real-Time B2B Preview
              </h4>

              {/* Preview Card */}
              <div className="bg-slate-800 rounded-2xl border border-slate-700 p-4 space-y-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-[var(--fr8x-periwinkle)]/20 flex items-center justify-center font-bold text-xl text-[var(--fr8x-periwinkle)] overflow-hidden border border-slate-600 shrink-0">
                    {formData.photoURL ? (
                      <img src={formData.photoURL} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      formData.fullName.charAt(0) || "U"
                    )}
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-white truncate max-w-[150px]">{formData.fullName || "Your Full Name"}</h5>
                    <p className="text-xs text-slate-400 truncate max-w-[150px]">{formData.designation || "Designation"}</p>
                    <span className="text-[10px] text-[var(--fr8x-periwinkle)] font-mono">{formData.publicId || "@USER"}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-700 space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-bold text-white truncate">{formData.companyName || "Company Name"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{formData.location ? `${formData.location}, ${formData.country}` : "Location"}</span>
                  </div>
                </div>

                {formData.about && (
                  <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3 pt-1 border-t border-slate-700/60">
                    {formData.about}
                  </p>
                )}

                {formData.industryTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2">
                    {formData.industryTags.slice(0, 3).map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded text-[9px] bg-slate-700 text-slate-200 font-semibold">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
