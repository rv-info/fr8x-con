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
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto text-left">
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

      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden text-left">
        {/* Top Header - Light Enterprise Theme */}
        <div className="px-6 py-4 bg-white text-slate-900 flex items-center justify-between border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[var(--fr8x-periwinkle)]/15 rounded-xl text-[var(--fr8x-periwinkle)] border border-[var(--fr8x-periwinkle)]/20">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 leading-snug">Enterprise Profile Studio</h2>
              <p className="text-xs text-slate-500 font-medium">Configure your B2B enterprise identity &amp; trade credentials</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 border border-slate-200 transition-colors"
            >
              <Eye className="h-4.5 w-4.5 text-[var(--fr8x-periwinkle)]" />
              {showLivePreview ? "Hide Live Preview" : "Show Live Preview"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-xl transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Completion Progress Bar */}
        <div className="bg-slate-50/80 px-6 py-2.5 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
            <span className="font-semibold text-slate-700">Profile Strength:</span>
            <span className="font-bold text-emerald-700">{completionScore}% Complete</span>
          </div>
          <div className="w-52 h-2.5 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${completionScore}%` }} />
          </div>
        </div>

        {/* Main Body with Navigation Sidebar + Form Controls + Live Preview */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-[500px]">
          {/* Navigation Sidebar */}
          <div className="w-full lg:w-64 bg-slate-50/70 border-r border-slate-200 p-3 space-y-1.5 overflow-y-auto">
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-xs sm:text-sm transition-all text-left ${
                    isActive
                      ? "bg-[var(--fr8x-periwinkle)] text-white shadow-sm font-bold"
                      : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0 text-current" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Form Controls Content */}
          <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-white">
            <form onSubmit={handleFormSubmit} className="space-y-5">
              {/* TAB 1: BASIC INFO */}
              {activeSection === "basic" && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2.5">Personal &amp; Contact Details</h3>
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
                  <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2.5">Company Information &amp; Trade Licenses</h3>
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
                  <div className="border-b border-slate-200 pb-2.5">
                    <h3 className="text-base font-bold text-slate-900">Enterprise Branding &amp; Visual Identity</h3>
                    <p className="text-xs text-slate-500 font-medium">Upload, crop, zoom, or remove custom logo and avatar images for your enterprise profile.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Photo Uploader */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handlePhotoSelect(file);
                      }}
                      className="p-5 border-2 border-dashed border-slate-200 hover:border-[var(--fr8x-periwinkle)] rounded-2xl text-center space-y-3.5 bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-800">Profile Avatar Photo</h4>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${formData.photoURL ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                          {formData.photoURL ? 'Image Active' : 'Blank / Default'}
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
                        className="relative w-28 h-28 mx-auto rounded-full bg-slate-100 border-2 border-slate-200 shadow-md overflow-hidden flex items-center justify-center group cursor-pointer hover:border-[var(--fr8x-periwinkle)] transition-all"
                        title={formData.photoURL ? "Click to crop/adjust image" : "Click to upload image"}
                      >
                        {formData.photoURL ? (
                          <img src={formData.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="h-12 w-12 text-slate-400" />
                        )}
                        {isUploadingPhoto && (
                          <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white text-xs font-bold">
                            <Loader2 className="h-5 w-5 animate-spin mb-1 text-white" />
                            {photoProgress}%
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                          {formData.photoURL ? "Crop / Adjust" : "Upload"}
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 font-medium">
                        Drag &amp; drop profile picture here or click below (PNG, JPG, WebP)
                      </p>

                      <div className="space-y-2 pt-1">
                        <button
                          type="button"
                          onClick={() => photoInputRef.current?.click()}
                          className="fr8x-btn-secondary w-full flex items-center justify-center gap-2 text-xs py-2 font-bold"
                        >
                          <Upload className="h-4.5 w-4.5 text-slate-500" /> {formData.photoURL ? "Change Avatar Photo" : "Upload Avatar Photo"}
                        </button>

                        {formData.photoURL && (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCropImageSrc(formData.photoURL);
                                setShowCropModal(true);
                              }}
                              className="flex-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                            >
                              <Crop className="h-4 w-4 text-[var(--fr8x-periwinkle)]" /> Crop &amp; Zoom
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData((prev) => ({ ...prev, photoURL: null }))}
                              className="flex-1 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
                              title="Delete avatar image"
                            >
                              <Trash2 className="h-4 w-4 text-rose-600" /> Remove Image
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Logo Uploader */}
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const file = e.dataTransfer.files?.[0];
                        if (file) handleLogoSelect(file);
                      }}
                      className="p-5 border-2 border-dashed border-slate-200 hover:border-[var(--fr8x-periwinkle)] rounded-2xl text-center space-y-3.5 bg-slate-50/70 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-sm text-slate-800">Company Logo Banner</h4>
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${formData.companyLogoURL ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-200 text-slate-600 border-slate-300'}`}>
                          {formData.companyLogoURL ? 'Logo Active' : 'Blank / Default'}
                        </span>
                      </div>

                      <div
                        onClick={() => logoInputRef.current?.click()}
                        className="relative w-28 h-28 mx-auto rounded-2xl bg-slate-100 border-2 border-slate-200 shadow-md overflow-hidden flex items-center justify-center p-2 group cursor-pointer hover:border-[var(--fr8x-periwinkle)] transition-all"
                        title="Click to upload company logo"
                      >
                        {formData.companyLogoURL ? (
                          <img src={formData.companyLogoURL} alt="Logo" className="w-full h-full object-contain" />
                        ) : (
                          <Building2 className="h-12 w-12 text-[var(--fr8x-periwinkle)]" />
                        )}
                        {isUploadingLogo && (
                          <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white text-xs font-bold">
                            <Loader2 className="h-5 w-5 animate-spin mb-1 text-white" />
                            {logoProgress}%
                          </div>
                        )}
                        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity">
                          Upload Logo
                        </div>
                      </div>

                      <p className="text-[11px] text-slate-500 font-medium">
                        Drag &amp; drop company logo here or click below
                      </p>

                      <div className="space-y-2 pt-1">
                        <button
                          type="button"
                          onClick={() => logoInputRef.current?.click()}
                          className="fr8x-btn-secondary w-full flex items-center justify-center gap-2 text-xs py-2 font-bold"
                        >
                          <Upload className="h-4.5 w-4.5 text-slate-500" /> {formData.companyLogoURL ? "Change Company Logo" : "Upload Company Logo"}
                        </button>

                        {formData.companyLogoURL && (
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, companyLogoURL: null }))}
                            className="w-full bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors"
                            title="Delete logo image"
                          >
                            <Trash2 className="h-4 w-4 text-rose-600" /> Remove Logo Image
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: WORK EXPERIENCE */}
              {activeSection === "experience" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
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
                      className="fr8x-btn-primary flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl"
                    >
                      <Plus className="h-4 w-4" /> Add Experience
                    </button>
                  </div>

                  {formData.workExperience.length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center">No work experience added yet. Click &quot;Add Experience&quot; above.</p>
                  )}

                  <div className="space-y-3">
                    {formData.workExperience.map((we) => (
                      <div key={we.id} className="p-4 border border-slate-200 bg-slate-50/70 rounded-xl space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                            placeholder="Detailed job profile & key responsibilities..."
                            rows={2}
                            className="fr8x-input text-xs resize-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, workExperience: formData.workExperience.filter((item) => item.id !== we.id) })}
                          className="text-rose-600 hover:text-rose-800 text-xs font-semibold flex items-center gap-1.5 pt-1"
                        >
                          <Trash2 className="h-4 w-4" /> Remove Position
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 5: EDUCATION */}
              {activeSection === "education" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
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
                      className="fr8x-btn-primary flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl"
                    >
                      <Plus className="h-4 w-4" /> Add Education
                    </button>
                  </div>

                  {formData.education.length === 0 && (
                    <p className="text-xs text-slate-400 py-6 text-center">No education records added yet.</p>
                  )}

                  <div className="space-y-3">
                    {formData.education.map((edu) => (
                      <div key={edu.id} className="p-4 border border-slate-200 bg-slate-50/70 rounded-xl space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                          className="text-rose-600 hover:text-rose-800 text-xs font-semibold flex items-center gap-1.5 pt-1"
                        >
                          <Trash2 className="h-4 w-4" /> Remove Education
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 6: SPECIALIZATION TAGS */}
              {activeSection === "tags" && (
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 border-b border-slate-200 pb-2.5">Logistics Specializations &amp; Service Tags</h3>
                  <p className="text-xs text-slate-500 font-medium">Select all trade capabilities that apply to your enterprise offerings:</p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {AVAILABLE_SPECIALIZATIONS.map((spec) => {
                      const selected = formData.industryTags.includes(spec);
                      return (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => toggleTag(spec)}
                          className={`px-4 py-2 rounded-full text-xs font-semibold border transition-all flex items-center gap-2 ${
                            selected
                              ? "bg-[var(--fr8x-periwinkle)] text-white border-[var(--fr8x-periwinkle)] shadow-sm font-bold"
                              : "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200"
                          }`}
                        >
                          {selected && <CheckCircle2 className="h-4 w-4" />}
                          {spec}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button type="button" onClick={onClose} className="fr8x-btn-secondary text-xs px-5 py-2 font-bold">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isSavedState}
                  className={`fr8x-btn-primary text-xs flex items-center gap-2 px-6 py-2 transition-all font-bold shadow-sm ${
                    isSavedState ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""
                  }`}
                >
                  {isSaving ? (
                    <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  ) : isSavedState ? (
                    <CheckCircle2 className="h-4.5 w-4.5 text-white" />
                  ) : (
                    <Save className="h-4.5 w-4.5" />
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
                <h4 className="text-base font-bold text-slate-900">Save Unsaved Changes?</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  You pressed Esc. Would you like to save your profile changes before closing?
                </p>
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUnsavedPrompt(false);
                      onClose();
                    }}
                    className="fr8x-btn-secondary text-xs px-4 py-2"
                  >
                    Discard &amp; Close
                  </button>
                  <button
                    type="button"
                    onClick={async (e) => {
                      setShowUnsavedPrompt(false);
                      await handleFormSubmit(e as any);
                    }}
                    className="fr8x-btn-primary text-xs px-5 py-2 font-bold"
                  >
                    Save &amp; Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Side-by-Side Live Card Preview - Light Enterprise Theme */}
          {showLivePreview && (
            <div className="w-full lg:w-80 bg-slate-50/80 text-slate-900 p-5 border-l border-slate-200 space-y-4 overflow-y-auto">
              <h4 className="text-xs uppercase tracking-wider font-bold text-slate-500 flex items-center gap-2">
                <Eye className="h-4.5 w-4.5 text-[var(--fr8x-periwinkle)]" /> Real-Time B2B Preview
              </h4>

              {/* Light Card Preview */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3.5 shadow-md text-slate-900">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-[var(--fr8x-periwinkle)]/15 border border-[var(--fr8x-periwinkle)]/30 flex items-center justify-center font-bold text-xl text-[var(--fr8x-periwinkle)] overflow-hidden shrink-0 shadow-xs">
                    {formData.photoURL ? (
                      <img src={formData.photoURL} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      formData.fullName.charAt(0) || "U"
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <h5 className="font-bold text-sm text-slate-900 truncate leading-snug">{formData.fullName || "Your Full Name"}</h5>
                    <p className="text-xs text-slate-500 truncate leading-tight font-medium">{formData.designation || "Designation"}</p>
                    <span className="text-[11px] font-mono text-[var(--fr8x-periwinkle)] font-semibold truncate block mt-0.5">{formData.publicId || "@USER"}</span>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0 text-slate-800 font-semibold">
                    <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="truncate">{formData.companyName || "Company Name"}</span>
                  </div>
                  <div className="flex items-center gap-2 min-w-0 text-slate-600 font-medium">
                    <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                    <span className="truncate">{formData.location ? `${formData.location}${formData.country ? `, ${formData.country}` : ''}` : "Location"}</span>
                  </div>
                </div>

                {formData.about && (
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 pt-2 border-t border-slate-100">
                    {formData.about}
                  </p>
                )}

                {formData.industryTags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                    {formData.industryTags.slice(0, 3).map((t) => (
                      <span key={t} className="px-2.5 py-1 rounded-md text-[10px] bg-slate-100 text-slate-700 font-semibold border border-slate-200">
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
